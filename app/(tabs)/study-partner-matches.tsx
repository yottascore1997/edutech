import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StudyPartnerBottomNav from '@/components/StudyPartnerBottomNav';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type MatchUser = {
  id: string;
  name: string;
  profilePhoto?: string | null;
  profilePicture?: string | null;
  photos?: string[] | null;
};

type MatchItem = {
  matchId: string;
  otherUser: MatchUser;
  createdAt: string;
};

export default function StudyPartnerMatchesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await apiFetchAuth(
        '/student/study-partner/matches',
        user.token,
      );
      const list = (res.data as any[]) || [];
      const normalized: MatchItem[] = list.map((m: any) => {
        const other = m?.otherUser || m?.user || m?.other || {};
        const photos = Array.isArray(other?.photos) ? other.photos : null;
        const profilePhoto =
          other?.profilePhoto ??
          other?.profilePicture ??
          (photos && photos.length > 0 ? photos[0] : null) ??
          null;
        return {
          matchId: String(m?.matchId ?? m?.id ?? ''),
          createdAt: String(m?.createdAt ?? m?.matchedAt ?? ''),
          otherUser: {
            id: String(other?.id ?? other?.userId ?? ''),
            name: String(other?.name ?? other?.fullName ?? 'User'),
            profilePhoto,
            profilePicture: other?.profilePicture ?? null,
            photos,
          },
        };
      });
      setMatches(normalized.filter((m) => m.matchId && m.otherUser?.id));
    } catch (e: any) {
      console.error('StudyPartnerMatches load error:', e);
      setError('Unable to load matches. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const handleUnmatch = async (otherUserId: string) => {
    if (!user?.token) return;
    try {
      await apiFetchAuth('/student/study-partner/unmatch', user.token, {
        method: 'POST',
        body: { otherUserId },
      });
      setMatches(prev =>
        prev.filter(m => m.otherUser && m.otherUser.id !== otherUserId),
      );
    } catch (e: any) {
      console.error('StudyPartnerMatches unmatch error:', e);
      setError('Failed to unmatch. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const getDisplayPhotoUrl = (other: MatchUser) => {
    const raw =
      other.profilePhoto ??
      other.profilePicture ??
      (Array.isArray(other.photos) && other.photos.length > 0 ? other.photos[0] : null) ??
      null;
    if (!raw) return '';
    return raw.startsWith('http') ? raw : getImageUrl(raw);
  };

  const openProfile = (other: MatchUser) => {
    router.push({
      pathname: '/(tabs)/study-partner-liked-user',
      params: {
        userId: other.id,
        name: other.name,
        profilePhoto: getDisplayPhotoUrl(other) || '',
      },
    } as any);
  };

  const renderItem = ({ item }: { item: MatchItem }) => {
    const other = item.otherUser;
    const displayPhotoUrl = getDisplayPhotoUrl(other);
    return (
      <View style={styles.matchCard}>
        <TouchableOpacity
          style={styles.matchMainRow}
          activeOpacity={0.88}
          onPress={() => openProfile(other)}
        >
          <LinearGradient
            colors={['#EDE9FE', '#FDF2F8', '#ECFEFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarWrap}>
              {displayPhotoUrl ? (
                <Image source={{ uri: displayPhotoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {other.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <View style={styles.matchCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {other.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="sparkles" size={12} color="#6D28D9" />
                <Text style={styles.metaPillText}>
                  Matched {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'recently'}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.messageButton}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/chat-screen',
                params: {
                  userId: other.id,
                  userName: other.name,
                  userProfilePhoto: displayPhotoUrl || '',
                  isFollowing: 'true',
                },
              } as any)
            }
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.unmatchButton}
            activeOpacity={0.85}
            onPress={() => handleUnmatch(other.id)}
          >
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.unmatchButtonText}>Unmatch</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {!user?.token ? (
        <View style={styles.centered}>
          <Text style={styles.title}>Matches</Text>
          <Text style={styles.subtitle}>
            Please login to view your matches.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <LinearGradient
            colors={['#4C1D95', '#6D28D9', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerHero}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.heroTitle}>Matches</Text>
                <Text style={styles.heroSubtitle} numberOfLines={1}>
                  {matches.length} new connection{matches.length === 1 ? '' : 's'} to study with
                </Text>
              </View>
              <View style={styles.headerBadge}>
                <Ionicons name="heart" size={14} color="#FFFFFF" />
                <Text style={styles.headerBadgeText}>{matches.length}</Text>
              </View>
            </View>
          </LinearGradient>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {matches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySubtitle}>
                Go to Discover and like some profiles to get matches.
              </Text>
              <TouchableOpacity
                style={styles.discoverButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.replace('/(tabs)/study-partner-discover' as any)
                }
              >
                <Text style={styles.discoverButtonText}>Open Discover</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={matches}
              keyExtractor={item => item.matchId}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4F46E5']}
                  tintColor="#4F46E5"
                />
              }
            />
          )}
        </View>
      )}
      <StudyPartnerBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    padding: 16,
    paddingTop: 16,
  },
  headerHero: {
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    overflow: 'hidden',
    marginBottom: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginRight: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.86)',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(236,72,153,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
    paddingTop: 4,
  },
  matchCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  matchMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2,
  },
  avatarWrap: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
  },
  matchCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.2,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 0,
    gap: 10,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    gap: 6,
    justifyContent: 'center',
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  unmatchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    gap: 4,
    justifyContent: 'center',
  },
  unmatchButtonText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  discoverButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
  },
  discoverButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
  },
});

