import { auth } from '@/config/firebase';
import { apiFetch } from '@/constants/api';
import authService from '@/services/authServiceFirebaseJS';
import { setApiAuthHandler } from '@/utils/apiAuthHandler';
import { clearAuthData, getRefreshToken, getToken, getUser, storeAuthData } from '@/utils/storage';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    token: string;
    profilePicture?: string;
    profilePhoto?: string;
    gender?: 'male' | 'female';
    handle?: string;
    followers?: number;
    following?: number;
    // Add any other user properties here
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    register: (userData: { name: string; username: string; email: string; password: string; phoneNumber: string; referralCode?: string }) => Promise<any>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    // Firebase OTP methods
    loginWithOTP: (phoneNumber: string) => Promise<any>;
    verifyOTP: (otp: string) => Promise<any>;
    firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    updateUser: () => {},
    loginWithOTP: async () => {},
    verifyOTP: async () => {},
    firebaseUser: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [userStateVersion, setUserStateVersion] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                const userData = await getUser();
                if (__DEV__) {
                    console.log('🔄 AuthContext - Loading from storage:', { hasToken: !!token, hasUserData: !!userData });
                }

                if (token && userData) {
                    const userWithToken = { ...userData, token };
                    setUser(userWithToken);
                    setUserStateVersion(prev => prev + 1);
                }
            } catch (e) {
                console.error("❌ Failed to load user from storage:", e);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    // 401 handler: refresh token and retry, or redirect to login
    useEffect(() => {
        const refreshAndGetToken = async (): Promise<string | null> => {
            try {
                const refreshToken = await getRefreshToken();
                if (!refreshToken) return null;
                const res = await apiFetch('/auth/refresh', {
                    method: 'POST',
                    body: { refreshToken },
                });
                if (!res.ok || !res.data) return null;
                const { token: newToken, refreshToken: newRefreshToken, user: userData } = res.data;
                if (!newToken) return null;
                const userWithToken = { ...userData, token: newToken } as User;
                setUser(userWithToken);
                await storeAuthData(newToken, userData, newRefreshToken ?? null);
                return newToken;
            } catch {
                return null;
            }
        };
        const on401 = () => {
            clearAuthData();
            setUser(null);
            setFirebaseUser(null);
            try {
                auth.signOut();
            } catch {}
            router.replace('/login');
        };
        setApiAuthHandler({ refreshAndGetToken, on401 });
        return () => setApiAuthHandler(null);
    }, [router]);

    // Firebase Auth State Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setFirebaseUser(firebaseUser);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {

        const trimmedEmail = (email || '').trim();
        const trimmedPassword = (password || '').trim();
        const looksLikePhone = /^\+?\d{10,15}$/.test(trimmedEmail);

        const candidateBodies: Array<{ label: string; body: any }> = [];
        // Primary guess based on input format
        if (looksLikePhone) {
            candidateBodies.push({ label: 'phoneNumber', body: { phoneNumber: trimmedEmail, password: trimmedPassword } });
            candidateBodies.push({ label: 'emailOrPhone', body: { emailOrPhone: trimmedEmail, password: trimmedPassword } });
        } else {
            candidateBodies.push({ label: 'email', body: { email: trimmedEmail, password: trimmedPassword } });
            candidateBodies.push({ label: 'identifier', body: { identifier: trimmedEmail, password: trimmedPassword } });
            candidateBodies.push({ label: 'username', body: { username: trimmedEmail, password: trimmedPassword } });
            candidateBodies.push({ label: 'emailOrPhone', body: { emailOrPhone: trimmedEmail, password: trimmedPassword } });
        }

        let lastError: any = null;
        for (const attempt of candidateBodies) {
            try {
                const response = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: attempt.body,
                });


                if (response.ok) {
                    const { token, refreshToken, user: userData } = response.data;
                    const userWithToken = { ...userData, token } as any;

                    if (__DEV__) console.log('✅ Login - User state set and data stored');
                    setUser(userWithToken);
                    await storeAuthData(token, userData, refreshToken ?? null);
                    return userWithToken;
                } else {
                    lastError = response.data || response;
                }
            } catch (error: any) {
                console.error('Login attempt failed for payload shape:', attempt.label, error);
                lastError = error;
            }
        }

        console.error('All login attempts failed. Last error:', lastError);
        throw lastError || { message: 'Login failed. Please try again.' };
    };

    const register = async (userData: { name: string; username: string; email: string; password: string; phoneNumber: string; referralCode?: string }) => {

        try {
            const response = await apiFetch('/auth/register', {
                method: 'POST',
                body: userData,
            });


            if (response.ok) {
                const { token, refreshToken, user: registeredUser } = response.data;
                const userWithToken = { ...registeredUser, token };
                setUser(userWithToken);
                await storeAuthData(token, registeredUser, refreshToken ?? null);
                return userWithToken;
            } else {
                if (response.data?.message) throw new Error(response.data.message);
                if (response.data?.error) throw new Error(response.data.error);
                throw new Error('Registration failed. Please try again.');
            }
        } catch (error: any) {
            // 429 rate limit
            if (error?.status === 429 || error?.data?.statusCode === 429) {
                throw new Error('Too many attempts. Please try again later.');
            }
            if (error?.data?.message) throw new Error(error.data.message);
            if (error?.message) throw error;
            throw new Error('Registration failed. Please try again.');
        }
    };

    const logout = async () => {
        try {
            const refreshToken = await getRefreshToken();
            if (refreshToken) {
                await apiFetch('/auth/logout', {
                    method: 'POST',
                    body: { refreshToken },
                });
            }
        } catch (e) {
            if (__DEV__) console.warn('Logout API call failed:', e);
        }
        setUser(null);
        setFirebaseUser(null);
        await clearAuthData();
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Firebase sign out error:', error);
        }
        router.replace('/login');
    };

    const updateUser = (userData: Partial<User>) => {
        setUser(prevUser => prevUser ? { ...prevUser, ...userData } as User : null);
    };

    // Firebase OTP Methods
    const loginWithOTP = async (phoneNumber: string) => {
        try {
            if (__DEV__) console.log('🔥 Starting OTP login for:', phoneNumber);
            const result = await authService.sendOTP(phoneNumber);
            return result;
        } catch (error) {
            console.error('OTP login error:', error);
            throw error;
        }
    };

    const verifyOTP = async (otp: string) => {
        try {
            if (__DEV__) console.log('🔥 Verifying OTP in AuthContext');
            const result = await authService.verifyOTP(otp);

            if (result.success && result.user) {
                const firebaseToken = await result.user.getIdToken();
                
                try {
                    const backendResponse = await apiFetch('/auth/firebase', {
                        method: 'POST',
                        body: {
                            idToken: firebaseToken,
                            phoneNumber: result.user.phoneNumber,
                        },
                    });

                    if (backendResponse.ok) {
                        const { token, refreshToken, user: userData } = backendResponse.data;
                        const userWithToken = { ...userData, token };

                        if (__DEV__) console.log('✅ OTP login complete - Backend token stored');
                        setUser(userWithToken);
                        setUserStateVersion(prev => prev + 1);
                        await storeAuthData(token, userWithToken, refreshToken ?? null);
                        return { success: true, user: userWithToken };
                    } else {
                        console.error('❌ Backend /auth/firebase failed:', backendResponse.data);
                        throw new Error(backendResponse.data?.message || 'Backend authentication failed');
                    }
                } catch (backendError: any) {
                    console.error('❌ Backend /auth/firebase error:', backendError);
                    throw new Error(backendError.data?.message || backendError.message || 'Backend authentication failed');
                }
            } else {
                throw new Error(result.message || 'OTP verification failed');
            }
        } catch (error) {
            console.error('❌ OTP verification error in AuthContext:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        loginWithOTP,
        verifyOTP,
        firebaseUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 