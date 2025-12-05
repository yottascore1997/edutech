import { AppColors } from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import * as Haptics from 'expo-haptics'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

const Register = () => {
    const { register } = useAuth();
    const { showError, showSuccess } = useToast();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const handleRegister = async () => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

        
        if (!name || !email || !password || !phoneNumber) {
            showError('Please fill all the required fields.');
            return;
        }
        
        // Basic validation
        if (password.length < 6) {
            showError('Password must be at least 6 characters long.');
            return;
        }
        
        if (!email.includes('@')) {
            showError('Please enter a valid email address.');
            return;
        }
        
        try {

            const userData = { name, email, password, phoneNumber, referralCode };

            
            await register(userData);

            showSuccess('Registration successful! Please log in.');
            setTimeout(() => {
                router.replace('/login');
            }, 2000);
        } catch (error: any) {
            console.error('Registration failed:', error);
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            

            
            // Show specific error messages
            if (errorMessage.toLowerCase().includes('email already exists')) {
                showError('This email is already registered. Please use a different email or try logging in.');
            } else if (errorMessage.toLowerCase().includes('phone')) {
                showError('Please enter a valid phone number.');
            } else if (errorMessage.toLowerCase().includes('password')) {
                showError('Password is too weak. Please use a stronger password.');
            } else {
                showError(errorMessage);
            }
        }
    };

    return (
        <LinearGradient
            colors={["#4c1d95", "#7c3aed", "#a855f7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Soft decorative blobs */}
            <View style={styles.bgDecor} pointerEvents="none">
                <LinearGradient colors={[ 'rgba(124,58,237,0.35)', 'rgba(168,85,247,0.15)' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bgBlob, { top: -40, left: -80, width: 220, height: 220 }]} />
                <LinearGradient colors={[ 'rgba(168,85,247,0.30)', 'rgba(124,58,237,0.12)' ]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.bgBlob, { top: 140, right: -90, width: 240, height: 240 }]} />
                <LinearGradient colors={[ 'rgba(0,0,0,0.08)', 'transparent' ]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[styles.bgBlob, { bottom: 80, left: 20, width: 160, height: 160 }]} />
            </View>
         
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={AppColors.white} />
            </TouchableOpacity>
            <View style={styles.centeredContent}>
                <View style={styles.glassCard}>
                    <Text style={styles.title}>Create your account</Text>
                    <Text style={styles.subtitle}>Join and start playing in seconds.</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Full name</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Priya Sharma"
                                placeholderTextColor="#B0B3C6"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Email address</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor="#B0B3C6"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Create a password"
                                placeholderTextColor="#B0B3C6"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={secureTextEntry}
                            />
                            <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeIcon}>
                                <Ionicons name={secureTextEntry ? "eye-off" : "eye"} size={22} color="#B0B3C6" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.helper}>At least 6 characters</Text>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Phone number</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. +91 98765 43210"
                                placeholderTextColor="#B0B3C6"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Referral code <Text style={styles.helperInline}>(optional)</Text></Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="pricetag-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="HERO50"
                                placeholderTextColor="#B0B3C6"
                                value={referralCode}
                                onChangeText={setReferralCode}
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleRegister} activeOpacity={0.9}>
                        <LinearGradient
                            colors={["#f59e0b", "#f97316"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.registerButton}
                        >
                            <Text style={styles.registerButtonText}>Get Started</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.disclaimer}>By continuing, you agree to our Terms and Privacy Policy.</Text>
                    <View style={styles.signInContainer}>
                        <Text style={styles.accountText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/login')}>
                            <Text style={styles.signInText}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgDecor: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    bgBlob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 1,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 1,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 0,
        marginBottom: 0,
    },
    glassCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
        elevation: 6,
        alignItems: 'center',
        minHeight: '62%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 14,
        textAlign: 'center',
    },
    field: {
        width: '100%',
        marginBottom: 10,
    },
    label: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    helper: {
        color: '#6b7280',
        fontSize: 11,
        marginTop: 4,
        marginLeft: 2,
    },
    helperInline: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        marginBottom: 0,
        paddingHorizontal: 12,
        width: '100%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        color: '#222',
        fontSize: 15,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    eyeIcon: {
        padding: 6,
    },
    registerButton: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 14,
        width: 190,
        alignSelf: 'center',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    disclaimer: {
        color: '#6b7280',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 18,
    },
    accountText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
    signInText: {
        color: '#7c3aed',
        fontWeight: 'bold',
        fontSize: 15,
    },
    cornerBook: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 90,
        height: 90,
        opacity: 0.18,
        zIndex: 0,
    },
    cornerCap: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 110,
        height: 110,
        opacity: 0.15,
        zIndex: 0,
    },
});

export default Register; 
