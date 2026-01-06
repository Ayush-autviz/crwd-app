import React, { useEffect } from 'react'
import 'react-native-gesture-handler'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { navigationRef } from './src/navigation/navigationRef'
import { createDrawerNavigator } from '@react-navigation/drawer'
import Home from './src/screens/Home'
import NewHome from './src/screens/NewHome'
import { ToastProvider } from './src/contexts/ToastContext'
import Post from './src/screens/Post'
import Activity from './src/screens/Activity'
import Profile from './src/screens/Profile'
import { Bell, Home as HomeIcon, Search, Users, Archive, Heart } from 'lucide-react-native'
import SearchScreen from './src/screens/Search'
import Search2 from './src/screens/Search2'
import DonationScreen from './src/screens/DonationScreen'
import ManageDonationBoxScreen from './src/components/donation/ManageDonationBox'
import CreateCRWD from './src/screens/CreateCRWD'
import NewCreateCollective from './src/screens/NewCreateCollective'
import NewEditCollective from './src/screens/NewEditCollective'
import YourCRWDs from './src/screens/YourCRWDs'
import Saved from './src/screens/Saved'
import CustomDrawerContent from './src/components/drawer/CustomDrawerContent'
import { LightGrey, PrimaryGrey, PrimaryBlue } from './src/Constants/Colors'
import Settings from './src/screens/Settings'
import TransactionHistory from './src/screens/TransactionHistory'
import GroupCRWD from './src/screens/GroupCRWD'
import NewGroupCrwd from './src/screens/NewGroupCrwd'
import CauseScreen from './src/screens/CauseScreen'
import NewCause from './src/screens/NewCause'
import NewSearch from './src/screens/NewSearch'
import SurpriseMe from './src/screens/SurpriseMe'
import Articles from './src/screens/Articles'
import ArticleDetail from './src/screens/ArticleDetail'
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
import Members from './src/screens/Members'
import CRWDScreen from './src/screens/CRWDScreen'
import ManageCRWD from './src/screens/ManageCRWD'
import Interests from './src/screens/Interests'
import GoogleCallback from './src/screens/GoogleCallback'
import UserProfile from './src/screens/UserProfile'
import SplashScreen from './src/screens/SplashScreen'
import ClaimProfile from './src/components/onboarding/ClaimProfile'
import AddPhoto from './src/components/onboarding/AddPhoto'
import NonProfitInterests from './src/components/onboarding/NonProfitInterests'
import CompleteOnboard from './src/components/onboarding/CompleteOnboard'
import OnBoard from './src/components/onboarding/OnBoard'
import NewOnboard from './src/components/onboarding/NewOnboard'
import OneTimeDonationScreen from './src/screens/OneTimeDonationScreen'
import NewSaved from './src/screens/NewSaved'
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6'
import { Image, Platform, View } from 'react-native'
import { PermissionsAndroid } from 'react-native'
import Circles from './src/screens/Circles'
import NewSettings from './src/screens/NewSettings'
import FundraiserDetail from './src/screens/FundraiserDetail'
import CreateFundraiser from './src/screens/CreateFundraiser'
import EditFundraiser from './src/screens/EditFundraiser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StripeProvider } from '@stripe/stripe-react-native'
import { STRIPE_PUBLISHABLE_KEY } from './src/config/stripe'
import messaging from '@react-native-firebase/messaging'
import notifee, { AndroidImportance } from '@notifee/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function App() {

  const Tab = createBottomTabNavigator()
  const Drawer = createDrawerNavigator()
  const Stack = createNativeStackNavigator()


  // Create QueryClient once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});


async function requestPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Notification permission granted');
    } else {
      console.log('Notification permission denied');
    }
  }
  else if (Platform.OS === 'ios') {
    // Add iOS notification permission request
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('iOS notification permission granted');
    } else {
      console.log('iOS notification permission denied');
    }
  }
}

useEffect(() => {
  requestPermission();
}, []);

  // Handle foreground messages
  useEffect(() => {
    console.log('useEffect');
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);

      console.log('Notification type:', remoteMessage.data?.type);

      // Invalidate unread count query to update notification count in drawer
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });

      // Request permissions if needed
      await notifee.requestPermission({
        sound: true,
        badge: true,
        alert: true,
      });

      // await notifee.deleteChannel('default');

      // Create single channel (Android)
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
      });

      // Display a notification
      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        ios: {
          sound: 'default',
        },
        android: {
          channelId: 'default',
          pressAction: {
            id: 'default',
          },
          sound: 'default',
        },
      });
    });

    return unsubscribe;
  }, [queryClient]);  

  function BottomTabs() {
    return (
      <Tab.Navigator screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: PrimaryBlue,
        tabBarInactiveTintColor: PrimaryGrey,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 75 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 4,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '400',
          marginTop: 4,
        },
        tabBarActiveLabelStyle: {
          fontWeight: '600',
        },
        tabBarIcon: ({focused, color}) => {
          if (route.name === 'Home') {
            return <Image source={require('./src/assets/icons/home.png')} style={{width: 22, height: 22, tintColor: color}} />
          } else if (route.name === 'Search') {
            return <Image source={require('./src/assets/icons/search.png')} style={{width: 22, height: 22, tintColor: color}} />
          } else if (route.name === 'Donate') {
            return (
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 100,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: -30,
                marginBottom: -8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}>
                <Heart size={28} color={color} />
              </View>
            )
          } else if (route.name === 'Collectives') {
            return <Users color={color} size={22} />
          } else if (route.name === 'Profile') {
            return <Image source={require('./src/assets/icons/user.png')} style={{width: 22, height: 22, tintColor: color}} />
          }
        }
      })}>
        <Tab.Screen name="Home" component={NewHome} options={{ tabBarLabel: 'Home' }} />
        <Tab.Screen name="Search" component={NewSearch} options={{ tabBarLabel: 'Search' }} />
        <Tab.Screen name="Donate" component={DonationScreen} options={{ tabBarLabel: 'Donate' }} />
        <Tab.Screen name="Collectives" component={Circles} options={{ tabBarLabel: 'Collectives' }} />
        <Tab.Screen name="Profile" component={Profile} options={{ tabBarLabel: 'Profile' }} />
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
            // maxWidth: 320,
            right: 0
          },
          drawerType: 'front',
          drawerPosition: 'right',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <Drawer.Screen name="MainTabs" component={BottomTabs} />
        <Drawer.Screen name="CreateCRWD" component={NewCreateCollective} />
        <Drawer.Screen name="YourCRWDs" component={YourCRWDs} />
        {/* <Drawer.Screen name="Saved" component={Saved} /> */}
        <Drawer.Screen name="Saved" component={NewSaved} />
        <Drawer.Screen name="Donation" component={DonationScreen} />
        <Drawer.Screen name='Settings' component={Settings} />
        <Drawer.Screen name='TransactionHistory' component={TransactionHistory} />
        {/* <Stack.Screen name="Post" component={Post} /> */}
      </Drawer.Navigator>
    )
  }

  function StackNavigator() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DrawerNav" component={DrawerNavigator} />
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="OnBoard" component={OnBoard} />
        <Stack.Screen name="ClaimProfile" component={ClaimProfile} />
        <Stack.Screen name="AddPhoto" component={AddPhoto} />
        <Stack.Screen name="NonProfitInterests" component={NonProfitInterests} />
        <Stack.Screen name="CompleteOnboard" component={CompleteOnboard} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="VerificationCode" component={VerificationCode} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="GoogleCallback" component={GoogleCallback} />
        {/* <Stack.Screen name="DrawerNav" component={DrawerNavigator} /> */}
        <Stack.Screen name="GroupCRWD" component={NewGroupCrwd} />
        <Stack.Screen name="CauseScreen" component={NewCause} />
        <Stack.Screen name="NewSearch" component={NewSearch} />
        <Stack.Screen name="SurpriseMe" component={SurpriseMe} />
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
        <Stack.Screen name="Members" component={Members} />
        <Stack.Screen name="CRWDScreen" component={CRWDScreen} />
        <Stack.Screen name="ManageCRWD" component={NewEditCollective} />
        <Stack.Screen name="Interests" component={Interests} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="Circles" component={Circles} />
        <Stack.Screen name='Search' component={NewSearch} />
        <Stack.Screen name="NewSettings" component={NewSettings} />
        <Stack.Screen name='Activity' component={Activity} />
        <Stack.Screen name="Post" component={Post} />
        <Stack.Screen name="ManageDonationBox" component={ManageDonationBoxScreen} />
        <Stack.Screen name="OneTimeDonationScreen" component={OneTimeDonationScreen} />
        <Stack.Screen name="FundraiserDetail" component={FundraiserDetail} />
        <Stack.Screen name="CreateFundraiser" component={CreateFundraiser} />
        <Stack.Screen name="EditFundraiser" component={EditFundraiser} />
       
        <Stack.Screen name="Articles" component={Articles} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetail} />
      </Stack.Navigator>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier='merchant.com.react.crwd'>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <ToastProvider>
                <StackNavigator />
              </ToastProvider>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </StripeProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  )

}