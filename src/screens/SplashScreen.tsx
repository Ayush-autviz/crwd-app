import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import First from '../components/onboarding/OnBoard'
import ClaimProfile from '../components/onboarding/ClaimProfile'
import NonProfitInterests from '../components/onboarding/NonProfitInterests'
import AddPhoto from '../components/onboarding/AddPhoto'
import OnBoard from '../components/onboarding/OnBoard'

export default function SplashScreen() {
  return (
    <SafeAreaView style={{flex: 1,paddingHorizontal: 20, backgroundColor: 'white'}}>
<OnBoard />

    </SafeAreaView>
  )
}