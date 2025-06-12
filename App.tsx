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
import Search2 from './src/screens/Search2'
import DonationScreen from './src/screens/DonationScreen'
import CreateCRWD from './src/screens/CreateCRWD'
import YourCRWDs from './src/screens/YourCRWDs'
import Saved from './src/screens/Saved'
import CustomDrawerContent from './src/components/drawer/CustomDrawerContent'
import { LightGrey, PrimaryGrey } from './src/Constants/Colors'
import Settings from './src/screens/Settings'
import TransactionHistory from './src/screens/TransactionHistory'
import GroupCRWD from './src/screens/GroupCRWD'
import CauseScreen from './src/screens/CauseScreen'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Email from './src/components/settings/Email'
import Password from './src/components/settings/Password'
import TermsOfUse from './src/components/settings/TermsOfUse'
import PrivacyPolicy from './src/components/settings/PrivacyPolicy'
import ReportIssue from './src/components/settings/ReportIssue'
import PostDetail from './src/screens/PostDetail'
import Login from './src/screens/Login'
import Signup from './src/screens/Signup'
import ForgotPassword from './src/screens/ForgotPassword'
import VerificationCode from './src/screens/VerificationCode'
import ResetPassword from './src/screens/ResetPassword'
import ProfileEdit from './src/screens/ProfileEdit'
import PaymentMethods from './src/screens/PaymentMethods'
import HelpCenter from './src/screens/HelpCenter'
import About from './src/screens/About'
import Statistics from './src/screens/Statistics'

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

  function StackNavigator() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="VerificationCode" component={VerificationCode} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="DrawerNav" component={DrawerNavigator} />
        <Stack.Screen name="GroupCRWD" component={GroupCRWD} />
        <Stack.Screen name="CauseScreen" component={CauseScreen} />
        <Stack.Screen name="Search2" component={Search2} />
        <Stack.Screen name="Email" component={Email} />
        <Stack.Screen name="Password" component={Password} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUse} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="ReportIssue" component={ReportIssue} />
        <Stack.Screen name="PostDetail" component={PostDetail} />
        <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethods} />
        <Stack.Screen name="HelpCenter" component={HelpCenter} />
        <Stack.Screen name="About" component={About} />
        <Stack.Screen name="Statistics" component={Statistics} />
      </Stack.Navigator>
    )
  }

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  )

}