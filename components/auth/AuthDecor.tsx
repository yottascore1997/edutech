import { AuthTheme } from '@/constants/AuthTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/** Subtle background icons like Q-learn mockup */
export function AuthDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.icon, { top: '12%', left: '8%' }]}>
        <Ionicons name="planet-outline" size={28} color={AuthTheme.decor} />
      </View>
      <View style={[styles.icon, { top: '18%', right: '12%' }]}>
        <Ionicons name="aperture-outline" size={24} color={AuthTheme.decor} />
      </View>
      <View style={[styles.icon, { top: '42%', left: '6%' }]}>
        <Ionicons name="shapes-outline" size={22} color={AuthTheme.decor} />
      </View>
      <View style={[styles.icon, { bottom: '28%', right: '8%' }]}>
        <Ionicons name="school-outline" size={26} color={AuthTheme.decor} />
      </View>
      <View style={[styles.icon, { bottom: '18%', left: '14%' }]}>
        <Ionicons name="book-outline" size={20} color={AuthTheme.decor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { position: 'absolute', opacity: 0.45 },
});
