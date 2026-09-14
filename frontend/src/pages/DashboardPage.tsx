import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  area: string;
  role: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen cyber-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel p-8 md:p-10 rounded-2xl relative animate-fade-in text-center">
        {/* Highlight borders */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-primary/50 via-white/20 to-transparent rounded-t-2xl" />
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-primary/50 via-white/20 to-transparent rounded-l-2xl" />

        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-full glass-panel flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-primary text-4xl">dashboard</span>
        </div>

        {/* Welcome */}
        <h1 className="font-display text-3xl font-bold text-white mb-2 glow-text">
          Bienvenido
        </h1>
        <p className="text-primary font-display text-xl font-semibold mb-8">
          {user.fullName}
        </p>

        {/* User Info */}
        <div className="grid gap-4 text-left mb-8">
          <div className="glass-panel p-4 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">mail</span>
            <div>
              <p className="text-xs font-mono text-on-surface-variant/60 uppercase tracking-widest">Correo</p>
              <p className="text-white text-sm">{user.email}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">badge</span>
            <div>
              <p className="text-xs font-mono text-on-surface-variant/60 uppercase tracking-widest">Cargo</p>
              <p className="text-white text-sm">{user.role}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">domain</span>
            <div>
              <p className="text-xs font-mono text-on-surface-variant/60 uppercase tracking-widest">Área</p>
              <p className="text-white text-sm">{user.area}</p>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="glass-panel p-4 rounded-lg flex items-center justify-center gap-3 mb-8">
          <span className="material-symbols-outlined text-tertiary">check_circle</span>
          <p className="text-tertiary text-sm font-semibold">Sesión autenticada con 2FA</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-lg border border-white/20 text-on-surface-variant hover:text-white hover:border-primary/50 transition-all font-display text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
