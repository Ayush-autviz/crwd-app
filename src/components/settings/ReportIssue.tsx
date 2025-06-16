import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../../Constants/Colors'
import { AlertCircle, ChevronDown, Info, MessageSquare } from 'lucide-react-native'
// import { Picker } from '@react-native-picker/picker'

export default function ReportIssue() {
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    steps: "",
    email: "",
  })

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show success message (you can use a toast library or Alert)
    //   alert("Your report has been submitted successfully. We'll review it shortly.")
      
      // Reset form
      setFormData({
        type: "",
        title: "",
        description: "",
        steps: "",
        email: "",
      })
    } catch (error) {
    //   alert("Failed to submit report. Please try again.")
    } finally {
      setLoading(false)
    }
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
      title: "",
      description: "",
      steps: "",
      email: "",
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} post={false} menu={false} />
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
                {formData.type ? formData.type : "Select issue type"}
              </Text>
              <ChevronDown size={20} color={PrimaryGrey} />
            </TouchableOpacity>
            
            {showPicker && (
              <View style={styles.pickerContainer}>
                {/* <Picker
                  selectedValue={formData.type}
                  onValueChange={(itemValue) => {
                    handleChange("type", itemValue)
                    setShowPicker(false)
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select issue type" value="" />
                  <Picker.Item label="Bug" value="Bug" />
                  <Picker.Item label="Feature Request" value="Feature Request" />
                  <Picker.Item label="Security Issue" value="Security Issue" />
                  <Picker.Item label="Other" value="Other" />
                </Picker> */}
                <TouchableOpacity 
                  style={styles.pickerDoneButton}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => handleChange("title", text)}
              placeholder="Brief description of the issue"
              placeholderTextColor={PrimaryGrey}
            />
          </View>
          
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
          
          <View style={styles.formGroup}>
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
          </View>
          
          <View style={styles.formGroup}>
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
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
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
            <Text style={styles.tipItem}>• Include steps to reproduce the problem</Text>
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
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 20,
    lineHeight: 20,
  },
  form: {
    gap: 15,
  },
  formGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    // color: PrimaryGrey,
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
    color: 'black',
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
    fontWeight: '500',
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
    fontWeight: '500',
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
    // color: PrimaryGrey,
    fontWeight: '500',
    fontSize: 14,
  },
  tipsContainer: {
    backgroundColor: LightGrey,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  tipsList: {
    gap: 5,
  },
  tipItem: {
    fontSize: 13,
    color: PrimaryGrey,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  }
});