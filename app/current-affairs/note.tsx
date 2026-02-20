import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import CommonHeader from '@/components/CommonHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CurrentAffairsNoteScreen() {
  const { entry } = useLocalSearchParams() as { entry?: string };
  const router = useRouter();
  let parsed: any = null;
  try {
    parsed = entry ? JSON.parse(entry) : null;
  } catch (e) {
    parsed = null;
  }

  return (
    <View style={{ flex: 1 }}>
      <CommonHeader showMainOptions={false} title={parsed?.title ?? 'Note'} />
      <ScrollView contentContainerStyle={styles.container}>
        {!parsed ? (
          <Text style={styles.empty}>No note data.</Text>
        ) : (
          <>
            <Text style={styles.title}>{parsed.title}</Text>
            <Text style={styles.meta}>{parsed.category ? parsed.category : ''} • {parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString() : ''}</Text>
            <View style={styles.bodyWrap}>
              <Text style={styles.bodyText}>{parsed.content}</Text>
            </View>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', paddingBottom: 80 },
  title: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  meta: { color: '#6b7280', marginBottom: 12 },
  bodyWrap: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8 },
  bodyText: { lineHeight: 20, color: '#111827' },
  empty: { textAlign: 'center', color: '#6b7280' },
  backBtn: { marginTop: 18, backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  backBtnText: { color: '#fff', fontWeight: '800' },
});

