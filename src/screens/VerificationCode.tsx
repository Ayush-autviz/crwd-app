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
import { ArrowLeft, Shield } from 'lucide-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'

export default function VerificationCode() {
  const navigation = useNavigation()
  const route = useRoute()
  const email = route.params?.email || ''
  
  const [isLoading, setIsLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  const handleSubmit = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code')
      return
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit verification code')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call to verify code
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Navigate to ResetPassword screen with email and verified code
      navigation.navigate('ResetPassword', { email, verificationCode } as never)
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    // Simulate resend code
    Alert.alert('Code Sent', 'A new verification code has been sent to your email.')
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
              <Text style={styles.label}>Verification code</Text>
              <View style={styles.codeInputContainer}>
                <Shield size={18} color={PrimaryGrey} style={styles.shieldIcon} />
                <TextInput
                  style={styles.codeInput}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={PrimaryGrey}
                  value={verificationCode}
                  onChangeText={(value) => setVerificationCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                />
              </View>
              <TouchableOpacity style={styles.resendContainer} onPress={resendCode}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!verificationCode || verificationCode.length !== 6 || isLoading) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !verificationCode || verificationCode.length !== 6}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.loadingText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Verify code</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Forgot Password */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('ForgotPassword' as never)}
          >
            <ArrowLeft size={16} color="#374151" />
            <Text style={styles.backButtonText}>Back</Text>
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
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingLeft: 16,
  },
  shieldIcon: {
    marginRight: 12,
  },
  codeInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 18,
    color: '#111827',
    letterSpacing: 4,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
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