import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Heart, ArrowRight, Loader2, Plus, Minus } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import { useMutation, useQuery } from '@tanstack/react-query';
import { postCauseInterests } from '../../services/api/social';
import { getCategories } from '../../services/api/crwd';
import { useToast } from '../../contexts/ToastContext';
import { PrimaryGrey } from '../../Constants/Colors';

const { width } = Dimensions.get('window');

export default function NonProfitInterests() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const redirectTo = (route.params as any)?.redirectTo || null;
  const redirectParams = (route.params as any)?.redirectParams || {};
  const { showToast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isYourCausesOpen, setIsYourCausesOpen] = useState(true);
  const [isSuggestedCausesOpen, setIsSuggestedCausesOpen] = useState(true);

  // Only show specific categories from the vite version
  const allowedCategoryNames = [
    "Animals",
    "Community",
    "Education",
    "Climate",
    "Hunger",
    "Health",
    "Housing",
    "Mental Health",
    "Disaster",
    "Justice",
    "Faith",
    "Veterans",
    "Kids",
    "Environment",
    "Wildlife",
    "LGBTQ+",
    "Poverty",
    "Women's Health",
  ];

  // Fetch categories from API
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const mainCategories = useMemo(() => {
    if (!categoriesData?.data) return [];

    return categoriesData.data
      .filter((cat: any) =>
        cat.name !== "All" &&
        allowedCategoryNames.includes(cat.name)
      )
      .map((cat: any) => ({
        id: cat.id.toString(),
        name: cat.name,
        background: cat.background_color || cat.background,
        text: cat.text_color || cat.text
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [categoriesData]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Post cause interests mutation
  const postInterestsMutation = useMutation({
    mutationFn: (interests: string[]) => postCauseInterests({ interests }),
    onSuccess: () => {
      // If redirectTo is present, navigate directly there
      // Otherwise, navigate to complete-onboard
      if (redirectTo === 'CreateCRWD') {
        // Navigate directly to CreateCRWD (matching Vite behavior)
        navigation.reset({
          index: 0,
          routes: [{ name: 'DrawerNav' as never }],
        });
        // Then navigate to CreateCRWD within DrawerNav
        setTimeout(() => {
          (navigation as any).navigate('DrawerNav', {
            screen: 'CreateCRWD',
            params: { from: 'NewNonprofitInterests' }
          });
        }, 100);
      } else if (redirectTo === 'GroupCRWD') {
        // Navigate directly to GroupCRWD with params
        console.log('NonProfitInterests - Navigating to GroupCRWD with params:', redirectParams);
        navigation.reset({
          index: 0,
          routes: [{ name: redirectTo as never, params: { ...redirectParams, from: 'NewNonprofitInterests' } }],
        });
      } else {
        const selectedCategoryNames = mainCategories
          .filter((cat: any) => selectedCategories.includes(cat.id))
          .map((cat: any) => cat.name);

        navigation.navigate('CompleteOnboard', {
          redirectTo,
          redirectParams,
          selectedCategories,
          selectedCategoryNames
        });
      }
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || "Failed to save interests");
    },
  });

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      return;
    }
    // Post the selected category IDs
    postInterestsMutation.mutate(selectedCategories);
  };

  const handleSkip = () => {
    // If came from CreateCRWD, navigate directly to that page (matching Vite behavior)
    // Otherwise, navigate to complete-onboard
    if (redirectTo === 'CreateCRWD') {
      // Navigate directly to CreateCRWD
      navigation.reset({
        index: 0,
        routes: [{ name: 'DrawerNav' as never }],
      });
      // Then navigate to CreateCRWD within DrawerNav
      setTimeout(() => {
        (navigation as any).navigate('DrawerNav', {
          screen: 'CreateCRWD',
          params: { from: 'NewNonprofitInterests' }
        });
      }, 100);
    } else if (redirectTo === 'GroupCRWD') {
      // Navigate directly to GroupCRWD with params
      console.log('NonProfitInterests (skip) - Navigating to GroupCRWD with params:', redirectParams);
      navigation.reset({
        index: 0,
        routes: [{ name: redirectTo as never, params: { ...redirectParams, from: 'NewNonprofitInterests' } }],
      });
    } else {
      navigation.navigate('CompleteOnboard', { redirectTo, redirectParams });
    }
  };

  return (
    <View style={styles.container}>
      {/* <LinearGradient
        colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      > */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Progress Indicator - Step 3 */}
          <View style={styles.stepIndicator}>
            <View style={styles.stepBar}>
              <View style={[styles.stepDot, styles.stepDotInactive]} />
              <View style={[styles.stepDot, styles.stepDotInactive]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={[styles.stepDot, styles.stepDotInactive]} />
            </View>
          </View>

          {/* Heart Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Heart size={32} color="#9333ea" fill="#9333ea" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            What do you care about?
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Select one or more interests to personalize your experience. We'll show you nonprofits and collectives that match.
          </Text>

          {/* Category Tags - Organic Layout */}
          <View style={[styles.categoriesContainer, { minHeight: 100 }]}>
            {isLoadingCategories ? (
              <View style={{ paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            ) : (
              mainCategories.map((category: any) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategoryToggle(category.id)}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: category.background,
                        opacity: isSelected ? 1 : 0.4,
                      }
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      { color: category.text }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Selected Count */}
          {selectedCategories.length > 0 && (
            <View style={styles.selectedCountContainer}>
              <Text style={styles.selectedCountText}>
                {selectedCategories.length} {selectedCategories.length === 1 ? "interest" : "interests"} selected
              </Text>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={selectedCategories.length === 0 || postInterestsMutation.isPending}
              style={[
                styles.continueButton,
                (selectedCategories.length === 0 || postInterestsMutation.isPending) && styles.continueButtonDisabled
              ]}
              activeOpacity={0.8}
            >
              {postInterestsMutation.isPending ? (
                <View style={styles.loadingContainer}>
                  <Loader2 size={16} color="white" />
                  <Text style={styles.continueButtonText}>Saving...</Text>
                </View>
              ) : (
                <View style={styles.continueButtonContent}>
                  <Text style={styles.continueButtonText}>Continue</Text>
                  {/* <ArrowRight size={16} color="white" /> */}
                </View>
              )}
            </TouchableOpacity>

            {/* Skip Link */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* </LinearGradient> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 60,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    maxWidth: 672,
    alignSelf: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 5,
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 5,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 32,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 8,
    fontFamily: 'Outfit-Regular',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    minHeight: 40,
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
  },
  selectedCountContainer: {
    marginBottom: 18,
  },
  selectedCountText: {
    fontSize: 15,
    color: PrimaryGrey,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#6366f1',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 15,
    color: '#6b7280',
    fontFamily: 'Outfit-Medium',
  },
});
