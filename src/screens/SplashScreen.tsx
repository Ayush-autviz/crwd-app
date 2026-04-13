import { View, Image, StyleSheet, Text, TouchableOpacity, Linking, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../store/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import { getLatestAppVersion } from '../services/api/auth'
import { PrimaryBlue } from '../Constants/Colors'
import AppUpdate from '../components/ui/AppUpdate'
import VersionCheck from 'react-native-version-check';
import { lt } from 'semver'

export default function SplashScreen() {
  const navigation = useNavigation()
  const [needsUpdate, setNeedsUpdate] = useState(false)

  const normalizeVersion = (v) => {
    const parts = v.split('.');
    while (parts.length < 3) parts.push('0');
    return parts.join('.');
  };


  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Version Check
        const latest = await VersionCheck.getLatestVersion();
        const currentVersion = DeviceInfo.getVersion();

        console.log('Current App Version:', currentVersion);
        console.log('Latest App Version:', latest);

        if (lt(normalizeVersion(currentVersion), normalizeVersion(latest))) {
          console.log('Update required');
          setNeedsUpdate(true);
          return;
        }
        else {
          console.log('Update not required');
        }


        // Wait for AsyncStorage to load the persisted state
        const storedData = await AsyncStorage.getItem('driver-auth-storage')
        const parsedData = storedData ? JSON.parse(storedData) : null

        // Small delay to show splash screen
        await new Promise(resolve => setTimeout(resolve, 800))

        // Check if access token exists in stored data
        const hasToken = parsedData?.state?.token?.access_token

        if (hasToken) {
          // User is authenticated - go to home
          navigation.reset({
            index: 0,
            routes: [{ name: 'DrawerNav' as never }],
          })
        } else {
          // User is not authenticated - go to onboarding
          navigation.reset({
            index: 0,
            routes: [{ name: 'OnBoard' as never }],
          })
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        // On error, go to onboarding
        navigation.reset({
          index: 0,
          routes: [{ name: 'OnBoard' as never }],
        })
      }
    }

    checkAuth()
  }, [navigation])

  if (needsUpdate) {
    return <AppUpdate />
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/newLogo/FullLogo.png')}
        style={styles.logo}
        resizeMode='contain'
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
})