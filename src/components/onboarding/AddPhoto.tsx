import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { PrimaryBlue } from '../../Constants/Colors'
import * as ImagePicker from 'react-native-image-picker'
import OnboardingHeader from './OnboardingHeader'

export default function AddPhoto() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

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
        <View style={{ flex: 1 }}>
            <OnboardingHeader />
            <Text style={{ fontSize: 28, fontWeight: '700', marginTop: 50, textAlign: 'center' }}>Add a Photo</Text>
            <Text style={{ fontSize: 12, color: 'gray', fontWeight: '400', marginTop: 10, textAlign: 'center' }}>Pro tip: Choose one your friends will recognize so you can swap claims</Text>

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {/* Image Preview Area */}
                <View style={{ marginBottom: 30 }}>
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
                            width:200,
                            height: 200,
                            borderRadius: 100,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#000000',
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
                        marginTop: 20, 
                        width: '50%',
                        borderWidth: 1,
                        borderColor: 'black'
                    }}
                    onPress={pickImage}
                >
                    <Text style={{ color: 'black', fontSize: 16, fontWeight: '500', textAlign: 'center' }}>
                        {selectedImage ? 'Change' : 'Upload'}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={{backgroundColor: 'black', padding: 10, borderRadius: 5, marginTop: 20}}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '500', textAlign: 'center' }}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ backgroundColor: 'white', padding: 10, borderRadius: 5, marginTop: 10}}>
                <Text style={{ color: 'black', fontSize: 16, fontWeight: '500', textAlign: 'center' }}>Skip</Text>
            </TouchableOpacity>
        </View>
    )
}