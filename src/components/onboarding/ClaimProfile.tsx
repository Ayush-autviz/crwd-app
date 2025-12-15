import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Alert, ActivityIndicator, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useRef } from 'react'
import { Check, ArrowRight, Loader2 } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient'
import { PrimaryBlue } from '../../Constants/Colors'
import * as ImagePicker from 'react-native-image-picker'
import { useMutation } from '@tanstack/react-query'
import { emailRegistration, emailVerification, resendEmailVerificationCode, login } from '../../services/api/auth'
import { useToast } from '../../contexts/ToastContext'
import { useAuthStore } from '../../store/store'
import { Camera, EyeOff, Eye } from 'lucide-react-native'

export default function ClaimProfile() {
    const navigation = useNavigation<any>()
    const route = useRoute()
    const { showToast } = useToast()
    const { setUser, setToken } = useAuthStore()
    const redirectTo = (route.params as any)?.redirectTo || '/'
    
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
    const scrollViewRef = useRef<ScrollView>(null)
    const passwordStrengthRef = useRef<View>(null)
    const passwordStrengthY = useRef<number>(0)

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
            newErrors.terms = "You must agree to the Terms of Use and Privacy Policy"
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
    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: (response) => {
            console.log('Login successful:', response)
            
            // Store user data and token in the store
            if (response.user) {
                setUser(response.user)
            }
            if (response.access_token) {
                setToken({ 
                    access_token: response.access_token, 
                    refresh_token: response.refresh_token 
                })
            }
            
            // If last_login_at is null, navigate to nonprofit interests page (new user)
            if (response.user && !response.user.last_login_at) {
                (navigation as any).navigate('NonProfitInterests', { 
                    redirectTo,
                    fromAuth: true 
                })
            } else {
                // Navigate to redirectTo if available, otherwise main app for existing users
                if (redirectTo && redirectTo !== '/') {
                    navigation.navigate(redirectTo as never)
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'DrawerNav' as never }],
                    })
                }
            }
        },
        onError: (error: any) => {
            console.error('Login error:', error)
            const errorMessage = error?.response?.data?.message || error.message || 'Login failed'
            showToast(errorMessage)
            // Navigate to login page if auto-login fails
            navigation.navigate('Login' as never)
        },
    })

    const emailRegistrationMutation = useMutation({
        mutationFn: emailRegistration,
        onSuccess: (response) => {
            setShowOTPModal(true)
            if (response.message === "User already exists with this email") {
                handleResendEmailVerification()
            }
            console.log("email registered", response)
        },
        onError: (error: any) => {
            console.error("Registration error:", error)
            console.error("Error response:", error.response?.data)
            console.error("Error status:", error.response?.status)
            
            // Handle validation errors
            const errorData = error.response?.data
            if (errorData?.errors) {
                // Check for profile picture error
                if (errorData.errors.profile_picture_file) {
                    const profileError = Array.isArray(errorData.errors.profile_picture_file)
                        ? errorData.errors.profile_picture_file[0]
                        : errorData.errors.profile_picture_file
                    setErrors((prev) => ({
                        ...prev,
                        profileImage: profileError,
                    }))
                    showToast(profileError)
                } else {
                    // Handle other field errors
                    const fieldErrors: Record<string, string> = {}
                    Object.keys(errorData.errors).forEach((field) => {
                        const fieldError = errorData.errors[field]
                        fieldErrors[field] = Array.isArray(fieldError) ? fieldError[0] : fieldError
                    })
                    setErrors((prev) => ({ ...prev, ...fieldErrors }))
                }
            }
            
            // Show toast with main message or first error
            const errorMessage = errorData?.message || error.message
            const firstError = errorData?.errors 
                ? Object.values(errorData.errors)[0] 
                : null
            const displayMessage = Array.isArray(firstError) 
                ? firstError[0] 
                : firstError || errorMessage
            
            showToast(displayMessage || "Registration failed")
        },
    })

    const emailVerificationMutation = useMutation({
        mutationFn: emailVerification,
        onSuccess: async (response) => {
            console.log("email verified", response)

            // Automatically login after successful email verification
            try {
                const loginResponse = await loginMutation.mutateAsync({
                    email: formData.email.trim(),
                    password: formData.password,
                })

                // Login mutation will handle navigation
                console.log("Auto-login successful:", loginResponse)
            } catch (loginError: any) {
                console.error("Auto-login error:", loginError)
                // If auto-login fails, navigate to login page
                showToast("Email verified! Please login to continue.")
                navigation.navigate("Login" as never)
            }
        },
        onError: (error: any) => {
            console.error("Email verification error:", error)
            showToast(
                `Verification failed: ${error.response?.data?.message || error.message}`
            )
        },
    })

    const resendEmailVerificationMutation = useMutation({
        mutationFn: resendEmailVerificationCode,
        onSuccess: (response) => {
            showToast("Verification code sent successfully!")
            console.log("verification code resent", response)
        },
        onError: (error: any) => {
            console.error("Resend verification error:", error)
            showToast(
                `Failed to resend code: ${error.response?.data?.message || error.message}`
            )
        },
    })

    const handleEmailVerification = () => {
        if (otp.length === 6) {
            emailVerificationMutation.mutate({
                email: formData.email,
                confirmation_code: otp,
            })
        } else {
            showToast("Please enter a valid verification code")
        }
    }

    const handleResendEmailVerification = () => {
        if (formData.email.length > 0) {
            resendEmailVerificationMutation.mutate({
                email: formData.email,
            })
        } else {
            showToast("Please enter a valid email address")
        }
    }

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


    const handlePasswordFocus = () => {
        // Scroll to password strength container after a short delay to ensure it's rendered
        setTimeout(() => {
            if (passwordStrengthY.current > 0) {
                scrollViewRef.current?.scrollTo({
                    y: passwordStrengthY.current - 20, // Add some padding above
                    animated: true
                })
            } else {
                // Fallback: scroll to end if position not measured yet
                scrollViewRef.current?.scrollToEnd({ animated: true })
            }
        }, 100)
    }

    const handlePasswordStrengthLayout = (event: any) => {
        const { y } = event.nativeEvent.layout
        passwordStrengthY.current = y
    }

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, paddingVertical: 50 }}
                >
                    <ScrollView 
                        ref={scrollViewRef} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 32 }}
                    >
                        <View style={styles.card}>
                            {/* Progress Indicator - Step 2 */}
                            <View style={styles.stepIndicator}>
                                <View style={styles.stepBar}>
                                    <View style={[styles.stepDot, styles.stepDotInactive]} />
                                    <View style={[styles.stepDot, styles.stepDotActive]} />
                                    <View style={[styles.stepDot, styles.stepDotInactive]} />
                                    <View style={[styles.stepDot, styles.stepDotInactive]} />
                                </View>
                            </View>

                            {/* Title and Subtitle */}
                            <View style={styles.headingContainer}>
                                <Text style={styles.heading}>Finish your profile</Text>
                                <Text style={styles.subheading}>So others can connect with you on CRWD</Text>
                            </View>

                            {/* Profile Photo Section */}
                            <View style={styles.photoSection}>
                                <TouchableOpacity onPress={handleImageUpload} style={styles.photoButton}>
                                    {formData.profileImage ? (
                                        <View style={styles.photoPreview}>
                                            <Image source={{ uri: formData.profileImage }} style={styles.photoImage} />
                                        </View>
                                    ) : (
                                        <View style={styles.photoUploadButton}>
                                            <Camera size={32} color="#9333ea" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.photoLabel}>Add a Photo</Text>
                            </View>

                            {/* Form Fields */}
                            <View style={styles.formFields}>
                                {/* First Name */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        First Name <Text style={styles.required}>*</Text>
                                    </Text>
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
                                    {errors.firstName && (
                                        <Text style={styles.errorText}>{errors.firstName}</Text>
                                    )}
                                </View>

                                {/* Last Name */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        Last Name <Text style={styles.required}>*</Text>
                                    </Text>
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
                                    {errors.lastName && (
                                        <Text style={styles.errorText}>{errors.lastName}</Text>
                                    )}
                                </View>

                                {/* Email */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        Email <Text style={styles.required}>*</Text>
                                    </Text>
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
                                    {errors.email && (
                                        <Text style={styles.errorText}>{errors.email}</Text>
                                    )}
                                </View>

                                {/* Password */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        Password <Text style={styles.required}>*</Text>
                                    </Text>
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
                                            onFocus={handlePasswordFocus}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity 
                                            style={styles.eyeButton}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <Eye size={20} color="#9ca3af" /> : <EyeOff size={20} color="#9ca3af" />}
                                        </TouchableOpacity>
                                    </View>
                                    
                                    {/* Password Strength Indicator */}
                                    <View 
                                        ref={passwordStrengthRef} 
                                        style={[
                                            styles.passwordStrengthContainer,
                                            !formData.password && { opacity: 0.6 }
                                        ]}
                                        onLayout={handlePasswordStrengthLayout}
                                    >
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
                                    
                                    {errors.password && (
                                        <Text style={styles.errorText}>{errors.password}</Text>
                                    )}
                                </View>
                            </View>

                            {/* Terms and Privacy Checkbox */}
                            <View style={styles.termsContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.checkbox,
                                        errors.terms ? styles.checkboxError : formData.termsAccepted ? styles.checkboxChecked : null
                                    ]}
                                    onPress={() => {
                                        setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }))
                                        clearError('terms')
                                    }}
                                >
                                    {formData.termsAccepted && <Check size={12} color="white" />}
                                </TouchableOpacity>
                                <Text style={styles.termsText}>
                                    By checking this box, you acknowledge and agree to CRWD's{' '}
                                    <Text style={styles.termsLink}>Terms of Use</Text>
                                    {' '}and{' '}
                                    <Text style={styles.termsLink}>Privacy Policy</Text>
                                    . <Text style={styles.required}>*</Text>
                                </Text>
                            </View>
                            {errors.terms && (
                                <Text style={styles.errorText}>{errors.terms}</Text>
                            )}

                            {/* Continue Button */}
                            <TouchableOpacity
                                style={[
                                    styles.continueButton,
                                    emailRegistrationMutation.isPending && styles.continueButtonDisabled
                                ]}
                                onPress={handleContinue}
                                disabled={emailRegistrationMutation.isPending}
                            >
                                {emailRegistrationMutation.isPending ? (
                                    <View style={styles.loadingContainer}>
                                        <Loader2 size={20} color="white" />
                                        <Text style={styles.continueButtonText}>Creating Account...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.continueButtonContent}>
                                        <Text style={styles.continueButtonText}>Continue</Text>
                                        <ArrowRight size={16} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Sign In Link */}
                            <View style={styles.signInContainer}>
                                <Text style={styles.signInText}>
                                    Already have an account?{' '}
                                    <Text 
                                        style={styles.signInLink}
                                        onPress={() => navigation.navigate('Login' as never)}
                                    >
                                        Sign In
                                    </Text>
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* OTP Verification Modal */}
                <Modal
                    visible={showOTPModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowOTPModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Verify Your Email</Text>
                                <Text style={styles.modalSubtitle}>
                                    We've sent a verification code to{' '}
                                    <Text style={styles.modalEmail}>{formData.email}</Text>
                                </Text>
                            </View>

                            {/* OTP Input */}
                            <View style={styles.otpInputGroup}>
                                <Text style={styles.otpLabel}>
                                    Enter Verification Code <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChangeText={setOtp}
                                    maxLength={6}
                                    style={styles.otpInput}
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="number-pad"
                                />
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        styles.modalButtonPrimary,
                                        (otp.length !== 6 || emailVerificationMutation.isPending) && styles.modalButtonDisabled
                                    ]}
                                    onPress={handleEmailVerification}
                                    disabled={otp.length !== 6 || emailVerificationMutation.isPending}
                                >
                                    {emailVerificationMutation.isPending ? (
                                        <View style={styles.loadingContainer}>
                                            <Loader2 size={20} color="white" />
                                            <Text style={styles.modalButtonText}>Verifying...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.modalButtonText}>Verify & Continue</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonSecondary]}
                                    onPress={handleResendEmailVerification}
                                    disabled={resendEmailVerificationMutation.isPending}
                                >
                                    {resendEmailVerificationMutation.isPending ? (
                                        <View style={styles.loadingContainer}>
                                            <Loader2 size={20} color="#374151" />
                                            <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Sending...</Text>
                                        </View>
                                    ) : (
                                        <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Resend Code</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Close Modal */}
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowOTPModal(false)}
                            >
                                <Text style={styles.modalCloseText}>Back to Registration</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </LinearGradient>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    inputGroup: {
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f9fafb',
        fontSize: 14,
        color: '#111827',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingRight: 48,
        backgroundColor: '#f9fafb',
        fontSize: 14,
        color: '#111827',
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        top: 10,
        // padding: 4,
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
    },
    signInText: {
        fontSize: 14,
        color: '#6b7280',
    },
    signInLink: {
        color: '#1600ff',
        fontWeight: '500',
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
        marginBottom: 32,
    },
    photoButton: {
        alignItems: 'center',
    },
    photoUploadButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e9d5ff',
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
    formFields: {
        marginBottom: 24,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 24,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#d1d5db',
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    checkboxError: {
        borderColor: '#ef4444',
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    termsLink: {
        color: '#1600ff',
        fontWeight: '500',
    },
    continueButton: {
        backgroundColor: '#6366f1',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    modalEmail: {
        fontWeight: '500',
        color: '#111827',
    },
    otpInputGroup: {
        marginBottom: 16,
    },
    otpLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 8,
    },
    otpInput: {
        width: '100%',
        height: 48,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        backgroundColor: 'white',
        fontSize: 18,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#111827',
    },
    modalButtons: {
        gap: 12,
        marginBottom: 16,
    },
    modalButton: {
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonPrimary: {
        backgroundColor: '#6366f1',
    },
    modalButtonSecondary: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    modalButtonTextSecondary: {
        color: '#374151',
    },
    modalCloseButton: {
        padding: 12,
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 14,
        color: '#6b7280',
    },
})
