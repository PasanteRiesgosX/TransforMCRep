import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Bot, LoaderCircle, RotateCcw, Send, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ADMIN_CHAT_MAX_MESSAGE_CHARACTERS,
  ADMIN_CHAT_MAX_TURNS,
  getAdminChatStorageKey,
  sendAdminChatMessage,
} from '../../services/adminChat.service';
import type { AdminChatMessage } from '../../services/adminChat.service';

interface StoredChatState {
  messages: AdminChatMessage[];
  turnsUsed: number;
}

interface DisplayMessage extends AdminChatMessage {
  id: string;
}

interface AdminChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function loadStoredState(storageKey: string): StoredChatState {
  try {
    const rawState = sessionStorage.getItem(storageKey);
    if (!rawState) return { messages: [], turnsUsed: 0 };

    const state = JSON.parse(rawState) as Partial<StoredChatState>;
    const messages = Array.isArray(state.messages)
      ? state.messages.filter((message): message is AdminChatMessage =>
          Boolean(message) &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string',
        )
      : [];
    const turnsUsed = Number.isInteger(state.turnsUsed)
      ? Math.min(Math.max(state.turnsUsed as number, 0), ADMIN_CHAT_MAX_TURNS)
      : messages.filter(message => message.role === 'user').length;

    return { messages, turnsUsed };
  } catch {
    return { messages: [], turnsUsed: 0 };
  }
}

export default function AdminChatPanel({ isOpen, onClose }: AdminChatPanelProps) {
  const { user } = useAuth();
  const storageKey = getAdminChatStorageKey(user?.id ?? 'unknown');
  const [storedState, setStoredState] = useState<StoredChatState>(() => loadStoredState(storageKey));
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    storedState.messages.map((message, index) => ({ ...message, id: `restored-${index}` })),
  );
  const [turnsUsed, setTurnsUsed] = useState(storedState.turnsUsed);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextState = {
      messages: messages.map(({ role, content }) => ({ role, content })),
      turnsUsed,
    };
    setStoredState(nextState);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(nextState));
    } catch {
      setSendError('No fue posible guardar esta conversación en la sesión del navegador.');
    }
  }, [messages, storageKey, turnsUsed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending || turnsUsed >= ADMIN_CHAT_MAX_TURNS) return;

    const optimisticId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const history = messages.map(({ role, content: messageContent }) => ({
      role,
      content: messageContent,
    }));

    setMessages(current => [...current, { id: optimisticId, role: 'user', content }]);
    setTurnsUsed(current => current + 1);
    setDraft('');
    setSendError('');
    setIsSending(true);

    try {
      const reply = await sendAdminChatMessage(content, history);
      setMessages(current => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
      }]);
    } catch {
      setMessages(current => current.filter(message => message.id !== optimisticId));
      setTurnsUsed(current => Math.max(current - 1, 0));
      setDraft(content);
      setSendError('No se pudo enviar el mensaje. El texto se conservó para que puedas reintentar.');
    } finally {
      setIsSending(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setTurnsUsed(0);
    setDraft('');
    setSendError('');
    setStoredState({ messages: [], turnsUsed: 0 });
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      setSendError('No fue posible limpiar el almacenamiento de la sesión.');
    }
  };

  const turnRatio = (turnsUsed / ADMIN_CHAT_MAX_TURNS) * 100;
  const quotaReached = turnsUsed >= ADMIN_CHAT_MAX_TURNS;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Cerrar asistente"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 motion-reduce:transition-none ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Chat con lineamientos oficiales"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/10 bg-[#111719] text-white shadow-2xl transition-transform duration-300 motion-reduce:transition-none ${isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'}`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#00D7D0]/15 text-[#00D7D0]">
              <Bot size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">Asistente de lineamientos</h2>
              <p className="text-xs text-slate-400">Responde con base en el documento oficial</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar chat"
            className="grid size-9 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00D7D0]"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <section className="flex shrink-0 flex-col gap-2 border-b border-white/10 px-5 py-3" aria-label="Uso de la sesión">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-300">Consultas de esta sesión</span>
            <span className="font-mono text-[#7DE5DF]">{turnsUsed} / {ADMIN_CHAT_MAX_TURNS}</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Consultas utilizadas"
            aria-valuemin={0}
            aria-valuemax={ADMIN_CHAT_MAX_TURNS}
            aria-valuenow={turnsUsed}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${quotaReached ? 'bg-rose-400' : 'bg-[#00D7D0]'}`}
              style={{ width: `${turnRatio}%` }}
            />
          </div>
        </section>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="my-auto flex flex-col items-center gap-3 px-5 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-white/5 text-[#00D7D0]">
                <Bot size={28} aria-hidden="true" />
              </span>
              <p className="text-sm leading-6 text-slate-300">
                Pregunta sobre la metodología, la evaluación o los criterios oficiales. Las respuestas se basan en los lineamientos y citan sus secciones.
              </p>
            </div>
          )}
          {messages.map(message => (
            <div
              key={message.id}
              className={`max-w-[88%] break-words rounded-xl px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'self-end whitespace-pre-wrap rounded-br-sm bg-[#007F7A] text-white'
                  : 'self-start rounded-bl-sm border border-white/10 bg-[#1B2427] text-slate-100 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_strong]:text-white [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 self-start rounded-xl rounded-bl-sm border border-white/10 bg-[#1B2427] px-4 py-3 text-sm text-slate-300">
              <LoaderCircle size={16} className="animate-spin text-[#00D7D0]" aria-hidden="true" />
              <span>Consultando los lineamientos…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="shrink-0 border-t border-white/10 px-5 py-4">
          {sendError && <p role="alert" className="mb-3 text-sm text-rose-300">{sendError}</p>}
          {quotaReached ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">La sesión alcanzó su límite para mantener acotado el contexto.</p>
              <button
                type="button"
                onClick={resetConversation}
                disabled={isSending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#00D7D0] px-4 text-sm font-semibold text-[#082021] transition hover:bg-[#53e0da] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Reiniciar conversación
              </button>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="flex items-end gap-3">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Escribe tu consulta</span>
                <textarea
                  rows={2}
                  maxLength={ADMIN_CHAT_MAX_MESSAGE_CHARACTERS}
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Escribe una consulta…"
                  disabled={isSending}
                  className="max-h-36 min-h-12 w-full resize-y rounded-md border border-white/15 bg-[#0D1214] px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00D7D0] focus:outline-none disabled:opacity-60"
                />
                <span className="mt-1 block text-right text-[11px] text-slate-500">
                  {draft.length}/{ADMIN_CHAT_MAX_MESSAGE_CHARACTERS}
                </span>
              </label>
              <button
                type="submit"
                aria-label="Enviar consulta"
                title="Enviar consulta"
                disabled={!draft.trim() || isSending}
                className="mb-5 grid size-11 shrink-0 place-items-center rounded-md bg-[#00D7D0] text-[#082021] transition hover:bg-[#53e0da] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D7D0] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          )}
        </footer>
      </aside>
    </>,
    document.body,
  );
}