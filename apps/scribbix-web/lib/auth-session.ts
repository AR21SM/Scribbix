const AUTH_STORAGE_KEYS = {
  token: "token",
  userId: "userId",
  userName: "userName",
} as const;

interface AuthSessionInput {
  token: string;
  userId: string | number;
  userName?: string;
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.token);
}

export function getAuthSession() {
  return {
    token: getAuthToken(),
    userName: localStorage.getItem(AUTH_STORAGE_KEYS.userName) ?? "",
  };
}

export function saveAuthSession({ token, userId, userName }: AuthSessionInput) {
  localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
  localStorage.setItem(AUTH_STORAGE_KEYS.userId, String(userId));

  if (userName) {
    localStorage.setItem(AUTH_STORAGE_KEYS.userName, userName);
  }
}

export function clearAuthSession() {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
