/**
 * Global handler for 401: refresh token and retry, or redirect to login.
 * AuthContext sets this on mount so apiFetchAuth can use it without circular deps.
 */

export type ApiAuthHandler = {
  refreshAndGetToken: () => Promise<string | null>;
  on401: () => void;
};

let handler: ApiAuthHandler | null = null;

export function setApiAuthHandler(h: ApiAuthHandler | null) {
  handler = h;
}

export function getApiAuthHandler(): ApiAuthHandler | null {
  return handler;
}
