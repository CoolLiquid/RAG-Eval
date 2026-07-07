const AUTH_SESSION_KEY = 'kb_eval_auth';
const REMEMBER_USERNAME_KEY = 'kb_eval_remember_username';

type AuthSession = {
  authenticated: true;
  username: string;
};

function getExpectedCredentials() {
  return {
    username: import.meta.env.VITE_AUTH_USERNAME ?? 'admin',
    password: import.meta.env.VITE_AUTH_PASSWORD ?? 'admin',
  };
}

function readSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    return session.authenticated ? session : null;
  } catch {
    return null;
  }
}

/** 迁移旧版 sessionStorage 会话，避免升级后同一浏览器内重复登录 */
function migrateLegacySession(): void {
  const legacy = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!legacy || localStorage.getItem(AUTH_SESSION_KEY)) return;

  localStorage.setItem(AUTH_SESSION_KEY, legacy);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function isAuthenticated(): boolean {
  migrateLegacySession();
  return Boolean(readSession());
}

export function getRememberedUsername(): string | null {
  return localStorage.getItem(REMEMBER_USERNAME_KEY);
}

export function login(username: string, password: string, remember: boolean): boolean {
  const expected = getExpectedCredentials();
  if (username !== expected.username || password !== expected.password) {
    return false;
  }

  const session: AuthSession = { authenticated: true, username };
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

  if (remember) {
    localStorage.setItem(REMEMBER_USERNAME_KEY, username);
  } else {
    localStorage.removeItem(REMEMBER_USERNAME_KEY);
  }

  return true;
}

export function getCurrentUsername(): string | null {
  migrateLegacySession();
  return readSession()?.username ?? null;
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
}
