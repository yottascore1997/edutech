import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.55;
const CARD_SPACING = 12;

/** Success story item – matches API response (admin adds these from backend). */
export interface SuccessStory {
  id: string;
  studentName: string;
  achievement: string;
  videoThumbnail: string;
  duration: string;
  followers: number;
  brandLogo?: string;
  brandName?: string;
  description?: string;
  /** Video URL from admin – used when user taps to play. */
  videoUrl?: string;
}

/** Get YouTube thumbnail URL from video/shorts URL. */
function getYouTubeThumbnail(url: string): string {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  const videoId = match?.[1];
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/** Map API response to SuccessStory. Supports both old shape and new (title, mediaUrl, mediaType). */
function mapApiItemToStory(raw: any): SuccessStory {
  const mediaUrl = raw.mediaUrl ?? raw.media_url ?? raw.videoUrl ?? raw.video_url ?? '';
  const mediaType = (raw.mediaType ?? raw.media_type ?? '').toUpperCase();
  const title = raw.title ?? raw.studentName ?? raw.student_name ?? '';
  const thumbnail = raw.videoThumbnail ?? raw.video_thumbnail ?? '';
  const thumbUri = thumbnail && !thumbnail.startsWith('http')
    ? getImageUrl(thumbnail)
    : thumbnail;
  const thumbnailFinal =
    thumbUri ||
    (mediaType === 'YOUTUBE' && mediaUrl ? getYouTubeThumbnail(mediaUrl) : '') ||
    'https://via.placeholder.com/300x400/7C3AED/FFFFFF?text=Story';
  return {
    id: String(raw.id ?? raw._id ?? ''),
    studentName: title,
    achievement: raw.achievement ?? '',
    videoThumbnail: thumbnailFinal,
    duration: raw.duration ?? '0:00',
    followers: Number(raw.followers ?? 0),
    brandLogo: raw.brandLogo ?? raw.brand_logo,
    brandName: raw.brandName ?? raw.brand_name,
    description: raw.description,
    videoUrl: mediaUrl || undefined,
  };
}

const defaultStories: SuccessStory[] = [
  {
    id: '1',
    studentName: 'Priya Sharma',
    achievement: 'AIR 2973 | NEET 2024',
    videoThumbnail: 'https://via.placeholder.com/300x400/7C3AED/FFFFFF?text=Success+Story+1',
    duration: '00:45',
    followers: 1250,
    brandName: 'MySilkLove',
    description: 'After joining this platform, I cracked my dream exam and discovered my true potential!'
  },
  {
    id: '2',
    studentName: 'Rahul Kumar',
    achievement: 'NEET Score: 575',
    videoThumbnail: 'https://via.placeholder.com/300x400/EC4899/FFFFFF?text=Success+Story+2',
    duration: '01:20',
    followers: 890,
    brandName: 'KaizenTex',
    description: 'The practice tests and mock exams were exactly what I needed to boost my confidence!'
  },
  {
    id: '3',
    studentName: 'Sneha Patel',
    achievement: '98.4% CBSE XII',
    videoThumbnail: 'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Success+Story+3',
    duration: '00:58',
    followers: 2100,
    brandName: 'MySilkLove',
    description: 'I had an amazing experience. All my concepts were crystal clear!'
  },
  {
    id: '4',
    studentName: 'Amit Singh',
    achievement: '98.2% CBSE XII',
    videoThumbnail: 'https://via.placeholder.com/300x400/F59E0B/FFFFFF?text=Success+Story+4',
    duration: '01:15',
    followers: 650,
    brandName: 'KaizenTex',
    description: 'The LIVE Interactive classes helped me learn and retain everything perfectly!'
  },
];

const SUCCESS_STORIES_ENDPOINT = '/student/success-stories';

export default function StudentSuccessStories() {
  const router = useRouter();
  const { user } = useAuth();
  const [stories, setStories] = useState<SuccessStory[]>(defaultStories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      setStories(defaultStories);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetchAuth(SUCCESS_STORIES_ENDPOINT, user.token);
      if (res.ok && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.list ?? [];
        const mapped = list.map(mapApiItemToStory).filter((s) => s.id);
        if (mapped.length > 0) setStories(mapped);
      }
    } catch (e) {
      console.warn('Success stories API not available, using defaults:', e);
      setError(null);
      setStories(defaultStories);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleVideoPress = (story: SuccessStory) => {
    router.push({
      pathname: '/success-story/[id]',
      params: {
        id: story.id,
        videoUrl: story.videoUrl ?? '',
        studentName: story.studentName,
        achievement: story.achievement,
        description: story.description ?? '',
      },
    });
  };

  const renderVideoCard = ({ item, index }: { item: SuccessStory; index: number }) => {
    return (
      <TouchableOpacity
        style={[
          styles.videoCard,
          index === 0 && { marginLeft: 20 },
          index === stories.length - 1 && { marginRight: 20 }
        ]}
        onPress={() => handleVideoPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.videoContainer}>
          {/* Video Thumbnail */}
          <Image
            source={{ uri: item.videoThumbnail }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
          
          {/* Play Button Overlay */}
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={32} color="#FFFFFF" />
            </View>
          </View>

          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>

          {/* Brand Logo (if available) */}
          {item.brandName && (
            <View style={styles.brandLogoContainer}>
              <View style={styles.brandLogoCircle}>
                <Ionicons name="logo-google" size={16} color="#FFFFFF" />
              </View>
            </View>
          )}

          {/* Description Overlay (if available) */}
          {item.description && (
            <View style={styles.descriptionOverlay}>
              <Text style={styles.descriptionText} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}
        </View>

        {/* Student Info Section */}
        <View style={styles.studentInfoContainer}>
          <View style={styles.studentInfoLeft}>
            {item.brandName && (
              <View style={styles.brandNameContainer}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.brandNameText}>{item.brandName}</Text>
              </View>
            )}
            <Text style={styles.followersText}>{item.followers} followers</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Image
              source={require('../assets/images/icons/instagram-stories.png')}
              style={styles.headerStoriesIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Stories that</Text>
            <Text style={styles.headerTitleUnderlined}>inspire</Text>
          </View>
        </View>
        <View style={styles.headerStats}>
          {loading ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Text style={styles.headerStatsText}>{stories.length}+ Success Stories</Text>
          )}
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Video Cards Horizontal Scroll */}
      <FlatList
        data={stories}
        renderItem={renderVideoCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    marginRight: 12,
  },
  headerStoriesIcon: {
    width: 50,
    height: 50,
  },
  headerIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  headerTitleUnderlined: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
    textDecorationColor: '#F97316',
    textDecorationStyle: 'solid',
  },
  headerStats: {
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  headerStatsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
    letterSpacing: 0.3,
  },
  errorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  listContent: {
    paddingRight: 20,
  },
  videoCard: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  videoContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  durationBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brandLogoContainer: {
    position: 'absolute',
    bottom: 60,
    left: 15,
  },
  brandLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  descriptionOverlay: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  studentInfoContainer: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  studentInfoLeft: {
    flex: 1,
  },
  brandNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 4,
  },
  followersText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
