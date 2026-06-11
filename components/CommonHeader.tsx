import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Keep app bar height stable across Android display / font sizes */
function useHeaderMetrics() {
  const { width, height, fontScale } = useWindowDimensions();
  return useMemo(() => {
    const largeAndroid = Platform.OS === 'android' && (height >= 760 || width >= 392 || fontScale > 1.05);
    const compact = Platform.OS === 'android' && (largeAndroid || fontScale > 1);
    return {
      compact,
      btnSize: compact ? 38 : 42,
      examMinH: compact ? 36 : 40,
      examPadV: compact ? 3 : 5,
      examPadH: compact ? 7 : 8,
      iconRing: compact ? 26 : 28,
      chevronSize: compact ? 22 : 24,
      barPadBottom: compact ? 6 : 8,
      topInsetExtra: compact ? 3 : 6,
      fontScale,
    };
  }, [width, height, fontScale]);
}

const H = {
  bg: '#FFFBF7',
  bgGrad: ['#FFFCF8', '#FFFBF7', '#FAF8F5'] as const,
  primary: HomeTheme.primary,
  primaryLight: HomeTheme.primaryLight,
  ink: HomeTheme.ink,
  inkSecondary: HomeTheme.inkSecondary,
  muted: HomeTheme.inkMuted,
  border: HomeTheme.border,
  card: '#FFFFFF',
  walletGrad: ['#FBBF24', '#F59E0B', '#EA580C'] as const,
  examGrad: ['#8E78E7', '#6344D4', '#5546C9'] as const,
  examBorder: ['#C4B5FD', '#DDD6FE', '#EDE9FE'] as const,
};

interface CommonHeaderProps {
  showMainOptions?: boolean;
  title?: string;
}

const MAIN_OPTIONS = [
  { label: 'Live Exam', icon: 'flash' as const, color: '#EF4444', route: 'exam' },
  { label: 'Practice', icon: 'help-circle' as const, color: H.primary, route: 'practice-categories' },
  { label: 'Books', icon: 'book' as const, color: '#3B82F6', route: 'book-store' },
  { label: 'Quiz', icon: 'help' as const, color: '#10B981', route: 'quiz' },
];

const CommonHeader: React.FC<CommonHeaderProps> = ({ showMainOptions = false, title = '' }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const hm = useHeaderMetrics();
  const { walletAmount, refreshWalletAmount } = useWallet();

  React.useEffect(() => {
    refreshWalletAmount();
  }, [refreshWalletAmount]);

  return (
    <View style={st.wrapper}>
      <LinearGradient colors={[...H.bgGrad]} style={StyleSheet.absoluteFill} />

      <View style={[st.bar, { paddingTop: insets.top + hm.topInsetExtra, paddingBottom: hm.barPadBottom }]}>
        <Pressable
          style={st.iconBtn}
          onPress={() => navigation.toggleDrawer()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          android_ripple={{ color: 'rgba(99,68,212,0.12)', borderless: true }}
        >
          <View style={[st.menuInner, { width: hm.btnSize, height: hm.btnSize, borderRadius: hm.compact ? 12 : 14 }]}>
            <Ionicons name="menu" size={hm.compact ? 19 : 21} color={H.ink} />
          </View>
        </Pressable>

        <View style={st.barSpacer} />

        <View style={st.rightRow}>
          <TouchableOpacity
            style={st.iconBtn}
            onPress={() => navigation.navigate('(tabs)', { screen: 'notifications' })}
            activeOpacity={0.85}
          >
            <View style={[st.bellInner, { width: hm.btnSize, height: hm.btnSize, borderRadius: hm.compact ? 12 : 14 }]}>
              <Ionicons name="notifications-outline" size={hm.compact ? 18 : 20} color={H.ink} />
              <View style={st.notifDot} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={st.walletWrap}
            onPress={() => navigation.navigate('(tabs)', { screen: 'wallet' })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[...H.walletGrad]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[st.walletGrad, { paddingVertical: hm.compact ? 7 : 9, minWidth: hm.compact ? 72 : 78 }]}
            >
              <Ionicons name="wallet-outline" size={hm.compact ? 12 : 14} color="#FFF" />
              <Text style={st.walletAmt} allowFontScaling={false}>
                ₹{walletAmount || '0'}
              </Text>
              <View style={st.walletPlus}>
                <Ionicons name="add" size={12} color="#EA580C" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {title ? (
        <View style={st.titleRow}>
          <Text style={st.pageTitle}>{title}</Text>
        </View>
      ) : null}

      {showMainOptions && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.quickRow}
          style={st.quickScroll}
        >
          {MAIN_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.route}
              style={st.quickChip}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('(tabs)', { screen: opt.route as never })}
            >
              <View style={[st.quickIcon, { backgroundColor: `${opt.color}18` }]}>
                <Ionicons name={opt.icon} size={18} color={opt.color} />
              </View>
              <Text style={st.quickLbl}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={st.hairline} />
    </View>
  );
};

const st = StyleSheet.create({
  wrapper: {
    backgroundColor: H.bg,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 }
      : { elevation: 4 }),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  iconBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuInner: {
    borderRadius: 14,
    backgroundColor: H.card,
    borderWidth: 1,
    borderColor: H.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }
      : {}),
  },
  barSpacer: { flex: 1 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellInner: {
    borderRadius: 14,
    backgroundColor: H.card,
    borderWidth: 1,
    borderColor: H.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: H.card,
  },
  walletWrap: { borderRadius: 14, overflow: 'hidden' },
  walletGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    gap: 4,
    borderRadius: 12,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 }
      : { elevation: 3 }),
  },
  walletAmt: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFF' },
  walletPlus: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { paddingHorizontal: 16, paddingBottom: 8 },
  pageTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: H.ink },
  quickScroll: { marginBottom: 4 },
  quickRow: { paddingHorizontal: 14, gap: 10, paddingBottom: 10 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: H.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: H.border,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLbl: { fontFamily: FontFamily.semiBold, fontSize: 12, color: H.ink },
  hairline: {
    height: 1,
    backgroundColor: 'rgba(99, 68, 212, 0.08)',
    marginHorizontal: 14,
  },
});

export default CommonHeader;
