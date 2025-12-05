import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

const medalColors = [
  '#FFD700', // Gold
  '#C0C0C0', // Silver
  '#CD7F32', // Bronze
];

const podiumHeights = [140, 110, 90];

const defaultAvatars = [
  require('../assets/images/avatar1.jpg'),
  require('../assets/images/avatar2.jpg'),
  require('../assets/images/avatar3.jpg'),
];

interface LeaderboardUser {
  name: string;
  points: number;
  subtitle?: string;
  avatar?: any;
  rank: number;
}

interface LeaderboardPodiumProps {
  data: LeaderboardUser[];
}

export default function LeaderboardPodium({ data }: LeaderboardPodiumProps) {
  // data: array of { name, points, subtitle, avatar, rank }
  const top3 = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <View style={styles.container}>
      {/* Enhanced Podium */}
      <View style={styles.podiumRow}>
        {/* 2nd Place */}
        <View style={[styles.podiumItem, { height: podiumHeights[1] }]}>  
          <LinearGradient
            colors={['#f8f9fa', '#e9ecef']}
            style={styles.podiumGradient}
          >
            <View style={[styles.medalCircle, { backgroundColor: medalColors[1] }]}>  
              <MaterialCommunityIcons name="medal" size={32} color="#fff" />
            </View>
            <Image source={top3[1]?.avatar || defaultAvatars[1]} style={styles.avatar} />
            <Text style={styles.podiumName}>{top3[1]?.name || '-'}</Text>
            <Text style={styles.podiumPoints}>{top3[1]?.points?.toLocaleString() || '-'} PTS</Text>
            <Text style={styles.podiumRank}>2</Text>
          </LinearGradient>
        </View>
        {/* 1st Place */}
        <View style={[styles.podiumItem, styles.podiumFirst, { height: podiumHeights[0] }]}>  
          <LinearGradient
            colors={['#fff3cd', '#ffeaa7']}
            style={styles.podiumGradient}
          >
            <View style={[styles.medalCircle, { backgroundColor: medalColors[0] }]}>  
              <MaterialCommunityIcons name="medal" size={36} color="#fff" />
            </View>
            <Image source={top3[0]?.avatar || defaultAvatars[0]} style={styles.avatar} />
            <Text style={styles.podiumName}>{top3[0]?.name || '-'}</Text>
            <Text style={styles.podiumPoints}>{top3[0]?.points?.toLocaleString() || '-'} PTS</Text>
            <Text style={styles.podiumRank}>1</Text>
          </LinearGradient>
        </View>
        {/* 3rd Place */}
        <View style={[styles.podiumItem, { height: podiumHeights[2] }]}>  
          <LinearGradient
            colors={['#f8f9fa', '#e9ecef']}
            style={styles.podiumGradient}
          >
            <View style={[styles.medalCircle, { backgroundColor: medalColors[2] }]}>  
              <MaterialCommunityIcons name="medal" size={28} color="#fff" />
            </View>
            <Image source={top3[2]?.avatar || defaultAvatars[2]} style={styles.avatar} />
            <Text style={styles.podiumName}>{top3[2]?.name || '-'}</Text>
            <Text style={styles.podiumPoints}>{top3[2]?.points?.toLocaleString() || '-'} PTS</Text>
            <Text style={styles.podiumRank}>3</Text>
          </LinearGradient>
        </View>
      </View>
      
      {/* Enhanced Others List */}
      <View style={styles.othersContainer}>
        <Text style={styles.othersTitle}>Other Participants</Text>
        <FlatList
          data={others}
          keyExtractor={item => item.rank?.toString() || item.name}
          renderItem={({ item }) => (
            <View style={styles.otherRow}>
              <View style={styles.otherAvatarWrap}>
                <Ionicons name="person-circle" size={40} color="#667eea" />
              </View>
              <View style={styles.otherInfo}>
                <Text style={styles.otherName}>{item.name}</Text>
                {item.subtitle ? <Text style={styles.otherSubtitle}>{item.subtitle}</Text> : null}
              </View>
              <View style={styles.otherStats}>
                <Text style={styles.otherRank}>#{item.rank}</Text>
                <Text style={styles.otherPoints}>{item.points?.toLocaleString()} Pts</Text>
              </View>
            </View>
          )}
          style={styles.othersList}
          ListEmptyComponent={<Text style={styles.emptyText}>No more participants</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  podiumFirst: {
    transform: [{ translateY: -20 }],
    zIndex: 2,
  },
  podiumGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  medalCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  othersContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  othersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'left',
  },
  othersList: {
    maxHeight: 300,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otherAvatarWrap: {
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  otherInfo: {
    flex: 1,
  },
  otherName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  otherSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  otherStats: {
    alignItems: 'flex-end',
  },
  otherRank: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#667eea',
    marginBottom: 2,
  },
  otherPoints: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginVertical: 16,
    fontSize: 16,
    fontStyle: 'italic',
  },
}); 