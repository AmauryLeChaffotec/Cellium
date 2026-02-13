import { getSessionId } from './session';

export function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const sessionId = getSessionId();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(sessionId && { 'X-Session-Id': sessionId }),
    },
  });
}
