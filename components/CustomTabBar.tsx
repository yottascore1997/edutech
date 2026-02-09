import { useLiveExam } from '@/context/LiveExamContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 75;
const ICON_SIZE = 26;

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const { routes, index: activeIndex } = state;
    const { isLiveExamInProgress } = useLiveExam();

    // Filter to only the routes we expect, to prevent duplicates
    const expectedRoutes = ['home', 'exam', 'quiz', 'timetable', 'book-store'];
    const filteredRoutes = routes.filter((r: any) => expectedRoutes.includes(r.name));

    const onTabPress = (route: any, isFocused: boolean) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            if (isLiveExamInProgress) {
                Alert.alert(
                    'Leave exam?',
                    'Leaving will save your progress. You can resume when you return. Time will keep counting down.',
                    [
                        { text: 'Stay', style: 'cancel' },
                        { text: 'Leave', style: 'destructive', onPress: () => navigation.navigate(route.name) },
                    ]
                );
                return;
            }
            navigation.navigate(route.name);
        }
    };

    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.whiteBackground} />
            


            <View style={styles.tabBarItemsContainer}>
                {filteredRoutes.map((route: any) => {
                    const { options } = descriptors[route.key];
                    // Check if the current route in the filtered list is the active one
                    const isFocused = routes[activeIndex].key === route.key;

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
                            tabIconImage = require('@/assets/images/icons/3d-alarm.png');
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
                                    colors={['#FF6B35', '#FF8E53']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.centerTabGradient}
                                >
                                    <Ionicons name={iconName} size={ICON_SIZE * 1.2} color="#FFFFFF" />
                                    <Text style={styles.centerLabel}>{label}</Text>
                                </LinearGradient>
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
                                        color={isFocused ? "#6366F1" : "#64748B"}
                                    />
                                )}
                            </View>
                            <Text style={[
                                styles.label, 
                                { color: isFocused ? "#6366F1" : "#64748B" }
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
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderColor: 'rgba(99, 102, 241, 0.4)',
        borderWidth: 1.5,
        elevation: 0,
        transform: [{ scale: 1.05 }],
    },
    tabIconImage: {
        width: 30,
        height: 30,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 0.5 },
        textShadowRadius: 1,
        letterSpacing: 0.4,
        marginTop: 3,
        fontFamily: 'System',
        lineHeight: 14,
    },
    centerTab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        elevation: 0,
    },
    centerTabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3.5,
        borderColor: '#FFFFFF',
        elevation: 0,
    },
    centerLabel: {
        fontSize: 11,
        color: '#FFFFFF',
        marginTop: 4,
        fontWeight: '900',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        letterSpacing: 0.5,
        fontFamily: 'System',
        lineHeight: 12,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -4,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#6366F1',
        elevation: 0,
    },
});

export default CustomTabBar; 