import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, getErrorMessage } from '../services/api';
import './RegisterPage.css';
import logo2Img from '../assets/img/logo_2.png';

const quotes = [
  { text: '"La IA es la nueva electricidad."', author: '— Andrew Ng' },
  { text: '"La inteligencia es la capacidad de adaptarse al cambio."', author: '— Stephen Hawking' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [area, setArea] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carousel logic with 5s rotation & fade
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        email,
        password,
        fullName,
        area,
        role,
      });
      setSuccess(response.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page min-h-screen w-full flex items-center justify-center p-6 lg:p-12 cyber-bg relative selection:bg-[#ffabf3] selection:text-black">
      {/* Background cyber effect */}
      <div className="register-page__bg" />

      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 relative z-10">

        {/* LEFT COLUMN: Inspiration / Branding (centered & grouped) */}
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
                className={`text-lg text-[#dcbed4] transition-opacity duration-500 font-['Inter'] m-0 ${quoteFade ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                {quotes[currentQuoteIndex].text}
              </p>
              <p
                className={`text-xs font-mono tracking-widest text-[#00dbe9] mt-2 font-bold transition-opacity duration-500 m-0 ${quoteFade ? 'opacity-100' : 'opacity-0'
                  }`}
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
                  className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentQuoteIndex ? 'bg-[#ffabf3] w-6' : 'bg-white/20 w-2.5 hover:bg-white/40'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form Card (max-w-md w-full, py-8 px-8) */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="register-card max-w-md w-full relative">
            {/* Floating superpuesto logo matching Login configuration */}
            <img
              src={logo2Img}
              alt="NEON ARCH Logo"
              className="register-card__floating-logo"
            />

            <div className="register-card__accent" />

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="font-['Sora'] text-2xl font-bold text-white mb-1">
                Registro
              </h1>
              <p className="text-sm text-white/60 font-['Inter'] m-0">
                Crea tu cuenta en el terminal del sistema.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <p className="m-0">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <p className="m-0">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="fullname">
                  Nombre Completo
                </label>
                <div className="form-input-container">
                  <span className="material-symbols-outlined form-input-icon">person</span>
                  <input
                    className="form-input"
                    id="fullname"
                    type="text"
                    placeholder="Nombre y Apellido"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Áreas */}
              <div className="form-group">
                <label className="form-label" htmlFor="area">
                  Áreas
                </label>
                <div className="form-input-container">
                  <span className="material-symbols-outlined form-input-icon">domain</span>
                  <select
                    className="form-input"
                    id="area"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    disabled={loading}
                  >
                    <option value="" disabled>Selecciona un área</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Administrativo Financiero">Administrativo Financiero</option>
                    <option value="Tecnología de la Información">Tecnología de la Información</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Técnica e Infraestructura">Técnica e Infraestructura</option>
                    <option value="Riesgos y Control Interno">Riesgos y Control Interno</option>
                    <option value="Programación y Distribución">Programación y Distribución</option>
                  </select>
                </div>
              </div>

              {/* Cargo */}
              <div className="form-group">
                <label className="form-label" htmlFor="role">
                  Cargo
                </label>
                <div className="form-input-container">
                  <span className="material-symbols-outlined form-input-icon">badge</span>
                  <select
                    className="form-input"
                    id="role"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                  >
                    <option value="" disabled>Selecciona un cargo</option>
                    <option value="ASISTENTE">ASISTENTE</option>
                    <option value="ANALISTA">ANALISTA</option>
                    <option value="ESPECIALISTA">ESPECIALISTA</option>
                    <option value="GERENTE COMPLEJO">GERENTE COMPLEJO</option>
                    <option value="GERENTE DE AREA">GERENTE DE AREA</option>
                    <option value="JEFE">JEFE</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="form-input-container">
                  <span className="material-symbols-outlined form-input-icon">mail</span>
                  <input
                    className="form-input"
                    id="email"
                    type="email"
                    placeholder="usuario@multicines.com.ec"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Clave de Seguridad
                </label>
                <div className="form-input-container">
                  <span className="material-symbols-outlined form-input-icon">lock</span>
                  <input
                    className="form-input"
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">
                  Confirmar Clave
                </label>
                <div className="form-input-container">
                  <span className="material-symbols-outlined form-input-icon">verified_user</span>
                  <input
                    className="form-input"
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                className="w-full py-3 bg-[#FF00FF] hover:bg-[#ff33ff] text-black font-bold uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(255,0,255,0.4)] hover:shadow-[0_0_25px_rgba(255,0,255,0.7)] flex items-center justify-center gap-2 mt-3 text-sm cursor-pointer font-['Sora']"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Registrando...
                  </>
                ) : (
                  <>
                    REGISTRARSE
                    <span className="material-symbols-outlined text-lg">how_to_reg</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm font-['Inter']">
              <p className="text-white/60 m-0">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-[#ffabf3] hover:text-white font-semibold transition-colors underline underline-offset-2 ml-1">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
