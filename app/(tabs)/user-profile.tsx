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
import { apiFetchAuth } from '../../constants/api';
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
          <Image
            source={profile?.profilePhoto ? { uri: profile.profilePhoto } : require('../../assets/images/avatar1.jpg')}
            style={styles.postAuthorAvatar}
          />
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{profile?.name || 'User'}</Text>
            <Text style={styles.postTime}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.postContentContainer}>
        <Text style={styles.postContent}>{item.content}</Text>
      </View>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.profileGradient}
          >
            <View style={styles.profileInfo}>
              <Image
                source={profile?.profilePhoto ? { uri: profile.profilePhoto } : require('../../assets/images/avatar1.jpg')}
                style={styles.profileAvatar}
              />
              <Text style={styles.profileName}>{profile?.name || 'Unknown User'}</Text>
              <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
              {profile?.bio && (
                <Text style={styles.profileBio}>{profile.bio}</Text>
              )}
              {profile?.course && (
                <Text style={styles.profileCourse}>{profile.course} • Year {profile.year}</Text>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?._count?.followers || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?._count?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?._count?.posts || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.followButton}
              onPress={handleFollow}
            >
              <Text style={styles.followButtonText}>
                {isFollowing 
                  ? 'Following' 
                  : profile?.followRequestStatus === 'PENDING' 
                    ? 'Request Sent' 
                    : 'Follow'
                }
              </Text>
            </TouchableOpacity>

            {/* Message Button - Only visible when following */}
            {isFollowing && (
              <TouchableOpacity 
                style={styles.messageButton}
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
              >
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.blockButton}
              onPress={isBlocked ? handleUnblockUser : handleBlockUser}
            >
              <Text style={styles.blockButtonText}>
                {isBlocked ? 'Unblock' : 'Block'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.postsTitle}>Posts</Text>
          {postsLoading ? (
            <ActivityIndicator size="large" color="#4F46E5" />
          ) : userPosts.length > 0 ? (
            <FlatList
              data={userPosts}
              keyExtractor={(item) => item.id}
              renderItem={renderUserPost}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyPostsText}>No posts yet</Text>
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
    padding: 30,
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  profileBio: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  profileCourse: {
    fontSize: 14,
    color: '#fff',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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
  followButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  blockButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  blockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyPostsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 20,
  },
  postCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  postContentContainer: {
    marginBottom: 10,
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
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
