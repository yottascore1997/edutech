import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StudyPartnerMatchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    otherUserId?: string;
    otherName?: string;
    otherPhoto?: string;
  }>();

  const [message, setMessage] = useState('');

  const otherUserId = params.otherUserId || '';
  const otherName = params.otherName || 'Your match';
  const rawOtherPhoto = params.otherPhoto || '';
  const rawMyPhoto =
    (user as any)?.profilePhoto ||
    (user as any)?.profilePicture ||
    '';

  const otherPhoto =
    rawOtherPhoto && !rawOtherPhoto.startsWith('http')
      ? getImageUrl(rawOtherPhoto)
      : rawOtherPhoto;

  const myPhoto =
    rawMyPhoto && !rawMyPhoto.startsWith('http')
      ? getImageUrl(rawMyPhoto)
      : rawMyPhoto;

  const goToChat = (preset?: string) => {
    router.push({
      pathname: '/(tabs)/chat-screen',
      params: {
        userId: otherUserId,
        userName: otherName,
        userProfilePhoto: otherPhoto || '',
        isFollowing: 'true',
        // chat screen currently ignores this, but safe to send
        initialMessage: preset || message || '',
      },
    } as any);
  };

  const handleSend = () => {
    goToChat();
  };

  return (
    <LinearGradient
      colors={['#16A34A', '#15803D']}
      style={styles.screen}
    >
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.heartsLayer}>
        <View style={[styles.heart, styles.heartBack]} />
        <View style={[styles.heart, styles.heartMid]} />
        <View style={[styles.heart, styles.heartFront]} />
      </View>

      <View style={styles.avatarsRow}>
        <View style={styles.avatarWrapper}>
          {myPhoto ? (
            <Image source={{ uri: myPhoto }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarImage, styles.avatarFallback]}>
              <Ionicons name="person" size={32} color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.avatarWrapper}>
          {otherPhoto ? (
            <Image source={{ uri: otherPhoto }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarImage, styles.avatarFallback]}>
              <Ionicons name="person" size={32} color="#FFFFFF" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.matchTextWrap}>
        <Text style={styles.matchTitle}>It&apos;s a</Text>
        <Text style={styles.matchWord}>Match</Text>
        <Text style={styles.subtitle}>You matched with {otherName}</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Say something nice"
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          activeOpacity={0.85}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.reactionsRow}>
        <TouchableOpacity
          style={styles.reactionBtn}
          onPress={() => goToChat('👋')}
        >
          <Text style={styles.reactionText}>👋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reactionBtn}
          onPress={() => goToChat('😉')}
        >
          <Text style={styles.reactionText}>😉</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reactionBtn}
          onPress={() => goToChat('❤️')}
        >
          <Text style={styles.reactionText}>❤️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reactionBtn}
          onPress={() => goToChat('😍')}
        >
          <Text style={styles.reactionText}>😍</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const HEART_SIZE = Math.min(SCREEN_WIDTH * 0.9, 360);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: SCREEN_HEIGHT * 0.08,
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartsLayer: {
    width: HEART_SIZE,
    height: HEART_SIZE * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heart: {
    position: 'absolute',
    width: HEART_SIZE,
    height: HEART_SIZE * 0.7,
    borderRadius: HEART_SIZE / 2,
    backgroundColor: '#22C55E',
  },
  heartBack: {
    opacity: 0.35,
    transform: [{ scale: 1.1 }],
  },
  heartMid: {
    opacity: 0.55,
    transform: [{ scale: 1.0 }],
  },
  heartFront: {
    opacity: 0.9,
    transform: [{ scale: 0.9 }],
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -HEART_SIZE * 0.12,
    gap: 24,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#F97316',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchTextWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#BBF7D0',
    letterSpacing: 1,
  },
  matchWord: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#DCFCE7',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 20,
    width: '100%',
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    paddingHorizontal: 16,
    backgroundColor: '#ECFDF5',
    color: '#111827',
    fontSize: 14,
  },
  sendBtn: {
    marginLeft: 8,
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 30,
  },
  reactionBtn: {
    width: 56,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
  },
  reactionText: {
    fontSize: 22,
  },
});

