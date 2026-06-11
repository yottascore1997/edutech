import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

/** Store access token, optional refresh token, and user. Use for login/refresh. */
export async function storeAuthData(token: string, user: any, refreshToken?: string | null) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    if (refreshToken != null) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch {
    // ignore secure store errors
  }
}

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken() {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getUser() {
  try {
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    await clearAuthData();
    return null;
  }
}

export async function clearAuthData() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // ignore
  }
}
