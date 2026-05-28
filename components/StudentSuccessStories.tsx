import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FontFamily } from '@/constants/Typography';
import { HomeTheme } from '@/constants/HomeTheme';
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
const CARD_WIDTH = screenWidth * 0.48;
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
          index === 0 && { marginLeft: 16 },
          index === stories.length - 1 && { marginRight: 16 },
        ]}
        onPress={() => handleVideoPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardShell}>
          <View style={styles.videoContainer}>
            <Image source={{ uri: item.videoThumbnail }} style={styles.videoThumbnail} resizeMode="cover" />
            <View style={styles.playButtonOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={22} color={HomeTheme.primary} />
              </View>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.storyTitle} numberOfLines={2}>
              {item.description || item.achievement || 'Success Story'}
            </Text>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.studentName}
            </Text>
            <Text style={styles.achievement} numberOfLines={1}>
              {item.achievement}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Stories that <Text style={styles.headerAccent}>inspire</Text>
        </Text>
        {loading && <ActivityIndicator size="small" color={HomeTheme.primary} />}
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
    marginTop: 12,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: HomeTheme.ink,
  },
  headerAccent: {
    fontFamily: FontFamily.bold,
    color: HomeTheme.primary,
    textDecorationLine: 'underline',
    textDecorationColor: HomeTheme.primary,
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
    paddingRight: 16,
  },
  videoCard: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  cardShell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HomeTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  videoContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.95,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  durationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  durationText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  storyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: HomeTheme.ink,
    lineHeight: 16,
    marginBottom: 4,
  },
  studentName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: HomeTheme.primary,
    marginBottom: 2,
  },
  achievement: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: HomeTheme.inkMuted,
  },
});
