import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Check, ChevronLeft } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import OnboardingHeader from './OnboardingHeader';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // Account for padding and gap

const interestsData = [
  {
    id: 1,
    name: 'Shriners Children',
    image: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9d/Shriners_Hospitals_for_Children_Logo.svg/500px-Shriners_Hospitals_for_Children_Logo.svg.png',
    color: '#3B82F6',
  },
  {
    id: 2,
    name: 'Change',
    image: 'https://images.squarespace-cdn.com/content/v1/5fd7e20940f9b820fac1e013/d442cb1f-e175-4b8d-bc81-44102583a6a5/thumbnail-05.png',
    color: '#EF4444',
  },
  {
    id: 3,
    name: 'The Water Trust',
    image: 'https://media.licdn.com/dms/image/v2/C4E0BAQEHqcfGhnH29g/company-logo_200_200/company-logo_200_200/0/1630573980553/the_water_trust_logo?e=2147483647&v=beta&t=fjyZGioRcUDheVZH_f8dxxSvR7840DFgAp6XrGwo8hw',
    color: '#10B981',
  },
  {
    id: 4,
    name: 'WWF',
    image: 'https://i0.wp.com/acrossthegreen.com/wp-content/uploads/2021/03/75E8B176-DAFE-4956-ABC5-9F221ACB2094.png?fit=1020%2C680&ssl=1',
    color: '#F59E0B',
  },
  {
    id: 5,
    name: 'Wounded Warrior Project',
    image: 'https://flooringresources.com/sites/default/files/styles/square_large/public/2022-01/1320-pps-wounded-warrior-classic.jpg?itok=4asRq76x',
    color: '#8B5CF6',
  },
  {
    id: 6,
    name: 'Girls Who Code',
    image: 'https://media.licdn.com/dms/image/v2/C4D0BAQEHUTYYyPFEhQ/company-logo_200_200/company-logo_200_200/0/1630509785189/girlswhocode_logo?e=2147483647&v=beta&t=eqyanOv949sDS3M_EnIq_wabT-1mN3uHQXVyB_FCTBI',
    color: '#F97316',
  },
];

// Create unique IDs for each interest by duplicating the data with different IDs
const nonProfitInterests = [
  ...interestsData.map((item, index) => ({ ...item, id: item.id + (index * 1000) })),
  ...interestsData.map((item, index) => ({ ...item, id: item.id + (index * 1000) + 100 })),
  ...interestsData.map((item, index) => ({ ...item, id: item.id + (index * 1000) + 200 })),
  ...interestsData.map((item, index) => ({ ...item, id: item.id + (index * 1000) + 300 })),
  ...interestsData.map((item, index) => ({ ...item, id: item.id + (index * 1000) + 400 })),
  ...interestsData.map((item, index) => ({ ...item, id: item.id + (index * 1000) + 500 }))
]

export default function NonProfitInterests() {
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const navigation = useNavigation<any>()   
  const continueButtonScale = useSharedValue(1);

  const continueButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueButtonScale.value }],
  }));

  const handleInterestSelect = (interestId: number) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedInterests.length === 0) {
      return;
    }

    navigation.navigate('DrawerNav')

    // continueButtonScale.value = withTiming(0.95, { duration: 100 }, () => {
    //   continueButtonScale.value = withTiming(1, { duration: 100 }, () => {
    //     // Navigate to next screen or complete onboarding
    //     runOnJS(() => {
    //       console.log('Selected interests:', selectedInterests);
    //       // You can navigate to the next screen here
    //     })();
    //   });
    // });
  };

  const handleBack = () => {
    // Navigate back
    console.log('Navigate back');
  };

  const InterestCard = ({ interest }: { interest: typeof nonProfitInterests[0] }) => {
    const isSelected = selectedInterests.includes(interest.id);
    const overlayOpacity = useSharedValue(isSelected ? 1 : 0);
    const checkScale = useSharedValue(isSelected ? 1 : 0);

    React.useEffect(() => {
      overlayOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
      checkScale.value = withSpring(isSelected ? 1 : 0, {
        damping: 15,
        stiffness: 200,
      });
    }, [isSelected]);

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
      opacity: overlayOpacity.value,
    }));

    const checkAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: checkScale.value }],
    }));

    return (
      <TouchableOpacity
        style={styles.interestCard}
        onPress={() => handleInterestSelect(interest.id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: interest.image }} style={styles.interestImage} />
        <View style={styles.interestContent}>
          <Text style={styles.interestName}>{interest.name}</Text>
        </View>
        
        {/* Selection Overlay */}
        <Animated.View style={[styles.selectionOverlay, overlayAnimatedStyle]}>
          <Animated.View style={[styles.checkContainer, checkAnimatedStyle]}>
            {/* <Text style={styles.checkmark}>✓</Text> */}
            <Check size={18} color="white" />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={{paddingHorizontal: 20, backgroundColor: 'white'}}>
      <OnboardingHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* <OnboardingHeader /> */}

          <Text style={styles.title}>Select a few Non Profits </Text>     
        <Text style={styles.subtitle}>
          You might be interested in
        </Text>

        {/* Interests Grid */}
        <View style={styles.interestsGrid}>
          {nonProfitInterests.map((interest,index) => (
            <InterestCard key={index} interest={interest} />
          ))}
        </View>

        {/* Continue Button */}
        {/* <View style={styles.buttonContainer}>
          <Animated.View style={continueButtonAnimatedStyle}>
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                selectedInterests.length === 0 && styles.continueButtonDisabled
              ]} 
              onPress={handleContinue}
              disabled={selectedInterests.length === 0}
              activeOpacity={1}
            >
              <Text style={[
                styles.continueButtonText,
                selectedInterests.length === 0 && styles.continueButtonTextDisabled
              ]}>
                Continue ({selectedInterests.length})
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View> */}
      </ScrollView>
      <View style={styles.footer}> <TouchableOpacity 
              style={[
                styles.continueButton, 
                selectedInterests.length === 0 && styles.continueButtonDisabled
              ]} 
              onPress={handleContinue}
              disabled={selectedInterests.length === 0}
              activeOpacity={1}
            >
              <Text style={[
                styles.continueButtonText,
                selectedInterests.length === 0 && styles.continueButtonTextDisabled
              ]}>
                Continue {selectedInterests.length > 0 && `(${selectedInterests.length})`}
              </Text>
            </TouchableOpacity></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    // paddingBottom: 200,
  },
  scrollContent: {
    flexGrow: 1,
    // paddingHorizontal: 24,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: PrimaryGrey,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom : 20,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 40,
  },
  interestCard: {
    padding: 10,
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    // borderWidth: 1,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    marginBottom: 16,
  },
  interestImage: {
    width: '80%',
    height: 90,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  interestContent: {
    padding: 16,
  },
  interestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(124, 58, 237, 0.9)',
    // backgroundColor: 'black',
    borderWidth: 3,
    
    borderColor: PrimaryBlue,
    borderRadius: 16,
    // justifyContent: 'center',
    alignItems: 'flex-end',
    padding: 5,
  },
  checkContainer: {
    width: 25,
    height: 25,
    borderRadius: 24,
    backgroundColor: PrimaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 3,
    borderColor: '#000000',
  },
  checkmark: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: PrimaryBlue, 
    padding: 15, 
    borderRadius: 12, 
    // marginTop: 20,
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: '#000000',
    // shadowColor: '#000000',
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 1,
    // shadowRadius: 0,
    // elevation: 12,
  },
  continueButtonDisabled: {
    backgroundColor: PrimaryBlue,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  continueButtonTextDisabled: {
    color: '#D1D5DB',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // alignItems: 'center',
  },
});