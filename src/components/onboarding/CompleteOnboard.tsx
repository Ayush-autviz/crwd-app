import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { PrimaryBlue } from '../../Constants/Colors';

const { width, height } = Dimensions.get('window');

export default function CompleteOnboard() {
  const navigation = useNavigation<any>();
  // const [showConfetti, setShowConfetti] = useState(false);
  // const confettiRef = React.useRef<ConfettiCannon>(null);

  // useEffect(() => {
  //   // Show confetti after a short delay
  //   const timer = setTimeout(() => {
  //     setShowConfetti(true);
  //     // Add a small delay to ensure the component is fully rendered
  //     setTimeout(() => {
  //       console.log('Starting confetti...');
  //       if (confettiRef.current) {
  //         confettiRef.current.start();
  //         console.log('Confetti started!');
  //       } else {
  //         console.log('Confetti ref is null');
  //       }
  //     }, 200);
  //   }, 800);

  //   return () => clearTimeout(timer);
  // }, []);

  const handleGoToDonationBox = () => {
    (navigation as any).navigate('DrawerNav', {
      screen: 'MainTabs',
      params: {
        screen: 'My Giving'
      }
    });
  };

  const handleBrowseCrwd = () => {
    navigation.navigate('DrawerNav' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Confetti Overlay */}
      {/* {showConfetti && (
        <View style={styles.confettiContainer}>
          <ConfettiCannon
            ref={confettiRef}
            count={150}
            origin={{ x: width / 2, y: 0 }}
            autoStart={false}
            colors={['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#EC4899']}
            fadeOut
            explosionSpeed={200}
            fallSpeed={4000}
          />
        </View>
      )} */}

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          {/* CRWD Logo */}
          <View style={styles.logoContainer}>
            {/* <Image
              source={require('../../assets/logo/logo3.webp')}
              style={styles.logo}
              resizeMode="contain"
            /> */}
            <Image source={require('../../assets/logo/main.png')} style={{ resizeMode: 'contain', width: 120, height: 60 }} />
          </View>

          {/* Welcome Message */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome to CRWD!</Text>
            <Text style={styles.welcomeSubtitle}>
              Start giving now, or explore causes and Circles first.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGoToDonationBox}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Go to Donation Box</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBrowseCrwd}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Browse CRWD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 128,
    height: 128,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: PrimaryBlue,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: 'white',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
});
