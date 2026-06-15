import { auth } from '@/config/firebase';
import { apiFetch } from '@/constants/api';
import { isDummyOTP, isDummyPhone } from '@/lib/dummy-auth';
import authService from '@/services/authServiceFirebaseJS';
import { setApiAuthHandler } from '@/utils/apiAuthHandler';
import { clearAuthData, getRefreshToken, getToken, getUser, storeAuthData } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

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
    logout: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    // Firebase OTP methods (same flow as web)
    loginWithOTP: (phoneNumber: string, appVerifier: any) => Promise<any>;
    verifyOTP: (otp: string) => Promise<any>;
    verifyDummyOTP: (phoneNumber: string, otp: string) => Promise<any>;
    firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    updateUser: () => {},
    loginWithOTP: async () => {},
    verifyOTP: async () => {},
    verifyDummyOTP: async () => {},
    firebaseUser: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [userStateVersion, setUserStateVersion] = useState(0);
    const isLoggingOutRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                const userData = await getUser();

                if (token && userData) {
                    const userWithToken = { ...userData, token };
                    setUser(userWithToken);
                    setUserStateVersion(prev => prev + 1);
                }
            } catch {
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
        const on401 = async () => {
            setUser(null);
            setFirebaseUser(null);
            await clearAuthData();
            authService.clearSession();
            try {
                auth.signOut();
            } catch {}
            router.replace('/phone-login');
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

                                        setUser(userWithToken);
                    await storeAuthData(token, userData, refreshToken ?? null);
                    return userWithToken;
                } else {
                    lastError = response.data || response;
                }
            } catch (error: any) {
                                lastError = error;
            }
        }

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
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;

        const refreshToken = await getRefreshToken();

        // Local session clear first — don't block on slow/unreachable backend
        setUser(null);
        setFirebaseUser(null);
        await clearAuthData();
        authService.clearSession();

        try {
            await auth.signOut();
        } catch {}

        if (refreshToken) {
            apiFetch('/auth/logout', {
                method: 'POST',
                body: { refreshToken },
            }).catch(() => {});
        }

        try {
            if (typeof router.canDismiss === 'function' && router.canDismiss()) {
                router.dismissAll();
            }
        } catch {}

        router.replace('/phone-login');
        isLoggingOutRef.current = false;
    };

    const updateUser = (userData: Partial<User>) => {
        setUser(prevUser => prevUser ? { ...prevUser, ...userData } as User : null);
    };

    // Firebase OTP — Step 1: backend validate, Step 2: Firebase SMS (web jaisa)
    const loginWithOTP = async (phoneNumber: string, appVerifier: any) => {
        const trimmed = (phoneNumber || '').trim();
        const normalized = trimmed.startsWith('+') ? trimmed : `+91${trimmed.replace(/\D/g, '')}`;

        const validateRes = await apiFetch('/auth/send-otp', {
            method: 'POST',
            headers: { 'X-App-Client': 'expo', 'X-Auth-Provider': 'firebase', 'X-Token-Type': 'firebase-jwt', 'X-Client-Type': 'mobile-app' },
            body: { phoneNumber: normalized },
        });

        const validateData = validateRes.data;
        if (!validateRes.ok || !validateData?.success) {
            throw new Error(validateData?.error || validateData?.message || 'Phone validation failed');
        }

        const validatedPhone = validateData.phoneNumber || normalized;
        const result = await authService.sendOTP(validatedPhone, appVerifier);

        if (!result.success) {
            throw new Error(result.message || 'Failed to send OTP');
        }

        return { ...result, phoneNumber: validatedPhone };
    };

    const verifyOTP = async (otp: string) => {
        const result = await authService.verifyOTP(otp);

        if (!result.success || !result.user) {
            throw new Error(result.message || 'OTP verification failed');
        }

        const idToken = await result.user.getIdToken();
        const backendResponse = await apiFetch('/auth/firebase', {
            method: 'POST',
            headers: { 'X-Auth-Provider': 'firebase', 'X-Token-Type': 'firebase-jwt', 'X-Client-Type': 'mobile-app' },
            body: { idToken },
        });

        if (!backendResponse.ok) {
            throw new Error(backendResponse.data?.error || backendResponse.data?.message || 'Login failed');
        }

        const { token, refreshToken, user: userData } = backendResponse.data;
        const userWithToken = { ...userData, token };

        setUser(userWithToken);
        setUserStateVersion(prev => prev + 1);
        await storeAuthData(token, userData, refreshToken ?? null);
        return { success: true, user: userWithToken };
    };

    const verifyDummyOTP = async (phoneNumber: string, otp: string) => {
        if (!isDummyPhone(phoneNumber) || !isDummyOTP(otp)) {
            throw new Error('Invalid dummy phone or OTP');
        }

        const backendResponse = await apiFetch('/auth/dummy-login', {
            method: 'POST',
            headers: { 'X-Auth-Provider': 'firebase', 'X-Token-Type': 'firebase-jwt', 'X-Client-Type': 'mobile-app' },
            body: { phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`, otp },
        });

        if (!backendResponse.ok) {
            throw new Error(backendResponse.data?.error || backendResponse.data?.message || 'Login failed');
        }

        const { token, refreshToken, user: userData } = backendResponse.data;
        const userWithToken = { ...userData, token };

        setUser(userWithToken);
        setUserStateVersion(prev => prev + 1);
        await storeAuthData(token, userData, refreshToken ?? null);
        return { success: true, user: userWithToken };
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
        verifyDummyOTP,
        firebaseUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 