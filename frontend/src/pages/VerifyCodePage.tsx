import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyCode, resendCode, getErrorMessage } from '../services/api';
import './VerifyCodePage.css';

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Ingresa los 6 dígitos del código de verificación.');
      return;
    }

    setLoading(true);

    try {
      const response = await verifyCode({ email, code: fullCode });
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      setSuccess('¡Verificación exitosa! Redirigiendo...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setResending(true);

    try {
      await resendCode({ email });
      setSuccess('Se ha reenviado un nuevo código a tu correo.');
      setResendCooldown(60);
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-page__bg" />

      <div className="verify-card">
        <div className="verify-card__accent" />

        <div className="verify-card__header">
          <div className="verify-card__icon-box">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>verified_user</span>
          </div>
          <h1 className="verify-card__title">Verificación de Seguridad</h1>
          <p className="verify-card__subtitle">Hemos enviado un código de 6 dígitos a:</p>
          <p className="verify-card__email">{email}</p>
          <p className="verify-card__hint">El código expira en 15 minutos.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="verify-alert verify-alert--error">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="verify-alert verify-alert--success">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
            <p>{success}</p>
          </div>
        )}

        {/* Code Input */}
        <form onSubmit={handleSubmit}>
          <div className="verify-code-inputs" onPaste={handlePaste}>
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="verify-code-input"
                disabled={loading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Submit */}
          <button className="verify-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <svg className="login-spinner" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verificando...
              </>
            ) : (
              <>
                VERIFICAR CÓDIGO
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>shield</span>
              </>
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="verify-resend">
          <p className="verify-resend__text">¿No recibiste el código?</p>
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="verify-resend__btn"
          >
            {resending ? (
              'Reenviando...'
            ) : resendCooldown > 0 ? (
              `Reenviar en ${resendCooldown}s`
            ) : (
              'Reenviar código'
            )}
          </button>
        </div>

        {/* Back to Login */}
        <div className="verify-footer">
          <button onClick={() => navigate('/login')} className="verify-footer__btn">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}
