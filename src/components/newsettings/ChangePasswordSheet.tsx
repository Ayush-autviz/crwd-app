import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Platform } from 'react-native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetModal } from '@gorhom/bottom-sheet'
import { Eye, EyeOff } from 'lucide-react-native'
import { PrimaryGrey, PrimaryBlue, SecondaryGrey, LightGrey } from '../../Constants/Colors'
import { useMutation } from '@tanstack/react-query'
import { changePassword } from '../../services/api/auth'
import { useToast } from '../../contexts/ToastContext'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

interface ChangePasswordSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>
}

export default function ChangePasswordSheet({ bottomSheetRef }: ChangePasswordSheetProps) {
  const { showToast } = useToast()

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      showToast('Password updated successfully!', 3000)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' })
      bottomSheetRef.current?.dismiss()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password'
      showToast(errorMessage, 3000)
    },
  })

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters long'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
    return ''
  }

  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handlePasswordSubmit = () => {
    setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' })

    if (!passwordData.currentPassword) {
      setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is required' }))
      return
    }

    const newPasswordError = validatePassword(passwordData.newPassword)
    if (newPasswordError) {
      setPasswordErrors(prev => ({ ...prev, newPassword: newPasswordError }))
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return
    }

    changePasswordMutation.mutate({
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
    })
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
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      enableDynamicSizing={true}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'white' }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={styles.container}>
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Change Password</Text>
              <Text style={styles.bottomSheetSubtitle}>Update your password to keep your account secure.</Text>
            </View>

            {/* Current Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <View style={[styles.inputContainer, passwordErrors.currentPassword && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.current}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                  onFocus={() => setFocusedField('currentPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={focusedField === 'currentPassword' ? '' : 'Enter current password'}
                  placeholderTextColor={PrimaryGrey}
                />
                <TouchableOpacity onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}>
                  {showPasswords.current ? <Eye size={20} color={PrimaryGrey} /> : <EyeOff size={20} color={PrimaryGrey} />}
                </TouchableOpacity>
              </View>
              {passwordErrors.currentPassword && (
                <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={[styles.inputContainer, passwordErrors.newPassword && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.new}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                  onFocus={() => setFocusedField('newPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={focusedField === 'newPassword' ? '' : 'Enter new password'}
                  placeholderTextColor={PrimaryGrey}
                />
                <TouchableOpacity onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}>
                  {showPasswords.new ? <Eye size={20} color={PrimaryGrey} /> : <EyeOff size={20} color={PrimaryGrey} />}
                </TouchableOpacity>
              </View>
              {passwordErrors.newPassword && (
                <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <View style={[styles.inputContainer, passwordErrors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.confirm}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={focusedField === 'confirmPassword' ? '' : 'Confirm new password'}
                  placeholderTextColor={PrimaryGrey}
                />
                <TouchableOpacity onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}>
                  {showPasswords.confirm ? <Eye size={20} color={PrimaryGrey} /> : <EyeOff size={20} color={PrimaryGrey} />}
                </TouchableOpacity>
              </View>
              {passwordErrors.confirmPassword && (
                <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.requirementText}>At least 8 characters</Text>
              </View>
              <View style={styles.requirementItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.requirementText}>One uppercase letter</Text>
              </View>
              <View style={styles.requirementItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.requirementText}>One number</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.updateButton, changePasswordMutation.isPending && styles.buttonDisabled]}
                onPress={handlePasswordSubmit}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => bottomSheetRef.current?.dismiss()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 8,
  },
  bottomSheetHeader: {
    marginBottom: 24,
  },
  bottomSheetTitle: {
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
    fontFamily: 'Outfit-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 10,
    padding: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  requirementsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 16,
    color: PrimaryBlue,
    marginRight: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#111827',
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
})

