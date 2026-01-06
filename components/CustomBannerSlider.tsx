import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface Banner {
  id: string;
  image: any;
  action: string;
}

interface CustomBannerSliderProps {
  onBannerPress?: (banner: Banner) => void;
}

const CustomBannerSlider: React.FC<CustomBannerSliderProps> = ({ onBannerPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Banner>>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Your custom banner data with your images
  const banners: Banner[] = [
    {
      id: '1',
      image: require('../assets/images/webslide1.png'),
      action: 'practice-exam'
    },
    {
      id: '2', 
      image: require('../assets/images/webslide3.png'),
      action: 'exam'
    },
    {
      id: '3',
      image: require('../assets/images/webslide4.png'),
      action: 'profile'
    }
  ];

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        
        // Enhanced transition animations
        Animated.parallel([
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.6,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 0.95,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start();

        // Scroll to next item
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        
        return nextIndex;
      });
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [fadeAnim, scaleAnim]);

  const renderBanner = ({ item }: { item: Banner }) => (
    <TouchableOpacity
      style={styles.bannerContainer}
      onPress={() => onBannerPress?.(item)}
      activeOpacity={0.95}
    >
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <View style={styles.bannerWrapper}>
          <Image 
            source={item.image} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {banners.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={styles.paginationWrapper}
          onPress={() => {
            setCurrentIndex(index);
            flatListRef.current?.scrollToIndex({ index, animated: true });
          }}
        >
          {index === currentIndex ? (
            <LinearGradient
              colors={['#6366F1', '#8B5CF6', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.paginationDot, styles.activeDot]}
            >
              <View style={styles.activeDotInner} />
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.paginationDot,
                styles.inactiveDot,
              ]}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -10,
    marginBottom: 15,
  },
  bannerContainer: {
    width: screenWidth,
    paddingHorizontal: 16,
  },
  bannerWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 160,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationWrapper: {
    padding: 8,
  },
  paginationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.3 }],
  },
  inactiveDot: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default CustomBannerSlider;
