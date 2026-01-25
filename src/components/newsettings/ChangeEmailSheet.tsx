import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { PrimaryGrey, PrimaryBlue, SecondaryGrey } from '../../Constants/Colors'
import { useMutation } from '@tanstack/react-query'
import { updateEmail, updateEmailVerification } from '../../services/api/auth'
import { useToast } from '../../contexts/ToastContext'

interface ChangeEmailSheetProps {
  bottomSheetRef: React.RefObject<any>
}

export default function ChangeEmailSheet({ bottomSheetRef }: ChangeEmailSheetProps) {
  const { showToast } = useToast()
  const screenHeight = Dimensions.get('window').height
  const snapPoints = useMemo(() => [screenHeight * 0.75], [screenHeight])

  const [emailData, setEmailData] = useState({
    newEmail: '',
    confirmEmail: '',
  })
  const [emailErrors, setEmailErrors] = useState({
    newEmail: '',
    confirmEmail: '',
  })
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otp, setOtp] = useState('')

  const updateEmailMutation = useMutation({
    mutationFn: updateEmail,
    onSuccess: () => {
      showToast('Verification code sent to your new email!', 3000)
      setShowOTPModal(true)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update email'
      showToast(errorMessage, 3000)
    },
  })

  const updateEmailVerificationMutation = useMutation({
    mutationFn: updateEmailVerification,
    onSuccess: () => {
      showToast('Email updated and verified successfully!', 3000)
      setShowOTPModal(false)
      setOtp('')
      setEmailData({ newEmail: '', confirmEmail: '' })
      bottomSheetRef.current?.close()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed'
      showToast(errorMessage, 3000)
    },
  })

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required'
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return ''
  }

  const handleEmailSubmit = () => {
    setEmailErrors({ newEmail: '', confirmEmail: '' })

    const newEmailError = validateEmail(emailData.newEmail)
    if (newEmailError) {
      setEmailErrors(prev => ({ ...prev, newEmail: newEmailError }))
      return
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      setEmailErrors(prev => ({ ...prev, confirmEmail: 'Email addresses do not match' }))
      return
    }

    updateEmailMutation.mutate({ new_email: emailData.newEmail })
  }

  const handleOTPVerification = () => {
    if (otp.length === 6) {
      updateEmailVerificationMutation.mutate({ verification_code: otp })
    } else {
      showToast('Please enter a valid verification code', 3000)
    }
  }

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  )

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'white' }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>Change Email</Text>
          <Text style={styles.bottomSheetSubtitle}>Update your email address. You'll need to verify your new email address after the change.</Text>
        </View>

        {/* New Email */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>New Email</Text>
          <TextInput
            style={[styles.input, styles.emailInput, emailErrors.newEmail && styles.inputError]}
            value={emailData.newEmail}
            onChangeText={(text) => setEmailData(prev => ({ ...prev, newEmail: text }))}
            placeholder="Enter new email address"
            placeholderTextColor={PrimaryGrey}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailErrors.newEmail && (
            <Text style={styles.errorText}>{emailErrors.newEmail}</Text>
          )}
        </View>

        {/* Confirm Email */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Confirm New Email</Text>
          <TextInput
            style={[styles.input, styles.emailInput, emailErrors.confirmEmail && styles.inputError]}
            value={emailData.confirmEmail}
            onChangeText={(text) => setEmailData(prev => ({ ...prev, confirmEmail: text }))}
            placeholder="Confirm new email address"
            placeholderTextColor={PrimaryGrey}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailErrors.confirmEmail && (
            <Text style={styles.errorText}>{emailErrors.confirmEmail}</Text>
          )}
        </View>

        {/* Action Buttons */}
        {!showOTPModal && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.updateButton, updateEmailMutation.isPending && styles.buttonDisabled]}
              onPress={handleEmailSubmit}
              disabled={updateEmailMutation.isPending}
            >
              {updateEmailMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.updateButtonText}>Update Email</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => bottomSheetRef.current?.close()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* OTP Verification */}
        {showOTPModal && (
          <View style={styles.otpModal}>
            <Text style={styles.otpTitle}>Verify Email</Text>
            <Text style={styles.otpSubtitle}>Enter the 6-digit verification code sent to {emailData.newEmail}</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={PrimaryGrey}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="numeric"
              maxLength={6}
            />
            <View style={styles.otpButtons}>
              <TouchableOpacity
                style={[styles.updateButton, (updateEmailVerificationMutation.isPending || otp.length !== 6) && styles.buttonDisabled]}
                onPress={handleOTPVerification}
                disabled={updateEmailVerificationMutation.isPending || otp.length !== 6}
              >
                {updateEmailVerificationMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowOTPModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  bottomSheetHeader: {
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: PrimaryGrey,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
    color: '#111827',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 10,
    padding: 15,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  actionButtonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  updateButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#111827',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  otpModal: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  otpTitle: {
    fontSize: 18,
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 20,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
  },
  otpButtons: {
    gap: 12,
  },
})

