import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket } from 'lucide-react';

export default function InitiativePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-full flex flex-col items-center justify-center text-center">
      <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full border border-white/10">
        <Rocket className="w-16 h-16 text-cyan-400" />
      </div>
      
      <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
        ¡Próximamente!
      </h1>
      <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-12">
        Estamos preparando una gran iniciativa para llevar tus habilidades de Inteligencia Artificial al siguiente nivel. ¡Mantente atento a nuestras comunicaciones!
      </p>

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-white/10 rounded-full transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Regresar a Recomendaciones
      </button>
    </div>
  );
}
