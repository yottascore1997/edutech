import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
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

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 32 - 10) / 2;

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

interface Category {
  name: string;
  icon: string;
  color: string;
  categoryLogoUrl?: string;
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
  const { user } = useAuth();
  const { walletAmount, refreshWalletAmount } = useWallet();
  const { selectedCategory, setSelectedCategory, clearCategory } = useCategory();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  React.useEffect(() => {
    refreshWalletAmount();
  }, [refreshWalletAmount]);

  const fetchCategories = async () => {
    if (!user?.token) return;
    try {
      setLoadingCategories(true);
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      if (response.ok && response.data) {
        const categoryMap = new Map<string, Category>();
        response.data.forEach((exam: { category: string; categoryLogoUrl?: string }) => {
          if (!categoryMap.has(exam.category)) {
            categoryMap.set(exam.category, {
              name: exam.category,
              icon: getCategoryIcon(exam.category),
              color: getCategoryColor(exam.category),
              categoryLogoUrl: exam.categoryLogoUrl || undefined,
            });
          } else {
            const existing = categoryMap.get(exam.category)!;
            if (!existing.categoryLogoUrl && exam.categoryLogoUrl) {
              existing.categoryLogoUrl = exam.categoryLogoUrl;
            }
          }
        });
        setCategories(Array.from(categoryMap.values()));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCategoryIcon = (name: string): string => {
    const iconMap: Record<string, string> = {
      Hindi: 'language',
      Marathi: 'book',
      SSC: 'school',
      'SSC 1': 'medal',
      'Railway 1': 'train',
      Bank: 'card',
      'JEE Main': 'school',
      NEET: 'medical',
      GATE: 'construct',
      CAT: 'business',
      UPSC: 'library',
    };
    return iconMap[name] || 'book';
  };

  const getCategoryColor = (name: string): string => {
    const colors = ['#6344D4', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
    const hash = name.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleSelectExamPress = () => {
    if (categories.length === 0) fetchCategories();
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowCategoryModal(false);
  };

  const handleClearCategory = () => clearCategory();

  const hasCategory = Boolean(selectedCategory);

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

        <TouchableOpacity style={st.examWrap} onPress={handleSelectExamPress} activeOpacity={0.88}>
          {hasCategory ? (
            <LinearGradient colors={[...H.examBorder]} style={st.examBorder}>
              <View
                style={[
                  st.examInner,
                  { minHeight: hm.examMinH, paddingVertical: hm.examPadV, paddingHorizontal: hm.examPadH },
                ]}
              >
                <LinearGradient
                  colors={[...H.examGrad]}
                  style={[st.examIconRing, { width: hm.iconRing, height: hm.iconRing, borderRadius: hm.compact ? 8 : 10 }]}
                >
                  <Ionicons name="school" size={hm.compact ? 12 : 14} color="#FFF" />
                </LinearGradient>
                <View style={st.examTextCol}>
                  <Text style={st.examLabelActive} numberOfLines={1} allowFontScaling={false}>
                    Selected Exam
                  </Text>
                  <Text style={st.examTextActive} numberOfLines={1} allowFontScaling={false}>
                    {selectedCategory}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleClearCategory();
                  }}
                  hitSlop={8}
                  style={st.clearBtn}
                >
                  <Ionicons name="close-circle" size={hm.compact ? 16 : 18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient colors={['#EDE9FE', '#C4B5FD']} style={st.examBorder}>
              <View
                style={[
                  st.examInnerPlain,
                  { minHeight: hm.examMinH, paddingVertical: hm.examPadV, paddingHorizontal: hm.examPadH },
                ]}
              >
                <LinearGradient
                  colors={[...H.examGrad]}
                  style={[st.examIconRing, { width: hm.iconRing, height: hm.iconRing, borderRadius: hm.compact ? 8 : 10 }]}
                >
                  <Ionicons name="school-outline" size={hm.compact ? 12 : 14} color="#FFF" />
                </LinearGradient>
                <View style={st.examTextCol}>
                  <Text style={st.examLabel} numberOfLines={1} allowFontScaling={false}>
                    Select Exam
                  </Text>
                  {!hm.compact ? (
                    <Text style={st.examHint} numberOfLines={1} allowFontScaling={false}>
                      Tap to choose category
                    </Text>
                  ) : null}
                </View>
                <View style={[st.examChevronWrap, { width: hm.chevronSize, height: hm.chevronSize }]}>
                  <Ionicons name="chevron-down" size={hm.compact ? 12 : 14} color={H.primary} />
                </View>
              </View>
            </LinearGradient>
          )}
        </TouchableOpacity>

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

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable style={st.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <Pressable style={st.modalSheet} onPress={(e) => e.stopPropagation()}>
            <LinearGradient colors={[...H.examGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.modalHero}>
              <View style={st.modalHandle} />
              <View style={st.modalHeroOrb} />
              <View style={st.modalHead}>
                <View style={st.modalHeadLeft}>
                  <View style={st.modalHeroIcon}>
                    <Ionicons name="school" size={22} color="#FFF" />
                  </View>
                  <View style={st.modalHeadText}>
                    <Text style={st.modalTitle}>Select your Exam</Text>
                    <Text style={st.modalSub}>Filter exams, practice & content</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={st.modalClose}>
                  <Ionicons name="close" size={20} color={H.ink} />
                </TouchableOpacity>
              </View>
              {!loadingCategories && categories.length > 0 && (
                <View style={st.modalCountPill}>
                  <Text style={st.modalCountText}>{categories.length} categories available</Text>
                </View>
              )}
            </LinearGradient>

            {selectedCategory ? (
              <View style={st.selectedBanner}>
                <Ionicons name="checkmark-circle" size={18} color={H.primary} />
                <Text style={st.selectedBannerText} numberOfLines={1}>
                  Current: <Text style={st.selectedBannerBold}>{selectedCategory}</Text>
                </Text>
              </View>
            ) : null}

            <ScrollView
              style={st.modalList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={st.modalListContent}
            >
              {loadingCategories ? (
                <View style={st.modalEmpty}>
                  <ActivityIndicator size="large" color={H.primary} />
                  <Text style={st.modalEmptyTxt}>Loading exams…</Text>
                </View>
              ) : categories.length === 0 ? (
                <View style={st.modalEmpty}>
                  <View style={st.modalEmptyIcon}>
                    <Ionicons name="book-outline" size={32} color={H.primaryLight} />
                  </View>
                  <Text style={st.modalEmptyTitle}>No categories yet</Text>
                  <Text style={st.modalEmptyTxt}>Exam categories will appear here</Text>
                </View>
              ) : (
                <View style={st.catGrid}>
                  {categories.map((category) => {
                    const active = selectedCategory === category.name;
                    return (
                      <TouchableOpacity
                        key={category.name}
                        activeOpacity={0.9}
                        onPress={() => handleCategorySelect(category.name)}
                        style={st.catItemWrap}
                      >
                        {active ? (
                          <LinearGradient colors={[...H.examBorder]} style={st.catBorder}>
                            <View style={[st.catCard, st.catCardActive]}>
                              <CatThumb category={category} />
                              <Text style={st.catNameActive} numberOfLines={2}>
                                {category.name}
                              </Text>
                              <View style={st.catCheck}>
                                <Ionicons name="checkmark" size={12} color="#FFF" />
                              </View>
                            </View>
                          </LinearGradient>
                        ) : (
                          <View style={st.catCard}>
                            <CatThumb category={category} />
                            <Text style={st.catName} numberOfLines={2}>
                              {category.name}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {selectedCategory ? (
              <TouchableOpacity style={st.clearAllBtn} onPress={handleClearCategory} activeOpacity={0.85}>
                <Ionicons name="close-circle-outline" size={18} color={H.muted} />
                <Text style={st.clearAllTxt}>Clear selection</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

function CatThumb({ category }: { category: Category }) {
  const uri = category.categoryLogoUrl ? getImageUrl(category.categoryLogoUrl) : null;
  return (
    <View style={[st.catThumb, { backgroundColor: `${category.color}18` }]}>
      {uri ? (
        <Image source={{ uri }} style={st.catImg} resizeMode="cover" />
      ) : (
        <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={22} color={category.color} />
      )}
    </View>
  );
}

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
  examWrap: { flex: 1, minWidth: 0 },
  examBorder: { borderRadius: 14, padding: 1.5 },
  examInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.card,
    borderRadius: 12.5,
  },
  examInnerPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.card,
    borderRadius: 12.5,
  },
  examTextCol: { flex: 1, minWidth: 0, marginLeft: 7, justifyContent: 'center' },
  examLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: H.primary,
    lineHeight: 14,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  examLabelActive: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: H.muted,
    lineHeight: 12,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  examHint: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: H.muted,
    lineHeight: 12,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  examIconRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  examChevronWrap: {
    borderRadius: 7,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },
  examTextActive: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: H.ink,
    lineHeight: 14,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  clearBtn: { padding: 2 },
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: H.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    overflow: 'hidden',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 0,
    zIndex: 2,
  },
  modalHero: {
    paddingBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  modalHeroOrb: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 10,
  },
  modalHeadLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modalHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeadText: { flex: 1 },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: '#FFF' },
  modalSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    lineHeight: Platform.OS === 'android' ? 18 : 16,
  },
  modalCountPill: {
    alignSelf: 'flex-start',
    marginLeft: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modalCountText: { fontFamily: FontFamily.medium, fontSize: 11, color: '#FFF' },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: HomeTheme.primarySoft,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  selectedBannerText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: H.inkSecondary,
  },
  selectedBannerBold: { fontFamily: FontFamily.bold, color: H.primary },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalList: { paddingHorizontal: 16 },
  modalListContent: { paddingTop: 12, paddingBottom: 8 },
  modalEmpty: { alignItems: 'center', paddingVertical: 40 },
  modalEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalEmptyTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: H.ink, marginBottom: 4 },
  modalEmptyTxt: { fontFamily: FontFamily.medium, fontSize: 13, color: H.muted, textAlign: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catItemWrap: { width: CARD_W, marginBottom: 10 },
  catBorder: { borderRadius: 16, padding: 1.5 },
  catCard: {
    backgroundColor: '#FAFAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: H.border,
    minHeight: 112,
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }
      : { elevation: 2 }),
  },
  catCardActive: { backgroundColor: H.card, position: 'relative', borderColor: '#C4B5FD' },
  catThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  catImg: { width: 48, height: 48, borderRadius: 14 },
  catName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: H.ink,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 18 : 16,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  catNameActive: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: H.primary,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 18 : 16,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  catCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: H.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: H.border,
  },
  clearAllTxt: { fontFamily: FontFamily.semiBold, fontSize: 14, color: H.muted, marginLeft: 6 },
});

export default CommonHeader;
