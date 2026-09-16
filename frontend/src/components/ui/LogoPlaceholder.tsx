import logo from '../../assets/img/multidef.svg';

interface LogoPlaceholderProps {
  variant?: 'topbar' | 'large';
}

export default function LogoPlaceholder({ variant = 'topbar' }: LogoPlaceholderProps) {
  const sizeClass = variant === 'topbar' ? 'h-8 w-auto' : 'h-16 w-auto';
  
  return (
    <img 
      src={logo} 
      alt="Institution Logo" 
      className={sizeClass} 
    />
  );
}
