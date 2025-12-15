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
import { Eye, EyeOff, Check, ArrowLeft } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { SvgXml } from 'react-native-svg'
import { useMutation } from '@tanstack/react-query'
import { emailRegistration } from '../services/api/auth'
import { useToast } from '../contexts/ToastContext'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import { googleLogin, googleCallback as googleCallbackApi } from '../services/api/auth'
import { useAuthStore } from '../store/store'

const googleXml = `<svg viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>`

export default function Signup() {
  const navigation = useNavigation()
  const { showToast } = useToast()
  const { setUser, setToken } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    // Check password strength
    if (name === 'password') {
      setPasswordStrength({
        hasMinLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      })
    }
  }

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean)

  // Google callback mutation
  const googleCallbackMutation = useMutation({
    mutationFn: googleCallbackApi,
    onSuccess: (response) => {
      if (response.user) setUser(response.user);
      if (response.access_token) {
        setToken({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        });
      }
      showToast('Google signup successful!');
      
      if (response.user && !response.user.last_login_at) {
        (navigation as any).navigate('NonProfitInterests', { fromAuth: true })
      } else {
        navigation.navigate('DrawerNav' as never);
      }
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || error.message || 'Google signup failed')
    },
  })

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: emailRegistration,
    onSuccess: () => {
      showToast('Account created successfully! Please verify your email.', 'success')
      navigation.navigate('VerificationCode', { 
        email: formData.email,
        fromSignup: true 
      } as never)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to create account'
      showToast(errorMessage)
    },
  })

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      showToast('Please fill in all fields')
      return
    }

    if (!isPasswordStrong) {
      showToast('Please ensure your password meets all requirements')
      return
    }

    signupMutation.mutate({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password,
    })
  }

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    try {
      const result = await googleLogin();
      
      if (result && result.url) {
        if (await InAppBrowser.isAvailable()) {
          const authResult = await InAppBrowser.openAuth(
            result.url,
            'crwd-app://googleCallback',
            {
              ephemeralWebSession: false,
              showTitle: false,
              enableUrlBarHiding: true,
              enableDefaultShare: false,
            }
          )
          
          if (authResult.type === 'success' && authResult.url) {
            const codeMatch = authResult.url.match(/[?&]code=([^&]+)/);
            const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
            if (code) {
              googleCallbackMutation.mutate(code);
            }
          }
        }
      }
    } catch (error: any) {
      showToast('Google signup failed')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {/* Logo and Header */}
            <View style={styles.header}>
              <Image 
                source={require('../assets/logo/logo3.webp')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>
                Already have an account?{' '}
                <Text 
                  style={styles.link}
                  onPress={() => navigation.navigate('Login' as never)}
                >
                  Sign in
                </Text>
              </Text>
            </View>

            {/* Google Signup Button */}
            <TouchableOpacity 
              style={[styles.googleButton, (isGoogleLoading || googleCallbackMutation.isPending) && styles.googleButtonDisabled]}
              onPress={handleGoogleSignup}
              disabled={isGoogleLoading || googleCallbackMutation.isPending}
            >
              {(isGoogleLoading || googleCallbackMutation.isPending) ? (
                <ActivityIndicator size="small" color={PrimaryGrey} />
              ) : (
                <View style={styles.googleIconPlaceholder}>
                  <SvgXml xml={googleXml} width={16} height={16} />
                </View>
              )}
              <Text style={styles.googleButtonText}>
                {(isGoogleLoading || googleCallbackMutation.isPending) ? 'Creating account...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Fields */}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.label}>First name</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'firstName' && styles.inputFocused]}
                    placeholder="John"
                    placeholderTextColor={PrimaryGrey}
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={styles.nameField}>
                  <Text style={styles.label}>Last name</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'lastName' && styles.inputFocused]}
                    placeholder="Doe"
                    placeholderTextColor={PrimaryGrey}
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                  placeholder="john.doe@example.com"
                  placeholderTextColor={PrimaryGrey}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={PrimaryGrey}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={PrimaryGrey} />
                    ) : (
                      <Eye size={16} color={PrimaryGrey} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <View style={styles.passwordStrengthContainer}>
                    <Text style={styles.passwordStrengthTitle}>Password must contain:</Text>
                    <View style={styles.passwordStrengthList}>
                      <View style={styles.passwordStrengthItem}>
                        <Check 
                          size={12} 
                          color={passwordStrength.hasMinLength ? '#10b981' : '#d1d5db'} 
                        />
                        <Text style={[
                          styles.passwordStrengthText,
                          passwordStrength.hasMinLength && styles.passwordStrengthTextMet
                        ]}>
                          At least 8 characters
                        </Text>
                      </View>
                      <View style={styles.passwordStrengthItem}>
                        <Check 
                          size={12} 
                          color={passwordStrength.hasUppercase ? '#10b981' : '#d1d5db'} 
                        />
                        <Text style={[
                          styles.passwordStrengthText,
                          passwordStrength.hasUppercase && styles.passwordStrengthTextMet
                        ]}>
                          One uppercase letter
                        </Text>
                      </View>
                      <View style={styles.passwordStrengthItem}>
                        <Check 
                          size={12} 
                          color={passwordStrength.hasLowercase ? '#10b981' : '#d1d5db'} 
                        />
                        <Text style={[
                          styles.passwordStrengthText,
                          passwordStrength.hasLowercase && styles.passwordStrengthTextMet
                        ]}>
                          One lowercase letter
                        </Text>
                      </View>
                      <View style={styles.passwordStrengthItem}>
                        <Check 
                          size={12} 
                          color={passwordStrength.hasNumber ? '#10b981' : '#d1d5db'} 
                        />
                        <Text style={[
                          styles.passwordStrengthText,
                          passwordStrength.hasNumber && styles.passwordStrengthTextMet
                        ]}>
                          One number
                        </Text>
                      </View>
                      <View style={styles.passwordStrengthItem}>
                        <Check 
                          size={12} 
                          color={passwordStrength.hasSpecialChar ? '#10b981' : '#d1d5db'} 
                        />
                        <Text style={[
                          styles.passwordStrengthText,
                          passwordStrength.hasSpecialChar && styles.passwordStrengthTextMet
                        ]}>
                          One special character
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (signupMutation.isPending || !isPasswordStrong) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={signupMutation.isPending || !isPasswordStrong}
              >
                {signupMutation.isPending ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.loadingText}>Creating account...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Create account</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => navigation.navigate('Settings' as never)}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => navigation.navigate('Settings' as never)}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: PrimaryGrey,
    textAlign: 'center',
  },
  link: {
    color: '#111827',
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 11,
    marginBottom: 24,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleIconPlaceholder: {
    width: 16,
    height: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  form: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: 'white',
  },
  inputFocused: {
    borderColor: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    paddingRight: 40,
  },
  eyeButton: {
    padding: 10,
    position: 'absolute',
    right: 0,
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  passwordStrengthList: {
    gap: 4,
  },
  passwordStrengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordStrengthText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  passwordStrengthTextMet: {
    color: '#10b981',
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
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
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#374151',
    fontWeight: '500',
  },
})
