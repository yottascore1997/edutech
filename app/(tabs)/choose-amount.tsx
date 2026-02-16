import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

export default function ChooseAmount() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const category = (params?.category as string) || 'any';
  const mode = (params?.mode as string) || 'battle';

  const [amounts, setAmounts] = useState<number[]>([10,25,50,100]);
  const [selected, setSelected] = useState<number | null>(25);
  const [custom, setCustom] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // try fetch amounts for category if authenticated
    const fetch = async () => {
      if (!user?.token) return;
      setLoading(true);
      try {
        const res = await apiFetchAuth(`/student/battle-quiz/amounts?categoryId=${category}`, user.token);
        if (res.ok && Array.isArray(res.data)) {
          const vals = res.data.map((a: any) => a.amount).sort((a:number,b:number)=>a-b);
          if (vals.length) {
            setAmounts(vals);
            setSelected(vals[0]);
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category, user?.token]);

  const onConfirm = () => {
    const amt = custom ? parseInt(custom,10) : (selected || amounts[0]);
    router.push({
      pathname: '/(tabs)/matchmaking',
      params: { category, amount: String(amt), mode }
    } as any);
  };

  return (
    <LinearGradient colors={['#06b6d4','#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.overlay}>
      <View style={styles.popupContainer}>
        <View style={styles.popupHeader}>
          <View style={styles.premium}>
            <Ionicons name="sparkles" size={12} color="#fff" />
            <Text style={styles.premiumText}>Premium Match</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Choose Battle Amount</Text>
        <Text style={styles.subtitle}>{category.toUpperCase()} • {mode}</Text>

        <ScrollView contentContainerStyle={styles.cardScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Suggested Stakes</Text>
            <View style={styles.grid}>
              {amounts.map(a => (
                <TouchableOpacity key={a} style={[styles.tile, selected === a && styles.tileActive]} onPress={() => { setSelected(a); setCustom(''); }}>
                  <LinearGradient colors={selected===a?['#FFD166','#F59E0B']:['#0f1724','#0b1220']} style={styles.tileInner}>
                    <Text style={[styles.amount, selected===a && styles.amountActive]}>₹{a}</Text>
                    <Text style={styles.tier}>{a<=25?'Casual':a<=50?'Pro':'Elite'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />
            <Text style={styles.cardTitle}>Custom Amount</Text>
            <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined}>
              <View style={styles.customRow}>
                <TextInput style={styles.input} placeholder="Enter amount" keyboardType="number-pad" placeholderTextColor="rgba(255,255,255,0.5)" value={custom} onChangeText={t=>setCustom(t.replace(/[^0-9]/g,''))} />
                <TouchableOpacity style={styles.add10} onPress={()=>{ const n = custom?parseInt(custom||'0')+10: (selected||0)+10; setCustom(String(n)); setSelected(null); }}>
                  <Text style={styles.add10Text}>+10</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.education}>Tip: Choose a stake that matches your confidence—higher stakes mean higher rewards.</Text>
            </KeyboardAvoidingView>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>You’ll join with</Text>
            <Text style={styles.summaryAmount}>₹{custom?custom:selected}</Text>
          </View>
          <TouchableOpacity style={styles.cta} onPress={onConfirm}>
            <LinearGradient colors={['#FFD166','#F59E0B']} style={styles.ctaInner}>
              <Text style={styles.ctaText}>Start Battle • ₹{custom?custom:selected}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  popupContainer: { width: '92%', maxWidth: 420, backgroundColor: '#071028', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  premium: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(255,215,102,0.06)' },
  premiumText: { color: '#FFD166', fontWeight: '700', marginLeft: 8, fontSize: 12 },
  closeBtn: { padding: 6 },
  title: { color: '#E6EEF8', fontSize: 20, fontWeight: '800', marginTop: 4 },
  subtitle: { color: 'rgba(230,238,248,0.7)', marginTop: 4, fontSize: 12 },
  cardScroll: { paddingVertical: 10 },
  card: { backgroundColor: '#061428', borderRadius: 12, padding: 12, marginTop: 12 },
  cardTitle: { color: '#D8E6FF', fontWeight: '800', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: (width - 96) / 3, marginBottom: 10 },
  tileInner: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  tileActive: { borderWidth: 2, borderColor: '#FFD166' },
  amount: { color: '#E6EEF8', fontWeight: '800', fontSize: 15 },
  amountActive: { color: '#0B1220' },
  tier: { color: 'rgba(230,238,248,0.7)', fontSize: 11, marginTop: 6 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginVertical: 10 },
  customRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', color: '#fff' },
  add10: { marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  add10Text: { color: '#FFD166', fontWeight: '700' },
  education: { color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 12, textAlign: 'center' },
  footer: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary: { alignItems: 'flex-start' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  summaryAmount: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  cta: { width: '48%' },
  ctaInner: { paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  ctaText: { color: '#0B1220', fontWeight: '900' }
});

