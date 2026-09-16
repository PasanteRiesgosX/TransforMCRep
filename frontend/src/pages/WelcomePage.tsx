import { useEffect, useRef } from 'react';
import logowImg from '../assets/img/logow.png';
import CookieMonsterEyes from './CookieMonsterEyes';

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
  const el1Ref = useRef<HTMLHeadingElement | null>(null);
  const el2Ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
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

  return (
    <div className="flex-1 w-full flex flex-col bg-surface-dim text-white selection:bg-primary selection:text-black p-7 md:p-10 xl:p-12">



      {/* ── MAIN CONTENT ── */}
      <main className="flex-grow w-full px-6 md:px-12 py-4 md:py-6 max-w-7xl mx-auto flex flex-col justify-center overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center h-full max-h-[85vh]">

          {/* LEFT COLUMN: The Sci-Fi Visual Card */}
          <div className="relative w-full aspect-[4/5] md:aspect-[3/4] max-h-[480px] lg:max-h-[520px] rounded-2xl overflow-hidden glass-panel shadow-[0_0_25px_rgba(138,5,190,0.45)] [animation:var(--animate-blur-focus)] group flex flex-col justify-between p-6 md:p-8 mx-auto">
            {/* Background Image */}
            <img
              src={logowImg}
              alt="Logo W"
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />

            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-0 pointer-events-none" />

            {/* Top Right Watermark */}
            <div className="relative z-10 self-end opacity-25 font-display text-base font-bold tracking-tight italic mix-blend-overlay">

            </div>

            {/* Center Icon Symbol */}
            <div className="relative z-10 self-center my-auto">
              <span className="font-mono text-4xl md:text-5xl text-white opacity-80 glow-text font-bold">
                {'{}'}
              </span>
            </div>

            {/* Animated Text Lines */}
            <div className="relative z-10 w-full space-y-2.5 mt-auto">
              <div className="w-full h-px bg-white/20" />
              <h2
                ref={el1Ref}
                className="font-display text-xl md:text-2xl lg:text-3xl text-white font-extrabold uppercase tracking-tight"
                data-text="Buscamos un"
                style={{ visibility: 'hidden' }}
              >
                Buscamos un
              </h2>
              <div className="w-full h-px bg-white/20" />
              <h2
                ref={el2Ref}
                className="font-display text-xl md:text-2xl lg:text-3xl text-primary font-extrabold uppercase tracking-tight glow-text"
                data-text="EQUIPO DIVERSO"
                style={{ visibility: 'hidden' }}
              >
                EQUIPO DIVERSO
              </h2>
              <div className="w-full h-px bg-white/20" />
              <h3 className="font-body text-[10px] md:text-xs text-on-surface-variant uppercase tracking-widest font-semibold m-0 [animation:var(--animate-subtitle-reveal)] opacity-0" style={{ animationDelay: '1.8s' }}>
                QUE IMPULSE PROYECTOS CON I.A
              </h3>
            </div>
          </div>

          {/* RIGHT COLUMN: Description & CTA */}
          <div className="survey-content flex flex-col items-start justify-center gap-4 max-w-xl py-1">
            <div className="hidden lg:flex justify-end w-full mb-2">

            </div>

            {/* Title with Decorative Badge */}
            <div className="flex items-center gap-4 opacity-0 [animation:var(--animate-fade-up-blur)]" style={{ animationDelay: '0.2s' }}>
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight m-0 glow-text">
                TransforMC
              </h1>
              {/* Decorative Diamond Badge (Yellow) */}
              <div className="w-8 h-8 bg-transparent border border-[#FFFFFF] rounded-sm transform rotate-45 flex items-center justify-center shadow-[0_0_12px_rgba(255,210,0,0.5)]">
                <div className="survey-accent-indicator w-2.5 h-2.5 bg-[#00D7D0] rounded-sm" />
              </div>
            </div>

            {/* Descriptive Body Paragraphs */}
            <div className="space-y-3 font-body text-xs md:text-sm text-on-surface-variant leading-relaxed opacity-0 [animation:var(--animate-fade-up-blur)]" style={{ animationDelay: '0.4s' }}>
              <p className="m-0">
                Estamos viviendo una nueva etapa de transformación, donde la Inteligencia Artificial abre puertas a formas más inteligentes, ágiles y creativas de trabajar. Este proyecto busca acercar esa oportunidad a las personas, creando un espacio para explorar, aprender y aportar nuevas perspectivas.
              </p>
              <p className="m-0">
                Cada avance comienza con una idea, una pregunta o una forma diferente de ver las cosas. Queremos impulsar una cultura donde la innovación sea accesible, colaborativa y llena de posibilidades. Porque las mejores soluciones nacen cuando la tecnología y el talento humano crecen juntos.
              </p>
            </div>

            <div className="w-full h-px bg-white/10 my-2 opacity-0 [animation:var(--animate-fade-up-blur)]" style={{ animationDelay: '0.5s' }} />

            {/* CTA Section */}
            <div className="flex flex-col gap-3 opacity-0 [animation:var(--animate-fade-up-blur)] w-full" style={{ animationDelay: '0.6s' }}>
              <p className="font-mono text-[10px] text-white/70 uppercase tracking-[0.2em] m-0 font-bold">
                QUEREMOS SABER SOBRE TI
              </p>

              <button
                onClick={handleStartSurvey}
                className="survey-cta bg-tertiary hover:bg-tertiary-container text-black font-mono text-xs md:text-sm font-bold px-7 py-4 rounded-2xl uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(0,215,208,0.4)] hover:shadow-[0_0_30px_rgba(0,215,208,0.8)] hover:-translate-y-0.5 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 w-fit cursor-pointer group"
              >
                TOMA LA ENCUESTA
                <span className="material-symbols-outlined text-base md:text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full px-6 md:px-12 py-6 flex justify-end items-center max-w-7xl mx-auto border-t border-white/5 bg-surface-lowest/50 mt-auto">
        <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest text-right m-0">
          SEGUIMOS INNOVANDO <span className="text-white font-bold">PARA TI</span>
        </p>
      </footer>

    </div>
  );
}
