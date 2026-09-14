import { useEffect, useRef, useState } from 'react';

const quotes = [
  { text: '"La IA es la nueva electricidad."', author: '— Andrew Ng' },
  { text: '"La inteligencia es la capacidad de adaptarse al cambio."', author: '— Stephen Hawking' },
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length);
        setFadeIn(true);
      }, 500);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100vh',
        backgroundColor: '#0e0e0e',
        overflow: 'hidden',
      }}
    >
      {/* Cyber grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(circle at 50% 40%, rgba(255,0,255,0.04) 0%, transparent 60%),' +
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* Left Column — hidden on mobile, no image */}
      <section
        style={{
          display: 'none',
          width: '50%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem 2.5rem',
          position: 'relative',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
        className="auth-left-col"
      >
        {/* Title */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: '3rem' }}>
          <h1
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: '2.75rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textShadow: '0 0 10px rgba(255,255,255,0.15)',
              maxWidth: '26rem',
              margin: 0,
            }}
          >
            Descubre y Libera
            <br />
            <span style={{ color: '#ffabf3', fontStyle: 'italic' }}>tu potencial</span>
            <br />
            en I.A.
          </h1>
        </div>

        {/* Quote carousel */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: '3rem' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '26rem',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '1.75rem', color: '#ffabf3', marginBottom: '0.75rem', display: 'block' }}
            >
              format_quote
            </span>

            <div style={{ minHeight: '5rem', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  transition: 'opacity 0.5s',
                  opacity: fadeIn ? 1 : 0,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '1rem',
                  color: '#dcbed4',
                  lineHeight: 1.6,
                }}
              >
                {quotes[currentQuote].text}
                <span
                  style={{
                    display: 'block',
                    marginTop: '0.5rem',
                    fontFamily: '"Space Mono", monospace',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.1em',
                    color: '#00dbe9',
                    fontWeight: 700,
                  }}
                >
                  {quotes[currentQuote].author}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem' }}>
              {quotes.map((_, index) => (
                <span
                  key={index}
                  style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    backgroundColor: index === currentQuote ? '#ffabf3' : '#353535',
                    transition: 'background-color 0.3s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Right Column — form */}
      <section
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          position: 'relative',
          zIndex: 1,
        }}
        className="auth-right-col"
      >
        {children}
      </section>

      {/* CSS for responsive left column */}
      <style>{`
        @media (min-width: 768px) {
          .auth-left-col { display: flex !important; }
          .auth-right-col { width: 50% !important; }
        }
      `}</style>
    </div>
  );
}
