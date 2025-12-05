import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Store all auth data
export async function storeAuthData(token: string, user: any) {
  try {
    console.log('💾 Storing auth data:', {
      tokenLength: token.length,
      userId: user.id,
      userName: user.name,
      hasPhoneNumber: !!user.phoneNumber,
      hasToken: !!user.token
    });

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    console.log('✅ Auth data stored successfully');
  } catch (error) {
    console.error('❌ Failed to save auth data to storage:', error);
  }
}

// Get the auth token
export async function getToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    console.log('Retrieved token:', token ? token.substring(0, 10) + '...' : 'null');
    return token;
  } catch (error) {
    console.error('Failed to fetch token from storage', error);
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
    console.log('Retrieved user data:', {
      id: user.id,
      name: user.name,
      hasToken: !!user.token,
      phoneNumber: user.phoneNumber
    });
    return user;
  } catch (error) {
    console.error('❌ Failed to fetch user from storage:', error);
    console.error('❌ User data might be corrupted, clearing storage');
    // Clear corrupted data
    await clearAuthData();
    return null;
  }
}

// Clear all auth data
export async function clearAuthData() {
  try {
    console.log('🗑️ Clearing auth data from storage');
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    console.log('✅ Auth data cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear auth data from storage:', error);
  }
} 