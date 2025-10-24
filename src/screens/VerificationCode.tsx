import React, { useState, useEffect, useRef } from 'react'
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
  ActivityIndicator,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
// import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { useMutation } from '@tanstack/react-query'
import { resetPassword, forgotPassword } from '../services/api/auth'
import { useToast } from '../contexts/ToastContext'
import { Eye } from 'lucide-react-native'
import { EyeOff } from 'lucide-react-native'

export default function VerificationCode() {
  const navigation = useNavigation()
  const route = useRoute()
  const email = (route.params as any)?.email || ''
  const { showToast } = useToast()
  
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
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
      showToast('Your password has been reset successfully!', 'success' as any)
      navigation.navigate('Login' as never)
    },
    onError: (error: any) => {
      console.error('Reset password error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Password reset failed'
      showToast(errorMessage, 'error' as any)
    },
  })

  // Resend code mutation
  const resendCodeMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      console.log('Resend code successful:', response)
      setTimeLeft(300) // Reset timer
      setVerificationCode(['', '', '', '', '', '']) // Clear current code
      showToast('A new verification code has been sent to your email.', 'success' as any)
    },
    onError: (error: any) => {
      console.error('Resend code error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend code'
      showToast(errorMessage, 'error' as any)
    },
  })

  const handleCodeChange = (index: number, value: string) => {
    console.log(`handleCodeChange - index: ${index}, value: "${value}"`)
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      console.log('Rejected non-numeric input:', value)
      return
    }
    
    if (value.length > 1) {
      console.log('Rejected multi-character input:', value)
      return // Prevent multiple characters
    }

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)
    console.log('Updated code:', newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async () => {
    const code = verificationCode.join('')
    
    if (code.length !== 6) {
      showToast('Please enter the complete verification code', 'error' as any)
      return
    }

    if (!newPassword.trim()) {
      showToast('Please enter a new password', 'error' as any)
      return
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error' as any)
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error' as any)
      return
    }

    resetPasswordMutation.mutate({
      email: email.trim(),
      confirmation_code: code,
      new_password: newPassword,
    })
  }

  const resendCode = async () => {
    if (timeLeft > 0) {
      showToast(`Please wait ${formatTime(timeLeft)} before requesting a new code.`, 'error' as any)
      return
    }

    resendCodeMutation.mutate({
      email: email.trim(),
    })
  }

  const isFormComplete = verificationCode.every(digit => digit !== '') && newPassword.trim() && confirmPassword.trim() && newPassword === confirmPassword

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo and Header */}
          <View style={styles.header}>
            {/* <Image 
              source={require('../assets/logo/logo3.webp')} 
              style={styles.logo}
              resizeMode="contain"
            /> */}
            <Image source={require('../assets/logo/main.png')} style={{ resizeMode: 'contain', width: 100, height: 80 }} />
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Verification Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter verification code</Text>
              <View style={styles.codeInputsContainer}>
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref
                    }}
                    style={styles.codeInput}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(index, value)}
                    onKeyPress={(e) => handleKeyDown(index, e)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>
              
              {/* Timer and Resend */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                {timeLeft > 0 ? (
                  <Text style={styles.timerText}>
                    Resend in {formatTime(timeLeft)}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={resendCode} disabled={resendCodeMutation.isPending}>
                    <Text style={styles.resendLink}>
                      {resendCodeMutation.isPending ? 'Sending...' : 'Resend'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* New Password Fields */}
            <View style={styles.passwordSection}>
              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
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
                        {showNewPassword ? <EyeOff size={16} color={PrimaryGrey} /> : <Eye size={16} color={PrimaryGrey} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
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
                    {showConfirmPassword ? <EyeOff size={16} color={PrimaryGrey} /> : <Eye size={16} color={PrimaryGrey} />}
                  </TouchableOpacity>
                </View>
                {confirmPassword && newPassword !== confirmPassword && (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!isFormComplete || resetPasswordMutation.isPending) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormComplete || resetPasswordMutation.isPending}
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

          {/* Back to Forgot Password */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('ForgotPassword' as never)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Wrong email address?{' '}
            <Text 
              style={styles.helpLink}
              onPress={() => navigation.navigate('ForgotPassword' as never)}
            >
              Change email
            </Text>
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 100,
    height: 100,
    //marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: PrimaryGrey,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  emailText: {
    color: '#111827',
    fontWeight: '600',
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  codeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    fontSize: 20,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'center',
  },
  resendText: {
    fontSize: 14,
    color: PrimaryGrey,
  },
  resendLink: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  timerText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  passwordSection: {
    marginTop: 24,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    color: PrimaryGrey,
    textAlign: 'center',
    lineHeight: 22,
  },
  helpLink: {
    color: '#111827',
    fontWeight: '500',
  },
}) 