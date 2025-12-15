import React, { useEffect, useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { googleCallback } from '../services/api/auth'
import { useAuthStore } from '../store/store'
import { useToast } from '../contexts/ToastContext'
import { X } from 'lucide-react-native'

export default function GoogleCallback() {
  const navigation = useNavigation()
  const route = useRoute()
  const { setUser, setToken } = useAuthStore()
  const { showToast } = useToast()
  const [error, setError] = useState<string | null>(null)
  
  const code = (route.params as any)?.code || null

  const googleCallbackQuery = useQuery({
    queryKey: ['googleCallback', code],
    queryFn: () => googleCallback(code!),
    enabled: !!code,
  })

  useEffect(() => {
    if (!code) {
      setError('No authorization code found')
      return
    }

    if (googleCallbackQuery.data) {
      console.log('Google callback successful:', googleCallbackQuery.data)
      
      if (googleCallbackQuery.data) {
        setUser(googleCallbackQuery.data.user)
        setToken({
          access_token: googleCallbackQuery.data.access_token, 
          refresh_token: googleCallbackQuery.data.refresh_token
        })
        showToast('Google authentication successful!')
        
        // If last_login_at is null, navigate to nonprofit interests page (new user)
        if (googleCallbackQuery.data.user && !googleCallbackQuery.data.user.last_login_at) {
          (navigation as any).navigate('NonProfitInterests', { fromAuth: true })
        } else {
          // Navigate to main app for existing users
          navigation.reset({
            index: 0,
            routes: [{ name: 'DrawerNav' as never }],
          })
        }
      }
    }

    if (googleCallbackQuery.error) {
      console.error('Google callback error:', googleCallbackQuery.error)
      const errorMessage = (googleCallbackQuery.error as any)?.response?.data?.message || 
                          (googleCallbackQuery.error as any)?.message || 
                          'Authentication failed'
      setError(errorMessage)
      showToast(`Authentication failed: ${errorMessage}`)
    }
  }, [code, googleCallbackQuery.data, googleCallbackQuery.error, setUser, setToken, navigation, showToast])

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.errorIcon}>
            <X size={32} color="#dc2626" />
          </View>
          <Text style={styles.errorTitle}>Authentication Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
        <Text style={styles.title}>Completing Authentication</Text>
        <Text style={styles.subtitle}>
          Please wait while we complete your Google authentication...
        </Text>
        {googleCallbackQuery.isFetching && (
          <Text style={styles.processingText}>Processing authorization code...</Text>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  errorIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#fee2e2',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#dbeafe',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  processingText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
})

