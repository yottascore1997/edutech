import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

interface BlockedUser {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  course?: string;
  year?: number;
  blockedAt: string;
  reason?: string;
}

export default function BlockedUsersScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const fetchBlockedUsers = async () => {
    if (!user?.token) return;

    try {
      const response = await apiFetchAuth('/student/users/blocked', user.token, {
        method: 'GET',
      });

      if (response.ok) {
        setBlockedUsers(response.data || []);
      } else {
        Alert.alert('Error', 'Failed to load blocked users');
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (blockedUser: BlockedUser) => {
    if (!user?.token) return;

    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${blockedUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unblock', 
          style: 'default',
          onPress: async () => {
            setUnblocking(blockedUser.id);
            try {
              const response = await apiFetchAuth(`/student/users/${blockedUser.id}/unblock`, user.token, {
                method: 'DELETE',
              });

              if (response.ok) {
                // Remove user from blocked list
                setBlockedUsers(prev => prev.filter(user => user.id !== blockedUser.id));
                Alert.alert('Success', `${blockedUser.name} has been unblocked`);
              } else {
                Alert.alert('Error', 'Failed to unblock user. Please try again.');
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            } finally {
              setUnblocking(null);
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBlockedUsers();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBlockedUsers();
    }, [user?.token])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.98)', 'rgba(248,250,252,0.98)']}
        style={styles.userGradient}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {item.profilePhoto ? (
              <Image 
                source={{ uri: item.profilePhoto }} 
                style={styles.avatarImage} 
              />
            ) : (
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarInitials}>
                  {item.name ? item.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
            )}
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.course && (
              <Text style={styles.userCourse}>{item.course} • Year {item.year}</Text>
            )}
            <View style={styles.blockInfo}>
              <Text style={styles.blockDate}>Blocked on {formatDate(item.blockedAt)}</Text>
              {item.reason && (
                <Text style={styles.blockReason}>Reason: {item.reason}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity
            style={[styles.unblockButton, unblocking === item.id && styles.unblockButtonDisabled]}
            onPress={() => handleUnblockUser(item)}
            disabled={unblocking === item.id}
          >
            {unblocking === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.unblockButtonText}>Unblock</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading blocked users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocked Users</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {blockedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyIcon}
            >
              <Ionicons name="ban-outline" size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Blocked Users</Text>
            <Text style={styles.emptySubtitle}>
              You haven't blocked any users yet. Blocked users will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderBlockedUser}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingVertical: 20,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userGradient: {
    padding: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userCourse: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  blockInfo: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  blockDate: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 2,
  },
  blockReason: {
    fontSize: 12,
    color: '#DC2626',
  },
  userActions: {
    alignItems: 'flex-end',
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  unblockButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
