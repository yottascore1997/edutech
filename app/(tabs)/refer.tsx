import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Clipboard, Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

interface ReferralUser {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  joinedAt: string;
}

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  totalEarnings: number;
  referredBy: string | null;
  referrerInfo: any;
  referrals: ReferralUser[];
}

const { width: screenWidth } = Dimensions.get('window');

export default function ReferScreen() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const { user } = useAuth();

  // Animation refs for sparkle effect
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const fetchTicketDetails = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/referral/stats', user.token);
      
      if (response.ok) {
        setData(response.data);
        
        // If no referral code exists, generate one
        if (!response.data.referralCode) {
          await generateReferralCode();
        }
      } else {
        Alert.alert('Error', 'Failed to load referral data.');
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      Alert.alert('Error', 'Failed to load referral data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateReferralCode = async () => {
    if (!user?.token) return;

    // If user already has a referral code, ask for confirmation
    if (data?.referralCode) {
      Alert.alert(
        'Regenerate Referral Code?',
        'This will replace your current referral code. Are you sure you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Regenerate', style: 'destructive', onPress: () => performGenerateCode() }
        ]
      );
      return;
    }

    await performGenerateCode();
  };

  const performGenerateCode = async () => {
    if (!user?.token) return;

    try {
      setGeneratingCode(true);

      const response = await apiFetchAuth('/student/referral/generate-code', user.token, {
        method: 'POST'
      });
      
      if (response.ok) {

        // Refresh the data to get the new referral code
        await fetchTicketDetails();
      } else {
        console.error('Failed to generate referral code');
        Alert.alert('Error', 'Failed to generate referral code. Please try again.');
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTicketDetails();
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.token) return;
      fetchTicketDetails();
    }, [user])
  );

  // Start animations
  useEffect(() => {
    // Sparkle animation
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Float animation
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    sparkleAnimation.start();
    floatAnimation.start();
  }, []);

  const handleCopy = () => {
    if (data?.referralCode) {
      Clipboard.setString(data.referralCode);
      setCopied(true);
      Alert.alert('Copied!', 'Referral code copied to clipboard.');
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleShare = (platform: string) => {
    Alert.alert('Share', `Share via ${platform}`);
  };

  const renderAvatar = (user: ReferralUser, index: number) => {
    if (user.profilePhoto) {
      return (
        <View style={styles.avatarImgWrap}>
          <Image source={{ uri: user.profilePhoto }} style={styles.avatarImg} />
        </View>
      );
    }
    // Fallback: initials
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.avatarCircle}
      >
        <Text style={styles.avatarText}>{initials || index + 1}</Text>
      </LinearGradient>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading your referral stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#667eea']}
          tintColor="#667eea"
        />
      }
    >
      {/* Enhanced Invite & Earn Rewards Section */}
      <View style={styles.inviteCard}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inviteGradient}
        >
          <View style={styles.inviteContent}>
            <Animated.View 
              style={[
                styles.inviteTextSection,
                {
                  transform: [{ 
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -3],
                    }) 
                  }]
                }
              ]}
            >
              <Text style={styles.inviteTitle}>Invite & Earn</Text>
              <Text style={styles.inviteSubtitle}>Rewards</Text>
              <Text style={styles.inviteDescription}>Share with friends and get ₹100 for each successful referral</Text>
            </Animated.View>
            <View style={styles.inviteIllustration}>
              <Image 
                source={require('../../assets/images/icons/refer.png')} 
                style={styles.referImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Your Rewards Section */}
      <LinearGradient
        colors={['#F3E8FF', '#E9D5FF', '#D8B4FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rewardsCard}
      >
        <View style={styles.rewardsHeader}>
          <View style={styles.rewardsIconContainer}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </View>
          <Text style={styles.sectionTitle}>Your Rewards</Text>
        </View>
        
        <View style={styles.rewardsSummary}>
          <View style={styles.rewardItem}>
            <View style={styles.rewardIconWrapper}>
              <Ionicons name="cash" size={20} color="#10B981" />
            </View>
            <Text style={styles.rewardLabel}>Total Earned</Text>
            <Text style={styles.rewardValue}>₹{data?.totalEarnings || 0}</Text>
          </View>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardItem}>
            <View style={styles.rewardIconWrapper}>
              <Ionicons name="wallet" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.rewardLabel}>Available Balance</Text>
            <Text style={styles.rewardValue}>₹{data?.availableBalance || 0}</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Ionicons name="trending-up" size={16} color="#8B5CF6" />
            <Text style={styles.progressLabel}>Referral Progress</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((data?.referralCount || 0) / (data?.totalAttempts || 1) * 100, 100)}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.progressText}>
              {data?.referralCount || 0} successful referrals out of {data?.totalAttempts || 0} attempts
            </Text>
            <View style={styles.progressIcon}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
          </View>
        </View>
        
        {/* Background Decorative Elements */}
        <View style={styles.rewardsBgDecoration1} />
        <View style={styles.rewardsBgDecoration2} />
        <View style={styles.rewardsBgDecoration3} />
      </LinearGradient>

      {/* Your Referral Code Section */}
      <View style={styles.referralCodeCard}>
        <View style={styles.referralCodeHeader}>
          <View style={styles.referralCodeIconContainer}>
            <Ionicons name="key" size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
        </View>
        
        <View style={styles.codeDisplayContainer}>
          <View style={styles.codeBox}>
            <Ionicons name="gift" size={20} color="#8B5CF6" style={styles.codeIcon} />
            <Text style={styles.codeText}>
              {data?.referralCode || (generatingCode ? 'Generating...' : 'FRIEND100')}
            </Text>
          </View>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color="#8B5CF6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleShare('Share')}>
              <Ionicons name="share-social-outline" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>
        
        {!data?.referralCode && (
          <TouchableOpacity 
            style={[styles.generateButton, generatingCode && styles.generateButtonDisabled]} 
            onPress={generateReferralCode}
            disabled={generatingCode}
          >
            {generatingCode ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Ionicons name="refresh-outline" size={20} color="#4CAF50" />
            )}
            <Text style={styles.generateButtonText}>
              {generatingCode ? "Generating..." : "Generate Code"}
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.referralCodeInfo}>
          <Ionicons name="information-circle-outline" size={16} color="#8B5CF6" />
          <Text style={styles.referralCodeInfoText}>
            Share this code with friends to earn ₹100 for each successful referral
          </Text>
        </View>
      </View>

      {/* People You Referred Section */}
      <View style={styles.referralsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People You Referred</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {data?.referrals && data.referrals.length > 0 ? (
          <View style={styles.referralsList}>
            {data.referrals.slice(0, 3).map((item, index) => (
              <View style={styles.referralItem} key={item.id}>
                {renderAvatar(item, index)}
                <View style={styles.referralInfo}>
                  <View style={styles.nameDateRow}>
                    <Text style={styles.referralName} numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </Text>
                    <Text style={styles.referralDate}>
                      {item.joinedAt ? `Joined ${timeAgo(item.joinedAt)}` : 'Recently joined'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, index === 2 ? styles.pendingBadge : styles.successBadge]}>
                  <Text style={[styles.statusText, index === 2 ? styles.pendingText : styles.successText]}>
                    {index === 2 ? 'Pending' : 'Successful'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyReferrals}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyReferralsText}>No referrals yet</Text>
            <Text style={styles.emptyReferralsSubtext}>Start sharing your code to see referrals here</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.inviteButton} onPress={() => handleShare('Invite')}>
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.inviteButtonText}>Invite Friends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.whatsappButton} onPress={() => handleShare('WhatsApp')}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.whatsappButtonText}>WhatsApp</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.copyIconButton} onPress={handleCopy}>
          <Ionicons name="copy-outline" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* How It Works Section */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Code</Text>
              <Text style={styles.stepDescription}>Share your referral code with friends</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Signs Up</Text>
              <Text style={styles.stepDescription}>Friend creates an account using your code</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn Rewards</Text>
              <Text style={styles.stepDescription}>Both of you get ₹100 reward</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const faqList = [
  {
    q: 'What is the Refer and Earn Program?',
    a: 'Our Refer and Earn program rewards you with ₹100 for every friend who signs up using your referral code. It\'s our way of thanking you for spreading the word about Yottascore!',
  },
  {
    q: 'How does the referral process work?',
    a: 'Simply share your unique referral code with friends. When they register and use your code, both you and your friend will instantly receive ₹100 in your accounts.',
  },
  {
    q: 'Where can I use my earnings?',
    a: 'Your referral earnings can be used to purchase exam packages, practice tests, or any other services available in the app. The money is added directly to your wallet.',
  },
  {
    q: 'Is there a limit to referrals?',
    a: 'No! You can refer as many friends as you want. Each successful referral earns you ₹100, so the more friends you invite, the more you earn.',
  },
];

function timeAgo(dateString: string) {
  const now = new Date();
  const joined = new Date(dateString);
  const diff = Math.floor((now.getTime() - joined.getTime()) / 1000); // seconds
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  inviteCard: {
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  inviteGradient: {
    padding: 24,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 2,
  },
  sparkleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
    position: 'relative',
  },
  inviteTextSection: {
    flex: 1,
    zIndex: 4,
  },
  inviteTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inviteSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inviteDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  inviteIllustration: {
    width: 200,
    height: 120,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    position: 'absolute',
    right: 0,
    top: -40,
  },
  giftBoxesContainer: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  giftBox1: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 12,
    height: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  giftBox2: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
  },
  giftBox3: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    width: 12,
    height: 12,
    backgroundColor: '#45B7D1',
    borderRadius: 3,
  },
  giftBox4: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 12,
    height: 12,
    backgroundColor: '#96CEB4',
    borderRadius: 3,
  },
  coinsContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coin1: {
    width: 6,
    height: 6,
    backgroundColor: '#FFD93D',
    borderRadius: 3,
  },
  coin2: {
    width: 6,
    height: 6,
    backgroundColor: '#FFD93D',
    borderRadius: 3,
  },
  coin3: {
    width: 6,
    height: 6,
    backgroundColor: '#FFD93D',
    borderRadius: 3,
  },
  referralCodeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  referralCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  referralCodeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  codeDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    flex: 1,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeIcon: {
    marginRight: 8,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    alignSelf: 'center',
    marginTop: 12,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  referralCodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  referralCodeInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  howItWorksCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  rewardsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rewardItem: {
    alignItems: 'center',
    flex: 1,
  },
  rewardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  rewardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  rewardDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  referralsList: {
    gap: 12,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  referralInfo: {
    flex: 1,
    marginLeft: 4,
    justifyContent: 'center',
  },
  nameDateRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  referralName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'left',
  },
  referralDate: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'left',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  successBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successText: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
  pendingText: {
    color: '#FBBF24',
    fontWeight: 'bold',
  },
  emptyReferrals: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyReferralsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyReferralsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    marginRight: 12,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    marginRight: 12,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
  copyIconButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  avatarImgWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#f3eaff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  faqSection: {
    paddingHorizontal: 20,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  referImage: {
    width: 140,
    height: 140,
  },
  rewardsBgDecoration1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 50,
    transform: [{ rotate: '-15deg' }],
  },
  rewardsBgDecoration2: {
    position: 'absolute',
    bottom: 100,
    right: -30,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 75,
    transform: [{ rotate: '10deg' }],
  },
  rewardsBgDecoration3: {
    position: 'absolute',
    top: 200,
    left: 100,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    borderRadius: 60,
    transform: [{ rotate: '-20deg' }],
  },
}); 
