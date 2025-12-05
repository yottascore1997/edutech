import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
    View
} from 'react-native';

interface Attachment {
    fileName: string;
    fileSize: number;
    fileUrl: string;
    mimeType: string;
}

const NewTicketScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [issueType, setIssueType] = useState('EXAM_ACCESS');
    const [priority, setPriority] = useState('MEDIUM');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const issueTypes = [
        { value: 'EXAM_ACCESS', label: 'Exam Access', icon: 'school-outline', color: '#667eea' },
        { value: 'PAYMENT_PROBLEM', label: 'Payment Problem', icon: 'card-outline', color: '#f39c12' },
        { value: 'TECHNICAL_ISSUE', label: 'Technical Issue', icon: 'construct-outline', color: '#e74c3c' },
        { value: 'ACCOUNT_ISSUE', label: 'Account Issue', icon: 'person-outline', color: '#27ae60' },
        { value: 'GENERAL_INQUIRY', label: 'General Inquiry', icon: 'help-circle-outline', color: '#9b59b6' },
    ];

    const priorities = [
        { value: 'LOW', label: 'Low', color: '#27ae60', bgColor: '#d5f4e6' },
        { value: 'MEDIUM', label: 'Medium', color: '#3498db', bgColor: '#d6eaf8' },
        { value: 'HIGH', label: 'High', color: '#f39c12', bgColor: '#fdebd0' },
        { value: 'URGENT', label: 'Urgent', color: '#e74c3c', bgColor: '#fadbd8' },
    ];

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
                
                // Create form data for file upload
                const formData = new FormData();
                formData.append('file', {
                    uri: asset.uri,
                    type: 'image/jpeg',
                    name: `attachment_${Date.now()}.jpg`,
                } as any);

                // Upload file to server
                const uploadResponse = await apiFetchAuth('/upload', user?.token || '', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (uploadResponse.ok) {
                    const uploadedFile = uploadResponse.data;
                    setAttachments(prev => [...prev, uploadedFile]);
                } else {
                    Alert.alert('Error', 'Failed to upload attachment.');
                }
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

    const createTicket = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        try {
            setLoading(true);
            
            const payload = {
                title: title.trim(),
                description: description.trim(),
                issueType,
                priority,
                attachments: attachments.map(att => ({
                    fileName: att.fileName,
                    fileSize: att.fileSize,
                    fileUrl: att.fileUrl,
                    mimeType: att.mimeType,
                })),
            };

            const response = await apiFetchAuth('/student/support-tickets', user?.token || '', {
                method: 'POST',
                body: payload,
            });

            if (response.ok) {
                Alert.alert(
                    'Success',
                    'Support ticket created successfully!',
                    [
                        {
                            text: 'View Ticket',
                            onPress: () => router.push({ pathname: '/(tabs)/ticket-details', params: { id: response.data.id } }),
                        },
                        {
                            text: 'Back to List',
                            onPress: () => router.push('/(tabs)/support-tickets'),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to create support ticket.');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            Alert.alert('Error', 'Failed to create support ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Create Support Ticket</Text>
                        <Text style={styles.headerSubtitle}>We're here to help you</Text>
                    </View>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            {/* Form */}
            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Title Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                            <Text style={styles.required}>*</Text> Ticket Title
                        </Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Brief description of your issue"
                                placeholderTextColor="#95a5a6"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={100}
                            />
                            <Text style={styles.characterCount}>{title.length}/100</Text>
                        </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                            <Text style={styles.required}>*</Text> Description
                        </Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                placeholder="Please provide detailed information about your issue..."
                                placeholderTextColor="#95a5a6"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={6}
                                maxLength={1000}
                            />
                            <Text style={styles.characterCount}>{description.length}/1000</Text>
                        </View>
                    </View>

                    {/* Issue Type Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Issue Type</Text>
                        <View style={styles.optionsContainer}>
                            {issueTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.optionButton,
                                        issueType === type.value && styles.optionButtonActive,
                                        { borderColor: type.color }
                                    ]}
                                    onPress={() => setIssueType(type.value)}
                                >
                                    <View style={[
                                        styles.optionIcon,
                                        issueType === type.value && { backgroundColor: type.color }
                                    ]}>
                                        <Ionicons 
                                            name={type.icon as any} 
                                            size={18} 
                                            color={issueType === type.value ? '#fff' : type.color} 
                                        />
                                    </View>
                                    <Text style={[
                                        styles.optionText,
                                        issueType === type.value && { color: type.color }
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Priority Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Priority Level</Text>
                        <View style={styles.priorityContainer}>
                            {priorities.map((priorityItem) => (
                                <TouchableOpacity
                                    key={priorityItem.value}
                                    style={[
                                        styles.priorityButton,
                                        priority === priorityItem.value && styles.priorityButtonActive,
                                        { borderColor: priorityItem.color }
                                    ]}
                                    onPress={() => setPriority(priorityItem.value)}
                                >
                                    <View style={[
                                        styles.priorityDot,
                                        { backgroundColor: priorityItem.color }
                                    ]} />
                                    <Text style={[
                                        styles.priorityText,
                                        priority === priorityItem.value && { color: priorityItem.color }
                                    ]}>
                                        {priorityItem.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Attachments */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Attachments (Optional)</Text>
                        <TouchableOpacity
                            style={styles.attachmentButton}
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="#667eea" />
                            ) : (
                                <>
                                    <View style={styles.attachmentIconContainer}>
                                        <Ionicons name="camera-outline" size={24} color="#667eea" />
                                    </View>
                                    <View style={styles.attachmentTextContainer}>
                                        <Text style={styles.attachmentButtonText}>Add Image</Text>
                                        <Text style={styles.attachmentButtonSubtext}>Upload screenshots or photos</Text>
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>

                        {attachments.length > 0 && (
                            <View style={styles.attachmentsList}>
                                <Text style={styles.attachmentsTitle}>Uploaded Files ({attachments.length})</Text>
                                <FlatList
                                    data={attachments}
                                    renderItem={renderAttachment}
                                    keyExtractor={(item, index) => index.toString()}
                                    showsVerticalScrollIndicator={false}
                                    scrollEnabled={false}
                                />
                            </View>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!title.trim() || !description.trim() || loading) && styles.submitButtonDisabled
                        ]}
                        onPress={createTicket}
                        disabled={!title.trim() || !description.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Create Support Ticket</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
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
        paddingBottom: 28,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
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
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerText: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    placeholder: {
        width: 44,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 28,
    },
    inputLabel: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    required: {
        color: '#e74c3c',
        fontSize: 18,
    },
    inputContainer: {
        position: 'relative',
    },
    textInput: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e9ecef',
        borderRadius: 18,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 16,
        color: '#2c3e50',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    textArea: {
        height: 140,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    characterCount: {
        fontSize: 12,
        color: '#95a5a6',
        textAlign: 'right',
        marginTop: 8,
        fontWeight: '500',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 2,
        minWidth: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    optionButtonActive: {
        backgroundColor: '#f8f9ff',
        borderWidth: 2,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
        flex: 1,
    },
    priorityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    priorityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 2,
        minWidth: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    priorityButtonActive: {
        backgroundColor: '#f8f9ff',
    },
    priorityDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 12,
    },
    priorityText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
        flex: 1,
    },
    attachmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 28,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#667eea',
        borderStyle: 'dashed',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    attachmentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    attachmentTextContainer: {
        flex: 1,
    },
    attachmentButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#667eea',
        marginBottom: 4,
    },
    attachmentButtonSubtext: {
        fontSize: 14,
        color: '#95a5a6',
    },
    attachmentsList: {
        marginTop: 20,
    },
    attachmentsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 12,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
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
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 2,
    },
    attachmentSize: {
        fontSize: 13,
        color: '#95a5a6',
        fontWeight: '500',
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#667eea',
        paddingVertical: 22,
        borderRadius: 18,
        marginTop: 36,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#bdc3c7',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
        letterSpacing: 0.5,
    },
});

export default NewTicketScreen; 
