import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AzureCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        setError('No se recibió código de autorización.');
        return;
      }

      try {
        // Enviar el code al backend
        const API_BASE_URL = 'http://localhost:3000'; // Ajustar según entorno
        const response = await axios.post(`${API_BASE_URL}/auth/azure-callback`, { code });

        const { accessToken, user } = response.data;

        // Guardar token y usuario
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirigir según el estado del perfil
        if (user.area === 'Por Definir' || user.position === 'Por Definir') {
          navigate('/complete-profile');
        } else {
          navigate('/survey');
        }
      } catch (err: any) {
        console.error('Error durante la autenticación de Azure', err);
        setError(err.response?.data?.message || 'Error durante la autenticación de Azure.');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#0e0e0e', color: 'white' }}>
      <h1 className="text-2xl font-['Sora'] mb-4">Autenticando...</h1>
      
      {error ? (
        <div className="p-4 bg-red-950/50 border border-red-500/30 text-red-300 rounded-lg max-w-md text-center">
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-white font-bold"
          >
            Volver a inicio de sesión
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-[#00D7D0] mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-white/70 font-['Inter']">Procesando credenciales de Microsoft...</p>
        </div>
      )}
    </div>
  );
}
