import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WEBSOCKET_CONFIG } from '../constants/websocket';
import { useWebSocket } from '../context/WebSocketContext';

export default function WebSocketStatus() {
  const { isConnected, connect, disconnect } = useWebSocket();
  const [testing, setTesting] = useState(false);

  const handleTestConnection = () => {
    if (isConnected) {
      disconnect();
      Alert.alert('Disconnected', 'WebSocket connection closed');
    } else {
      connect();
      Alert.alert('Connecting', 'Attempting to connect to WebSocket server...');
    }
  };

  const handleManualTest = async () => {
    setTesting(true);
    try {
      console.log('🔍 Manual connection test starting...');
      console.log('📍 Server URL:', WEBSOCKET_CONFIG.SERVER_URL);
      
      // Test basic connectivity to the same server but different port
      const apiUrl = WEBSOCKET_CONFIG.SERVER_URL.replace(':3001', ':3000');
      console.log('🌐 Testing API connectivity to:', apiUrl);
      
      try {
        const apiResponse = await fetch(`${apiUrl}/api/health`, {
          method: 'GET',
        });
        console.log('✅ API connection successful:', apiResponse.status);
      } catch (apiError) {
        console.log('⚠️ API connection failed:', apiError);
      }
      
      // Test WebSocket server connectivity
      const wsUrl = WEBSOCKET_CONFIG.SERVER_URL.replace('http://', 'ws://');
      console.log('🔌 Testing WebSocket server at:', wsUrl);
      
      try {
        const response = await fetch(WEBSOCKET_CONFIG.SERVER_URL, {
          method: 'GET',
        });
        
        Alert.alert(
          'Connection Test Results', 
          `✅ Server is reachable!\n\nHTTP Response: ${response.status}\n\nIf WebSocket still doesn't work, check:\n1. WebSocket server is running on port 3001\n2. CORS settings allow React Native\n3. Network firewall allows WebSocket connections`
        );
      } catch (error) {
        console.error('Connection test failed:', error);
        Alert.alert(
          'Connection Failed', 
          `❌ Cannot reach server at ${WEBSOCKET_CONFIG.SERVER_URL}\n\nPossible issues:\n1. Server not running on port 3001\n2. Wrong IP address\n3. Network firewall blocking\n4. Device not on same network`
        );
      }
    } catch (error) {
      console.error('Test failed:', error);
      Alert.alert('Test Error', 'Failed to run connection test');
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isConnected ? ['#4CAF50', '#45a049'] : ['#f44336', '#d32f2f']}
        style={styles.statusContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusContent}>
          <Ionicons 
            name={isConnected ? "wifi" : "wifi-outline"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.statusText}>
            {isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestConnection}
          >
            <Text style={styles.testButtonText}>
              {isConnected ? 'Disconnect' : 'Connect'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.testButton, styles.manualTestButton]}
            onPress={handleManualTest}
            disabled={testing}
          >
            <Text style={styles.testButtonText}>
              {testing ? 'Testing...' : 'Test Server'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.serverInfo}>
          Server: {WEBSOCKET_CONFIG.SERVER_URL}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  statusContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  manualTestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  serverInfo: {
    color: '#fff',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
}); 