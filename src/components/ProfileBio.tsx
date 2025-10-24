import { View, Text, Image } from 'react-native'
import React from 'react'
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors'

interface ProfileBioProps {
  bio?: string;
}

export default function ProfileBio({ bio = "No bio available" }: ProfileBioProps) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ 
        fontSize: 14, 
        color: PrimaryGrey, 
        lineHeight: 20
      }}>
        {bio}
      </Text>
    </View>
  )
}