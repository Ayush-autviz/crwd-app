import React, { useState } from 'react'
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../../Constants/Colors'
import { Eye, EyeOff, Lock } from 'lucide-react-native'
import { useMutation } from '@tanstack/react-query'
import { changePassword } from '../../services/api/auth'
import { useToast } from '../../contexts/ToastContext'
import { useNavigation } from '@react-navigation/native'

export default function Password() {
  const { showToast } = useToast()
  const navigation = useNavigation()
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const validatePassword = (password: string) => {
    if (password.length < 8)
      return 'Password must be at least 8 characters long'
    if (!/[A-Z]/.test(password))
      return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(password))
      return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(password))
      return 'Password must contain at least one number'
    if (!/[!@#$%^&*]/.test(password))
      return 'Password must contain at least one special character (!@#$%^&*)'
    return ''
  }

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (response) => {
      console.log('Change password successful:', response)
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      })
      showToast('Password updated successfully!', 'success' as any)
      navigation.navigate('DrawerNav', {screen: 'Settings'} as never)
    },
    onError: (error: any) => {
      console.error('Change password error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password'
      showToast(errorMessage, 'error' as any)
    },
  })

  const handleSubmit = async () => {
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })

    // Validate current password
    if (!formData.currentPassword) {
      setErrors((prev) => ({
        ...prev,
        currentPassword: 'Current password is required',
      }))
      return
    }

    // Validate new password
    const newPasswordError = validatePassword(formData.newPassword)
    if (newPasswordError) {
      setErrors((prev) => ({ ...prev, newPassword: newPasswordError }))
      return
    }

    // Validate password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: 'Passwords do not match',
      }))
      return
    }

    changePasswordMutation.mutate({
      current_password: formData.currentPassword,
      new_password: formData.newPassword,
    })
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show={true} title={'Change Password'} menu={false} />
      <ScrollView style={{ paddingHorizontal: 20, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Lock size={20} color={PrimaryBlue} />
          <Text style={{ fontSize: 20, fontWeight: '600' }}>Change Password</Text>
        </View>
        <Text style={{ fontSize: 14, color: PrimaryGrey, marginBottom: 20 }}>
          Update your password to keep your account secure. Make sure to use a strong password that you don't use elsewhere.
        </Text>
        
        {/* Current Password */}
        <Text style={{ fontSize: 14, marginBottom: 10, fontWeight: '500' }}>Current Password</Text>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderColor: errors.currentPassword ? '#ef4444' : SecondaryGrey, 
          borderWidth: 1, 
          borderRadius: 10, 
          padding: 15, 
          marginBottom: 10 
        }}>
          <TextInput 
            style={{ flex: 1, color: 'black', fontSize: 16 }} 
            secureTextEntry={!showPasswords.current} 
            value={formData.currentPassword}
            onChangeText={(value) => handleInputChange('currentPassword', value)}
            placeholder="Enter current password"
            placeholderTextColor={PrimaryGrey}
          />
          <TouchableOpacity onPress={() => togglePasswordVisibility('current')}>
            {showPasswords.current ? (
              <Eye size={20} color={PrimaryGrey} />
            ) : (
              <EyeOff size={20} color={PrimaryGrey} />
            )}
          </TouchableOpacity>
        </View>
        {errors.currentPassword && (
          <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>
            {errors.currentPassword}
          </Text>
        )}
        
        {/* New Password */}
        <Text style={{ fontSize: 14, marginBottom: 10, fontWeight: '500' }}>New Password</Text>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderColor: errors.newPassword ? '#ef4444' : SecondaryGrey, 
          borderWidth: 1, 
          borderRadius: 10, 
          padding: 15, 
          marginBottom: 10 
        }}>
          <TextInput 
            style={{ flex: 1, color: 'black', fontSize: 16 }} 
            secureTextEntry={!showPasswords.new} 
            value={formData.newPassword}
            onChangeText={(value) => handleInputChange('newPassword', value)}
            placeholder="Enter new password"
            placeholderTextColor={PrimaryGrey}
          />
          <TouchableOpacity onPress={() => togglePasswordVisibility('new')}>
            {showPasswords.new ? (
              <Eye size={20} color={PrimaryGrey} />
            ) : (
              <EyeOff size={20} color={PrimaryGrey} />
            )}
          </TouchableOpacity>
        </View>
        {errors.newPassword && (
          <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>
            {errors.newPassword}
          </Text>
        )}
        
        {/* Confirm Password */}
        <Text style={{ fontSize: 14, marginBottom: 10, fontWeight: '500' }}>Confirm New Password</Text>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderColor: errors.confirmPassword ? '#ef4444' : SecondaryGrey, 
          borderWidth: 1, 
          borderRadius: 10, 
          padding: 15, 
          marginBottom: 10 
        }}>
          <TextInput 
            style={{ flex: 1, color: 'black', fontSize: 16 }} 
            secureTextEntry={!showPasswords.confirm} 
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm new password"
            placeholderTextColor={PrimaryGrey}
          />
          <TouchableOpacity onPress={() => togglePasswordVisibility('confirm')}>
            {showPasswords.confirm ? (
              <Eye size={20} color={PrimaryGrey} />
            ) : (
              <EyeOff size={20} color={PrimaryGrey} />
            )}
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>
            {errors.confirmPassword}
          </Text>
        )}
        
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 20 }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: changePasswordMutation.isPending ? '#9ca3af' : PrimaryBlue, 
              paddingVertical: 15, 
              paddingHorizontal: 20, 
              borderRadius: 10,
              flex: 1
            }}
            onPress={handleSubmit}
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="white" />
                <Text style={{ color: 'white', textAlign: 'center', marginLeft: 8 }}>
                  Updating...
                </Text>
              </View>
            ) : (
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                Update Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}