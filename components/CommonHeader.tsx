import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 32 - 10) / 2;

const H = {
  bg: '#FFFBF7',
  bgGrad: ['#FFFCF8', '#FFFBF7', '#FAF8F5'] as const,
  primary: HomeTheme.primary,
  primaryLight: HomeTheme.primaryLight,
  ink: HomeTheme.ink,
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

      <View style={[st.bar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          style={st.iconBtn}
          onPress={() => navigation.toggleDrawer()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          android_ripple={{ color: 'rgba(99,68,212,0.12)', borderless: true }}
        >
          <View style={st.menuInner}>
            <Ionicons name="menu" size={21} color={H.ink} />
          </View>
        </Pressable>

        <TouchableOpacity style={st.examWrap} onPress={handleSelectExamPress} activeOpacity={0.88}>
          {hasCategory ? (
            <LinearGradient colors={[...H.examBorder]} style={st.examBorder}>
              <View style={st.examInner}>
                <LinearGradient colors={[...H.examGrad]} style={st.examIconRing}>
                  <Ionicons name="school" size={14} color="#FFF" />
                </LinearGradient>
                <Text style={st.examTextActive} numberOfLines={1}>
                  {selectedCategory}
                </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleClearCategory();
                  }}
                  hitSlop={8}
                  style={st.clearBtn}
                >
                  <Ionicons name="close-circle" size={17} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : (
            <View style={st.examInnerPlain}>
              <View style={st.examIconPlain}>
                <Ionicons name="school-outline" size={15} color={H.primary} />
              </View>
              <Text style={st.examText} numberOfLines={1}>
                Select Exam
              </Text>
              <Ionicons name="chevron-down" size={15} color={H.primaryLight} />
            </View>
          )}
        </TouchableOpacity>

        <View style={st.rightRow}>
          <TouchableOpacity
            style={st.iconBtn}
            onPress={() => navigation.navigate('(tabs)', { screen: 'notifications' })}
            activeOpacity={0.85}
          >
            <View style={st.bellInner}>
              <Ionicons name="notifications-outline" size={20} color={H.ink} />
              <View style={st.notifDot} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={st.walletWrap}
            onPress={() => navigation.navigate('(tabs)', { screen: 'wallet' })}
            activeOpacity={0.9}
          >
            <LinearGradient colors={[...H.walletGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.walletGrad}>
              <Ionicons name="wallet-outline" size={14} color="#FFF" />
              <Text style={st.walletAmt}>₹{walletAmount || '0'}</Text>
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
            <View style={st.modalHandle} />
            <View style={st.modalHead}>
              <View>
                <Text style={st.modalTitle}>Select your Exam</Text>
                <Text style={st.modalSub}>Filter content across the app</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={st.modalClose}>
                <Ionicons name="close" size={20} color={H.ink} />
              </TouchableOpacity>
            </View>

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
                  <Text style={st.modalEmptyTxt}>No categories available</Text>
                </View>
              ) : (
                <View style={st.catGrid}>
                  {categories.map((category, index) => {
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
              <TouchableOpacity style={st.clearAllBtn} onPress={handleClearCategory}>
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
    paddingBottom: 10,
    gap: 8,
  },
  iconBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuInner: {
    width: 44,
    height: 44,
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
  examBorder: { borderRadius: 16, padding: 1.5 },
  examInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.card,
    borderRadius: 14.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    minHeight: 44,
  },
  examInnerPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.card,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: H.border,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 }
      : { elevation: 1 }),
  },
  examIconRing: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examIconPlain: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examText: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: H.muted,
  },
  examTextActive: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: H.ink,
  },
  clearBtn: { padding: 2 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellInner: {
    width: 44,
    height: 44,
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 5,
    borderRadius: 14,
    minWidth: 78,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 }
      : { elevation: 3 }),
  },
  walletAmt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '78%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: H.border,
  },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: H.ink },
  modalSub: { fontFamily: FontFamily.regular, fontSize: 12, color: H.muted, marginTop: 2 },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: H.border,
  },
  modalList: { paddingHorizontal: 16 },
  modalListContent: { paddingTop: 14, paddingBottom: 8 },
  modalEmpty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  modalEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyTxt: { fontFamily: FontFamily.medium, fontSize: 14, color: H.muted },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  catItemWrap: { width: CARD_W },
  catBorder: { borderRadius: 16, padding: 1.5 },
  catCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: H.border,
    minHeight: 108,
    justifyContent: 'center',
  },
  catCardActive: { backgroundColor: H.card, position: 'relative' },
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
    lineHeight: 16,
  },
  catNameActive: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: H.primary,
    textAlign: 'center',
    lineHeight: 16,
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
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: H.border,
  },
  clearAllTxt: { fontFamily: FontFamily.semiBold, fontSize: 14, color: H.muted },
});

export default CommonHeader;
