import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudyPartner } from '@/context/StudyPartnerContext';

type TabKey = 'home' | 'discover' | 'likes' | 'chats' | 'explore' | 'profile';

const TABS: {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[] = [
  // "Home" should go to the app's main Home tab
  { key: 'home', label: 'Home', icon: 'home', route: '/(tabs)/home' },
  {
    key: 'discover',
    label: 'Discover',
    icon: 'sparkles',
    route: '/(tabs)/study-partner-discover',
  },
  {
    key: 'likes',
    label: 'Likes',
    icon: 'heart',
    route: '/(tabs)/study-partner-who-liked-you',
  },
  {
    key: 'chats',
    label: 'Chats',
    icon: 'chatbubbles',
    route: '/(tabs)/messages',
  },
  {
    key: 'explore',
    label: 'Explore',
    icon: 'compass',
    // Keep an entry-point back into Study Partner hub
    route: '/(tabs)/study-partner',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'person',
    route: '/(tabs)/study-partner-profile',
  },
];

export default function StudyPartnerBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { likesCount } = useStudyPartner();

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map(tab => {
        const isActive = pathname?.startsWith(tab.route);
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            activeOpacity={0.8}
            onPress={() => handlePress(tab.route)}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive && styles.iconWrapperActive,
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? '#ffffff' : '#6B7280'}
              />
              {tab.key === 'likes' && likesCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {likesCount > 99 ? '99+' : likesCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: '#4F46E5',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#FBBF24',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#1F2937',
    fontSize: 10,
    fontWeight: '800',
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    color: '#6B7280',
  },
  labelActive: {
    color: '#111827',
    fontWeight: '600',
  },
});

