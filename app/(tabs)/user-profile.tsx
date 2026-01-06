import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { apiFetchAuth, getImageUrl } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function UserProfileScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const { userId, originalUserData } = route.params as { userId: string; originalUserData?: any };
  const navigation = useNavigation<any>();
  
  // Parse originalUserData if it's a string (from SocialFeed)
  const parsedOriginalUserData = typeof originalUserData === 'string' 
    ? JSON.parse(originalUserData) 
    : originalUserData;
  
  const [profile, setProfile] = useState<any>(parsedOriginalUserData || null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowRequests, setShowFollowRequests] = useState(false);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [followRequestsLoading, setFollowRequestsLoading] = useState(false);
  
  // Block/Unblock states
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  const fetchUserProfile = async () => {
    console.log('🔍 fetchUserProfile called');
    console.log('🔍 userId:', userId);
    console.log('🔍 parsedOriginalUserData:', parsedOriginalUserData);
    
    // Always make API call to get fresh data
    setLoading(true);
    try {
      // Use the correct API endpoint as specified
      console.log('🔍 Making API call to:', `/student/profile?userId=${userId}`);
      const res = await apiFetchAuth(`/student/profile?userId=${userId}`, user?.token || '');
      console.log('🔍 API response:', res);
      
      if (res.ok) {
        const profileData = res.data;
        console.log('🔍 Profile data received:', profileData);
        setProfile(profileData);
        
        // Set follow status directly from API response
        setIsFollowing(profileData.isFollowing || false);
        
        // Set follow request status if available
        if (profileData.followRequestStatus) {
          console.log('Follow request status:', profileData.followRequestStatus);
        }
        
        console.log('✅ Profile loaded successfully with fresh data');
      } else {
        console.log('🔍 API call failed:', res);
        setError('Failed to load profile');
      }
    } catch (e) {
      console.log('🔍 API call error:', e);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async (profileId: string) => {
    if (!user?.token || !profileId) return;
    
    try {
      const res = await apiFetchAuth(`/student/follow/status?userId=${profileId}`, user.token);
      if (res.ok) {
        setIsFollowing(res.data.isFollowing || false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
      setIsFollowing(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!profile?.id) return;
    
    setPostsLoading(true);
    try {
      const res = await apiFetchAuth(`/student/users/${profile.id}/posts`, user?.token || '');
      if (res.ok) {
        setUserPosts(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserPosts()]);
    setRefreshing(false);
  };

  useEffect(() => {
    console.log('🔍 UserProfile useEffect triggered');
    console.log('🔍 userId:', userId);
    console.log('🔍 parsedOriginalUserData:', parsedOriginalUserData);
    fetchUserProfile();
  }, [userId, originalUserData]);

  useEffect(() => {
    if (profile?.id) {
      fetchUserPosts();
    }
  }, [profile?.id]);

  const handleFollow = async () => {
    if (isFollowing) {
      Alert.alert(
        'Unfollow User',
        `Are you sure you want to unfollow ${profile?.name || 'this user'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Unfollow', 
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await apiFetchAuth(`/student/follow?userId=${profile.id}`, user?.token || '', {
                  method: 'DELETE',
                });
                
                if (res.ok) {
                  setIsFollowing(false);
                  fetchUserProfile();
                }
              } catch (error) {
                console.error('Error unfollowing user:', error);
              }
            }
          }
        ]
      );
    } else {
      // Check if follow request is pending
      if (profile?.followRequestStatus === 'PENDING') {
        Alert.alert(
          'Follow Request Pending',
          'You have already sent a follow request to this user. Please wait for their response.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      try {
        const res = await apiFetchAuth('/student/follow', user?.token || '', {
          method: 'POST',
          body: { targetUserId: profile.id },
        });
        
        if (res.ok) {
          // Check if it was sent as a request or direct follow
          if (res.data?.type === 'request') {
            Alert.alert(
              'Follow Request Sent',
              'Your follow request has been sent. The user will need to accept it.',
              [{ text: 'OK' }]
            );
          } else {
            setIsFollowing(true);
          }
          fetchUserProfile();
        }
      } catch (error) {
        console.error('Error following user:', error);
      }
    }
  };

  // Block/Unblock functionality
  const handleBlockUser = () => {
    setBlockModalVisible(true);
  };

  const confirmBlockUser = async () => {
    if (!user?.token || !profile) return;

    setBlocking(true);
    try {
      const response = await apiFetchAuth(`/student/users/${profile.id}/block`, user.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: blockReason || 'Spam'
        })
      });

      if (response.ok) {
        setIsBlocked(true);
        Alert.alert('Success', 'User blocked successfully');
        setBlockModalVisible(false);
        setBlockReason('');
      } else {
        Alert.alert('Error', 'Failed to block user. Please try again.');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!user?.token || !profile) return;

    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${profile?.name || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unblock', 
          style: 'default',
          onPress: async () => {
            try {
              const response = await apiFetchAuth(`/student/users/${profile.id}/unblock`, user.token, {
                method: 'DELETE',
              });

              if (response.ok) {
                setIsBlocked(false);
                Alert.alert('Success', 'User unblocked successfully');
              } else {
                Alert.alert('Error', 'Failed to unblock user. Please try again.');
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          }
        }
      ]
    );
  };

  const closeBlockModal = () => {
    setBlockModalVisible(false);
    setBlockReason('');
  };

  const renderUserPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthorSection}>
          <View style={styles.postAuthorAvatarContainer}>
            <Image
              source={profile?.profilePhoto ? { 
                uri: profile.profilePhoto.startsWith('http') 
                  ? profile.profilePhoto 
                  : getImageUrl(profile.profilePhoto) 
              } : require('../../assets/images/avatar1.jpg')}
              style={styles.postAuthorAvatar}
            />
          </View>
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{profile?.name || 'User'}</Text>
            <View style={styles.postTimeContainer}>
              <Ionicons name="time-outline" size={12} color="#9CA3AF" />
              <Text style={styles.postTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      </View>
      {item.content && (
        <View style={styles.postContentContainer}>
          <Text style={styles.postContent}>{item.content}</Text>
        </View>
      )}
      {item.imageUrl && (
        <View style={styles.postImageContainer}>
          <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.postImage} />
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Enhanced Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#9333EA', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                {profile?.profilePhoto ? (
                  <Image
                    source={{ 
                      uri: profile.profilePhoto.startsWith('http') 
                        ? profile.profilePhoto 
                        : getImageUrl(profile.profilePhoto) 
                    }}
                    style={styles.profileAvatar}
                  />
                ) : (
                  <Image
                    source={require('../../assets/images/avatar1.jpg')}
                    style={styles.profileAvatar}
                  />
                )}
              </View>
              <View style={styles.profileTextContainer}>
                <Text style={styles.profileName}>{profile?.name || 'Unknown User'}</Text>
                {profile?.username && (
                  <Text style={styles.profileUsername}>@{profile.username}</Text>
                )}
                {profile?.bio && (
                  <Text style={styles.profileBio}>{profile.bio}</Text>
                )}
                {profile?.course && (
                  <View style={styles.profileCourseContainer}>
                    <Ionicons name="school-outline" size={14} color="#fff" />
                    <Text style={styles.profileCourse}>{profile.course} • Year {profile.year}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Enhanced Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons name="grid-outline" size={24} color="#7C3AED" style={styles.statIcon} />
            <Text style={styles.statNumber}>{profile?._count?.posts || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#7C3AED" style={styles.statIcon} />
            <Text style={styles.statNumber}>{profile?._count?.followers || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="person-add-outline" size={24} color="#7C3AED" style={styles.statIcon} />
            <Text style={styles.statNumber}>{profile?._count?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Enhanced Action Buttons */}
        <View style={styles.actionSection}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.followButtonContainer}
              onPress={handleFollow}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isFollowing ? ['#10B981', '#059669'] : ['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.followButtonGradient}
              >
                <Ionicons 
                  name={isFollowing ? "checkmark-circle" : "person-add"} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.followButtonText}>
                  {isFollowing 
                    ? 'Following' 
                    : profile?.followRequestStatus === 'PENDING' 
                      ? 'Request Sent' 
                      : 'Follow'
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Message Button - Only visible when following */}
            {isFollowing && (
              <TouchableOpacity 
                style={styles.messageButtonContainer}
                onPress={() => {
                  // Navigate to advanced chat screen
                  try {
                    navigation.navigate('chat-screen', { 
                      userId: profile?.id, 
                      userName: profile?.name || 'User',
                      userProfilePhoto: profile?.profilePhoto || '',
                      isFollowing: 'true'
                    });
                  } catch (error) {
                    // Fallback if chat-screen doesn't exist
                    Alert.alert(
                      'Message Feature',
                      `Start a conversation with ${profile?.name || 'this user'}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Message', onPress: () => {
                          console.log('Opening chat with:', profile?.id);
                        }}
                      ]
                    );
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.messageButtonGradient}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                  <Text style={styles.messageButtonText}>Message</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.blockButtonContainer}
              onPress={isBlocked ? handleUnblockUser : handleBlockUser}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isBlocked ? ['#6B7280', '#4B5563'] : ['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.blockButtonGradient}
              >
                <Ionicons 
                  name={isBlocked ? "checkmark-circle" : "ban-outline"} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.blockButtonText}>
                  {isBlocked ? 'Unblock' : 'Block'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <View style={styles.postsTitleContainer}>
              <Ionicons name="grid-outline" size={24} color="#4F46E5" />
              <Text style={styles.postsTitle}>Posts</Text>
            </View>
            <Text style={styles.postsCount}>{userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}</Text>
          </View>
          {postsLoading ? (
            <View style={styles.postsLoadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.postsLoadingText}>Loading posts...</Text>
            </View>
          ) : userPosts.length > 0 ? (
            <FlatList
              data={userPosts}
              keyExtractor={(item) => item.id}
              renderItem={renderUserPost}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyPostsContainer}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyPostsText}>No posts yet</Text>
              <Text style={styles.emptyPostsSubtext}>This user hasn't shared any posts</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Block User Modal */}
      <Modal
        visible={blockModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeBlockModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.blockModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Block User</Text>
              <TouchableOpacity onPress={closeBlockModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.blockModalBody}>
              <View style={styles.blockModalIcon}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.blockIconGradient}
                >
                  <Ionicons name="ban" size={48} color="#fff" />
                </LinearGradient>
              </View>
              
              <Text style={styles.blockModalText}>
                Are you sure you want to block {profile?.name || 'this user'}?
              </Text>
              
              <Text style={styles.blockModalSubtext}>
                This user will not be able to see your posts or send you messages.
              </Text>

              <View style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>Reason (Optional)</Text>
                <View style={styles.reasonButtons}>
                  {['Spam', 'Harassment', 'Inappropriate Content', 'Other'].map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonButton,
                        blockReason === reason && styles.reasonButtonSelected
                      ]}
                      onPress={() => setBlockReason(reason)}
                    >
                      <Text style={[
                        styles.reasonButtonText,
                        blockReason === reason && styles.reasonButtonTextSelected
                      ]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.blockModalActions}>
                <TouchableOpacity
                  style={styles.blockCancelButton}
                  onPress={closeBlockModal}
                  disabled={blocking}
                >
                  <Text style={styles.blockCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.blockConfirmButton, blocking && styles.blockConfirmButtonDisabled]}
                  onPress={confirmBlockUser}
                  disabled={blocking}
                >
                  {blocking ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.blockConfirmButtonText}>Block User</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    marginBottom: 20,
  },
  profileGradient: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  avatarContainer: {
    marginBottom: 0,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  profileTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'left',
  },
  profileUsername: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    fontWeight: '500',
    textAlign: 'left',
  },
  profileBio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 6,
    textAlign: 'left',
    paddingHorizontal: 0,
    lineHeight: 18,
  },
  profileCourseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  profileCourse: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  followButtonContainer: {
    flex: 1,
    minWidth: 120,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  followButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  messageButtonContainer: {
    flex: 1,
    minWidth: 120,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  messageButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  blockButtonContainer: {
    flex: 1,
    minWidth: 120,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  blockButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  blockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  postsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  postsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  postsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  postsLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  postsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyPostsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyPostsText: {
    textAlign: 'center',
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyPostsSubtext: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
  },
  postCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAuthorAvatarContainer: {
    marginRight: 12,
  },
  postAuthorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  postTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  postContentContainer: {
    marginBottom: 12,
    paddingLeft: 56,
  },
  postContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  postImageContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E5E7EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  blockModalBody: {
    alignItems: 'center',
  },
  blockModalIcon: {
    marginBottom: 20,
  },
  blockIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockModalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  blockModalSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  reasonSection: {
    width: '100%',
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  reasonButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  reasonButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  reasonButtonTextSelected: {
    color: '#fff',
  },
  blockModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  blockCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  blockCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  blockConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  blockConfirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  blockConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
