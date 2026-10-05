import { useOutletContext } from 'react-router-dom';
import clsx from 'clsx';

export default function CandidatosPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();

  return (
    <div className={clsx("p-8 h-full flex flex-col items-center justify-center", isDarkMode ? "text-white" : "text-gray-900")}>
      <h1 className="text-3xl font-bold mb-4">Candidatos Elegidos</h1>
      <p className="text-lg opacity-70">
        Esta sección es un placeholder para futuras integraciones.
      </p>
    </div>
  );
}
