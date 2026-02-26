import { View, Text, Image } from 'react-native'
import React from 'react'
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors'

interface ProfileBioProps {
  bio?: string;
}

export default function ProfileBio({ bio }: ProfileBioProps) {
  return (
    <View style={{}}>
      <Text style={{
        fontSize: 15,
        color: '#000000',
        // lineHeight: 20,
        textAlign: 'center',
        fontFamily: 'Outfit-Regular',
      }}>
        {bio}
      </Text>
    </View>
  )
}