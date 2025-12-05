import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiFetchAuth, getImageUrl } from '../constants/api';
import { useAuth } from '../context/AuthContext';
import AddStory from './AddStory';
import StoryViewer from './StoryViewer';

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

interface SocialFeedProps {
  refreshTrigger?: number;
  navigation?: any; // Using any for now to handle different navigation types
}

export default function SocialFeed({ refreshTrigger, navigation }: SocialFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  
  // CreatePost modal state
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Add Story modal state
  const [addStoryVisible, setAddStoryVisible] = useState(false);

  // Story viewer state
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [stories, setStories] = useState<any[]>([
    // Test story to see if rendering works
    { 
      id: 'add-story', 
      username: 'Your Story', 
      image: require('../assets/images/avatar1.jpg'), 
      hasStory: false, 
      isAdd: true
    }
  ]);

  // Follow requests state
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [showFollowRequests, setShowFollowRequests] = useState(false);
  const [followRequestsLoading, setFollowRequestsLoading] = useState(false);

  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reporting, setReporting] = useState(false);

  // Block modal state
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>('');
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchStories();
    fetchFollowRequests(); // Fetch follow requests on mount
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      resetAndFetchPosts();
      fetchStories();
    }
  }, [refreshTrigger]);

  // Refresh every time the screen comes into focus (with throttling)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refresh if it's been more than 30 seconds since last refresh
      if (now - lastRefresh > 30000) {
        resetAndFetchPosts();
        fetchStories();
        setLastRefresh(now);
      }
    }, [user?.token, lastRefresh])
  );
  
  // Debug state changes
  useEffect(() => {
    console.log('🔍 State changed - searchResults:', searchResults);
    console.log('🔍 State changed - showSearchResults:', showSearchResults);
    console.log('🔍 State changed - searching:', searching);
  }, [searchResults, showSearchResults, searching]);
  
  // Debug state changes
  useEffect(() => {
    console.log('🔍 State changed - searchResults:', searchResults);
    console.log('🔍 State changed - showSearchResults:', showSearchResults);
    console.log('🔍 State changed - searching:', searching);
  }, [searchResults, showSearchResults, searching]);

  const resetAndFetchPosts = () => {
    setPage(1);
    setHasMorePosts(true);
    setPosts([]);
    fetchPosts(true);
  };

  const fetchPosts = async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    setError('');
    try {
      // Use pagination parameters
      const res = await apiFetchAuth(`/student/posts?page=${page}&limit=10`, user?.token || '');
      if (res.ok) {
        const newPosts = res.data.posts || res.data; // Handle different API response formats
        
        // Check if we have more posts
        if (newPosts.length < 10) {
          setHasMorePosts(false);
        }
        
        if (isRefresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
      } else {
        setError('Failed to load posts');
      }
    } catch (e) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasMorePosts) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPostsWithPage(nextPage);
    }
  };

  const fetchPostsWithPage = async (pageNumber: number) => {
    setLoadingMore(true);
    setError('');
    try {
      const res = await apiFetchAuth(`/student/posts?page=${pageNumber}&limit=10`, user?.token || '');
      if (res.ok) {
        const newPosts = res.data.posts || res.data;
        
        if (newPosts.length < 10) {
          setHasMorePosts(false);
        }
        
        setPosts(prev => {
          const existingIds = new Set(prev.map(post => post.id));
          const uniqueNewPosts = newPosts.filter((post: any) => !existingIds.has(post.id));
          return [...prev, ...uniqueNewPosts];
        });
      } else {
        setError('Failed to load posts');
      }
    } catch (e) {
      setError('Failed to load posts');
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await apiFetchAuth('/student/stories?limit=20', user?.token || '');
      
      if (response.ok) {
        // Transform the API response structure
        const storiesArray = [
          { 
            id: 'add-story', 
            username: 'Your Story', 
            image: require('../assets/images/avatar1.jpg'), 
            hasStory: false, 
            isAdd: true 
          }
        ];

        // Process each user's stories (limit to first 20 users for performance)
        const limitedUserData = response.data.slice(0, 20);
        limitedUserData.forEach((userData: any) => {
          if (userData.user && userData.stories && userData.stories.length > 0) {
            storiesArray.push({
              id: userData.user.id,
              username: userData.user.name,
              image: userData.user.profilePhoto ? getImageUrl(userData.user.profilePhoto) : require('../assets/images/avatar1.jpg'),
              hasStory: true,
              stories: userData.stories.map((story: any) => ({
                ...story,
                isLiked: story.isLiked || false,
                likeCount: story.likeCount || 0
              }))
            } as any);
          }
        });

        setStories(storiesArray);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([resetAndFetchPosts(), fetchStories()]);
    setRefreshing(false);
  };

  // Comment modal handlers
  const openComments = async (post: any) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    setCommentsLoading(true);
    setComments([]);
    try {
      const res = await apiFetchAuth(`/student/posts/${post.id}/comments`, user?.token || '');
      if (res.ok) {
        setComments(res.data);
      } else {
        setComments([]);
      }
    } catch (e) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setCommentModalVisible(false);
    setSelectedPost(null);
    setComments([]);
    setNewComment('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    setPostingComment(true);
    try {
      const res = await apiFetchAuth(`/student/posts/${selectedPost.id}/comments`, user?.token || '', {
        method: 'POST',
        body: { content: newComment.trim() },
      });
      if (res.ok) {
        // Add the new comment to the comments list
        setComments((prev) => [res.data, ...prev]);
        
        // Update the post's comment count in the main posts list
        setPosts(prevPosts => 
          prevPosts.map((post: any) => {
            if (post.id === selectedPost.id) {
              return {
                ...post,
                _count: {
                  ...post._count,
                  comments: (post._count?.comments || 0) + 1
                }
              };
            }
            return post;
          })
        );
        
        setNewComment('');
      }
    } catch (e) {
      console.error('Error adding comment:', e);
      // Optionally show error message to user
    } finally {
      setPostingComment(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await apiFetchAuth(`/student/posts/${postId}/like`, user?.token || '', {
        method: 'POST',
      });
      
      if (res.ok) {
        // Update the post's like status in the local state
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                isLiked: res.data.liked,
                _count: {
                  ...post._count,
                  likes: res.data.liked 
                    ? (post._count?.likes || 0) + 1 
                    : Math.max((post._count?.likes || 0) - 1, 0)
                }
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Optionally show error message to user
    }
  };

  const handlePollVote = async (postId: string, optionIndex: number) => {
    try {
      const res = await apiFetchAuth(`/student/posts/${postId}/vote`, user?.token || '', {
        method: 'POST',
        body: { optionIndex },
      });
      
      if (res.ok) {
        // Update the post's poll vote count in the local state
        setPosts(prevPosts => 
          prevPosts.map((post: any) => {
            if (post.id === postId) {
              return {
                ...post,
                _count: {
                  ...post._count,
                  pollVotes: (post._count?.pollVotes || 0) + 1
                },
                pollVotes: res.data.pollVotes || post.pollVotes || []
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      // Optionally show error message to user
    }
  };

  const handleQuestionAnswer = async (postId: string, optionIndex: number) => {
    try {
      const res = await apiFetchAuth(`/student/posts/${postId}/question-answer`, user?.token || '', {
        method: 'POST',
        body: { optionIndex },
      });
      
      if (res.ok) {
        // Update the post's question answer count in the local state
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                _count: {
                  ...post._count,
                  questionAnswers: (post._count?.questionAnswers || 0) + 1
                }
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error answering question:', error);
      // Optionally show error message to user
    }
  };


  const handleMessageUser = async (authorId: string, authorName: string) => {
    try {
      const res = await apiFetchAuth(`/student/messages/${authorId}`, user?.token || '');
      if (res.ok) {
        // Navigate to chat screen with user information
        if (navigation) {
          navigation.navigate('chat', { 
            userId: authorId, 
            userName: authorName,
            messages: res.data || []
          });
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleAddStory = () => {
    setAddStoryVisible(true);
  };

  const handleStoryCreated = () => {
    // Refresh the feed when a new story is created
    fetchPosts();
    fetchStories();
  };

  const handleStoryPress = (storyIndex: number) => {
    const selectedStory = stories[storyIndex];
    if (selectedStory && !selectedStory.isAdd && selectedStory.stories && selectedStory.stories.length > 0) {
      setSelectedStoryIndex(storyIndex);
      setStoryViewerVisible(true);
    } else {
      console.log('No stories available for this user');
    }
  };

  // Report functionality
  const handleReportPost = (postId: string) => {
    setSelectedPostId(postId);
    setReportModalVisible(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedPostId || !reportReason || !reportDescription.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setReporting(true);
    try {
      const response = await apiFetchAuth(`/student/posts/${selectedPostId}/report`, user?.token || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription.trim()
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Post reported successfully');
        setReportModalVisible(false);
        setReportReason('');
        setReportDescription('');
        setSelectedPostId(null);
      } else {
        Alert.alert('Error', 'Failed to report post. Please try again.');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      Alert.alert('Error', 'Failed to report post. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setReportReason('');
    setReportDescription('');
    setSelectedPostId(null);
  };

  // Block functionality
  const handleBlockUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setBlockModalVisible(true);
  };

  const handleSubmitBlock = async () => {
    if (!selectedUserId || !user?.token) return;

    setBlocking(true);
    try {
      const response = await apiFetchAuth(`/student/users/${selectedUserId}/block`, user.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: blockReason || 'Spam'
        })
      });

      if (response.ok) {
        Alert.alert('Success', `${selectedUserName} has been blocked successfully`);
        setBlockModalVisible(false);
        setSelectedUserId(null);
        setSelectedUserName('');
        setBlockReason('');
        // Refresh posts to remove blocked user's posts
        fetchPosts();
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

  const closeBlockModal = () => {
    setBlockModalVisible(false);
    setSelectedUserId(null);
    setSelectedUserName('');
    setBlockReason('');
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    console.log('🔍 Search query:', query);
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      // If no query, hide search results
      console.log('🔍 No query, hiding search results...');
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (query.trim().length < 2) {
      console.log('🔍 Query too short, clearing results');
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearching(true);
    try {
      console.log('🔍 Making API call to search...');
      const response = await apiFetchAuth(`/student/search?q=${encodeURIComponent(query)}`, user?.token || '');
      console.log('🔍 Search API response:', response);
      
      if (response.ok) {
        const users = response.data.users || [];
        console.log('🔍 Found users:', users);
        
        // Enhanced filtering to remove unwanted results
        const validUsers = users.filter((searchUser: any) => {
          // Basic validation
          if (!searchUser || !searchUser.id || !searchUser.name) {
            console.log('🔍 Filtering out user with missing data:', searchUser);
            return false;
          }
          
          // Filter out current user (fix the variable reference)
          if (searchUser.id === user?.id) {
            console.log('🔍 Filtering out current user:', searchUser.name);
            return false;
          }
          
          // Filter out users with incomplete profiles
          if (!searchUser.email || !searchUser.name.trim()) {
            console.log('🔍 Filtering out incomplete profile:', searchUser);
            return false;
          }
          
          // Only filter out obvious test/dummy accounts (very minimal filtering)
          const email = searchUser.email.toLowerCase();
          const unwantedPatterns = [
            'test@test', 'demo@demo', 'admin@admin', 'fake@fake'
          ];
          
          const isUnwanted = unwantedPatterns.some(pattern => 
            email.includes(pattern)
          );
          
          if (isUnwanted) {
            console.log('🔍 Filtering out test account:', searchUser.email);
            return false;
          }
          
          console.log('🔍 Valid user:', searchUser.name, searchUser.email);
          return true;
        });
        
        console.log('🔍 Valid users after enhanced filtering:', validUsers);
        
        setSearchResults(validUsers);
        setShowSearchResults(true);
      } else {
        console.log('🔍 Search API error:', response);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('🔍 Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearching(false);
    }
  };

  // Fetch all users for initial display - REMOVED to prevent unwanted results
  const fetchAllUsers = async () => {
    // Don't show all users by default - only show when searching
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleUserPress = (searchUser: any) => {
    console.log('🚀 handleUserPress called with:', searchUser);
    
    // Navigate to user profile using expo-router
    if (searchUser && searchUser.id) {
      console.log('🔍 Navigating to user profile:', searchUser);
      console.log('🔍 User ID:', searchUser.id);
      console.log('🔍 User Name:', searchUser.name);
      console.log('🔍 Router object:', router);
      console.log('🔍 Navigation object:', navigation);
      
      try {
        console.log('🚀 Attempting expo-router navigation...');
        // Use expo-router for navigation
        router.push({
          pathname: '/(tabs)/user-profile',
          params: { 
            userId: searchUser.id,
            originalUserData: searchUser
          }
        });
        
        console.log('✅ Navigation successful using expo-router');
        setShowSearchResults(false);
        setSearchQuery('');
      } catch (error) {
        console.error('❌ Navigation error:', error);
        
        // Fallback: try navigation prop if available
        if (navigation) {
          try {
            console.log('🚀 Attempting fallback navigation...');
            navigation.navigate('UserProfile' as never, { 
              userId: searchUser.id,
              originalUserData: searchUser
            } as never);
            console.log('✅ Fallback navigation successful');
            setShowSearchResults(false);
            setSearchQuery('');
          } catch (fallbackError) {
            console.error('❌ Fallback navigation also failed:', fallbackError);
            alert('Navigation failed. Please try again.');
          }
        } else {
          console.log('❌ No navigation object available');
          alert('Navigation failed. Please try again.');
        }
      }
    } else {
      console.log('❌ Invalid user data');
      console.log('Search user:', searchUser);
      alert('Cannot navigate: Invalid user data');
    }
  };

  // Hide search results when scrolling
  const handleScroll = () => {
    if (showSearchResults) {
      setShowSearchResults(false);
    }
  };

  // Fetch follow requests
  const fetchFollowRequests = async () => {
    setFollowRequestsLoading(true);
    try {
      const response = await apiFetchAuth('/student/follow-requests', user?.token || '');
      if (response.ok) {
        setFollowRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setFollowRequestsLoading(false);
    }
  };

  // Accept follow request
  const handleAcceptFollowRequest = async (requestId: string, senderId: string) => {
    try {
      const response = await apiFetchAuth(`/student/follow-requests/${requestId}/accept`, user?.token || '', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Remove the accepted request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
        // Optionally refresh posts to update follow status
        fetchPosts();
      }
    } catch (error) {
      console.error('Error accepting follow request:', error);
    }
  };

  // Reject follow request
  const handleRejectFollowRequest = async (requestId: string) => {
    try {
      const response = await apiFetchAuth(`/student/follow-requests/${requestId}/reject`, user?.token || '', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Remove the rejected request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Unable to load posts</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetAndFetchPosts}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.loadingFooterText}>Loading more posts...</Text>
      </View>
    );
  };

    const renderSearchResult = ({ item }: { item: any }) => {
    // Validate that the item has required properties
    if (!item || !item.id || !item.name) {
      return null;
    }
    
    const handleItemPress = () => {
      if (item && item.id) {
        handleUserPress(item);
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.enhancedSearchResultItem}
        onPress={handleItemPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(248,250,252,0.9)']}
          style={styles.searchResultGradient}
        >
          {/* Avatar Section */}
          <View style={styles.enhancedSearchAvatar}>
            {item.profilePhoto ? (
              <Image source={{ uri: item.profilePhoto }} style={styles.enhancedAvatarImage} />
            ) : (
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.enhancedAvatarPlaceholder}
              >
                <Text style={styles.enhancedAvatarInitials}>
                  {item.name ? item.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
            )}
            
            {/* Online Status Indicator */}
            <View style={styles.onlineStatusIndicator} />
          </View>
          
          {/* User Info Section */}
          <View style={styles.enhancedSearchInfo}>
            <View style={styles.userNameContainer}>
              <Text style={styles.enhancedSearchName}>{item.name}</Text>
              {item.isFollowedBack && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                </View>
              )}
            </View>
            
            <Text style={styles.enhancedSearchEmail}>{item.email}</Text>
            
            {(item.course || item.year) && (
              <View style={styles.enhancedCourseContainer}>
                <LinearGradient
                  colors={['#F3F4F6', '#E5E7EB']}
                  style={styles.courseTagGradient}
                >
                  <Ionicons name="school-outline" size={12} color="#6B7280" />
                  <Text style={styles.enhancedCourseText}>
                    {[item.course, item.year].filter(Boolean).join(' • ')}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>
          
          {/* Action Section */}
          <View style={styles.enhancedSearchActions}>
            {item.isFollowing ? (
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.enhancedFollowingBadge}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.enhancedFollowingText}>Following</Text>
              </LinearGradient>
            ) : (
              <TouchableOpacity 
                style={styles.enhancedFollowButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // Handle follow action
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.followButtonGradient}
                >
                  <Ionicons name="person-add-outline" size={16} color="#fff" />
                  <Text style={styles.followButtonText}>Follow</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.premiumPostCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)']}
        style={styles.postGradient}
      >
        {/* Premium Post Header */}
        <View style={styles.premiumPostHeader}>
          <TouchableOpacity 
            style={styles.premiumAuthorSection} 
            onPress={() => {
              if (item.author?.id) {
                console.log('🔍 Navigating to user profile from post:', item.author.id);
                console.log('🔍 Author data:', item.author);
                
                try {
                  // Use expo-router for navigation (same as search results)
                  router.push({
                    pathname: '/(tabs)/user-profile',
                    params: { 
                      userId: item.author.id,
                      originalUserData: JSON.stringify(item.author)
                    }
                  });
                  console.log('✅ Navigation successful');
                } catch (error) {
                  console.error('❌ Navigation error:', error);
                  
                  // Fallback to navigation prop if available
                  if (navigation) {
                    try {
                      navigation.navigate('user-profile', { 
                        userId: item.author.id,
                        originalUserData: item.author 
                      });
                      console.log('✅ Fallback navigation successful');
                    } catch (fallbackError) {
                      console.error('❌ Fallback navigation error:', fallbackError);
                    }
                  }
                }
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.premiumAvatarContainer}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#A855F7']}
                style={styles.premiumAvatarRing}
              >
                <Image
                  source={item.author?.profilePhoto ? { uri: item.author.profilePhoto } : require('../assets/images/avatar1.jpg')}
                  style={styles.premiumAvatar}
                />
              </LinearGradient>
            </View>
            <View style={styles.premiumAuthorInfo}>
              <Text style={styles.premiumAuthorName}>{item.author?.name || 'Unknown'}</Text>
              <View style={styles.premiumTimeContainer}>
                <Ionicons name="time-outline" size={12} color="#6B7280" />
                <Text style={styles.premiumPostTime}>{timeAgo(item.createdAt)}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.premiumPostActions}>
            {item.isPrivate && (
              <View style={styles.premiumPrivacyIndicator}>
                <LinearGradient
                  colors={['#F59E0B', '#F97316']}
                  style={styles.privacyGradient}
                >
                  <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                </LinearGradient>
              </View>
            )}
            <View style={styles.premiumActionButtons}>
              <TouchableOpacity 
                style={styles.postActionButton}
                onPress={() => handleBlockUser(item.author.id, item.author.name)}
              >
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
                  style={styles.postActionButtonGradient}
                >
                  <Ionicons name="ban-outline" size={18} color="#EF4444" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.postActionButton}
                onPress={() => handleReportPost(item.id)}
              >
                <LinearGradient
                  colors={['rgba(107, 114, 128, 0.1)', 'rgba(107, 114, 128, 0.05)']}
                  style={styles.postActionButtonGradient}
                >
                  <Ionicons name="flag-outline" size={18} color="#6B7280" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Premium Post Content */}
        <View style={styles.premiumPostContent}>
          <Text style={styles.premiumPostText}>{item.content}</Text>
        </View>

      {/* Poll Options */}
      {item.postType === 'POLL' && item.pollOptions && item.pollOptions.length > 0 && (
        <View style={styles.pollContainer}>
          <Text style={styles.pollTitle}>Poll Options</Text>
          {item.pollOptions.map((option: string, index: number) => {
            // Calculate votes for this specific option
            const optionVotes = item.pollVotes?.filter((vote: any) => vote.optionIndex === index).length || 0;
            const totalVotes = item._count?.pollVotes || 0;
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.pollOption}
                onPress={() => handlePollVote(item.id, index)}
                activeOpacity={0.7}
              >
                <View style={styles.pollOptionContent}>
                  <Text style={styles.pollOptionText}>{option}</Text>
                  <View style={styles.pollVoteInfo}>
                    <Text style={styles.pollVoteCount}>
                      {optionVotes} votes ({percentage}%)
                    </Text>
                    <View style={styles.pollProgressBar}>
                      <View 
                        style={[
                          styles.pollProgressFill, 
                          { width: `${percentage}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Question Options */}
      {item.postType === 'QUESTION' && item.questionOptions && item.questionOptions.length > 0 && (
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>Question Options</Text>
          {item.questionOptions.map((option: string, index: number) => {
            // Calculate answers for this specific option
            const optionAnswers = item.questionAnswers?.filter((answer: any) => answer.optionIndex === index).length || 0;
            const totalAnswers = item._count?.questionAnswers || 0;
            const percentage = totalAnswers > 0 ? Math.round((optionAnswers / totalAnswers) * 100) : 0;
            
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.questionOption}
                onPress={() => handleQuestionAnswer(item.id, index)}
                activeOpacity={0.7}
              >
                <View style={styles.questionOptionContent}>
                  <Text style={styles.questionOptionText}>{option}</Text>
                  <View style={styles.questionAnswerInfo}>
                    <Text style={styles.questionAnswerCount}>
                      {optionAnswers} answers ({percentage}%)
                    </Text>
                    <View style={styles.questionProgressBar}>
                      <View 
                        style={[
                          styles.questionProgressFill, 
                          { width: `${percentage}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Instagram-Style Media */}
      {item.imageUrl && (
        <View style={styles.instagramMediaContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.instagramMediaImage} resizeMode="cover" />
        </View>
      )}

      {item.videoUrl && (
        <View style={styles.instagramVideoContainer}>
          <View style={styles.instagramVideoPlaceholder}>
            <Ionicons name="play-circle" size={48} color="#fff" />
          </View>
        </View>
      )}

      {/* Instagram-Style Hashtags */}
      {item.hashtags && item.hashtags.length > 0 && (
        <View style={styles.instagramHashtagsContainer}>
          {item.hashtags.map((tag: string) => (
            <Text key={tag} style={styles.instagramHashtagText}>#{tag}</Text>
          ))}
        </View>
      )}

      {/* Instagram-Style Action Bar */}
      <View style={styles.instagramActionsBar}>
        <View style={styles.instagramActionLeft}>
          <TouchableOpacity style={styles.instagramActionButton} onPress={() => handleLikePost(item.id)}>
            <Ionicons 
              name={item.isLiked ? 'heart' : 'heart-outline'} 
              size={28} 
              color={item.isLiked ? '#ed4956' : '#262626'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.instagramActionButton} onPress={() => openComments(item)}>
            <Ionicons name="chatbubble-outline" size={28} color="#262626" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.instagramActionButton}>
            <Ionicons name="paper-plane-outline" size={28} color="#262626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Instagram-Style Likes Count */}
      <View style={styles.instagramLikesContainer}>
        <Text style={styles.instagramLikesText}>
          <Text style={styles.instagramLikesBold}>{item._count?.likes || 0} likes</Text>
        </Text>
      </View>

        {/* Instagram-Style Comments Preview */}
        {item._count?.comments > 0 && (
          <View style={styles.instagramCommentsContainer}>
            <TouchableOpacity onPress={() => openComments(item)}>
              <Text style={styles.instagramViewCommentsText}>
                View all {item._count.comments} comments
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderStories = () => {
    return (
      <View style={styles.premiumStoriesContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)']}
          style={styles.premiumStoriesGradient}
        >
          <View style={styles.premiumStoriesHeader}>
            <Text style={styles.premiumStoriesTitle}>Stories</Text>
            <View style={styles.storiesIndicator}>
              <View style={styles.storiesDot} />
              <View style={styles.storiesDot} />
              <View style={styles.storiesDot} />
            </View>
          </View>
          
          <FlatList
            data={stories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.premiumStoriesList}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              return (
                <TouchableOpacity 
                  style={styles.premiumStoryItem} 
                  activeOpacity={0.8}
                  onPress={() => item.isAdd ? handleAddStory() : handleStoryPress(index)}
                >
                  <View style={styles.premiumStoryWrapper}>
                    <LinearGradient
                      colors={
                        item.isAdd 
                          ? ['#6366F1', '#8B5CF6', '#A855F7']
                          : item.hasStory && !item.viewed
                          ? ['#F59E0B', '#F97316', '#EA580C']
                          : ['#E5E7EB', '#D1D5DB', '#9CA3AF']
                      }
                      style={[
                        styles.premiumStoryRing,
                        item.isAdd && styles.premiumAddStoryRing,
                        item.hasStory && !item.viewed && styles.premiumUnviewedStoryRing,
                        item.hasStory && item.viewed && styles.premiumViewedStoryRing
                      ]}
                    >
                      <View style={styles.premiumStoryInner}>
                        {typeof item.image === 'string' ? (
                          <Image source={{ uri: item.image }} style={styles.premiumStoryImage} />
                        ) : (
                          <Image source={item.image} style={styles.premiumStoryImage} />
                        )}
                        {item.isAdd && (
                          <View style={styles.premiumAddStoryIcon}>
                            <LinearGradient
                              colors={['#FFFFFF', '#F8FAFC']}
                              style={styles.addIconGradient}
                            >
                              <Ionicons name="add" size={20} color="#6366F1" />
                            </LinearGradient>
                          </View>
                        )}
                        {item.hasStory && !item.viewed && (
                          <View style={styles.premiumStoryIndicator}>
                            <View style={styles.premiumStoryDot} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                    <View style={styles.premiumStoryInfo}>
                      <Text style={styles.premiumStoryUsername} numberOfLines={1}>
                        {item.username}
                      </Text>
                      {item.isAdd && (
                        <Text style={styles.premiumAddStoryText}>Add Story</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </LinearGradient>
      </View>
    );
  };

  const renderFollowRequests = () => (
    <Modal
      visible={showFollowRequests}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFollowRequests(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.followRequestsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Follow Requests</Text>
            <TouchableOpacity 
              onPress={() => setShowFollowRequests(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {followRequestsLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading...</Text>
            </View>
          ) : followRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending follow requests</Text>
            </View>
          ) : (
            <FlatList
              data={followRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.followRequestItem}>
                  <View style={styles.followRequestUser}>
                    <View style={styles.followRequestAvatar}>
                      {item.sender?.profilePhoto ? (
                        <Image 
                          source={{ uri: item.sender.profilePhoto }} 
                          style={styles.followRequestAvatarImage} 
                        />
                      ) : (
                        <View style={styles.followRequestAvatarPlaceholder}>
                          <Text style={styles.followRequestAvatarInitials}>
                            {item.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.followRequestInfo}>
                      <Text style={styles.followRequestName}>{item.sender?.name || 'Unknown User'}</Text>
                      <Text style={styles.followRequestEmail}>{item.sender?.email || ''}</Text>
                    </View>
                  </View>
                  <View style={styles.followRequestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptFollowRequest(item.id, item.senderId)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectFollowRequest(item.id)}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>

      {/* Enhanced Search Results */}
      {showSearchResults && (
        <View style={styles.enhancedSearchResultsContainer}>
          <LinearGradient
            colors={['#fff', '#f8f9fa']}
            style={styles.searchResultsGradient}
          >

            
            {searching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color="#667eea" />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
                                     ) : searchResults.length > 0 ? (
               <View>
                 
                 
                 
                 
                 
                 
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSearchResult}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.searchResultsList}
                  onLayout={() => console.log('🔍 FlatList onLayout called')}
                  onContentSizeChange={() => console.log('🔍 FlatList onContentSizeChange called')}
                />
               </View>
            ) : searchQuery.trim().length >= 2 ? (
              <View style={styles.noSearchResultsContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noSearchResultsText}>No results found</Text>
                <Text style={styles.noSearchResultsSubtext}>Try different keywords or check spelling</Text>
              </View>
            ) : searchQuery.trim().length === 0 ? (
              <View style={styles.noSearchResultsContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noSearchResultsText}>Start typing to search users</Text>
                <Text style={styles.noSearchResultsSubtext}>Search by name, email, or course</Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>
      )}

      {/* Enhanced Posts List */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        ListHeaderComponent={renderStories}
        renderItem={renderPost}
        ListEmptyComponent={
          <View style={styles.enhancedEmptyContainer}>
            <LinearGradient
              colors={['#fff', '#f8f9fa']}
              style={styles.emptyCard}
            >
              <View style={styles.enhancedEmptyIcon}>
                <Ionicons name="chatbubbles-outline" size={64} color="#667eea" />
              </View>
              <Text style={styles.enhancedEmptyTitle}>No posts yet</Text>
              <Text style={styles.enhancedEmptySubtitle}>Be the first to share something with your community</Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => setCreatePostModalVisible(true)}
              >
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createPostButtonGradient}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.createPostButtonText}>Create Your First Post</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Add Story Modal */}
      <AddStory
        visible={addStoryVisible}
        onClose={() => setAddStoryVisible(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer Modal */}
      <StoryViewer
        visible={storyViewerVisible}
        onClose={() => setStoryViewerVisible(false)}
        initialStoryIndex={0}
        stories={stories[selectedStoryIndex]?.stories || []}
      />

      {/* Instagram/Facebook Style Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeComments}
        statusBarTranslucent={true}
      >
        <View style={styles.instagramCommentModal}>
          {/* Instagram Style Header */}
          <View style={styles.instagramCommentHeader}>
            <TouchableOpacity onPress={closeComments} style={styles.instagramCloseButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.instagramCommentTitle}>Comments</Text>
            <View style={styles.instagramHeaderSpacer} />
          </View>
          
          {/* Comments List */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            style={styles.instagramCommentsList}
            contentContainerStyle={styles.instagramCommentsContent}
            renderItem={({ item }) => (
              <View style={styles.instagramCommentItem}>
                <View style={styles.instagramCommentAvatarContainer}>
                  <Image
                    source={item.user?.profilePhoto ? { uri: item.user.profilePhoto } : require('../assets/images/avatar1.jpg')}
                    style={styles.instagramCommentAvatar}
                  />
                </View>
                <View style={styles.instagramCommentContent}>
                  <View style={styles.instagramCommentItemHeader}>
                    <Text style={styles.instagramCommentAuthor}>{item.user?.name || 'Unknown'}</Text>
                    <Text style={styles.instagramCommentTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.instagramCommentText}>{item.content}</Text>
                  <View style={styles.instagramCommentActions}>
                    <TouchableOpacity style={styles.instagramCommentAction}>
                      <Text style={styles.instagramCommentActionText}>Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.instagramCommentAction}>
                      <Text style={styles.instagramCommentActionText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.instagramEmptyComments}>
                <Ionicons name="chatbubbles-outline" size={48} color="#999" />
                <Text style={styles.instagramEmptyCommentsText}>No comments yet</Text>
                <Text style={styles.instagramEmptyCommentsSubtext}>Be the first to comment!</Text>
              </View>
            }
          />
          
          {/* Instagram Style Input */}
          <View style={styles.instagramCommentInputContainer}>
            <View style={styles.instagramCommentInputWrapper}>
              <TextInput
                style={styles.instagramCommentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.instagramPostButton, !newComment.trim() && styles.instagramPostButtonDisabled]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || postingComment}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color="#0095F6" />
                ) : (
                  <Text style={[styles.instagramPostButtonText, !newComment.trim() && styles.instagramPostButtonTextDisabled]}>
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeReportModal}
      >
        <View style={styles.reportModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.reportModalContent}
          >
            <View style={styles.reportModalHeader}>
              <Text style={styles.reportModalTitle}>Report Post</Text>
              <TouchableOpacity onPress={closeReportModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reportForm}>
              <Text style={styles.reportLabel}>Reason for reporting:</Text>
              <View style={styles.reportReasonContainer}>
                <TouchableOpacity
                  style={[styles.reportReasonButton, reportReason === 'inappropriate' && styles.reportReasonButtonSelected]}
                  onPress={() => setReportReason('inappropriate')}
                >
                  <Text style={[styles.reportReasonText, reportReason === 'inappropriate' && styles.reportReasonTextSelected]}>
                    Inappropriate Content
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.reportReasonButton, reportReason === 'spam' && styles.reportReasonButtonSelected]}
                  onPress={() => setReportReason('spam')}
                >
                  <Text style={[styles.reportReasonText, reportReason === 'spam' && styles.reportReasonTextSelected]}>
                    Spam
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.reportReasonButton, reportReason === 'harassment' && styles.reportReasonButtonSelected]}
                  onPress={() => setReportReason('harassment')}
                >
                  <Text style={[styles.reportReasonText, reportReason === 'harassment' && styles.reportReasonTextSelected]}>
                    Harassment
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.reportReasonButton, reportReason === 'violence' && styles.reportReasonButtonSelected]}
                  onPress={() => setReportReason('violence')}
                >
                  <Text style={[styles.reportReasonText, reportReason === 'violence' && styles.reportReasonTextSelected]}>
                    Violence
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.reportReasonButton, reportReason === 'other' && styles.reportReasonButtonSelected]}
                  onPress={() => setReportReason('other')}
                >
                  <Text style={[styles.reportReasonText, reportReason === 'other' && styles.reportReasonTextSelected]}>
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.reportLabel}>Description (optional):</Text>
              <TextInput
                style={styles.reportDescriptionInput}
                placeholder="Please provide additional details..."
                value={reportDescription}
                onChangeText={setReportDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[styles.reportSubmitButton, (!reportReason || reporting) && styles.reportSubmitButtonDisabled]}
                onPress={handleSubmitReport}
                disabled={!reportReason || reporting}
              >
                {reporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.reportSubmitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Block User Modal */}
      <Modal
        visible={blockModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeBlockModal}
      >
        <View style={styles.blockModalOverlay}>
          <View style={styles.blockModalContent}>
            <View style={styles.blockModalHeader}>
              <Text style={styles.blockModalTitle}>Block User</Text>
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
                Are you sure you want to block {selectedUserName}?
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
                  onPress={handleSubmitBlock}
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

      {renderFollowRequests()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  // Instagram/Facebook Style Header
  instagramHeader: {
    paddingTop: 30,
    paddingBottom: 6,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSearchContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
  },
  compactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    flex: 1,
    minWidth: 200,
    maxWidth: 250,
  },
  compactSearchIcon: {
    marginRight: 6,
  },
  compactSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#262626',
    paddingVertical: 4,
    fontWeight: '400',
  },
  compactClearButton: {
    marginLeft: 4,
    padding: 2,
  },
  headerActionButton: {
    position: 'relative',
    marginLeft: 8,
    padding: 8,
  },
  headerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Instagram/Facebook Style Search
  instagramSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  searchBarContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  instagramSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#262626',
    paddingVertical: 0,
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 12,
  },
  // Instagram/Facebook Style Stories
  instagramStoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  storiesList: {
    flexDirection: 'row',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  storyWrapper: {
    alignItems: 'center',
  },
  storyRing: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    padding: 2.5,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addStoryRing: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
  },
  unviewedStoryRing: {
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOpacity: 0.3,
  },
  viewedStoryRing: {
    backgroundColor: '#e0e0e0',
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  addStoryIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  storyInfo: {
    alignItems: 'center',
  },
  storyUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 16,
  },
  addStoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#667eea',
    marginTop: 4,
    textAlign: 'center',
  },
  storyIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  storyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
  },
  // Instagram-style posts
  instagramPostCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  instagramPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  instagramAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#4F46E5',
    padding: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  instagramAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  instagramAuthorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  instagramPostLocation: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  // Instagram-style post content
  instagramPostContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  instagramMediaContainer: {
    width: '100%',
    height: 400,
  },
  instagramMediaImage: {
    width: '100%',
    height: '100%',
  },
  instagramVideoContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramVideoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramHashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  instagramHashtagText: {
    color: '#00376b',
    fontSize: 14,
    marginRight: 8,
  },
  instagramActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instagramActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instagramActionButton: {
    marginRight: 16,
    padding: 4,
  },
  instagramBookmarkButton: {
    padding: 4,
  },
  instagramLikesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  instagramLikesText: {
    fontSize: 14,
    color: '#262626',
  },
  instagramLikesBold: {
    fontWeight: '600',
  },
  instagramCommentsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  instagramCommentsText: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 18,
  },
  instagramCommentsBold: {
    fontWeight: '600',
  },
  instagramViewCommentsText: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIndicator: {
    marginRight: 8,
  },
  privacyIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  mediaContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  hashtagChip: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  hashtagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  statIcon: {
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  postActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  shareButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  noCommentsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 70, 229, 0.1)',
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 15,
    color: '#374151',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postCommentButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  postCommentButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  postCommentButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  storiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
   searchResultsContainer: {
     position: 'absolute',
     top: 70,
     left: 16,
     right: 16,
     backgroundColor: '#FFFFFF',
     borderRadius: 16,
     padding: 15,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 6 },
     shadowOpacity: 0.2,
     shadowRadius: 12,
     elevation: 8,
     zIndex: 9999,
     maxHeight: 400,
     borderWidth: 1,
     borderColor: 'rgba(139, 92, 246, 0.1)',
   },
   searchResultsList: {
     maxHeight: 300,
   },
   searchLoading: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 20,
   },
   searchLoadingText: {
     marginLeft: 8,
     color: '#8B5CF6',
     fontSize: 14,
     fontWeight: '500',
   },
   searchResultItem: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 12,
     paddingHorizontal: 15,
     borderRadius: 12,
     marginBottom: 8,
     backgroundColor: '#F8FAFC',
     borderWidth: 1,
     borderColor: 'rgba(139, 92, 246, 0.08)',
   },
   searchResultAvatar: {
     width: 44,
     height: 44,
     borderRadius: 22,
     marginRight: 15,
     backgroundColor: '#E0E7FF',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(139, 92, 246, 0.1)',
   },
   searchResultAvatarImage: {
     width: 40,
     height: 40,
     borderRadius: 20,
   },
   searchResultAvatarPlaceholder: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: '#E0E7FF',
     justifyContent: 'center',
     alignItems: 'center',
   },
   searchResultAvatarInitials: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#4F46E5',
   },
   searchResultInfo: {
     flex: 1,
   },
   searchResultName: {
     fontSize: 16,
     fontWeight: '600',
     color: '#1F2937',
     marginBottom: 4,
   },
   searchResultEmail: {
     fontSize: 13,
     color: '#6B7280',
     marginBottom: 4,
   },
   searchResultCourse: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   searchResultCourseText: {
     fontSize: 12,
     color: '#6B7280',
     marginLeft: 6,
     fontWeight: '500',
   },
   searchResultActions: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   followingBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#ECFDF5',
     borderRadius: 16,
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderWidth: 1,
     borderColor: 'rgba(16, 185, 129, 0.2)',
   },
   followingBadgeText: {
     fontSize: 12,
     color: '#10B981',
     fontWeight: '600',
     marginLeft: 6,
   },
   followButtonSmall: {
     padding: 8,
     backgroundColor: '#F3F4F6',
     borderRadius: 16,
     borderWidth: 1,
     borderColor: 'rgba(139, 92, 246, 0.2)',
   },
   // Enhanced Search Result Styles
   enhancedSearchResultItem: {
     marginBottom: 8,
     marginHorizontal: 12,
     borderRadius: 12,
     overflow: 'hidden',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.08,
     shadowRadius: 4,
     elevation: 2,
     borderWidth: 1,
     borderColor: 'rgba(102, 126, 234, 0.06)',
   },
   searchResultGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 12,
     backgroundColor: 'transparent',
   },
   enhancedSearchAvatar: {
     position: 'relative',
     marginRight: 12,
   },
   enhancedAvatarImage: {
     width: 40,
     height: 40,
     borderRadius: 20,
     borderWidth: 2,
     borderColor: 'rgba(102, 126, 234, 0.2)',
   },
   enhancedAvatarPlaceholder: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   enhancedAvatarInitials: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#fff',
   },
   onlineStatusIndicator: {
     position: 'absolute',
     bottom: 2,
     right: 2,
     width: 14,
     height: 14,
     borderRadius: 7,
     backgroundColor: '#10B981',
     borderWidth: 2,
     borderColor: '#fff',
   },
   enhancedSearchInfo: {
     flex: 1,
     paddingRight: 12,
   },
   userNameContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 4,
   },
   enhancedSearchName: {
     fontSize: 14,
     fontWeight: '600',
     color: '#1F2937',
     marginRight: 6,
   },
   verifiedBadge: {
     marginLeft: 4,
   },
   enhancedSearchEmail: {
     fontSize: 12,
     color: '#6B7280',
     marginBottom: 4,
   },
   enhancedCourseContainer: {
     marginTop: 2,
   },
   courseTagGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 6,
     paddingVertical: 3,
     borderRadius: 8,
     alignSelf: 'flex-start',
   },
   enhancedCourseText: {
     fontSize: 11,
     color: '#6B7280',
     fontWeight: '500',
     marginLeft: 3,
   },
   enhancedSearchActions: {
     alignItems: 'center',
   },
   enhancedFollowingBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 16,
   },
   enhancedFollowingText: {
     fontSize: 11,
     fontWeight: '600',
     color: '#fff',
     marginLeft: 3,
   },
   enhancedFollowButton: {
     borderRadius: 16,
     overflow: 'hidden',
   },
  followButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
   noSearchResults: {
     alignItems: 'center',
     padding: 30,
   },
   noSearchResultsText: {
     fontSize: 16,
     color: '#6B7280',
     marginTop: 12,
     fontWeight: '500',
   },
   noSearchResultsSubtext: {
     fontSize: 14,
     color: '#9CA3AF',
     marginTop: 6,
     textAlign: 'center',
   },
  followRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  followRequestsButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followRequestsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
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
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  followRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  followRequestUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  followRequestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  followRequestAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  followRequestAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followRequestAvatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followRequestInfo: {
    flex: 1,
  },
  followRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  followRequestEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  followRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedHeader: {
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  followRequestsBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  followRequestsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  enhancedSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBarGradient: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    paddingVertical: 0,
  },
  enhancedSearchResultsContainer: {
    position: 'absolute',
    top: 100, // Adjust based on header height
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9998,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  searchResultsGradient: {
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noSearchResultsContainer: {
    alignItems: 'center',
    padding: 30,
  },
  enhancedEmptyContainer: {
    paddingVertical: 60,
  },
  enhancedEmptyIcon: {
    marginBottom: 16,
  },
  enhancedEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  enhancedEmptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createPostButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Additional missing styles
  authorCourse: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  videoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  likedText: {
    color: '#ff6b6b',
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 4,
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  commentsList: {
    padding: 16,
    maxHeight: 500,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 70, 229, 0.1)',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
   // Enhanced Stories Styles
   enhancedStoriesContainer: {
     marginHorizontal: 16,
     marginVertical: 12,
     borderRadius: 20,
     overflow: 'hidden',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.1,
     shadowRadius: 12,
     elevation: 8,
   },
   storiesGradient: {
     padding: 20,
   },
   enhancedStoriesHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 16,
   },
   storiesTitleContainer: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   enhancedStoriesTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: '#1F2937',
     marginLeft: 8,
   },
   enhancedViewAllButton: {
     borderRadius: 20,
     overflow: 'hidden',
   },
   viewAllButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 8,
   },
   enhancedViewAllText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#fff',
     marginRight: 4,
   },
   enhancedStoriesList: {
     paddingHorizontal: 4,
   },
   enhancedStoryItem: {
     alignItems: 'center',
     marginRight: 16,
   },
   enhancedStoryWrapper: {
     alignItems: 'center',
   },
   enhancedStoryRing: {
     width: 70,
     height: 70,
     borderRadius: 35,
     padding: 3,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.15,
     shadowRadius: 8,
     elevation: 6,
   },
   enhancedStoryImage: {
     width: 64,
     height: 64,
     borderRadius: 32,
   },
   enhancedAddStoryIcon: {
     position: 'absolute',
     bottom: 4,
     right: 4,
     width: 24,
     height: 24,
     borderRadius: 12,
     backgroundColor: '#667eea',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: '#fff',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 4,
   },
   enhancedStoryIndicator: {
     position: 'absolute',
     top: 4,
     right: 4,
     width: 18,
     height: 18,
     borderRadius: 9,
     backgroundColor: '#fff',
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 4,
   },
   enhancedStoryDot: {
     width: 10,
     height: 10,
     borderRadius: 5,
     backgroundColor: '#ff6b6b',
   },
   enhancedStoryInfo: {
     alignItems: 'center',
   },
   enhancedStoryUsername: {
     fontSize: 13,
     fontWeight: '600',
     color: '#1F2937',
     textAlign: 'center',
     lineHeight: 16,
   },
  enhancedAddStoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#667eea',
    marginTop: 4,
    textAlign: 'center',
  },
  // Poll and Question Styles
  pollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C4A6E',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  pollOption: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollOptionText: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
  },
  pollVoteCount: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  questionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  questionOption: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  questionOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionOptionText: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
  },
  questionAnswerCount: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  pollVoteInfo: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  pollProgressBar: {
    width: 80,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  pollProgressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  questionAnswerInfo: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  questionProgressBar: {
    width: 80,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  questionProgressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 2,
  },

  // Report Modal Styles
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reportModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reportForm: {
    gap: 16,
  },
  reportLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  reportReasonContainer: {
    gap: 8,
  },
  reportReasonButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  reportReasonButtonSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  reportReasonText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  reportReasonTextSelected: {
    color: '#92400E',
    fontWeight: '600',
  },
  reportDescriptionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
  },
  reportSubmitButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  reportSubmitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  reportSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
  loadingFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },

  // Action Buttons Styles (duplicate removed)

  // Block Modal Styles
  blockModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  blockModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  blockModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
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

  // Premium Header Styles
  premiumHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  premiumSearchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  premiumSearchIcon: {
    marginRight: 10,
  },
  premiumSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  premiumClearButton: {
    marginLeft: 8,
  },
  premiumTitleContainer: {
    alignItems: 'center',
    flex: 0,
  },
  premiumHeaderTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  premiumHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  premiumActionButton: {
    marginLeft: 8,
    position: 'relative',
  },
  headerActionButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Premium Stories Styles
  premiumStoriesContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  premiumStoriesGradient: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  premiumStoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  premiumStoriesTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  storiesIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  storiesDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  premiumStoriesList: {
    paddingLeft: 4,
  },
  premiumStoryItem: {
    marginRight: 16,
  },
  premiumStoryWrapper: {
    alignItems: 'center',
  },
  premiumStoryRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumAddStoryRing: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  premiumUnviewedStoryRing: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  premiumViewedStoryRing: {
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumStoryInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumStoryImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  premiumAddStoryIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  addIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  premiumStoryIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  premiumStoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  premiumStoryInfo: {
    alignItems: 'center',
  },
  premiumStoryUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    maxWidth: 80,
  },
  premiumAddStoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6366F1',
    marginTop: 2,
  },

  // Premium Post Card Styles
  premiumPostCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  postGradient: {
    padding: 20,
  },
  premiumPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  premiumAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumAvatarContainer: {
    marginRight: 12,
  },
  premiumAvatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  premiumAuthorInfo: {
    flex: 1,
  },
  premiumAuthorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  premiumTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumPostTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  premiumPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumPrivacyIndicator: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  privacyGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumActionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  postActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  premiumPostContent: {
    marginBottom: 16,
  },
  premiumPostText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  postActionButtonGradient: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Instagram/Facebook Style Comment Modal
  instagramCommentModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  instagramCommentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
    backgroundColor: '#FFFFFF',
  },
  instagramCloseButton: {
    padding: 8,
  },
  instagramCommentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  instagramHeaderSpacer: {
    width: 40,
  },
  instagramCommentsList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  instagramCommentsContent: {
    paddingVertical: 16,
  },
  instagramCommentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  instagramCommentAvatarContainer: {
    marginRight: 12,
  },
  instagramCommentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  instagramCommentContent: {
    flex: 1,
  },
  instagramCommentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  instagramCommentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  instagramCommentTime: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  instagramCommentText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 8,
  },
  instagramCommentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  instagramCommentAction: {
    paddingVertical: 4,
  },
  instagramCommentActionText: {
    fontSize: 12,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  instagramEmptyComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  instagramEmptyCommentsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  instagramEmptyCommentsSubtext: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  instagramCommentInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DBDBDB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  instagramCommentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  instagramCommentInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
    paddingVertical: 4,
  },
  instagramPostButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  instagramPostButtonDisabled: {
    opacity: 0.5,
  },
  instagramPostButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0095F6',
  },
  instagramPostButtonTextDisabled: {
    color: '#8E8E8E',
  },

});