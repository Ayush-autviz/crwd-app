import React, { useState, useRef } from 'react'
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
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, Edit2, Check, X, Camera, MapPin, ChevronLeft } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import MainHeaderNav from '../components/MainHeaderNav'

export default function ProfileEdit() {
  const navigation = useNavigation()
  
  const [editingField, setEditingField] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "My Name is Mya",
    username: "myamakes_moves",
    location: "Atlanta, GA",
    bio: "This is a bio about Mya and how she likes to help others and give back to her community. She also loves ice cream.",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  })
  const [tempData, setTempData] = useState({
    name: "My Name is Mya",
    username: "myamakes_moves", 
    location: "Atlanta, GA",
    bio: "This is a bio about Mya and how she likes to help others and give back to her community. She also loves ice cream."
  })

  const handleEdit = (field: string) => {
    setEditingField(field)
    setTempData(prev => ({ ...prev, [field]: formData[field as keyof typeof formData] }))
  }

  const handleSave = (field: string) => {
    const value = tempData[field as keyof typeof tempData]

    // Basic validation
    if (field === 'name' && !value.trim()) {
      Alert.alert('Error', 'Name cannot be empty')
      return
    }

    if (field === 'username' && value.trim() && !value.trim().match(/^[a-zA-Z0-9_]+$/)) {
      Alert.alert('Error', 'Username should only contain letters, numbers, and underscores')
      return
    }

    setFormData(prev => ({ ...prev, [field]: value }))
    setEditingField(null)
    Alert.alert('Success', 'Profile updated successfully!')
  }

  const handleCancel = () => {
    setEditingField(null)
    setTempData({
      name: formData.name,
      username: formData.username,
      location: formData.location,
      bio: formData.bio
    })
  }

  const handleImageChange = () => {
    Alert.alert(
      'Change Profile Picture',
      'Image picker functionality will be implemented with proper image library setup.',
      [{ text: 'OK' }]
    )
  }

  const renderField = (field: string, label: string, value: string, isTextarea = false) => {
    const isCurrentlyEditing = editingField === field

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
                  style={[styles.editButton, styles.saveButton]}
                  onPress={() => handleSave(field)}
                >
                  <Check size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancel}
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
              >
                <Edit2 size={16} color={PrimaryGrey} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* <MainHeaderNav /> */}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft style={{fontWeight: '700'}} size={25}  strokeWidth={2.5} color="#111827" />
              {/* <Text style={styles.backText}>Back</Text> */}
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
          </View>

          {/* Profile Picture Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: formData.avatarUrl }} 
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
            {renderField('name', 'Name', formData.name)}
            {renderField('username', 'Username', formData.username)}
            {renderField('location', 'Location', formData.location)}
            {renderField('bio', 'Bio', formData.bio, true)}
          </View>

          {/* URL Section */}
          {/* <View style={styles.urlSection}>
            <View style={styles.urlContainer}>
              <MapPin size={16} color={PrimaryGrey} />
              <Text style={styles.urlText}>thisisaurl.com</Text>
            </View>
          </View> */}
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