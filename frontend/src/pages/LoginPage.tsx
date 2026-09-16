import { useState, useEffect } from 'react';
import logoImg from '../assets/img/logo.png';
const quotes = [
  { text: '"La IA es la nueva electricidad."', author: '— Andrew Ng' },
  { text: '"La inteligencia es la capacidad de adaptarse al cambio."', author: '— Stephen Hawking' },
  { text: '"Nuestra inteligencia es lo que nos hace humanos, y la IA es una extensión de esa cualidad."', author: '— Yann LeCun' },
  { text: '"La inteligencia artificial alcanzará el nivel humano alrededor de 2029."', author: '— Ray Kurzweil' },
  { text: '"Debemos asegurarnos de que estamos usando la IA para beneficiar a la humanidad."', author: '— Tim Cook' },
  { text: '"La IA no te reemplazará. Una persona usando IA te reemplazará."', author: '— Anónimo' },
  { text: '"El verdadero peligro no es que las máquinas piensen como humanos, sino al revés."', author: '— Sydney Harris' },
  { text: '"La IA será la tecnología más definitoria de nuestro tiempo."', author: '— Satya Nadella' },
  { text: '"Imaginar un futuro sin IA es como imaginar un futuro sin computadoras."', author: '— Fei-Fei Li' },
  { text: '"La inteligencia artificial es matemáticas aplicadas a una escala sin precedentes."', author: '— Demis Hassabis' },
];

export default function LoginPage() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);
  const [logoBounceKey, setLogoBounceKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setQuoteFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMicrosoftLogin = () => {
    const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
    const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI;
    
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=openid profile email`;
    
    window.location.href = url;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 lg:p-12 relative selection:bg-[#F582A2] selection:text-black" style={{ backgroundColor: '#0e0e0e' }}>
      {/* Background cyber effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(245, 130, 162, 0.04) 0%, transparent 60%), linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 40px 40px, 40px 40px'
      }} />

      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 relative z-10">

        {/* LEFT COLUMN: Inspiration / Branding */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center gap-10 max-w-xl lg:max-w-2xl mx-auto">
          <div>
            <h1 className="font-display text-4xl lg:text-5xl text-white mb-6 leading-tight font-extrabold font-['Sora']">
              Descubre y Libera<br />
              <span className="text-[#FFABF3] italic glow-text">tu potencial</span><br />
              en I.A.
            </h1>
          </div>

          {/* Carousel of Quotes */}
          <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 px-12 sm:px-14 py-7 sm:py-8 rounded-2xl relative group shadow-lg w-full md:w-[100%] lg:w-[85%] mt-4 flex flex-col">
            <div>
              <span className="material-symbols-outlined text-[#FFABF3] text-3xl mb-3 block select-none">
                format_quote
              </span>
              <div className="min-h-[100px] flex flex-col justify-center py-1">
                <p
                  className={`text-lg text-[#CCCCCC] transition-opacity duration-500 font-['Inter'] m-0 leading-relaxed ${quoteFade ? 'opacity-100' : 'opacity-0'}`}
                >
                  {quotes[currentQuoteIndex].text}
                </p>
                <p
                  className={`text-sm font-mono tracking-widest text-[#00D7D0] mt-3 font-bold transition-opacity duration-500 m-0 ${quoteFade ? 'opacity-100' : 'opacity-0'}`}
                >
                  {quotes[currentQuoteIndex].author}
                </p>
              </div>
            </div>

            {/* Dots */}
            <div className="flex gap-2.5 mt-6 flex-wrap items-center">
              {quotes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuoteIndex(idx)}
                  aria-label={`Ver frase ${idx + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-400 cursor-pointer ${
                    idx === currentQuoteIndex
                      ? 'bg-[#FFABF3] shadow-[0_0_8px_rgba(255,171,243,0.7)]'
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form Card */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="max-w-md w-full relative shadow-[0_0_30px_rgba(255,171,243,0.22)]" style={{ background: 'rgba(255, 255, 255, 0.025)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '4.5rem 3rem' }}>
            {/* Floating Logo */}
            <img
              key={logoBounceKey}
              src={logoImg}
              alt="NEON ARCH Logo"
              className={`absolute -bottom-[35px] -left-[35px] w-[125px] h-auto z-40 pointer-events-none drop-shadow-[0_0_14px_rgba(255,171,243,0.5)] ${
                logoBounceKey > 0 ? 'animate-logo-bounce' : ''
              }`}
            />

            <div style={{ position: 'absolute', top: 0, left: '2rem', right: '2rem', height: '1px', background: 'linear-gradient(90deg, transparent, #FFABF3, transparent)' }} />

            {/* Header */}
            <div className="text-center flex flex-col items-center">
              <h1 className="font-['Sora'] text-2xl font-bold text-white mb-6">
                Iniciar Sesión
              </h1>

              <p className="text-sm font-bold leading-relaxed font-body mb-3 max-w-xs" style={{ color: '#CCCCCC' }}>
                Ingresa con tu cuenta, accede con tus propias credenciales de la institucion
              </p>

              <div className="text-base font-bold font-body tracking-wide glow-text">
                <span className="text-[#FFD200] glow-text">@mult</span>
                <span className="text-[#FFABF3] glow-text">icine</span>
                <span className="text-[#00D7D0] glow-text">s.com</span>
                <span className="text-white glow-text">.</span>
              </div>
            </div>

            <div className="flex flex-col items-center mt-16 mb-4 w-full" style={{ marginTop: '2rem' }}>
              <button
                className="group w-4/5 py-10 px-6 bg-[#F582A2] text-white font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(245,130,162,0.5)] login-btn-morph active:scale-95 flex items-center justify-center gap-4 text-base cursor-pointer font-['Sora']"
                onClick={handleMicrosoftLogin}
                onMouseEnter={() => setLogoBounceKey((prev) => prev + 1)}
                style={{ padding: '1rem 1.5rem' }}
              >
                {/* Windows logo SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 88 88">
                  <path
                    className="fill-white group-hover:fill-[#00D7D0] transition-colors duration-300"
                    d="M0 12.402l35.687-4.86.016 34.423-35.703.206zm35.67 33.529l.016 34.454-35.686-4.904v-29.35zM40.336 6.136L87.316 0v41.26l-46.98.261zm.016 38.647L87.316 45.4v41.522l-46.964-6.425z"
                  />
                </svg>
                INICIAR SESIÓN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

