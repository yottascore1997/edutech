import { useAuth } from '@/context/AuthContext';
import { ShadowUtils } from '@/utils/shadowUtils';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Dimensions, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomDrawerContent = (props: any) => {
    const { user, logout } = useAuth();
    const { navigation } = props;
    const router = useRouter();
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

    const navigateToPYQ = () => {
        setActiveMenu('pyq');
        // Use router.push to navigate to filesystem route, then close drawer
        try {
            router.push('/pyq');
        } catch (e) {
            // fallback to navigation.navigate if router fails
            try {
                navigation.navigate('pyq');
            } catch {}
        }
        navigation.closeDrawer();
    };
    
    const navigateToCurrentAffairs = () => {
        setActiveMenu('current-affairs');
        try {
            router.push('/(tabs)/current-affairs');
        } catch (e) {
            try {
                navigation.navigate('(tabs)', { screen: 'current-affairs' });
            } catch {}
        }
        navigation.closeDrawer();
    };

    const navigateToMyCertificates = () => {
        setActiveMenu('my-certificates');
        navigation.navigate('(tabs)', { screen: 'my-certificates' });
        navigation.closeDrawer();
    };

    const navigateToExamNotifications = () => {
        setActiveMenu('exam-notifications');
        navigation.navigate('(tabs)', { screen: 'exam-notifications' });
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

    const navigateToFollowRequests = () => {
        setActiveMenu('follow-requests');
        navigation.navigate('(tabs)', { screen: 'follow-requests' });
        navigation.closeDrawer();
    };


    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <SafeAreaView style={{ flex: 1 }}>
                <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
                    
                    {/* Header - User profile */}
                    <View style={styles.headerWrapper}>
                        <LinearGradient
                            colors={['#4F46E5', '#6366F1', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.headerGradient}
                        >
                            <View style={styles.logoSection}>
                                <View style={styles.logoContainer}>
                                    <View style={styles.avatarWrapper}>
                                        {(user?.profilePicture || user?.profilePhoto) ? (
                                            <Image
                                                source={{ uri: user.profilePicture || user.profilePhoto || '' }}
                                                style={styles.avatarImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Image source={require('../assets/images/icons/students.png')} style={styles.avatarStudentIcon} resizeMode="contain" />
                                        )}
                                    </View>
                                </View>
                                <View style={styles.appNameContainer}>
                                    {(user?.name || (user as any)?.user?.name) ? (
                                        <Text style={styles.appName} numberOfLines={1}>
                                            {(user?.name || (user as any)?.user?.name || '').split(' ')[0]}
                                        </Text>
                                    ) : (
                                        <Text style={styles.appName}>Guest</Text>
                                    )}
                                    <Text style={styles.tagline}>Yottascore</Text>
                                </View>
                            </View>
                        </LinearGradient>
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
                                iconImage={require('../assets/images/icons/exam.png')}
                            />
                            
                            <MenuItem 
                                icon="book-outline" 
                                label="PYQ" 
                                onPress={navigateToPYQ}
                                isActive={activeMenu === 'pyq'}
                                isDarkMode={isDarkMode}
                                iconColor="#1f2937"
                                iconImage={require('../assets/images/icons/question-mark.png')}
                            />
                            <MenuItem 
                                icon="newspaper-outline"
                                label="Current Affairs"
                                onPress={navigateToCurrentAffairs}
                                isActive={activeMenu === 'current-affairs'}
                                isDarkMode={isDarkMode}
                                iconColor="#06B6D4"
                            />
                            <MenuItem 
                                icon="ribbon-outline" 
                                label="My Certificates" 
                                onPress={navigateToMyCertificates}
                                isActive={activeMenu === 'my-certificates'}
                                isDarkMode={isDarkMode}
                                iconColor="#aa35ce"
                            />
                            <MenuItem 
                                icon="notifications-outline" 
                                label="Exam Notifications" 
                                onPress={navigateToExamNotifications}
                                isActive={activeMenu === 'exam-notifications'}
                                isDarkMode={isDarkMode}
                                iconColor="#F59E0B"
                                iconImage={require('../assets/images/icons/push-notification.png')}
                            />
                            <MenuItem 
                                icon="book-outline" 
                                label="Book Store" 
                                onPress={navigateToBookStore}
                                isActive={activeMenu === 'book-store'}
                                isDarkMode={isDarkMode}
                                iconColor="#8B5CF6"
                                iconImage={require('../assets/images/icons/book-shop.png')}
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
                                iconImage={require('../assets/images/icons/exam-time.png')}
                            />
                            
                            <MenuItem 
                                icon="game-controller-outline" 
                                label="Battle Quiz" 
                                onPress={navigateToBattleQuiz}
                                isActive={activeMenu === 'quiz'}
                                isDarkMode={isDarkMode}
                                iconColor="#96CEB4"
                                iconImage={require('../assets/images/icons/quiz.png')}
                            />
                            
                            {/* My Profile - Temporarily hidden */}
                            {false && (
                                <MenuItem 
                                    icon="person-outline" 
                                    label="My Profile" 
                                    onPress={navigateToProfile}
                                    isActive={activeMenu === 'profile'}
                                    isDarkMode={isDarkMode}
                                    iconColor="#FF4757"
                                />
                            )}
                            
                            {/* Messages - Temporarily hidden */}
                            {false && (
                                <MenuItem 
                                    icon="chatbubbles-outline" 
                                    label="Messages" 
                                    onPress={navigateToMessages}
                                    isActive={activeMenu === 'messages'}
                                    isDarkMode={isDarkMode}
                                    iconColor="#667eea"
                                />
                            )}
                            
                            <MenuItem 
                                icon="stats-chart-outline" 
                                label="Leaderboard" 
                                onPress={handleLeaderboardPress}
                                isActive={activeMenu === 'leaderboard'}
                                isDarkMode={isDarkMode}
                                iconColor="#FF6348"
                                iconImage={require('../assets/images/trophy.jpg')}
                            />
                            
                            <MenuItem 
                                icon="calendar-outline" 
                                label="Timetable" 
                                onPress={navigateToTimetable}
                                isActive={activeMenu === 'timetable'}
                                isDarkMode={isDarkMode}
                                iconColor="#9C88FF"
                                iconImage={require('../assets/images/icons/study-time.png')}
                            />
                            
                            <MenuItem 
                                icon="person-add-outline" 
                                label="Refer & Earn" 
                                onPress={navigateToRefer}
                                isActive={activeMenu === 'refer'}
                                isDarkMode={isDarkMode}
                                iconColor="#FF9FF3"
                                iconImage={require('../assets/images/icons/budget.png')}
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

                    {/* Logout */}
                    <View style={styles.logoutSection}>
                        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
                            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.logoutButtonText}>Log out</Text>
                        </TouchableOpacity>
                    </View>

                </DrawerContentScrollView>
            </SafeAreaView>
        </View>
    );
};

const MenuItem = ({ icon, label, onPress, isActive, isDarkMode, badge, iconColor, iconImage }: any) => (
    <TouchableOpacity 
        style={[styles.menuItem, isActive && styles.activeMenuItem, isDarkMode && styles.darkMenuItem]} 
        onPress={onPress}
    >
        <View style={styles.menuItemContent}>
            <View style={styles.iconWrapper}>
                {iconImage ? (
                    <Image source={iconImage} style={styles.menuItemIconImage} resizeMode="contain" />
                ) : (
                    <Ionicons 
                        name={icon} 
                        size={36} 
                        color={isActive ? "#FFFFFF" : iconColor} 
                    />
                )}
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
        backgroundColor: '#FAFBFC',
    },
    darkContainer: {
        backgroundColor: '#0F172A',
    },
    scrollContent: {
        paddingTop: 14,
        paddingBottom: 16,
        flexGrow: 1,
        backgroundColor: '#FAFBFC',
    },
    
    // Header - compact
    headerWrapper: {
        marginHorizontal: 8,
        marginTop: 4,
        marginBottom: 6,
        borderRadius: 14,
        overflow: 'hidden',
        ...ShadowUtils.noShadow(),
    },
    headerGradient: {
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        marginRight: 12,
    },
    avatarWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarStudentIcon: {
        width: 36,
        height: 36,
    },
    avatarEmoji: {
        fontSize: 32,
        lineHeight: 40,
    },
    appNameContainer: {
        flex: 1,
    },
    appName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.4,
    },
    tagline: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    userGreeting: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        fontWeight: '600',
    },
    darkText: {
        color: '#F8FAFC',
    },

    // Menu Section - compact
    menuSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 8,
        marginBottom: 6,
        borderRadius: 12,
        paddingVertical: 10,
        ...ShadowUtils.noShadow(),
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 8,
        paddingHorizontal: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    menuItems: {
        paddingHorizontal: 8,
    },
    menuItem: {
        marginHorizontal: 4,
        marginVertical: 0,
        borderRadius: 10,
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
        paddingVertical: 6,
        paddingHorizontal: 12,
        minHeight: 40,
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemIconImage: {
        width: 42,
        height: 42,
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


    // Social - compact
    socialSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 8,
        marginBottom: 6,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        ...ShadowUtils.noShadow(),
    },
    socialTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    socialIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    socialIcon: {
        padding: 4,
    },
    facebookIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#1877F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    youtubeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FF0000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instagramIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E1306C',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Privacy - compact
    privacySection: {
        paddingHorizontal: 12,
        paddingBottom: 10,
    },
    privacyLinks: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    termsContainer: {
        marginTop: 4,
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
        marginHorizontal: 8,
        marginBottom: 14,
        marginTop: 0,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#FF0000',
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