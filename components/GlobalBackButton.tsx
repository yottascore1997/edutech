import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface GlobalBackButtonProps {
  onPress?: () => void;
  style?: any;
  iconColor?: string;
  iconSize?: number;
}

const GlobalBackButton: React.FC<GlobalBackButtonProps> = ({
  onPress,
  style,
  iconColor = AppColors.white,
  iconSize = 24
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons 
        name="arrow-back" 
        size={iconSize} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default GlobalBackButton; 