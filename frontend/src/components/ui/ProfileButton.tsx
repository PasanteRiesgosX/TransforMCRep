import { useState, useRef, useEffect } from 'react';

interface StoredUser {
  fullName?: string;
  email?: string;
  area?: string;
  role?: string;
}

export default function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as StoredUser);
      } catch {
        setUser(null);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#1b1b1b] hover:bg-[#2a2a2a] transition-colors cursor-pointer border border-white/10"
      >
        <span className="material-symbols-outlined text-white text-xl">person</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#131313] rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden z-50 animate-fade-in">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-display font-bold text-white text-base">{user?.fullName || 'Usuario'}</h3>
            <p className="font-body text-sm text-[#CCCCCC]">{user?.email || 'Correo no disponible'}</p>
          </div>
          <div className="p-4 border-b border-white/10 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-body text-xs text-gray-400">Área</span>
              <span className="font-body text-sm font-medium text-white">{user?.area || 'No disponible'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body text-xs text-gray-400">Rol</span>
              <span className="font-body text-sm font-medium text-[#00D7D0]">{user?.role || 'No disponible'}</span>
            </div>
          </div>
          <div className="p-2">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-[#F582A2] hover:bg-white/5 rounded-lg transition-colors cursor-pointer font-body flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
