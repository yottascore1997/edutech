import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import client from '../../api/client';
import KYCDocumentForm from '@/components/KYCDocumentForm';
import RazorpayPaymentModal from '@/components/RazorpayPaymentModal';
import { apiFetchAuth } from '@/constants/api';

const WalletScreen = () => {
    const { user, logout } = useAuth();
    const { refreshWalletAmount } = useWallet();
    const router = useRouter();
    const [walletData, setWalletData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [depositModalVisible, setDepositModalVisible] = React.useState(false);
    const [depositAmount, setDepositAmount] = React.useState('');
    const [depositLoading, setDepositLoading] = React.useState(false);
    const [kycModalVisible, setKycModalVisible] = React.useState(false);
    const [razorpayModalVisible, setRazorpayModalVisible] = React.useState(false);

    const fetchWalletData = React.useCallback(async () => {
        if (!user?.token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await apiFetchAuth('/student/wallet', user.token);
            if (response.ok) {
                setWalletData(response.data);
                setError(null);
            } else {
                 setError(response.data.message || 'Failed to fetch wallet data.');
            }
        } catch (err: any) {
            console.error('Error fetching wallet:', err);
            if (err.status === 401) {
                setError('Session expired. Please log in again.');
                logout();
            } else {
                setError(err.data?.message || 'Failed to fetch wallet data.');
            }
        } finally {
            setLoading(false);
        }
    }, [user, logout]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchWalletData();
        } catch (error) {
            console.error('Error refreshing wallet:', error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchWalletData]);

    React.useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const handleDeposit = async () => {
        if (!depositAmount || parseFloat(depositAmount) <= 0 || !user?.token) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
            return;
        }

        setDepositLoading(true);
        try {
            const response = await apiFetchAuth('/student/wallet/deposit', user.token, {
                method: 'POST',
                body: { amount: parseFloat(depositAmount) }
            });
            
            if (response.ok) {
                Alert.alert('Success', `Successfully deposited ₹${depositAmount}`, [
                    {
                        text: 'OK',
                        onPress: () => {
                            setDepositModalVisible(false);
                            setDepositAmount('');
                            fetchWalletData(); // Refresh wallet data
                            refreshWalletAmount(); // Update global wallet amount
                        }
                    }
                ]);
            } else {
                 Alert.alert('Error', response.data.message || 'Failed to deposit amount.');
            }
        } catch (err: any) {
            console.error('Error depositing:', err);
            if (err.status === 401) {
                Alert.alert('Session Expired', 'Please log in again.');
                logout();
            } else {
                Alert.alert('Error', err.data?.message || 'Failed to deposit amount.');
            }
        } finally {
            setDepositLoading(false);
        }
    };

    const handleRazorpayPayment = () => {
        setDepositModalVisible(false);
        setRazorpayModalVisible(true);
    };

    const handleRazorpaySuccess = (paymentData: any) => {
        fetchWalletData(); // Refresh wallet data
        refreshWalletAmount(); // Update global wallet amount
        setRazorpayModalVisible(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading Wallet...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={64} color="#EF4444" />
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchWalletData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
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
                contentContainerStyle={styles.scrollContent}
            >
                {/* Enhanced Balance Card */}
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    {/* Background Pattern */}
                    <View style={styles.balancePattern}>
                        <View style={styles.patternCircle1} />
                        <View style={styles.patternCircle2} />
                        <View style={styles.patternCircle3} />
                    </View>
                    
                    <View style={styles.balanceContent}>
                        <View style={styles.balanceHeader}>
                            <Ionicons name="wallet" size={28} color="#FFFFFF" />
                            <Text style={styles.balanceTitle}>Available Balance</Text>
                        </View>
                        
                        <View style={styles.balanceRow}>
                            <Text style={styles.balanceAmount}>₹{walletData?.balance?.toFixed(2) || '0.00'}</Text>
                            <Image 
                                source={require('@/assets/images/icons/wallet.png')} 
                                style={styles.walletImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </LinearGradient>

                {/* Enhanced Money Details Card */}
                <View style={styles.moneyDetailsCard}>
                    <Text style={styles.cardTitle}>Money Details</Text>
                    <MoneyDetailRow 
                        icon="server" 
                        title="Deposit" 
                        amount={walletData?.balance?.toFixed(2) || '0.00'} 
                        action="Add Cash" 
                        onAction={() => setDepositModalVisible(true)} 
                        iconColor="#4F46E5"
                    />
                    <View style={styles.divider} />
                    <MoneyDetailRow 
                        icon="trophy" 
                        title="Winnings" 
                        amount="0.00" 
                        action="Withdraw" 
                        onAction={() => {}} 
                        isWithdraw 
                        iconColor="#10B981"
                    />
                </View>

                {/* Enhanced Options List */}
                <View style={styles.optionsCard}>
                    <Text style={styles.cardTitle}>Quick Actions</Text>
                    <OptionRow 
                        icon="list" 
                        title="My Transactions" 
                        subtitle="View all your transactions"
                        onPress={() => router.push('/(tabs)/transactions')}
                        iconColor="#4F46E5"
                    />
                    <View style={styles.divider} />
                    <OptionRow 
                        icon="card" 
                        title="Upload KYC Document" 
                        subtitle="Complete your verification"
                        onPress={() => setKycModalVisible(true)}
                        iconColor="#7C3AED"
                    />
                    <View style={styles.divider} />
                    <OptionRow 
                        icon="shield-checkmark" 
                        title="KYC Status" 
                        subtitle="Check verification status"
                        onPress={() => router.push('/(tabs)/kyc-status')}
                        iconColor="#10B981"
                    />

                </View>
                
                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Enhanced Deposit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={depositModalVisible}
                onRequestClose={() => setDepositModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={['#4F46E5', '#7C3AED']}
                            style={styles.modalHeader}
                        >
                            <Text style={styles.modalTitle}>Add Cash to Wallet</Text>
                            <TouchableOpacity 
                                onPress={() => setDepositModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </LinearGradient>
                        
                        <View style={styles.modalBody}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
                                <View style={styles.amountInputWrapper}>
                                    <Text style={styles.currencySymbol}>₹</Text>
                                    <TextInput
                                        style={styles.amountInput}
                                        value={depositAmount}
                                        onChangeText={setDepositAmount}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.depositButton, depositLoading && styles.depositButtonDisabled]}
                                onPress={handleDeposit}
                                disabled={depositLoading}
                            >
                                {depositLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                        <Text style={styles.depositButtonText}>Deposit Now</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.razorpayButton}
                                onPress={handleRazorpayPayment}
                            >
                                <Ionicons name="card" size={20} color="#FFFFFF" />
                                <Text style={styles.razorpayButtonText}>Pay with Razorpay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* KYC Document Upload Modal */}
            <KYCDocumentForm
                visible={kycModalVisible}
                onClose={() => setKycModalVisible(false)}
                onSuccess={() => {
                    // Optionally refresh wallet data or show success message
                }}
            />

            {/* Razorpay Payment Modal */}
            <RazorpayPaymentModal
                visible={razorpayModalVisible}
                onClose={() => setRazorpayModalVisible(false)}
                onSuccess={handleRazorpaySuccess}
                userToken={user?.token || ''}
                userDetails={{
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phoneNumber || user?.phone || ''
                }}
            />
        </View>
    );
};

const MoneyDetailRow = ({ icon, title, amount, action, onAction, isWithdraw = false, iconColor }: any) => (
    <View style={styles.moneyRow}>
        <View style={[styles.moneyIconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.moneyTextContainer}>
            <Text style={styles.moneyTitle}>{title}</Text>
            <Text style={styles.moneyAmount}>₹{amount}</Text>
        </View>
        {action && (
            <TouchableOpacity 
                onPress={onAction} 
                style={[
                    styles.actionButton, 
                    isWithdraw ? styles.withdrawButton : styles.addButton,
                    { backgroundColor: isWithdraw ? '#10B981' : iconColor }
                ]}
            >
                <Text style={styles.actionButtonText}>{action}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const OptionRow = ({ icon, title, subtitle, onPress, iconColor }: any) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress}>
        <View style={[styles.optionIconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{title}</Text>
            <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    walletImage: {
        width: 95,
        height: 95,
        opacity: 0.9,
        marginLeft: 10,
        marginTop: -25,
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 20,
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
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    balanceCard: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    balancePattern: {
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
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    patternCircle2: {
        position: 'absolute',
        bottom: 25,
        left: 15,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternCircle3: {
        position: 'absolute',
        top: 40,
        left: 35,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    balanceContent: {
        position: 'relative',
        zIndex: 1,
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    balanceTitle: {
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 10,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 18,
    },
    balanceAmount: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.4,
        fontFamily: 'System',
        lineHeight: 38,
    },
    moneyDetailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
    optionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.08)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 22,
    },
    moneyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    moneyIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    moneyTextContainer: {
        flex: 1,
    },
    moneyTitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 3,
        letterSpacing: 0.2,
        fontFamily: 'System',
        lineHeight: 19,
    },
    moneyAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 24,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },
    addButton: {
        backgroundColor: '#4F46E5',
    },
    withdrawButton: {
        backgroundColor: '#10B981',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 6,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    optionIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 3,
        letterSpacing: 0.2,
        textShadowColor: 'rgba(0, 0, 0, 0.06)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 19,
    },
    optionSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
        letterSpacing: 0.2,
        fontFamily: 'System',
        lineHeight: 18,
    },
    bottomSpacing: {
        height: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '85%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    modalBody: {
        padding: 24,
        paddingTop: 20,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#F9FAFB',
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '600',
        color: '#6B7280',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        color: '#1F2937',
        fontWeight: '500',
    },
    depositButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    depositButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    depositButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    razorpayButton: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    razorpayButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },
});

export default WalletScreen; 
