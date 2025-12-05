import { AppColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import CustomDrawerContent from '../components/CustomDrawerContent';
import ErrorBoundary from '../components/ErrorBoundary';
import { NotificationBadge } from '../components/NotificationBadge';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { RefreshProvider } from '../context/RefreshContext';
import { ToastProvider } from '../context/ToastContext';
import { WalletProvider, useWallet } from '../context/WalletContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import '../utils/errorHandler'; // Initialize global error handler

// Header Right Component
const HeaderRight = ({ navigation }: any) => {
    const { user } = useAuth();
    const { walletAmount, refreshWalletAmount } = useWallet();

    // Refresh wallet amount when screen comes into focus
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshWalletAmount();
        });

        return unsubscribe;
    }, [navigation, refreshWalletAmount]);

    return (
        <View style={styles.headerRight}>
            {/* Enhanced Notification Icon */}
            <NotificationBadge size={26} color="#FFFFFF" />
            
            {/* Message Icon */}
            <TouchableOpacity 
                style={styles.messageIconButton}
                onPress={() => navigation.navigate('(tabs)', { screen: 'messages' })}
                activeOpacity={0.7}
            >
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Enhanced Wallet Amount */}
            <TouchableOpacity 
                style={styles.walletContainer}
                onPress={() => navigation.navigate('(tabs)', { screen: 'wallet' })}
            >
                <View style={styles.walletIconContainer}>
                    <Ionicons name="wallet" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.walletAmount}>₹{walletAmount}</Text>
            </TouchableOpacity>
        </View>
    );
};

function RootNavigator() {
    const { user } = useAuth();

    // If the user is not logged in, show the authentication screens.
    if (!user) {
        return (
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
            </Stack>
        );
    }
    
    // If the user is logged in, show the main app with a drawer.
    return (
        <WalletProvider>
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={({ navigation }) => ({
                    headerShown: true, // Show the header
                    headerStyle: {
                        backgroundColor: 'transparent', // Make background transparent for gradient
                    },
                    headerTintColor: AppColors.white,
                    headerBackground: () => (
                        <LinearGradient
                            colors={['#4F46E5', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ 
                                flex: 1,
                                borderBottomWidth: 1.5,
                                borderBottomColor: 'rgba(255, 255, 255, 0.25)',
                            }}
                        />
                    ),
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
                            <Ionicons name="menu" size={24} color="white" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => <HeaderRight navigation={navigation} />,
                    drawerStyle: {
                        width: 280, // Increased drawer width
                        backgroundColor: '#FFFFFF',
                    },
                })}
            >
                <Drawer.Screen
                    name="(tabs)"
                    options={{
                      title: '', // Remove the title
                      headerShown: false, // Hide header for tabs (which includes home)
                    }}
                />
                <Drawer.Screen
                    name="privacy-policy"
                    options={{
                      title: '', // Remove the title for privacy-policy
                    }}
                />
                <Drawer.Screen
                    name="terms"
                    options={{
                      title: '', // Remove the title for terms
                    }}
                />
                <Drawer.Screen
                    name="membership"
                    options={{
                      title: '', // Remove the title for membership
                    }}
                />
                <Drawer.Screen
                    name="user-profile"
                    options={{
                      title: '', // Remove the title for user-profile
                    }}
                />
            </Drawer>
        </WalletProvider>
    );
}

const styles = StyleSheet.create({
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        gap: 12,
    },
    walletContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 0,
    },
    walletIconContainer: {
        backgroundColor: '#FB923C',
        borderRadius: 10,
        width: 26,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(251, 146, 60, 0.3)',
        shadowColor: '#FB923C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 0,
    },
    walletAmount: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        letterSpacing: 0.4,
        lineHeight: 17,
    },
    messageIconButton: {
        marginLeft: 0,
        marginRight: 8,
        padding: 4,
    },
    notificationContainer: {
        position: 'relative',
    },
    notificationIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});

function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const colorScheme = useColorScheme();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <WebSocketProvider>
          <RefreshProvider>
            <ToastProvider>
              <ErrorBoundary>
                <RootNavigator />
              </ErrorBoundary>
            </ToastProvider>
          </RefreshProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default RootLayout;
