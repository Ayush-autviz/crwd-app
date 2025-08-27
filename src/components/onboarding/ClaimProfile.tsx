import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native'
import React, { useState, useRef } from 'react'
import { ChevronLeft, Check, Camera, X } from 'lucide-react-native'
import OnboardingHeader from './OnboardingHeader'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import DatePicker from 'react-native-date-picker'
import { PrimaryBlue } from '../../Constants/Colors'
import * as ImagePicker from 'react-native-image-picker'

export default function ClaimProfile() {
    const navigation = useNavigation<any>()
    const [checked, setChecked] = useState(false)
    const [date, setDate] = useState<Date | null>(null)
    const [open, setOpen] = useState(false)
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const formattedDate = date
        ? date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : ''

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
                setSelectedImage(response.assets[0].uri || null)
            }
        })
    }

    const handleRemovePhoto = () => {
        setSelectedImage(null)
    }

    return (
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, backgroundColor: 'white' }}>
            <OnboardingHeader />

            <DatePicker
                modal
                open={open}
                date={date || new Date()} // fallback date if none selected
                mode="date"
                maximumDate={new Date()}
                onConfirm={(selectedDate) => {
                    setOpen(false)
                    setDate(selectedDate)
                }}
                onCancel={() => {
                    setOpen(false)
                }}
                theme='light'
            />

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
                <View style={styles.stepBar}>
                    <View style={[styles.stepDot, styles.stepDotInactive]} />
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View style={[styles.stepDot, styles.stepDotInactive]} />
                </View>
            </View>

            {/* Heading */}
            <View style={styles.headingContainer}>
                <Text style={styles.heading}>Finish your profile</Text>
                <Text style={styles.subheading}>So others can connect with you on CRWD</Text>
            </View>

            {/* Add Photo Section */}
            <View style={styles.photoSection}>
                <View style={styles.photoContainer}>
                    {selectedImage ? (
                        <View style={styles.photoPreview}>
                            <Image source={{ uri: selectedImage }} style={styles.photoImage} />
                            <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
                                <X size={12} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.photoUploadButton} onPress={handleImageUpload}>
                            <Camera size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.photoLabel}>Add a Photo</Text>
                <Text style={styles.photoSubtext}>OPTIONAL</Text>
            </View>

            <View style={{ flex: 1, padding: 5, marginTop: 20, gap: 5 }}>
                <Text style={styles.label}>Name</Text>
                <TextInput 
                    placeholder="Enter your full name" 
                    style={styles.input} 
                    placeholderTextColor="#9ca3af"
                    value={fullName}
                    onChangeText={setFullName}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput 
                    placeholder="janedoe@example.com" 
                    style={styles.input} 
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity onPress={() => setOpen(true)}>
                    {formattedDate ? <Text style={styles.input}>{formattedDate}</Text> : <Text style={[styles.input, { color: '#9ca3af' }]}>Select date</Text>}
                </TouchableOpacity>
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
                        borderColor: checked ? 'black' : 'gray',
                        borderRadius: 50,
                        padding: checked ? 3 : 10.5,
                        backgroundColor: checked ? 'black' : 'white',
                    }}
                    onPress={() => setChecked(!checked)}
                >
                    {checked ? <Check size={15} color="white" /> : null}
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

            <TouchableOpacity
                style={{
                    backgroundColor: PrimaryBlue,
                    padding: 15,
                    borderRadius: 12,
                    marginTop: 20,
                    alignItems: 'center',
                }}
                onPress={() => navigation.navigate('NonProfitInterests')}
            >
                <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>Continue</Text>
            </TouchableOpacity>
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
