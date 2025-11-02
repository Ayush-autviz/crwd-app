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
  ActivityIndicator,
} from 'react-native';
import { Check, ChevronLeft, Search, Loader2 } from 'lucide-react-native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import OnboardingHeader from './OnboardingHeader';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCausesBySearch } from '../../services/api/crwd';
import { bulkAddCauseFavorites, getFavoriteCauses } from '../../services/api/social';
import { useAuthStore } from '../../store/store';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { categories } from '../../Constants/categories';
import { useToast } from '../../contexts/ToastContext';

const { width } = Dimensions.get('window');
// Calculate card width for 2 columns with proper spacing
// contentWrapper has 16px padding on each side = 32px
// whiteCard has 16px padding on each side = 32px
// Total padding = 64px
// Gap between cards = 12px
// Card width = (screen width - total padding - gap) / 2
const cardWidth = ((width - 64) - 12) / 2; // Screen width minus all padding (64px) minus gap (12px) divided by 2

export default function NonProfitInterests() {
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [allCauses, setAllCauses] = useState<any[]>([]);
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get favorite causes to exclude from results
  const { data: favoriteCauses } = useQuery({
    queryKey: ['favoriteCauses'],
    queryFn: () => getFavoriteCauses(),
    enabled: true,
  });

  // Get causes with search and category filtering
  const { data: causesData, isLoading: isCausesLoading } = useQuery({
    queryKey: ['causes', selectedCategory, searchTrigger, currentPage, searchQuery],
    queryFn: () => {
      return getCausesBySearch(searchQuery, selectedCategory, currentPage);
    },
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Bulk add favorites mutation
  const bulkAddCauseFavoritesMutation = useMutation({
    mutationFn: (causeIds: string[]) => bulkAddCauseFavorites(causeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteCauses'] });
      showToast('Causes added to favorites', 2000);
      // Navigate back if came from CreateCRWD, or to CreateCRWD if from onboarding
      navigation.goBack();
    },
    onError: () => {
      showToast('Failed to add causes to favorites', 2000);
    },
  });

  // Handle API response and accumulate results, filtering out favorite causes
  React.useEffect(() => {
    if (causesData?.results && Array.isArray(causesData.results)) {
      // Get favorite cause IDs to exclude from results
      // Only filter if favoriteCauses is loaded, otherwise show all results
      let favoriteCauseIds = new Set<string>();
      
      if (favoriteCauses?.results && Array.isArray(favoriteCauses.results)) {
        favoriteCauseIds = new Set(
          favoriteCauses.results
            .map((fav: any) => {
              const id = fav.cause?.id;
              // Convert to string for consistent comparison
              return id ? String(id) : null;
            })
            .filter((id: any) => id !== null) as string[]
        );
      }

      // Filter out favorite causes from search results
      // If favoriteCauses is not loaded yet, don't filter (show all results)
      const filteredCauses = causesData.results.filter((cause: any) => {
        const causeId = cause?.id ? String(cause.id) : null;
        if (!causeId) return false;
        // Only exclude if favoriteCauses is loaded and this cause is in favorites
        // If favoriteCauses is not loaded yet, show all causes
        if (!favoriteCauses || !favoriteCauses.results) {
          return true; // Show all if favorites not loaded yet
        }
        return !favoriteCauseIds.has(causeId);
      });

      if (currentPage === 1) {
        // Reset causes for new search/category
        setAllCauses(filteredCauses);
      } else {
        // Append new results for load more
        setAllCauses(prev => [...prev, ...filteredCauses]);
      }
    } else if (causesData && (!causesData.results || !Array.isArray(causesData.results))) {
      // If API returns but no results or invalid format, set empty
      setAllCauses([]);
    }
  }, [causesData, currentPage, favoriteCauses]);

  // Reset page when search or category changes
  React.useEffect(() => {
    setCurrentPage(1);
    // Don't clear allCauses immediately - wait for new data to load
    // The causes will be reset when new data comes in via causesData
  }, [searchTrigger]);

  // Ensure causes load on initial mount
  React.useEffect(() => {
    // Always trigger initial load on mount
    setSearchTrigger(prev => prev + 1);
  }, []);

  // Trigger API call when category changes
  React.useEffect(() => {
    // Reset selections and trigger search when category changes
    setSelectedInterests([]);
    setSearchTrigger(prev => prev + 1);
  }, [selectedCategory]);

  // Refetch causes when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Refetch favorite causes first to ensure we have latest favorites
      queryClient.invalidateQueries({ queryKey: ['favoriteCauses'] });
      // Then refetch causes
      queryClient.invalidateQueries({ queryKey: ['causes'] });
      // Also trigger search to ensure fresh data
      setSearchTrigger(prev => prev + 1);
      // Reset state when screen comes into focus
      setCurrentPage(1);
    }, [queryClient])
  );

  const handleInterestSelect = (interestId: number) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // Don't trigger API call on every keystroke
  };

  const handleSearchSubmit = () => {
    // Trigger API call with search query
    setSelectedInterests([]);
    setSearchTrigger(prev => prev + 1);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleContinue = () => {
    if (selectedInterests.length === 0) {
      return;
    }
    bulkAddCauseFavoritesMutation.mutate(selectedInterests.map(id => id.toString()));
  };

  const InterestCard = ({ interest }: { interest: { id: number, image?: string, logo?: string, name: string } }) => {
    const isSelected = selectedInterests.includes(interest.id);

    return (
      <TouchableOpacity
        style={[
          styles.interestCard,
          isSelected && styles.interestCardSelected
        ]}
        onPress={() => handleInterestSelect(interest.id)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          <Avatar size={80}>
            <AvatarImage src={interest.image || interest.logo} />
            <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
              {interest.name?.charAt(0)?.toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
        </View>
        <View style={styles.interestContent}>
          <Text style={styles.interestName} numberOfLines={2} ellipsizeMode="tail">
            {interest.name}
          </Text>
        </View>
        
        {/* Selection Overlay */}
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <View style={styles.checkContainer}>
              <Check size={16} color="white" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Show sign-in message if user not logged in
  if (!currentUser?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.signInContainer}>
          <View style={styles.signInIcon}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text style={styles.signInTitle}>Sign in to find causes that fit you</Text>
          <Text style={styles.signInDescription}>
            Sign in to view your profile, manage your causes, and connect with your community.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.signInButtonText}>Sign In to Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <OnboardingHeader />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* White Card Container */}
          <View style={styles.whiteCard}>
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
            placeholder="Search causes or nonprofits (press Enter to search)"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
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
              key={category.id || category.name}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: selectedCategory === category.id 
                    ? category.text 
                    : category.background,
                }
              ]}
              onPress={() => {
                setSelectedInterests([]);
                const newCategory = selectedCategory === category.id ? '' : category.id;
                setSelectedCategory(newCategory);
                // Search trigger will be handled by useEffect on selectedCategory change
              }}
            >
              <Text style={[
                styles.categoryButtonText,
                {
                  color: selectedCategory === category.id 
                    ? "white" 
                    : category.text
                }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Interests Grid */}
        {isCausesLoading && allCauses.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PrimaryBlue} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : allCauses.length > 0 ? (
          <>
            <View style={styles.interestsGrid}>
              {allCauses.map((interest: any, index: number) => (
                <View key={interest.id || index} style={{ width: cardWidth, marginBottom: 12 }}>
                  <InterestCard interest={interest} />
                </View>
              ))}
            </View>
            {/* Load More Button */}
            {causesData?.next && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
                  <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No causes found</Text>
          </View>
        )}

            {/* Selection Summary */}
            {selectedInterests.length > 0 && (
              <View style={styles.selectionSummary}>
                <Text style={styles.selectionSummaryText}>
                  You've chosen {selectedInterests.length} cause{selectedInterests.length !== 1 ? 's' : ''}.
                </Text>
              </View>
            )}

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.continueButton, 
                  selectedInterests.length === 0 && styles.continueButtonDisabled
                ]} 
                onPress={handleContinue}
                disabled={selectedInterests.length === 0 || bulkAddCauseFavoritesMutation.isPending}
                activeOpacity={1}
              >
                {bulkAddCauseFavoritesMutation.isPending ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
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
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  whiteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  signInIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  signInDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  interestCard: {
    padding: 8,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  interestCardSelected: {
    borderColor: PrimaryBlue,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  avatarContainer: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    flexShrink: 0,
  },
  interestContent: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  interestName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
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
    marginTop: 16,
    marginBottom: 16,
    minHeight: 24,
  },
  selectionSummaryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: '#111827', 
    paddingVertical: 10, 
    borderRadius: 8, 
    alignItems: 'center',
    width: '100%',
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  continueButtonTextDisabled: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: PrimaryGrey,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: PrimaryGrey,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loadMoreText: {
    color: PrimaryBlue,
    fontSize: 14,
    fontWeight: '500',
  },
});