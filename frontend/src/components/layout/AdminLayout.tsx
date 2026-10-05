import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { HelpCircle, BarChart2, PieChart, Users, Sun, Moon } from 'lucide-react';
import AppHeader from './AppHeader';
import clsx from 'clsx';

const SIDEBAR_ITEMS = [
  { path: '/admin/questions', label: 'Preguntas', icon: HelpCircle },
  { path: '/admin/areas-cargos', label: 'Vista por Áreas y Cargos (A & C)', icon: BarChart2 },
  { path: '/admin/categorias-dimensiones', label: 'Vista por Categorías y Dimensiones (C & D)', icon: PieChart },
  { path: '/admin/candidatos', label: 'Candidatos elegidos', icon: Users },
];

export default function AdminLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={clsx(
      "min-h-screen flex flex-col transition-colors duration-300",
      isDarkMode ? "bg-[#0e0e0e] text-white" : "bg-gray-50 text-gray-900"
    )}>
      <AppHeader />
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <aside className={clsx(
          "w-72 border-r flex flex-col p-4 gap-2 shrink-0 transition-colors duration-300",
          isDarkMode ? "bg-[#121212] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="mb-4 px-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Menú Admin
            </h2>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={clsx(
                "p-2 rounded-full transition-colors",
                isDarkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            {SIDEBAR_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive 
                    ? (isDarkMode ? "bg-[#00D7D0]/10 text-[#00D7D0] font-medium" : "bg-[#00D7D0]/10 text-[#009e99] font-medium")
                    : (isDarkMode ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100")
                )}
              >
                <item.icon size={18} />
                <span className="leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className={clsx(
          "flex-1 w-full overflow-auto relative transition-colors duration-300",
          isDarkMode ? "bg-[#0e0e0e]" : "bg-gray-50"
        )}>
          <div className="h-full">
             <Outlet context={{ isDarkMode }} />
          </div>
        </main>
      </div>
    </div>
  );
}
