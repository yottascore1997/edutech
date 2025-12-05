import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
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
                        <Text style={styles.headerTitle}>Privacy Policy</Text>
                        <Text style={styles.headerSubtitle}>Last updated: January 2025</Text>
                    </View>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.contentContainer}>
                    <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                    <Text style={styles.paragraph}>
                        We collect information you provide directly to us, such as when you create an account, 
                        take exams, or contact our support team. This may include your name, email address, 
                        phone number, and educational information.
                    </Text>

                    <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                    <Text style={styles.paragraph}>
                        We use the information we collect to provide, maintain, and improve our services, 
                        process your exam results, communicate with you about your account, and send you 
                        important updates about our platform.
                    </Text>

                    <Text style={styles.sectionTitle}>3. Information Sharing</Text>
                    <Text style={styles.paragraph}>
                        We do not sell, trade, or otherwise transfer your personal information to third parties 
                        without your consent, except as described in this policy or as required by law.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Data Security</Text>
                    <Text style={styles.paragraph}>
                        We implement appropriate security measures to protect your personal information against 
                        unauthorized access, alteration, disclosure, or destruction. However, no method of 
                        transmission over the internet is 100% secure.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Cookies and Tracking</Text>
                    <Text style={styles.paragraph}>
                        We use cookies and similar tracking technologies to enhance your experience on our 
                        platform, analyze usage patterns, and personalize content and advertisements.
                    </Text>

                    <Text style={styles.sectionTitle}>6. Third-Party Services</Text>
                    <Text style={styles.paragraph}>
                        Our platform may contain links to third-party websites or services. We are not 
                        responsible for the privacy practices of these third parties. We encourage you to 
                        review their privacy policies.
                    </Text>

                    <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
                    <Text style={styles.paragraph}>
                        Our services are not intended for children under 13 years of age. We do not 
                        knowingly collect personal information from children under 13. If you are a parent 
                        or guardian and believe your child has provided us with personal information, 
                        please contact us.
                    </Text>

                    <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
                    <Text style={styles.paragraph}>
                        We may update this privacy policy from time to time. We will notify you of any 
                        changes by posting the new policy on this page and updating the "Last updated" date.
                    </Text>

                    <Text style={styles.sectionTitle}>9. Your Rights</Text>
                    <Text style={styles.paragraph}>
                        You have the right to access, correct, or delete your personal information. 
                        You may also have the right to restrict or object to certain processing of your data. 
                        Contact us to exercise these rights.
                    </Text>

                    <Text style={styles.sectionTitle}>10. Contact Us</Text>
                    <Text style={styles.paragraph}>
                        If you have any questions about this privacy policy or our data practices, 
                        please contact us at:
                    </Text>
                    <Text style={styles.contactInfo}>
                        Email: privacy@examapp.com{'\n'}
                        Phone: +1 (555) 123-4567{'\n'}
                        Address: 123 Exam Street, Education City, EC 12345
                    </Text>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            This privacy policy is effective as of January 1, 2025.
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    placeholder: {
        width: 44,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    contentContainer: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 18,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 24,
        marginBottom: 12,
        lineHeight: 24,
    },
    paragraph: {
        fontSize: 15,
        color: '#6c757d',
        lineHeight: 22,
        marginBottom: 16,
        textAlign: 'justify',
    },
    contactInfo: {
        fontSize: 15,
        color: '#667eea',
        lineHeight: 22,
        marginBottom: 16,
        fontWeight: '500',
    },
    footer: {
        marginTop: 32,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    footerText: {
        fontSize: 14,
        color: '#95a5a6',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default PrivacyPolicyScreen; 
