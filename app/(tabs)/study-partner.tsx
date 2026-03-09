import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import StudyPartnerBottomNav from '@/components/StudyPartnerBottomNav';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type StudyPartnerProfile = {
  bio?: string | null;
  examType?: string | null;
  goals?: string | null;
  studyTimeFrom?: string | null;
  studyTimeTo?: string | null;
  language?: string | null;
  isActive?: boolean;
};

export default function StudyPartnerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudyPartnerProfile | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [whoLikedCount, setWhoLikedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }
      setError(null);
      try {
        const [profRes, matchesRes, whoRes] = await Promise.all([
          apiFetchAuth('/student/study-partner/profile', user.token),
          apiFetchAuth('/student/study-partner/matches', user.token),
          apiFetchAuth('/student/study-partner/who-liked-you', user.token),
        ]);

        if (!isMounted) return;

        setProfile((profRes.data as any) || null);
        const matchesList = (matchesRes.data as any[]) || [];
        const whoList = (whoRes.data as any[]) || [];
        setMatchesCount(matchesList.length || 0);
        setWhoLikedCount(whoList.length || 0);
      } catch (e: any) {
        if (!isMounted) return;
        console.error('StudyPartnerHome load error:', e);
        setError('Unable to load study partner data. Please try again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user?.token]);

  if (!user?.token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Study Partner</Text>
        <Text style={styles.subtitle}>
          Please login to use Study Partner.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading Study Buddy...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#7C3AED', '#5B21B6', '#4C1D95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroTitle}>STUDY BUDDY</Text>
            <Text style={styles.heroSubtitle}>
              Find your study partner today.
            </Text>

            {/* Decorative glow dots */}
            <View style={styles.heroDotA} />
            <View style={styles.heroDotB} />
            <View style={styles.heroDotC} />
          </LinearGradient>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Find your Study Buddies - above Discover */}
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => router.push('/(tabs)/study-partner-discover' as any)}
            style={styles.inspireWrapper}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FAF5FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inspireCard}
            >
              <View style={styles.inspireTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inspireKicker}>Find your</Text>
                  <Text style={styles.inspireHeadline}>
                    Study <Text style={styles.inspireAccent}>Buddies</Text>
                  </Text>
                </View>
                <View style={styles.inspireAvatarStack}>
                  <View style={[styles.inspireAvatar, styles.inspireAvatarA]}>
                    <Image
                      source={require('@/assets/images/icons/student.jpg')}
                      style={styles.inspireAvatarImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={[styles.inspireAvatar, styles.inspireAvatarB]}>
                    <Image
                      source={require('@/assets/images/icons/student1.png')}
                      style={styles.inspireAvatarImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={[styles.inspireAvatar, styles.inspireAvatarC]}>
                    <Image
                      source={require('@/assets/images/icons/student2.png')}
                      style={styles.inspireAvatarImage}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inspirePill}>
                <Text style={styles.inspirePillText}>
                  Connect with like-minded students and share your study journey.
                </Text>
              </View>

              <View style={styles.inspireDotsRow}>
                <View style={styles.inspireDot} />
                <View style={[styles.inspireDot, styles.inspireDotActive]} />
                <View style={styles.inspireDot} />
              </View>

              <View style={styles.neverImageWrap}>
                <Image
                  source={require('@/assets/images/icons/partner.png')}
                  style={styles.neverPartnerImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.neverBlock}>
                <Text style={styles.neverTitle}>Never</Text>
                <Text style={styles.neverTitleBig}>Feel Alone</Text>
                <Text style={styles.neverSubtitle}>
                  Crafted with <Text style={styles.neverHeart}>❤️</Text> in India for the World
                </Text>
              </View>

              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inspireCta}
              >
                <Ionicons name="compass" size={16} color="#FFFFFF" />
                <Text style={styles.inspireCtaText}>Open Discover</Text>
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.grid}>
            {/* Find Local Partner + Matches: horizontal row */}
            <View style={styles.tilesRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.tile, styles.tileInRow]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/study-partner-discover',
                  params: { mode: 'local' },
                } as any)
              }
            >
              <LinearGradient
                colors={['#FFFFFF', '#F5F3FF']}
                style={styles.tileInnerRow}
              >
              <View style={styles.tileTopRow}>
                <Text style={styles.tileTitleRow} numberOfLines={2}>Find Local Partner</Text>
                <View style={styles.tileIconWrap}>
                  <Ionicons name="location" size={18} color="#22C55E" />
                </View>
              </View>
              <Text style={styles.tileSubtitleRow} numberOfLines={2}>
                Nearby study partners, same vibe.
              </Text>
              <LinearGradient
                colors={['#EC4899', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tileCta}
              >
                <Text style={styles.tileCtaText}>Find nearby</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#DBEAFE', '#E0E7FF']}
                style={styles.tileMediaRow}
              >
                <Ionicons name="navigate" size={22} color="#4F46E5" />
                <Text style={[styles.tileMediaText, { color: '#3730A3', fontSize: 11 }]} numberOfLines={1}>
                  Meet nearby
                </Text>
              </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>

            {/* Matches */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.tile, styles.tileInRow]}
              onPress={() => router.push('/(tabs)/study-partner-matches' as any)}
            >
              <LinearGradient
                colors={['#FFFFFF', '#FFF1F2']}
                style={styles.tileInnerRow}
              >
              <View style={styles.tileTopRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.tileTitleRow} numberOfLines={1}>Matches</Text>
                  <Text style={styles.tileCount}>
                    {matchesCount} match{matchesCount === 1 ? '' : 'es'}
                  </Text>
                </View>
                <View style={styles.tileIconWrap}>
                  <Ionicons name="heart" size={18} color="#DC2626" />
                </View>
              </View>
              <Text style={styles.tileSubtitleRow} numberOfLines={2}>
                Chat with your study buddies.
              </Text>
              <LinearGradient
                colors={['#EC4899', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tileCta}
              >
                <Text style={styles.tileCtaText}>Open matches</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#FCE7F3', '#EDE9FE']}
                style={styles.tileMediaRow}
              >
                <Ionicons name="chatbubbles" size={22} color="#BE185D" />
                <Text style={[styles.tileMediaText, { color: '#9D174D', fontSize: 11 }]} numberOfLines={1}>
                  Start chatting
                </Text>
              </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>
            </View>
          </View>

          {/* Optional: who liked you quick link */}
          {whoLikedCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.whoLikedRow}
              onPress={() =>
                router.push('/(tabs)/study-partner-who-liked-you' as any)
              }
            >
              <Ionicons name="eye" size={18} color="#6D28D9" />
              <Text style={styles.whoLikedText}>Who liked you</Text>
              <View style={styles.whoLikedBadge}>
                <Text style={styles.whoLikedBadgeText}>{whoLikedCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}

          {/* Profile quick link */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.profileRow}
            onPress={() => router.push('/(tabs)/study-partner-profile' as any)}
          >
            <View style={styles.profileRowLeft}>
              <View style={styles.profileIcon}>
                <Image
                  source={require('@/assets/images/icons/student2.png')}
                  style={styles.profileIconImage}
                  resizeMode="cover"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileTitle}>My Profile</Text>
                <Text style={styles.profileSubtitle} numberOfLines={1}>
                  {profile?.bio ? 'Profile completed' : 'Complete your profile for better matches'}
                </Text>
              </View>
            </View>
            <View style={styles.profilePill}>
              <Text style={styles.profilePillText}>
                {profile?.bio ? 'Edit' : 'Complete'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Discover Find your Study Buddy - below My Profile */}
          <View style={styles.findBuddyBelowProfileWrap}>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.tileFull}
            onPress={() => router.push('/(tabs)/study-partner-discover' as any)}
          >
            <LinearGradient
              colors={['#EDE9FE', '#E9D5FF', '#DDD6FE', '#F5F3FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.findBuddyCardInner}
            >
              <View style={styles.findBuddyRow}>
                <View style={styles.findBuddyCopy}>
                  <Text style={styles.findBuddyLabel}>DISCOVER</Text>
                  <Text style={styles.findBuddyTitle}>Find your Study Buddy</Text>
                  <Text style={styles.findBuddySubtitle}>
                    Swipe, match & study together. Your perfect partner is a tap away.
                  </Text>
                </View>
                <View style={styles.findBuddyImageContainer}>
                  <Image
                    source={require('@/assets/images/icons/study-buddy.png')}
                    style={styles.findBuddyHeroImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <View style={styles.findBuddyCtaWrap}>
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.findBuddyCta}
                >
                  <Ionicons name="sparkles" size={16} color="#FFF" />
                  <Text style={styles.findBuddyCtaText}>Start discovering</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFF" />
                </LinearGradient>
              </View>
              <View style={styles.findBuddyFooter}>
                <Ionicons name="people" size={12} color="#FFFFFF" />
                <Text style={styles.findBuddyFooterText}>New profiles added daily</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          </View>

        </ScrollView>
      )}
      <StudyPartnerBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 12,
    fontSize: 13,
  },
  hero: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  grid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  tilesRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
    marginBottom: 0,
  },
  tileInRow: {
    flex: 1,
    minWidth: 0,
    minHeight: 180,
  },
  tileFull: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  findBuddyBelowProfileWrap: {
    marginTop: 14,
  },
  tile: {
    width: '48%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    minHeight: 190,
    overflow: 'hidden',
  },
  findBuddyCardInner: {
    paddingTop: 14,
    paddingHorizontal: 18,
    paddingBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 22,
  },
  findBuddyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  findBuddyCopy: {
    flex: 1,
    minWidth: 0,
  },
  findBuddyImageContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  findBuddyHeroImage: {
    width: 260,
    height: 260,
  },
  findBuddyCtaWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  findBuddyLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#6D28D9',
    marginBottom: 2,
  },
  findBuddyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  findBuddySubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 17,
  },
  findBuddyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 9999,
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  findBuddyCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  findBuddyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    borderWidth: 0,
  },
  findBuddyFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  tileInner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    minHeight: 190,
    overflow: 'hidden',
  },
  tileInnerRow: {
    flex: 1,
    padding: 12,
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  tileTitleRow: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  tileSubtitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 18,
  },
  tileSubtitleRow: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 14,
  },
  tileCta: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tileCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tileCtaAlt: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  tileCtaTextAlt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
  },
  tileMedia: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(109,40,217,0.12)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tileMediaRow: {
    marginTop: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(109,40,217,0.12)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tileMediaText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6D28D9',
  },
  tileCount: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
  },
  whoLikedRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  whoLikedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  whoLikedBadge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whoLikedBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  profileRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  profileRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    overflow: 'hidden',
  },
  profileIconImage: {
    width: '100%',
    height: '100%',
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  profileSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  profilePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
  },
  profilePillText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  inspireWrapper: {
    marginTop: 14,
  },
  inspireCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
    overflow: 'hidden',
  },
  inspireTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inspireKicker: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
  },
  inspireHeadline: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  inspireAccent: {
    color: '#7C3AED',
  },
  inspireAvatarStack: {
    width: 86,
    height: 40,
    position: 'relative',
  },
  inspireAvatar: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  inspireAvatarImage: {
    width: '100%',
    height: '100%',
  },
  inspireAvatarA: { left: 0, backgroundColor: '#7C3AED' },
  inspireAvatarB: { left: 22, backgroundColor: '#EC4899' },
  inspireAvatarC: { left: 44, backgroundColor: '#4F46E5' },
  inspirePill: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  inspirePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 18,
  },
  inspireDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  inspireDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  inspireDotActive: {
    width: 18,
    backgroundColor: '#FBBF24',
  },
  neverImageWrap: {
    marginTop: 8,
    marginHorizontal: -16,
    marginLeft: -48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  neverPartnerImage: {
    width: '100%',
    height: 200,
  },
  neverBlock: {
    marginTop: 10,
    paddingVertical: 6,
  },
  neverTitle: {
    fontSize: 42,
    fontWeight: '300',
    color: '#111827',
    letterSpacing: -0.5,
  },
  neverTitleBig: {
    marginTop: -6,
    fontSize: 54,
    fontWeight: '300',
    color: '#111827',
    letterSpacing: -1.2,
  },
  neverSubtitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  neverHeart: {
    color: '#EC4899',
  },
  inspireCta: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  inspireCtaText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  heroDotA: {
    position: 'absolute',
    right: -20,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(236,72,153,0.25)',
  },
  heroDotB: {
    position: 'absolute',
    left: -30,
    bottom: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99,102,241,0.22)',
  },
  heroDotC: {
    position: 'absolute',
    right: 40,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});

