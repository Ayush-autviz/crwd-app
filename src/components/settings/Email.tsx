import React, { useState } from 'react'
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryBlue, PrimaryGrey, SecondaryBlue, SecondaryGrey } from '../../Constants/Colors'
import { Mail } from 'lucide-react-native'
import { useMutation } from '@tanstack/react-query'
import { updateEmail, updateEmailVerification } from '../../services/api/auth'
import { useToast } from '../../contexts/ToastContext'
import { useNavigation } from '@react-navigation/native'

export default function Email() {
  const { showToast } = useToast()
  const navigation = useNavigation()
  const [formData, setFormData] = useState({
    newEmail: '',
    confirmEmail: '',
  })
  const [errors, setErrors] = useState({
    newEmail: '',
    confirmEmail: '',
  })
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otp, setOtp] = useState('')

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required'
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return ''
  }

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: updateEmail,
    onSuccess: (response) => {
      console.log('Update email successful:', response)
      setShowOTPModal(true)
      showToast('Verification code sent to your new email!', 'success' as any)
    },
    onError: (error: any) => {
      console.error('Update email error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update email'
      showToast(errorMessage, 'error' as any)
    },
  })

  // Update email verification mutation
  const updateEmailVerificationMutation = useMutation({
    mutationFn: updateEmailVerification,
    onSuccess: (response) => {
      console.log('Email verification successful:', response)
      showToast('Email updated and verified successfully!', 'success' as any)
      setShowOTPModal(false)
      setOtp('')
      setFormData({
        newEmail: '',
        confirmEmail: '',
      })
      navigation.navigate('DrawerNav', {screen: 'Settings'} as never)
    },
    onError: (error: any) => {
      console.error('Email verification error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed'
      showToast(errorMessage, 'error' as any)
    },
  })

  const handleSubmit = async () => {
    setErrors({
      newEmail: '',
      confirmEmail: '',
    })

    // Validate emails
    const newEmailError = validateEmail(formData.newEmail)
    const confirmEmailError = validateEmail(formData.confirmEmail)

    if (newEmailError) {
      setErrors((prev) => ({ ...prev, newEmail: newEmailError }))
      return
    }

    if (confirmEmailError) {
      setErrors((prev) => ({ ...prev, confirmEmail: confirmEmailError }))
      return
    }

    // Validate email confirmation
    if (formData.newEmail !== formData.confirmEmail) {
      setErrors((prev) => ({
        ...prev,
        confirmEmail: 'Email addresses do not match',
      }))
      return
    }

    updateEmailMutation.mutate({
      new_email: formData.newEmail,
    })
  }

  const handleOTPVerification = () => {
    if (otp.length === 6) {
      updateEmailVerificationMutation.mutate({
        verification_code: otp,
      })
    } else {
      showToast('Please enter a valid verification code', 'error' as any)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show={true} title={'Change Email'} menu={false} />
      <ScrollView style={{ paddingHorizontal: 20, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Mail size={20} color={PrimaryBlue} />
          <Text style={{ fontSize: 20, fontWeight: '600' }}>Change Email</Text>
        </View>
        <Text style={{ fontSize: 14, color: PrimaryGrey, marginBottom: 20 }}>
          Update your email address. You'll need to verify your new email address after the change.
        </Text>
        
        {/* New Email */}
        <Text style={{ fontSize: 14, marginBottom: 10, fontWeight: '500' }}>New Email</Text>
        <TextInput 
          style={{ 
            borderColor: errors.newEmail ? '#ef4444' : SecondaryGrey, 
            borderWidth: 1, 
            borderRadius: 10, 
            padding: 15, 
            marginBottom: 10,
            fontSize: 16
          }}
          placeholder="Enter new email address"
          placeholderTextColor={PrimaryGrey}
          value={formData.newEmail}
          onChangeText={(value) => handleInputChange('newEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.newEmail && (
          <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>
            {errors.newEmail}
          </Text>
        )}
        
        {/* Confirm Email */}
        <Text style={{ fontSize: 14, marginBottom: 10, fontWeight: '500' }}>Confirm New Email</Text>
        <TextInput 
          style={{ 
            borderColor: errors.confirmEmail ? '#ef4444' : SecondaryGrey, 
            borderWidth: 1, 
            borderRadius: 10, 
            padding: 15, 
            marginBottom: 10,
            fontSize: 16
          }}
          placeholder="Confirm new email address"
          placeholderTextColor={PrimaryGrey}
          value={formData.confirmEmail}
          onChangeText={(value) => handleInputChange('confirmEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.confirmEmail && (
          <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>
            {errors.confirmEmail}
          </Text>
        )}
        
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 20 }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: updateEmailMutation.isPending ? '#9ca3af' : PrimaryBlue, 
              paddingVertical: 15, 
              paddingHorizontal: 20, 
              borderRadius: 10,
              flex: 1
            }}
            onPress={handleSubmit}
            disabled={updateEmailMutation.isPending}
          >
            {updateEmailMutation.isPending ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="white" />
                <Text style={{ color: 'white', textAlign: 'center', marginLeft: 8 }}>
                  Updating...
                </Text>
              </View>
            ) : (
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                Update Email
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOTPModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOTPModal(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: 20
        }}>
          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 15, 
            padding: 20, 
            width: '100%',
            maxWidth: 400
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' }}>
              Verify Email
            </Text>
            <Text style={{ fontSize: 14, color: PrimaryGrey, marginBottom: 20, textAlign: 'center' }}>
              Enter the 6-digit verification code sent to {formData.newEmail}
            </Text>
            
            <TextInput
              style={{
                borderColor: SecondaryGrey,
                borderWidth: 1,
                borderRadius: 10,
                padding: 15,
                marginBottom: 20,
                fontSize: 18,
                textAlign: 'center',
                letterSpacing: 4
              }}
              placeholder="000000"
              placeholderTextColor={PrimaryGrey}
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="numeric"
              maxLength={6}
            />
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: updateEmailVerificationMutation.isPending ? '#9ca3af' : PrimaryBlue, 
                  paddingVertical: 15, 
                  paddingHorizontal: 20, 
                  borderRadius: 10,
                  flex: 1
                }}
                onPress={handleOTPVerification}
                disabled={updateEmailVerificationMutation.isPending || otp.length !== 6}
              >
                {updateEmailVerificationMutation.isPending ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={{ color: 'white', textAlign: 'center', marginLeft: 8 }}>
                      Verifying...
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                    Verify
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ 
                  paddingVertical: 15, 
                  paddingHorizontal: 20, 
                  borderRadius: 10, 
                  borderColor: SecondaryGrey, 
                  borderWidth: 1,
                  flex: 1
                }}
                onPress={() => setShowOTPModal(false)}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}