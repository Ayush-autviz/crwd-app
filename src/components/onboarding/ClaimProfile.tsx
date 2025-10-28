import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Alert, ActivityIndicator, ScrollView } from 'react-native'
import React, { useState, useRef } from 'react'
import { ChevronLeft, Check } from 'lucide-react-native'
import OnboardingHeader from './OnboardingHeader'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import DatePicker from 'react-native-date-picker'
import { PrimaryBlue } from '../../Constants/Colors'
import * as ImagePicker from 'react-native-image-picker'
import { useMutation } from '@tanstack/react-query'
import { emailRegistration, emailVerification, resendEmailVerificationCode } from '../../services/api/auth'
import { useToast } from '../../contexts/ToastContext'
import { Camera } from 'lucide-react-native'
import { EyeOff } from 'lucide-react-native'
import { Eye } from 'lucide-react-native'

export default function ClaimProfile() {
    const navigation = useNavigation<any>()
    const { showToast } = useToast()
    
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        // dateOfBirth: null as Date | null,
        profileImage: null as string | null,
        termsAccepted: false,
    })
    
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [showOTPModal, setShowOTPModal] = useState(false)
    const [otp, setOtp] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
    })
    
    const [open, setOpen] = useState(false)

    // const formattedDate = formData.dateOfBirth
    //     ? formData.dateOfBirth.toLocaleDateString('en-GB', {
    //         day: 'numeric',
    //         month: 'long',
    //         year: 'numeric',
    //     })
    //     : ''

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))

        // Check password strength
        if (field === 'password') {
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

    const handleImageUpload = () => {
        const options = {
            mediaType: 'photo' as const,
            includeBase64: true,
            maxHeight: 2000,
            maxWidth: 2000,
        }

        ImagePicker.launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                return
            }
            if (response.assets && response.assets[0]) {
                setFormData(prev => ({
                    ...prev,
                    profileImage: response.assets![0].uri || null
                }))
            }
        })
    }

    const handleRemovePhoto = () => {
        setFormData(prev => ({
            ...prev,
            profileImage: null
        }))
    }

    // Form validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required'
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (!isPasswordStrong) {
            newErrors.password = 'Password must meet all requirements'
        }

        // if (!formData.dateOfBirth) {
        //     newErrors.dateOfBirth = 'Date of birth is required'
        // }

        if (!formData.termsAccepted) {
            newErrors.termsAccepted = 'You must accept the terms and conditions'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Clear specific error when user starts typing
    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    // React Query mutations
    const emailRegistrationMutation = useMutation({
        mutationFn: emailRegistration,
        onSuccess: (data) => {
            console.log('Registration successful:', data)
            setShowOTPModal(true)
        },
        onError: (error: any) => {
            console.error('Registration failed:', error)
            const errorMessage = error?.response?.data?.message || error.message || 'Registration failed'
            showToast(errorMessage)
        }
    })

    const emailVerificationMutation = useMutation({
        mutationFn: emailVerification,
        onSuccess: (data) => {
            console.log('Email verification successful:', data)
            navigation.navigate('Login' as never)
        },
        onError: (error: any) => {
            console.error('Email verification failed:', error)
            const errorMessage = error?.response?.data?.message || error.message || 'Verification failed'
            showToast(errorMessage)
        }
    })

    const resendCodeMutation = useMutation({
        mutationFn: resendEmailVerificationCode,
        onSuccess: () => {
            showToast('Verification code resent successfully')
        },
        onError: (error: any) => {
            console.error('Resend code failed:', error)
            const errorMessage = error?.response?.data?.message || error.message || 'Failed to resend code'
            showToast(errorMessage)
        }
    })

    const handleContinue = () => {
        if (!validateForm()) {
            return
        }

        // Create FormData for file upload
        const formDataToSend = new FormData()
        formDataToSend.append('first_name', formData.firstName.trim())
        formDataToSend.append('last_name', formData.lastName.trim())
        formDataToSend.append('email', formData.email.trim())
        formDataToSend.append('password', formData.password)
        // formDataToSend.append('date_of_birth', formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : '')
        
        // Add profile picture if available
        if (formData.profileImage) {
            formDataToSend.append('profile_picture_file', {
                uri: formData.profileImage,
                type: 'image/jpeg',
                name: 'profile.jpg',
            } as any)
        }

        console.log('Sending FormData with fields:', {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
            // date_of_birth: formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : '',
            profile_picture_file: formData.profileImage ? 'present' : 'not present'
        })
        emailRegistrationMutation.mutate(formDataToSend)
    }

    const handleOTPSubmit = () => {
        if (!otp.trim()) {
            Alert.alert('Error', 'Please enter the verification code')
            return
        }

        emailVerificationMutation.mutate({
            email: formData.email,
            confirmation_code: otp
        })
    }

    const handleResendCode = () => {
        resendCodeMutation.mutate({
            email: formData.email
        })
    }

    return (
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, backgroundColor: 'white' }}>
            <OnboardingHeader />

            {/* <DatePicker
                modal
                open={open}
                date={formData.dateOfBirth || new Date()} // fallback date if none selected
                mode="date"
                maximumDate={new Date()}
                onConfirm={(selectedDate) => {
                    setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }))
                    clearError('dateOfBirth')
                    setOpen(false)
                }}
                onCancel={() => {
                    setOpen(false)
                }}
                theme='light'
            /> */}

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
                <View style={styles.stepBar}>
                    <View style={[styles.stepDot, styles.stepDotInactive]} />
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View style={[styles.stepDot, styles.stepDotInactive]} />
                </View>
            </View>

            {/* Heading */}
            <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headingContainer}>
                <Text style={styles.heading}>Finish your profile</Text>
                <Text style={styles.subheading}>So others can connect with you on CRWD</Text>
            </View>

            {/* Add Photo Section */}
            <View style={styles.photoSection}>
                <View style={styles.photoContainer}>
                    {formData.profileImage ? (
                        <View style={styles.photoPreview}>
                            <Image source={{ uri: formData.profileImage }} style={styles.photoImage} />
                            <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
                                <Text style={{ fontSize: 12, color: 'white', fontWeight: 'bold' }}>×</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.photoUploadButton} onPress={handleImageUpload}>
                            {/* <Text style={{ fontSize: 20, color: '#9ca3af' }}>📷</Text> */}
                            <Camera size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.photoLabel}>Add a Photo</Text>
                <Text style={styles.photoSubtext}>OPTIONAL</Text>
            </View>

            <View style={{ flex: 1, padding: 5, marginTop: 20, gap: 5 }}>
                <Text style={styles.label}>First Name</Text>
                <TextInput 
                    placeholder="Enter your first name" 
                    style={[styles.input, errors.firstName && { borderColor: '#ef4444' }]} 
                    placeholderTextColor="#9ca3af"
                    value={formData.firstName}
                    onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, firstName: text }))
                        clearError('firstName')
                    }}
                />
               

                <Text style={styles.label}>Last Name</Text>
                <TextInput 
                    placeholder="Enter your last name" 
                    style={[styles.input, errors.lastName && { borderColor: '#ef4444' }]} 
                    placeholderTextColor="#9ca3af"
                    value={formData.lastName}
                    onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, lastName: text }))
                        clearError('lastName')
                    }}
                />
                

                <Text style={styles.label}>Email</Text>
                <TextInput 
                    placeholder="janedoe@example.com" 
                    style={[styles.input, errors.email && { borderColor: '#ef4444' }]} 
                    placeholderTextColor="#9ca3af"
                    value={formData.email}
                    onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, email: text }))
                        clearError('email')
                    }}
                    keyboardType="email-address"
                />
                

                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput 
                        placeholder="Enter your password" 
                        style={[styles.passwordInput, errors.password && { borderColor: '#ef4444' }]} 
                        placeholderTextColor="#9ca3af"
                        value={formData.password}
                        onChangeText={(text) => {
                            handleInputChange('password', text)
                            clearError('password')
                        }}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Text style={{ fontSize: 20 }}>
                            {showPassword ? <Eye size={20} color="#9ca3af" /> : <EyeOff size={20} color="#9ca3af" />}
                        </Text>
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
                                    color={passwordStrength.hasMinLength ? '#16a34a' : '#d1d5db'} 
                                />
                                <Text style={[
                                    styles.passwordStrengthText,
                                    { color: passwordStrength.hasMinLength ? '#16a34a' : '#9ca3af' }
                                ]}>
                                    At least 8 characters
                                </Text>
                            </View>
                            <View style={styles.passwordStrengthItem}>
                                <Check 
                                    size={12} 
                                    color={passwordStrength.hasUppercase ? '#16a34a' : '#d1d5db'} 
                                />
                                <Text style={[
                                    styles.passwordStrengthText,
                                    { color: passwordStrength.hasUppercase ? '#16a34a' : '#9ca3af' }
                                ]}>
                                    One uppercase letter
                                </Text>
                            </View>
                            <View style={styles.passwordStrengthItem}>
                                <Check 
                                    size={12} 
                                    color={passwordStrength.hasLowercase ? '#16a34a' : '#d1d5db'} 
                                />
                                <Text style={[
                                    styles.passwordStrengthText,
                                    { color: passwordStrength.hasLowercase ? '#16a34a' : '#9ca3af' }
                                ]}>
                                    One lowercase letter
                                </Text>
                            </View>
                            <View style={styles.passwordStrengthItem}>
                                <Check 
                                    size={12} 
                                    color={passwordStrength.hasNumber ? '#16a34a' : '#d1d5db'} 
                                />
                                <Text style={[
                                    styles.passwordStrengthText,
                                    { color: passwordStrength.hasNumber ? '#16a34a' : '#9ca3af' }
                                ]}>
                                    One number
                                </Text>
                            </View>
                            <View style={styles.passwordStrengthItem}>
                                <Check 
                                    size={12} 
                                    color={passwordStrength.hasSpecialChar ? '#16a34a' : '#d1d5db'} 
                                />
                                <Text style={[
                                    styles.passwordStrengthText,
                                    { color: passwordStrength.hasSpecialChar ? '#16a34a' : '#9ca3af' }
                                ]}>
                                    One special character
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                )}
                
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    backgroundColor: '#f6f6f6',
                    padding: 12,
                    borderRadius: 10,
                    gap: 10,
                    marginTop: 10,
                    alignItems: 'center',
                }}
            >
                <TouchableOpacity
                    style={{
                        borderWidth: 1.2,
                        borderColor: errors.termsAccepted ? '#ef4444' : formData.termsAccepted ? 'black' : 'gray',
                        borderRadius: 50,
                        padding: formData.termsAccepted ? 3 : 10.5,
                        backgroundColor: formData.termsAccepted ? 'black' : 'white',
                    }}
                    onPress={() => {
                        setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }))
                        clearError('termsAccepted')
                    }}
                >
                    {formData.termsAccepted ? <Check size={15} color="white" /> : null}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: 'gray', textAlign: 'center' }}>
                        By checking this box, you acknowledge and agree to CRWD's{' '}
                        <Text style={{ color: 'black', fontWeight: '600' }}>Terms of Use</Text>
                        {' '}and{' '}
                        <Text style={{ color: 'black', fontWeight: '600' }}>Privacy Policy</Text>.
                    </Text>
                </View>
            </View>
            </ScrollView>
           

            <TouchableOpacity
                style={{
                    backgroundColor: PrimaryBlue,
                    padding: 15,
                    borderRadius: 12,
                    marginTop: 20,
                    alignItems: 'center',
                    opacity: emailRegistrationMutation.isPending ? 0.7 : 1,
                }}
                onPress={handleContinue}
                disabled={emailRegistrationMutation.isPending}
            >
                {emailRegistrationMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>Continue</Text>
                )}
            </TouchableOpacity>

            {/* Sign In Button */}
            <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account?</Text>
                <TouchableOpacity 
                    style={styles.signInButton}
                    onPress={() => navigation.navigate('Login' as never)}
                >
                    <Text style={styles.signInButtonText}>Sign In</Text>
                </TouchableOpacity>
            </View>

            {/* OTP Modal */}
            {showOTPModal && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 20,
                        width: '100%',
                        maxWidth: 400,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: 8,
                            textAlign: 'center',
                        }}>
                            Verify Your Email
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: '#6b7280',
                            marginBottom: 20,
                            textAlign: 'center',
                        }}>
                            We've sent a verification code to {formData.email}
                        </Text>
                        
                        <TextInput
                            placeholder="Enter verification code"
                            style={[styles.input, {textAlign: 'center'}]}
                            placeholderTextColor="#9ca3af"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                        
                        <TouchableOpacity
                            style={{
                                backgroundColor: PrimaryBlue,
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 12,
                                alignItems: 'center',
                                opacity: emailVerificationMutation.isPending ? 0.7 : 1,
                            }}
                            onPress={handleOTPSubmit}
                            disabled={emailVerificationMutation.isPending}
                        >
                            {emailVerificationMutation.isPending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                                    Verify Email
                                </Text>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={{
                                padding: 12,
                                alignItems: 'center',
                                opacity: resendCodeMutation.isPending ? 0.7 : 1,
                            }}
                            onPress={handleResendCode}
                            disabled={resendCodeMutation.isPending}
                        >
                            {resendCodeMutation.isPending ? (
                                <ActivityIndicator size="small" color={PrimaryBlue} />
                            ) : (
                                <Text style={{ color: PrimaryBlue, fontSize: 14, fontWeight: '500' }}>
                                    Resend Code
                                </Text>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={{
                                padding: 12,
                                alignItems: 'center',
                                marginTop: 8,
                            }}
                            onPress={() => setShowOTPModal(false)}
                        >
                            <Text style={{ color: '#6b7280', fontSize: 14 }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#f9fafb',
        fontSize: 16,
        color: '#111827',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
        marginBottom: 8,
        marginTop: -4,
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    passwordInput: {
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        paddingRight: 50,
        backgroundColor: '#f9fafb',
        fontSize: 16,
        color: '#111827',
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        padding: 4,
    },
    passwordStrengthContainer: {
        marginTop: 8,
        marginBottom: 8,
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
    },
    signInContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 10,
        paddingHorizontal: 20,
    },
    signInText: {
        fontSize: 12,
        color: '#6b7280',
    },
    signInButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    signInButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
    },
    stepIndicator: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    stepBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepDot: {
        width: 48,
        height: 4,
        borderRadius: 2,
    },
    stepDotActive: {
        backgroundColor: 'black',
    },
    stepDotInactive: {
        backgroundColor: '#d1d5db',
    },
    headingContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    subheading: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        textAlign: 'center',
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    photoContainer: {
        marginBottom: 16,
    },
    photoUploadButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPreview: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        position: 'relative',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    removePhotoButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        backgroundColor: '#374151',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    photoSubtext: {
        fontSize: 12,
        color: '#6b7280',
    },
})
