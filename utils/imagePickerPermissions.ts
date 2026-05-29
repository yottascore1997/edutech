import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

/** iOS only — Android uses the system photo picker and does not need library permissions. */
export async function ensurePhotoLibraryPermission(
  deniedMessage = 'Please grant permission to access your photo library.',
): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return true;
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', deniedMessage);
    return false;
  }
  return true;
}
