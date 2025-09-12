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
  Alert,
  Modal,
  TouchableWithoutFeedback
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Users, ChevronRight, Trash2, Plus, Menu, Share2, Search } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import MainHeaderNav from '../components/MainHeaderNav'
import { useToast } from '../contexts/ToastContext'
import { Edit2 } from 'lucide-react-native'
import { X } from 'lucide-react-native'

// Define the Cause type
type Cause = {
  id: string;
  name: string;
  avatar: string;
};

// Sample data for causes
const currentlySupporting: Cause[] = [
  { id: "1", name: "Red Cross", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: "2", name: "St. Judes", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: "3", name: "Community First", avatar: "https://randomuser.me/api/portraits/men/65.jpg" },
  { id: "4", name: "Make a Wish", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
  { id: "5", name: "Planned", avatar: "https://randomuser.me/api/portraits/men/12.jpg" },
  { id: "6", name: "Made with Love", avatar: "https://randomuser.me/api/portraits/women/22.jpg" }
];

const previouslySupported: Cause[] = [
  { id: "7", name: "W.H. Initiative", avatar: "https://randomuser.me/api/portraits/men/23.jpg" },
  { id: "8", name: "Global Relief", avatar: "https://randomuser.me/api/portraits/women/24.jpg" },
  { id: "9", name: "Food for All", avatar: "https://randomuser.me/api/portraits/men/25.jpg" },
  { id: "10", name: "Hope Foundation", avatar: "https://randomuser.me/api/portraits/women/26.jpg" },
  { id: "11", name: "Shelter Now", avatar: "https://randomuser.me/api/portraits/men/27.jpg" },
  { id: "12", name: "Clean Water Project", avatar: "https://randomuser.me/api/portraits/women/28.jpg" }
];

// Sample data for all available causes
const allAvailableCauses: Cause[] = [
  { id: "13", name: "Save the Children", avatar: "https://randomuser.me/api/portraits/men/29.jpg" },
  { id: "14", name: "UNICEF", avatar: "https://randomuser.me/api/portraits/women/30.jpg" },
  { id: "15", name: "World Food Program", avatar: "https://randomuser.me/api/portraits/men/31.jpg" },
  { id: "16", name: "Doctors Without Borders", avatar: "https://randomuser.me/api/portraits/women/32.jpg" },
  { id: "17", name: "Habitat for Humanity", avatar: "https://randomuser.me/api/portraits/men/33.jpg" },
  { id: "18", name: "Ocean Cleanup", avatar: "https://randomuser.me/api/portraits/women/34.jpg" }
];

export default function ManageCRWD() {
  const navigation = useNavigation()
  const { showToast } = useToast()
  
  const [editingField, setEditingField] = useState<string | null>(null)
  const [currentModal, setCurrentModal] = useState<'current' | 'previous' | null>(null)
  const [currentlySupportingList, setCurrentlySupportingList] = useState(currentlySupporting)
  const [previouslySupportedList, setPreviouslySupportedList] = useState(previouslySupported)
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddCauses, setShowAddCauses] = useState(false)

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

  const handleRemoveFromCurrently = (org: Cause) => {
    setCurrentlySupportingList(prev => prev.filter(item => item.id !== org.id))
    setPreviouslySupportedList(prev => [...prev, org])
    setCurrentModal(null)
    showToast(`Removed ${org.name} from currently supporting`)
  }

  const handleAddToCurrent = (org: Cause) => {
    setPreviouslySupportedList(prev => prev.filter(item => item.id !== org.id))
    setCurrentlySupportingList(prev => [...prev, org])
    setCurrentModal(null)
    showToast(`Added ${org.name} to currently supporting`)
  }

  const handleAddNewCause = (cause: Cause) => {
    if (!currentlySupportingList.some(item => item.id === cause.id)) {
      setCurrentlySupportingList(prev => [...prev, cause])
      showToast(`Added ${cause.name} to currently supporting`)
    }
    setShowAddCauses(false)
  }

  const filteredCauses = allAvailableCauses.filter(cause => 
    cause.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !currentlySupportingList.some(item => item.id === cause.id) &&
    !previouslySupportedList.some(item => item.id === cause.id)
  )

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
                  <Plus size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <ChevronLeft size={16} color="white" />
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

  const renderCauseSection = (title: string, causes: Cause[], isPrevious: boolean = false) => {
    return (
      <View style={styles.causeSection}>
        <View style={styles.causeSectionHeader}>
          <Text style={styles.causeSectionTitle}>{title}</Text>
          <View style={styles.headerButtons}>
            {!isPrevious && (
              <TouchableOpacity 
                onPress={() => setShowAddCauses(true)}
                style={[styles.chevronButton, styles.addButtonStyle]}
              >
                <Plus size={20} color={PrimaryGrey} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setCurrentModal(isPrevious ? 'previous' : 'current')}
              style={styles.chevronButton}
            >
              <ChevronRight size={20} color={PrimaryGrey} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.causesContainer}>
          {causes.map((cause) => (
            <View key={cause.id} style={[styles.causeItem, isPrevious && styles.previousCauseItem]}>
              <Image source={{ uri: cause.avatar }} style={styles.causeAvatar} />
              <Text style={[styles.causeName, isPrevious && styles.previousCauseName]}>{cause.name}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderModal = () => {
    const isCurrentModal = currentModal === 'current'
    const data = isCurrentModal ? currentlySupportingList : previouslySupportedList
    const title = isCurrentModal ? 'Manage Currently Supporting' : 'Manage Previously Supported'
    
    return (
      <Modal
        visible={currentModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCurrentModal(null)}
      >
        <TouchableWithoutFeedback onPress={() => setCurrentModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{title}</Text>
                  <TouchableOpacity onPress={() => setCurrentModal(null)}>
                    <X size={24} color="#374151" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalList}>
                  {data.map((org) => (
                    <View key={org.id} style={styles.modalItem}>
                      <View style={styles.modalItemInfo}>
                        <Image source={{ uri: org.avatar }} style={styles.modalAvatar} />
                        <Text style={styles.modalItemName}>{org.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.modalButton,
                          isCurrentModal ? styles.removeButton : styles.addButton
                        ]}
                        onPress={() => isCurrentModal ? handleRemoveFromCurrently(org) : handleAddToCurrent(org)}
                      >
                        <Text style={styles.modalButtonText}>
                          {isCurrentModal ? 'Remove' : 'Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  const renderAddCausesModal = () => {
    return (
      <Modal
        visible={showAddCauses}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCauses(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddCauses(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Causes</Text>
                  <TouchableOpacity onPress={() => setShowAddCauses(false)}>
                    <X size={24} color="#374151" />
                  </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                  <Search size={20} color={PrimaryGrey} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search causes..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={PrimaryGrey}
                  />
                </View>
                <ScrollView style={styles.modalList}>
                  {filteredCauses.map((cause) => (
                    <View key={cause.id} style={styles.modalItem}>
                      <View style={styles.modalItemInfo}>
                        <Image source={{ uri: cause.avatar }} style={styles.modalAvatar} />
                        <Text style={styles.modalItemName}>{cause.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.addButton]}
                        onPress={() => handleAddNewCause(cause)}
                      >
                        <Text style={styles.modalButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {filteredCauses.length === 0 && (
                    <Text style={styles.noResultsText}>No causes found</Text>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
                <Edit2 size={12} color="white" />
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

          {/* Causes Sections */}
          {renderCauseSection('Currently supporting', currentlySupportingList)}
          {renderCauseSection('Previously Supported', previouslySupportedList, true)}

          {/* Management Options */}
          {/* <View style={styles.managementSection}>
           
            
            {renderManagementOption(
              Users,
              'Manage Members',
              'View and manage CRWD members',
              () => Alert.alert('Manage Members', 'Member management feature coming soon!')
            )}
            
            {renderManagementOption(
              Menu,
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
          </View> */}
        </ScrollView>
      </KeyboardAvoidingView>

      {renderModal()}
      {renderAddCausesModal()}
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
  causeSection: {
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  causeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  causeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronButton: {
    padding: 4,
  },
  addButtonStyle: {
   // backgroundColor: '#dcfce7',
  },
  causesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previousCauseItem: {
    backgroundColor: '#f3f4f6',
  },
  causeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  causeName: {
    fontSize: 14,
    color: '#374151',
  },
  previousCauseName: {
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalList: {
    paddingHorizontal: 20,
    paddingBottom:35,
    paddingTop:15
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  modalButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeButton: {
    backgroundColor: '#fee2e2',
  },
  addButton: {
    backgroundColor: '#dcfce7',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  noResultsText: {
    textAlign: 'center',
    color: PrimaryGrey,
    fontSize: 16,
    marginTop: 20,
  },
});
