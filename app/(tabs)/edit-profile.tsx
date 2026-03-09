import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetchAuth, uploadFile } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    course: '',
    year: '',
    profilePhoto: '',
    isPrivate: false
  });

  // Fetch latest profile data
  const fetchProfile = async () => {
    if (!user?.token) return;
    
    setFetchingProfile(true);
    try {
      const res = await apiFetchAuth('/student/profile', user.token);
      if (res.ok && res.data) {
        const profile = res.data;
        setProfileData({
          name: profile.name || '',
          username: profile.username || profile.handle || '',
          email: profile.email || '',
          bio: profile.bio || '',
          course: profile.course || '',
          year: profile.year || '',
          profilePhoto: profile.profilePhoto || '',
          isPrivate: profile.isPrivate || false
        });
      } else {
        // Fallback to user context data
        if (user) {
          setProfileData({
            name: user.name || '',
            username: (user as any).username || (user as any).handle || '',
            email: user.email || '',
            bio: (user as any).bio || '',
            course: (user as any).course || '',
            year: (user as any).year || '',
            profilePhoto: user.profilePhoto || '',
            isPrivate: (user as any).isPrivate || false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to user context data
      if (user) {
        setProfileData({
          name: user.name || '',
          username: (user as any).username || (user as any).handle || '',
          email: user.email || '',
          bio: (user as any).bio || '',
          course: (user as any).course || '',
          year: (user as any).year || '',
          profilePhoto: user.profilePhoto || '',
          isPrivate: (user as any).isPrivate || false
        });
      }
    } finally {
      setFetchingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Start pulse animation for save button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [user, fadeAnim, slideAnim, scaleAnim, pulseAnim]);

  const handleProfilePhotoUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        
        try {
          // Upload the image
          const imageUrl = await uploadFile(result.assets[0].uri, user?.token || '');
          
          // Update local state with new photo
          setProfileData(prev => ({
            ...prev,
            profilePhoto: imageUrl
          }));
          
          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!profileData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);
    try {
      // Prepare the data to send - only include fields that have values or are being updated
      const updateData: any = {
        name: profileData.name,
        email: profileData.email,
      };

      // Only include optional fields if they have values
      if (profileData.username) updateData.username = profileData.username;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;
      if (profileData.course) updateData.course = profileData.course;
      if (profileData.year) updateData.year = profileData.year;
      if (profileData.profilePhoto) updateData.profilePhoto = profileData.profilePhoto;
      if (profileData.isPrivate !== undefined) updateData.isPrivate = profileData.isPrivate;

      const updateResponse = await apiFetchAuth('/student/profile', user?.token || '', {
        method: 'PATCH',
        body: updateData,
      });

      if (updateResponse.ok) {
        // Update the user context with new profile data
        if (user && updateResponse.data) {
          const updatedUser = { ...user, ...updateResponse.data };
          updateUser(updatedUser);
        }
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.error('Update failed:', updateResponse);
        const errorMessage = updateResponse.data?.message || updateResponse.data?.error || updateResponse.data || 'Failed to update profile. Please try again.';
        Alert.alert('Error', String(errorMessage));
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  // Helper for initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const filledCount = [
    profileData.name.trim(),
    profileData.username.trim(),
    profileData.bio.trim(),
    profileData.course.trim(),
    profileData.year.trim(),
    profileData.profilePhoto,
  ].filter(Boolean).length;
  const totalFields = 6;
  const progressPercent = Math.round((filledCount / totalFields) * 100);

  if (fetchingProfile) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </View>
      );
    }

    return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.enhancedContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }}
      >
        {/* Attractive gradient header */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBack, { top: insets.top + 8 }]}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Stand out with a complete profile ✨</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{filledCount} of {totalFields} filled</Text>
          </View>
        </LinearGradient>

        {/* Profile Photo Section - Hero */}
        <View style={styles.photoSectionCard}>
          <View style={styles.compactAvatarContainer}>
            {uploadingPhoto ? (
              <View style={styles.compactAvatarLoading}>
                <ActivityIndicator size="small" color="#4F46E5" />
              </View>
            ) : profileData.profilePhoto ? (
              <Image
                source={{ uri: profileData.profilePhoto }}
                style={styles.compactAvatar}
              />
            ) : (
              <View style={styles.compactAvatarPlaceholder}>
                <Text style={styles.compactAvatarInitials}>
                  {getInitials(profileData.name)}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              onPress={handleProfilePhotoUpload}
              disabled={uploadingPhoto}
              style={styles.compactEditButton}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>Tap to add a photo — first thing people notice!</Text>
        </View>

        {/* Form Fields - Section: Basic Info */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="person-circle" size={22} color="#6366F1" />
            </View>
            <Text style={styles.sectionTitle}>Basic Info</Text>
          </View>
          {/* Enhanced Name Field */}
          <View style={styles.enhancedInputGroup}>
            <View style={styles.enhancedInputLabelContainer}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.enhancedInputIconContainer}
              >
                <Ionicons name="person" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.enhancedInputLabel}>👤 Full Name *</Text>
            </View>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
              style={styles.enhancedInputContainer}
            >
              <TextInput
                style={styles.enhancedInput}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                placeholder="How do you want to be called?"
                placeholderTextColor="#94a3b8"
              />
            </LinearGradient>
          </View>

          {/* Username Field */}
          <View style={styles.enhancedInputGroup}>
            <View style={styles.enhancedInputLabelContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#A855F7']}
                style={styles.enhancedInputIconContainer}
              >
                <Ionicons name="at" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.enhancedInputLabel}>🏷️ Username *</Text>
            </View>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
              style={styles.enhancedInputContainer}
            >
              <TextInput
                style={styles.enhancedInput}
                value={profileData.username}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, username: text }))}
                placeholder="Unique handle — e.g. rahul_study"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </LinearGradient>
          </View>

          {/* About You section */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="chatbubble-ellipses" size={22} color="#059669" />
            </View>
            <Text style={styles.sectionTitle}>About You</Text>
          </View>
          {/* Enhanced Bio Field */}
          <View style={styles.enhancedInputGroup}>
            <View style={styles.enhancedInputLabelContainer}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.enhancedInputIconContainer}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.enhancedInputLabel}>💭 Bio</Text>
            </View>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
              style={styles.enhancedInputContainer}
            >
              <TextInput
                style={[styles.enhancedInput, styles.enhancedTextArea]}
                value={profileData.bio}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself... What do you love studying?"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </LinearGradient>
          </View>

          {/* Study Details section */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="school" size={22} color="#4F46E5" />
            </View>
            <Text style={styles.sectionTitle}>Study Details</Text>
          </View>
          {/* Enhanced Course and Year Row */}
          <View style={styles.enhancedRow}>
            <View style={[styles.enhancedInputGroup, styles.enhancedHalfWidth]}>
              <View style={styles.enhancedInputLabelContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.enhancedInputIconContainer}
                >
                  <Ionicons name="school" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedInputLabel}>🎓 Course</Text>
              </View>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                style={styles.enhancedInputContainer}
              >
                <TextInput
                  style={styles.enhancedInput}
                  value={profileData.course}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, course: text }))}
                  placeholder="e.g. B.Tech, SSC CGL"
                  placeholderTextColor="#94a3b8"
                />
              </LinearGradient>
            </View>

            <View style={[styles.enhancedInputGroup, styles.enhancedHalfWidth]}>
              <View style={styles.enhancedInputLabelContainer}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.enhancedInputIconContainer}
                >
                  <Ionicons name="calendar" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedInputLabel}>📅 Year</Text>
              </View>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                style={styles.enhancedInputContainer}
              >
                <TextInput
                  style={styles.enhancedInput}
                  value={profileData.year}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, year: text }))}
                  placeholder="e.g. 2025 or 2nd year"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </LinearGradient>
            </View>
          </View>

          {/* Privacy section */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="lock-closed" size={22} color="#DC2626" />
            </View>
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>
          {/* Enhanced Privacy Switch */}
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
            style={styles.enhancedSwitchGroup}
          >
            <View style={styles.enhancedSwitchContent}>
              <View style={styles.enhancedSwitchLabelContainer}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.enhancedSwitchIconContainer}
                >
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.enhancedSwitchTextContainer}>
                  <Text style={styles.enhancedSwitchLabel}>🔒 Private Profile</Text>
                  <Text style={styles.enhancedSwitchDescription}>Only approved followers can see your posts and profile</Text>
                </View>
              </View>
              <Switch
                value={profileData.isPrivate}
                onValueChange={(value) => setProfileData(prev => ({ ...prev, isPrivate: value }))}
                trackColor={{ false: '#e2e8f0', true: '#4F46E5' }}
                thumbColor={profileData.isPrivate ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#e2e8f0"
              />
            </View>
          </LinearGradient>
        </View>

          {/* Save Button */}
          {progressPercent < 100 && (
            <Text style={styles.almostThere}>You’re almost there! Fill the rest to stand out.</Text>
          )}
          <View style={styles.enhancedSaveButtonContainer}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={[
                styles.enhancedSaveButton,
                loading && styles.enhancedSaveButtonDisabled
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                style={styles.enhancedSaveButtonGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.enhancedSaveButtonText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.enhancedSaveButtonText}>✨ Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
       </ScrollView>
    </View>
   );
 }

 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#f0f4ff',
   },
   
   // Header
   headerGradient: {
     paddingTop: 52,
     paddingBottom: 24,
     paddingHorizontal: 20,
     borderBottomLeftRadius: 24,
     borderBottomRightRadius: 24,
   },
   headerBack: {
     position: 'absolute',
     top: 12,
     left: 20,
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: 'rgba(255,255,255,0.2)',
     alignItems: 'center',
     justifyContent: 'center',
   },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    minWidth: 100,
  },
   photoSectionCard: {
     alignItems: 'center',
     marginHorizontal: 16,
     marginTop: -8,
     marginBottom: 16,
     backgroundColor: '#FFFFFF',
     borderRadius: 20,
     paddingVertical: 24,
     paddingHorizontal: 20,
     shadowColor: '#6366F1',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.12,
     shadowRadius: 12,
     elevation: 4,
   },
  photoHint: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  almostThere: {
    fontSize: 16,
    color: '#6366F1',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
   
   // Enhanced Content
   enhancedContent: {
     flex: 1,
   },
   
   // Compact Photo Section Styles
   compactPhotoSection: {
     alignItems: 'center',
     marginBottom: 20,
     paddingHorizontal: 20,
   },
   compactAvatarContainer: {
     position: 'relative',
     alignItems: 'center',
   },
  compactAvatarLoading: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  compactAvatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactAvatarInitials: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  compactEditButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
     backgroundColor: '#4F46E5',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: '#fff',
     shadowColor: '#4F46E5',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.4,
     shadowRadius: 8,
     elevation: 8,
   },
   
   // Form Section Styles
   enhancedFormSection: {
     paddingHorizontal: 0,
     paddingBottom: 40,
   },
  enhancedInputGroup: {
    marginBottom: 28,
  },
  enhancedInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  enhancedInputIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  enhancedInputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  enhancedInputContainer: {
    borderRadius: 14,
    padding: 18,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedInput: {
    fontSize: 18,
    color: '#1F2937',
    paddingVertical: 8,
  },
  enhancedTextArea: {
    minHeight: 88,
  },
   enhancedRow: {
     flexDirection: 'row',
     gap: 12,
   },
   enhancedHalfWidth: {
     flex: 1,
   },
   
   // Switch Styles
  enhancedSwitchGroup: {
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 0,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedSwitchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enhancedSwitchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedSwitchIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  enhancedSwitchTextContainer: {
    flex: 1,
  },
  enhancedSwitchLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  enhancedSwitchDescription: {
    fontSize: 16,
    color: '#6B7280',
  },
   
   // Save Button Styles
   enhancedSaveButtonContainer: {
     marginHorizontal: 20,
     marginTop: 30,
     marginBottom: 20,
     backgroundColor: '#fff',
     borderRadius: 16,
     shadowColor: '#4F46E5',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.2,
     shadowRadius: 8,
     elevation: 6,
   },
  enhancedSaveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 62,
    backgroundColor: '#4F46E5',
  },
  enhancedSaveButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#9CA3AF',
  },
  enhancedSaveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 28,
    gap: 12,
    minHeight: 62,
  },
  enhancedSaveButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
   loadingContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: '#f8f9fa',
   },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
});
