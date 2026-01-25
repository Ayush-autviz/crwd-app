import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert } from 'react-native'
import React, { useState } from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../../Constants/Colors'
import { ChevronDown, Info, MessageSquare } from 'lucide-react-native'
import { useMutation } from '@tanstack/react-query'
import { reportIssue } from '../../services/api/social'
import { useToast } from '../../contexts/ToastContext'

const issueTypes = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'security', label: 'Security Issue' },
  { value: 'other', label: 'Other' }
]

export default function ReportIssue() {
  const { showToast } = useToast()
  const [showPicker, setShowPicker] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    title: "No title",
    description: "",
    steps: "No steps",
    // email: "",
  })

  // Report issue mutation
  const reportIssueMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      issue_type: string;
      status: string;
      reproduce_steps: string;
    }) => reportIssue(data),
    onSuccess: () => {
      showToast("Your report has been submitted successfully. We'll review it shortly.", 3000)
      // Reset form
      setFormData({
        type: "",
        title: "No title",
        description: "",
        steps: "No steps",
        // email: "",
      })
    },
    onError: (error: any) => {
      console.error('Error submitting report:', error)
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit report. Please try again."
      showToast(errorMessage, 3000)
    },
  })

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.type || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields (Type and Description).')
      return
    }

    // Prepare payload according to API requirements
    const payload = {
      title: 'no title',
      description: formData.description,
      issue_type: formData.type,
      status: "pending",
      reproduce_steps: 'no steps',
    }

    console.log(payload, 'payload')

    reportIssueMutation.mutate(payload)
  }

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const clearForm = () => {
    setFormData({
      type: "",
      title: "No title",
      description: "",
      steps: "No steps",
      // email: "",
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} title={'Report an Issue'} menu={false} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          {/* <MessageSquare size={24} color={PrimaryBlue} /> */}
          <Text style={styles.title}>Report an Issue</Text>
        </View>

        <Text style={styles.subtitle}>
          Help us improve CRWD by reporting any issues you encounter or providing feedback.
        </Text>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Issue Type</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={formData.type ? styles.selectText : styles.placeholderText}>
                {formData.type ? (issueTypes.find(t => t.value === formData.type)?.label || formData.type) : "Select issue type"}
              </Text>
              <ChevronDown size={20} color={PrimaryGrey} />
            </TouchableOpacity>

            <Modal
              visible={showPicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowPicker(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowPicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Issue Type</Text>
                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                      <Text style={styles.modalCloseText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  {issueTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.modalOption,
                        formData.type === type.value && styles.modalOptionSelected
                      ]}
                      onPress={() => {
                        handleChange("type", type.value)
                        setShowPicker(false)
                      }}
                    >
                      <Text style={[
                        styles.modalOptionText,
                        formData.type === type.value && styles.modalOptionTextSelected
                      ]}>
                        {type.label}
                      </Text>
                      {formData.type === type.value && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          {/* <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => handleChange("title", text)}
              placeholder="Brief description of the issue"
              placeholderTextColor={PrimaryGrey}
            />
          </View> */}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
              placeholder="Please provide a detailed description of the issue"
              placeholderTextColor={PrimaryGrey}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* <View style={styles.formGroup}>
            <Text style={styles.label}>Steps to Reproduce</Text>
            <TextInput
              style={styles.textArea}
              value={formData.steps}
              onChangeText={(text) => handleChange("steps", text)}
              placeholder="1. First step&#10;2. Second step&#10;3. And so on..."
              placeholderTextColor={PrimaryGrey}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View> */}

          {/* <View style={styles.formGroup}>
            <Text style={styles.label}>Your Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="We'll use this to follow up with you"
              placeholderTextColor={PrimaryGrey}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View> */}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                reportIssueMutation.isPending && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={reportIssueMutation.isPending}
            >
              {reportIssueMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearForm}
            >
              <Text style={styles.clearButtonText}>Clear Form</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for Submitting a Good Report</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Be specific and provide clear details about the issue</Text>
            {/* <Text style={styles.tipItem}>• Include steps to reproduce the problem</Text> */}
            <Text style={styles.tipItem}>• Add screenshots or screen recordings if relevant</Text>
            <Text style={styles.tipItem}>• Mention your device model and OS version</Text>
            <Text style={styles.tipItem}>• Check if the issue has already been reported</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: 'Outfit-Regular',
  },
  form: {
    gap: 15,
  },
  formGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    marginBottom: 8,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: 'black',
  },
  textArea: {
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    color: 'black',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  placeholderText: {
    fontSize: 14,
    color: PrimaryGrey,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 8,
    marginTop: 5,
  },
  picker: {
    height: 150,
  },
  pickerDoneButton: {
    backgroundColor: PrimaryBlue,
    padding: 10,
    alignItems: 'center',
  },
  pickerDoneText: {
    color: 'white',
    fontFamily: 'Outfit-Medium',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: SecondaryGrey,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#374151',
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
  },
  submitButtonDisabled: {
    opacity: 0.6,
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
    paddingBottom: 40,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightGrey,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 16,
    color: PrimaryBlue,
    fontFamily: 'Outfit-Medium',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightGrey,
  },
  modalOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  modalOptionTextSelected: {
    color: PrimaryBlue,
    fontFamily: 'Outfit-Medium',
  },
  checkmark: {
    fontSize: 18,
    color: PrimaryBlue,
    fontFamily: 'Outfit-SemiBold',
  },
  tipsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 8,
    color: '#111827',
  },
  tipsList: {
    gap: 5,
  },
  tipItem: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    fontFamily: 'Outfit-Regular',
  },
  bottomPadding: {
    height: 40,
  }
});