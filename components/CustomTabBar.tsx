import { FontFamily } from '@/constants/Typography';
import { useLiveExam } from '@/context/LiveExamContext';
import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** Typed routes (expo-router experiments.typedRoutes) */
const TAB_HREFS: Record<string, Href> = {
    home: '/(tabs)/home',
    exam: '/(tabs)/exam',
    quiz: '/(tabs)/quiz',
    timetable: '/(tabs)/timetable',
    'book-store': '/(tabs)/book-store',
};

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 75;
const ICON_SIZE = 26;

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const { routes, index: activeIndex } = state;
    const { isLiveExamInProgress } = useLiveExam();

    const activeRoute = routes[activeIndex];
    // Hide app tab bar on Study Partner flow screens and on Messages (Study Partner Chats)
    if (activeRoute?.name?.startsWith('study-partner') || activeRoute?.name === 'messages') {
        return null;
    }

    // Fixed tab order — must match visible bottom nav (mockup: Home, Exam, Quiz, Timetable, Books)
    const tabOrder = ['home', 'exam', 'quiz', 'timetable', 'book-store'];
    const filteredRoutes = tabOrder
        .map((name) => routes.find((r: any) => r.name === name))
        .filter(Boolean);

    const onTabPress = (route: any, isFocused: boolean) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            const href = TAB_HREFS[route.name];
            if (!href) return;

            const go = () => router.push(href);

            if (isLiveExamInProgress) {
                Alert.alert(
                    'Leave exam?',
                    'Leaving will save your progress. You can resume when you return. Time will keep counting down.',
                    [
                        { text: 'Stay', style: 'cancel' },
                        { text: 'Leave', style: 'destructive', onPress: go },
                    ]
                );
                return;
            }
            go();
        }
    };

    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.whiteBackground} />
            


            <View style={styles.tabBarItemsContainer}>
                {filteredRoutes.map((route: any) => {
                    const { options } = descriptors[route.key];
                    // Check if the current route in the filtered list is the active one
                    const isFocused = routes[activeIndex]?.name === route.name;

                    let iconName: any = 'home';
                    let label = 'Home';
                    let tabIconImage: number | null = null;

                    switch (route.name) {
                        case 'home':
                            iconName = isFocused ? 'home' : 'home-outline';
                            label = 'Home';
                            tabIconImage = require('@/assets/images/icons/home.png');
                            break;
                        case 'exam':
                            iconName = isFocused ? 'book' : 'book-outline';
                            label = 'Exam';
                            tabIconImage = require('@/assets/images/icons/exam2.png');
                            break;
                        case 'quiz':
                            iconName = 'qr-code';
                            label = 'Quiz';
                            break;
                        case 'timetable':
                            iconName = isFocused ? 'calendar' : 'calendar-outline';
                            label = 'Timetable';
                            tabIconImage = require('@/assets/images/icons/schedule.png');
                            break;
                        case 'book-store':
                            iconName = isFocused ? 'library' : 'library-outline';
                            label = 'Books';
                            tabIconImage = require('@/assets/images/icons/book.png');
                            break;
                    }
                    
                    const isCenter = route.name === 'quiz';

                    if (isCenter) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={() => onTabPress(route, isFocused)}
                                style={styles.centerTab}
                            >
                                <LinearGradient
                                    colors={['#8E78E7', '#6344D4', '#5546C9']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.centerTabGradient}
                                >
                                    <Ionicons name="trophy" size={ICON_SIZE * 1.1} color="#FFFFFF" />
                                </LinearGradient>
                                <Text style={styles.centerLabel}>{label}</Text>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => onTabPress(route, isFocused)}
                            style={styles.tab}
                        >
                            <View style={[
                                styles.iconContainer,
                                isFocused && styles.activeIconContainer
                            ]}>
                                {tabIconImage ? (
                                    <Image source={tabIconImage} style={styles.tabIconImage} resizeMode="contain" />
                                ) : (
                                    <Ionicons 
                                        name={iconName} 
                                        size={ICON_SIZE} 
                                        color={isFocused ? "#6344D4" : "#64748B"}
                                    />
                                )}
                            </View>
                            <Text style={[
                                styles.label, 
                                { color: isFocused ? "#6344D4" : "#64748B" }
                            ]}>
                                {label}
                            </Text>
                            {isFocused && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: width,
        height: TAB_BAR_HEIGHT,
        alignItems: 'center',
        backgroundColor: 'transparent',
        overflow: 'visible',
    },
    whiteBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: width,
        height: TAB_BAR_HEIGHT,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        zIndex: 0,
        elevation: 0,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
        }),
    },
    backgroundPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.08,
        overflow: 'hidden',
    },
    patternCircle1: {
        position: 'absolute',
        top: 10,
        right: 30,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    patternCircle2: {
        position: 'absolute',
        top: 15,
        left: 40,
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternCircle3: {
        position: 'absolute',
        top: 20,
        right: 60,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    tabBarItemsContainer: {
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 8,
        paddingHorizontal: 8,
        zIndex: 2,
        elevation: 2,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeIconContainer: {
        backgroundColor: 'rgba(106, 90, 224, 0.12)',
        borderColor: 'rgba(106, 90, 224, 0.35)',
        borderWidth: 1.5,
        elevation: 0,
        transform: [{ scale: 1.05 }],
    },
    tabIconImage: {
        width: 30,
        height: 30,
    },
    label: {
        fontSize: 11,
        fontFamily: FontFamily.semiBold,
        textAlign: 'center',
        marginTop: 3,
        lineHeight: 14,
    },
    centerTab: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
        elevation: 0,
    },
    centerTabGradient: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    centerLabel: {
        fontSize: 11,
        color: '#6344D4',
        marginTop: 4,
        fontFamily: FontFamily.semiBold,
        lineHeight: 12,
        position: 'absolute',
        bottom: -18,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -4,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#6344D4',
        elevation: 0,
    },
});

export default CustomTabBar; 