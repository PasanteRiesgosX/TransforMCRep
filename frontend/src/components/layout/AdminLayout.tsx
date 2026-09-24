import { Outlet, NavLink } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import AppHeader from './AppHeader';
import clsx from 'clsx';

const SIDEBAR_ITEMS = [
  {
    path: '/admin/questions',
    label: 'Preguntas',
    icon: HelpCircle
  },
  // Preparado para crecer
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0e0e0e] text-white">
      <AppHeader />
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-[#121212] flex flex-col p-4 gap-2 shrink-0">
          <div className="mb-4 px-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Menú Admin</h2>
          </div>
          <nav className="flex flex-col gap-2">
            {SIDEBAR_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive 
                    ? "bg-[#00D7D0]/10 text-[#00D7D0] font-medium" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 w-full bg-[#0e0e0e] overflow-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
