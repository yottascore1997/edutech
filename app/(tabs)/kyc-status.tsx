import KYCDocumentForm from '@/components/KYCDocumentForm';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface KYCStatus {
    kycStatus: string;
    kycVerifiedAt: string | null;
    kycRejectedAt: string | null;
    kycRejectionReason: string | null;
    documents: KYCDocument[];
}

interface KYCDocument {
    id: string;
    userId: string;
    documentType: string;
    documentNumber: string;
    kycStatus: string;
    isVerified: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function KYCStatusScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [kycData, setKycData] = useState<KYCStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kycModalVisible, setKycModalVisible] = useState(false);

    const fetchKYCStatus = async () => {
        if (!user?.token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Try different endpoints for KYC status
            let response;
                         try {
                 // First try the KYC status endpoint
                 response = await apiFetchAuth('/user/kyc/status', user.token);

             } catch (err) {

                 // If that fails, try the upload endpoint (which might return status)
                 response = await apiFetchAuth('/user/kyc/upload', user.token);
             }
            
            if (response.ok) {



                
                // Handle different possible response structures
                let kycDataToSet;
                
                if (response.data.documents && Array.isArray(response.data.documents)) {
                    // If response has a documents array, add kycStatus to each document
                    const documentsWithStatus = response.data.documents.map((doc: any) => ({
                        ...doc,
                        kycStatus: response.data.kycStatus || 'PENDING'
                    }));
                    kycDataToSet = {
                        ...response.data,
                        documents: documentsWithStatus
                    };

                } else if (Array.isArray(response.data)) {
                    // If response.data is directly an array of documents
                    kycDataToSet = { 
                        documents: response.data,
                        kycStatus: 'PENDING' // Default status
                    };

                } else if (response.data.data && Array.isArray(response.data.data)) {
                    // If response has data.documents structure
                    kycDataToSet = { documents: response.data.data };

                } else if (response.data.data && response.data.data.documents) {
                    // If response has data.data.documents structure
                    kycDataToSet = { documents: response.data.data.documents };

                } else {
                    // If it's a single document object
                    kycDataToSet = { documents: [response.data] };

                }
                


                if (kycDataToSet.documents && kycDataToSet.documents.length > 0) {


                }
                
                setKycData(kycDataToSet);
                setError(null);
            } else {
                setError(response.data.message || 'Failed to fetch KYC status.');
            }
        } catch (err: any) {
            console.error('Error fetching KYC status:', err);
            if (err.status === 401) {
                setError('Session expired. Please log in again.');
                logout();
            } else {
                setError(err.data?.message || 'Failed to fetch KYC status.');
            }
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchKYCStatus();
        } catch (error) {
            console.error('Error refreshing KYC status:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchKYCStatus();
    }, []);

    const getStatusColor = (status: string) => {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'VERIFIED':
                return '#10B981';
            case 'PENDING':
                return '#F59E0B';
            case 'REJECTED':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getStatusBackground = (status: string) => {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'VERIFIED':
                return 'rgba(16, 185, 129, 0.1)';
            case 'PENDING':
                return 'rgba(245, 158, 11, 0.1)';
            case 'REJECTED':
                return 'rgba(239, 68, 68, 0.1)';
            default:
                return 'rgba(107, 114, 128, 0.1)';
        }
    };

    const getStatusIcon = (status: string) => {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'VERIFIED':
                return 'checkmark-circle';
            case 'PENDING':
                return 'time';
            case 'REJECTED':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDocumentType = (type: string) => {
        return type.replace(/_/g, ' ').toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };



    const renderDocumentItem = ({ item, index }: { item: KYCDocument; index: number }) => {




        
        const statusToUse = item.kycStatus || 'PENDING';

        
        return (
            <View style={styles.documentCard}>
                <View style={styles.documentContent}>
                    <View style={styles.documentLeft}>
                        <View style={[
                            styles.iconContainer,
                            { backgroundColor: getStatusBackground(item.kycStatus || 'PENDING') }
                        ]}>
                            <Ionicons 
                                name={getStatusIcon(item.kycStatus || 'PENDING') as any} 
                                size={24} 
                                color={getStatusColor(item.kycStatus || 'PENDING')} 
                            />
                        </View>
                        <View style={styles.documentInfo}>
                            <Text style={styles.documentType}>{formatDocumentType(item.documentType)}</Text>
                            <Text style={styles.documentNumber}>Number: {item.documentNumber}</Text>
                            <Text style={styles.documentDate}>Uploaded: {formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.documentRight}>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.kycStatus || 'PENDING') }
                        ]}>
                            <Text style={styles.statusText}>
                                {item.kycStatus || 'PENDING'}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {item.rejectionReason && item.kycStatus?.toUpperCase() === 'REJECTED' && (
                    <View style={styles.rejectionContainer}>
                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                        <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                {/* Background Pattern */}
                <View style={styles.headerPattern}>
                    <View style={styles.patternCircle1} />
                    <View style={styles.patternCircle2} />
                    <View style={styles.patternCircle3} />
                </View>
                
                <View style={styles.headerContent}>
                    <View style={styles.headerTitleContainer}>
                        <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                        <Text style={styles.headerTitle}>KYC Verification</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Complete your identity verification</Text>
                </View>
            </LinearGradient>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading KYC Status...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <StatusBar barStyle="light-content" />
                <View style={styles.errorContent}>
                    <Ionicons name="alert-circle" size={64} color="#EF4444" />
                    <Text style={styles.errorText}>Error: {error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchKYCStatus}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {renderHeader()}
            
            <View style={styles.content}>
                <View style={styles.uploadSection}>
                    <TouchableOpacity 
                        style={styles.uploadButton}
                        onPress={() => setKycModalVisible(true)}
                    >
                        <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
                        <Text style={styles.uploadButtonText}>Upload New Document</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={kycData?.documents || []}
                    renderItem={renderDocumentItem}
                    keyExtractor={(item) => item.id}
                    onLayout={() => {


                    }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4F46E5']}
                            tintColor="#4F46E5"
                            title="Pull to refresh"
                            titleColor="#4F46E5"
                            progressBackgroundColor="#f8fafc"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="document" size={64} color="#8B5CF6" />
                            </View>
                            <Text style={styles.emptyTitle}>No Documents Uploaded</Text>
                            <Text style={styles.emptySubtitle}>
                                Upload your identity documents to complete KYC verification
                            </Text>
                            <TouchableOpacity style={styles.emptyButton}>
                                <Text style={styles.emptyButtonText}>Upload Now</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </View>

            {/* KYC Document Upload Modal */}
            <KYCDocumentForm
                visible={kycModalVisible}
                onClose={() => setKycModalVisible(false)}
                onSuccess={() => {
                    fetchKYCStatus(); // Refresh KYC status after successful upload
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    errorContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        height: 80,
    },
    headerGradient: {
        flex: 1,
        paddingTop: 12,
        paddingHorizontal: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    headerPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.15,
    },
    patternCircle1: {
        position: 'absolute',
        top: 15,
        right: 25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    patternCircle2: {
        position: 'absolute',
        bottom: 30,
        left: 15,
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternCircle3: {
        position: 'absolute',
        top: 45,
        left: 40,
        width: 25,
        height: 25,
        borderRadius: 12.5,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    headerContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        letterSpacing: 0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        letterSpacing: 0.2,
    },
    content: {
        flex: 1,
    },
    uploadSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    uploadButton: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    documentCard: {
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
    documentContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    documentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    documentInfo: {
        flex: 1,
    },
    documentType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    documentNumber: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    documentDate: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '400',
    },
    documentRight: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statusText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rejectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    rejectionText: {
        fontSize: 14,
        color: '#EF4444',
        marginLeft: 12,
        flex: 1,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        fontWeight: '400',
    },
    emptyButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

});
