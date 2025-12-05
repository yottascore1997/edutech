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

const TermsScreen = () => {
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
                            <Ionicons name="document-text" size={28} color="#FFFFFF" style={styles.headerIcon} />
                            <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
                            By accessing or using the Yottascore app, you agree to the following terms and conditions. Please read them carefully.
                        </Text>
                    </View>

                    {/* Section 1 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="phone-portrait" size={24} color="#4F46E5" />
                            </View>
                            <Text style={styles.sectionTitle}>1. Use of the App</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            • Yottascore allows users to take live exams, practice tests, and quizzes (including paid battle quizzes).{'\n\n'}
                            • Users must provide accurate personal details (name, number, email).{'\n\n'}
                            • By using the app, you confirm that you are a school/college student or above 13 years old.
                        </Text>
                    </View>

                    {/* Section 2 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="cash" size={24} color="#7C3AED" />
                            </View>
                            <Text style={styles.sectionTitle}>2. Entry Fees and Rewards</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            • Some quizzes or exams may require an entry fee, processed securely through Razorpay.{'\n\n'}
                            • Winners will receive cash rewards or scholarships directly credited to their registered account or wallet.{'\n\n'}
                            • <Text style={styles.boldText}>Entry fees are non-refundable</Text> once the exam/quiz has started.
                        </Text>
                    </View>

                    {/* Section 3 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="shield-checkmark" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.sectionTitle}>3. Fair Play Policy</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            • Users must not use multiple accounts, unfair means, or third-party tools.{'\n\n'}
                            • Any cheating or misuse will result in account suspension and loss of winnings.
                        </Text>
                    </View>

                    {/* Section 4 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="bulb" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            All app content (questions, design, and code) belongs to Yottascore and may not be copied or reused without permission.
                        </Text>
                    </View>

                    {/* Section 5 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="warning" size={24} color="#F59E0B" />
                            </View>
                            <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            Yottascore is not responsible for:{'\n\n'}
                            • Network issues or technical delays.{'\n\n'}
                            • Incorrect information submitted by users.{'\n\n'}
                            • Any indirect or accidental loss.
                        </Text>
                    </View>

                    {/* Section 6 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="ban" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.sectionTitle}>6. Account Termination</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            Yottascore reserves the right to suspend or delete any account found violating rules or using fraudulent activity.
                        </Text>
                    </View>

                    {/* Section 7 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="refresh" size={24} color="#06B6D4" />
                            </View>
                            <Text style={styles.sectionTitle}>7. Updates to Terms</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            We may update these Terms from time to time. Continued use of the app after such changes means you accept the new terms.
                        </Text>
                    </View>

                    {/* Section 8 */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="mail" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.sectionTitle}>8. Contact</Text>
                        </View>
                        <Text style={styles.paragraph}>
                            For any issues, contact us at:{'\n'}
                            📩 yottascore@gmail.com
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
    },
    headerIcon: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
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
});

export default TermsScreen;

