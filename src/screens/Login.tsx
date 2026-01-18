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
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { SvgXml } from 'react-native-svg'
import { useMutation, useQuery } from '@tanstack/react-query'
import { login, googleLogin, googleCallback as googleCallbackApi } from '../services/api/auth'
import { useAuthStore } from '../store/store'
import { useToast } from '../contexts/ToastContext'
import { Eye, EyeOff } from 'lucide-react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'

const googleXml = `<svg viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>`

const appleXml = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 30 30" style={{ fill: "#FFFFFF" }}>
    <path d="M25.565,9.785c-0.123,0.077-3.051,1.702-3.051,5.305c0.138,4.109,3.695,5.55,3.756,5.55 c-0.061,0.077-0.537,1.963-1.947,3.94C23.204,26.283,21.962,28,20.076,28c-1.794,0-2.438-1.135-4.508-1.135 c-2.223,0-2.852,1.135-4.554,1.135c-1.886,0-3.22-1.809-4.4-3.496c-1.533-2.208-2.836-5.673-2.882-9 c-0.031-1.763,0.307-3.496,1.165-4.968c1.211-2.055,3.373-3.45,5.734-3.496c1.809-0.061,3.419,1.242,4.523,1.242 c1.058,0,3.036-1.242,5.274-1.242C21.394,7.041,23.97,7.332,25.565,9.785z M15.001,6.688c-0.322-1.61,0.567-3.22,1.395-4.247 c1.058-1.242,2.729-2.085,4.17-2.085c0.092,1.61-0.491,3.189-1.533,4.339C18.098,5.937,16.488,6.872,15.001,6.688z"></path>
</svg>`

export default function Login() {
  const navigation = useNavigation()
  const route = useRoute()
  const { showToast } = useToast()
  const { setUser, setToken } = useAuthStore()

  // Get redirectTo from route params (React Navigation pattern)
  const redirectTo = (route.params as any)?.redirectTo || null;

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isAppleLoading, setIsAppleLoading] = useState(false)

  // Google callback mutation
  const googleCallbackMutation = useMutation({
    mutationFn: (code: string) => googleCallbackApi(code, 'google'),
    onSuccess: (response) => {
      console.log('Google callback successful:', response)
      if (response.user) setUser(response.user);
      if (response.access_token) {
        setToken({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        });
      }
      showToast('Google authentication successful!');

      // Handle redirect - use reset to prevent going back to login
      const redirectParams = (route.params as any)?.redirectParams || {};
      if (response.user && !response.user.last_login_at) {
        // New user - go through onboarding with redirectTo and redirectParams
        navigation.reset({
          index: 0,
          routes: [{ name: 'NonProfitInterests' as never, params: { fromAuth: true, redirectTo: redirectTo || null, redirectParams } }],
        });
      } else if (redirectTo && redirectTo !== 'DrawerNav') {
        // Existing user - navigate to redirectTo using reset
        if (redirectTo === 'CreateCRWD') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'DrawerNav' as never }],
          });
          setTimeout(() => {
            (navigation as any).navigate('DrawerNav', { screen: 'CreateCRWD' });
          }, 100);
        } else if (redirectTo === 'GroupCRWD') {
          // Navigate to GroupCRWD with id param
          console.log('Login - Navigating to GroupCRWD with params:', redirectParams);
          navigation.reset({
            index: 0,
            routes: [{ name: redirectTo as never, params: redirectParams }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: redirectTo as never, params: redirectParams }],
          });
        }
      } else {
        // Default - go to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'DrawerNav' as never }],
        });
      }
    },
    onError: (error: any) => {
      console.error('Google callback error:', error)
      const errorMessage = error?.response?.data?.message || error.message || 'Google callback failed'
      showToast(errorMessage)
    },
  })

  const appleLoginQuery = useQuery({
    queryKey: ['appleLogin'],
    queryFn: () => googleLogin('SignInWithApple'),
    enabled: false,
  })

  const appleCallbackMutation = useMutation({
    mutationFn: (code: string) => googleCallbackApi(code, 'apple'),
    onSuccess: (response) => {
      console.log('Apple callback successful:', response)

      if (response.user) {
        setUser(response.user)
      }
      if (response.access_token) {
        setToken({
          access_token: response.access_token,
          refresh_token: response.refresh_token
        })
      }

      if (response.redirectTo) {
        navigation.reset({
          index: 0,
          routes: [{ name: response.redirectTo as never }],
        })
      }
    },
    onError: (error: any) => {
      console.error('Apple callback error:', error.response)
      const errorMessage = error?.response?.data?.message || error.message || 'Apple callback failed'
      showToast(errorMessage)
    },
  })

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      console.log('Login successful:', response)

      if (response.user) {
        setUser(response.user)
      }
      if (response.access_token) {
        setToken({
          access_token: response.access_token,
          refresh_token: response.refresh_token
        })
      }

      // Handle redirect - use reset to prevent going back to login
      const redirectParams = (route.params as any)?.redirectParams || {};
      if (response.user && !response.user.last_login_at) {
        // New user - go through onboarding with redirectTo and redirectParams
        navigation.reset({
          index: 0,
          routes: [{ name: 'NonProfitInterests' as never, params: { fromAuth: true, redirectTo: redirectTo || null, redirectParams } }],
        });
      } else if (redirectTo && redirectTo !== '/' && redirectTo !== 'DrawerNav') {
        // Existing user - navigate to redirectTo using reset
        if (redirectTo === 'CreateCRWD') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'DrawerNav' as never }],
          });
          setTimeout(() => {
            (navigation as any).navigate('DrawerNav', { screen: 'CreateCRWD' });
          }, 100);
        } else if (redirectTo === 'GroupCRWD') {
          // Navigate to GroupCRWD with params
          navigation.reset({
            index: 0,
            routes: [{ name: redirectTo as never, params: redirectParams }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: redirectTo as never, params: { ...redirectParams, from: 'Login' } }],
          });
        }
      } else {
        // Default - go to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'DrawerNav' as never }],
        });
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error)
      const errorMessage = error?.response?.data?.message || error.message || 'Login failed'
      showToast(errorMessage)
    },
  })

  // Google login query
  const googleLoginQuery = useQuery({
    queryKey: ['googleLogin'],
    queryFn: () => googleLogin('Google'),
    enabled: false,
  })



  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      showToast('Please enter both email and password')
      return
    }

    loginMutation.mutate({
      email: formData.email.trim(),
      password: formData.password,
    })
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      const result = await googleLoginQuery.refetch()
      if (result.data && result.data.url) {
        if (await InAppBrowser.isAvailable()) {
          const authResult = await InAppBrowser.openAuth(
            result.data.url,
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
      console.error('Google login error:', error)
      showToast('Google login failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setIsAppleLoading(true)
    try {
      const result = await appleLoginQuery.refetch()
      if (result.data && result.data.url) {
        if (await InAppBrowser.isAvailable()) {
          const authResult = await InAppBrowser.openAuth(
            result.data.url,
            'crwd-app://appleCallback',
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
              appleCallbackMutation.mutate(code);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Apple login error:', error)
      showToast('Apple login failed. Please try again.')
    } finally {
      setIsAppleLoading(false)
    }
  }

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
              {/* Title and Subtitle */}
              <View style={styles.header}>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>
                  Don't have an account?{' '}
                  <Text
                    style={styles.link}
                    onPress={() => navigation.navigate('ClaimProfile' as never, { redirectTo, redirectParams } as never)}
                  >
                    Sign up
                  </Text>
                </Text>
              </View>

              {/* Google Login Button */}
              <TouchableOpacity
                style={[styles.googleButton, (isGoogleLoading || googleCallbackMutation.isPending) && styles.googleButtonDisabled]}
                onPress={handleGoogleLogin}
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
                  {(isGoogleLoading || googleCallbackMutation.isPending) ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              {/* Apple Login Button */}
              <TouchableOpacity
                style={[styles.appleButton, (isAppleLoading || appleCallbackMutation.isPending) && styles.appleButtonDisabled]}
                onPress={handleAppleLogin}
                disabled={isAppleLoading || appleCallbackMutation.isPending}
              >
                {(isAppleLoading || appleCallbackMutation.isPending) ? (
                  <ActivityIndicator size="small" color={PrimaryGrey} />
                ) : (
                  <View style={styles.appleIconPlaceholder}>
                    <SvgXml xml={appleXml} width={18} height={18} />
                  </View>
                )}
                <Text style={styles.appleButtonText}>
                  {(isAppleLoading || appleCallbackMutation.isPending) ? 'Signing in...' : 'Continue with Apple'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Form Fields */}
              <View style={styles.form}>
                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="janedoe@example.com"
                    placeholderTextColor={PrimaryGrey}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Password <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor={PrimaryGrey}
                      value={formData.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={PrimaryGrey} />
                      ) : (
                        <Eye size={20} color={PrimaryGrey} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMe}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword' as never)}>
                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loginMutation.isPending && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.loadingText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Sign in</Text>
                )}
              </TouchableOpacity>
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
    borderRadius: 16,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
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
    color: '#1600ff',
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
    padding: 12,
    marginBottom: 16,
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
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',

    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  appleButtonDisabled: {
    opacity: 0.5,
  },
  appleIconPlaceholder: {
    width: 16,
    height: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleButtonText: {
    fontSize: 14,
    color: 'white',
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
  inputGroup: {
    marginBottom: 16,
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  checkmark: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 14,
    color: '#111827',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
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
})
