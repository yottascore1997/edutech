import { apiFetchAuth } from '@/constants/api';
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

type MatchUser = {
  id: string;
  name: string;
  profilePhoto?: string | null;
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
      setMatches(list);
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

  const openProfile = (other: MatchUser) => {
    router.push({
      pathname: '/(tabs)/study-partner-liked-user',
      params: {
        userId: other.id,
        name: other.name,
        profilePhoto: other.profilePhoto || '',
      },
    } as any);
  };

  const renderItem = ({ item }: { item: MatchItem }) => {
    const other = item.otherUser;
    return (
      <View style={styles.matchItem}>
        <TouchableOpacity
          style={styles.matchLeft}
          activeOpacity={0.8}
          onPress={() => openProfile(other)}
        >
          {other.profilePhoto ? (
            <Image
              source={{ uri: other.profilePhoto }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {other.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{other.name}</Text>
            <Text style={styles.metaText}>
              Matched on {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={styles.messageButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/chat-screen',
                params: {
                  userId: other.id,
                  userName: other.name,
                  userProfilePhoto: other.profilePhoto || '',
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
            activeOpacity={0.7}
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
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Matches</Text>
          </View>

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
    backgroundColor: '#F9FAFB',
    padding: 16,
    paddingTop: 20,
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
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
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
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    gap: 6,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  unmatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    gap: 4,
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

