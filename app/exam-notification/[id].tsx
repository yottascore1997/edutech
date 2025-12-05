import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function ExamNotificationDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [notification, setNotification] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchNotification = async () => {
            if (!id) return;
            setLoading(true);
            const response = await apiFetchAuth(`/student/exam-notifications`, null);
            if (response.ok) {
                const found = response.data.find((n: any) => n.id === id);
                setNotification(found);
            }
            setLoading(false);
        };
        fetchNotification();
    }, [id]);
    if (loading || !notification) {
        return <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 40 }} />;
    }
    const daysRemaining = getDaysRemaining(notification.applyLastDate);
    const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
    const isExpired = daysRemaining < 0;
    const status = isExpired ? 'expired' : isUrgent ? 'urgent' : 'active';
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#a18cd1", "#fbc2eb"] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Exam Details</Text>
                    <View style={{ width: 32 }} />
                </View>
            </LinearGradient>
            <BlurView intensity={70} tint="light" style={styles.contentGlass}>
                <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                    <Text style={styles.examTitle}>{notification.title}</Text>
                    <View style={styles.statusRow}>
                        <LinearGradient
                            colors={statusColors[status].gradient as [string, string]}
                            style={styles.statusBadge}
                        >
                            <Text style={styles.statusText}>{status === 'active' ? 'Active' : status === 'urgent' ? 'Urgent' : 'Expired'}</Text>
                        </LinearGradient>
                        <Text style={styles.dateText}>Last Date: {formatDate(notification.applyLastDate)}</Text>
                    </View>
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionLabel}>Description</Text>
                        <Text style={styles.description}>{notification.description}</Text>
                    </View>
                    {daysRemaining >= 0 && (
                        <LinearGradient
                            colors={["#7C3AED", "#a18cd1"] as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.applyButton}
                        >
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => notification.applyLink && router.push(notification.applyLink)}
                            >
                                <Ionicons name="open-outline" size={18} color={AppColors.white} />
                                <Text style={styles.applyButtonText}>{daysRemaining <= 7 ? 'Apply Now!' : 'Apply'}</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    )}
                </ScrollView>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 18,
        marginHorizontal: 0,
        paddingBottom: 10,
    },
    headerGradient: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 8,
        padding: 6,
        marginRight: 8,
    },
    contentGlass: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        padding: 20,
        width: '100%',
        alignSelf: 'center',
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        flex: 1,
    },
    examTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3b0764',
        marginBottom: 15,
        letterSpacing: 0.2,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        color: AppColors.white,
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    dateText: {
        fontSize: 15,
        color: '#7C3AED',
        fontWeight: '600',
    },
    sectionBox: {
        marginBottom: 24,
        backgroundColor: 'rgba(243,244,246,0.7)',
        padding: 16,
        borderRadius: 12,
    },
    sectionLabel: {
        fontWeight: 'bold',
        color: '#7C3AED',
        marginBottom: 6,
        fontSize: 15,
    },
    description: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    applyButton: {
        marginTop: 10,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
    },
    applyButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
        letterSpacing: 0.2,
    },
}); 