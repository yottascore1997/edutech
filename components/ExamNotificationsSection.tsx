import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        border: '#7C3AED',
        badge: '#10B981',
        gradient: ['#a18cd1', '#fbc2eb'],
    },
    urgent: {
        border: '#F59E0B',
        badge: '#F59E0B',
        gradient: ['#f7971e', '#ffd200'],
    },
    expired: {
        border: '#EF4444',
        badge: '#EF4444',
        gradient: ['#f85032', '#e73827'],
    },
};

const ExamNotificationsSection = () => {
    const { user } = useAuth();
    const router = useRouter();
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
                <ActivityIndicator size="small" color={AppColors.primary} />
            </View>
        );
    }
    if (error || notifications.length === 0) {
        return null;
    }

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
    const monthYear = getMonthYear(notifications.length > 0 ? notifications : displayNotifications);
    const examCount = displayNotifications.length;



    return (
        <View style={styles.container}>
            {/* Header Section */}
            <LinearGradient
                colors={['#2563EB', '#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <LinearGradient
                            colors={['#DB2777', '#BE185D']}
                            style={styles.headerIcon}
                        >
                            <Ionicons name="notifications" size={16} color="#FFFFFF" />
                        </LinearGradient>
                        <View>
                            <Text style={styles.headerTitle}>Exam Notifications</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.headerViewAllButton}
                        onPress={() => router.push('/exam-notifications')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.headerViewAllText}>View All</Text>
                        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
            
            {/* Dynamic Notifications (Max 5) */}
            <View style={styles.notificationsList}>
                {displayNotifications.slice(0, Math.min(5, notifications.length)).map((item, index) => {
                    const daysRemaining = getDaysRemaining(item.applyLastDate);
                    const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
                    const isExpired = daysRemaining < 0;
                    
                    return (
            <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.notificationItem,
                                {
                                    backgroundColor: isUrgent ? 'rgba(245, 158, 11, 0.05)' : 
                                                   isExpired ? 'rgba(239, 68, 68, 0.05)' : 
                                                   'rgba(16, 185, 129, 0.05)',
                                    borderLeftWidth: 4,
                                    borderLeftColor: isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981'
                                }
                            ]}
                            onPress={() => openNotificationModal(item)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.notificationContent}>
                                <View style={styles.notificationHeader}>
                                    <Text style={styles.notificationTitle} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <View style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor: isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981'
                                        }
                                    ]}>
                                        <Text style={styles.statusText}>
                                            {isExpired ? 'Expired' : isUrgent ? 'Urgent' : 'Active'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.notificationInfo}>
                                    <Ionicons name="calendar-outline" size={14} color={AppColors.grey} />
                                    <Text style={styles.dateText}>
                                        Last Date: {formatDate(item.applyLastDate)}
                                    </Text>
                                </View>
                                {!isExpired && (
                                    <Text style={[styles.daysLeft, { color: isUrgent ? '#F59E0B' : AppColors.grey }]}>
                                        {daysRemaining === 0 ? 'Last Day!' : `${daysRemaining} days left`}
                                    </Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={AppColors.grey} />
                        </TouchableOpacity>
                    );
                })}
            </View>

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
                            colors={['#047857', '#059669', '#10B981']}
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
                                                colors={['#10B981', '#059669', '#047857']}
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
        marginVertical: 12,
        borderRadius: 24,
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 2,
        borderColor: 'rgba(4, 120, 87, 0.1)',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    header: {
        marginHorizontal: -2,
        marginTop: -2,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginBottom: 15,
        overflow: 'hidden',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'rgba(5, 150, 105, 0.3)',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.08)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 20,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.3,
        fontFamily: 'System',
    },
    headerViewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerViewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    monthBadge: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    monthGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    monthText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
        fontFamily: 'System',
    },
    notificationsList: {
        marginBottom: 10,
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: AppColors.white,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: 'rgba(4, 120, 87, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(4, 120, 87, 0.1)',
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        marginRight: 10,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.08)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    statusText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 0.4,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    notificationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 13,
        color: '#047857',
        marginLeft: 6,
        fontWeight: '600',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(4, 120, 87, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    daysLeft: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.08)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
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
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
        elevation: 15,
        borderWidth: 2,
        borderColor: 'rgba(4, 120, 87, 0.15)',
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
        backgroundColor: 'rgba(219, 39, 119, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 2,
        borderColor: 'rgba(219, 39, 119, 0.3)',
        shadowColor: '#DB2777',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    modalHeaderTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.7,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 5,
        fontFamily: 'System',
        lineHeight: 26,
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
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
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