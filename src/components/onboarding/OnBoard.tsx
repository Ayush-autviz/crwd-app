// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   Animated,
//   Easing,
//   Dimensions,
//   Alert,
//   ActivityIndicator,
//   Linking,
// } from 'react-native';
// import React, { useEffect, useRef, useState } from 'react';
// import { useNavigation } from '@react-navigation/native';
// import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
// import { SvgXml } from 'react-native-svg';
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { googleLogin, googleCallback as googleCallbackApi } from '../../services/api/auth';
// import { useAuthStore } from '../../store/store';
// import { useToast } from '../../contexts/ToastContext';
// import InAppBrowser from 'react-native-inappbrowser-reborn';

// const images = [
//   require('../../assets/ngo/aspca.jpg'),
//   require('../../assets/ngo/cancerSociety.png'),
//   require('../../assets/ngo/girlCode.png'),
//   require('../../assets/ngo/redCross.png'),
//   require('../../assets/ngo/makeAwish.jpg'),
//   require('../../assets/ngo/paws.jpeg'),
//   require('../../assets/ngo/CRI.jpg'),
//   require('../../assets/ngo/catAllies.jpeg'),
//   require('../../assets/ngo/cureSearch.png'),
// ];

// function shuffleArray(array: any[]) {
//   const copy = [...array];
//   for (let i = copy.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [copy[i], copy[j]] = [copy[j], copy[i]];
//   }
//   return copy;
// }

// export default function OnBoard() {
//   const scrollXTop = useRef(new Animated.Value(0)).current;
//   const scrollXBottom = useRef(new Animated.Value(0)).current;
//   const navigation = useNavigation();
//   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
//   const { setUser, setToken } = useAuthStore();
//   const { showToast } = useToast();

//   // // React Query hooks
//   // const googleLoginQuery = useQuery({
//   //   queryKey: ['googleLogin'],
//   //   queryFn: googleLogin,
//   //   enabled: false, // Don't run automatically
//   // });

//   // const [callbackCode, setCallbackCode] = useState<string | null>(null);

//   // const googleCallbackQuery = useQuery({
//   //   queryKey: ['googleCallback', callbackCode],
//   //   queryFn: () => googleCallback(callbackCode!),
//   //   enabled: !!callbackCode, // Only run when we have a code
//   // });

//   // // Handle Google callback success/error
//   // useEffect(() => {
//   //   if (googleCallbackQuery.data && callbackCode) {
//   //     const data = googleCallbackQuery.data;
//   //     if (data && data.user && data.access_token) {
//   //       // Store user data and token
//   //       setUser(data.user);
//   //       setToken({
//   //         access_token: data.access_token,
//   //         refresh_token: data.refresh_token
//   //       });

//   //       // Navigate to main app
//   //       navigation.navigate('DrawerNav' as never);
//   //     } else {
//   //       Alert.alert('Error', 'Authentication failed');
//   //     }
//   //   }
//   // }, [googleCallbackQuery.data, callbackCode, setUser, setToken, navigation]);

//   // useEffect(() => {
//   //   if (googleCallbackQuery.error && callbackCode) {
//   //     console.error('Google callback failed:', googleCallbackQuery.error);
//   //     Alert.alert('Error', 'Authentication failed. Please try again.');
//   //   }
//   // }, [googleCallbackQuery.error, callbackCode]);

//   const googleCallbackMutation = useMutation({
//     mutationFn: googleCallbackApi,
//     onSuccess: (response) => {
//       console.log('Google callback successful:', response)
//       if (response.user) setUser(response.user);
//       if (response.access_token) {
//         setToken({
//           access_token: response.access_token,
//           refresh_token: response.refresh_token,
//         });
//       }
//       showToast('Google authentication successful!');

//       // If last_login_at is null, navigate to nonprofit interests page (new user)
//       if (response.user && !response.user.last_login_at) {
//         (navigation as any).navigate('NonProfitInterests', { fromAuth: true })
//       } else {
//         // Navigate to main app for existing users
//       navigation.navigate('DrawerNav' as never);
//       }
//     },
//     onError: (error: any) => {
//       console.error('Google callback error:', error)
//       const errorMessage = error?.response?.data?.message || error.message || 'Google callback failed'
//       showToast(errorMessage)
//     },
//   })

//   const IMAGE_SIZE = 80;
//   const IMAGE_MARGIN = 15;
//   const ITEM_WIDTH = IMAGE_SIZE + IMAGE_MARGIN * 2;

//   const rowTop = images;
//   const rowBottom = shuffleArray(images);

//   const rowWidth = rowTop.length * ITEM_WIDTH;

//   const startLoop = (animatedValue: Animated.Value, duration: number) => {
//     animatedValue.setValue(0);
//     Animated.loop(
//       Animated.timing(animatedValue, {
//         toValue: -rowWidth,
//         duration,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   useEffect(() => {
//     startLoop(scrollXTop, 15000);
//     startLoop(scrollXBottom, 20000);
//   }, []);

//   const googleXml = `<svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
//                     <path
//                       fill="#4285F4"
//                       d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                     />
//                     <path
//                       fill="#34A853"
//                       d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                     />
//                     <path
//                       fill="#FBBC05"
//                       d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                     />
//                     <path
//                       fill="#EA4335"
//                       d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                     />
//                   </svg>`

//   // const handleGoogleLogin = async () => {
//   //   setIsGoogleLoading(true);
//   //   try {
//   //     const result = await googleLoginQuery.refetch();
//   //     console.log('Google login response:', result);

//   //     // Open the device browser with the Google login URL
//   //     if (result.data?.url) {
//   //       const supported = await Linking.canOpenURL(result.data.url);
//   //       if (supported) {
//   //         await Linking.openURL(result.data.url);
//   //       } else {
//   //         showToast('Unable to open browser');
//   //         setIsGoogleLoading(false);
//   //       }
//   //     } else {
//   //       showToast('Invalid response from server');
//   //       setIsGoogleLoading(false);
//   //     }
//   //   } catch (error: any) {
//   //     console.error('Google login error:', error);
//   //     const errorMessage = error?.response?.data?.message || error.message || 'Failed to initiate Google login';
//   //     showToast(errorMessage);
//   //     setIsGoogleLoading(false);
//   //   }
//   // };


//   const handleGoogleLogin = async () => {
//     console.log('=== Google Login Started ===');
//     setIsGoogleLoading(true)

//       const result = await googleLogin();

//       if (result && result.url) {
//         console.log('Got OAuth URL:', result.url);

//         // Use InAppBrowser instead of Linking
//         if (await InAppBrowser.isAvailable()) {
//           const authResult = await InAppBrowser.openAuth(
//             result.url,
//             'crwd-app://googleCallback', // Your redirect URL
//             {
//               ephemeralWebSession: false,
//               showTitle: false,
//               enableUrlBarHiding: true,
//               enableDefaultShare: false,
//             }
//           )

//           console.log('Auth result:', authResult);

//           if (authResult.type === 'success' && authResult.url) {
//             // Handle the callback URL directly here
//             const codeMatch = authResult.url.match(/[?&]code=([^&]+)/);
//             const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;

//             if (code) {
//               googleCallbackMutation.mutateAsync(code);


//           }
//         } else {
//           // Fallback to regular Linking
//           await Linking.openURL(result.url);
//         }

//         setIsGoogleLoading(false);
//       }
//     } 
//   }

//   const renderRow = (rowImages: any[], animatedValue: Animated.Value, verticalOffsetPattern: number[]) => (
//     <View style={{ height: 140, overflow: 'hidden', marginHorizontal: -20 }}>
//       <Animated.View
//         style={{
//           flexDirection: 'row',
//           transform: [{ translateX: animatedValue }],
//         }}
//       >
//         {/* first copy */}
//         {rowImages.map((img: any, index: number) => {
//           const verticalOffset =
//             index % 2 === 0 ? verticalOffsetPattern[0] : verticalOffsetPattern[1];
//           return (
//             <View
//               key={'first_' + index}
//               style={{
//                 marginHorizontal: IMAGE_MARGIN,
//                 transform: [{ translateY: verticalOffset }],
//               }}
//             >
//               <Image
//                 source={img}
//                 style={{
//                   width: IMAGE_SIZE,
//                   height: IMAGE_SIZE,
//                   borderRadius: 75,
//                 }}
//                 resizeMode="cover"
//               />
//             </View>
//           );
//         })}
//         {/* second copy */}
//         {rowImages.map((img: any, index: number) => {
//           const verticalOffset =
//             index % 2 === 0 ? verticalOffsetPattern[0] : verticalOffsetPattern[1];
//           return (
//             <View
//               key={'second_' + index}
//               style={{
//                 marginHorizontal: IMAGE_MARGIN,
//                 transform: [{ translateY: verticalOffset }],
//               }}
//             >
//               <Image
//                 source={img}
//                 style={{
//                   width: IMAGE_SIZE,
//                   height: IMAGE_SIZE,
//                   borderRadius: 75,
//                 }}
//                 resizeMode="cover"
//               />
//             </View>
//           );
//         })}
//       </Animated.View>
//     </View>
//   );

//   return (
//     <View style={{ flex: 1, paddingTop: 60, justifyContent: 'space-between' }}>
//       <View>

//       {/* Step Indicator */}
//       <View style={{ 
//           flexDirection: 'row', 
//           justifyContent: 'center', 
//           alignItems: 'center', 
//           marginBottom: 30,
//           gap: 8
//         }}>
//           <View style={{
//             width: 48,
//             height: 4,
//             borderRadius: 2,
//             backgroundColor: '#000000',
//           }} />
//           <View style={{
//             width: 48,
//             height: 4,
//             borderRadius: 2,
//             backgroundColor: '#d1d5db',
//           }} />
//           <View style={{
//             width: 48,
//             height: 4,
//             borderRadius: 2,
//             backgroundColor: '#d1d5db',
//           }} />
//         </View>

//         {/* Logo */}
//         {/* <Image
//           source={require('../../assets/logo/CRWD.png')}
//           style={{
//             width: '50%',
//             height: 60,
//             alignSelf: 'center',
//             borderRadius: 30,
//           }}
//           resizeMode="contain"
//         /> */}

//         {/* Heading */}
//         <Text
//           style={{
//             fontSize: 28,
//             fontWeight: '800',
//             color: '#111827',
//             marginBottom: 12,
//             textAlign: 'center',
//             // marginTop: 20,
//           }}
//         >
//           Welcome to CRWD
//         </Text>

//         {/* Subtitle */}
//         <Text
//           style={{
//             fontSize: 16,
//             color: PrimaryGrey,
//             textAlign: 'center',
//             lineHeight: 24,
//             fontWeight: '700',
//             marginBottom: 12,
//           }}
//         >
//           Give to everything you care about, at once.
//         </Text>

//         <Text
//           style={{
//             fontSize: 16,
//             color: PrimaryGrey,
//             textAlign: 'center',
//             lineHeight: 24,
//             fontWeight: '500',
//             marginBottom: 50,
//           }}
//         >
//           Discover nonprofits like these on CRWD
//         </Text>



//         {/* Top row */}
//         {renderRow(rowTop, scrollXTop, [0, 20])}

//         {/* Bottom row */}
//         {renderRow(rowBottom, scrollXBottom, [25, 5])}
//       </View>

//       {/* Buttons - exactly like crwd-vite */}
//       <View style={{ marginBottom: 30 }}>
//         {/* Divider - "continue with" */}
//         <View style={{ position: 'relative', marginBottom: 20 }}>
//           {/* Left line segment */}
//           <View style={{
//             position: 'absolute',
//             top: 10,
//             left: 0,
//             right: '50%',
//             height: 1,
//             backgroundColor: '#e5e7eb',
//             marginRight: 60,
//           }} />

//           {/* Right line segment */}
//           <View style={{
//             position: 'absolute',
//             top: 10,
//             left: '50%',
//             right: 0,
//             height: 1,
//             backgroundColor: '#e5e7eb',
//             marginLeft: 60,
//           }} />

//           {/* Center text */}
//           <View style={{
//             alignItems: 'center',
//             // backgroundColor: 'white',
//             paddingHorizontal: 8,
//           }}>
//             <Text style={{
//               fontSize: 12,
//               color: '#6b7280',
//               textTransform: 'uppercase',

//               paddingHorizontal: 8,
//             }}>
//               continue with
//             </Text>
//           </View>
//         </View>

//         {/* Google Login Button */}
//         {/* <TouchableOpacity
//           style={{
//             borderWidth: 1,
//             borderColor: '#d1d5db',
//             padding: 12,
//             borderRadius: 8,
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: 'center',
//             backgroundColor: 'white',
//             marginBottom: 12,
//           }}
//           onPress={handleGoogleLogin}
//           disabled={isGoogleLoading}
//         >
//           {isGoogleLoading ? (
//             <ActivityIndicator size="small" color={PrimaryGrey} style={{ marginRight: 8 }} />
//           ) : (
//             <View style={{ marginRight: 8 }}>
//               <SvgXml xml={googleXml} style={{ width: 20, height: 20 }} />
//             </View>
//           )}
//           <Text style={{
//             color: '#374151',
//             fontSize: 14,
//             fontWeight: '500',
//           }}>
//             {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
//           </Text>
//         </TouchableOpacity> */}

//         {/* Get Started button */}
//         <TouchableOpacity
//           style={{
//             backgroundColor: PrimaryBlue,
//             padding: 14,
//             borderRadius: 8,
//             marginBottom: 12,
//           }}
//           onPress={() => navigation.navigate('ClaimProfile' as never)}
//         >
//           <Text
//             style={{
//               color: 'white',
//               fontSize: 14,
//               fontWeight: '500',
//               textAlign: 'center',
//             }}
//           >
//             Get Started
//           </Text>
//         </TouchableOpacity>

//         {/* Login link */}
//         <View style={{ alignItems: 'center' }}>
//           <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
//             <Text style={{
//               fontSize: 14,
//               fontWeight: '600',
//               color: '#374151',
//             }}>
//               Log in
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// }





import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { googleLogin, googleCallback as googleCallbackApi } from '../../services/api/auth';
import { useAuthStore } from '../../store/store';
import { useToast } from '../../contexts/ToastContext';
import { ArrowRight } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { PrimaryBlue } from '../../Constants/Colors';

// NewLogo component
const NewLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeStyles = {
    sm: { grid: 24, dot: 6, text: 16 },
    md: { grid: 32, dot: 8, text: 20 },
    lg: { grid: 48, dot: 12, text: 28 },
  };

  const currentSize = sizeStyles[size];
  const dotSize = currentSize.dot;
  const gridSize = currentSize.grid;

  return (
    <View style={styles.logoContainer}>
      <View style={[styles.logoGrid, { width: gridSize, height: gridSize }]}>
        <View
          style={[
            styles.logoDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: '#0000FF',
              position: 'absolute',
              top: 0,
              left: 0,
            },
          ]}
        />
        <View
          style={[
            styles.logoDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: '#FF3366',
              position: 'absolute',
              top: 0,
              right: 0,
            },
          ]}
        />
        <View
          style={[
            styles.logoDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: '#ADFF2F',
              position: 'absolute',
              bottom: 0,
              left: 0,
            },
          ]}
        />
        <View
          style={[
            styles.logoDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: '#A855F7',
              position: 'absolute',
              bottom: 0,
              right: 0,
            },
          ]}
        />
      </View>
      <Text style={[styles.logoText, { fontSize: currentSize.text }]}>crwd</Text>
    </View>
  );
};

const googleXml = `<svg viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>`;

const appleXml = `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
  <path fill="#FFFFFF" d="M25.565,9.785c-0.123,0.077-3.051,1.702-3.051,5.305c0.138,4.109,3.695,5.55,3.756,5.55 c-0.061,0.077-0.537,1.963-1.947,3.94C23.204,26.283,21.962,28,20.076,28c-1.794,0-2.438-1.135-4.508-1.135 c-2.223,0-2.852,1.135-4.554,1.135c-1.886,0-3.22-1.809-4.4-3.496c-1.533-2.208-2.836-5.673-2.882-9 c-0.031-1.763,0.307-3.496,1.165-4.968c1.211-2.055,3.373-3.45,5.734-3.496c1.809-0.061,3.419,1.242,4.523,1.242 c1.058,0,3.036-1.242,5.274-1.242C21.394,7.041,23.97,7.332,25.565,9.785z M15.001,6.688c-0.322-1.61,0.567-3.22,1.395-4.247 c1.058-1.242,2.729-2.085,4.17-2.085c0.092,1.61-0.491,3.189-1.533,4.339C18.098,5.937,16.488,6.872,15.001,6.688z"/>
</svg>`;

export default function OnBoard() {
  const navigation = useNavigation();
  const route = useRoute();
  const { setUser, setToken } = useAuthStore();
  const { showToast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);


  // Get redirectTo and redirectParams from route params (React Navigation pattern)
  const redirectTo = (route.params as any)?.redirectTo || null;
  const redirectParams = (route.params as any)?.redirectParams || {};
  const isFromCreateCollective = redirectTo === 'CreateCRWD';
  const isFromCollective = redirectTo === 'GroupCRWD';

  const googleLoginQuery = useQuery({
    queryKey: ['googleLogin'],
    queryFn: googleLogin,
    enabled: false,
  });

  const appleLoginQuery = useQuery({
    queryKey: ['appleLogin'],
    queryFn: () => googleLogin('SignInWithApple'),
    enabled: false,
  })

  const appleCallbackMutation = useMutation({
    mutationFn: (code: string) => googleCallbackApi(code, 'apple'),
    onSuccess: (response) => {
      console.log('Apple callback successful:', response)

      if (response.user) {
        setUser(response.user)
      }
      if (response.access_token) {
        setToken({
          access_token: response.access_token,
          refresh_token: response.refresh_token
        })
      }

      // Handle redirect
      if (response.user && !response.user.last_login_at) {
        (navigation as any).navigate('NonProfitInterests', { fromAuth: true, redirectTo, redirectParams: (route.params as any)?.redirectParams });
      } else if (redirectTo && redirectTo !== '/' && redirectTo !== 'DrawerNav') {
        // Navigate to specific route if provided
        (navigation as any).navigate(redirectTo);
      } else {
        navigation.navigate('DrawerNav' as never);
      }
    },
    onError: (error: any) => {
      console.error('Apple callback error:', error.response)
      const errorMessage = error?.response?.data?.message || error.message || 'Apple callback failed'
      showToast(errorMessage)
    },
  })

  const googleCallbackMutation = useMutation({
    mutationFn: googleCallbackApi,
    onSuccess: (response) => {
      console.log('Google callback successful:', response);
      if (response.user) setUser(response.user);
      if (response.access_token) {
        setToken({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        });
      }
      showToast('Google authentication successful!');

      // Handle redirect - use reset to prevent going back to onboarding
      if (response.user && !response.user.last_login_at) {
        // New user - go through onboarding with redirectTo and redirectParams
        navigation.reset({
          index: 0,
          routes: [{ name: 'NonProfitInterests' as never, params: { fromAuth: true, redirectTo: redirectTo || null, redirectParams } }],
        });
      } else if (redirectTo && redirectTo !== 'DrawerNav') {
        // Existing user - navigate to redirectTo using reset
        if (redirectTo === 'CreateCRWD') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'DrawerNav' as never }],
          });
          setTimeout(() => {
            (navigation as any).navigate('DrawerNav', { screen: 'CreateCRWD' });
          }, 100);
        } else if (redirectTo === 'GroupCRWD') {
          // Navigate to GroupCRWD with id param
          console.log('OnBoard - Navigating to GroupCRWD with params:', redirectParams);
          navigation.reset({
            index: 0,
            routes: [{ name: redirectTo as never, params: redirectParams }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: redirectTo as never, params: redirectParams }],
          });
        }
      } else {
        // Default - go to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'DrawerNav' as never }],
        });
      }
    },
    onError: (error: any) => {
      console.error('Google callback error:', error);
      const errorMessage = error?.response?.data?.message || error.message || 'Google callback failed';
      showToast(errorMessage);
      setIsGoogleLoading(false);
    },
  });

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const result = await googleLoginQuery.refetch();

      if (result.data && result.data.url) {
        if (await InAppBrowser.isAvailable()) {
          const authResult = await InAppBrowser.openAuth(
            result.data.url,
            'crwd-app://googleCallback',
            {
              ephemeralWebSession: false,
              showTitle: false,
              enableUrlBarHiding: true,
              enableDefaultShare: false,
            }
          );

          if (authResult.type === 'success' && authResult.url) {
            const codeMatch = authResult.url.match(/[?&]code=([^&]+)/);
            const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;

            if (code) {
              await googleCallbackMutation.mutateAsync(code);
            }
          } else {
            setIsGoogleLoading(false);
          }
        } else {
          await Linking.openURL(result.data.url);
          setIsGoogleLoading(false);
        }
      } else {
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      showToast(error?.message || 'Failed to initiate Google login');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = () => {
    // Navigate to claim profile for email registration
    (navigation as any).navigate('ClaimProfile', { redirectTo, redirectParams });
  };

  const handleLogin = () => {
    // Navigate to Login page
    (navigation as any).navigate('Login', { redirectTo, redirectParams });
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true)
    try {
      const result = await appleLoginQuery.refetch()
      if (result.data && result.data.url) {
        if (await InAppBrowser.isAvailable()) {
          const authResult = await InAppBrowser.openAuth(
            result.data.url,
            'crwd-app://appleCallback',
            {
              ephemeralWebSession: false,
              showTitle: false,
              enableUrlBarHiding: true,
              enableDefaultShare: false,
            }
          )

          if (authResult.type === 'success' && authResult.url) {
            const codeMatch = authResult.url.match(/[?&]code=([^&]+)/);
            const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
            if (code) {
              appleCallbackMutation.mutate(code);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Apple login error:', error)
      showToast('Apple login failed. Please try again.')
    } finally {
      setIsAppleLoading(false)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        {/* <View style={styles.logoWrapper}> */}
        {/* <NewLogo size="lg" /> */}
        <Image source={require('../../assets/newLogo/FullLogo.png')} style={styles.logo} resizeMode='contain' />
        {/* </View> */}

        {/* Headings */}
        <View style={styles.headingsContainer}>
          {isFromCreateCollective ? (
            <>
              <Text style={[styles.heading1, { color: '#1600ff' }]}>Start Your Movement.</Text>
              <Text style={[styles.heading2, { color: '#111827' }]}>Create Your Collective & Lead Change</Text>
            </>
          ) : isFromCollective ? (
            <>
              <Text style={[styles.heading1, { color: '#1600ff' }]}>Join a Movement.</Text>
              <Text style={[styles.heading2, { color: '#111827' }]}>Connect with a Collective</Text>
            </>
          ) : (
            <>
              <Text style={[styles.heading1, { color: '#111827' }]}>Stop Wishing You Made a Difference.</Text>
              <Text style={[styles.heading2, { color: '#1600ff' }]}>Start Being Someone Who Does.</Text>
            </>
          )}
        </View>

        {/* Auth Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Apple Button */}
          <TouchableOpacity
            style={[styles.appleButton, (isAppleLoading || appleCallbackMutation.isPending) && styles.buttonDisabled]}
            onPress={handleAppleLogin}
            disabled={isAppleLoading || appleCallbackMutation.isPending}
          >
            {(isAppleLoading || appleCallbackMutation.isPending) ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <SvgXml xml={appleXml} width={20} height={20} />
            )}
            <Text style={styles.appleButtonText}>
              {(isAppleLoading || appleCallbackMutation.isPending) ? 'Signing in...' : 'Continue with Apple'}
            </Text>
          </TouchableOpacity>

          {/* Google Button */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading || googleCallbackMutation.isPending}
          >
            {isGoogleLoading || googleCallbackMutation.isPending ? (
              <ActivityIndicator size="small" color="#374151" />
            ) : (
              <SvgXml xml={googleXml} width={20} height={20} />
            )}
            <Text style={styles.googleButtonText}>
              {isGoogleLoading || googleCallbackMutation.isPending
                ? 'Signing in...'
                : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Email Button */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailLogin}
          >
            <Text style={styles.emailButtonText}>Continue with Email</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Terms and Privacy */}
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.link}
            onPress={() => (navigation as any).navigate('TermsOfUse')}
          >
            Terms
          </Text>{' '}
          and{' '}
          <Text
            style={styles.link}
            onPress={() => (navigation as any).navigate('PrivacyPolicy')}
          >
            Privacy Policy
          </Text>
        </Text>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={handleLogin}>
              Log in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGrid: {
    position: 'relative',
    marginBottom: 8,
  },
  logoDot: {
    borderRadius: 999,
  },
  logoText: {
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    letterSpacing: -0.5,
  },
  logoWrapper: {
    marginBottom: 48,
  },
  headingsContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  heading1: {
    fontSize: 32,
    fontFamily: 'Outfit-Black',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    // lineHeight: 40,
  },
  heading2: {
    fontSize: 32,
    fontFamily: 'Outfit-Black',
    color: '#1600ff',
    textAlign: 'center',
    // lineHeight: 40,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
    gap: 12,
  },
  appleButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
  googleButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButtonText: {
    color: '#111827',
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
  emailButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#1600ff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  termsText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    maxWidth: 400,
    fontFamily: 'Outfit-Regular',
  },
  link: {
    color: '#1600ff',
    textDecorationLine: 'underline',
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  loginLink: {
    color: '#1600ff',
    fontFamily: 'Outfit-Medium',
    textDecorationLine: 'underline',
  },
  logo: {
    width: 160,
    height: 50,
    marginBottom: 20,
  },
});



