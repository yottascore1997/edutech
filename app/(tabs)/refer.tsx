import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Gift,
  IndianRupee,
  Share2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const STAT_W = Math.floor((SCREEN_W - PAD * 2 - 10) / 2);

const C = {
  bg: ['#EDE9FE', '#F5F3FF', '#FAFAFF'] as const,
  primary: '#6344D4',
  primaryLight: '#8E78E7',
  ink: '#0F0A1E',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#E8E8F0',
  heroGrad: ['#1A0F3C', '#4B32AF', '#6344D4', '#8E78E7'] as const,
  bannerGold: ['#FDE68A', '#FBBF24', '#F59E0B'] as const,
  ctaGrad: ['#8E78E7', '#6344D4', '#5546C9'] as const,
  green: '#059669',
  whatsapp: '#25D366',
};

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
  availableBalance?: number;
  totalAttempts?: number;
  referredBy: string | null;
  referrerInfo: unknown;
  referrals: ReferralUser[];
}

const FAQ_LIST = [
  {
    q: 'What is the Refer and Earn Program?',
    a: 'Our Refer and Earn program rewards you with ₹100 for every friend who signs up using your referral code.',
  },
  {
    q: 'How does the referral process work?',
    a: 'Share your unique referral code. When friends register with it, both of you receive ₹100 in your wallet.',
  },
  {
    q: 'Where can I use my earnings?',
    a: 'Use referral earnings for exam packages, practice tests, or any service in the app.',
  },
  {
    q: 'Is there a limit to referrals?',
    a: 'No limit — refer as many friends as you want and earn ₹100 per successful referral.',
  },
];

function timeAgo(dateString: string) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function ReferralAvatar({ user, index }: { user: ReferralUser; index: number }) {
  const [err, setErr] = useState(false);
  let uri: string | null = null;
  if (user.profilePhoto?.trim()) {
    uri = user.profilePhoto.startsWith('http') ? user.profilePhoto : getImageUrl(user.profilePhoto);
  }
  if (uri && !err) {
    return (
      <Image
        source={{ uri }}
        style={st.avatarImg}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <LinearGradient colors={['#8E78E7', C.primary]} style={st.avatarGrad}>
      <Text style={st.avatarTxt}>{getInitials(user.name) || String(index + 1)}</Text>
    </LinearGradient>
  );
}

function StatTile({
  icon,
  value,
  label,
  iconBg,
  prefix,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBg: string;
  prefix?: string;
}) {
  return (
    <LinearGradient colors={['#C4B5FD', '#DDD6FE', '#EDE9FE']} style={[st.statBorder, { width: STAT_W }]}>
      <View style={st.statTile}>
        <View style={[st.statIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <Text style={st.statVal}>
          {prefix}
          {value}
        </Text>
        <Text style={st.statLbl}>{label}</Text>
      </View>
    </LinearGradient>
  );
}

export default function ReferScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const fetchTicketDetails = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/referral/stats', user.token);
      if (response.ok) {
        setData(response.data);
        if (!response.data.referralCode) {
          await performGenerateCode();
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
  }, [user?.token]);

  const performGenerateCode = async () => {
    if (!user?.token) return;
    try {
      setGeneratingCode(true);
      const response = await apiFetchAuth('/student/referral/generate-code', user.token, { method: 'POST' });
      if (response.ok) {
        const stats = await apiFetchAuth('/student/referral/stats', user.token);
        if (stats.ok) setData(stats.data);
      } else {
        Alert.alert('Error', 'Failed to generate referral code. Please try again.');
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const generateReferralCode = async () => {
    if (!user?.token) return;
    if (data?.referralCode) {
      Alert.alert('Regenerate Referral Code?', 'This will replace your current code. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', style: 'destructive', onPress: () => performGenerateCode() },
      ]);
      return;
    }
    await performGenerateCode();
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.token) fetchTicketDetails();
    }, [user?.token, fetchTicketDetails])
  );

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTicketDetails();
  };

  const openDrawer = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      /* noop */
    }
  };

  const handleCopy = () => {
    if (data?.referralCode) {
      Clipboard.setString(data.referralCode);
      setCopied(true);
      Alert.alert('Copied!', 'Referral code copied to clipboard.');
    }
  };

  const handleShare = (platform: string) => {
    Alert.alert('Share', `Share via ${platform}`);
  };

  const progressPct = data?.totalAttempts
    ? Math.min(((data.referralCount || 0) / data.totalAttempts) * 100, 100)
    : data?.referralCount
      ? 100
      : 0;

  if (loading && !data) {
    return (
      <LinearGradient colors={[...C.bg]} style={[st.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={st.loadTxt}>Loading referral stats…</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[...C.bg]} style={StyleSheet.absoluteFill} />
      <View style={st.orb1} pointerEvents="none" />
      <View style={st.orb2} pointerEvents="none" />

      <SafeAreaView style={st.safe} edges={[]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: Platform.OS === 'android' ? 2 : 6,
            paddingBottom: insets.bottom + 32,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
          }
        >
          {/* Earn banner */}
          <View style={st.heroBannerWrap}>
            <LinearGradient
              colors={[...C.heroGrad]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.heroBanner}
            >
              <View style={st.bannerOrb1} pointerEvents="none" />
              <View style={st.bannerOrb2} pointerEvents="none" />
              <View style={st.heroBannerInner}>
                <View style={st.heroCopy}>
                  <View style={st.rewardPill}>
                    <Sparkles size={11} color="#FDE68A" strokeWidth={2.5} />
                    <Text style={st.rewardPillTxt}>INSTANT REWARD</Text>
                  </View>
                  <View style={st.amountRow}>
                    <Text style={st.amountPrefix}>Earn</Text>
                    <LinearGradient colors={[...C.bannerGold]} style={st.amountBadge}>
                      <IndianRupee size={18} color="#78350F" strokeWidth={2.8} />
                      <Text style={st.amountVal}>100</Text>
                    </LinearGradient>
                    <Text style={st.amountSuffix}>each</Text>
                  </View>
                  <Text style={st.heroBannerSub}>You & your friend both get ₹100 in wallet</Text>
                </View>
                <View style={st.heroVisual}>
                  <View style={st.heroCoinRing}>
                    <LinearGradient colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.08)']} style={st.heroCoin}>
                      <IndianRupee size={26} color="#FFF" strokeWidth={2.5} />
                    </LinearGradient>
                  </View>
                  <Image
                    source={require('@/assets/images/icons/refer.png')}
                    style={st.bannerImg}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Stats 2×2 */}
          <View style={st.statsGrid}>
            <StatTile
              icon={<IndianRupee size={18} color={C.green} strokeWidth={2} />}
              value={data?.totalEarnings ?? 0}
              label="Total Earned"
              iconBg="#D1FAE5"
              prefix="₹"
            />
            <StatTile
              icon={<Wallet size={18} color="#2563EB" strokeWidth={2} />}
              value={data?.availableBalance ?? 0}
              label="Balance"
              iconBg="#DBEAFE"
              prefix="₹"
            />
            <StatTile
              icon={<Users size={18} color={C.primary} strokeWidth={2} />}
              value={data?.referralCount ?? 0}
              label="Referrals"
              iconBg="#EDE9FE"
            />
            <StatTile
              icon={<TrendingUp size={18} color="#D97706" strokeWidth={2} />}
              value={data?.totalAttempts ?? 0}
              label="Attempts"
              iconBg="#FFEDD5"
            />
          </View>

          {/* Progress */}
          <LinearGradient colors={['#E9E5FF', '#F3EEFF', '#FAF8FF']} style={st.progressBorder}>
            <View style={st.progressCard}>
              <View style={st.progressHead}>
                <TrendingUp size={16} color={C.primary} strokeWidth={2} />
                <Text style={st.progressLbl}>Referral Progress</Text>
                <Text style={st.progressPct}>{Math.round(progressPct)}%</Text>
              </View>
              <View style={st.progressTrack}>
                <LinearGradient
                  colors={[C.primaryLight, C.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[st.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
              <Text style={st.progressMeta}>
                {data?.referralCount ?? 0} successful of {data?.totalAttempts ?? 0} attempts
              </Text>
            </View>
          </LinearGradient>

          {/* Referral code */}
          <LinearGradient colors={['#C4B5FD', '#DDD6FE', '#EDE9FE']} style={st.codeBorder}>
            <View style={st.codeCard}>
              <View style={st.codeHead}>
                <View style={st.codeIconWrap}>
                  <Gift size={18} color={C.primary} strokeWidth={2} />
                </View>
                <Text style={st.sectionTitle}>Your Referral Code</Text>
              </View>

              <View style={st.codeRow}>
                <View style={st.codeBox}>
                  <Text style={st.codeTxt} numberOfLines={1}>
                    {data?.referralCode || (generatingCode ? 'Generating…' : '—')}
                  </Text>
                </View>
                <TouchableOpacity style={st.codeAction} onPress={handleCopy} activeOpacity={0.88}>
                  <Copy size={18} color={copied ? C.green : C.primary} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity style={st.codeAction} onPress={() => handleShare('Share')} activeOpacity={0.88}>
                  <Share2 size={18} color={C.primary} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {!data?.referralCode ? (
                <TouchableOpacity
                  style={[st.genBtn, generatingCode && st.genBtnDisabled]}
                  onPress={generateReferralCode}
                  disabled={generatingCode}
                  activeOpacity={0.9}
                >
                  {generatingCode ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <>
                      <Sparkles size={16} color={C.primary} strokeWidth={2} />
                      <Text style={st.genBtnTxt}>Generate Code</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              <Text style={st.codeHint}>Share this code — earn ₹100 when friends sign up</Text>
            </View>
          </LinearGradient>

          {/* Share actions */}
          <View style={st.shareRow}>
            <TouchableOpacity style={st.shareFlex} onPress={() => handleShare('Invite')} activeOpacity={0.9}>
              <LinearGradient colors={[...C.ctaGrad]} style={st.inviteGrad}>
                <UserPlus size={18} color="#FFF" strokeWidth={2} />
                <Text style={st.inviteTxt}>Invite Friends</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={st.shareFlex} onPress={() => handleShare('WhatsApp')} activeOpacity={0.9}>
              <View style={st.waBtn}>
                <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                <Text style={st.waTxt}>WhatsApp</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Referrals list */}
          <View style={st.sectionHead}>
            <Text style={st.sectionTitle}>People You Referred</Text>
            <View style={st.countPill}>
              <Text style={st.countPillTxt}>{data?.referrals?.length ?? 0}</Text>
            </View>
          </View>

          {data?.referrals && data.referrals.length > 0 ? (
            data.referrals.map((item, index) => (
              <LinearGradient key={item.id} colors={['#E9E5FF', '#F3EEFF']} style={st.refBorder}>
                <View style={st.refRow}>
                  <ReferralAvatar user={item} index={index} />
                  <View style={st.refInfo}>
                    <Text style={st.refName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={st.refDate}>
                      {item.joinedAt ? `Joined ${timeAgo(item.joinedAt)}` : 'Recently joined'}
                    </Text>
                  </View>
                  <View style={[st.badge, index % 3 === 2 ? st.badgePending : st.badgeOk]}>
                    <Text style={[st.badgeTxt, index % 3 === 2 ? st.badgeTxtPending : st.badgeTxtOk]}>
                      {index % 3 === 2 ? 'Pending' : 'Success'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ))
          ) : (
            <View style={st.emptyBox}>
              <LinearGradient colors={['#EDE9FE', '#F5F3FF']} style={st.emptyIcon}>
                <Users size={36} color={C.primary} strokeWidth={1.8} />
              </LinearGradient>
              <Text style={st.emptyTitle}>No referrals yet</Text>
              <Text style={st.emptySub}>Share your code to see friends here</Text>
            </View>
          )}

          {/* How it works */}
          <Text style={[st.sectionTitle, st.sectionPad]}>How It Works</Text>
          {[
            { n: 1, title: 'Share Code', desc: 'Send your referral code to friends' },
            { n: 2, title: 'Friend Signs Up', desc: 'They create an account with your code' },
            { n: 3, title: 'Earn Rewards', desc: 'Both get ₹100 in wallet instantly' },
          ].map((step) => (
            <LinearGradient key={step.n} colors={['#E9E5FF', '#F5F3FF']} style={st.stepBorder}>
              <View style={st.stepRow}>
                <LinearGradient colors={['#8E78E7', C.primary]} style={st.stepNum}>
                  <Text style={st.stepNumTxt}>{step.n}</Text>
                </LinearGradient>
                <View style={st.stepCopy}>
                  <Text style={st.stepTitle}>{step.title}</Text>
                  <Text style={st.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            </LinearGradient>
          ))}

          {/* FAQ */}
          <Text style={[st.sectionTitle, st.sectionPad, { marginTop: 8 }]}>FAQ</Text>
          {FAQ_LIST.map((item, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.92}
              onPress={() => setFaqOpen(faqOpen === i ? null : i)}
            >
              <LinearGradient colors={['#C4B5FD', '#EDE9FE']} style={st.faqBorder}>
                <View style={st.faqCard}>
                  <View style={st.faqHead}>
                    <Text style={st.faqQ}>{item.q}</Text>
                    {faqOpen === i ? (
                      <ChevronUp size={18} color={C.primary} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={18} color={C.muted} strokeWidth={2} />
                    )}
                  </View>
                  {faqOpen === i ? <Text style={st.faqA}>{item.a}</Text> : null}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { marginTop: 14, fontFamily: FontFamily.medium, fontSize: 15, color: C.primary },
  orb1: {
    position: 'absolute',
    width: SCREEN_W * 0.6,
    height: SCREEN_W * 0.6,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(142, 120, 231, 0.09)',
    top: -SCREEN_W * 0.15,
    right: -SCREEN_W * 0.18,
  },
  orb2: {
    position: 'absolute',
    width: SCREEN_W * 0.35,
    height: SCREEN_W * 0.35,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
    bottom: 120,
    left: -SCREEN_W * 0.08,
  },
  heroBannerWrap: { marginHorizontal: PAD, marginBottom: Platform.OS === 'android' ? 10 : 12 },
  heroBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 16 }
      : { elevation: 8 }),
  },
  bannerOrb1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(253, 230, 138, 0.15)',
    top: -40,
    right: 20,
  },
  bannerOrb2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -20,
    left: -10,
  },
  heroBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    paddingHorizontal: 14,
    gap: 8,
  },
  heroCopy: { flex: 1, minWidth: 0 },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  rewardPillTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#FDE68A',
    letterSpacing: 0.8,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  amountPrefix: { fontFamily: FontFamily.bold, fontSize: 16, color: '#FFFFFF' },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  amountVal: { fontFamily: FontFamily.extraBold, fontSize: 22, color: '#78350F', letterSpacing: -0.5 },
  amountSuffix: { fontFamily: FontFamily.semiBold, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  heroBannerSub: {
    fontFamily: FontFamily.medium,
    fontSize: Platform.OS === 'android' ? 11 : 12,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 17,
  },
  heroVisual: { alignItems: 'center', justifyContent: 'center', width: 76 },
  heroCoinRing: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(253, 230, 138, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCoin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImg: { width: 64, height: 64, marginTop: 8 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: PAD,
    marginBottom: 14,
  },
  statBorder: { borderRadius: 16, padding: 1 },
  statTile: {
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statVal: { fontFamily: FontFamily.extraBold, fontSize: 20, color: C.ink },
  statLbl: { fontFamily: FontFamily.medium, fontSize: 11, color: C.muted, marginTop: 2 },
  progressBorder: { marginHorizontal: PAD, borderRadius: 16, padding: 1, marginBottom: 14 },
  progressCard: { backgroundColor: C.card, borderRadius: 15, padding: 14 },
  progressHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressLbl: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.ink, flex: 1 },
  progressPct: { fontFamily: FontFamily.bold, fontSize: 13, color: C.primary },
  progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, minWidth: 4 },
  progressMeta: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, marginTop: 8 },
  codeBorder: { marginHorizontal: PAD, borderRadius: 18, padding: 1, marginBottom: 14 },
  codeCard: { backgroundColor: C.card, borderRadius: 17, padding: 14 },
  codeHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  codeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  sectionPad: { marginHorizontal: PAD, marginBottom: 10 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    marginBottom: 10,
  },
  countPill: { backgroundColor: 'rgba(99, 68, 212, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countPillTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeBox: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  codeTxt: { fontFamily: FontFamily.extraBold, fontSize: 22, color: C.primary, letterSpacing: 2, textAlign: 'center' },
  codeAction: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
  },
  genBtnDisabled: { opacity: 0.6 },
  genBtnTxt: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.primary },
  codeHint: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, marginTop: 10, textAlign: 'center' },
  shareRow: { flexDirection: 'row', gap: 10, paddingHorizontal: PAD, marginBottom: 16 },
  shareFlex: { flex: 1 },
  inviteGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  inviteTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.whatsapp,
  },
  waTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  refBorder: { marginHorizontal: PAD, marginBottom: 8, borderRadius: 14, padding: 1 },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 13,
    padding: 12,
    gap: 10,
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9' },
  avatarGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  refInfo: { flex: 1, minWidth: 0 },
  refName: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink },
  refDate: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  badgeOk: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  badgePending: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  badgeTxt: { fontFamily: FontFamily.bold, fontSize: 10 },
  badgeTxtOk: { color: C.green },
  badgeTxtPending: { color: '#D97706' },
  emptyBox: { alignItems: 'center', paddingVertical: 32, marginHorizontal: PAD },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: C.ink },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 13, color: C.muted, marginTop: 4, textAlign: 'center' },
  stepBorder: { marginHorizontal: PAD, marginBottom: 8, borderRadius: 14, padding: 1 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 13,
    padding: 12,
  },
  stepNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { fontFamily: FontFamily.extraBold, fontSize: 16, color: '#FFF' },
  stepCopy: { flex: 1 },
  stepTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink },
  stepDesc: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, marginTop: 2 },
  faqBorder: { marginHorizontal: PAD, marginBottom: 8, borderRadius: 14, padding: 1 },
  faqCard: { backgroundColor: C.card, borderRadius: 13, padding: 14 },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  faqQ: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.ink, flex: 1 },
  faqA: { fontFamily: FontFamily.regular, fontSize: 13, color: C.muted, marginTop: 10, lineHeight: 20 },
});
