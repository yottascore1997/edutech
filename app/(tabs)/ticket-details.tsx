import { apiFetchAuth, uploadFile } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Attachment {
    fileName: string;
    fileSize: number;
    fileUrl: string;
    mimeType: string;
}

interface Reply {
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
    attachments?: Attachment[];
}

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
    replies: Reply[];
    _count: {
        replies: number;
    };
}

const TicketDetailsScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [newReply, setNewReply] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploading, setUploading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (id && user?.token) {
                fetchTicketDetails();
            }
        }, [id, user?.token])
    );

    const fetchTicketDetails = async () => {
        if (!user?.token || !id) return;

        try {
            setLoading(true);
            const response = await apiFetchAuth(`/student/support-tickets/${id}`, user.token);
            
            if (response.ok) {
                setTicket(response.data);
            } else {
                Alert.alert('Error', 'Failed to load ticket details.');
            }
        } catch (error) {
            console.error('Error fetching ticket details:', error);
            Alert.alert('Error', 'Failed to load ticket details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            setUploading(true);
            
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                
                // Upload file using API service
                const uploadedFileUrl = await uploadFile(asset.uri, user?.token || '');
                
                // Create attachment object
                const attachment = {
                    fileName: `attachment_${Date.now()}.jpg`,
                    fileSize: asset.fileSize || 0,
                    fileUrl: uploadedFileUrl,
                    mimeType: 'image/jpeg',
                };
                
                setAttachments(prev => [...prev, attachment]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image.');
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const sendReply = async () => {
        if ((!newReply.trim() && attachments.length === 0) || !user?.token || !id) {
            Alert.alert('Error', 'Please enter a message or attach an image.');
            return;
        }

        try {
            setSendingReply(true);
            
            const payload = {
                content: newReply.trim(),
                attachments: attachments.map(att => ({
                    fileName: att.fileName,
                    fileSize: att.fileSize,
                    fileUrl: att.fileUrl,
                    mimeType: att.mimeType,
                })),
            };

            const response = await apiFetchAuth(`/student/support-tickets/${id}`, user.token, {
                method: 'POST',
                body: payload,
            });

            if (response.ok) {
                setNewReply('');
                setAttachments([]);
                fetchTicketDetails();
            } else {
                Alert.alert('Error', 'Failed to send reply.');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            Alert.alert('Error', 'Failed to send reply. Please try again.');
        } finally {
            setSendingReply(false);
        }
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

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    const renderAttachment = ({ item, index }: { item: Attachment; index: number }) => (
        <View style={styles.attachmentItem}>
            <View style={styles.attachmentInfo}>
                <View style={styles.attachmentIcon}>
                    <Ionicons name="image" size={16} color="#667eea" />
                </View>
                <View style={styles.attachmentDetails}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                        {item.fileName}
                    </Text>
                    <Text style={styles.attachmentSize}>
                        {formatFileSize(item.fileSize)}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeAttachment(index)}
            >
                <Ionicons name="close-circle" size={20} color="#e74c3c" />
            </TouchableOpacity>
        </View>
    );

    const renderReply = ({ item }: { item: Reply }) => (
        <View style={[
            styles.replyContainer,
            item.user.id === user?.id ? styles.userReply : styles.adminReply
        ]}>
            {item.user.id === user?.id ? (
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                    style={styles.replyBubble}
                >
                    <View style={styles.replyHeader}>
                        <Text style={styles.userAuthor}>
                            {item.user.name}
                        </Text>
                        <Text style={styles.replyTime}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.userContent}>
                        {item.content}
                    </Text>
                    
                    {/* Render attachments if any */}
                    {item.attachments && item.attachments.length > 0 && (
                        <View style={styles.replyAttachments}>
                            {item.attachments.map((attachment, index) => (
                                <View key={index} style={styles.replyAttachmentItem}>
                                    <View style={styles.replyAttachmentIcon}>
                                        <Ionicons name="image" size={16} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.replyAttachmentDetails}>
                                        <Text style={styles.replyAttachmentName} numberOfLines={1}>
                                            {attachment.fileName}
                                        </Text>
                                        <Text style={styles.replyAttachmentSize}>
                                            {formatFileSize(attachment.fileSize)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                    
                    {item.isInternal && (
                        <View style={styles.internalBadge}>
                            <Text style={styles.internalText}>Internal Note</Text>
                        </View>
                    )}
                </LinearGradient>
            ) : (
                <LinearGradient
                    colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
                    style={styles.replyBubble}
                >
                    <View style={styles.replyHeader}>
                        <Text style={styles.adminAuthor}>
                            {item.user.name}
                        </Text>
                        <Text style={styles.adminReplyTime}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.adminContent}>
                        {item.content}
                    </Text>
                    
                    {/* Render attachments if any */}
                    {item.attachments && item.attachments.length > 0 && (
                        <View style={styles.replyAttachments}>
                            {item.attachments.map((attachment, index) => (
                                <View key={index} style={styles.replyAttachmentItem}>
                                    <View style={styles.replyAttachmentIcon}>
                                        <Ionicons name="image" size={16} color="#4F46E5" />
                                    </View>
                                    <View style={styles.replyAttachmentDetails}>
                                        <Text style={styles.replyAttachmentName} numberOfLines={1}>
                                            {attachment.fileName}
                                        </Text>
                                        <Text style={styles.replyAttachmentSize}>
                                            {formatFileSize(attachment.fileSize)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                    
                    {item.isInternal && (
                        <View style={styles.internalBadge}>
                            <Text style={styles.internalText}>Internal Note</Text>
                        </View>
                    )}
                </LinearGradient>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                    style={styles.loadingContainer}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Loading ticket details...</Text>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    if (!ticket) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
                    <Text style={styles.errorTitle}>Ticket Not Found</Text>
                    <Text style={styles.errorSubtitle}>The ticket you're looking for doesn't exist.</Text>
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
                        <Text style={styles.headerTitle}>Ticket Details</Text>
                        <Text style={styles.headerSubtitle}>{ticket.ticketId}</Text>
                    </View>
                    <View style={styles.headerStatus}>
                        <LinearGradient
                            colors={[getStatusColor(ticket.status), getStatusColor(ticket.status) + 'CC']}
                            style={styles.statusBadge}
                        >
                            <Text style={styles.statusText}>{getStatusText(ticket.status)}</Text>
                        </LinearGradient>
                    </View>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    {/* Ticket Info */}
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ticketInfo}
                    >
                        <View style={styles.ticketHeader}>
                            <View style={styles.titleContainer}>
                                <LinearGradient
                                    colors={['#4F46E5', '#7C3AED']}
                                    style={styles.issueIconGradient}
                                >
                                    <Ionicons 
                                        name={getIssueTypeIcon(ticket.issueType) as any} 
                                        size={20} 
                                        color="#FFFFFF"
                                    />
                                </LinearGradient>
                                <Text style={styles.ticketTitle}>{ticket.title}</Text>
                            </View>
                            
                            <View style={styles.metaContainer}>
                                <LinearGradient
                                    colors={[getPriorityColor(ticket.priority), getPriorityColor(ticket.priority) + 'CC']}
                                    style={styles.priorityBadge}
                                >
                                    <Text style={styles.priorityText}>{getPriorityText(ticket.priority)} Priority</Text>
                                </LinearGradient>
                                <Text style={styles.createdDate}>Created {formatDate(ticket.createdAt)}</Text>
                            </View>
                        </View>

                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionLabel}>Description</Text>
                            <Text style={styles.descriptionText}>{ticket.description}</Text>
                        </View>
                    </LinearGradient>

                    {/* Replies */}
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.repliesSection}
                    >
                        <View style={styles.repliesHeader}>
                            <Text style={styles.repliesTitle}>Conversation</Text>
                            <LinearGradient
                                colors={['#4F46E5', '#7C3AED']}
                                style={styles.repliesCountGradient}
                            >
                                <Text style={styles.repliesCount}>{ticket.replies.length} replies</Text>
                            </LinearGradient>
                        </View>

                        <FlatList
                            data={ticket.replies}
                            renderItem={renderReply}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.repliesList}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                        />
                    </LinearGradient>
                    
                    {/* Bottom spacing for input */}
                    <View style={styles.bottomSpacing} />
                </ScrollView>

                {/* Reply Input */}
                {ticket.status !== 'CLOSED' && (
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC']}
                        style={styles.replyInputContainer}
                    >
                        {/* Attachments Preview */}
                        {attachments.length > 0 && (
                            <View style={styles.attachmentsPreview}>
                                <Text style={styles.attachmentsTitle}>Attachments ({attachments.length})</Text>
                                <FlatList
                                    data={attachments}
                                    renderItem={renderAttachment}
                                    keyExtractor={(item, index) => index.toString()}
                                    showsVerticalScrollIndicator={false}
                                    scrollEnabled={false}
                                />
                            </View>
                        )}
                        
                        <View style={styles.inputContainer}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.replyInput}
                                    placeholder="Type your reply..."
                                    placeholderTextColor="#95a5a6"
                                    value={newReply}
                                    onChangeText={setNewReply}
                                    multiline
                                    maxLength={500}
                                />
                                <TouchableOpacity
                                    style={styles.attachButton}
                                    onPress={pickImage}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <ActivityIndicator size="small" color="#4F46E5" />
                                    ) : (
                                        <Ionicons name="camera-outline" size={20} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    ((!newReply.trim() && attachments.length === 0) || sendingReply) && styles.sendButtonDisabled
                                ]}
                                onPress={sendReply}
                                disabled={(!newReply.trim() && attachments.length === 0) || sendingReply}
                            >
                                <LinearGradient
                                    colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                                    style={styles.sendButtonGradient}
                                >
                                    {sendingReply ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="send" size={20} color="#fff" />
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                )}
            </KeyboardAvoidingView>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    headerStatus: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    ticketInfo: {
        margin: 20,
        borderRadius: 18,
        padding: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    ticketHeader: {
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    issueIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    issueIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    ticketTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        lineHeight: 24,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    createdDate: {
        fontSize: 12,
        color: '#95a5a6',
    },
    descriptionContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f8f9fa',
        paddingTop: 16,
    },
    descriptionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#6c757d',
        lineHeight: 20,
    },
    repliesSection: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 18,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    repliesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    repliesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    repliesCount: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    repliesCountGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    repliesList: {
        padding: 20,
    },
    replyContainer: {
        marginBottom: 16,
    },
    userReply: {
        alignItems: 'flex-end',
    },
    adminReply: {
        alignItems: 'flex-start',
    },
    replyBubble: {
        maxWidth: '80%',
        padding: 16,
        borderRadius: 18,
    },
    replyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    replyAuthor: {
        fontSize: 12,
        fontWeight: '600',
    },
    userAuthor: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    adminAuthor: {
        color: '#6c757d',
    },
    replyTime: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    adminReplyTime: {
        fontSize: 10,
        color: '#6B7280',
    },
    replyContent: {
        fontSize: 14,
        lineHeight: 20,
    },
    userContent: {
        color: '#fff',
    },
    adminContent: {
        color: '#2c3e50',
    },
    replyAttachments: {
        marginTop: 12,
    },
    replyAttachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 8,
        borderRadius: 8,
        marginBottom: 4,
    },
    replyAttachmentIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    replyAttachmentDetails: {
        flex: 1,
    },
    replyAttachmentName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    replyAttachmentSize: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    internalBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    internalText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    replyInputContainer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        minHeight: 90,
    },
    attachmentsPreview: {
        marginBottom: 16,
    },
    attachmentsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    attachmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    attachmentIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    attachmentDetails: {
        flex: 1,
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 2,
    },
    attachmentSize: {
        fontSize: 12,
        color: '#95a5a6',
        fontWeight: '500',
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    replyInput: {
        flex: 1,
        maxHeight: 100,
        fontSize: 14,
        color: '#2c3e50',
        paddingVertical: 8,
    },
    attachButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sendButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#95a5a6',
        shadowOpacity: 0,
        elevation: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 20,
    },
    bottomSpacing: {
        height: 120, // Add more space at the bottom to prevent input from being hidden
    },
});

export default TicketDetailsScreen; 
