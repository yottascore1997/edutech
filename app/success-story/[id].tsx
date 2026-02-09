import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: screenWidth } = Dimensions.get('window');
const VIDEO_HEIGHT = (screenWidth * 9) / 16;

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url || '');
}

function getYouTubeVideoId(url: string): string | null {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
}

export default function SuccessStoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    videoUrl?: string;
    studentName?: string;
    achievement?: string;
    description?: string;
  }>();

  const videoRef = useRef<Video>(null);
  const [videoError, setVideoError] = useState(false);

  const { videoUrl, studentName, achievement, description } = params;
  const isYouTube = isYouTubeUrl(videoUrl || '');
  const youtubeVideoId = getYouTubeVideoId(videoUrl || '');

  const openYouTube = () => {
    if (videoUrl) Linking.openURL(videoUrl);
  };

  const youtubeEmbedHtml = youtubeVideoId
    ? `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"></head><body style="margin:0;background:#000;"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${youtubeVideoId}?playsinline=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></body></html>`
    : '';

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Success Story
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video section - YouTube plays in-app via WebView */}
        <View style={[styles.videoSection, { height: VIDEO_HEIGHT }]}>
          {videoUrl && isYouTube && youtubeVideoId ? (
            <WebView
              source={{ html: youtubeEmbedHtml }}
              style={styles.webView}
              scrollEnabled={false}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              originWhitelist={['*']}
              allowsFullscreenVideo
            />
          ) : videoUrl && !videoError ? (
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: videoUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              onError={() => setVideoError(true)}
            />
          ) : videoUrl && videoError ? (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-off" size={48} color="#9CA3AF" />
              <Text style={styles.videoPlaceholderText}>Video could not be loaded</Text>
              {videoUrl && isYouTube ? (
                <TouchableOpacity onPress={openYouTube} style={styles.openLinkButton}>
                  <Text style={styles.openLinkButtonText}>Open in YouTube app</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-outline" size={48} color="#9CA3AF" />
              <Text style={styles.videoPlaceholderText}>No video added yet</Text>
              <Text style={styles.videoPlaceholderSubtext}>
                Admin can add video URL for this story
              </Text>
            </View>
          )}
        </View>

        {/* Story info */}
        <View style={styles.infoSection}>
          {studentName ? (
            <Text style={styles.studentName}>{studentName}</Text>
          ) : null}
          {achievement ? (
            <Text style={styles.achievement}>{achievement}</Text>
          ) : null}
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  videoSection: {
    width: screenWidth,
    backgroundColor: '#000',
    marginTop: 16,
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  videoPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  videoPlaceholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  openLinkButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F97316',
    borderRadius: 10,
  },
  openLinkButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievement: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});
