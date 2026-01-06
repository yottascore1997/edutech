import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommonHeaderProps {
  showMainOptions?: boolean;
  title?: string;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ 
  showMainOptions = false,
  title = ""
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { walletAmount, refreshWalletAmount } = useWallet();

  // Refresh wallet on mount
  React.useEffect(() => {
    refreshWalletAmount();
  }, []);

  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#9333EA', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Premium Glass Effect Overlay */}
        <View style={styles.glassOverlay} />
        
        {/* Top Header */}
        <View style={styles.topHeader}>
          {/* Menu Button - Premium Style */}
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.toggleDrawer()}
            activeOpacity={0.8}
          >
            <View style={styles.menuButtonContainer}>
              <Ionicons name="menu" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          {/* Center - Empty for spacing */}
          <View style={styles.userInfo} />
          
          {/* Right Actions - Premium Style */}
          <View style={styles.rightActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('(tabs)', { screen: 'notifications' })}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonContainer}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('(tabs)', { screen: 'messages' })}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.walletButton}
              onPress={() => navigation.navigate('(tabs)', { screen: 'wallet' })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.walletButtonGradient}
              >
                <View style={styles.walletIconContainer}>
                  <Ionicons name="wallet" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.walletText}>₹{walletAmount || '0.00'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

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
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  
  gradientBackground: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
  },
  
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingTop: 48,
    paddingBottom: 14,
    zIndex: 1,
    minHeight: 56,
  },
  
  menuButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  menuButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  
  userName: {
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  
  pageTitle: {
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  actionButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  
  walletButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  
  walletButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    minWidth: 75,
  },
  
  walletIconContainer: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  walletText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  mainOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
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
