import { auth } from '@/config/firebase';
import { apiFetch } from '@/constants/api';
import authService from '@/services/authServiceFirebaseJS';
import { clearAuthData, getToken, getUser, storeAuthData } from '@/utils/storage';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    token: string;
    profilePicture?: string;
    profilePhoto?: string;
    handle?: string;
    followers?: number;
    following?: number;
    // Add any other user properties here
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    register: (userData: { name: string; email: string; password: string; phoneNumber: string; referralCode?: string }) => Promise<any>;
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
    const [userStateVersion, setUserStateVersion] = useState(0); // Force re-renders

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                const userData = await getUser();
                console.log('🔄 AuthContext - Loading user from storage:', {
                    hasToken: !!token,
                    tokenLength: token?.length,
                    hasUserData: !!userData,
                    userId: userData?.id,
                    userName: userData?.name
                });

                if (token && userData) {
                    const userWithToken = { ...userData, token };
                    console.log('✅ AuthContext - User loaded with token:', {
                        id: userWithToken.id,
                        name: userWithToken.name,
                        hasToken: !!userWithToken.token,
                        tokenLength: userWithToken.token?.length
                    });
                    setUser(userWithToken);
                    setUserStateVersion(prev => prev + 1); // Force re-render
                    console.log('🔄 User state updated from storage');
                } else {
                    console.log('❌ AuthContext - Missing token or user data');
                    if (token) console.log('❌ Has token but no user data');
                    if (userData) console.log('❌ Has user data but no token');
                }
            } catch (e) {
                console.error("❌ Failed to load user from storage:", e);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

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
                    const { token, user: userData } = response.data;
                    const userWithToken = { ...userData, token } as any;

                    console.log('🔑 Login successful - Token details:', {
                        tokenLength: token?.length,
                        userId: userData?.id,
                        userName: userData?.name,
                        isFirebaseToken: token?.includes('eyJhbGciOiJSUzI1NiI') // Check if it's JWT
                    });

                    setUser(userWithToken);
                    await storeAuthData(token, userData);

                    console.log('✅ Login - User state set and data stored');
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

    const register = async (userData: { name: string; email: string; password: string; phoneNumber: string; referralCode?: string }) => {

        try {
            const response = await apiFetch('/auth/register', {
                method: 'POST',
                body: userData,
            });


            if (response.ok) {
                const { token, user: registeredUser } = response.data;
                const userWithToken = { ...registeredUser, token };
                setUser(userWithToken);
                await storeAuthData(token, registeredUser);
                return userWithToken;
            } else {
                // Handle different types of errors
                if (response.data && response.data.message) {
                    throw new Error(response.data.message);
                } else if (response.data && response.data.error) {
                    throw new Error(response.data.error);
                } else {
                    throw new Error('Registration failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Registration failed with error:', error);
            // Re-throw the error so it can be caught by the registration screen
            throw error;
        }
    };

    const logout = async () => {
        setUser(null);
        setFirebaseUser(null);
        await clearAuthData();
        // Also sign out from Firebase
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Firebase sign out error:', error);
        }
    };

    const updateUser = (userData: Partial<User>) => {
        setUser(prevUser => prevUser ? { ...prevUser, ...userData } as User : null);
    };

    // Firebase OTP Methods
    const loginWithOTP = async (phoneNumber: string) => {
        try {
            console.log('🔥 Starting OTP login for:', phoneNumber);
            const result = await authService.sendOTP(phoneNumber);
            return result;
        } catch (error) {
            console.error('OTP login error:', error);
            throw error;
        }
    };

    const verifyOTP = async (otp: string) => {
        try {
            console.log('🔥 Verifying OTP in AuthContext:', otp);
            const result = await authService.verifyOTP(otp);
            console.log('🔥 AuthContext - Firebase verifyOTP result:', result);

            if (result.success && result.user) {
                console.log('✅ OTP verified successfully, Firebase user:', result.user);

                // 🔥 Step 1: Get Firebase ID token
                const firebaseToken = await result.user.getIdToken();
                console.log('🔑 Firebase token received, length:', firebaseToken.length);

                // 🔥 Step 2: Exchange Firebase token for backend JWT token
                console.log('🔄 Calling backend /auth/firebase to get backend token');
                
                try {
                    const backendResponse = await apiFetch('/auth/firebase', {
                        method: 'POST',
                        body: {
                            idToken: firebaseToken,
                            phoneNumber: result.user.phoneNumber,
                        },
                    });

                    if (backendResponse.ok) {
                        // ✅ Backend returned token just like email/password login
                        const { token, user: userData } = backendResponse.data;
                        const userWithToken = { ...userData, token };

                        console.log('✅ Backend JWT token received:', {
                            tokenLength: token?.length,
                            userId: userData?.id,
                            userName: userData?.name,
                            isBackendToken: !token?.includes('eyJhbGciOiJSUzI1NiIs')
                        });

                        setUser(userWithToken);
                        setUserStateVersion(prev => prev + 1);
                        await storeAuthData(token, userWithToken);
                        console.log('✅ OTP login complete - Backend token stored');
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