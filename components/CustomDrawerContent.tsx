import { useAuth } from '@/context/AuthContext';
import { ShadowUtils } from '@/utils/shadowUtils';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomDrawerContent = (props: any) => {
    const { user, logout } = useAuth();
    const { navigation } = props;
    const [activeMenu, setActiveMenu] = useState('');
    const [isDarkMode] = useState(false);

    const navigateToTimetable = () => {
        setActiveMenu('timetable');
        navigation.navigate('(tabs)', { screen: 'timetable' });
        navigation.closeDrawer();
    };

    const navigateToRefer = () => {
        setActiveMenu('refer');
        navigation.navigate('(tabs)', { screen: 'refer' });
        navigation.closeDrawer();
    };

    const navigateToProfile = () => {
        setActiveMenu('profile');
        navigation.navigate('(tabs)', { screen: 'profile' });
        navigation.closeDrawer();
    };

    const navigateToMyExams = () => {
        setActiveMenu('my-exams');
        navigation.navigate('(tabs)', { screen: 'my-exams' });
        navigation.closeDrawer();
    };

    const navigateToPracticeExam = () => {
        setActiveMenu('practice-exam');
        navigation.navigate('(tabs)', { screen: 'practice-categories' });
        navigation.closeDrawer();
    };

    const navigateToBattleQuiz = () => {
        setActiveMenu('quiz');
        navigation.navigate('(tabs)', { screen: 'quiz' });
        navigation.closeDrawer();
    };

    const navigateToMessages = () => {
        setActiveMenu('messages');
        navigation.navigate('(tabs)', { screen: 'messages' });
        navigation.closeDrawer();
    };

    const navigateToPrivacyPolicy = () => {
        setActiveMenu('privacy-policy');
        navigation.navigate('privacy-policy');
        navigation.closeDrawer();
    };

    const navigateToTerms = () => {
        setActiveMenu('terms');
        navigation.navigate('terms');
        navigation.closeDrawer();
    };

    const navigateToMembership = () => {
        setActiveMenu('membership');
        navigation.navigate('membership');
        navigation.closeDrawer();
    };

    const navigateToBookStore = () => {
        setActiveMenu('book-store');
        navigation.navigate('(tabs)', { screen: 'book-store' });
        navigation.closeDrawer();
    };

    const navigateToMyListings = () => {
        setActiveMenu('my-listings');
        navigation.navigate('(tabs)', { screen: 'my-listings' });
        navigation.closeDrawer();
    };

    const handleSettingsPress = () => {
        setActiveMenu('settings');
        // Add navigation logic for settings if needed
    };

    const handleLeaderboardPress = () => {
        setActiveMenu('leaderboard');
        navigation.navigate('(tabs)', { screen: 'weekly-leaderboard' });
        navigation.closeDrawer();
    };

    const handleSupportPress = () => {
        setActiveMenu('support');
        navigation.navigate('(tabs)', { screen: 'support-tickets' });
        navigation.closeDrawer();
    };


    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <SafeAreaView style={{ flex: 1 }}>
                <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
                    
                    {/* Top Section */}
                    <View style={styles.topSection}>
                        {/* Logo and App Name */}
                        <View style={styles.logoSection}>
                            <View style={styles.logoContainer}>
                                <LinearGradient
                                    colors={['#8B5CF6', '#7C3AED']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.logoSquare}
                                >
                                    <Ionicons name="school" size={20} color="#FFFFFF" />
                                </LinearGradient>
                            </View>
                            <View style={styles.appNameContainer}>
                                <Text style={[styles.appName, isDarkMode && styles.darkText]}>Yottascore</Text>
                            </View>
                        </View>


                    </View>

                    {/* Menu Section */}
                    <View style={styles.menuSection}>
                        <View style={styles.menuItems}>
                            <MenuItem 
                                icon="document-text-outline" 
                                label="My Exams" 
                                onPress={navigateToMyExams}
                                isActive={activeMenu === 'my-exams'}
                                isDarkMode={isDarkMode}
                                iconColor="#2ED573"
                            />
                            
                            <MenuItem 
                                icon="book-outline" 
                                label="Book Store" 
                                onPress={navigateToBookStore}
                                isActive={activeMenu === 'book-store'}
                                isDarkMode={isDarkMode}
                                iconColor="#8B5CF6"
                            />
                            
                            <MenuItem 
                                icon="list-outline" 
                                label="My Listings" 
                                onPress={navigateToMyListings}
                                isActive={activeMenu === 'my-listings'}
                                isDarkMode={isDarkMode}
                                iconColor="#F59E0B"
                            />
                            
                            <MenuItem 
                                icon="school-outline" 
                                label="Practise" 
                                onPress={navigateToPracticeExam}
                                isActive={activeMenu === 'practice-exam'}
                                isDarkMode={isDarkMode}
                                iconColor="#1E90FF"
                            />
                            
                            <MenuItem 
                                icon="game-controller-outline" 
                                label="Battle Quiz" 
                                onPress={navigateToBattleQuiz}
                                isActive={activeMenu === 'quiz'}
                                isDarkMode={isDarkMode}
                                iconColor="#96CEB4"
                            />
                            
                            <MenuItem 
                                icon="person-outline" 
                                label="My Profile" 
                                onPress={navigateToProfile}
                                isActive={activeMenu === 'profile'}
                                isDarkMode={isDarkMode}
                                iconColor="#FF4757"
                            />
                            
                            <MenuItem 
                                icon="chatbubbles-outline" 
                                label="Messages" 
                                onPress={navigateToMessages}
                                isActive={activeMenu === 'messages'}
                                isDarkMode={isDarkMode}
                                iconColor="#667eea"
                            />
                            
                            <MenuItem 
                                icon="stats-chart-outline" 
                                label="Leaderboard" 
                                onPress={handleLeaderboardPress}
                                isActive={activeMenu === 'leaderboard'}
                                isDarkMode={isDarkMode}
                                iconColor="#FF6348"
                            />
                            
                            <MenuItem 
                                icon="calendar-outline" 
                                label="Timetable" 
                                onPress={navigateToTimetable}
                                isActive={activeMenu === 'timetable'}
                                isDarkMode={isDarkMode}
                                iconColor="#9C88FF"
                            />
                            
                            <MenuItem 
                                icon="person-add-outline" 
                                label="Refer & Earn" 
                                onPress={navigateToRefer}
                                isActive={activeMenu === 'refer'}
                                isDarkMode={isDarkMode}
                                iconColor="#FF9FF3"
                            />
                            
                            {/* Membership - Hidden for now */}
                            {false && (
                                <MenuItem 
                                    icon="diamond-outline" 
                                    label="Membership" 
                                    onPress={navigateToMembership}
                                    isActive={activeMenu === 'membership'}
                                    isDarkMode={isDarkMode}
                                    iconColor="#FFD700"
                                />
                            )}
                            
                            {/* <MenuItem 
                                icon="headset-outline" 
                                label="24/7 Support" 
                                onPress={handleSupportPress}
                                isActive={activeMenu === 'support'}
                                isDarkMode={isDarkMode}
                                iconColor="#54A0FF"
                            /> */}
                        </View>
                    </View>




                    {/* Social Media Section */}
                    <View style={styles.socialSection}>
                        <Text style={styles.socialTitle}>Follow Us</Text>
                        <View style={styles.socialIcons}>
                            <TouchableOpacity 
                                style={styles.socialIcon}
                                onPress={() => {
                                    Linking.openURL('https://www.facebook.com/yottascore').catch(err => 
                                        console.error('Failed to open Facebook:', err)
                                    );
                                }}
                            >
                                <View style={styles.facebookIconContainer}>
                                    <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon}>
                                <View style={styles.youtubeIconContainer}>
                                    <Ionicons name="logo-youtube" size={20} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.socialIcon}
                                onPress={() => {
                                    Linking.openURL('https://www.instagram.com/yottascore?igsh=Zm5ycng3YjBvNnU1&utm_source=qr').catch(err => 
                                        console.error('Failed to open Instagram:', err)
                                    );
                                }}
                            >
                                <View style={styles.instagramIconContainer}>
                                    <Ionicons name="logo-instagram" size={20} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Privacy Policy and Terms */}
                    <View style={styles.privacySection}>
                        <View style={styles.privacyLinks}>
                            <TouchableOpacity onPress={navigateToPrivacyPolicy}>
                                <Text style={styles.privacyLinkText}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={navigateToTerms} style={styles.termsContainer}>
                                <Text style={styles.privacyLinkText}>Terms & Conditions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Logout Button */}
                    <View style={styles.logoutSection}>
                        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                            <View style={styles.logoutButtonContent}>
                                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.logoutButtonText}>Logout</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                </DrawerContentScrollView>
            </SafeAreaView>
        </View>
    );
};

const MenuItem = ({ icon, label, onPress, isActive, isDarkMode, badge, iconColor }: any) => (
    <TouchableOpacity 
        style={[styles.menuItem, isActive && styles.activeMenuItem, isDarkMode && styles.darkMenuItem]} 
        onPress={onPress}
    >
        <View style={styles.menuItemContent}>
            <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons 
                    name={icon} 
                    size={20} 
                    color={isActive ? "#FFFFFF" : iconColor} 
                />
            </View>
            <Text 
                style={[
                    styles.menuItemText, 
                    isActive && styles.activeMenuItemText,
                    isDarkMode && styles.darkMenuItemText
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {label}
            </Text>
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    darkContainer: {
        backgroundColor: '#0F172A',
    },
    scrollContent: {
        paddingTop: 0,
        flexGrow: 1,
    },
    
    // Top Section
    topSection: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 24,
        marginBottom: 12,
        ...ShadowUtils.noShadow(),
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        marginRight: 16,
    },
    logoSquare: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },
    appNameContainer: {
        flex: 1,
    },
    appName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.5,
        fontFamily: 'System',
    },
    darkText: {
        color: '#F8FAFC',
    },

    // Menu Section
    menuSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 16,
        paddingVertical: 20,
        ...ShadowUtils.noShadow(),
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        paddingHorizontal: 20,
        letterSpacing: 0.2,
        fontFamily: 'System',
    },
    menuItems: {
        paddingHorizontal: 12,
    },
    menuItem: {
        marginHorizontal: 8,
        marginVertical: 0,
        borderRadius: 12,
        ...ShadowUtils.noShadow(),
    },
    darkMenuItem: {
        backgroundColor: '#334155',
    },
    activeMenuItem: {
        backgroundColor: '#6366F1',
        ...ShadowUtils.noShadow(),
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 42,
    },
    menuItemText: {
        fontSize: Platform.select({
            ios: 13,
            android: SCREEN_HEIGHT > 800 ? 13 : 12,
        }),
        fontWeight: '700',
        color: '#4B5563',
        marginLeft: 4,
        flex: 1,
        letterSpacing: 0.2,
        fontFamily: 'System',
        textAlign: 'left',
        flexWrap: 'nowrap',
    },
    darkMenuItemText: {
        color: '#F1F5F9',
    },
    activeMenuItemText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    iconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginLeft: -16,
    },
    badge: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'System',
    },


    // Social Media Section
    socialSection: {
        backgroundColor: '#F8FAFC',
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        ...ShadowUtils.noShadow(),
    },
    socialTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 0.3,
        fontFamily: 'System',
    },
    socialIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    socialIcon: {
        padding: 6,
    },
    facebookIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1877F2',
        justifyContent: 'center',
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },
    youtubeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF0000',
        justifyContent: 'center',
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },
    instagramIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E1306C',
        justifyContent: 'center',
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },

    // Privacy Section
    privacySection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    privacyLinks: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    termsContainer: {
        marginTop: 8,
    },
    privacyLinkText: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.2,
        fontFamily: 'System',
    },

    // Profile Section
    profileSection: {
        marginTop: 16,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImageContainer: {
        marginRight: 16,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: 0.1,
        fontFamily: 'System',
    },
    profileEmail: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        fontFamily: 'System',
    },
    darkSubText: {
        color: '#CBD5E1',
    },
    logoutSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 12,
        ...ShadowUtils.noShadow(),
    },
    logoutButton: {
        backgroundColor: '#FF4757',
        borderRadius: 6,
        ...ShadowUtils.noShadow(),
    },
    logoutButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
        fontFamily: 'System',
    },
});

export default CustomDrawerContent; 