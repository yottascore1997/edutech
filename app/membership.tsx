import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface MembershipTier {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  isPremium?: boolean;
  gradient: string[];
  icon: string;
  badge?: string;
}

const membershipTiers: MembershipTier[] = [
  {
    id: 'premium',
    name: 'Premium',
    price: '₹799',
    originalPrice: '₹1499',
    period: 'per month',
    features: [
      'Unlimited practice questions',
      'Unlimited exam attempts',
      'Advanced progress analytics',
      'Priority support',
      'Premium study materials',
      'Mock test series',
      'Performance insights',
      '1-on-1 expert tutoring',
      'Custom study plans',
      'Advanced AI recommendations',
      '24/7 priority support',
      'Exclusive study groups',
      'Career counseling',
      'Interview preparation',
      'Certificate programs'
    ],
    isPremium: true,
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'diamond-outline',
    badge: 'Premium Plan'
  }
];

export default function MembershipScreen() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string>('premium');

  const handleSubscribe = (tierId: string) => {
    // Handle subscription logic here

    // You can add payment gateway integration here
  };

  const renderFeature = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
      </View>
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  const renderMembershipCard = (tier: MembershipTier) => (
    <TouchableOpacity
      key={tier.id}
      style={[
        styles.membershipCard,
        selectedTier === tier.id && styles.selectedCard
      ]}
      onPress={() => setSelectedTier(tier.id)}
    >
      {tier.badge && (
        <View style={styles.badgeContainer}>
          <LinearGradient
            colors={tier.isPremium ? ['#FFD700', '#FFA500'] : ['#FF6B6B', '#FF5252']}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>{tier.badge}</Text>
          </LinearGradient>
        </View>
      )}

      <LinearGradient
        colors={tier.gradient}
        style={styles.cardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name={tier.icon as any} size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.cardName}>{tier.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{tier.price}</Text>
          {tier.originalPrice && (
            <Text style={styles.originalPrice}>{tier.originalPrice}</Text>
          )}
        </View>
        <Text style={styles.period}>{tier.period}</Text>
      </LinearGradient>

      <View style={styles.cardContent}>
        <View style={styles.featuresList}>
          {tier.features.map((feature, index) => renderFeature(feature, index))}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            selectedTier === tier.id && styles.selectedSubscribeButton
          ]}
          onPress={() => handleSubscribe(tier.id)}
        >
          <LinearGradient
            colors={
              selectedTier === tier.id
                ? ['#10B981', '#059669']
                : ['#6B7280', '#4B5563']
            }
            style={styles.subscribeButtonGradient}
          >
            <Text style={styles.subscribeButtonText}>
              {tier.price === 'Free' ? 'Get Started' : 'Subscribe Now'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      

      {/* Enhanced Content */}
      <ScrollView style={styles.enhancedContent} showsVerticalScrollIndicator={false}>

        {/* Membership Tiers */}
        <View style={styles.tiersSection}>
          <Text style={styles.premiumTitle}>Choose Your Plan</Text>
          <View style={styles.tiersContainer}>
            {membershipTiers.map(renderMembershipCard)}
          </View>
        </View>

        {/* Enhanced FAQ Section */}
        <View style={styles.enhancedFaqSection}>
          <Text style={styles.enhancedSectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.enhancedFaqItem}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.faqCard}
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqIconContainer}>
                  <Ionicons name="help-circle" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.enhancedFaqQuestion}>
                  Can I cancel my subscription anytime?
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </View>
              <Text style={styles.enhancedFaqAnswer}>
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.enhancedFaqItem}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.faqCard}
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqIconContainer}>
                  <Ionicons name="help-circle" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.enhancedFaqQuestion}>
                  Do you offer refunds?
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </View>
              <Text style={styles.enhancedFaqAnswer}>
                We offer a 7-day money-back guarantee for all new subscriptions. If you're not satisfied, contact our support team.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.enhancedFaqItem}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.faqCard}
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqIconContainer}>
                  <Ionicons name="help-circle" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.enhancedFaqQuestion}>
                  What payment methods do you accept?
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </View>
              <Text style={styles.enhancedFaqAnswer}>
                We accept all major credit cards, debit cards, UPI, and digital wallets including Paytm, PhonePe, and Google Pay.
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Enhanced Contact Support */}
        <View style={styles.enhancedSupportSection}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
            style={styles.enhancedSupportCard}
          >
            <View style={styles.supportIconContainer}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.supportIconGradient}
              >
                <Ionicons name="headset" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.enhancedSupportTitle}>Need Help?</Text>
            <Text style={styles.enhancedSupportDescription}>
              Our support team is available 24/7 to help you with any questions about your membership
            </Text>
            <TouchableOpacity style={styles.enhancedContactButton}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.contactButtonGradient}
              >
                <Ionicons name="chatbubble" size={20} color="#4F46E5" />
                <Text style={styles.enhancedContactButtonText}>Contact Support</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  enhancedHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  enhancedBackButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enhancedHeaderContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerIconContainer: {
    marginBottom: 16,
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  enhancedHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  patternCircle1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 60,
    left: 50,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  enhancedContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  benefitsSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  benefitsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  tiersSection: {
    marginBottom: 40,
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  tiersContainer: {
    gap: 20,
  },
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#8B5CF6',
    transform: [{ scale: 1.02 }],
  },
  badgeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHeader: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
  },
  period: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardContent: {
    padding: 30,
  },
  featuresList: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedSubscribeButton: {
    transform: [{ scale: 1.05 }],
  },
  subscribeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  faqSection: {
    marginBottom: 40,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  supportSection: {
    marginBottom: 40,
  },
  supportCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  supportIcon: {
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedFaqSection: {
    marginBottom: 40,
  },
  enhancedSectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  enhancedFaqItem: {
    marginBottom: 16,
  },
  faqCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  faqIconContainer: {
    marginRight: 12,
  },
  enhancedFaqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  enhancedFaqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
  },
  enhancedSupportSection: {
    marginBottom: 40,
  },
  enhancedSupportCard: {
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  supportIconContainer: {
    marginBottom: 20,
  },
  supportIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedSupportTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  enhancedSupportDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  enhancedContactButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  enhancedContactButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '700',
  },
});
