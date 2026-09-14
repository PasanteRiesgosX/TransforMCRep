import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, getErrorMessage } from '../services/api';
import './LoginPage.css';

import img1 from '../assets/img/1. pink-yellow-blue.jpg';
import img2 from '../assets/img/2. purple.png';
import img3 from '../assets/img/3. blue.png';
import img4 from '../assets/img/4. pink-yellow blue.png';

import logoImg from '../assets/img/logo.png';

const carouselImages = [
  { src: img1, color: '#ff00ff', id: 1 },
  { src: img2, color: '#a900a9', id: 2 },
  { src: img3, color: '#00dbe9', id: 3 },
  { src: img4, color: '#ffabf3', id: 4 },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000); // Cambia cada 4 segundos
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser({ email, password });
      navigate('/verify-code', { state: { email } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background grid effect */}
      <div className="login-page__bg" />

      <div className="login-split">
        {/* Left Section: Vertical Carousel */}
        <div className="login-carousel-container">
          <div className="login-carousel-viewport">
            <div
              className="login-carousel"
              style={{ transform: `translateY(-${currentImageIndex * 100}%)` }}
            >
              {carouselImages.map((img, index) => {
                const isActive = index === currentImageIndex;
                return (
                  <div key={img.id} className="login-carousel__item">
                    <div
                      className={`login-carousel__image-wrap ${isActive ? 'active' : ''}`}
                      style={{
                        boxShadow: isActive ? `0 0 35px ${img.color}, 0 0 10px ${img.color} inset` : 'none',
                        borderColor: isActive ? img.color : 'transparent',
                      }}
                    >
                      <img
                        src={img.src}
                        alt={`Art ${index + 1}`}
                        className="login-carousel__image"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="login-form-container">
          <div className="login-card">
            {/* Floating Logo overlapping top-left corner */}
            <img src={logoImg} alt="NEON ARCH Logo" className="login-card__floating-logo" />

            {/* Top accent line matching current image glow */}
            <div
              className="login-card__accent"
              style={{
                background: `linear-gradient(90deg, transparent, ${carouselImages[currentImageIndex].color}, transparent)`
              }}
            />

            {/* Header */}
            <div className="login-card__header">
              <h1 className="login-card__title">Iniciar Sesión</h1>
              <p className="login-card__subtitle">Accede al terminal del sistema.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="login-alert login-alert--error">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              {/* Email */}
              <div className="login-field">
                <label htmlFor="login-email" className="login-field__label">
                  Correo Electrónico
                </label>
                <div className="login-field__input-wrap">
                  <span className="material-symbols-outlined login-field__icon">mail</span>
                  <input
                    id="login-email"
                    type="email"
                    className="login-field__input"
                    placeholder="usuario@multicines.com.ec"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field">
                <div className="login-field__label-row">
                  <label htmlFor="login-password" className="login-field__label">
                    Contraseña
                  </label>
                </div>
                <div className="login-field__input-wrap">
                  <span className="material-symbols-outlined login-field__icon">lock</span>
                  <input
                    id="login-password"
                    type="password"
                    className="login-field__input"
                    placeholder="••••••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="login-spinner" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    INICIAR SESIÓN
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="login-footer">
              <p className="login-footer__text">
                ¿Aún no tienes cuenta?{' '}
                <Link to="/register" className="login-footer__link">
                  Regístrate ahora
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
