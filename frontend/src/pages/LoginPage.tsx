import { useState, useEffect } from 'react';
import './LoginPage.css';
import logoImg from '../assets/img/logo.png';

const quotes = [
  { text: '"La IA es la nueva electricidad."', author: '— Andrew Ng' },
  { text: '"La inteligencia es la capacidad de adaptarse al cambio."', author: '— Stephen Hawking' },
];

export default function LoginPage() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);

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
    <div className="min-h-screen w-full flex items-center justify-center p-6 lg:p-12 relative selection:bg-[#ffabf3] selection:text-black" style={{ backgroundColor: '#0e0e0e' }}>
      {/* Background cyber effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(255, 0, 255, 0.04) 0%, transparent 60%), linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 40px 40px, 40px 40px'
      }} />

      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 relative z-10">

        {/* LEFT COLUMN: Inspiration / Branding */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center gap-8 max-w-lg mx-auto">
          <div>
            <h1 className="font-display-lg text-4xl lg:text-5xl text-white mb-4 glow-text leading-tight font-extrabold font-['Sora']">
              Descubre y Libera<br />
              <span className="text-[#ffabf3] italic">tu potencial</span><br />
              en I.A.
            </h1>
          </div>

          {/* Carousel of Quotes */}
          <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 p-6 rounded-xl relative group shadow-lg w-full">
            <span className="material-symbols-outlined text-[#ffabf3] text-3xl mb-2 block">
              format_quote
            </span>
            <div className="min-h-[70px] flex flex-col justify-center">
              <p
                className={`text-lg text-[#dcbed4] transition-opacity duration-500 font-['Inter'] m-0 ${quoteFade ? 'opacity-100' : 'opacity-0'}`}
              >
                {quotes[currentQuoteIndex].text}
              </p>
              <p
                className={`text-xs font-mono tracking-widest text-[#00dbe9] mt-2 font-bold transition-opacity duration-500 m-0 ${quoteFade ? 'opacity-100' : 'opacity-0'}`}
              >
                {quotes[currentQuoteIndex].author}
              </p>
            </div>

            {/* Dots */}
            <div className="flex gap-2 mt-4">
              {quotes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuoteIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentQuoteIndex ? 'bg-[#ffabf3] w-6' : 'bg-white/20 w-2.5 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form Card */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="max-w-md w-full relative" style={{ background: 'rgba(255, 255, 255, 0.025)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '4rem 3rem' }}>
            {/* Floating Logo */}
            <img
              src={logoImg}
              alt="NEON ARCH Logo"
              style={{ position: 'absolute', bottom: '-35px', left: '-35px', width: '125px', height: 'auto', zIndex: 40, filter: 'drop-shadow(0 0 14px rgba(255, 0, 255, 0.45))' }}
            />

            <div style={{ position: 'absolute', top: 0, left: '2rem', right: '2rem', height: '1px', background: 'linear-gradient(90deg, transparent, #ff00ff, transparent)' }} />

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="font-['Sora'] text-2xl font-bold text-white mb-2">
                Iniciar Sesión
              </h1>
              <p className="text-sm text-white/60 font-['Inter'] m-0">
                Accede al terminal del sistema.
              </p>
              <p className="text-sm text-[#00dbe9] font-['Inter'] mt-2">
                Inicia sesión con tus propias credenciales de la institución (@multicines.com)
              </p>
            </div>

            <div className="flex flex-col items-center mt-8 mb-4">
              <button
                className="w-full py-3 bg-[#0078D4] hover:bg-[#106EBE] text-white font-bold uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(0,120,212,0.4)] hover:shadow-[0_0_25px_rgba(0,120,212,0.7)] flex items-center justify-center gap-3 mt-3 text-sm cursor-pointer font-['Sora']"
                onClick={handleMicrosoftLogin}
              >
                {/* Windows logo SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 88 88">
                  <path fill="#fff" d="M0 12.402l35.687-4.86.016 34.423-35.703.206zm35.67 33.529l.016 34.454-35.686-4.904v-29.35zM40.336 6.136L87.316 0v41.26l-46.98.261zm.016 38.647L87.316 45.4v41.522l-46.964-6.425z"/>
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
