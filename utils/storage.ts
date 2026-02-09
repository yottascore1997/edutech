import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

/** Store access token, optional refresh token, and user. Use for login/refresh. */
export async function storeAuthData(token: string, user: any, refreshToken?: string | null) {
  try {
    if (__DEV__) {
      console.log('💾 Storing auth data:', { userId: user?.id, hasToken: !!token, hasRefresh: !!refreshToken });
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    if (refreshToken != null) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    console.error('❌ Failed to save auth data to storage:', error);
  }
}

// Get the auth token (never log token value or substring)
export async function getToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (__DEV__) console.log('Retrieved token: present=', !!token);
    return token;
  } catch (error) {
    console.error('Failed to fetch token from storage', error);
    return null;
  }
}

// Get the refresh token (never log value or substring)
export async function getRefreshToken() {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to fetch refresh token from storage', error);
    return null;
  }
}

// Get the user data
export async function getUser() {
  try {
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    if (!userStr) {
      console.log('🔍 No user data found in storage');
      return null;
    }

    const user = JSON.parse(userStr);
    if (__DEV__) console.log('Retrieved user data:', { id: user?.id, hasData: !!user });
    return user;
  } catch (error) {
    console.error('❌ Failed to fetch user from storage:', error);
    console.error('❌ User data might be corrupted, clearing storage');
    // Clear corrupted data
    await clearAuthData();
    return null;
  }
}

// Clear all auth data (token, refresh token, user)
export async function clearAuthData() {
  try {
    if (__DEV__) console.log('🗑️ Clearing auth data from storage');
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('❌ Failed to clear auth data from storage:', error);
  }
} 