import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiFetchAuth, getImageUrl } from '../constants/api';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string;
  createdAt: string;
  expiresAt: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    profilePhoto: string | null;
  };
  isLiked?: boolean;
  likeCount?: number;
}

interface StoryViewerProps {
  visible: boolean;
  onClose: () => void;
  initialStoryIndex?: number;
  stories?: Story[];
}

export default function StoryViewer({ visible, onClose, initialStoryIndex = 0, stories: propStories = [] }: StoryViewerProps) {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>(propStories);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likingStory, setLikingStory] = useState(false);
  
  const progressAnimations = useRef<Animated.Value[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && propStories.length > 0) {
      setStories(propStories);
      setCurrentStoryIndex(initialStoryIndex);
      // Initialize progress animations for each story
      progressAnimations.current = propStories.map(() => new Animated.Value(0));
    } else if (visible && propStories.length === 0) {
      // Handle case where no stories are provided
      setError('No stories available');
      setStories([]);
    }
  }, [visible, propStories, initialStoryIndex]);

  useEffect(() => {
    if (stories.length > 0 && visible) {
      startStoryProgress();
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentStoryIndex, stories, visible]);

  const startStoryProgress = () => {
    if (currentStoryIndex >= stories.length) {
      onClose();
      return;
    }

    // Reset all progress bars
    progressAnimations.current.forEach((anim, index) => {
      if (index < currentStoryIndex) {
        anim.setValue(1); // Completed stories
      } else if (index === currentStoryIndex) {
        anim.setValue(0); // Current story starts at 0
      } else {
        anim.setValue(0); // Future stories
      }
    });

    // Animate current story progress
    Animated.timing(progressAnimations.current[currentStoryIndex], {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start();

    // Auto-advance to next story
    timerRef.current = setTimeout(() => {
      if (currentStoryIndex < stories.length - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1);
      } else {
        onClose();
      }
    }, STORY_DURATION);
  };

  const handleStoryPress = (direction: 'next' | 'prev') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (direction === 'next') {
      if (currentStoryIndex < stories.length - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1);
      } else {
        onClose();
      }
    } else {
      if (currentStoryIndex > 0) {
        setCurrentStoryIndex(currentStoryIndex - 1);
      }
    }
  };

  const handleLikeStory = async () => {
    if (!currentStory || likingStory) return;
    
    setLikingStory(true);
    try {
      const response = await apiFetchAuth(`/student/stories/${currentStory.id}/like`, user?.token || '', {
        method: 'POST',
      });

      if (response.ok) {
        // Update the story's like status
        setStories(prevStories => 
          prevStories.map((story, index) => {
            if (index === currentStoryIndex) {
              return {
                ...story,
                isLiked: !story.isLiked,
                likeCount: story.isLiked ? (story.likeCount || 1) - 1 : (story.likeCount || 0) + 1
              };
            }
            return story;
          })
        );
      }
    } catch (error) {
      console.error('Error liking story:', error);
    } finally {
      setLikingStory(false);
    }
  };

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onClose();
  };

  const currentStory = stories[currentStoryIndex];

  if (!visible) return null;

  // Safety check for current story
  if (!currentStory && stories.length > 0) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Story not found</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
              <Text style={styles.retryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Validate current story has required properties
  if (currentStory && (!currentStory.author || !currentStory.mediaUrl)) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Invalid story data</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
              <Text style={styles.retryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading stories...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setStories(propStories)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : stories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stories available</Text>
          </View>
        ) : currentStory ? (
          <>
            {/* Progress Bars */}
            <View style={styles.progressContainer}>
              {stories.map((_, index) => (
                <View key={index} style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnimations.current[index]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }) || '0%',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.userInfo}>
                <Image
                  source={
                    currentStory.author.profilePhoto
                      ? { uri: getImageUrl(currentStory.author.profilePhoto) }
                      : require('../assets/images/avatar1.jpg')
                  }
                  style={styles.userAvatar}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{currentStory.author.name}</Text>
                  <Text style={styles.storyTime}>
                    {new Date(currentStory.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Story Content */}
            <View style={styles.storyContent}>
              <Image 
                source={{ uri: getImageUrl(currentStory.mediaUrl) }} 
                style={styles.storyImage} 
              />
              {currentStory.caption && (
                <View style={styles.captionContainer}>
                  <Text style={styles.captionText}>{currentStory.caption}</Text>
                </View>
              )}
            </View>

            {/* Like Button */}
            <TouchableOpacity
              style={styles.likeButton}
              onPress={handleLikeStory}
              disabled={likingStory}
            >
              <Ionicons 
                name={currentStory.isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={currentStory.isLiked ? "#ff6b6b" : "#fff"} 
              />
              {currentStory.likeCount && currentStory.likeCount > 0 && (
                <Text style={styles.likeCount}>{currentStory.likeCount}</Text>
              )}
            </TouchableOpacity>

            {/* Navigation Buttons */}
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => handleStoryPress('prev')}
              activeOpacity={0.7}
            />
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={() => handleStoryPress('next')}
              activeOpacity={0.7}
            />

            {/* Story Counter */}
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {currentStoryIndex + 1} / {stories.length}
              </Text>
            </View>
          </>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 20,
    gap: 5,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  storyTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: width,
    height: height * 0.7,
    resizeMode: 'contain',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 10,
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  navButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.3,
  },
  prevButton: {
    left: 0,
  },
  nextButton: {
    right: 0,
  },
  counterContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  counterText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  likeButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  likeCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
}); 