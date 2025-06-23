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
import { ArrowLeft, Edit2, Check, X, Camera, MapPin, ChevronLeft, Users, Settings, Trash2 } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import MainHeaderNav from '../components/MainHeaderNav'

export default function ManageCRWD() {
  const navigation = useNavigation()
  
  const [editingField, setEditingField] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "Feed the hungry",
    username: "feedthehungry",
    location: "Atlanta, GA",
    description: "Supporting families experiencing food insecurity in the greater Atlanta area",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  })
  const [tempData, setTempData] = useState({
    name: "Feed the hungry",
    username: "feedthehungry", 
    location: "Atlanta, GA",
    description: "Supporting families experiencing food insecurity in the greater Atlanta area"
  })

  const handleEdit = (field: string) => {
    setEditingField(field)
    setTempData(prev => ({ ...prev, [field]: formData[field as keyof typeof formData] }))
  }

  const handleSave = (field: string) => {
    const value = tempData[field as keyof typeof tempData]

    // Basic validation
    if (field === 'name' && !value.trim()) {
      Alert.alert('Error', 'CRWD name cannot be empty')
      return
    }

    if (field === 'username' && value.trim() && !value.trim().match(/^[a-zA-Z0-9_]+$/)) {
      Alert.alert('Error', 'Username should only contain letters, numbers, and underscores')
      return
    }

    setFormData(prev => ({ ...prev, [field]: value }))
    setEditingField(null)
    Alert.alert('Success', 'CRWD updated successfully!')
  }

  const handleCancel = () => {
    setEditingField(null)
    setTempData({
      name: formData.name,
      username: formData.username,
      location: formData.location,
      description: formData.description
    })
  }

  const handleImageChange = () => {
    Alert.alert(
      'Change CRWD Picture',
      'Image picker functionality will be implemented with proper image library setup.',
      [{ text: 'OK' }]
    )
  }

  const handleDeleteCRWD = () => {
    Alert.alert(
      'Delete CRWD',
      'Are you sure you want to delete this CRWD? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('CRWD Deleted', 'Your CRWD has been deleted successfully.')
            navigation.goBack()
          }
        }
      ]
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

  const renderManagementOption = (icon: any, title: string, subtitle: string, onPress: () => void, isDestructive = false) => {
    const IconComponent = icon
    return (
      <TouchableOpacity style={styles.managementOption} onPress={onPress}>
        <View style={styles.managementOptionContent}>
          <View style={[styles.managementIcon, isDestructive && styles.destructiveIcon]}>
            <IconComponent size={20} color={isDestructive ? '#ef4444' : PrimaryBlue} />
          </View>
          <View style={styles.managementText}>
            <Text style={[styles.managementTitle, isDestructive && styles.destructiveText]}>{title}</Text>
            <Text style={styles.managementSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <ChevronLeft size={16} color={PrimaryGrey} style={{ transform: [{ rotate: '180deg' }] }} />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} menu={false} post={false} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* CRWD Picture Section */}
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
              <Text style={styles.editPictureText}>Edit CRWD picture</Text>
            </TouchableOpacity>
          </View>

          {/* Editable Fields */}
          <View style={styles.fieldsContainer}>
            {renderField('name', 'CRWD Name', formData.name)}
            {renderField('username', 'Username', formData.username)}
            {renderField('location', 'Location', formData.location)}
            {renderField('description', 'Description', formData.description, true)}
          </View>

          {/* Management Options */}
          <View style={styles.managementSection}>
            <Text style={styles.sectionTitle}>Management</Text>
            
            {renderManagementOption(
              Users,
              'Manage Members',
              'View and manage CRWD members',
              () => Alert.alert('Manage Members', 'Member management feature coming soon!')
            )}
            
            {renderManagementOption(
              Settings,
              'CRWD Settings',
              'Privacy, notifications, and more',
              () => Alert.alert('CRWD Settings', 'Settings feature coming soon!')
            )}
            
            {renderManagementOption(
              Trash2,
              'Delete CRWD',
              'Permanently delete this CRWD',
              handleDeleteCRWD,
              true
            )}
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
    marginBottom: 30,
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
  managementSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  managementOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  managementOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  managementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#fef2f2',
  },
  managementText: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#ef4444',
  },
  managementSubtitle: {
    fontSize: 14,
    color: PrimaryGrey,
  },
});
