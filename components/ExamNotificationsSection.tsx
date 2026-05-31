import { apiFetchAuth } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, Calendar } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface ExamNotification {
    id: string;
    title: string;
    description: string;
    year: number;
    month: number;
    applyLastDate: string;
    applyLink: string;
    createdAt: string;
    updatedAt: string;
    logoUrl?: string; // Optional, for future use
}

const getMonthYear = (notifications: ExamNotification[]) => {
    if (!notifications.length) return '';
    const month = notifications[0].month;
    const year = notifications[0].year;
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[month - 1]} ${year}`;
};

const statusColors = {
    active: {
        border: HomeTheme.primary,
        badge: '#10B981',
        gradient: ['#8E78E7', '#6344D4'],
    },
    urgent: {
        border: '#F59E0B',
        badge: '#F59E0B',
        gradient: ['#FBBF24', '#F59E0B'],
    },
    expired: {
        border: '#EF4444',
        badge: '#EF4444',
        gradient: ['#FCA5A5', '#EF4444'],
    },
};

const ExamNotificationsSection = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { selectedCategory } = useCategory();
    const [notifications, setNotifications] = useState<ExamNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<ExamNotification | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Animation refs for modal
    const modalScale = useRef(new Animated.Value(0)).current;
    const modalOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.token) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await apiFetchAuth('/student/exam-notifications', user.token);
                if (response.ok) {
                    setNotifications(response.data);
                    setError(null);
                } else {
                    setError(response.data.message || 'Failed to fetch notifications');
                }
            } catch (err: any) {
                setError('Failed to fetch exam notifications');
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [user]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    };

    const getDaysRemaining = (lastDate: string) => {
        const today = new Date();
        const lastDateObj = new Date(lastDate);
        const diffTime = lastDateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const openNotificationModal = (notification: ExamNotification) => {
        setSelectedNotification(notification);
        setModalVisible(true);
        
        // Start entrance animation
        Animated.parallel([
            Animated.timing(modalOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(modalScale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeModal = () => {
        // Start exit animation
        Animated.parallel([
            Animated.timing(modalOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(modalScale, {
                toValue: 0.8,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 50,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setModalVisible(false);
            setSelectedNotification(null);
            // Reset animation values
            modalScale.setValue(0);
            modalOpacity.setValue(0);
            slideAnim.setValue(50);
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={HomeTheme.primary} />
            </View>
        );
    }
    
    // Don't return null - always show the section with dummy data if needed
    // Add dummy notifications if we have less than 5
    const getDummyNotifications = () => {
        const dummyData = [
            {
                id: 'dummy-1',
                title: 'SSC CGL 2024 Exam Registration',
                description: 'Staff Selection Commission Combined Graduate Level Examination 2024',
                year: 2024,
                month: 12,
                applyLastDate: '2024-12-25',
                applyLink: '#',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'dummy-2', 
                title: 'Railway NTPC Recruitment 2024',
                description: 'Indian Railways Non-Technical Popular Categories Recruitment',
                year: 2024,
                month: 12,
                applyLastDate: '2024-12-20',
                applyLink: '#',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'dummy-3',
                title: 'UPSC Civil Services Prelims 2025',
                description: 'Union Public Service Commission Civil Services Preliminary Examination',
                year: 2025,
                month: 1,
                applyLastDate: '2024-12-30',
                applyLink: '#',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'dummy-4',
                title: 'Banking PO Recruitment 2024',
                description: 'Probationary Officer recruitment in various public sector banks',
                year: 2024,
                month: 12,
                applyLastDate: '2024-12-18',
                applyLink: '#',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'dummy-5',
                title: 'Teaching Jobs - DSSSB 2024',
                description: 'Delhi Subordinate Services Selection Board Teacher Recruitment',
                year: 2024,
                month: 12,
                applyLastDate: '2024-12-22',
                applyLink: '#',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        ];
        
        // Combine real notifications with dummy ones
        const combined = [...notifications, ...dummyData];
        return combined.slice(0, 5); // Always show 5 notifications
    };

    const displayNotifications = getDummyNotifications();
    let activeNotifications = displayNotifications.filter((item) => getDaysRemaining(item.applyLastDate) >= 0);

    if (selectedCategory) {
        activeNotifications = activeNotifications.filter(
            (item) =>
                item.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                item.description?.toLowerCase().includes(selectedCategory.toLowerCase())
        );
    }

    const upcomingCount = activeNotifications.length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const todayCount = activeNotifications.filter((item) => {
        const d = new Date(item.applyLastDate);
        return d >= todayStart && d < todayEnd;
    }).length;
    const weekCount = activeNotifications.filter((item) => {
        const days = getDaysRemaining(item.applyLastDate);
        return days >= 0 && days <= 7;
    }).length;

    const previewNotifications = activeNotifications.slice(0, 4);

    const getStatusKey = (lastDate: string): 'active' | 'urgent' | 'expired' => {
        const days = getDaysRemaining(lastDate);
        if (days < 0) return 'expired';
        if (days <= 7) return 'urgent';
        return 'active';
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2D2068', '#4B32AF', '#6344D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientShell}
            >
                <View style={styles.orb1} />
                <View style={styles.orb2} />

                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.headerBadge}>
                            <Bell size={12} color="#78350F" strokeWidth={2.4} />
                            <Text style={styles.headerBadgeText}>Job Alerts</Text>
                        </LinearGradient>
                        <Text style={styles.headerSubtitle}>
                            {upcomingCount === 0
                                ? 'No active notifications'
                                : `${upcomingCount} active notification${upcomingCount > 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.viewAllBtn}
                        onPress={() => router.push('/exam-notifications' as any)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.viewAllText}>View All</Text>
                        <ArrowRight size={13} color={HomeTheme.primary} strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <LinearGradient colors={['#FFFBF7', '#FFFFFF']} style={styles.body}>
                <View style={styles.countRow}>
                    <View style={styles.countCol}>
                        <Text style={[styles.countVal, { color: HomeTheme.primary }]}>{upcomingCount}</Text>
                        <Text style={styles.countLabel}>Upcoming</Text>
                    </View>
                    <View style={styles.countDivider} />
                    <View style={styles.countCol}>
                        <Text style={[styles.countVal, { color: '#EA580C' }]}>{todayCount}</Text>
                        <Text style={styles.countLabel}>Today</Text>
                    </View>
                    <View style={styles.countDivider} />
                    <View style={styles.countCol}>
                        <Text style={[styles.countVal, { color: '#059669' }]}>{weekCount}</Text>
                        <Text style={styles.countLabel}>This Week</Text>
                    </View>
                </View>

                {previewNotifications.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.previewScroll}
                    >
                        {previewNotifications.map((item) => {
                            const days = getDaysRemaining(item.applyLastDate);
                            const statusKey = getStatusKey(item.applyLastDate);
                            const urgent = days >= 0 && days <= 7;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.previewCard}
                                    onPress={() => openNotificationModal(item)}
                                    activeOpacity={0.88}
                                >
                                    <View style={styles.previewTop}>
                                        <LinearGradient
                                            colors={[...HomeTheme.heroCta]}
                                            style={styles.previewIcon}
                                        >
                                            <Ionicons name="briefcase-outline" size={16} color="#FFF" />
                                        </LinearGradient>
                                        {urgent && (
                                            <View style={styles.urgentPill}>
                                                <Text style={styles.urgentText}>Urgent</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.previewTitle} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                    <View style={styles.previewFooter}>
                                        <Calendar size={11} color={HomeTheme.primaryLight} strokeWidth={2} />
                                        <Text style={styles.previewDate}>
                                            {days >= 0 ? `${days}d left` : 'Expired'}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.previewStatusBar,
                                            { backgroundColor: statusColors[statusKey].badge },
                                        ]}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyPreview}>
                        <LinearGradient colors={[...HomeTheme.heroCta]} style={styles.emptyIcon}>
                            <Bell size={22} color="#FFF" strokeWidth={2} />
                        </LinearGradient>
                        <Text style={styles.emptyText}>You&apos;re all caught up!</Text>
                        <Text style={styles.emptySub}>New exam alerts will appear here</Text>
                    </View>
                )}
            </LinearGradient>

            {/* Enhanced Modal with Animations */}
            <Modal
                animationType="none"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <Animated.View 
                    style={[
                        styles.modalOverlay,
                        {
                            opacity: modalOpacity,
                        }
                    ]}
                >
                    <TouchableOpacity 
                        style={styles.modalBackdrop} 
                        activeOpacity={1} 
                        onPress={closeModal}
                    />
                    <Animated.View 
                        style={[
                            styles.modalCardWrap,
                            {
                                transform: [
                                    { scale: modalScale },
                                    { translateY: slideAnim }
                                ],
                                opacity: modalOpacity,
                            }
                        ]}
                    >
                        {/* Enhanced Header */}
                        <LinearGradient
                            colors={[...HomeTheme.heroCta]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.modalHeaderGradient}
                        >
                            <View style={styles.modalHeaderRow}>
                                <View style={styles.headerTitleContainer}>
                                    <View style={styles.modalIconContainer}>
                                        <Ionicons name="document-text" size={24} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.modalHeaderTitle}>Exam Details</Text>
                                </View>
                                <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                                    <Ionicons name="close-circle" size={28} color="rgba(255, 255, 255, 0.9)" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        
                        {/* Enhanced Content */}
                        <View style={styles.modalContentEnhanced}>
                            {selectedNotification && (
                                <>
                                    {/* Title Section */}
                                    <View style={styles.titleSection}>
                                        <Text style={styles.modalExamTitle}>{selectedNotification.title}</Text>
                                    </View>
                                    
                                    {/* Status and Date Row */}
                                    <View style={styles.modalStatusRow}>
                                        <LinearGradient
                                            colors={statusColors[getDaysRemaining(selectedNotification.applyLastDate) < 0 ? 'expired' : getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'urgent' : 'active'].gradient as [string, string]}
                                            style={styles.modalStatusBadgeEnhanced}
                                        >
                                            <Ionicons 
                                                name={getDaysRemaining(selectedNotification.applyLastDate) < 0 ? 'close-circle' : 
                                                     getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'warning' : 'checkmark-circle'} 
                                                size={16} 
                                                color="#FFFFFF" 
                                                style={{ marginRight: 6 }} 
                                            />
                                            <Text style={styles.modalStatusText}>
                                                {getDaysRemaining(selectedNotification.applyLastDate) < 0 ? 'Expired' :
                                                getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'Urgent' : 'Active'}
                                            </Text>
                                        </LinearGradient>
                                        
                                        <View style={styles.modalDateBoxEnhanced}>
                                            <LinearGradient
                                                colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)']}
                                                style={styles.dateGradient}
                                            >
                                                <Ionicons name="calendar" size={18} color="#8B5CF6" />
                                                <Text style={styles.modalDateText}>
                                                    {formatDate(selectedNotification.applyLastDate)}
                                                </Text>
                                            </LinearGradient>
                                        </View>
                                    </View>
                                    
                                    {/* Description Section */}
                                    <View style={styles.descriptionSection}>
                                        <View style={styles.descriptionHeader}>
                                            <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                                            <Text style={styles.descriptionLabel}>Description</Text>
                                        </View>
                                        <ScrollView style={styles.descriptionScroll} showsVerticalScrollIndicator={false}>
                                            <Text style={styles.modalDescription}>{selectedNotification.description}</Text>
                                        </ScrollView>
                                    </View>
                                    
                                    {/* Apply Button */}
                                    {getDaysRemaining(selectedNotification.applyLastDate) >= 0 && (
                                        <TouchableOpacity
                                            style={styles.applyButtonContainer}
                                            onPress={() => selectedNotification.applyLink && Linking.openURL(selectedNotification.applyLink)}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={[...HomeTheme.heroCta]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.modalApplyButtonEnhanced}
                                            >
                                                <Ionicons name="rocket" size={22} color="#FFFFFF" />
                                                <Text style={styles.modalApplyButtonText}>
                                                    {getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'Apply Now!' : 'Apply Online'}
                                                </Text>
                                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#C4B5FD',
        ...Platform.select({
            ios: {
                shadowColor: '#4B32AF',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 18,
            },
            android: { elevation: 7 },
        }),
    },
    gradientShell: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 14,
        overflow: 'hidden',
    },
    orb1: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -30,
        right: -10,
    },
    orb2: {
        position: 'absolute',
        width: 55,
        height: 55,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.06)',
        bottom: -15,
        left: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        zIndex: 1,
    },
    headerLeft: { flex: 1, marginRight: 10 },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 8,
    },
    headerBadgeText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 11,
        color: '#78350F',
    },
    headerSubtitle: {
        fontFamily: FontFamily.medium,
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
    },
    viewAllText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 11,
        color: HomeTheme.primary,
    },
    body: {
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 16,
    },
    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: HomeTheme.border,
    },
    countCol: { flex: 1, alignItems: 'center' },
    countDivider: { width: 1, height: 28, backgroundColor: HomeTheme.border },
    countVal: { fontFamily: FontFamily.bold, fontSize: 20, marginBottom: 2 },
    countLabel: {
        fontFamily: FontFamily.regular,
        fontSize: 10,
        color: HomeTheme.inkMuted,
    },
    previewScroll: {
        gap: 10,
        paddingRight: 4,
    },
    previewCard: {
        width: 168,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#6344D4',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: { elevation: 2 },
        }),
    },
    previewTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    previewIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    urgentPill: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
    },
    urgentText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 9,
        color: '#B45309',
    },
    previewTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 12,
        color: HomeTheme.ink,
        lineHeight: 16,
        marginBottom: 10,
        minHeight: 32,
    },
    previewFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    previewDate: {
        fontFamily: FontFamily.medium,
        fontSize: 10,
        color: HomeTheme.inkMuted,
    },
    previewStatusBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    emptyPreview: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 14,
        color: HomeTheme.ink,
    },
    emptySub: {
        fontFamily: FontFamily.regular,
        fontSize: 12,
        color: HomeTheme.inkMuted,
        marginTop: 4,
    },
    loadingContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: HomeTheme.border,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCardWrap: {
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 15,
        borderWidth: 1,
        borderColor: '#C4B5FD',
    },
    modalHeaderGradient: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    modalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    modalHeaderTitle: {
        fontSize: 20,
        fontFamily: FontFamily.bold,
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    modalCloseBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        padding: 8,
        marginLeft: 10,
    },
    // Enhanced modal content styles
    modalContentEnhanced: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        padding: 24,
    },
    titleSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    modalStatusBadgeEnhanced: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modalDateBoxEnhanced: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    dateGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    descriptionSection: {
        marginBottom: 24,
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    descriptionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginLeft: 8,
        letterSpacing: 0.3,
    },
    descriptionScroll: {
        maxHeight: 120,
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    applyButtonContainer: {
        marginTop: 8,
    },
    modalApplyButtonEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    modalContentGlass: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
        padding: 22,
        width: '100%',
        alignSelf: 'center',
    },
    modalExamTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        letterSpacing: 0.5,
        lineHeight: 28,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    modalStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalStatusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    modalStatusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    modalDateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ede9fe',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    modalDateText: {
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '600',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#ede9fe',
        marginVertical: 16,
        borderRadius: 1,
    },
    modalDescriptionBox: {
        backgroundColor: 'rgba(243,244,246,0.7)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
    },
    modalDescription: {
        color: '#374151',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    modalApplyButton: {
        marginTop: 8,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
    },
    modalApplyButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        marginHorizontal: 8,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});

export default ExamNotificationsSection; 