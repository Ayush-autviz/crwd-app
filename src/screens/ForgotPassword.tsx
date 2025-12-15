import React, { useState } from 'react'
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
import { ArrowLeft } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { useMutation } from '@tanstack/react-query'
import { forgotPassword } from '../services/api/auth'
import { useToast } from '../contexts/ToastContext'

export default function ForgotPassword() {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const { showToast } = useToast()

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      console.log('Forgot password successful:', response)
      navigation.navigate('VerificationCode', { email } as never)
    },
    onError: (error: any) => {
      console.error('Forgot password error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset code'
      showToast(errorMessage)
    },
  })

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast('Please enter your email address')
      return
    }

    forgotPasswordMutation.mutate({
      email: email.trim(),
    })
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
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('Login' as never)}
              >
                <ArrowLeft size={16} color="#6b7280" />
                <Text style={styles.backButtonText}>Back to login</Text>
              </TouchableOpacity>

              {/* Title and Subtitle */}
              <View style={styles.header}>
                <Text style={styles.title}>Forgot your password?</Text>
                <Text style={styles.subtitle}>
                  No worries! Enter your email address and we'll send you a verification code to reset your password.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="janedoe@example.com"
                    placeholderTextColor={PrimaryGrey}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (forgotPasswordMutation.isPending || !email.trim()) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={forgotPasswordMutation.isPending || !email.trim()}
                >
                  {forgotPasswordMutation.isPending ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.loadingText}>Sending code...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Send verification code</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Remember your password?{' '}
                  <Text 
                    style={styles.footerLink}
                    onPress={() => navigation.navigate('Login' as never)}
                  >
                    Sign in
                  </Text>
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
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
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
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  footerLink: {
    color: '#1600ff',
    fontWeight: '600',
  },
})
