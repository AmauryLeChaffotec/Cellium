import { getSessionId } from './session';
import { getAuthToken } from '../stores/authStore';

export function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const sessionId = getSessionId();
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(sessionId && { 'X-Session-Id': sessionId }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
