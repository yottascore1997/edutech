import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppColors } from '@/constants/Colors';

const TAB_BAR_PADDING = 88;

export default function CurrentAffairsNoteScreen() {
  const { entry } = useLocalSearchParams() as { entry?: string };
  const router = useRouter();
  let parsed: any = null;
  try {
    parsed = entry ? JSON.parse(entry) : null;
  } catch {
    parsed = null;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: TAB_BAR_PADDING }]}
        showsVerticalScrollIndicator={false}
      >
        {!parsed ? (
          <Text style={styles.empty}>No note data.</Text>
        ) : (
          <>
            <Text style={styles.title}>{parsed.title}</Text>
            <Text style={styles.meta}>
              {parsed.category ? parsed.category : ''}
              {parsed.category && parsed.createdAt ? ' • ' : ''}
              {parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString() : ''}
            </Text>
            <View style={styles.bodyWrap}>
              <Text style={styles.bodyText}>{parsed.content}</Text>
            </View>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 24 },
  container: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 8, color: '#1e293b' },
  meta: { color: '#64748B', marginBottom: 16, fontSize: 14 },
  bodyWrap: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  bodyText: { lineHeight: 24, color: '#334155', fontSize: 15 },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 24 },
  backBtn: {
    marginTop: 24,
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  backBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
