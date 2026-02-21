import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { AppColors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StudentsSelectedBanner() {
  const avatars = [
    require('../assets/images/avatar1.jpg'),
    require('../assets/images/avatar2.jpg'),
    require('../assets/images/avatar3.jpg'),
    require('../assets/images/avatar1.jpg'),
    require('../assets/images/avatar2.jpg'),
    require('../assets/images/avatar3.jpg'),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.count}>4,23,891+</Text>
        <Text style={styles.title}>Students Selected</Text>
      </View>

      <Text style={styles.desc}>
        We are proud to help thousands of students in securing their dream job
      </Text>

      <View style={styles.avatarsRow}>
        {avatars.map((a, i) => (
          <View key={i} style={[styles.avatarWrap, i !== 0 && { marginLeft: -12 }]}>
            <Image source={a} style={styles.avatar} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    alignItems: 'center',
  },
  topRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  count: {
    fontSize: 28,
    fontWeight: '900',
    color: AppColors.accent,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.darkGrey,
    marginTop: 4,
  },
  desc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
    lineHeight: 20,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: AppColors.white,
    backgroundColor: '#eee',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});

