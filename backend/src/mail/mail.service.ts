import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationCode(email: string, code: string) {
    // 1. Mostrar en consola para desarrollo rápido y pruebas
    this.logger.log(`====================================================`);
    this.logger.log(`[CÓDIGO DE VERIFICACIÓN 2FA]`);
    this.logger.log(`Destinatario: ${email}`);
    this.logger.log(`Código de 6 dígitos: ${code}`);
    this.logger.log(`Validez: 15 minutos`);
    this.logger.log(`====================================================`);

    // 2. Intentar el envío vía SMTP si el servidor de correo está activo
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Tu código de verificación de 6 dígitos - TransformMC AI',
        text: `Tu código de verificación para iniciar sesión en la plataforma TransformMC AI es: ${code}. Este código vencerá en 15 minutos.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4f46e5;">TransformMC AI - Verificación de Seguridad</h2>
            <p>Has solicitado iniciar sesión en la plataforma de encuestas sobre Inteligencia Artificial.</p>
            <p>Utiliza el siguiente código de 6 dígitos para completar tu inicio de sesión:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1f2937; margin: 20px 0;">
              ${code}
            </div>
            <p style="font-size: 14px; color: #6b7280;">Este código es válido por <strong>15 minutos</strong>. Si no solicitaste este acceso, puedes ignorar este mensaje.</p>
          </div>
        `,
      });
      this.logger.log(`Correo enviado exitosamente a ${email}`);
    } catch (error: any) {
      this.logger.warn(
        `No se pudo enviar el correo vía SMTP (${error?.message || error}). El código queda registrado en los logs del servidor para pruebas.`,
      );
    }
  }
}
