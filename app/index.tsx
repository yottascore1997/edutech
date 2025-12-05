import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const Welcome = () => {
    const router = useRouter();
    const [showContent, setShowContent] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const glow = useRef(new Animated.Value(0)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const float3 = useRef(new Animated.Value(0)).current;
    const loadingDot1 = useRef(new Animated.Value(0)).current;
    const loadingDot2 = useRef(new Animated.Value(0)).current;
    const loadingDot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Simple typing animation for YOTTASCORE
        const fullText = 'YOTTASCORE';
        let currentIndex = 0;
        
        const typingInterval = setInterval(() => {
            if (currentIndex < fullText.length) {
                setDisplayText(fullText.substring(0, currentIndex + 1));
                currentIndex++;
            } else {
                clearInterval(typingInterval);
            }
        }, 200); // 200ms delay between each letter

        // 2-second delay before showing content
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 2000);

        Animated.loop(
            Animated.sequence([
                Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();
        const mkFloat = (val: Animated.Value, duration: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
                ])
            ).start();
        mkFloat(float1, 2600);
        mkFloat(float2, 3000);
        mkFloat(float3, 2200);

        // Animated loading dots
        const animateLoadingDots = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(loadingDot1, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(loadingDot2, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(loadingDot3, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(loadingDot1, { toValue: 0, duration: 600, useNativeDriver: true }),
                    Animated.timing(loadingDot2, { toValue: 0, duration: 600, useNativeDriver: true }),
                    Animated.timing(loadingDot3, { toValue: 0, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        };
        animateLoadingDots();


        return () => {
            clearTimeout(timer);
            clearInterval(typingInterval);
        };
    }, [glow]);

    const handleLogin = () => { 
        if (!showContent) return;
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}; 
        router.push('/login'); 
    };
    const handleRegister = () => { 
        if (!showContent) return;
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}; 
        router.push('/register'); 
    };
    

  return (
    <LinearGradient colors={[ '#4c1d95', '#7c3aed' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
        {/* Background with Abstract Shapes */}
        <View style={styles.backgroundContainer}>
            {/* Purple Blob Shapes */}
            <View style={[styles.purpleBlob, styles.blob1]} />
            <View style={[styles.purpleBlob, styles.blob2]} />
            <View style={[styles.purpleBlob, styles.blob3]} />
            
            
            {/* Line Art Icons */}
            <View style={[styles.lineIcon, styles.lightbulb]}>
                <Ionicons name="bulb-outline" size={24} color="#e0e0e0" />
                <View style={styles.yellowDots}>
                    <View style={styles.yellowDot} />
                    <View style={styles.yellowDot} />
                    <View style={styles.yellowDot} />
                </View>
            </View>
            
            <View style={[styles.lineIcon, styles.globe1]}>
                <Ionicons name="globe-outline" size={20} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.playButton]}>
                <Ionicons name="play" size={16} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.eyeglasses]}>
                <Ionicons name="glasses-outline" size={18} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.smiley]}>
                <Ionicons name="happy-outline" size={16} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.star]}>
                <Ionicons name="star-outline" size={14} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.question1]}>
                <Ionicons name="help-circle-outline" size={16} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.question2]}>
                <Ionicons name="help-circle-outline" size={12} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.exclamation]}>
                <Ionicons name="alert-circle-outline" size={14} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.music]}>
                <Ionicons name="musical-notes-outline" size={16} color="#e0e0e0" />
            </View>
            
            <View style={[styles.lineIcon, styles.plus]}>
                <Ionicons name="add" size={12} color="#e0e0e0" />
            </View>
            

            {/* Enhanced Study-themed animated icons */}
            <Animated.View style={[styles.studyIcon, styles.studyIcon1, {
                transform: [
                    { translateY: float1.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                    { rotate: float1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '6deg'] }) }
                ]
            }]}>
                <View style={styles.iconContainer}>
                <Ionicons name="book-outline" size={26} color="#ffffff" />
                </View>
            </Animated.View>
            <Animated.View style={[styles.studyIcon, styles.studyIcon2, {
                transform: [
                    { translateY: float2.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                    { rotate: float2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) }
                ]
            }]}>
                <View style={styles.iconContainer}>
                <Ionicons name="pencil-outline" size={24} color="#ffffff" />
                </View>
            </Animated.View>
            <Animated.View style={[styles.studyIcon, styles.studyIcon3, {
                transform: [
                    { translateY: float3.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
                    { rotate: float3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '5deg'] }) }
                ]
            }]}>
                <View style={styles.iconContainer}>
                <Ionicons name="school-outline" size={24} color="#ffffff" />
                </View>
            </Animated.View>
            
            {/* Additional floating elements */}
            <Animated.View style={[styles.floatingElement, styles.floatingStar, {
                transform: [
                    { translateY: float1.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                    { rotate: float1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }
                ]
            }]}>
                <Ionicons name="star" size={20} color="#FFD700" />
            </Animated.View>
            
            <Animated.View style={[styles.floatingElement, styles.floatingTrophy, {
                transform: [
                    { translateY: float2.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) },
                    { scale: float2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }
                ]
            }]}>
                <Ionicons name="trophy" size={18} color="#FFD700" />
            </Animated.View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
            {/* Enhanced Logo + Title */}
            <Animated.View style={[styles.logoWrap, {
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
            }]}>
                <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 15,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.4)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 12,
                    position: 'relative',
                }}>
                    <View style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#fff',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 8,
                        elevation: 8,
                    }}>
                        <Ionicons name="school" size={32} color="#fff" />
                    </View>
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.brandLine}>{displayText}</Text>
                </View>
            </Animated.View>
            {/* Tagline */}
            <TouchableOpacity activeOpacity={0.9} style={styles.taglineChip}>
                <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.taglineGradient}>
                    <Ionicons name="sparkles" size={14} color="#ffffff" />
                <Text style={styles.taglineText}>Smart Learning Platform</Text>
                </LinearGradient>
            </TouchableOpacity>
            
            {/* Enhanced Inspirational Quote */}
            <Animated.View style={[styles.quoteContainer, {
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] }) }]
            }]}>
                <View style={styles.quoteBackground}>
                    <Text style={styles.quoteText}>Prep • Play • Win</Text>
                    <View style={styles.quoteUnderline} />
                </View>
                <View style={styles.quoteAccentDots}>
                    <View style={styles.accentDot} />
                    <View style={styles.accentDot} />
                    <View style={styles.accentDot} />
            </View>
            </Animated.View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
            {!showContent ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                    <View style={styles.loadingDots}>
                        <Animated.View style={[
                            styles.loadingDot, 
                            { 
                                opacity: loadingDot1.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.3, 1]
                                }),
                                transform: [{
                                    scale: loadingDot1.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.8, 1.2]
                                    })
                                }]
                            }
                        ]} />
                        <Animated.View style={[
                            styles.loadingDot, 
                            { 
                                opacity: loadingDot2.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.3, 1]
                                }),
                                transform: [{
                                    scale: loadingDot2.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.8, 1.2]
                                    })
                                }]
                            }
                        ]} />
                        <Animated.View style={[
                            styles.loadingDot, 
                            { 
                                opacity: loadingDot3.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.3, 1]
                                }),
                                transform: [{
                                    scale: loadingDot3.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.8, 1.2]
                                    })
                                }]
                            }
                        ]} />
                    </View>
                </View>
            ) : (
                <>
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.9} style={styles.primaryBtn}>
                <LinearGradient colors={[ '#f59e0b', '#f97316' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnBg}>
                    <Text style={styles.primaryBtnText}>Login</Text>
                </LinearGradient>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity onPress={handleRegister} activeOpacity={0.9} style={styles.primaryBtn}>
                <LinearGradient colors={[ '#fb923c', '#f59e0b' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnBg}>
                    <Text style={styles.primaryBtnText}>Register</Text>
                </LinearGradient>
            </TouchableOpacity>
                </>
            )}
        </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4c1d95',
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    purpleBlob: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
    },
    blob1: {
        width: width * 0.6,
        height: width * 0.6,
        backgroundColor: '#6C63FF', // Your app's purple
        top: -height * 0.1,
        left: -width * 0.2,
    },
    blob2: {
        width: width * 0.4,
        height: width * 0.4,
        backgroundColor: '#FF6CAB', // Your app's pink
        bottom: height * 0.3,
        right: -width * 0.1,
    },
    blob3: {
        width: width * 0.5,
        height: width * 0.5,
        backgroundColor: '#FFD452', // Your app's yellow
        bottom: height * 0.1,
        left: width * 0.3,
    },
    lineIcon: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.1,
    },
    lightbulb: {
        top: height * 0.1,
        left: width * 0.4,
    },
    yellowDots: {
        flexDirection: 'row',
        marginLeft: 8,
    },
    yellowDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFD452', // Your app's yellow
        marginRight: 2,
    },
    globe1: {
        top: height * 0.3,
        left: width * 0.6,
    },
    playButton: {
        top: height * 0.5,
        left: width * 0.2,
    },
    eyeglasses: {
        top: height * 0.7,
        left: width * 0.3,
    },
    smiley: {
        top: height * 0.9,
        left: width * 0.4,
    },
    star: {
        top: height * 0.1,
        right: width * 0.4,
    },
    question1: {
        top: height * 0.3,
        right: width * 0.6,
    },
    question2: {
        bottom: height * 0.1,
        left: width * 0.6,
    },
    exclamation: {
        bottom: height * 0.3,
        right: width * 0.6,
    },
    music: {
        bottom: height * 0.5,
        left: width * 0.6,
    },
    plus: {
        bottom: height * 0.7,
        right: width * 0.6,
    },
    studyIcon: {
        position: 'absolute',
        opacity: 0.3,
    },
    studyIcon1: {
        top: height * 0.22,
        left: width * 0.12,
    },
    studyIcon2: {
        top: height * 0.55,
        right: width * 0.18,
    },
    studyIcon3: {
        bottom: height * 0.18,
        left: width * 0.2,
    },
    iconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    floatingElement: {
        position: 'absolute',
        opacity: 0.6,
    },
    floatingStar: {
        top: height * 0.15,
        right: width * 0.15,
    },
    floatingTrophy: {
        bottom: height * 0.25,
        right: width * 0.1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 80,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    animatedTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandLine: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 2,
    },
    logoWrap: {
        alignItems: 'center',
    },
    logoBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)'
    },
    enhancedLogoBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
        position: 'relative',
    },
    logoInnerGlow: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    logoAccentRing: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFD700',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 6,
    },
    subtitleText: {
        fontSize: 18,
        color: '#667eea',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 30,
        fontWeight: '600',
        textShadowColor: 'rgba(102, 126, 234, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    taglineChip: {
        marginTop: 8,
        borderRadius: 999,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    taglineGradient: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 999,
    },
    taglineText: {
        color: '#ffffff',
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    quoteContainer: {
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 15,
        position: 'relative',
    },
    quoteBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
        alignItems: 'center',
    },
    quoteText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        marginBottom: 4,
    },
    quoteUnderline: {
        width: 35,
        height: 1.5,
        backgroundColor: '#FFD700',
        borderRadius: 1,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 2,
    },
    quoteAccentDots: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        gap: 4,
    },
    accentDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        elevation: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 100,
        gap: 20,
    },
    primaryBtn: { flex: 1, borderRadius: 26, overflow: 'hidden' },
    primaryBtnBg: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 26,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    ghostBtn: {
        flex: 1,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.7)',
        borderRadius: 26,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    ghostBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },
    separator: {
        width: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    loadingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
        opacity: 0.3,
    },
    guestLinkWrap: { alignItems: 'center', paddingBottom: 20 },
    guestLink: { color: '#e9d5ff', fontWeight: '700' },
});

export default Welcome; 
