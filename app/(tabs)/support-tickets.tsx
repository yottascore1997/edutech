import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SupportTicket {
    id: string;
    ticketId: string;
    title: string;
    description: string;
    issueType: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
    userId: string;
    assignedToId: string | null;
    user: {
        id: string;
        name: string;
        email: string;
    };
    assignedTo: any;
    replies: Array<{
        id: string;
        content: string;
        isInternal: boolean;
        createdAt: string;
        updatedAt: string;
        ticketId: string;
        userId: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    _count: {
        replies: number;
    };
}

interface SupportTicketsResponse {
    tickets: SupportTicket[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const SupportTicketsScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('ALL');

    useFocusEffect(
        useCallback(() => {
            if (user?.token) {
                fetchTickets();
            }
        }, [user?.token, selectedStatus])
    );

    const fetchTickets = async () => {
        if (!user?.token) return;

        try {
            setLoading(true);
            const response = await apiFetchAuth(`/student/support-tickets?status=${selectedStatus}`, user.token);
            
            if (response.ok) {
                const data: SupportTicketsResponse = response.data;
                setTickets(data.tickets || []);
            } else {
                Alert.alert('Error', 'Failed to load support tickets.');
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            Alert.alert('Error', 'Failed to load support tickets. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTickets();
        setRefreshing(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN':
                return '#ff6b6b';
            case 'IN_PROGRESS':
                return '#4ecdc4';
            case 'RESOLVED':
                return '#45b7d1';
            case 'CLOSED':
                return '#96ceb4';
            default:
                return '#95a5a6';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return '#e74c3c';
            case 'HIGH':
                return '#f39c12';
            case 'MEDIUM':
                return '#3498db';
            case 'LOW':
                return '#27ae60';
            default:
                return '#95a5a6';
        }
    };

    const getIssueTypeIcon = (issueType: string) => {
        switch (issueType) {
            case 'EXAM_ACCESS':
                return 'school-outline';
            case 'PAYMENT_PROBLEM':
                return 'card-outline';
            case 'TECHNICAL_ISSUE':
                return 'construct-outline';
            case 'ACCOUNT_ISSUE':
                return 'person-outline';
            default:
                return 'help-circle-outline';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'Open';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'RESOLVED':
                return 'Resolved';
            case 'CLOSED':
                return 'Closed';
            default:
                return status;
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return 'Urgent';
            case 'HIGH':
                return 'High';
            case 'MEDIUM':
                return 'Medium';
            case 'LOW':
                return 'Low';
            default:
                return priority;
        }
    };

    const renderTicketCard = ({ item }: { item: SupportTicket }) => (
        <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => router.push({ pathname: '/(tabs)/ticket-details', params: { id: item.id } })}
            activeOpacity={0.95}
        >
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ticketGradient}
            >
                <View style={styles.ticketHeader}>
                    <View style={styles.ticketIdContainer}>
                        <LinearGradient
                            colors={['#4F46E5', '#7C3AED']}
                            style={styles.ticketIdGradient}
                        >
                            <Ionicons name="ticket-outline" size={16} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.ticketId}>{item.ticketId}</Text>
                    </View>
                    <View style={styles.statusContainer}>
                        <LinearGradient
                            colors={[getStatusColor(item.status), getStatusColor(item.status) + 'CC']}
                            style={styles.statusBadge}
                        >
                            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                        </LinearGradient>
                    </View>
                </View>

                <View style={styles.ticketContent}>
                    <View style={styles.titleContainer}>
                        <LinearGradient
                            colors={['#4F46E5', '#7C3AED']}
                            style={styles.issueIconGradient}
                        >
                            <Ionicons 
                                name={getIssueTypeIcon(item.issueType) as any} 
                                size={18} 
                                color="#FFFFFF"
                            />
                        </LinearGradient>
                        <Text style={styles.ticketTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                    </View>

                    <Text style={styles.ticketDescription} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.ticketMeta}>
                        <View style={styles.priorityContainer}>
                            <LinearGradient
                                colors={[getPriorityColor(item.priority), getPriorityColor(item.priority) + 'CC']}
                                style={styles.priorityBadge}
                            >
                                <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.repliesContainer}>
                            <LinearGradient
                                colors={['#E2E8F0', '#CBD5E1']}
                                style={styles.repliesGradient}
                            >
                                <Ionicons name="chatbubble-outline" size={14} color="#4F46E5" />
                                <Text style={styles.repliesText}>{item._count.replies} replies</Text>
                            </LinearGradient>
                        </View>
                    </View>

                    <View style={styles.ticketFooter}>
                        <View style={styles.dateContainer}>
                            <Ionicons name="time-outline" size={14} color="#6B7280" />
                            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                        </View>
                        
                        <LinearGradient
                            colors={['#4F46E5', '#7C3AED']}
                            style={styles.arrowContainer}
                        >
                            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                        </LinearGradient>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                style={styles.emptyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                    style={styles.emptyIconContainer}
                >
                    <Ionicons name="headset-outline" size={64} color="rgba(255, 255, 255, 0.9)" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No Support Tickets</Text>
                <Text style={styles.emptySubtitle}>
                    You haven't created any support tickets yet.{'\n'}We're here to help whenever you need us!
                </Text>
            </LinearGradient>
        </View>
    );

    const renderStatusFilter = () => (
        <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.filterContainer}
        >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.filterButton,
                            selectedStatus === status && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedStatus(status)}
                    >
                        {selectedStatus === status ? (
                            <LinearGradient
                                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.filterButtonGradient}
                            >
                                <Text style={styles.filterButtonTextActive}>
                                    {status === 'ALL' ? 'All' : getStatusText(status)}
                                </Text>
                            </LinearGradient>
                        ) : (
                            <Text style={styles.filterButtonText}>
                                {status === 'ALL' ? 'All' : getStatusText(status)}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </LinearGradient>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading support tickets...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                            style={styles.backButtonGradient}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>24/7 Support</Text>
                        <Text style={styles.headerSubtitle}>We're here to help you anytime</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.newTicketButton}
                        onPress={() => router.push('/new-ticket')}
                    >
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                            style={styles.newTicketButtonGradient}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Status Filter */}
            {renderStatusFilter()}

            {/* Tickets List */}
            <FlatList
                data={tickets}
                renderItem={renderTicketCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={renderEmptyState}
            />

            {/* Floating Create Ticket Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => router.push('/new-ticket')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                    style={styles.floatingButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.floatingButtonText}>New Ticket</Text>
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    newTicketButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newTicketButtonGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    filterButtonActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6c757d',
    },
    filterButtonGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    filterButtonTextActive: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
    listContainer: {
        padding: 20,
    },
    ticketCard: {
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    ticketGradient: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    ticketIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ticketIdGradient: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    ticketId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    statusContainer: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    ticketContent: {
        padding: 14,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    issueIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    issueIconGradient: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 2,
    },
    ticketTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        lineHeight: 22,
    },
    ticketDescription: {
        fontSize: 14,
        color: '#6c757d',
        lineHeight: 20,
        marginBottom: 16,
    },
    ticketMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    priorityContainer: {
        alignItems: 'flex-start',
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
    },
    repliesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    repliesGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    repliesText: {
        fontSize: 12,
        color: '#4F46E5',
        marginLeft: 4,
        fontWeight: '600',
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f8f9fa',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#95a5a6',
        marginLeft: 4,
    },
    arrowContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyGradient: {
        width: '100%',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6c757d',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        borderRadius: 25,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    floatingButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    floatingButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
    },
});

export default SupportTicketsScreen; 
