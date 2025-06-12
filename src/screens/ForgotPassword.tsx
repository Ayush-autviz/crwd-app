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
import { ArrowLeft, Mail } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'

export default function ForgotPassword() {
  const navigation = useNavigation()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      Alert.alert(
        'Success', 
        'Verification code sent! Check your email for the verification code.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('VerificationCode', { email } as never) 
          }
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.')
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
            <Text style={styles.title}>Forgot your password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email address and we'll send you a verification code to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color={PrimaryGrey} style={styles.mailIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="john.doe@example.com"
                  placeholderTextColor={PrimaryGrey}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!email || isLoading) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.loadingText}>Sending code...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Send verification code</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <ArrowLeft size={16} color="#374151" />
            <Text style={styles.backToLoginText}>Back to login</Text>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Don't have an account?{' '}
            <Text 
              style={styles.helpLink}
              onPress={() => navigation.navigate('Signup' as never)}
            >
              Sign up
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
    marginBottom: 48,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingLeft: 16,
  },
  mailIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: '#111827',
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
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  backToLoginText: {
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