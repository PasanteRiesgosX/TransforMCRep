import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AiFeedbackResult {
  conocimientoGeneral: number;
  usoHerramientas: number;
  identificacionOportunidades: number;
  usoResponsable: number;
  disposicionImpulsar: number;
}

@Injectable()
export class AiFeedbackService {
  private readonly logger = new Logger(AiFeedbackService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY is not defined. AI Feedback will return default values.');
    }
  }

  async generateFeedback(payloadJson: string): Promise<AiFeedbackResult> {
    const defaultResult: AiFeedbackResult = {
      conocimientoGeneral: 0,
      usoHerramientas: 0,
      identificacionOportunidades: 0,
      usoResponsable: 0,
      disposicionImpulsar: 0,
    };

    if (!this.genAI) return defaultResult;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const prompt = `
Actúa como un evaluador experto de competencias tecnológicas. Analiza el siguiente JSON que contiene las respuestas de un usuario a una encuesta de evaluación:

${payloadJson}

En base a las preguntas (questionText) y las respuestas seleccionadas (selectedOptionText o el valor de respuesta numérico), evalúa al usuario en estas 5 áreas específicas, dándole a cada una un porcentaje exacto de 0 a 100:

1. conocimientoGeneral (Conocimiento general de los temas)
2. usoHerramientas (Capacidad y frecuencia de uso de herramientas descritas)
3. identificacionOportunidades (Habilidad para detectar oportunidades de mejora)
4. usoResponsable (Ética y uso responsable de las tecnologías)
5. disposicionImpulsar (Motivación y proactividad para impulsar iniciativas)

Debes retornar EXCLUSIVAMENTE un objeto JSON válido con esta estructura exacta (los valores deben ser números enteros entre 0 y 100):
{
  "conocimientoGeneral": 80,
  "usoHerramientas": 65,
  "identificacionOportunidades": 70,
  "usoResponsable": 90,
  "disposicionImpulsar": 85
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed = JSON.parse(text) as AiFeedbackResult;
      
      return {
        conocimientoGeneral: parsed.conocimientoGeneral || 0,
        usoHerramientas: parsed.usoHerramientas || 0,
        identificacionOportunidades: parsed.identificacionOportunidades || 0,
        usoResponsable: parsed.usoResponsable || 0,
        disposicionImpulsar: parsed.disposicionImpulsar || 0,
      };

    } catch (error) {
      this.logger.error('Error generating AI feedback', error);
      return defaultResult;
    }
  }
}
