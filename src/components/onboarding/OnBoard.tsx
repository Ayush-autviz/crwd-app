import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { SvgXml } from 'react-native-svg';
import { useMutation, useQuery } from '@tanstack/react-query';
import { googleLogin, googleCallback as googleCallbackApi } from '../../services/api/auth';
import { useAuthStore } from '../../store/store';
import { useToast } from '../../contexts/ToastContext';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { WhiteLabelConfig } from '../../Constants/WhiteLabelConfig';

const images = [
  require('../../assets/ngo/aspca.jpg'),
  require('../../assets/ngo/cancerSociety.png'),
  require('../../assets/ngo/girlCode.png'),
  require('../../assets/ngo/redCross.png'),
  require('../../assets/ngo/makeAwish.jpg'),
  require('../../assets/ngo/paws.jpeg'),
  require('../../assets/ngo/CRI.jpg'),
  require('../../assets/ngo/catAllies.jpeg'),
  require('../../assets/ngo/cureSearch.png'),
];

function shuffleArray(array: any[]) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function OnBoard() {
  const scrollXTop = useRef(new Animated.Value(0)).current;
  const scrollXBottom = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();
  const { showToast } = useToast();

  // // React Query hooks
  // const googleLoginQuery = useQuery({
  //   queryKey: ['googleLogin'],
  //   queryFn: googleLogin,
  //   enabled: false, // Don't run automatically
  // });

  // const [callbackCode, setCallbackCode] = useState<string | null>(null);

  // const googleCallbackQuery = useQuery({
  //   queryKey: ['googleCallback', callbackCode],
  //   queryFn: () => googleCallback(callbackCode!),
  //   enabled: !!callbackCode, // Only run when we have a code
  // });

  // // Handle Google callback success/error
  // useEffect(() => {
  //   if (googleCallbackQuery.data && callbackCode) {
  //     const data = googleCallbackQuery.data;
  //     if (data && data.user && data.access_token) {
  //       // Store user data and token
  //       setUser(data.user);
  //       setToken({
  //         access_token: data.access_token,
  //         refresh_token: data.refresh_token
  //       });

  //       // Navigate to main app
  //       navigation.navigate('DrawerNav' as never);
  //     } else {
  //       Alert.alert('Error', 'Authentication failed');
  //     }
  //   }
  // }, [googleCallbackQuery.data, callbackCode, setUser, setToken, navigation]);

  // useEffect(() => {
  //   if (googleCallbackQuery.error && callbackCode) {
  //     console.error('Google callback failed:', googleCallbackQuery.error);
  //     Alert.alert('Error', 'Authentication failed. Please try again.');
  //   }
  // }, [googleCallbackQuery.error, callbackCode]);

  const googleCallbackMutation = useMutation({
    mutationFn: googleCallbackApi,
    onSuccess: (response) => {
      console.log('Google callback successful:', response)
      if (response.user) setUser(response.user);
      if (response.access_token) {
        setToken({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        });
      }
      showToast('Google authentication successful!');

      // If last_login_at is null, navigate to nonprofit interests page (new user)
      if (response.user && !response.user.last_login_at) {
        (navigation as any).navigate('NonProfitInterests', { fromAuth: true })
      } else {
        // Navigate to main app for existing users
        navigation.navigate('DrawerNav' as never);
      }
    },
    onError: (error: any) => {
      console.error('Google callback error:', error)
      const errorMessage = error?.response?.data?.message || error.message || 'Google callback failed'
      showToast(errorMessage)
    },
  })

  const IMAGE_SIZE = 80;
  const IMAGE_MARGIN = 15;
  const ITEM_WIDTH = IMAGE_SIZE + IMAGE_MARGIN * 2;

  const rowTop = images;
  const rowBottom = shuffleArray(images);

  const rowWidth = rowTop.length * ITEM_WIDTH;

  const startLoop = (animatedValue: Animated.Value, duration: number) => {
    animatedValue.setValue(0);
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: -rowWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  useEffect(() => {
    startLoop(scrollXTop, 15000);
    startLoop(scrollXBottom, 20000);
  }, []);

  const googleXml = `<svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>`

  // const handleGoogleLogin = async () => {
  //   setIsGoogleLoading(true);
  //   try {
  //     const result = await googleLoginQuery.refetch();
  //     console.log('Google login response:', result);

  //     // Open the device browser with the Google login URL
  //     if (result.data?.url) {
  //       const supported = await Linking.canOpenURL(result.data.url);
  //       if (supported) {
  //         await Linking.openURL(result.data.url);
  //       } else {
  //         showToast('Unable to open browser');
  //         setIsGoogleLoading(false);
  //       }
  //     } else {
  //       showToast('Invalid response from server');
  //       setIsGoogleLoading(false);
  //     }
  //   } catch (error: any) {
  //     console.error('Google login error:', error);
  //     const errorMessage = error?.response?.data?.message || error.message || 'Failed to initiate Google login';
  //     showToast(errorMessage);
  //     setIsGoogleLoading(false);
  //   }
  // };


  const handleGoogleLogin = async () => {
    console.log('=== Google Login Started ===');
    setIsGoogleLoading(true)

    const result = await googleLogin();

    if (result && result.url) {
      console.log('Got OAuth URL:', result.url);

      // Use InAppBrowser instead of Linking
      if (await InAppBrowser.isAvailable()) {
        const authResult = await InAppBrowser.openAuth(
          result.url,
          'crwd-app://googleCallback', // Your redirect URL
          {
            ephemeralWebSession: false,
            showTitle: false,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
          }
        )

        console.log('Auth result:', authResult);

        if (authResult.type === 'success' && authResult.url) {
          // Handle the callback URL directly here
          const codeMatch = authResult.url.match(/[?&]code=([^&]+)/);
          const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;

          if (code) {
            googleCallbackMutation.mutateAsync(code);


          }
        } else {
          // Fallback to regular Linking
          await Linking.openURL(result.url);
        }

        setIsGoogleLoading(false);
      }
    }
  }

  const renderRow = (rowImages: any[], animatedValue: Animated.Value, verticalOffsetPattern: number[]) => (
    <View style={{ height: 140, overflow: 'hidden', marginHorizontal: -20 }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          transform: [{ translateX: animatedValue }],
        }}
      >
        {/* first copy */}
        {rowImages.map((img: any, index: number) => {
          const verticalOffset =
            index % 2 === 0 ? verticalOffsetPattern[0] : verticalOffsetPattern[1];
          return (
            <View
              key={'first_' + index}
              style={{
                marginHorizontal: IMAGE_MARGIN,
                transform: [{ translateY: verticalOffset }],
              }}
            >
              <Image
                source={img}
                style={{
                  width: IMAGE_SIZE,
                  height: IMAGE_SIZE,
                  borderRadius: 75,
                }}
                resizeMode="cover"
              />
            </View>
          );
        })}
        {/* second copy */}
        {rowImages.map((img: any, index: number) => {
          const verticalOffset =
            index % 2 === 0 ? verticalOffsetPattern[0] : verticalOffsetPattern[1];
          return (
            <View
              key={'second_' + index}
              style={{
                marginHorizontal: IMAGE_MARGIN,
                transform: [{ translateY: verticalOffset }],
              }}
            >
              <Image
                source={img}
                style={{
                  width: IMAGE_SIZE,
                  height: IMAGE_SIZE,
                  borderRadius: 75,
                }}
                resizeMode="cover"
              />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: 60, justifyContent: 'space-between' }}>
      <View>

        {/* Step Indicator */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 30,
          gap: 8
        }}>
          <View style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#000000',
          }} />
          <View style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#d1d5db',
          }} />
          <View style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#d1d5db',
          }} />
        </View>

        {/* Logo */}
        {/* <Image
          source={require('../../assets/logo/CRWD.png')}
          style={{
            width: '50%',
            height: 60,
            alignSelf: 'center',
            borderRadius: 30,
          }}
          resizeMode="contain"
        /> */}

        {/* Heading */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: '#111827',
            marginBottom: 12,
            textAlign: 'center',
            // marginTop: 20,
          }}
        >
          Welcome to {WhiteLabelConfig.AppName}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 16,
            color: PrimaryGrey,
            textAlign: 'center',
            lineHeight: 24,
            fontWeight: '700',
            marginBottom: 12,
          }}
        >
          Give to everything you care about, at once.
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: PrimaryGrey,
            textAlign: 'center',
            lineHeight: 24,
            fontWeight: '500',
            marginBottom: 50,
          }}
        >
          Discover nonprofits like these on {WhiteLabelConfig.AppName}
        </Text>



        {/* Top row */}
        {renderRow(rowTop, scrollXTop, [0, 20])}

        {/* Bottom row */}
        {renderRow(rowBottom, scrollXBottom, [25, 5])}
      </View>

      {/* Buttons - exactly like crwd-vite */}
      <View style={{ marginBottom: 30 }}>
        {/* Divider - "continue with" */}
        <View style={{ position: 'relative', marginBottom: 20 }}>
          {/* Left line segment */}
          <View style={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: '50%',
            height: 1,
            backgroundColor: '#e5e7eb',
            marginRight: 60,
          }} />

          {/* Right line segment */}
          <View style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            right: 0,
            height: 1,
            backgroundColor: '#e5e7eb',
            marginLeft: 60,
          }} />

          {/* Center text */}
          <View style={{
            alignItems: 'center',
            // backgroundColor: 'white',
            paddingHorizontal: 8,
          }}>
            <Text style={{
              fontSize: 12,
              color: '#6b7280',
              textTransform: 'uppercase',

              paddingHorizontal: 8,
            }}>
              continue with
            </Text>
          </View>
        </View>

        {/* Google Login Button */}
        {/* <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: '#d1d5db',
            padding: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            marginBottom: 12,
          }}
          onPress={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color={PrimaryGrey} style={{ marginRight: 8 }} />
          ) : (
            <View style={{ marginRight: 8 }}>
              <SvgXml xml={googleXml} style={{ width: 20, height: 20 }} />
            </View>
          )}
          <Text style={{
            color: '#374151',
            fontSize: 14,
            fontWeight: '500',
          }}>
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity> */}

        {/* Get Started button */}
        <TouchableOpacity
          style={{
            backgroundColor: PrimaryBlue,
            padding: 14,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={() => navigation.navigate('ClaimProfile' as never)}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center',
            }}
          >
            Get Started
          </Text>
        </TouchableOpacity>

        {/* Login link */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#374151',
            }}>
              Log in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

