import { FontFamily } from '@/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { ArrowLeft, Mail } from 'lucide-react-native';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;

const C = {
  bg: ['#EDE9FE', '#F5F3FF', '#FAFAFF'] as const,
  primary: '#6344D4',
  primaryLight: '#8E78E7',
  ink: '#0F0A1E',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#E8E8F0',
  heroGrad: ['#7C3AED', '#6366F1', '#4B32AF'] as const,
};

export type LegalSection = {
  title: string;
  body: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
};

type Props = {
  badge: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  headerIcon: LucideIcon;
  intro?: string;
  sections: LegalSection[];
  contactEmail?: string;
  footerNote?: string;
};

function renderBody(body: string) {
  const parts = body.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={st.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

export default function LegalDocumentScreen({
  badge,
  title,
  titleAccent,
  subtitle,
  headerIcon: HeaderIcon,
  intro,
  sections,
  contactEmail = 'yottascore@gmail.com',
  footerNote,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[...C.bg]} style={StyleSheet.absoluteFill} />
      <View style={st.orb1} pointerEvents="none" />
      <View style={st.orb2} pointerEvents="none" />

      <SafeAreaView style={st.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        >
          {/* Header */}
          <LinearGradient colors={['#C4B5FD', '#DDD6FE', '#EDE9FE']} style={st.headerBorder}>
            <View style={st.headerCard}>
              <View style={st.headerTop}>
                <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.88}>
                  <ArrowLeft size={20} color={C.ink} strokeWidth={2.5} />
                </TouchableOpacity>
                <LinearGradient colors={['#8E78E7', C.primary]} style={st.badge}>
                  <HeaderIcon size={11} color="#FFF" strokeWidth={2.5} />
                  <Text style={st.badgeTxt}>{badge}</Text>
                </LinearGradient>
              </View>
              <Text style={st.headerTitle}>
                {title}
                {titleAccent ? <Text style={st.headerAccent}> {titleAccent}</Text> : null}
              </Text>
              <Text style={st.headerSub}>{subtitle}</Text>
            </View>
          </LinearGradient>

          {/* Hero strip */}
          <LinearGradient colors={[...C.heroGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.heroStrip}>
            <HeaderIcon size={22} color="#FFF" strokeWidth={2} />
            <Text style={st.heroStripTxt}>Yottascore · Last updated Jan 2025</Text>
          </LinearGradient>

          {intro ? (
            <LinearGradient colors={['#E9E5FF', '#F5F3FF']} style={st.introBorder}>
              <View style={st.introCard}>
                <Text style={st.introTxt}>{intro}</Text>
              </View>
            </LinearGradient>
          ) : null}

          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <LinearGradient key={index} colors={['#C4B5FD', '#DDD6FE', '#EDE9FE']} style={st.sectionBorder}>
                <View style={st.sectionCard}>
                  <View style={st.sectionHead}>
                    <View style={[st.sectionIcon, { backgroundColor: section.iconBg }]}>
                      <Icon size={20} color={section.iconColor} strokeWidth={2} />
                    </View>
                    <Text style={st.sectionTitle}>{section.title}</Text>
                  </View>
                  <Text style={st.sectionBody}>{renderBody(section.body)}</Text>
                </View>
              </LinearGradient>
            );
          })}

          {/* Contact */}
          <LinearGradient colors={['#8E78E7', C.primary, '#5546C9']} style={st.contactGrad}>
            <Mail size={20} color="#FFF" strokeWidth={2} />
            <View style={st.contactCopy}>
              <Text style={st.contactLbl}>Questions?</Text>
              <Text style={st.contactEmail}>{contactEmail}</Text>
            </View>
          </LinearGradient>

          {footerNote ? (
            <Text style={st.footerNote}>{footerNote}</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  orb1: {
    position: 'absolute',
    width: SCREEN_W * 0.55,
    height: SCREEN_W * 0.55,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(142, 120, 231, 0.09)',
    top: -SCREEN_W * 0.12,
    right: -SCREEN_W * 0.15,
  },
  orb2: {
    position: 'absolute',
    width: SCREEN_W * 0.32,
    height: SCREEN_W * 0.32,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(99, 68, 212, 0.06)',
    bottom: 60,
    left: -SCREEN_W * 0.06,
  },
  headerBorder: { marginHorizontal: PAD, marginTop: 8, borderRadius: 22, padding: 1.5, marginBottom: 12 },
  headerCard: { backgroundColor: C.card, borderRadius: 20.5, padding: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 10,
  },
  badgeTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF', letterSpacing: 0.6 },
  headerTitle: { fontFamily: FontFamily.extraBold, fontSize: 24, color: C.ink, lineHeight: 30 },
  headerAccent: { color: C.primary },
  headerSub: { fontFamily: FontFamily.regular, fontSize: 13, color: C.muted, marginTop: 4 },
  heroStrip: {
    marginHorizontal: PAD,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  heroStripTxt: { fontFamily: FontFamily.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.95)' },
  introBorder: { marginHorizontal: PAD, borderRadius: 16, padding: 1, marginBottom: 12 },
  introCard: { backgroundColor: C.card, borderRadius: 15, padding: 14 },
  introTxt: { fontFamily: FontFamily.regular, fontSize: 14, color: C.muted, lineHeight: 22 },
  sectionBorder: { marginHorizontal: PAD, marginBottom: 10, borderRadius: 16, padding: 1 },
  sectionCard: { backgroundColor: C.card, borderRadius: 15, padding: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: C.ink, flex: 1 },
  sectionBody: { fontFamily: FontFamily.regular, fontSize: 14, color: C.muted, lineHeight: 22 },
  bold: { fontFamily: FontFamily.bold, color: C.ink },
  contactGrad: {
    marginHorizontal: PAD,
    marginTop: 6,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactCopy: { flex: 1 },
  contactLbl: { fontFamily: FontFamily.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  contactEmail: { fontFamily: FontFamily.bold, fontSize: 15, color: '#FFF', marginTop: 2 },
  footerNote: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    marginTop: 14,
    marginHorizontal: PAD,
    fontStyle: 'italic',
  },
});
