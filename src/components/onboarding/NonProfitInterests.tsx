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
  TextInput,
} from 'react-native';
import { Check, ChevronLeft, Search, Loader2 } from 'lucide-react-native';
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
];

const categories = [
  "Health",
  "Education",
  "Environment",
  "Arts",
  "Animals",
  "Poverty",
  "Veterans",
  "Children",
];

export default function NonProfitInterests() {
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);

    // Show loader for 2 seconds then navigate
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('CompleteOnboard' as never);
    }, 2000);
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
        style={[
          styles.interestCard,
          isSelected && styles.interestCardSelected
        ]}
        onPress={() => handleInterestSelect(interest.id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: interest.image }} style={styles.interestImage} />
        <View style={styles.interestContent}>
          <Text style={styles.interestName}>{interest.name}</Text>
        </View>
        
        {/* Selection Overlay */}
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <View style={styles.checkContainer}>
              <Check size={18} color="white" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={{paddingHorizontal: 20, backgroundColor: 'white'}}>
      <OnboardingHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={styles.stepBar}>
            <View style={[styles.stepDot, styles.stepDotInactive]} />
            <View style={[styles.stepDot, styles.stepDotInactive]} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
          </View>
        </View>

        {/* Heading */}
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Find causes that fit you</Text>     
          <Text style={styles.subtitle}>
            Choose at least 1 to start. You can add more anytime.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={16} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search causes or nonprofits"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory(selectedCategory === category ? '' : category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextSelected
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Interests Grid */}
        <View style={styles.interestsGrid}>
          {nonProfitInterests.map((interest,index) => (
            <InterestCard key={index} interest={interest} />
          ))}
        </View>

        {/* Selection Summary */}
        {selectedInterests.length > 0 && (
          <View style={styles.selectionSummary}>
            <Text style={styles.selectionSummaryText}>
              You've chosen {selectedInterests.length} cause{selectedInterests.length !== 1 ? 's' : ''}.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}> 
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            selectedInterests.length === 0 && styles.continueButtonDisabled
          ]} 
          onPress={handleContinue}
          disabled={selectedInterests.length === 0 || isLoading}
          activeOpacity={1}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Loader2 size={16} color="white" style={styles.spinner} />
              <Text style={styles.continueButtonText}>Loading...</Text>
            </View>
          ) : (
            <Text style={[
              styles.continueButtonText,
              selectedInterests.length === 0 && styles.continueButtonTextDisabled
            ]}>
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
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
  stepIndicator: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  stepDotActive: {
    backgroundColor: 'black',
  },
  stepDotInactive: {
    backgroundColor: '#d1d5db',
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 14,
    color: '#111827',
  },
  categoriesContainer: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#374151',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryButtonTextSelected: {
    color: 'white',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  interestCard: {
    padding: 10,
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 16,
  },
  interestCardSelected: {
    borderColor: PrimaryBlue,
    shadowOpacity: 0.2,
    elevation: 8,
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
    top: 8,
    left: 8,
    alignItems: 'flex-start',
  },
  checkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PrimaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionSummary: {
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 24,
  },
  selectionSummaryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: PrimaryBlue, 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  continueButtonTextDisabled: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
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
  },
});