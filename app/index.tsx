import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    const slideBackgrounds = ['#FFE7EC', '#F3E8FF', '#FEF3C7'];
    const slides = [
        { image: require('../assets/images/icons/splash1.png') },
        { image: require('../assets/images/icons/splash2.png') },
        { image: require('../assets/images/icons/splash3.png') },
    ];

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
    <LinearGradient colors={[ '#FFF4E5', '#FFF7EB' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
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

        {/* Main Content with 3-slide onboarding */}
        <View style={styles.contentContainer}>
            <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const { contentOffset, layoutMeasurement } = e.nativeEvent;
                    const pageWidth = layoutMeasurement.width || width;
                    const index = Math.round(contentOffset.x / pageWidth);
                    setCurrentIndex(index);
                }}
                scrollEventThrottle={16}
            >
                {slides.map((slide, index) => (
                    <View
                        key={index}
                        style={[
                            styles.slide,
                            { backgroundColor: slideBackgrounds[index] || slideBackgrounds[0] },
                        ]}
                    >
                        {/* Text header like reference design */}
                        <View style={styles.slideHeader}>
                            <Text style={styles.slideTitle}>Smart Learning Platform</Text>
                            <Text style={styles.slideSubtitle}>Prep • Play • Win with YOTTASCORE</Text>
                        </View>

                        {/* Big educational image only */}
                        <View style={styles.slideImageWrapper}>
                            <Image source={slide.image} style={styles.slideImage} resizeMode="cover" />
                        </View>
                    </View>
                ))}
            </Animated.ScrollView>

            {/* Pagination dots */}
            <View style={styles.pagination}>
                {[0, 1, 2].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.paginationDot,
                            currentIndex === i && styles.paginationDotActive,
                        ]}
                    />
                ))}
            </View>
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
                <View style={styles.authCard}>
                    <Text style={styles.authRegionText}>Smart learning for exam heroes</Text>
                    <TouchableOpacity onPress={handleRegister} activeOpacity={0.9} style={styles.authPrimaryBtn}>
                        <Text style={styles.authPrimaryText}>Register</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogin} activeOpacity={0.9} style={styles.authSecondaryBtn}>
                        <Text style={styles.authSecondaryText}>Login</Text>
                    </TouchableOpacity>
                    <Text style={styles.authSubNote}>You can change this later in settings.</Text>
                </View>
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
        paddingHorizontal: 0,
        paddingTop: 80,
    },
    logoOuter: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.45)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 14,
        position: 'relative',
    },
    logoInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.32)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
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
    illustrationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
        marginTop: 30,
        marginBottom: 10,
        paddingHorizontal: 8,
    },
    illustrationCard: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.35)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
    },
    illustrationCardLeft: {
        transform: [{ rotate: '-4deg' }],
    },
    illustrationCardCenter: {
        transform: [{ scale: 1.02 }],
    },
    illustrationCardRight: {
        transform: [{ rotate: '4deg' }],
    },
    illustrationImage: {
        width: '100%',
        height: height * 0.18,
    },
    illustrationLabel: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        color: '#e5e7eb',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    slide: {
        width,
        paddingHorizontal: 24,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 70,
    },
    slideHeader: {
        width: '100%',
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    slideTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'left',
    },
    slideSubtitle: {
        fontSize: 14,
        marginTop: 6,
        color: '#4B5563',
        textAlign: 'left',
    },
    slideImageWrapper: {
        marginTop: 10,
        marginBottom: 24,
        width: width - 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slideImage: {
        width: width - 48,
        height: height * 0.32,
        borderRadius: 28,
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
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingBottom: 12,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(209, 213, 219, 0.5)',
    },
    paginationDotActive: {
        width: 18,
        borderRadius: 999,
        backgroundColor: '#ffffff',
    },
    buttonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    authCard: {
        width: '100%',
        borderRadius: 24,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        paddingVertical: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
        gap: 10,
    },
    authRegionText: {
        fontSize: 13,
        color: '#4B5563',
        marginBottom: 4,
    },
    authPrimaryBtn: {
        marginTop: 4,
        borderRadius: 999,
        backgroundColor: '#111827',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    authPrimaryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    authSecondaryBtn: {
        marginTop: 6,
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    authSecondaryText: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '700',
    },
    authSubNote: {
        marginTop: 6,
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center',
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
