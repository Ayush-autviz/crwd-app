import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Heart, Search, Check, Loader2, ArrowRight } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSurpriseMe, getCausesBySearch } from '../../services/api/crwd';
import { addCausesToBox } from '../../services/api/donation';
import { useToast } from '../../contexts/ToastContext';
import { categories } from '../../Constants/categories';
import { Sparkles } from 'lucide-react-native';

type ViewType = 'initial' | 'surprise' | 'browse';

// Get consistent color for avatar
const avatarColors = [
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#10B981', // Green
  '#3B82F6', // Blue
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return 'N';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

export default function CompleteOnboard() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const redirectTo = (route.params as any)?.redirectTo || '/';
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [view, setView] = useState<ViewType>('initial');
  const [selectedCauses, setSelectedCauses] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  
  // Get selected categories from route params
  const selectedCategoryIds = (route.params as any)?.selectedCategories || [];
  const selectedCategoryObjects = selectedCategoryIds
    .map((id: string) => categories.find((cat) => cat.id === id))
    .filter((cat: any) => cat !== undefined);

  // Fetch surprise me causes
  const { data: surpriseData, isLoading: isLoadingSurprise, refetch: refetchSurprise } = useQuery({
    queryKey: ['surprise-me-onboard'],
    queryFn: () => getSurpriseMe(),
    enabled: view === 'surprise',
  });

  // Fetch causes for browse/search
  const { data: browseData, isLoading: isLoadingBrowse } = useQuery({
    queryKey: ['browse-causes', searchQuery, searchTrigger],
    queryFn: () => getCausesBySearch(searchQuery || '', '', 1),
    enabled: view === 'browse',
    refetchOnMount: true,
  });

  // Add causes to donation box mutation
  const addToBoxMutation = useMutation({
    mutationFn: async (causeIds: number[]) => {
      return await addCausesToBox({ cause_ids: causeIds });
    },
    onSuccess: () => {
      showToast('Nonprofits added to donation box!');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      navigation.reset({
        index: 0,
        routes: [{ name: 'DrawerNav' as never }],
      });
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to add nonprofits to donation box');
    },
  });

  // Handle surprise causes data
  useEffect(() => {
    if (surpriseData && view === 'surprise') {
      let causes: any[] = [];
      if (Array.isArray(surpriseData)) {
        causes = surpriseData;
      } else if (surpriseData.data && Array.isArray(surpriseData.data)) {
        causes = surpriseData.data;
      } else if (surpriseData.results && Array.isArray(surpriseData.results)) {
        causes = surpriseData.results;
      }
      // Auto-select all 5 causes
      setSelectedCauses(causes.slice(0, 5).map((cause: any) => cause.id));
    }
  }, [surpriseData, view]);

  const handleSurpriseMe = () => {
    setView('surprise');
  };

  const handleBrowseSearch = () => {
    setView('browse');
  };

  const handleChangeMethod = () => {
    setView('initial');
    // Use setTimeout to avoid layout race conditions on Android
    setTimeout(() => {
      setSelectedCauses([]);
      setSearchQuery('');
      setSearchTrigger(0);
    }, 0);
  };

  const handlePickDifferent = () => {
    refetchSurprise();
  };

  const handleCauseToggle = (causeId: number) => {
    setSelectedCauses((prev) => {
      if (prev.includes(causeId)) {
        return prev.filter((id) => id !== causeId);
      } else {
        return [...prev, causeId];
      }
    });
  };

  const handleSearch = () => {
    setSearchTrigger((prev) => prev + 1);
  };

  const handleStartWithNonprofits = () => {
    if (selectedCauses.length > 0) {
      // Get full cause data for selected causes based on current view
      let selectedCausesData: any[] = [];
      
      if (view === 'surprise') {
        selectedCausesData = surpriseCauses.filter((cause: any) => 
          selectedCauses.includes(cause.id)
        );
      } else if (view === 'browse') {
        selectedCausesData = browseCauses.filter((cause: any) => 
          selectedCauses.includes(cause.id)
        );
      }
      
      // Navigate to donation box setup with preselected causes
      navigation.navigate('Donation', {
        tab: 'setup',
        preselectedCauses: selectedCauses,
        preselectedCausesData: selectedCausesData,
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'DrawerNav' as never }],
      });
    }
  };

  const handleEditCategories = () => {
    navigation.navigate('NonProfitInterests', { redirectTo });
  };

  const handleSkip = () => {
    // Navigate to redirectTo if available, otherwise to home
    if (redirectTo && redirectTo !== '/') {
      navigation.navigate(redirectTo as never);
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'DrawerNav' as never }],
      });
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId) || categories[0];
  };

  // Get surprise causes
  const surpriseCauses = surpriseData
    ? (Array.isArray(surpriseData)
        ? surpriseData
        : surpriseData.data || surpriseData.results || [])
    : [];

  // Get browse causes
  const browseCauses = browseData?.results || [];

  // Initial view - Two cards
  if (view === 'initial') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Progress Indicator - Step 4 */}
              <View style={styles.stepIndicator}>
                <View style={styles.stepBar}>
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotActive]} />
                </View>
              </View>

              {/* Heart Icon with Gradient */}
              <View style={styles.iconContainer}>
                <View style={styles.gradientIconCircle}>
                  <Heart size={40} color="white" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>
                Set Up Your Donation Box
              </Text>

              {/* Description */}
              <Text style={styles.description}>
                Choose nonprofits to support. Your donation gets split evenly among them. You can change these anytime!
              </Text>

              {/* Selected Categories Tags */}
              {selectedCategoryObjects.length > 0 && (
                <View style={styles.categoriesContainer}>
                  {selectedCategoryObjects.map((category: any) => (
                    <View
                      key={category.id}
                      style={[
                        styles.categoryTag,
                        { backgroundColor: category.background }
                      ]}
                    >
                      <Text style={styles.categoryTagText}>{category.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Two Option Cards */}
              <View style={styles.optionsContainer}>
                {/* Surprise Me Card */}
                <TouchableOpacity
                  onPress={handleSurpriseMe}
                  style={styles.optionCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionIconContainer}>
                    <View style={styles.surpriseIconCircle}>
                      {/* <Text style={{ fontSize: 24, color: 'white' }}>✨</Text> */}
                      <Sparkles size={32} color="white" />
                    </View>
                  </View>
                  <Text style={styles.optionTitle}>Surprise Me</Text>
                  <Text style={styles.optionDescription}>
                    We'll pick 5 amazing nonprofits for you
                  </Text>
                </TouchableOpacity>

                {/* Browse & Search Card */}
                <TouchableOpacity
                  onPress={handleBrowseSearch}
                  style={styles.optionCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionIconContainer}>
                    <View style={styles.browseIconCircle}>
                      <Search size={32} color="white" />
                    </View>
                  </View>
                  <Text style={styles.optionTitle}>Browse & Search</Text>
                  <Text style={styles.optionDescription}>
                    Explore and find nonprofits
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Buttons - Show when nothing is selected */}
              {selectedCauses.length === 0 && (
                <View style={styles.bottomButtons}>
                  <TouchableOpacity
                    onPress={handleEditCategories}
                    style={styles.editButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editButtonText}>Edit Categories</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSkip}
                    style={styles.skipButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.skipButtonText}>Skip for Now</Text>
                    <ArrowRight size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  // Surprise Me view
  if (view === 'surprise') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Progress Indicator - Step 4 */}
              <View style={styles.stepIndicator}>
                <View style={styles.stepBar}>
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotActive]} />
                </View>
              </View>

              {/* Header */}
              <View style={styles.iconContainer}>
                <View style={styles.gradientIconCircle}>
                  <Heart size={40} color="white" />
                </View>
              </View>

              <Text style={styles.title}>
                Set Up Your Donation Box
              </Text>
              <Text style={styles.description}>
                Choose nonprofits to support. Your donation gets split evenly among them. You can change these anytime!
              </Text>

              {/* Your Random Selection Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Random Selection</Text>
                  <TouchableOpacity
                    onPress={handleChangeMethod}
                    style={styles.changeMethodButton}
                  >
                    <Text style={styles.changeMethodText}>Change Method</Text>
                  </TouchableOpacity>
                </View>

                {isLoadingSurprise ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9ca3af" />
                  </View>
                ) : (
                  <>
                    <View style={styles.causesGrid}>
                      {surpriseCauses.slice(0, 6).map((cause: any) => {
                        const isSelected = selectedCauses.includes(cause.id);
                        const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                        const initials = getInitials(cause.name);
                        const categoryInfo = getCategoryInfo(cause.category);

                        return (
                          <TouchableOpacity
                            key={cause.id}
                            onPress={() => handleCauseToggle(cause.id)}
                            style={[
                              styles.causeCard,
                              isSelected && styles.causeCardSelected
                            ]}
                            activeOpacity={0.8}
                          >
                            <View style={styles.causeCardContent}>
                              <View
                                style={[
                                  styles.causeAvatar,
                                  { backgroundColor: avatarBgColor }
                                ]}
                              >
                                <Text style={styles.causeAvatarText}>
                                  {initials}
                                </Text>
                              </View>
                              <View style={styles.causeInfo}>
                                <Text style={styles.causeName} numberOfLines={2}>
                                  {cause.name}
                                </Text>
                                <View
                                  style={[
                                    styles.causeCategoryBadge,
                                    { backgroundColor: categoryInfo.background }
                                  ]}
                                >
                                  <Text style={styles.causeCategoryText}>
                                    {categoryInfo.name}
                                  </Text>
                                </View>
                              </View>
                              {isSelected && (
                                <Check size={20} color="#3b82f6" />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.pickDifferentContainer}>
                      <TouchableOpacity
                        onPress={handlePickDifferent}
                        style={styles.pickDifferentButton}
                      >
                        <Text style={{ fontSize: 16, marginRight: 6 }}>✨</Text>
                        <Text style={styles.pickDifferentText}>Pick Different Nonprofits</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {/* Footer Navigation */}
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  onPress={handleChangeMethod}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStartWithNonprofits}
                  disabled={selectedCauses.length === 0 || addToBoxMutation.isPending}
                  style={[
                    styles.startButton,
                    (selectedCauses.length === 0 || addToBoxMutation.isPending) && styles.startButtonDisabled
                  ]}
                >
                  {addToBoxMutation.isPending ? (
                    <View style={styles.loadingContainer}>
                      <Loader2 size={16} color="white" />
                      <Text style={styles.startButtonText}>Adding...</Text>
                    </View>
                  ) : (
                    <Text style={styles.startButtonText}>
                      Start with {selectedCauses.length} Nonprofit{selectedCauses.length !== 1 ? 's' : ''} →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  // Browse & Search view
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContentBrowse}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Progress Indicator - Step 4 */}
              <View style={styles.stepIndicator}>
                <View style={styles.stepBar}>
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                  <View style={[styles.stepDot, styles.stepDotActive]} />
                </View>
              </View>

              {/* Header */}
              <View style={styles.iconContainer}>
                <View style={styles.gradientIconCircle}>
                  <Heart size={40} color="white" />
                </View>
              </View>

              <Text style={styles.title}>
                Set Up Your Donation Box
              </Text>
              <Text style={styles.description}>
                Choose nonprofits to support. Your donation gets split evenly among them. You can change these anytime!
              </Text>

              {/* Browse Nonprofits Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Browse Nonprofits</Text>
                  <TouchableOpacity
                    onPress={handleChangeMethod}
                    style={styles.changeMethodButton}
                  >
                    <Text style={styles.changeMethodText}>Change Method</Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for nonprofits..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                </View>

                {/* Select Nonprofits Count */}
                <View style={styles.countContainer}>
                  <Text style={styles.countText}>
                    Select Nonprofits ({selectedCauses.length})
                  </Text>
                </View>

                {/* Causes List */}
                {isLoadingBrowse ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9ca3af" />
                  </View>
                ) : browseCauses.length > 0 ? (
                  <View style={styles.causesListContainer}>
                    {browseCauses.map((cause: any) => {
                      const isSelected = selectedCauses.includes(cause.id);
                      const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                      const initials = getInitials(cause.name);
                      const categoryInfo = getCategoryInfo(cause.category);

                      return (
                        <View key={cause.id} style={{ marginBottom: 12 }}>
                          <TouchableOpacity
                            onPress={() => handleCauseToggle(cause.id)}
                            style={[
                              styles.causeCard,
                              isSelected && styles.causeCardSelected
                            ]}
                            activeOpacity={0.8}
                          >
                            <View style={styles.causeCardContent}>
                              <View
                                style={[
                                  styles.causeAvatar,
                                  { backgroundColor: avatarBgColor }
                                ]}
                              >
                                <Text style={styles.causeAvatarText}>
                                  {initials}
                                </Text>
                              </View>
                              <View style={styles.causeInfo}>
                                <Text style={styles.causeName}>
                                  {cause.name}
                                </Text>
                                <View
                                  style={[
                                    styles.causeCategoryBadge,
                                    { backgroundColor: categoryInfo.background }
                                  ]}
                                >
                                  <Text style={styles.causeCategoryText}>
                                    {categoryInfo.name}
                                  </Text>
                                </View>
                              </View>
                              {isSelected && (
                                <Check size={24} color="#3b82f6" />
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No nonprofits found</Text>
                  </View>
                )}
              </View>

              {/* Footer Navigation */}
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  onPress={handleChangeMethod}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStartWithNonprofits}
                  disabled={selectedCauses.length === 0 || addToBoxMutation.isPending}
                  style={[
                    styles.startButton,
                    (selectedCauses.length === 0 || addToBoxMutation.isPending) && styles.startButtonDisabled
                  ]}
                >
                  {addToBoxMutation.isPending ? (
                    <View style={styles.loadingContainer}>
                      <Loader2 size={16} color="white" />
                      <Text style={styles.startButtonText}>Adding...</Text>
                    </View>
                  ) : (
                    <Text style={styles.startButtonText}>
                      Start with {selectedCauses.length} Nonprofit{selectedCauses.length !== 1 ? 's' : ''} →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 60,
  },
  scrollContentBrowse: {
    paddingHorizontal: 16,
    paddingVertical: 60,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  stepDotActive: {
    backgroundColor: '#111827',
  },
  stepDotInactive: {
    backgroundColor: '#d1d5db',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gradientIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 40,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  optionIconContainer: {
    marginBottom: 16,
  },
  surpriseIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    // paddingHorizontal: 16,
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#1600ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  changeMethodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  changeMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
  },
  countContainer: {
    marginBottom: 16,
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  causesGrid: {
    marginBottom: 16,
  },
  causesListContainer: {
    marginBottom: 12,
  },
  causeCard: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  causeCardSelected: {
    borderColor: '#3b82f6',
  },
  causeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  causeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  causeAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  causeInfo: {
    flex: 1,
  },
  causeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    flexShrink: 1,
  },
  causeCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  causeCategoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  pickDifferentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pickDifferentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickDifferentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9333ea',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  startButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1600ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
