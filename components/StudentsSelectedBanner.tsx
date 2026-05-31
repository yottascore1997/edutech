import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Trophy } from 'lucide-react-native';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

const AVATARS = [
  require('../assets/images/avatar1.jpg'),
  require('../assets/images/avatar2.jpg'),
  require('../assets/images/avatar3.jpg'),
  require('../assets/images/avatar1.jpg'),
  require('../assets/images/avatar2.jpg'),
];

export default function StudentsSelectedBanner() {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#2D2068', '#4B32AF', '#6344D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.badge}>
          <Trophy size={12} color="#78350F" strokeWidth={2.4} />
          <Text style={styles.badgeText}>Success Stories</Text>
        </LinearGradient>

        <View style={styles.countRow}>
          <Text style={styles.count}>4,23,891+</Text>
          <Text style={styles.countLabel}>students selected</Text>
        </View>
      </LinearGradient>

      <LinearGradient colors={['#FFFBF7', '#FFFFFF']} style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <Sparkles size={16} color={HomeTheme.primary} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Students Selected</Text>
        </View>

        <Text style={styles.desc}>
          Proud to help thousands secure their dream jobs through smart preparation
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.avatarsRow}>
            {AVATARS.map((a, i) => (
              <View
                key={i}
                style={[
                  styles.avatarRing,
                  i > 0 && styles.avatarOverlap,
                  i % 2 === 0 ? styles.ringPurple : styles.ringGold,
                ]}
              >
                <Image source={a} style={styles.avatar} />
              </View>
            ))}
            <LinearGradient
              colors={[...HomeTheme.heroCta]}
              style={[styles.avatarRing, styles.avatarOverlap, styles.moreRing]}
            >
              <Text style={styles.moreText}>+4L</Text>
            </LinearGradient>
          </View>

          <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.statPill}>
            <Ionicons name="trending-up" size={14} color="#059669" />
            <Text style={styles.statText}>Growing daily</Text>
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    ...Platform.select({
      ios: {
        shadowColor: '#4B32AF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 18,
      },
      android: { elevation: 7 },
    }),
  },
  hero: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -35,
    right: -15,
  },
  orb2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(251,191,36,0.12)',
    bottom: -10,
    left: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#78350F',
    marginLeft: 5,
    letterSpacing: 0.4,
  },
  countRow: {
    alignItems: 'flex-start',
  },
  count: {
    fontFamily: FontFamily.bold,
    fontSize: 34,
    color: '#FDE68A',
    lineHeight: Platform.OS === 'android' ? 40 : 38,
    letterSpacing: -0.5,
  },
  countLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: HomeTheme.ink,
    flex: 1,
  },
  desc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: HomeTheme.inkSecondary,
    lineHeight: Platform.OS === 'android' ? 20 : 18,
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    backgroundColor: '#FFF',
  },
  ringPurple: {
    borderWidth: 2,
    borderColor: '#C4B5FD',
  },
  ringGold: {
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  avatarOverlap: {
    marginLeft: -11,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  moreRing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderWidth: 0,
  },
  moreText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#FFF',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#059669',
    marginLeft: 5,
  },
});
