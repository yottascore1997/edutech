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
          <View
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentIndex ? '#4F46E5' : 'rgba(79, 70, 229, 0.3)',
                transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
                shadowOpacity: index === currentIndex ? 0.4 : 0,
              }
            ]}
          >
            {index === currentIndex && (
              <View style={styles.activeDotInner} />
            )}
          </View>
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
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
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default CustomBannerSlider;
