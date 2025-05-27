import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { ScrollView } from 'react-native-gesture-handler'
import { PrimaryGrey } from '../Constants/Colors'

export default function Post() {

  
  return (
    <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
        <MainHeaderNav />
        <ScrollView style={{paddingHorizontal: 20}}>
        <Text style={{fontSize: 14, margin: 20, color: PrimaryGrey}}>Select a CRWD to post to</Text>
        </ScrollView>
    </SafeAreaView>
  )
}