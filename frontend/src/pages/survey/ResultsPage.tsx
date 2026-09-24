import { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, LineChart, Lightbulb, Shield, Crown, Sparkles, User, Rocket, Compass } from 'lucide-react';

interface AiFeedbackResult {
  conocimientoGeneral: number;
  usoHerramientas: number;
  identificacionOportunidades: number;
  usoResponsable: number;
  disposicionImpulsar: number;
}

interface ResultsData {
  overallScore: number | null;
  range: 'EXPLORADOR' | 'USUARIO' | 'IMPULSOR' | 'EMBAJADOR' | null;
  description: string;
  aiFeedback: AiFeedbackResult | null;
}

export default function ResultsPage() {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get('http://localhost:3000/survey/results', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (err) {
        const error = err as any;
        if (error.response?.status === 404) {
          setError('Aún no has completado la evaluación.');
        } else {
          setError('Ocurrió un error al cargar los resultados.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-[#00D7D0] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Analizando tus respuestas con IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-red-400 text-lg">{error}</p>
        <button 
          onClick={() => window.location.href = '/survey'}
          className="px-6 py-2 bg-[#00D7D0] text-black font-bold rounded-lg hover:bg-[#00b5af] transition-colors"
        >
          Ir a la evaluación
        </button>
      </div>
    );
  }

  if (!data || data.overallScore === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-gray-400 text-lg">No hay datos suficientes para mostrar resultados.</p>
      </div>
    );
  }

  // Helper functions for UI
  const getRangeIcon = (range: string | null) => {
    switch (range) {
      case 'EXPLORADOR': return <Compass className="w-12 h-12 text-orange-400" />;
      case 'USUARIO': return <User className="w-12 h-12 text-blue-400" />;
      case 'IMPULSOR': return <Rocket className="w-12 h-12 text-green-400" />;
      case 'EMBAJADOR': return <Crown className="w-12 h-12 text-yellow-400" />;
      default: return <Sparkles className="w-12 h-12 text-white" />;
    }
  };

  const getRangeColorText = (range: string | null) => {
    switch (range) {
      case 'EXPLORADOR': return 'text-orange-400';
      case 'USUARIO': return 'text-blue-400';
      case 'IMPULSOR': return 'text-green-400';
      case 'EMBAJADOR': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  const score = data.overallScore || 0;
  
  // Default AI values in case it failed or is loading
  const ai = data.aiFeedback || {
    conocimientoGeneral: 0,
    usoHerramientas: 0,
    identificacionOportunidades: 0,
    usoResponsable: 0,
    disposicionImpulsar: 0
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in pb-20">
      
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-8">
        
        {/* LEFT COLUMN: Rank & Thermometer */}
        <div className="flex flex-col gap-8">
          
          {/* Header Rank Card */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Tu rango es</p>
            <div className="flex items-center gap-6">
              <div className="bg-[#2a2a2a] p-4 rounded-2xl">
                {getRangeIcon(data.range)}
              </div>
              <div>
                <h2 className={`text-4xl font-display font-black mb-1 ${getRangeColorText(data.range)}`}>
                  {data.range}
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {data.description}
                </p>
              </div>
            </div>
          </div>

          {/* Thermometer Visual */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-lg flex items-center justify-center relative min-h-[400px]">
            <p className="absolute top-4 left-4 text-gray-400 font-bold text-sm uppercase">Medidor Global</p>
            
            <div className="flex items-end gap-8 h-[300px]">
              
              {/* Thermometer Bar */}
              <div className="w-24 h-full bg-[#2a2a2a] rounded-full relative border-4 border-[#333] overflow-hidden flex items-end">
                {/* Liquid Fill */}
                <div 
                  className="w-full bg-gradient-to-t from-orange-500 via-yellow-400 to-[#00D7D0] transition-all duration-1000 ease-out"
                  style={{ height: `${score}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-1/3 rounded-full ml-2"></div>
                </div>
                {/* Glass reflections */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none"></div>
              </div>

              {/* Threshold Labels */}
              <div className="flex flex-col justify-between h-full py-4 relative">
                
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-[2px] ${score >= 75 ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                  <div>
                    <p className={`font-bold ${score >= 75 ? 'text-yellow-400' : 'text-gray-500'}`}>EMBAJADOR</p>
                    <p className="text-xs text-gray-500">Referente</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-4 h-[2px] ${score >= 50 && score < 75 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                  <div>
                    <p className={`font-bold ${score >= 50 && score < 75 ? 'text-green-400' : 'text-gray-500'}`}>IMPULSOR</p>
                    <p className="text-xs text-gray-500">Avanzado</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-4 h-[2px] ${score >= 25 && score < 50 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                  <div>
                    <p className={`font-bold ${score >= 25 && score < 50 ? 'text-blue-400' : 'text-gray-500'}`}>USUARIO</p>
                    <p className="text-xs text-gray-500">Intermedio</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-4 h-[2px] ${score < 25 ? 'bg-orange-400' : 'bg-gray-600'}`}></div>
                  <div>
                    <p className={`font-bold ${score < 25 ? 'text-orange-400' : 'text-gray-500'}`}>EXPLORADOR</p>
                    <p className="text-xs text-gray-500">Básico</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: AI Progress Bars */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-lg flex flex-col h-full">
          <div className="mb-8">
            <h3 className="text-2xl font-display font-bold text-white">Tu perfil de competencias</h3>
            <p className="text-gray-400 text-sm mt-2">Analizado por Inteligencia Artificial basado en tus respuestas detalladas.</p>
          </div>

          <div className="flex flex-col gap-8">
            
            {/* Row 1 */}
            <div className="flex items-center gap-4">
              <div className="bg-purple-900/30 p-3 rounded-full">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">Conocimiento general</span>
                  <span className="text-purple-400 font-bold">{ai.conocimientoGeneral}%</span>
                </div>
                <div className="h-3 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${ai.conocimientoGeneral}%` }}></div>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-4">
              <div className="bg-blue-900/30 p-3 rounded-full">
                <LineChart className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">Uso de herramientas</span>
                  <span className="text-blue-400 font-bold">{ai.usoHerramientas}%</span>
                </div>
                <div className="h-3 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${ai.usoHerramientas}%` }}></div>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex items-center gap-4">
              <div className="bg-green-900/30 p-3 rounded-full">
                <Lightbulb className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">Identificación de oportunidades</span>
                  <span className="text-green-400 font-bold">{ai.identificacionOportunidades}%</span>
                </div>
                <div className="h-3 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${ai.identificacionOportunidades}%` }}></div>
                </div>
              </div>
            </div>

            {/* Row 4 */}
            <div className="flex items-center gap-4">
              <div className="bg-orange-900/30 p-3 rounded-full">
                <Shield className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">Uso responsable</span>
                  <span className="text-orange-400 font-bold">{ai.usoResponsable}%</span>
                </div>
                <div className="h-3 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${ai.usoResponsable}%` }}></div>
                </div>
              </div>
            </div>

            {/* Row 5 */}
            <div className="flex items-center gap-4">
              <div className="bg-pink-900/30 p-3 rounded-full">
                <Crown className="w-6 h-6 text-pink-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">Disposición para impulsar</span>
                  <span className="text-pink-400 font-bold">{ai.disposicionImpulsar}%</span>
                </div>
                <div className="h-3 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full transition-all duration-1000" style={{ width: `${ai.disposicionImpulsar}%` }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
