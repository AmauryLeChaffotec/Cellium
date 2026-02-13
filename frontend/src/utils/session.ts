const SESSION_KEY = 'cellium-session-id';
const AUTHOR_KEY = 'cellium-author';

export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function getAuthor(): string {
  return localStorage.getItem(AUTHOR_KEY) ?? '';
}

export function setAuthor(name: string): void {
  localStorage.setItem(AUTHOR_KEY, name);
}

export async function initSession(): Promise<string> {
  const existing = getSessionId();
  if (existing) {
    const res = await fetch(`/api/session/${existing}`);
    if (res.ok) return existing;
  }

  const res = await fetch('/api/session', { method: 'POST' });
  const { sessionId } = await res.json();
  setSessionId(sessionId);
  return sessionId;
}
