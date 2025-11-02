import React, { useState, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, Edit2, Check, X, Camera, MapPin, ChevronLeft } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import MainHeaderNav from '../components/MainHeaderNav'
import { getUserProfileById } from '../services/api/social'
import { updateProfile } from '../services/api/auth'
import { useAuthStore } from '../store/store'
import { useToast } from '../contexts/ToastContext'
import * as ImagePicker from 'react-native-image-picker'

export default function ProfileEdit() {
  const navigation = useNavigation()
  const { user, setUser } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  
  const [editingField, setEditingField] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    location: "",
    bio: "",
    profile_picture_file: "https://randomuser.me/api/portraits/women/44.jpg"
  })
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [tempData, setTempData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    location: "",
    bio: ""
  })

  // Fetch current profile data
  const { data: profileData, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => getUserProfileById(user?.id?.toString() || ''),
    enabled: !!user?.id,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      // Update user in auth store with new profile picture if available
      if (response?.user?.profile_picture && user) {
        setUser({ ...user, profile_picture: response.user.profile_picture })
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      showToast('Profile updated successfully!', 3000)
    },
    onError: (error: any) => {
      showToast('Failed to update profile. Please try again.', 3000)
      console.error('Profile update error:', error)
    }
  })

  // Initialize form data when profile data is loaded
  useEffect(() => {
    if (profileData) {
      const fullName = profileData.first_name && profileData.last_name 
        ? `${profileData.first_name} ${profileData.last_name}` 
        : profileData.username || ''
      
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        username: profileData.username || '',
        location: profileData.location || '',
        bio: profileData.bio || '',
        profile_picture_file: profileData.profile_picture || ''
      })
      
      setTempData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        username: profileData.username || '',
        location: profileData.location || '',
        bio: profileData.bio || ''
      })
    }
  }, [profileData])

  const handleEdit = (field: string) => {
    setEditingField(field)
    setTempData(prev => ({ ...prev, [field]: formData[field as keyof typeof formData] }))
  }

  const handleSave = async (field: string) => {
    const value = tempData[field as keyof typeof tempData]

    // Basic validation
    if ((field === 'first_name' || field === 'last_name') && !value.trim()) {
      Alert.alert('Error', 'Name cannot be empty')
      return
    }

    if (field === 'username' && value.trim() && !value.trim().match(/^[a-zA-Z0-9_]+$/)) {
      Alert.alert('Error', 'Username should only contain letters, numbers, and underscores')
      return
    }

    // Update local state immediately for better UX
    setFormData(prev => ({ ...prev, [field]: value }))
    setEditingField(null)

    // Prepare update data
    const updateData: any = {}
    updateData[field] = value

    // Call API to update profile
    try {
      await updateProfileMutation.mutateAsync(updateData)
    } catch (error) {
      // Revert local state if API call fails
      setFormData(prev => ({ ...prev, [field]: formData[field as keyof typeof formData] }))
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setTempData({
      first_name: formData.first_name,
      last_name: formData.last_name,
      username: formData.username,
      location: formData.location,
      bio: formData.bio
    })
  }

  const handleImageChange = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
    }

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return
      }
      if (response.assets && response.assets[0]) {
        const uri = response.assets[0].uri
        if (uri) {
          setSelectedImageUri(uri)
          setFormData(prev => ({
            ...prev,
            profile_picture_file: uri
          }))
          // Update the profile with the new image
          handleImageSave(uri)
        }
      }
    })
  }

  const handleImageSave = async (imageUri: string) => {
    const formDataToSend = new FormData()
    
    formDataToSend.append('profile_picture_file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile_picture.jpg',
    } as any)

    try {
      await updateProfileMutation.mutateAsync(formDataToSend)
      showToast('Profile picture updated successfully!', 3000)
    } catch (error) {
      showToast('Failed to update profile picture. Please try again.', 3000)
    }
  }

  const renderField = (field: string, label: string, value: string, isTextarea = false) => {
    const isCurrentlyEditing = editingField === field
    const isSaving = updateProfileMutation.isPending

    return (
      <View style={[styles.fieldContainer, isTextarea && styles.textareaContainer]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldContent}>
          {isCurrentlyEditing ? (
            <View style={styles.editingContainer}>
              {isTextarea ? (
                <TextInput
                  style={[styles.textInput, styles.textareaInput]}
                  value={tempData[field as keyof typeof tempData]}
                  onChangeText={(text) => setTempData(prev => ({ ...prev, [field]: text }))}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  placeholderTextColor={PrimaryGrey}
                  multiline
                  autoFocus
                />
              ) : (
                <TextInput
                  style={styles.textInput}
                  value={tempData[field as keyof typeof tempData]}
                  onChangeText={(text) => setTempData(prev => ({ ...prev, [field]: text }))}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  placeholderTextColor={PrimaryGrey}
                  autoFocus
                />
              )}
              <View style={styles.editingButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton, isSaving && styles.disabledButton]}
                  onPress={() => handleSave(field)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size={16} color="white" />
                  ) : (
                    <Check size={16} color="white" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={isSaving}
                >
                  <X size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              <Text style={[styles.fieldValue, isTextarea && styles.textareaValue]}>
                {value || `No ${label.toLowerCase()} set`}
              </Text>
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={() => handleEdit(field)}
                disabled={isSaving}
              >
                <Edit2 size={16} color={isSaving ? '#9ca3af' : PrimaryGrey} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    )
  }

  // Show loading state
  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <MainHeaderNav show={true} menu={false} title={'Edit Profile'}/>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (profileError) {
    return (
      <SafeAreaView style={styles.container}>
        <MainHeaderNav show={true} menu={false} title={'Edit Profile'}/>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>
            Failed to load profile
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ 
              paddingHorizontal: 16, 
              paddingVertical: 8, 
              backgroundColor: '#374151', 
              borderRadius: 6 
            }}
          >
            <Text style={{ color: 'white' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} menu={false} title={'Edit Profile'}/>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Picture Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: formData.profile_picture_file }} 
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleImageChange}
              >
                <Camera size={12} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleImageChange}>
              <Text style={styles.editPictureText}>Edit picture</Text>
            </TouchableOpacity>
          </View>

          {/* Editable Fields */}
          <View style={styles.fieldsContainer}>
            {renderField('first_name', 'First Name', formData.first_name)}
            {renderField('last_name', 'Last Name', formData.last_name)}
            {renderField('username', 'Username', formData.username)}
            {renderField('location', 'Location', formData.location)}
            {renderField('bio', 'Bio', formData.bio, true)}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    backgroundColor: PrimaryBlue,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  editPictureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  fieldsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  textareaContainer: {
    alignItems: 'flex-start',
  },
  fieldLabel: {
    width: '30%',
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  fieldContent: {
    flex: 1,
    marginLeft: 12,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  textareaInput: {
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  editingButtons: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.6,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginRight: 8,
  },
  textareaValue: {
    lineHeight: 22,
  },
  editIconButton: {
    padding: 8,
  },
  urlSection: {
    marginTop: 10,
    marginBottom: 40,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlText: {
    fontSize: 14,
    color: PrimaryBlue,
  },
}) 