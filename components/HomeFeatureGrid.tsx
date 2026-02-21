import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 56) / 2;

const items = [
  { id: 'notes', title: 'Study Notes', subtitle: '10,000+ Expert', image: require('../assets/images/icons/book.png'), gradient: ['#FCE7F3', '#F3E8FF'] },
  { id: 'pyp', title: 'Previous Year Papers', subtitle: 'Access 10,000+ PYPs', image: require('../assets/images/icons/exam.png'), gradient: ['#FFFBEB', '#FEF3C7'] },
  { id: 'practice', title: 'Practice Section', subtitle: '', image: require('../assets/images/icons/practise-girl.png'), gradient: ['#EFF6FF', '#E0F2FE'] },
  { id: 'live', title: 'Live Tests', subtitle: '&', image: require('../assets/images/icons/exam-time.png'), gradient: ['#F3E8FF', '#EEF2FF'] },
  { id: 'live-classes', title: 'Daily Live Classes', subtitle: '', image: require('../assets/images/icons/schedule.png'), gradient: ['#FFF1F2', '#FFEEF0'] },
  { id: 'quiz', title: 'Quiz Section', subtitle: '', image: require('../assets/images/icons/quiz.png'), gradient: ['#FFF1F2', '#FFF7ED'] },
  { id: 'books', title: 'Exam Books', subtitle: '', image: require('../assets/images/icons/book-shop.png'), gradient: ['#F8FAFC', '#F1F5F9'] },
  { id: 'current', title: 'Current Affairs', subtitle: '', image: require('../assets/images/icons/calendar.png'), gradient: ['#EEF2FF', '#F8FAFF'] },
];

export default function HomeFeatureGrid() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Image source={require('../assets/images/icons/question-mark.png')} style={styles.sectionIcon} resizeMode="contain" />
        <Text style={styles.sectionTitle}>What are you looking for</Text>
      </View>
      <View style={styles.grid}>
        {items.map((it, idx) => (
              <TouchableOpacity
            key={it.id}
            style={styles.cardWrapper}
            activeOpacity={0.8}
            onPress={() => {
              // route mapping - adjust as needed
              switch (it.id) {
                case 'notes':
                  router.push('/(tabs)/book-store' as any);
                  break;
                case 'pyp':
                  router.push('/pyq' as any);
                  break;
                case 'practice':
                  router.push('/(tabs)/practice-categories' as any);
                  break;
                case 'live':
                  router.push('/(tabs)/exam' as any);
                  break;
                case 'live-classes':
                  router.push('/(tabs)/social' as any);
                  break;
                case 'quiz':
                  router.push('/(tabs)/quiz' as any);
                  break;
                case 'books':
                  router.push('/(tabs)/book-store' as any);
                  break;
                case 'current':
                  router.push('/(tabs)/current-affairs' as any);
                  break;
                default:
                  break;
              }
            }}
          >
            {idx < 2 ? (
              <LinearGradient colors={it.gradient} style={styles.cardLarge}>
                <View style={styles.cardLargeText}>
                  <Text style={styles.cardLargeTitle} numberOfLines={2}>{it.title}</Text>
                  {it.subtitle ? <Text style={styles.cardLargeSubtitle} numberOfLines={2}>{it.subtitle}</Text> : null}
                </View>
                <View style={styles.cardLargeIcon}>
                  {it.image ? (
                    <Image source={it.image} style={styles.cardLargeImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name={it.icon as any} size={36} color={AppColors.primary} />
                  )}
                </View>
              </LinearGradient>
            ) : (
              <LinearGradient colors={it.gradient} style={styles.cardRow}>
                <View style={styles.cardRowText}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{it.title}</Text>
                  {it.subtitle ? <Text style={styles.cardSubtitle} numberOfLines={1}>{it.subtitle}</Text> : null}
                </View>
                <View style={styles.cardRowIcon}>
                  {it.image ? (
                    <Image source={it.image} style={styles.cardIconImageSmall} resizeMode="contain" />
                  ) : (
                    <Ionicons name={it.icon as any} size={20} color={AppColors.primary} />
                  )}
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionBar: {
    width: 4,
    height: 22,
    backgroundColor: AppColors.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 72,
    justifyContent: 'center',
    elevation: 2,
  },
  cardRow: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 88,
    justifyContent: 'center',
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRowText: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  cardRowIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconImageSmall: {
    width: 40,
    height: 40,
    opacity: 0.95,
  },
  /* Large first-row card */
  cardLarge: {
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardLargeText: {
    flex: 1,
    paddingRight: 10,
  },
  cardLargeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardLargeSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardLargeIcon: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLargeImage: {
    width: 56,
    height: 56,
    opacity: 0.95,
  },
});

