import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoImg from '../assets/img/logo.png';

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const [area, setArea] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validar si el usuario está logueado
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !position) {
      setError('Debes seleccionar un área y un cargo.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (!userStr || !token) throw new Error('No estás autenticado.');

      const user = JSON.parse(userStr);
      const API_BASE_URL = 'http://localhost:3000'; // Ajustar según entorno

      const response = await axios.post(
        `${API_BASE_URL}/auth/complete-profile`,
        { email: user.email, area, position },
        { headers: { Authorization: `Bearer ${token}` } } // Por si aplicamos guards después
      );

      // Actualizar localStorage con los nuevos datos
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/survey');
    } catch (err: unknown) {
      console.error('Error completando perfil', err);
      const message = axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
        ? err.response.data.message
        : 'Ocurrió un error al guardar tu perfil.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative selection:bg-primary selection:text-black bg-surface-container-lowest">
      {/* Background cyber effect */}
      <div className="absolute inset-0 pointer-events-none cyber-bg" />

      <div className="w-11/12 max-w-2xl min-h-[300px] relative z-10 glass-panel rounded-2xl px-10 py-20 sm:px-16 sm:py-24">
        {/* Floating Logo */}
        <img
          src={logoImg}
          alt="NEON ARCH Logo"
          className="absolute -bottom-10 -left-10 w-28 h-auto z-40 drop-shadow-[0_0_14px_rgba(0,215,208,0.45)]"
        />
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-tertiary to-transparent" />

        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-white mb-3">
            Solo un paso más
          </h1>
          <p className="text-base text-on-surface-variant font-body m-0">
            Antes de continuar, selecciona tu área y cargo dentro de la organización.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center justify-center gap-2 max-w-sm mx-auto">
            <span className="material-symbols-outlined text-lg">error</span>
            <p className="m-0">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 items-center">
          {/* Área */}
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <label htmlFor="area" className="text-tertiary text-xs font-bold uppercase tracking-wider font-mono text-center">
              Área
            </label>
            <div className="relative w-full">
              <span aria-hidden="true" className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">domain</span>
              <select
                id="area"
                className="w-full bg-surface-container-lowest border border-white/15 rounded-lg py-3.5 pl-14 pr-4 text-white font-body text-sm outline-none neon-input appearance-none text-center"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
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
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <label htmlFor="position" className="text-tertiary text-xs font-bold uppercase tracking-wider font-mono text-center">
              Cargo
            </label>
            <div className="relative w-full">
              <span aria-hidden="true" className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">badge</span>
              <select
                id="position"
                className="w-full bg-surface-container-lowest border border-white/15 rounded-lg py-3.5 pl-14 pr-4 text-white font-body text-sm outline-none neon-input appearance-none text-center"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                disabled={loading}
              >
                <option value="" disabled>Selecciona un cargo</option>
                <option value="Asistente">Asistente</option>
                <option value="Analista">Analista</option>
                <option value="Especialista">Especialista</option>
                <option value="Gerente Complejo">Gerente Complejo</option>
                <option value="Gerente de Área">Gerente de Área</option>
              </select>
            </div>
          </div>

          <button
            className="w-full max-w-sm mx-auto py-4 bg-primary hover:bg-[#ff80eb] text-black font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 mt-4 text-sm font-display shadow-[0_0_15px_rgba(255,171,243,0.4)] hover:shadow-[0_0_25px_rgba(255,171,243,0.7)] hover:-translate-y-[1px] glow-text transition-all duration-300"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                CONTINUAR
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
