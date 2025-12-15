import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, Mail, RefreshCw, Eye, EyeOff } from 'lucide-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { useMutation } from '@tanstack/react-query'
import { resetPassword, forgotPassword } from '../services/api/auth'
import { useToast } from '../contexts/ToastContext'

export default function VerificationCode() {
  const navigation = useNavigation()
  const route = useRoute()
  const email = (route.params as any)?.email || 'your email'
  const { showToast } = useToast()
  
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const inputRefs = useRef<(TextInput | null)[]>([])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      console.log('Reset password successful:', response)
      showToast('Your password has been reset successfully!', 'success')
      navigation.navigate('Login' as never)
    },
    onError: (error: any) => {
      console.error('Reset password error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Password reset failed'
      showToast(errorMessage)
    },
  })

  // Resend code mutation
  const resendCodeMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      console.log('Resend code successful:', response)
      setTimeLeft(300) // Reset timer
      setCode(['', '', '', '', '', '']) // Clear current code
      showToast('A new verification code has been sent to your email.', 'success')
    },
    onError: (error: any) => {
      console.error('Resend code error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend code'
      showToast(errorMessage)
    },
  })

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return
    }
    
    if (value.length > 1) {
      return // Prevent multiple characters
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: any) => {
    const pastedData = e.nativeEvent.text?.slice(0, 6) || ''
    
    // Only allow numbers in pasted data
    const numericData = pastedData.replace(/\D/g, '').slice(0, 6)
    
    const newCode = numericData.split('').concat(Array(6).fill('')).slice(0, 6)
    setCode(newCode)

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(val => !val)
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async () => {
    const verificationCode = code.join('')

    if (verificationCode.length !== 6) {
      showToast('Please enter the complete verification code')
      return
    }

    if (!newPassword.trim()) {
      showToast('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match')
      return
    }

    resetPasswordMutation.mutate({
      email: email,
      confirmation_code: verificationCode,
      new_password: newPassword,
    })
  }

  const handleResendCode = async () => {
    resendCodeMutation.mutate({
      email: email,
    })
  }

  const isFormComplete = code.every(digit => digit !== '') && newPassword.trim() && confirmPassword.trim() && newPassword === confirmPassword

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('ForgotPassword' as never)}
              >
                <ArrowLeft size={16} color="#6b7280" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              {/* Title and Subtitle */}
              <View style={styles.header}>
                <Text style={styles.title}>Check your email</Text>
                <View style={styles.subtitleContainer}>
                  <Text style={styles.subtitle}>
                    We sent a verification code to
                  </Text>
                  <View style={styles.emailContainer}>
                    <Mail size={16} color="#9ca3af" />
                    <Text style={styles.emailText}>{email}</Text>
                  </View>
                </View>
              </View>

              {/* Verification Code Form */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.codeLabel}>Enter verification code</Text>
                  <View style={styles.codeInputsContainer}>
                    {code.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          inputRefs.current[index] = ref
                        }}
                        style={[
                          styles.codeInput,
                          digit ? styles.codeInputFilled : null
                        ]}
                        value={digit}
                        onChangeText={(value) => handleCodeChange(index, value)}
                        onKeyPress={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        keyboardType="numeric"
                        maxLength={1}
                        textAlign="center"
                        autoFocus={index === 0}
                      />
                    ))}
                  </View>
                </View>

                {/* New Password Fields */}
                <View style={styles.passwordSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      New Password <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Enter new password"
                        placeholderTextColor={PrimaryGrey}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff size={20} color={PrimaryGrey} />
                        ) : (
                          <Eye size={20} color={PrimaryGrey} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Confirm New Password <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Confirm new password"
                        placeholderTextColor={PrimaryGrey}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} color={PrimaryGrey} />
                        ) : (
                          <Eye size={20} color={PrimaryGrey} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (resetPasswordMutation.isPending || !isFormComplete) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={resetPasswordMutation.isPending || !isFormComplete}
                >
                  {resetPasswordMutation.isPending ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.loadingText}>Resetting password...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Reset password</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Resend Code */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  {timeLeft > 0 ? (
                    `Resend code in ${formatTime(timeLeft)}`
                  ) : (
                    "Didn't receive the code?"
                  )}
                </Text>

                {timeLeft === 0 && (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendCode}
                    disabled={resendCodeMutation.isPending}
                  >
                    {resendCodeMutation.isPending ? (
                      <View style={styles.resendButtonContent}>
                        <RefreshCw size={16} color="#111827" />
                        <Text style={styles.resendButtonText}>Sending...</Text>
                      </View>
                    ) : (
                      <View style={styles.resendButtonContent}>
                        <RefreshCw size={16} color="#111827" />
                        <Text style={styles.resendButtonText}>Resend code</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Check your spam folder if you don't see the email
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: '#9ca3af',
  },
  passwordSection: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    paddingRight: 48,
  },
  eyeButton: {
    padding: 12,
    position: 'absolute',
    right: 0,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  resendContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
})
