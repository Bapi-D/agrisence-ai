const AUTH_STORAGE_KEY = "agrisense-auth-session";

export function getStoredAuthSession() {
  try {
    const value = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function setStoredAuthSession(session: unknown) {
  try {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(session)
    );
  } catch {
    // Ignore storage errors.
  }
}

export function clearStoredAuthSession() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}