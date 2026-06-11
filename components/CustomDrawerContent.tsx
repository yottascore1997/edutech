import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Dimensions, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PRIMARY = '#6344D4';
const SP_BG = '#FAFAFF';

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isActive: boolean;
  iconColor?: string;
  iconImage?: number;
};

const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.menuGroup}>
    <Text style={styles.menuGroupTitle}>{title}</Text>
    {children}
  </View>
);

const MenuItem = ({ icon, label, onPress, isActive, iconColor = PRIMARY, iconImage }: MenuItemProps) => (
  <TouchableOpacity
    style={[styles.menuItem, isActive && styles.activeMenuItem]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.menuIconBox, isActive ? styles.menuIconBoxActive : { backgroundColor: `${iconColor}14` }]}>
      {iconImage ? (
        <Image source={iconImage} style={styles.menuItemIconImage} resizeMode="contain" />
      ) : (
        <Ionicons name={icon} size={20} color={isActive ? '#fff' : iconColor} />
      )}
    </View>
    <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]} numberOfLines={1}>
      {label}
    </Text>
    {isActive ? (
      <View style={styles.activeDot} />
    ) : (
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    )}
  </TouchableOpacity>
);

const CustomDrawerContent = (props: any) => {
    const { user, logout } = useAuth();
    const { navigation } = props;
    const router = useRouter();
    const [activeMenu, setActiveMenu] = useState('');

    const navigateToTimetable = () => {
        setActiveMenu('timetable');
        navigation.closeDrawer();
        router.push('/(tabs)/timetable' as const);
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
        navigation.closeDrawer();
        router.push('/(tabs)/my-exams' as const);
    };

    const navigateToPYQ = () => {
        setActiveMenu('pyq');
        // Use router.push to navigate to filesystem route, then close drawer
        try {
            router.push('/(tabs)/pyq' as const);
        } catch (e) {
            // fallback to navigation.navigate if router fails
            try {
                navigation.navigate('(tabs)', { screen: 'pyq' });
            } catch {}
        }
        navigation.closeDrawer();
    };
    
    const navigateToCurrentAffairs = () => {
        setActiveMenu('current-affairs');
        navigation.closeDrawer();
        try {
            router.replace('/(tabs)/current-affairs' as const);
        } catch {
            navigation.navigate('(tabs)', {
                screen: 'current-affairs',
                params: { screen: 'index' },
            });
        }
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

    const navigateToLiveQuiz = () => {
        setActiveMenu('live-quiz');
        try {
            navigation.navigate('(tabs)', { screen: 'live-quiz-categories' });
        } catch {
            try {
                router.push('/(tabs)/live-quiz-categories');
            } catch {}
        }
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

    const handleLogoutPress = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel', onPress: () => navigation.closeDrawer() },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        navigation.closeDrawer();
                        void logout();
                    },
                },
            ]
        );
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

    const navigateToDeactivateAccount = () => {
        setActiveMenu('deactivate-account');
        navigation.closeDrawer();
        router.push('/deactivate-account' as const);
    };

    const displayName = user?.name || (user as any)?.user?.name || 'Student';
    const displayEmail = user?.email || '';

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#EDE9FE', '#FDF2F8', SP_BG]} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.safeArea}>
                <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerWrapper}>
                        <LinearGradient
                            colors={['#1A0F3C', '#4B32AF', PRIMARY]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.headerGradient}
                        >
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => navigation.closeDrawer()}
                                hitSlop={12}
                            >
                                <Ionicons name="close" size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.logoSection} onPress={navigateToProfile} activeOpacity={0.85}>
                                <View style={styles.avatarRing}>
                                    <View style={styles.avatarWrapper}>
                                        {(user?.profilePicture || user?.profilePhoto) ? (
                                            <Image
                                                source={{ uri: user.profilePicture || user.profilePhoto || '' }}
                                                style={styles.avatarImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={styles.avatarPlaceholder}>
                                                <Text style={styles.avatarInitials}>
                                                    {displayName.charAt(0).toUpperCase()}
                                                </Text>
                                            </LinearGradient>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.appNameContainer}>
                                    <Text style={styles.appName} numberOfLines={1}>{displayName}</Text>
                                    {displayEmail ? (
                                        <Text style={styles.userEmail} numberOfLines={1}>{displayEmail}</Text>
                                    ) : null}
                                    <View style={styles.brandPill}>
                                        <Ionicons name="sparkles" size={11} color="#E9D5FF" />
                                        <Text style={styles.tagline}>Yottascore</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                    <View style={styles.menuSection}>
                        <MenuSection title="Main">
                            <MenuItem
                                icon="document-text-outline"
                                label="My Exams"
                                onPress={navigateToMyExams}
                                isActive={activeMenu === 'my-exams'}
                                iconColor="#16A34A"
                                iconImage={require('../assets/images/icons/exam.png')}
                            />
                            <MenuItem
                                icon="book-outline"
                                label="PYQ"
                                onPress={navigateToPYQ}
                                isActive={activeMenu === 'pyq'}
                                iconColor={PRIMARY}
                                iconImage={require('../assets/images/icons/question-mark.png')}
                            />
                            <MenuItem
                                icon="newspaper-outline"
                                label="Current Affairs"
                                onPress={navigateToCurrentAffairs}
                                isActive={activeMenu === 'current-affairs'}
                                iconColor="#0891B2"
                            />
                            <MenuItem
                                icon="calendar-outline"
                                label="Timetable"
                                onPress={navigateToTimetable}
                                isActive={activeMenu === 'timetable'}
                                iconColor="#7C3AED"
                                iconImage={require('../assets/images/icons/study-time.png')}
                            />
                            <MenuItem
                                icon="school-outline"
                                label="Practise"
                                onPress={navigateToPracticeExam}
                                isActive={activeMenu === 'practice-exam'}
                                iconColor="#2563EB"
                                iconImage={require('../assets/images/icons/exam-time.png')}
                            />
                            <MenuItem
                                icon="game-controller-outline"
                                label="Play Quiz"
                                onPress={navigateToBattleQuiz}
                                isActive={activeMenu === 'quiz'}
                                iconColor="#059669"
                                iconImage={require('../assets/images/icons/quiz.png')}
                            />
                            <MenuItem
                                icon="chatbubbles-outline"
                                label="Messages"
                                onPress={navigateToMessages}
                                isActive={activeMenu === 'messages'}
                                iconColor="#4F46E5"
                            />
                            <MenuItem
                                icon="person-add-outline"
                                label="Refer & Earn"
                                onPress={navigateToRefer}
                                isActive={activeMenu === 'refer'}
                                iconColor="#DB2777"
                                iconImage={require('../assets/images/icons/budget.png')}
                            />
                            <MenuItem
                                icon="library-outline"
                                label="Books"
                                onPress={navigateToBookStore}
                                isActive={activeMenu === 'book-store'}
                                iconColor="#3B82F6"
                                iconImage={require('../assets/images/icons/book.png')}
                            />
                            <MenuItem
                                icon="trophy-outline"
                                label="Winners"
                                onPress={handleLeaderboardPress}
                                isActive={activeMenu === 'leaderboard'}
                                iconColor="#F59E0B"
                            />
                        </MenuSection>
                    </View>

                    <View style={styles.footerCard}>
                        <View style={styles.privacyLinks}>
                            <TouchableOpacity onPress={navigateToPrivacyPolicy}>
                                <Text style={styles.privacyLinkText}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <Text style={styles.privacyDot}>·</Text>
                            <TouchableOpacity onPress={navigateToTerms}>
                                <Text style={styles.privacyLinkText}>Terms</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress} activeOpacity={0.85}>
                            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                            <Text style={styles.logoutButtonText}>Log out</Text>
                        </TouchableOpacity>
                    </View>

                </DrawerContentScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SP_BG,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 24,
        flexGrow: 1,
    },
    headerWrapper: {
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 18,
        overflow: 'hidden',
    },
    headerGradient: {
        paddingVertical: 16,
        paddingHorizontal: 14,
        position: 'relative',
    },
    closeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 2,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 28,
    },
    avatarRing: {
        padding: 2,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        marginRight: 12,
    },
    avatarWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 56,
        height: 56,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    appNameContainer: {
        flex: 1,
        minWidth: 0,
    },
    appName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    userEmail: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
        fontWeight: '500',
    },
    brandPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    tagline: {
        fontSize: 11,
        color: '#F3EEFF',
        fontWeight: '700',
    },
    menuSection: {
        marginHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#EDE9FE',
        marginBottom: 12,
    },
    menuGroup: {
        marginBottom: 4,
    },
    menuGroupTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 8,
        marginBottom: 4,
        marginLeft: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 2,
    },
    activeMenuItem: {
        backgroundColor: PRIMARY,
    },
    menuIconBox: {
        width: 38,
        height: 38,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuIconBoxActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    menuItemIconImage: {
        width: 22,
        height: 22,
    },
    menuItemText: {
        flex: 1,
        fontSize: Platform.select({ ios: 15, android: SCREEN_HEIGHT > 800 ? 15 : 14 }),
        fontWeight: '600',
        color: '#334155',
    },
    activeMenuItemText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    footerCard: {
        marginHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EDE9FE',
        alignItems: 'center',
    },
    socialTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    socialIcons: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 14,
    },
    socialBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E8E8F0',
    },
    privacyLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    privacyLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: PRIMARY,
    },
    privacyDot: {
        marginHorizontal: 8,
        color: '#CBD5E1',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    logoutButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#DC2626',
    },
});

export default CustomDrawerContent; 