import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react-native';
import { getCauseById } from '../services/api/crwd';
import { addCausesToBox } from '../services/api/donation';
import { getDonationBox } from '../services/api/donation';
import { useAuthStore } from '../store/store';
import { useToast } from '../contexts/ToastContext';
import CauseHeader from '../components/newcause/CauseHeader';
import CauseProfile from '../components/newcause/CauseProfile';
import CauseActionButtons from '../components/newcause/CauseActionButtons';
import VerifiedNonprofitInfo from '../components/newcause/VerifiedNonprofitInfo';
import CauseDetails from '../components/newcause/CauseDetails';
import OrganizationMission from '../components/newcause/OrganizationMission';
import SimilarNonprofits from '../components/newcause/SimilarNonprofits';
import { Share } from 'react-native';
import AddToDonationBoxBottomSheet from '../components/newcause/AddToDonationBoxBottomSheet';
import { categories } from '../Constants/categories';

export default function NewCausePage() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddToBoxModal, setShowAddToBoxModal] = useState(false);

  // Get cause ID from route params
  const causeId = (route.params as any)?.id || '';

  // Fetch cause data
  const {
    data: causeData,
    isLoading: isLoadingCause,
    error: causeError,
  } = useQuery({
    queryKey: ['cause', causeId],
    queryFn: () => getCauseById(causeId),
    enabled: !!causeId,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Get similar causes from cause data
  const similarCauses = causeData?.similar_causes?.slice(0, 2) || [];

  // Fetch donation box to check if cause is already added
  const { data: donationBoxData, refetch: refetchDonationBox } = useQuery({
    queryKey: ['donationBox', currentUser?.id],
    queryFn: getDonationBox,
    enabled: !!currentUser?.id,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Check if current cause is already in the donation box
  const isCauseInBox = donationBoxData?.box_causes?.some((boxCause: any) => {
    const cause = boxCause.cause || boxCause;
    const causeIdNum = parseInt(causeId);
    return (
      (cause?.id && parseInt(cause.id.toString()) === causeIdNum) ||
      (boxCause.cause_id && parseInt(boxCause.cause_id.toString()) === causeIdNum)
    );
  }) || false;

  // Add cause to donation box mutation
  const addToDonationBoxMutation = useMutation({
    mutationFn: async () => {
      if (!causeId) throw new Error('Cause ID is missing');
      // Use correct API format: { causes: [{ cause_id: 0 }] } without attributed_collective
      return addCausesToBox({
        causes: [{
          cause_id: parseInt(causeId)
        }]
      });
    },
    onSuccess: async () => {
      setShowAddToBoxModal(false);
      // Invalidate and refetch donation box to update isCauseInBox
      await queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
      await refetchDonationBox();

      // Show custom toast
      showToast('Cause added to donation box!', 3000);

      // Navigate to bottom tab "Donate" with setup tab
      (navigation as any).reset({
        index: 0,
        routes: [
          {
            name: 'DrawerNav' as never,
            state: {
              routes: [
                {
                  name: 'MainTabs' as never,
                  state: {
                    routes: [
                      { name: 'Home' as never },
                      { name: 'Search' as never },
                      {
                        name: 'Donate' as never,
                        params: {
                          initialTab: 'setup',
                        },
                      },
                      { name: 'Collectives' as never },
                      { name: 'Profile' as never },
                    ],
                    index: 2, // Donate tab index
                  },
                },
              ],
              index: 0,
            },
          },
        ],
      });
    },
    onError: (error: any) => {
      console.error('Error adding cause to donation box:', error);
      if (error.response?.status === 403) {
        navigation.navigate('SplashScreen' as never);
      } else {
        showToast('Failed to add cause to donation box.', 3000);
      }
    },
  });

  // Loading state
  if (isLoadingCause) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (causeError || !causeData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Nonprofit not found</Text>
          <Text style={styles.errorText}>
            The nonprofit you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
            activeOpacity={0.7}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToDonationBox = () => {
    if (!currentUser?.id) {
      navigation.navigate('SplashScreen' as never);
      return;
    }
    setShowAddToBoxModal(true);
  };

  const handleConfirmAddToBox = async () => {
    // Check if donation box exists first
    try {
      const donationBox = await getDonationBox();

      // If donation box is not set up, navigate to donation page with cause preselected
      if (!donationBox || !donationBox.id || donationBox.message === "Donation box not found") {
        setShowAddToBoxModal(false);
        // Navigate to bottom tab "Donate" with preselected cause
        (navigation as any).reset({
          index: 0,
          routes: [
            {
              name: 'DrawerNav' as never,
              state: {
                routes: [
                  {
                    name: 'MainTabs' as never,
                    state: {
                      routes: [
                        { name: 'Home' as never },
                        { name: 'Search' as never },
                        {
                          name: 'Donate' as never,
                          params: {
                            initialTab: 'setup',
                            preselectedItem: {
                              id: causeId || '',
                              type: 'cause',
                              data: causeData,
                            },
                            preselectedCauses: causeId ? [parseInt(causeId)] : [],
                            preselectedCausesData: causeData ? [{
                              id: causeData.id,
                              name: causeData.name,
                              description: causeData.description || causeData.mission || '',
                              mission: causeData.mission || '',
                              logo: causeData.image || causeData.logo || '',
                              image: causeData.image || causeData.logo || '',
                            }] : [],
                          },
                        },
                        { name: 'Collectives' as never },
                        { name: 'Profile' as never },
                      ],
                      index: 2, // Donate tab index
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        });
        return;
      }

      // If donation box exists, check capacity before adding cause
      // Calculate fees and capacity
      const calculateFees = (grossAmount: number) => {
        const gross = grossAmount;
        let crwdFee: number;
        let net: number;

        if (gross < 10.00) {
          crwdFee = 1.00;
          net = gross - crwdFee;
        } else {
          crwdFee = gross * 0.10;
          net = gross - crwdFee;
        }

        return {
          crwdFee: Math.round(crwdFee * 100) / 100,
          net: Math.round(net * 100) / 100,
        };
      };

      const monthlyAmount = parseFloat(donationBox.monthly_amount || '0');
      const fees = calculateFees(monthlyAmount);
      const net = fees.net;
      const maxCapacity = Math.floor(net / 0.20);

      // Count current causes in the box
      const boxCauses = donationBox.box_causes || [];
      const currentCapacity = boxCauses.length;

      // Check if adding this cause would exceed capacity
      if (currentCapacity >= maxCapacity) {
        showToast(`Your donation box is full. You can only support up to ${maxCapacity} cause${maxCapacity !== 1 ? 's' : ''} for $${monthlyAmount} per month. Please increase your donation amount or remove a cause to add this one.`, 5000);
        setShowAddToBoxModal(false);
        return;
      }

      // If capacity check passes, proceed with adding
      addToDonationBoxMutation.mutate();
    } catch (error) {
      console.error('Error checking donation box:', error);
      // If there's an error (might be "Donation box not found"), navigate to setup with preselected cause
      setShowAddToBoxModal(false);
      // Navigate to bottom tab "Donate" with preselected cause
      (navigation as any).reset({
        index: 0,
        routes: [
          {
            name: 'DrawerNav' as never,
            state: {
              routes: [
                {
                  name: 'MainTabs' as never,
                  state: {
                    routes: [
                      { name: 'Home' as never },
                      { name: 'Search' as never },
                      {
                        name: 'Donate' as never,
                        params: {
                          initialTab: 'setup',
                          preselectedItem: {
                            id: causeId || '',
                            type: 'cause',
                            data: causeData,
                          },
                          preselectedCauses: causeId ? [parseInt(causeId)] : [],
                          preselectedCausesData: causeData ? [{
                            id: causeData.id,
                            name: causeData.name,
                            description: causeData.description || causeData.mission || '',
                            mission: causeData.mission || '',
                            logo: causeData.image || causeData.logo || '',
                          }] : [],
                        },
                      },
                      { name: 'Collectives' as never },
                      { name: 'Profile' as never },
                    ],
                    index: 2, // Donate tab index
                  },
                },
              ],
              index: 0,
            },
          },
        ],
      });
    }
  };

  const handleDonate = () => {
    if (!currentUser?.id) {
      navigation.navigate('SplashScreen' as never);
      return;
    }
    // Navigate to OneTimeDonationScreen directly
    (navigation as any).navigate('OneTimeDonationScreen', {
      preselectedItem: {
        id: causeId,
        type: 'cause',
        data: causeData,
      },
    });
  };

  const handleShare = async () => {
    try {
      const url = `https://crwd.app/cause/${causeId}`;
      await Share.share({
        message: `Check out ${causeData.name || 'this nonprofit'}: ${url}`,
        title: causeData.name || 'Nonprofit',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CauseHeader
        title={causeData.name || 'Nonprofit'}
        causeId={causeId}
        isFavorite={causeData.is_favorite}
        onShare={handleShare}
        onOneTimeDonation={handleDonate}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <CauseProfile causeData={causeData} />

          <CauseActionButtons
            onAddToDonationBox={handleAddToDonationBox}
            onDonate={handleDonate}
            isAlreadyInBox={isCauseInBox}
          />

          <VerifiedNonprofitInfo causeData={causeData} />

          <OrganizationMission causeData={causeData} />

          <CauseDetails causeData={causeData} />

          <SimilarNonprofits
            similarCauses={similarCauses}
            isLoading={false}
            categoryName={categories.find(c => causeData?.category?.includes(c.id) && c.id !== '')?.name || causeData?.category}
            categoryId={causeData?.category}
          />
        </View>

      </ScrollView>

      {/* Add to Donation Box Bottom Sheet */}
      {causeData && (
        <AddToDonationBoxBottomSheet
          isOpen={showAddToBoxModal}
          onClose={() => setShowAddToBoxModal(false)}
          causeData={causeData}
          donationBoxCount={donationBoxData?.box_causes?.length || 0}
          onConfirm={handleConfirmAddToBox}
          isPending={addToDonationBoxMutation.isPending}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    maxWidth: '100%',
  },
});

