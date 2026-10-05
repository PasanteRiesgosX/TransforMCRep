import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Compass, User, Rocket, Crown, Sparkles, Lightbulb, PenTool, Zap, Palette, Code } from 'lucide-react';
import logo2 from '../../assets/img/logo_2.png';
import logoCanva from '../../assets/img/logosIA/canva-icon-logo.svg';
import logoChatGPT from '../../assets/img/logosIA/chatgpt.svg';
import logoClaude from '../../assets/img/logosIA/claude-icon-logo.svg';
import logoCopilot from '../../assets/img/logosIA/copilot-ai-icon-logo.svg';
import logoCursor from '../../assets/img/logosIA/cursor-ai-code-icon.svg';
import logoGemini from '../../assets/img/logosIA/gemini-logo.svg';
import logoPowerAutomate from '../../assets/img/logosIA/Microsoft_Power_Automate.svg.webp';
import logoN8n from '../../assets/img/logosIA/N8n-logo-new.svg';
import logoNotion from '../../assets/img/logosIA/Notion-logo.webp';

interface AiFeedbackResult {
  conocimientoGeneral: number;
  usoHerramientas: number;
  identificacionOportunidades: number;
  usoResponsable: number;
  disposicionImpulsar: number;
  superpoderes?: string;
  siguienteReto?: string;
}

interface ResultsData {
  overallScore: number | null;
  range: 'EXPLORADOR' | 'USUARIO' | 'IMPULSOR' | 'EMBAJADOR' | null;
  description: string;
  aiFeedback: AiFeedbackResult | null;
  aiFeedbackStatus: 'NOT_REQUESTED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

const TOOLS_BY_LEVEL: Record<string, string[]> = {
  EXPLORADOR: ['GEMINI', 'CHAT GPT', 'CANVA MAGIC'],
  USUARIO: ['CLAUDE', 'NOTION AI', 'MICROSOFT COPILOT'],
  IMPULSOR: ['CURSOR', 'ZAPIER', 'MIDJOURNEY'],
  EMBAJADOR: ['POWER AUTOMATE', 'GOOGLE STUDIO', 'N8N']
};

const TOOLS_DATA: Record<string, { url: string, logo?: string, icon?: any, colorClass?: string }> = {
  'GEMINI': { url: 'https://gemini.google.com/', logo: logoGemini },
  'CHAT GPT': { url: 'https://chat.openai.com/', logo: logoChatGPT },
  'CANVA MAGIC': { url: 'https://www.canva.com/', logo: logoCanva },
  'CLAUDE': { url: 'https://claude.ai/', logo: logoClaude },
  'NOTION AI': { url: 'https://www.notion.so/product/ai', logo: logoNotion },
  'MICROSOFT COPILOT': { url: 'https://copilot.microsoft.com/', logo: logoCopilot },
  'CURSOR': { url: 'https://cursor.sh/', logo: logoCursor },
  'ZAPIER': { url: 'https://zapier.com/', icon: Zap, colorClass: 'text-orange-500' },
  'MIDJOURNEY': { url: 'https://www.midjourney.com/', icon: Palette, colorClass: 'text-indigo-400' },
  'POWER AUTOMATE': { url: 'https://make.powerautomate.com/', logo: logoPowerAutomate },
  'GOOGLE STUDIO': { url: 'https://aistudio.google.com/', icon: Code, colorClass: 'text-blue-500' },
  'N8N': { url: 'https://n8n.io/', logo: logoN8n }
};

const PHRASES_BY_LEVEL: Record<string, string[]> = {
  EXPLORADOR: [
    'Empieza por probar un prompt sencillo.',
    'Automatiza pequeñas tareas repetitivas.',
    'Pregúntale a la IA cómo resolver dudas comunes.',
    'Explora herramientas gratuitas y pierde el miedo.',
    '¡Tu curiosidad es tu mejor aliada ahora!'
  ],
  USUARIO: [
    'Intenta combinar dos herramientas en tu trabajo.',
    'Mejora tus prompts con más contexto.',
    'Delega resúmenes de reuniones a la IA.',
    'Crea plantillas para consultas frecuentes.',
    '¡Ya tienes la base, es hora de agilizar procesos!'
  ],
  IMPULSOR: [
    'Desarrolla flujos de trabajo más complejos.',
    'Experimenta con IA generativa de imágenes o código.',
    'Integra herramientas mediante APIs sencillas.',
    'Comparte tus descubrimientos con el equipo.',
    '¡Eres un catalizador de cambio, sigue experimentando!'
  ],
  EMBAJADOR: [
    'Lidera la adopción de IA en otros departamentos.',
    'Crea soluciones personalizadas para problemas complejos.',
    'Capacita a tus compañeros en mejores prácticas.',
    'Mide el impacto real de las herramientas implementadas.',
    '¡Eres el referente que guía nuestra transformación digital!'
  ]
};

const LEVEL_NAMES: Record<string, { label: string; color: string; border: string }> = {
  EXPLORADOR: { label: 'BÁSICO', color: 'text-orange-400', border: 'border-orange-400' },
  USUARIO: { label: 'INTERMEDIO', color: 'text-blue-400', border: 'border-blue-400' },
  IMPULSOR: { label: 'AVANZADO', color: 'text-green-400', border: 'border-green-400' },
  EMBAJADOR: { label: 'REFERENTE', color: 'text-yellow-400', border: 'border-yellow-400' },
};

export default function RecommendationsPage() {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    let isActive = true;

    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await api.get('/survey/results', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isActive) {
          setData(response.data);
          setError('');
        }
      } catch (err) {
        if (isActive) {
          setError('Ocurrió un error al cargar los resultados.');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void fetchResults();
    
    return () => {
      isActive = false;
    };
  }, []);

  const getRangeIcon = (range: string | null) => {
    switch (range) {
      case 'EXPLORADOR': return <Compass className="w-16 h-16 text-orange-400 mb-2" />;
      case 'USUARIO': return <User className="w-16 h-16 text-blue-400 mb-2" />;
      case 'IMPULSOR': return <Rocket className="w-16 h-16 text-green-400 mb-2" />;
      case 'EMBAJADOR': return <Crown className="w-16 h-16 text-yellow-400 mb-2" />;
      default: return <Sparkles className="w-16 h-16 text-white mb-2" />;
    }
  };

  if (loading) {
    return <div className="flex h-[calc(100vh-64px)] items-center justify-center text-gray-400">Cargando recomendaciones...</div>;
  }

  if (error) {
    return <div className="flex h-[calc(100vh-64px)] items-center justify-center text-red-400">{error}</div>;
  }

  const rangeKey = data?.range || 'EXPLORADOR';
  const tools = TOOLS_BY_LEVEL[rangeKey] || [];
  const phrases = PHRASES_BY_LEVEL[rangeKey] || [];
  const levelInfo = LEVEL_NAMES[rangeKey] || LEVEL_NAMES['EXPLORADOR'];

  const handleMascotClick = () => {
    setClickCount((prev) => (prev + 1) % phrases.length);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-full flex flex-col gap-6">
      
      {/* Top Section: Grid 1/3 and 2/3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Section: User Rank & Siguiente Reto */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">TU RANGO ES</h2>
            {getRangeIcon(rangeKey)}
            <h3 className={`text-3xl font-extrabold text-white mt-4 uppercase tracking-wide`}>{rangeKey} I.A</h3>
            <div className={`mt-6 px-6 py-1.5 border rounded-full text-[11px] font-bold uppercase tracking-wider ${levelInfo.color} ${levelInfo.border}`}>
              NIVEL {levelInfo.label}
            </div>
          </div>

          {/* Siguiente Reto Card */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 shadow-md flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Siguiente Reto</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              {data?.aiFeedback?.siguienteReto || 'Sigue explorando y utilizando herramientas en tu día a día para descubrir tu siguiente reto.'}
            </p>
          </div>
        </div>

        {/* Right Section: Recommendations */}
        <div className="md:col-span-2 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 pl-2">HERRAMIENTAS RECOMENDADAS</h2>
          
          {/* Herramientas Recomendadas Cards */}
          <div className="flex flex-col gap-4 h-full">
            {tools.map((tool, idx) => {
              const td = TOOLS_DATA[tool];
              const IconComp = td?.icon;
              return (
                <a 
                  key={idx} 
                  href={td?.url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#1a1a1a] border border-white/10 rounded-xl py-5 flex flex-col items-center justify-center text-center shadow-md hover:border-white/20 hover:bg-[#202020] transition-colors flex-1"
                >
                  {td?.logo ? (
                    <img src={td.logo} alt={tool} className="h-8 object-contain mb-3" />
                  ) : IconComp ? (
                    <IconComp className={`w-8 h-8 mb-3 ${td.colorClass}`} />
                  ) : (
                    <PenTool className={`w-8 h-8 mb-3 opacity-80 ${levelInfo.color}`} />
                  )}
                  <span className="font-bold text-sm tracking-widest text-white uppercase">{tool}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl p-6 mt-4 flex flex-col md:flex-row items-center gap-8 justify-between shadow-lg">
        
        {/* Mascot & Interactive Bubble */}
        <div className="flex items-center gap-6 cursor-pointer group" onClick={handleMascotClick}>
          <div className="relative">
            <img src={logo2} alt="Mascota" className="w-24 h-24 object-contain transition-transform group-hover:scale-105" />
          </div>
          <div className="bg-[#2a2a2a] relative rounded-lg p-4 border border-white/10 max-w-xs transition-colors group-hover:bg-[#333]">
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#2a2a2a] border-l border-b border-white/10 transform rotate-45 group-hover:bg-[#333]"></div>
            <p className="text-xs font-bold text-cyan-400 mb-1">TÓCAME PARA SABER MÁS</p>
            <p className="text-sm text-gray-200">
              {phrases[clickCount]}
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left flex-1 justify-end">
          <h2 className="text-xl md:text-2xl font-bold text-white max-w-sm leading-snug">
            ¿Quieres convertirte en un usuario experto de la I.A? <br />
            <span className="text-gray-400 text-lg font-normal mt-2 block">Te invitamos a unirte a nuestra iniciativa</span>
          </h2>
          <Link 
            to="/initiative"
            className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors whitespace-nowrap text-sm"
          >
            Selecciona Aquí
          </Link>
        </div>

      </div>
    </div>
  );
}
