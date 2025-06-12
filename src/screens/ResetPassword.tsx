import React, { useState } from 'react'
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
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'

export default function ResetPassword() {
  const navigation = useNavigation()
  const route = useRoute()
  const email = route.params?.email || ''
  const verificationCode = route.params?.verificationCode || ''
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return 0
    if (password.length < 6) return 1
    if (password.length < 10) return 2
    return 3
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 1) return '#ef4444'
    if (passwordStrength === 2) return '#f59e0b'
    if (passwordStrength === 3) return '#10b981'
    return '#e5e7eb'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Enter a password'
    if (passwordStrength === 1) return 'Weak password'
    if (passwordStrength === 2) return 'Fair password'
    if (passwordStrength === 3) return 'Strong password'
    return ''
  }

  const handleSubmit = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (passwordStrength < 2) {
      Alert.alert('Error', 'Please choose a stronger password')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call to reset password
      await new Promise(resolve => setTimeout(resolve, 1500))
      Alert.alert(
        'Success', 
        'Your password has been reset successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Login' as never)
          }
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo and Header */}
          <View style={styles.header}>
            <Image 
              source={require('../assets/logo/logo3.webp')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create new password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password for your account{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={PrimaryGrey}
                  value={formData.newPassword}
                  onChangeText={(value) => handleInputChange('newPassword', value)}
                  secureTextEntry={!showPassword}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={PrimaryGrey} />
                  ) : (
                    <Eye size={18} color={PrimaryGrey} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Password Strength */}
              {formData.newPassword && (
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor: passwordStrength >= level 
                              ? getPasswordStrengthColor() 
                              : '#e5e7eb'
                          }
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.strengthText}>
                    {getPasswordStrengthText()}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={PrimaryGrey}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={PrimaryGrey} />
                  ) : (
                    <Eye size={18} color={PrimaryGrey} />
                  )}
                </TouchableOpacity>
              </View>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.loadingText}>Resetting password...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Reset password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Verification */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('VerificationCode', { email } as never)}
          >
            <ArrowLeft size={16} color="#374151" />
            <Text style={styles.backButtonText}>Back to verification</Text>
          </TouchableOpacity>
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
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
   // marginBottom: 24,
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
  },
  emailText: {
    color: '#111827',
    fontWeight: '600',
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  passwordStrength: {
    marginTop: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 14,
    color: PrimaryGrey,
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
    marginTop: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
}) 