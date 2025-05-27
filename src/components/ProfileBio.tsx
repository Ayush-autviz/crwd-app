import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { MapPin, Upload } from 'lucide-react-native'
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors'

export default function ProfileBio() {

    const data = {
        avatarUrl:"https://randomuser.me/api/portraits/women/44.jpg",
        name:"My Name is Mya",
        username:"myamakes_moves",
        location:"Atlanta, GA",
        bio:`This is a bio about Mya and how she likes to help others and give back to her community. She also loves ice cream.`
}

    return (
        <>
            <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
                <View style={{ borderColor: PrimaryGrey, borderWidth: 1, borderRadius: 10, padding: 8 }}>
                    <Upload size={20} />
                </View>
                <TouchableOpacity style={{ backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, }}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit</Text>
                </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 20 }}>
                <Image source={{ uri: data.avatarUrl }} style={{ width: 60, height: 60, borderRadius: 10 }} />
                {/* <View> */}
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{data.name}</Text>
                    {/* <Text style={{ color: PrimaryGrey }}>{data.username}</Text> */}
                {/* </View> */}
            </View>
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 10 }}>
                {/* <Image source={require('../assets/icons/location.png')} style={{ width: 20, height: 20 }} /> */}
                <MapPin size={20} color={PrimaryGrey} />
                <Text style={{ color: PrimaryGrey }}>{data.location}</Text>
                <Text style={{ color: PrimaryBlue }}>thisisaurl.com</Text>
            </View>
            <View style={{ marginTop: 20 }}>
                <Text style={{ color: '#000' }}>{data.bio}</Text>
            </View>
        </>
    )
}