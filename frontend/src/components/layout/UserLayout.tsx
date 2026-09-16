import { Outlet } from 'react-router-dom';
import LogoPlaceholder from '../ui/LogoPlaceholder';
import ProfileButton from '../ui/ProfileButton';

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0e0e0e] text-white">
      <header className="h-12 md:h-14 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 w-full">
        <div className="container mx-auto pl-16 pr-8 md:pl-5 md:pr-10 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <LogoPlaceholder variant="topbar" />
            <div className="w-px h-6 bg-white/20"></div>
            <span className="font-body font-normal text-base md:text-lg tracking-wide text-white">
              TransforMC
            </span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-7">  
            <button className="results-frame inline-flex items-center font-display font-medium text-sm text-white hover:text-[#FFD200] glow-text transition-colors cursor-pointer">
              RESULTADOS
            </button>
            <ProfileButton />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
