import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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

interface SuccessStory {
  id: string;
  studentName: string;
  achievement: string;
  videoThumbnail: string;
  duration: string;
  followers: number;
  brandLogo?: string;
  brandName?: string;
  description?: string;
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

export default function StudentSuccessStories() {
  const router = useRouter();
  const [stories] = useState<SuccessStory[]>(defaultStories);

  const handleVideoPress = (story: SuccessStory) => {
    // Navigate to video detail page or play video
    console.log('Playing video:', story.id);
    // router.push(`/success-story/${story.id}`);
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
            <LinearGradient
              colors={['#F97316', '#EA580C', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIconGradient}
            >
              <Ionicons name="star" size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Stories that</Text>
            <Text style={styles.headerTitleUnderlined}>inspire</Text>
          </View>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>500+ Success Stories</Text>
        </View>
      </View>

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
