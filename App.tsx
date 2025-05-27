import React from 'react'
import 'react-native-gesture-handler'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { createDrawerNavigator } from '@react-navigation/drawer'
import Home from './src/screens/Home'

import Post from './src/screens/Post'
import Activity from './src/screens/Activity'
import Profile from './src/screens/Profile'
import { Bell, House, Plus, Search, User } from 'lucide-react-native'
import SearchScreen from './src/screens/Search'
import DonationScreen from './src/screens/DonationScreen'
import CreateCRWD from './src/screens/CreateCRWD'
import YourCRWDs from './src/screens/YourCRWDs'
import Saved from './src/screens/Saved'
import CustomDrawerContent from './src/components/drawer/CustomDrawerContent'
import { LightGrey, PrimaryGrey } from './src/Constants/Colors'
import Settings from './src/screens/Settings'
import TransactionHistory from './src/screens/TransactionHistory'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

export default function App() {

  const Tab = createBottomTabNavigator()
  const Drawer = createDrawerNavigator()
  const Stack = createNativeStackNavigator()

  function BottomTabs() {
    return (
      <Tab.Navigator screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarIcon: () => {
          if (route.name === 'Home') {
            return <House color={PrimaryGrey} size={22} />
          } else if (route.name === 'Search') {
           return <Search color={PrimaryGrey} size={22} />
          } else if (route.name === 'Post') {
            return <Plus color={PrimaryGrey} size={22} />
          } else if (route.name === 'Activity') {
            return <Bell color={PrimaryGrey} size={22} />
          } else if (route.name === 'Profile') {
            return <User color={PrimaryGrey} size={22} />
          }
        }
      })}>
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Post" component={Post} />
        <Tab.Screen name="Activity" component={Activity} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    )
  }

  function DrawerNavigator() {
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            width: '90%',
            maxWidth: 320,
          },
          drawerType: 'front',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <Drawer.Screen name="MainTabs" component={BottomTabs} />
        <Drawer.Screen name="CreateCRWD" component={CreateCRWD} />
        <Drawer.Screen name="YourCRWDs" component={YourCRWDs} />
        <Drawer.Screen name="Saved" component={Saved} />
        <Drawer.Screen name="Donation" component={DonationScreen} />
        <Drawer.Screen name='Settings' component={Settings} />
        <Drawer.Screen name='TransactionHistory' component={TransactionHistory} />
      </Drawer.Navigator>
    )
  }

  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  )

}