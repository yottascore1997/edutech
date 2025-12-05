import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default function PendingPostsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingPosts = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAuth('/student/posts/pending', user?.token || '');
      if (res.ok) {
        setPendingPosts(res.data);
      }
    } catch (e) {
      console.error('Error fetching pending posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const renderPendingPost = ({ item }: { item: any }) => (
    <View style={styles.pendingPostCard}>
      {/* Pending Post Header */}
      <View style={styles.pendingPostHeader}>
        <View style={styles.pendingPostAuthorSection}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.pendingPostAuthorAvatarRing}
          >
            <Image
              source={require('../../assets/images/avatar1.jpg')}
              style={styles.pendingPostAuthorAvatar}
            />
          </LinearGradient>
          <View style={styles.pendingPostAuthorInfo}>
            <Text style={styles.pendingPostAuthorName}>Your Post</Text>
            <View style={styles.pendingPostMetaRow}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.pendingPostTime}>Published {timeAgo(item.createdAt)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.pendingPostStatus}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.pendingStatusGradient}
          >
            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            <Text style={styles.pendingStatusText}>PUBLISHED</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Pending Post Content */}
      <View style={styles.pendingPostContentContainer}>
        <Text style={styles.pendingPostContent}>{item.content}</Text>
      </View>

      {/* Pending Post Media */}
      {item.imageUrl && (
        <View style={styles.pendingMediaContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.pendingMediaImage} resizeMode="cover" />
        </View>
      )}

      {/* Pending Post Hashtags */}
      {item.hashtags && item.hashtags.length > 0 && (
        <View style={styles.pendingHashtagsContainer}>
          {item.hashtags.map((tag: string) => (
            <View key={tag} style={styles.pendingHashtagChip}>
              <Text style={styles.pendingHashtagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Pending Post Info */}
      <View style={styles.pendingPostInfo}>
        <View style={styles.pendingPostInfoItem}>
          <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
          <Text style={styles.pendingPostInfoText}>This post is awaiting review by moderators</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading pending posts...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Posts</Text>
          <Text style={styles.headerSubtitle}>{pendingPosts.length} post{pendingPosts.length !== 1 ? 's' : ''} published</Text>
        </View>
      </LinearGradient>

      {/* Posts List */}
      {pendingPosts.length > 0 ? (
        <FlatList
          data={pendingPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPendingPost}
          style={styles.postsList}
          contentContainerStyle={styles.postsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#F59E0B']}
              tintColor="#F59E0B"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Create your first post to get started</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  postsList: {
    flex: 1,
  },
  postsListContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  // Pending Post Card Styles
  pendingPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  pendingPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pendingPostAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingPostAuthorAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingPostAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  pendingPostAuthorInfo: {
    flex: 1,
  },
  pendingPostAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  pendingPostMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingPostTime: {
    fontSize: 13,
    color: '#F59E0B',
    marginLeft: 6,
    fontWeight: '500',
  },
  pendingPostStatus: {
    marginLeft: 8,
  },
  pendingStatusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  pendingStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingPostContentContainer: {
    marginBottom: 16,
  },
  pendingPostContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '500',
  },
  pendingMediaContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pendingMediaImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  pendingHashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  pendingHashtagChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pendingHashtagText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingPostInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  pendingPostInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingPostInfoText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
