import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomePyqBanner() {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => router.push('/(tabs)/pyq' as any)}
      style={styles.wrap}
    >
      <LinearGradient
        colors={['#FFEDD5', '#FDE68A', '#FCD34D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="document-text" size={24} color="#C2410C" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>Previous Year Questions</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Practice real exam questions and boost your preparation.
          </Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Solve Now</Text>
          <ArrowRight size={14} color="#FFF" strokeWidth={2.5} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontFamily: FontFamily.bold, fontSize: 14, color: '#1A1A2E', marginBottom: 3 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: 11, color: '#64748B', lineHeight: 15 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 3,
  },
  ctaText: { fontFamily: FontFamily.semiBold, fontSize: 11, color: '#FFFFFF' },
});
