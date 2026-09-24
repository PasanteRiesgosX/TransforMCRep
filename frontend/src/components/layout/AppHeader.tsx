import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LogoPlaceholder from '../ui/LogoPlaceholder';
import ProfileButton from '../ui/ProfileButton';

export default function AppHeader() {
  const { user } = useAuth();

  return (
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
          <Link to="/survey" className="results-frame inline-flex items-center font-display font-medium text-sm text-white hover:text-[#00D7D0] glow-text transition-colors cursor-pointer">
            EVALUACIÓN
          </Link>
          <Link to="/results" className="results-frame inline-flex items-center font-display font-medium text-sm text-white hover:text-[#FFD200] glow-text transition-colors cursor-pointer">
            RESULTADOS
          </Link>
          
          {user?.appRole === 'ADMIN' && (
            <Link to="/admin/questions" className="results-frame inline-flex items-center font-display font-medium text-sm text-[#FFABF3] hover:text-white glow-text transition-colors cursor-pointer">
              ADMINISTRACIÓN
            </Link>
          )}

          <ProfileButton />
        </div>
      </div>
    </header>
  );
}
