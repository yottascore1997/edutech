import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { Heart, Home, MessageCircle, Search } from 'lucide-react-native';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudyPartner } from '@/context/StudyPartnerContext';

const TABS = [
  { key: 'home', label: 'Home', Icon: Home, route: '/(tabs)/study-partner', match: 'study-partner' },
  { key: 'discover', label: 'Discover', Icon: Search, route: '/(tabs)/study-partner-discover', match: 'study-partner-discover' },
  { key: 'chats', label: 'Chats', Icon: MessageCircle, route: '/(tabs)/messages', match: 'messages' },
  { key: 'profile', label: 'Profile', Icon: null, route: '/(tabs)/study-partner-profile', match: 'study-partner-profile' },
] as const;

export default function StudyPartnerBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { likesCount } = useStudyPartner();

  const isActive = (match: string) => {
    if (!pathname) return false;
    if (match === 'study-partner') return pathname === '/study-partner' || pathname.endsWith('/study-partner');
    return pathname.includes(match);
  };

  return (
    <View style={[st.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={st.bar}>
        {TABS.slice(0, 2).map((tab) => {
          const active = isActive(tab.match);
          const Icon = tab.Icon!;
          return (
            <TouchableOpacity key={tab.key} style={st.item} activeOpacity={0.85} onPress={() => router.push(tab.route as any)}>
              <Icon size={22} color={active ? '#6344D4' : '#94A3B8'} strokeWidth={active ? 2.5 : 2} />
              <Text style={[st.lbl, active && st.lblOn]}>{tab.label}</Text>
              {active && <View style={st.indicator} />}
            </TouchableOpacity>
          );
        })}

        <View style={st.fabSlot}>
          <TouchableOpacity activeOpacity={0.92} onPress={() => router.push('/(tabs)/study-partner-discover' as any)}>
            <LinearGradient colors={['#8E78E7', '#6344D4', '#5546C9']} style={st.fab}>
              <Heart size={26} color="#FFF" fill="#FFF" strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {TABS.slice(2).map((tab) => {
          const active = isActive(tab.match);
          if (tab.key === 'profile') {
            return (
              <TouchableOpacity key={tab.key} style={st.item} activeOpacity={0.85} onPress={() => router.push(tab.route as any)}>
                <Ionicons name="person" size={22} color={active ? '#6344D4' : '#94A3B8'} />
                <Text style={[st.lbl, active && st.lblOn]}>{tab.label}</Text>
                {active && <View style={st.indicator} />}
              </TouchableOpacity>
            );
          }
          const Icon = tab.Icon!;
          return (
            <TouchableOpacity key={tab.key} style={st.item} activeOpacity={0.85} onPress={() => router.push(tab.route as any)}>
              <View>
                <Icon size={22} color={active ? '#6344D4' : '#94A3B8'} strokeWidth={active ? 2.5 : 2} />
                {tab.key === 'chats' && likesCount > 0 && (
                  <View style={st.badge}><Text style={st.badgeTxt}>{likesCount > 9 ? '9+' : likesCount}</Text></View>
                )}
              </View>
              <Text style={[st.lbl, active && st.lblOn]}>{tab.label}</Text>
              {active && <View style={st.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8F0',
    ...Platform.select({
      ios: { shadowColor: '#6344D4', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 12 },
    }),
  },
  bar: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8, paddingHorizontal: 8 },
  item: { flex: 1, alignItems: 'center', paddingBottom: 4, minHeight: 52 },
  lbl: { fontFamily: FontFamily.medium, fontSize: 10, color: '#94A3B8', marginTop: 4 },
  lblOn: { fontFamily: FontFamily.bold, color: '#6344D4' },
  indicator: { width: 18, height: 3, borderRadius: 2, backgroundColor: '#6344D4', marginTop: 4 },
  fabSlot: { width: 72, alignItems: 'center', marginTop: -28 },
  fab: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14 },
      android: { elevation: 10 },
    }),
  },
  badge: {
    position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF' },
});
