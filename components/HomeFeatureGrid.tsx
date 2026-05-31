import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

const items = [
  {
    id: 'notes',
    title: 'Study Notes',
    subtitle: 'Expert curated',
    route: '/(tabs)/book-store' as const,
    image: require('../assets/images/icons/book.png'),
    iconGrad: ['#F9A8D4', '#EC4899'] as const,
    cardGrad: ['#FDF2F8', '#FFFFFF'] as const,
  },
  {
    id: 'pyp',
    title: 'Previous Papers',
    subtitle: '10,000+ PYQs',
    route: '/(tabs)/pyq' as const,
    image: require('../assets/images/icons/exam.png'),
    iconGrad: ['#FCD34D', '#F59E0B'] as const,
    cardGrad: ['#FFFBEB', '#FFFFFF'] as const,
  },
  {
    id: 'live-classes',
    title: 'Live Classes',
    subtitle: 'Daily sessions',
    route: '/(tabs)/social' as const,
    image: require('../assets/images/icons/schedule.png'),
    iconGrad: ['#A5B4FC', '#6366F1'] as const,
    cardGrad: ['#EEF2FF', '#FFFFFF'] as const,
  },
  {
    id: 'current',
    title: 'Current Affairs',
    subtitle: 'Stay updated',
    route: '/(tabs)/current-affairs' as const,
    image: require('../assets/images/icons/calendar.png'),
    iconGrad: ['#6EE7B7', '#10B981'] as const,
    cardGrad: ['#ECFDF5', '#FFFFFF'] as const,
  },
];

export default function HomeFeatureGrid() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View>
          <Text style={styles.sectionTitle}>Explore More</Text>
          <Text style={styles.sectionSub}>Resources to boost prep</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {items.map((it) => (
          <TouchableOpacity
            key={it.id}
            style={styles.cardWrap}
            activeOpacity={0.88}
            onPress={() => router.push(it.route as any)}
          >
            <LinearGradient colors={[...it.cardGrad]} style={styles.card}>
              <LinearGradient colors={[...it.iconGrad]} style={styles.iconWrap}>
                <Image source={it.image} style={styles.iconImg} resizeMode="contain" />
              </LinearGradient>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {it.title}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {it.subtitle}
              </Text>
              <View style={styles.cardArrow}>
                <Ionicons name="arrow-forward" size={12} color={HomeTheme.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: HomeTheme.ink },
  sectionSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: HomeTheme.inkMuted,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrap: {
    width: CARD_WIDTH,
    marginBottom: 12,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  card: {
    borderRadius: 16,
    padding: 14,
    minHeight: 130,
    borderWidth: 1,
    borderColor: HomeTheme.border,
    position: 'relative',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconImg: { width: 24, height: 24 },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: HomeTheme.ink,
    lineHeight: Platform.OS === 'android' ? 18 : 16,
    marginBottom: 3,
    paddingRight: 20,
  },
  cardSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: HomeTheme.inkMuted,
  },
  cardArrow: {
    position: 'absolute',
    top: 14,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
