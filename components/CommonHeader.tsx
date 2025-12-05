import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommonHeaderProps {
  showSearchBar?: boolean;
  searchPlaceholder?: string;
  showMainOptions?: boolean;
  title?: string;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ 
  showSearchBar = true, 
  searchPlaceholder = "Search exams, subjects...",
  showMainOptions = false,
  title = ""
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { walletAmount } = useWallet();

  return (
    <LinearGradient
      colors={['#6366F1', 'rgba(139, 92, 246, 0.90)', 'rgba(168, 85, 247, 0.70)', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.headerContainer}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        {/* Menu Button */}
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.toggleDrawer()}
          activeOpacity={0.8}
        >
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Center - User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {user?.profilePhoto ? (
              <Image 
                source={{ uri: user.profilePhoto }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
          {title && (
            <Text style={styles.pageTitle}>{title}</Text>
          )}
        </View>
        
        {/* Right Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('(tabs)', { screen: 'notifications' })}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('(tabs)', { screen: 'messages' })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.walletButton}
            onPress={() => navigation.navigate('(tabs)', { screen: 'wallet' })}
            activeOpacity={0.7}
          >
            <Ionicons name="wallet" size={18} color="#FFFFFF" />
            <Text style={styles.walletText}>₹{walletAmount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearchBar && (
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <Text style={styles.searchPlaceholder}>{searchPlaceholder}</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Options (Only for Home Page) */}
      {showMainOptions && (
        <View style={styles.mainOptionsContainer}>
          <TouchableOpacity 
            style={styles.mainOption}
            onPress={() => navigation.navigate('(tabs)', { screen: 'exam' })}
            activeOpacity={0.8}
          >
            <View style={styles.mainOptionIcon}>
              <Ionicons name="flash" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.mainOptionText}>Live Exam</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mainOption}
            onPress={() => navigation.navigate('(tabs)', { screen: 'practice-categories' })}
            activeOpacity={0.8}
          >
            <View style={styles.mainOptionIcon}>
              <Ionicons name="help-circle" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.mainOptionText}>Practice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mainOption}
            onPress={() => navigation.navigate('(tabs)', { screen: 'book-store' })}
            activeOpacity={0.8}
          >
            <View style={styles.mainOptionIcon}>
              <Ionicons name="book" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.mainOptionText}>Book Store</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mainOption}
            onPress={() => navigation.navigate('(tabs)', { screen: 'quiz' })}
            activeOpacity={0.8}
          >
            <View style={styles.mainOptionIcon}>
              <Ionicons name="help" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.mainOptionText}>Quiz</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 20,
    shadowColor: '#55dbdd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 60,
  },
  
  menuButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  
  avatarContainer: {
    marginRight: 12,
  },
  
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  pageTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionButton: {
    padding: 12,
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  
  walletText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingBottom: 12,
  },
  
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  searchPlaceholder: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  
  filterButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  mainOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  
  mainOption: {
    alignItems: 'center',
    flex: 1,
  },
  
  mainOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  
  mainOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default CommonHeader;
