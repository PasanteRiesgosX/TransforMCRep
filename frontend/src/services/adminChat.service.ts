import api from './api';

export type AdminChatRole = 'user' | 'assistant';

export interface AdminChatMessage {
  role: AdminChatRole;
  content: string;
}

export const ADMIN_CHAT_MAX_MESSAGE_CHARACTERS = 500;
export const ADMIN_CHAT_MAX_TURNS = 15;
const ADMIN_CHAT_STORAGE_PREFIX = 'admin-chat-session:';

export function getAdminChatStorageKey(userId: string): string {
  return `${ADMIN_CHAT_STORAGE_PREFIX}${userId}`;
}

export function clearAdminChatSessions(): void {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(ADMIN_CHAT_STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
});

export async function sendAdminChatMessage(
  message: string,
  history: AdminChatMessage[],
): Promise<string> {
  const response = await api.post<{ reply: string }>(
    '/chat/message',
    { message, history },
    { headers: getAuthHeaders() },
  );
  return response.data.reply;
}