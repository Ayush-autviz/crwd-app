import { View, Text, Image } from 'react-native'
import React from 'react'
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors'

interface ProfileBioProps {
  imageUrl?: string;
  username?: string;
  isOwnProfile?: boolean;
}

export default function ProfileBio({ imageUrl = "https://randomuser.me/api/portraits/women/44.jpg", username = "mynameismya", isOwnProfile = false }: ProfileBioProps) {
  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Image 
          source={{ uri: imageUrl }} 
          style={{ width: 56, height: 56, borderRadius: 12 }} 
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>@{username}</Text>
          <Text style={{ fontSize: 14, color: PrimaryGrey, marginBottom: 4 }}>Atlanta, GA</Text>
          <Text style={{ fontSize: 14, color: PrimaryBlue }}>thisisaurl.com</Text>
        </View>
      </View>

      <Text style={{ 
        fontSize: 14, 
        color: PrimaryGrey, 
        marginTop: 16,
        lineHeight: 20
      }}>
        This is a bio about {username} and how they like to help others and give back to their community. They also love ice cream.
      </Text>
    </View>
  )
}