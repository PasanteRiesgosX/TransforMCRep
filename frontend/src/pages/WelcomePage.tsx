import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';
import multigImg from '../assets/img/multig.png';
import logowImg from '../assets/img/logow.png';
import CookieMonsterEyes from './CookieMonsterEyes';

interface UserData {
  id?: string;
  email?: string;
  fullName?: string;
  area?: string;
  role?: string;
}

// Hacker Scramble Effect helper
class ScrambleEffect {
  el: HTMLElement;
  chars: string;
  queue: Array<{ from: string; to: string; start: number; end: number; char?: string }>;
  frame: number;
  frameRequest: number;
  resolve?: () => void;

  constructor(el: HTMLElement) {
    this.el = el;
    this.chars = '!#@$&*?%01';
    this.queue = [];
    this.frame = 0;
    this.frameRequest = 0;
    this.update = this.update.bind(this);
  }

  setText(newText: string): Promise<void> {
    const oldText = this.el.innerText || '';
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
    this.queue = [];
    const totalFrames = 60;

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor((i / length) * (totalFrames * 0.6));
      const end = start + Math.floor(Math.random() * 10) + 12;
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      const { from, to, start, end } = this.queue[i];
      let { char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span style="opacity: 0.5;">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      if (this.resolve) this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }

  cancel() {
    cancelAnimationFrame(this.frameRequest);
  }
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const el1Ref = useRef<HTMLHeadingElement | null>(null);
  const el2Ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // Ignored
      }
    }

    if (!token) {
      // If not authenticated, we can still show or redirect
      // Keeping lenient for testing
    }

    // Scramble Animation
    let fx1: ScrambleEffect | null = null;
    let fx2: ScrambleEffect | null = null;

    const timer = setTimeout(() => {
      if (el1Ref.current && el2Ref.current) {
        el1Ref.current.style.visibility = 'visible';
        el2Ref.current.style.visibility = 'visible';

        fx1 = new ScrambleEffect(el1Ref.current);
        fx2 = new ScrambleEffect(el2Ref.current);

        const text1 = el1Ref.current.getAttribute('data-text') || 'Buscamos un';
        const text2 = el2Ref.current.getAttribute('data-text') || 'EQUIPO DIVERSO';

        el1Ref.current.innerText = '';
        el2Ref.current.innerText = '';

        fx1.setText(text1).then(() => {
          if (fx2) fx2.setText(text2);
        });
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      if (fx1) fx1.cancel();
      if (fx2) fx2.cancel();
    };
  }, []);

  const handleStartSurvey = () => {
    // Placeholder action ready for survey routing
    console.log('Navegando a la encuesta...');
    alert('¡Redirigiendo a la encuesta de TransforMC!');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="welcome-page min-h-screen w-full flex flex-col bg-[#000000] text-white selection:bg-[#ffabf3] selection:text-black">

      {/* ── HEADER ── */}
      <header className="w-full px-6 md:px-12 py-5 flex justify-between items-center max-w-7xl mx-auto z-50 sticky top-0 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(138,5,190,0.15)]">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[] flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(138,5,190,0.6)]">
            <img src={multigImg} alt="Logo MultiG" className="w-full h-full object-cover" />
          </div>
          <span className="font-['Sora'] text-xl md:text-2xl font-bold tracking-tight text-white italic">
            TransforMC
          </span>
        </div>

        {/* Navigation & User menu */}
        <div className="flex items-center gap-4">
          {user && (
            <span className="hidden md:inline-block font-mono text-xs text-[#dcbed4] tracking-wide">
              {user.fullName || user.email}
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full welcome-glass-panel flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group"
              title="Cuenta de usuario"
            >
              <span className="material-symbols-outlined text-[#dcbed4] group-hover:text-white transition-colors text-xl">
                person
              </span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 welcome-glass-panel rounded-xl py-2 px-3 shadow-2xl z-50 bg-[#131313]/95 border border-white/15 animate-fade-in">
                {user && (
                  <div className="px-2 py-2 border-b border-white/10 mb-1">
                    <p className="text-xs font-bold text-white truncate m-0 font-['Sora']">
                      {user.fullName || 'Usuario'}
                    </p>
                    <p className="text-[11px] text-white/50 truncate m-0 font-mono">
                      {user.email}
                    </p>
                    {user.area && (
                      <p className="text-[10px] text-[#ffabf3] mt-1 m-0 font-mono">
                        {user.area}
                      </p>
                    )}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-grow w-full px-6 md:px-12 py-8 md:py-16 max-w-7xl mx-auto flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* LEFT COLUMN: The Sci-Fi Visual Card */}
          <div className="relative w-full aspect-[4/5] md:aspect-[3/4] max-h-[640px] rounded-2xl overflow-hidden welcome-glass-panel welcome-animate-blur-focus welcome-neon-glow group flex flex-col justify-between p-8 md:p-10">
            {/* Background Image */}
            <img
              src={logowImg}
              alt="Logo W"
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />

            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-0 pointer-events-none" />

            {/* Top Right Watermark */}
            <div className="relative z-10 self-end opacity-25 font-['Sora'] text-lg md:text-xl font-bold tracking-tight italic mix-blend-overlay">

            </div>

            {/* Center Icon Symbol */}
            <div className="relative z-10 self-center my-auto">
              <span className="font-mono text-5xl md:text-6xl text-white opacity-80 welcome-text-glow font-bold">
                {'{}'}
              </span>
            </div>

            {/* Animated Text Lines */}
            <div className="relative z-10 w-full space-y-3.5 mt-auto">
              <div className="w-full h-px bg-white/20" />
              <h2
                ref={el1Ref}
                className="font-['Sora'] text-2xl md:text-3xl lg:text-4xl text-white font-extrabold uppercase tracking-tight"
                data-text="Buscamos un"
                style={{ visibility: 'hidden' }}
              >
                Buscamos un
              </h2>
              <div className="w-full h-px bg-white/20" />
              <h2
                ref={el2Ref}
                className="font-['Sora'] text-2xl md:text-3xl lg:text-4xl text-[#ffabf3] font-extrabold uppercase tracking-tight welcome-text-glow"
                data-text="EQUIPO DIVERSO"
                style={{ visibility: 'hidden' }}
              >
                EQUIPO DIVERSO
              </h2>
              <div className="w-full h-px bg-white/20" />
              <h3 className="font-['Inter'] text-xs md:text-sm text-[#dcbed4] uppercase tracking-widest font-semibold welcome-animate-subtitle m-0">
                QUE IMPULSE PROYECTOS CON I.A
              </h3>
            </div>
          </div>

          {/* RIGHT COLUMN: Description & CTA */}
          <div className="flex flex-col items-start justify-center gap-6 max-w-xl py-4">
            <div className="hidden lg:flex justify-end w-full">
              <CookieMonsterEyes />
            </div>

            {/* Title with Decorative Badge */}
            <div className="flex items-center gap-4 welcome-animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <h1 className="font-['Sora'] text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight m-0 glow-text">
                TransforMC
              </h1>
              {/* Decorative Diamond Badge */}
              <div className="w-10 h-10 bg-transparent border border-[#8A05BE] rounded-sm transform rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(138,5,190,0.5)]">
                <div className="w-3.5 h-3.5 bg-[#8A05BE] rounded-sm" />
              </div>
            </div>

            {/* Descriptive Body Paragraphs */}
            <div className="space-y-4 font-['Inter'] text-sm md:text-base text-[#dcbed4] leading-relaxed welcome-animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <p className="m-0">
                Estamos viviendo una nueva etapa de transformación, donde la Inteligencia Artificial abre puertas a formas más inteligentes, ágiles y creativas de trabajar. Este proyecto busca acercar esa oportunidad a las personas, creando un espacio para explorar, aprender y aportar nuevas perspectivas.
              </p>
              <p className="m-0">
                Cada avance comienza con una idea, una pregunta o una forma diferente de ver las cosas. Queremos impulsar una cultura donde la innovación sea accesible, colaborativa y llena de posibilidades. Porque las mejores soluciones nacen cuando la tecnología y el talento humano crecen juntos.
              </p>
            </div>

            <div className="w-full h-px bg-white/10 my-2 welcome-animate-fade-up" style={{ animationDelay: '0.5s' }} />

            {/* CTA Section */}
            <div className="flex flex-col gap-4 welcome-animate-fade-up w-full" style={{ animationDelay: '0.6s' }}>
              <p className="font-mono text-xs text-white/70 uppercase tracking-[0.2em] m-0 font-bold">
                QUEREMOS SABER SOBRE TI
              </p>

              <button
                onClick={handleStartSurvey}
                className="bg-[#9333EA] hover:bg-[#a855f7] text-white font-mono text-sm font-bold px-8 py-4 rounded-full uppercase tracking-wider transition-all duration-300 welcome-hover-button active:scale-95 flex items-center gap-3 w-fit cursor-pointer group shadow-[0_0_20px_rgba(147,51,234,0.5)]"
              >
                TOMA LA ENCUESTA
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full px-6 md:px-12 py-6 flex justify-end items-center max-w-7xl mx-auto border-t border-white/5 bg-[#0e0e0e]/50 mt-auto">
        <p className="font-mono text-xs text-[#dcbed4] uppercase tracking-widest text-right m-0">
          SEGUIMOS INNOVANDO <span className="text-white font-bold">PARA TI</span>
        </p>
      </footer>

    </div>
  );
}
