import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User, MapPin } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PrimaryGrey, PrimaryBlue, LightGrey, SecondaryGrey } from '../../Constants/Colors'
import { getUserProfileById } from '../../services/api/social'
import { updateProfile } from '../../services/api/auth'
import { useAuthStore } from '../../store/store'
import { useToast } from '../../contexts/ToastContext'
import * as ImagePicker from 'react-native-image-picker'

export default function Account() {
  const navigation = useNavigation()
  const { user, setUser } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    location: '',
    bio: '',
    profile_picture_file: ''
  })
  const [originalData, setOriginalData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    location: '',
    bio: '',
    profile_picture_file: ''
  })
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)

  // Fetch current profile data
  const { data: profileData } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => getUserProfileById(user?.id?.toString() || ''),
    enabled: !!user?.id,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      if (response?.user?.profile_picture && user) {
        setUser({ ...user, profile_picture: response.user.profile_picture })
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      showToast('Profile updated successfully!', 3000)
      setIsEditMode(false)
      setOriginalData(formData)
    },
    onError: (error: any) => {
      // Check for image validation error
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (errorMessage.includes('profile_picture_file') || errorMessage.includes('invalid_image') || errorMessage.includes('corrupted image')) {
        showToast('Please upload a valid image file. The file may be corrupted or not a valid image format.', 3000)
      } else {
        showToast(errorMessage || 'Failed to update profile. Please try again.', 3000)
      }
      console.error('Profile update error:', error)
    }
  })

  useEffect(() => {
    if (profileData) {
      const data = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        username: profileData.username || '',
        email: user?.email || profileData.email || '',
        location: profileData.location || '',
        bio: profileData.bio || '',
        profile_picture_file: profileData.profile_picture || ''
      }
      setFormData(data)
      setOriginalData(data)
    }
  }, [profileData, user])

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setFormData(originalData)
    setSelectedImageUri(null)
    setIsEditMode(false)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.first_name.trim()) {
      Alert.alert('Error', 'First name cannot be empty')
      return
    }
    if (!formData.last_name.trim()) {
      Alert.alert('Error', 'Last name cannot be empty')
      return
    }
    if (formData.username.trim() && !formData.username.trim().match(/^[a-zA-Z0-9_]+$/)) {
      Alert.alert('Error', 'Username should only contain letters, numbers, and underscores')
      return
    }
    if (formData.bio.length > 160) {
      Alert.alert('Error', 'Bio cannot exceed 160 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    const updateData: any = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      username: formData.username.trim(),
      location: formData.location.trim(),
      bio: formData.bio.trim(),
    }

    // Note: Email changes typically require verification, so it might be handled separately
    // If the API supports email updates here, uncomment the line below
    // updateData.email = formData.email.trim()

    // If image was selected, add it to FormData
    if (selectedImageUri) {
      const formDataToSend = new FormData()
      Object.keys(updateData).forEach(key => {
        formDataToSend.append(key, updateData[key])
      })
      formDataToSend.append('profile_picture_file', {
        uri: selectedImageUri,
        type: 'image/jpeg',
        name: 'profile_picture.jpg',
      } as any)
      updateProfileMutation.mutate(formDataToSend)
    } else {
      updateProfileMutation.mutate(updateData)
    }
  }

  const handleImageChange = () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    }

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return
      }
      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage)
        return
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0]
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image size must be less than 5MB')
          return
        }
        if (asset.uri) {
          setSelectedImageUri(asset.uri)
          setFormData(prev => ({
            ...prev,
            profile_picture_file: asset.uri || ''
          }))
        }
      }
    })
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <User size={20} color={PrimaryBlue} />
          <Text style={styles.headerTitle}>Account</Text>
        </View>
        {!isEditMode && (
          <TouchableOpacity onPress={handleEdit}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity
              onPress={isEditMode ? handleImageChange : undefined}
              disabled={!isEditMode}
              activeOpacity={isEditMode ? 0.7 : 1}
            >
              {selectedImageUri || formData.profile_picture_file ? (
                <Image
                  source={{ uri: selectedImageUri || formData.profile_picture_file }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={[styles.profilePicture, { backgroundColor: profileData.color }]}>
                  {/* <User size={50} color="#FFFFFF" /> */}
                  <Text style={styles.initials}>{profileData.first_name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
            {isEditMode && (
              <TouchableOpacity onPress={handleImageChange}>
                <Text style={styles.uploadHint}>
                  Click to upload profile image (max 5MB)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Input Fields */}
          <View style={styles.fieldsContainer}>
            {/* First Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.first_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
                editable={isEditMode}
                placeholderTextColor={PrimaryGrey}
                placeholder='First Name'
              />
            </View>

            {/* Last Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
                editable={isEditMode}
                placeholderTextColor={PrimaryGrey}
                placeholder='Last Name'
              />
            </View>

            {/* Username */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                editable={isEditMode}
                placeholderTextColor={PrimaryGrey}
                placeholder='Username'
                autoCapitalize="none"
              />
              <Text style={styles.usernameHint}>
                Username must be unique and only contain letters, numbers, and underscores.
              </Text>
            </View> */}

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.input, { opacity: 0.7 }]}
                value={formData.email}
                editable={false}
                placeholderTextColor={PrimaryGrey}
                placeholder='Email'
              />
            </View>




            {/* Location */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Location</Text>
              <View style={styles.locationInputContainer}>
                {/* <MapPin size={16} color={PrimaryGrey} style={styles.locationIcon} /> */}
                <TextInput
                  style={[styles.input, styles.locationInput]}
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                  editable={isEditMode}
                  placeholderTextColor={PrimaryGrey}
                  placeholder='Location'
                />
              </View>
            </View>

            {/* Bio */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={formData.bio}
                onChangeText={(text) => {
                  if (text.length <= 160) {
                    setFormData(prev => ({ ...prev, bio: text }))
                  }
                }}
                editable={isEditMode}
                multiline
                numberOfLines={4}
                placeholderTextColor={'#9CA3AF'}
                textAlignVertical="top"
                placeholder='Passionate about making a difference through strategic giving.'
              />
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {formData.bio.length}/160
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {isEditMode && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={updateProfileMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  editButton: {
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    color: PrimaryBlue,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profilePictureContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 500,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    overflow: 'hidden',
  },
  uploadHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 40,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    margin: 0,
  },
  initials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fieldsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  input: {
    backgroundColor: LightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
    color: PrimaryGrey,
    minHeight: 40,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  usernameHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  characterCountText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: SecondaryGrey,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: PrimaryBlue,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#FFFFFF',
  },
})

