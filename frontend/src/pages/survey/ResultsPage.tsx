import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import { Brain, LineChart, Lightbulb, Shield, Crown, Sparkles, User, Rocket, Compass, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';

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

export default function ResultsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const error = err as any;
        if (isActive) {
          if (error.response?.status === 404) {
            setError('Aún no has completado la evaluación.');
          } else {
            setError('Ocurrió un error al cargar los resultados.');
          }
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void fetchResults();

    const pusherKey = import.meta.env.VITE_PUSHER_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;
    const token = localStorage.getItem('accessToken');
    if (!user?.id || !pusherKey || !pusherCluster || !token) {
      return () => {
        isActive = false;
      };
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      channelAuthorization: {
        endpoint: `${API_BASE_URL}/survey/realtime/auth`,
        transport: 'ajax',
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    const channelName = `private-survey-user-${user.id}`;
    const channel = pusher.subscribe(channelName);
    const refreshResults = () => void fetchResults();
    channel.bind('ai-feedback-updated', refreshResults);
    channel.bind('pusher:subscription_succeeded', refreshResults);

    return () => {
      isActive = false;
      channel.unbind('ai-feedback-updated', refreshResults);
      channel.unbind('pusher:subscription_succeeded', refreshResults);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-[#00D7D0] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Cargando tus resultados...</p>
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
      case 'EXPLORADOR': return <Compass className="w-8 h-8 text-orange-400" />;
      case 'USUARIO': return <User className="w-8 h-8 text-blue-400" />;
      case 'IMPULSOR': return <Rocket className="w-8 h-8 text-green-400" />;
      case 'EMBAJADOR': return <Crown className="w-8 h-8 text-yellow-400" />;
      default: return <Sparkles className="w-8 h-8 text-white" />;
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
  
  const ai = data.aiFeedback;
  const aiStatusMessage = data.aiFeedbackStatus === 'PENDING' || data.aiFeedbackStatus === 'PROCESSING'
    ? 'El análisis está en cola. El feedback aparecerá aquí cuando termine.'
    : data.aiFeedbackStatus === 'FAILED'
      ? 'No fue posible generar el feedback. Tus resultados de encuesta siguen disponibles.'
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-2 md:py-4 flex flex-col gap-4 animate-fade-in">
      
      {/* 2-Column Compact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-stretch">
        
        {/* LEFT COLUMN: Rank & Thermometer */}
        <div className="flex flex-col gap-4">
          
          {/* Header Rank Card */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-md flex flex-col gap-2">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Tu rango es</p>
            <div className="flex items-center gap-4">
              <div className="bg-[#2a2a2a] p-3 rounded-xl shrink-0">
                {getRangeIcon(data.range)}
              </div>
              <div className="min-w-0">
                <h2 className={`text-2xl md:text-3xl font-display font-black ${getRangeColorText(data.range)}`}>
                  {data.range}
                </h2>
                <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                  {data.description}
                </p>
              </div>
            </div>
          </div>

          {/* Person-Silhouette Thermometer */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-md flex items-center justify-center relative min-h-[290px] flex-1">
            <p className="absolute top-3 left-4 text-gray-400 font-bold text-xs uppercase tracking-widest">Medidor Global</p>

            <div className="flex items-end gap-6 h-[250px] mt-3">

              {/* Person Silhouette Container */}
              <div className="relative w-28 h-full">
                <svg
                  viewBox="0 0 200 400"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <clipPath id="personClip">
                      {/* Head */}
                      <circle cx="100" cy="36" r="28" />
                      {/* Body: neck → shoulders → arms → torso → legs as one continuous outline */}
                      <path d="
                        M 86,62 L 86,74
                        C 76,80 58,90 42,110
                        L 14,204
                        Q 4,220 18,226
                        L 56,144
                        C 60,136 64,140 66,150
                        L 66,250
                        L 66,370
                        Q 66,386 79,386
                        Q 90,386 90,370
                        L 90,260
                        L 110,260
                        L 110,370
                        Q 110,386 121,386
                        Q 134,386 134,370
                        L 134,250
                        L 134,150
                        C 136,140 140,136 144,144
                        L 182,226
                        Q 196,220 186,204
                        L 158,110
                        C 142,90 124,80 114,74
                        L 114,62
                        Z
                      " />
                    </clipPath>
                  </defs>

                  {/* Background (empty body) */}
                  <g clipPath="url(#personClip)">
                    <rect x="0" y="0" width="200" height="400" fill="#2a2a2a" />

                    {/* Liquid fill — rises from bottom */}
                    <g
                      className="person-thermometer-liquid"
                      style={{ '--liquid-offset': `${100 - score}%` } as React.CSSProperties}
                    >
                      {/* Gradient liquid body */}
                      <rect
                        x="0" y="0" width="200" height="400"
                        fill="url(#liquidGradient)"
                      />

                      {/* Animated wave on liquid surface */}
                      <g className="person-thermometer-wave">
                        <path
                          d="M-200,-6 Q-175,-14 -150,-6 T-100,-6 T-50,-6 T0,-6 T50,-6 T100,-6 T150,-6 T200,-6 T250,-6 T300,-6 T350,-6 T400,-6 V10 H-200 Z"
                          fill="rgba(255,255,255,0.12)"
                        />
                      </g>
                    </g>

                    {/* Inner glow / glass effect */}
                    <rect x="0" y="0" width="200" height="400" fill="url(#glassSheen)" />
                  </g>

                  {/* Outline of the person */}
                  <g clipPath="url(#personClip)">
                    <rect x="0" y="0" width="200" height="400" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  </g>

                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="liquidGradient" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="35%" stopColor="#facc15" />
                      <stop offset="70%" stopColor="#00D7D0" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                      <stop offset="30%" stopColor="rgba(255,255,255,0.02)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Score label on top of the silhouette */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-2xl font-display font-black text-white drop-shadow-lg">{score}%</span>
                </div>
              </div>

              {/* Threshold Labels */}
              <div className="flex flex-col justify-between h-full py-2 relative text-xs">

                <div className="flex items-center gap-3">
                  <div className={`w-3 h-[2px] ${score >= 75 ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                  <div>
                    <p className={`font-bold text-xs ${score >= 75 ? 'text-yellow-400' : 'text-gray-500'}`}>EMBAJADOR</p>
                    <p className="text-[10px] text-gray-500">Referente</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-3 h-[2px] ${score >= 50 && score < 75 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                  <div>
                    <p className={`font-bold text-xs ${score >= 50 && score < 75 ? 'text-green-400' : 'text-gray-500'}`}>IMPULSOR</p>
                    <p className="text-[10px] text-gray-500">Avanzado</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-3 h-[2px] ${score >= 25 && score < 50 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                  <div>
                    <p className={`font-bold text-xs ${score >= 25 && score < 50 ? 'text-blue-400' : 'text-gray-500'}`}>USUARIO</p>
                    <p className="text-[10px] text-gray-500">Intermedio</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-3 h-[2px] ${score < 25 ? 'bg-orange-400' : 'bg-gray-600'}`}></div>
                  <div>
                    <p className={`font-bold text-xs ${score < 25 ? 'text-orange-400' : 'text-gray-500'}`}>EXPLORADOR</p>
                    <p className="text-[10px] text-gray-500">Básico</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: AI Progress Bars & Superpowers */}
        <div className="flex flex-col gap-4">
  {/* Competency Card */}
  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 md:p-5 shadow-md flex flex-col gap-4 h-full">
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-display font-bold text-white">Tu perfil de competencias</h3>
        <p className="text-gray-400 text-xs mt-0.5">
          {ai ? 'Analizado por Inteligencia Artificial basado en tus respuestas.' : aiStatusMessage ?? 'Feedback de IA no disponible.'}
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        {/* Row 1 */}
        <div className="flex items-center gap-3">
          <div className="bg-purple-900/30 p-2 rounded-full shrink-0">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-white font-medium truncate">Conocimiento general</span>
              <span className="text-purple-400 font-bold ml-2">{ai ? `${ai.conocimientoGeneral}%` : '—'}</span>
            </div>
            <div className="h-2 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${ai?.conocimientoGeneral ?? 0}%` }}></div>
            </div>
          </div>
        </div>
        {/* Row 2 */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-900/30 p-2 rounded-full shrink-0">
            <LineChart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-white font-medium truncate">Uso de herramientas</span>
              <span className="text-blue-400 font-bold ml-2">{ai ? `${ai.usoHerramientas}%` : '—'}</span>
            </div>
            <div className="h-2 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${ai?.usoHerramientas ?? 0}%` }}></div>
            </div>
          </div>
        </div>
        {/* Row 3 */}
        <div className="flex items-center gap-3">
          <div className="bg-green-900/30 p-2 rounded-full shrink-0">
            <Lightbulb className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-white font-medium truncate">Identificación de oportunidades</span>
              <span className="text-green-400 font-bold ml-2">{ai ? `${ai.identificacionOportunidades}%` : '—'}</span>
            </div>
            <div className="h-2 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${ai?.identificacionOportunidades ?? 0}%` }}></div>
            </div>
          </div>
        </div>
        {/* Row 4 */}
        <div className="flex items-center gap-3">
          <div className="bg-orange-900/30 p-2 rounded-full shrink-0">
            <Shield className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-white font-medium truncate">Uso responsable</span>
              <span className="text-orange-400 font-bold ml-2">{ai ? `${ai.usoResponsable}%` : '—'}</span>
            </div>
            <div className="h-2 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${ai?.usoResponsable ?? 0}%` }}></div>
            </div>
          </div>
        </div>
        {/* Row 5 */}
        <div className="flex items-center gap-3">
          <div className="bg-pink-900/30 p-2 rounded-full shrink-0">
            <Crown className="w-4 h-4 text-pink-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-white font-medium truncate">Disposición para impulsar</span>
              <span className="text-pink-400 font-bold ml-2">{ai ? `${ai.disposicionImpulsar}%` : '—'}</span>
            </div>
            <div className="h-2 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className="h-full bg-pink-500 rounded-full transition-all duration-1000" style={{ width: `${ai?.disposicionImpulsar ?? 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* Superpowers Card */}
  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 md:p-5 shadow-md flex flex-col gap-4 h-full">
    <div className="flex items-center gap-2">
      <Zap className="w-4 h-4 text-pink-400" />
      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Tus superpoderes de la I.A</h4>
    </div>
    <div className="text-xs text-slate-200 leading-relaxed bg-[#121212] border border-white/10 rounded-lg p-3 italic">
      {ai?.superpoderes || (aiStatusMessage ?? 'Analizando tus respuestas para descubrir tus superpoderes en Inteligencia Artificial...')}
    </div>
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-[#00D7D0]/30 text-[11px] font-semibold text-[#7DE5DF] mt-auto">
      <Sparkles className="w-3.5 h-3.5" />
      <span>Este mensaje es único, fue generado en base a tus respuestas usando I.A</span>
    </div>
  </div>
</div>

      </div>

      {/* Siguiente Button */}
      <div className="mt-8 flex justify-end">
        <Link 
          to="/recommendations"
          className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
        >
          SIGUIENTE
        </Link>
      </div>

    </div>
  );
}
