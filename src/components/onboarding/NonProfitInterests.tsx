import React, { useState } from 'react';
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

import { categories } from '../../Constants/categories';
import { useMutation } from '@tanstack/react-query';
import { postCauseInterests } from '../../services/api/social';
import { useToast } from '../../contexts/ToastContext';

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
    "Arts",
    "Community",
    "Education",
    "Environment",
    "Food",
    "Health",
    "Housing",
    "Jobs",
    "Legal",
    "Mental",
    "Public",
    "Research",
    "Science",
    "Society",
    "Sports"
  ];

  const mainCategories = categories.filter((cat) =>
    cat.id !== "" &&
    cat.name !== "All" &&
    allowedCategoryNames.includes(cat.name)
  );

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
        navigation.navigate('CompleteOnboard', {
          redirectTo,
          redirectParams,
          selectedCategories
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
                <Heart size={32} color="#9333ea" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              What causes do you care about?
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Select one or more categories to personalize your experience. We'll show you nonprofits and collectives that match your interests.
            </Text>

            {/* Category Tags - Organic Layout */}
            <View style={styles.categoriesContainer}>
              {mainCategories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategoryToggle(category.id)}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: category.background,
                        opacity: isSelected ? 1 : 0.6,
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
              })}
            </View>

            {/* Selected Count */}
            {selectedCategories.length > 0 && (
              <View style={styles.selectedCountContainer}>
                <Text style={styles.selectedCountText}>
                  {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"} selected
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
                    <ArrowRight size={16} color="white" />
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
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 672,
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
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: 40,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCountContainer: {
    marginBottom: 24,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
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
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
});
