import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const PrivacyPolicyScreen = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Enhanced Header with Modern Design */}
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
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
                        <View style={styles.titleContainer}>
                            <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" style={styles.headerIcon} />
                            <Text style={styles.headerTitle}>Privacy Policy</Text>
                        </View>
                    </View>
                    <View style={styles.placeholder} />
                </View>
                
                {/* Header Background Pattern */}
                <View style={styles.headerPattern}>
                    <View style={styles.patternCircle1} />
                    <View style={styles.patternCircle2} />
                    <View style={styles.patternCircle3} />
                </View>
            </LinearGradient>

            {/* Enhanced Content */}
            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.contentContainer}>
                    {/* Introduction */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.paragraph}>
                            Yottascore ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our app and services.
                        </Text>
                    </View>

                    {/* Enhanced Section 1 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="information-circle" size={24} color="#4F46E5" />
                            </View>
                            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We may collect the following information from you:{'\n\n'}
                            • <Text style={styles.boldText}>Personal Information:</Text> Name, mobile number, and email address.{'\n\n'}
                            • <Text style={styles.boldText}>Payment Information:</Text> Processed securely through Razorpay. We do not store your full payment details.{'\n\n'}
                            • <Text style={styles.boldText}>Device Information:</Text> Non-personal information like device model, operating system, and app version for improving user experience.
                        </Text>
                    </View>

                    {/* Enhanced Section 2 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="settings" size={24} color="#7C3AED" />
                            </View>
                            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We use your information to:{'\n\n'}
                            • Register and manage your account.{'\n\n'}
                            • Allow you to participate in live and practice exams, quizzes, and battles.{'\n\n'}
                            • Process entry fees and reward distributions.{'\n\n'}
                            • Send important notifications about exams, results, and app updates.{'\n\n'}
                            • Improve the app experience and resolve user queries.
                        </Text>
                    </View>

                    {/* Enhanced Section 3 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="share-social" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.sectionTitle}>3. Sharing of Information</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We do not sell or rent your personal data.{'\n'}
                            Information may be shared only with:{'\n\n'}
                            • Payment processors (Razorpay) for handling transactions.{'\n\n'}
                            • Legal authorities if required by law.
                        </Text>
                    </View>

                    {/* Enhanced Section 4 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="lock-closed" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.sectionTitle}>4. Data Security</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We use secure encryption and trusted third-party services like Razorpay to protect your data. However, no online platform is 100% secure, and users are advised to use the app responsibly.
                        </Text>
                    </View>

                    {/* Enhanced Section 5 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="analytics" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.sectionTitle}>5. Your Rights</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            You can:{'\n\n'}
                            • Request correction or deletion of your data.{'\n\n'}
                            • Opt out of receiving promotional notifications.{'\n\n'}
                            For any privacy-related concerns, contact us at:{'\n'}
                            📩 yottascore@gmail.com
                        </Text>
                    </View>

                    {/* Enhanced Section 6 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="happy" size={24} color="#EC4899" />
                            </View>
                            <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            Yottascore is designed for school and college students above 13 years of age. Students under 18 should use the app with parental guidance.
                        </Text>
                    </View>

                    {/* Enhanced Section 7 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="refresh" size={24} color="#06B6D4" />
                            </View>
                            <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We may update this Privacy Policy periodically. Updates will be posted within the app or on our website.
                        </Text>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 15,
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
        top: 20,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternCircle2: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    patternCircle3: {
        position: 'absolute',
        top: 60,
        left: 50,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerText: {
        flex: 1,
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerIcon: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    placeholder: {
        width: 48,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        lineHeight: 28,
        letterSpacing: 0.3,
    },
    paragraph: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
        marginBottom: 0,
        textAlign: 'left',
        fontWeight: '400',
        letterSpacing: 0.2,
    },
    boldText: {
        fontWeight: '700',
        color: '#1F2937',
    },
    contactCard: {
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactInfo: {
        fontSize: 16,
        color: '#4F46E5',
        lineHeight: 24,
        marginLeft: 12,
        fontWeight: '600',
        flex: 1,
    },
    footer: {
        marginTop: 20,
        marginBottom: 20,
    },
    footerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.2)',
    },
    footerText: {
        fontSize: 16,
        color: '#4F46E5',
        textAlign: 'center',
        fontWeight: '600',
        marginLeft: 12,
        letterSpacing: 0.3,
    },
});

export default PrivacyPolicyScreen; 
