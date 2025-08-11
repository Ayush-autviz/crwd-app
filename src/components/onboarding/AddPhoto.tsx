import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors'
import * as ImagePicker from 'react-native-image-picker'
import OnboardingHeader from './OnboardingHeader'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

export default function AddPhoto() {
    const navigation = useNavigation<any>()
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const avatarImages = [
        "https://randomuser.me/api/portraits/men/33.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
        "https://randomuser.me/api/portraits/men/34.jpg",
        "https://randomuser.me/api/portraits/women/45.jpg",
        "https://randomuser.me/api/portraits/men/35.jpg",
        "https://randomuser.me/api/portraits/women/46.jpg",
        "https://randomuser.me/api/portraits/men/36.jpg",
        "https://randomuser.me/api/portraits/women/47.jpg",
        "https://randomuser.me/api/portraits/men/37.jpg",
        // "https://randomuser.me/api/portraits/women/48.jpg",
    ];

    const pickImage = () => {
        console.log('🚀 Image picker triggered')

        const options: ImagePicker.ImageLibraryOptions = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        }

        console.log('📱 Launching image library with options:', options)

        ImagePicker.launchImageLibrary(options, (response) => {
            console.log('📸 Image picker response:', response)

            if (response.didCancel) {
                console.log('❌ User cancelled image picker')
            } else if (response.errorCode) {
                console.log('❌ ImagePicker Error Code:', response.errorCode)
                console.log('❌ ImagePicker Error Message:', response.errorMessage)
            } else if (response.assets && response.assets[0] && response.assets[0].uri) {
                console.log('✅ Image selected successfully:', response.assets[0].uri)
                setSelectedImage(response.assets[0].uri)
            } else {
                console.log('⚠️ No image selected or invalid response')
                console.log('📋 Full response:', JSON.stringify(response, null, 2))
            }
        })
    }

    return (
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, backgroundColor: 'white' }}>
            <OnboardingHeader />
            <Text style={{
                fontSize: 28,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 12,
                textAlign: 'center', marginTop: 20
            }}>Add a Photo</Text>
            <Text style={{
                fontSize: 16,
                color: PrimaryGrey,
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 20,
            }}>Pro tip: Choose one your friends will recognize so you can swap claims</Text>

            <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 20 }}>
                {/* Image Preview Area */}
                <View style={{ marginBottom: 20, alignItems: 'center' }}>
                    {selectedImage ? (
                        <Image
                            source={{ uri: selectedImage }}
                            style={{
                                width: 200,
                                height: 200,
                                borderRadius: 100,
                                resizeMode: 'cover'
                            }}
                        />
                    ) : (
                        <View style={{
                            width: 200,
                            height: 200,
                            borderRadius: 100,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#000000',
                            backgroundColor: '#f6f6f6'
                        }}>
                            <Text style={{ fontSize: 14, color: '#000000', textAlign: 'center' }}>
                                No photo selected
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={{
                        backgroundColor: "white",
                        padding: 10,
                        borderRadius: 10,
                        // marginTop: 20,
                        width: '50%',
                        borderWidth: 1,
                        borderColor: 'black',
                        alignSelf: 'center'
                    }}
                    onPress={pickImage}
                >
                    <Text style={{ color: 'black', fontSize: 16, fontWeight: '500', textAlign: 'center' }}>
                        {selectedImage ? 'Change' : 'Upload'}
                    </Text>
                </TouchableOpacity>


                <Text style={{ fontSize: 14, fontWeight: '600', marginTop: 30, color: '#000000', textAlign: 'left' }}>Recently Joined CRWDs...</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        {avatarImages.map((avatar: any, index: number) => (
                                            <Image
                                                key={index}
                                                source={{ uri: avatar}}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 15,
                                                    borderWidth: 2,
                                                    borderColor: 'white',
                                                    marginLeft: index > 0 ? -8 : 0, // Create overlap with negative margin
                                                }}
                                            />
                                        ))}
                                    </View>
                                </View>
            </View>

            <TouchableOpacity style={{ backgroundColor: PrimaryBlue, padding: 15, borderRadius: 12, marginTop: 20 }} onPress={() => navigation.navigate('NonProfitInterests')}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ backgroundColor: 'white', padding: 10, borderRadius: 12, marginTop: 10 }} onPress={() => navigation.navigate('NonProfitInterests')}>
                <Text style={{ color: 'black', fontSize: 16, fontWeight: '500', textAlign: 'center' }}>Skip</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}