import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ChevronLeft, Plus, Trash2, User, X, ChevronDown, Search } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import DonationStep2 from '../components/donation/DonationStep2';
import DonationStep3 from '../components/donation/DonationStep3';
import OneTimeDonation from '../components/donation/OneTimeDonation';
import CheckoutScreen from '../components/donation/CheckoutScreen';
import PaymentSection from '../components/donation/PaymentSection';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDonationBox, createDonationBox, removeCauseFromBox, removeCollectiveFromBox, activateDonationBoxMobile, confirmMobileActivation, getDonationHistory } from '../services/api/donation';
import DonationBoxSummaryCard from '../components/donation/DonationBoxSummaryCard';
import { getCausesBySearch, getJoinCollective, getCollectiveById } from '../services/api/crwd';
import { useAuthStore } from '../store/store';
import { Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import DonationReviewBottomSheet from '../components/donation/DonationReviewBottomSheet';
import RequestNonprofitModal from '../components/newsearch/RequestNonprofitModal';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';


export default function DonationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<'setup' | 'onetime'>('setup');
  const [checkout, setCheckout] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [donationAmount, setDonationAmount] = useState(5);
  const [step, setStep] = useState(1);
  const [inputValue, setInputValue] = useState('5');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCauseIds, setSelectedCauseIds] = useState<number[]>([]);
  const [selectedCollectiveIds, setSelectedCollectiveIds] = useState<number[]>([]);
  const [selectedCausesData, setSelectedCausesData] = useState<any[]>([]);
  const [selectedCollectivesData, setSelectedCollectivesData] = useState<any[]>([]);
  const [donationBox, setDonationBox] = useState<any>(null);
  const [expandedCollectives, setExpandedCollectives] = useState<Set<number>>(new Set());
  const [collectiveDetails, setCollectiveDetails] = useState<Record<number, any>>({});
  const [preselectedItemAdded, setPreselectedItemAdded] = useState(false);
  const [fromPaymentResult, setFromPaymentResult] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showReviewBottomSheet, setShowReviewBottomSheet] = useState(false);
  const [justCreatedBox, setJustCreatedBox] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'cause' | 'collective' } | null>(null);
  const reviewBottomSheetRef = useRef<any>(null);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Load current donation box
  const donationBoxQuery = useQuery({
    queryKey: ['donationBox', currentUser?.id],
    queryFn: getDonationBox,
    enabled: !!currentUser?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Fetch donation history for lifetime amount
  const { data: donationHistoryData } = useQuery({
    queryKey: ['donationHistory'],
    queryFn: getDonationHistory,
    enabled: !!currentUser?.id,
  });

  // Decide step based on existing box - only when setup tab is active
  useEffect(() => {
    if (activeTab === 'setup') {
      if (donationBoxQuery.data && donationBoxQuery.data.id) {
        setDonationBox(donationBoxQuery.data);
        if(donationBoxQuery.data.is_active) {
          setCheckout(true);
        } else {
          // If donation box exists but is not active, show step 2 (not checkout)
          setCheckout(false);
        }
        setStep(2);
      } else {
        setCheckout(false);
        setStep(1);
      }
    }
  }, [donationBoxQuery.data, activeTab]);

  // Update local donationBox state when query data changes (for immediate UI updates)
  useEffect(() => {
    if (donationBoxQuery.data) {
      setDonationBox(donationBoxQuery.data);
    }
  }, [donationBoxQuery.data]);

  // Causes search (max 5 rendered)
  const { data: causesData, isLoading: causesLoading } = useQuery({
    queryKey: ['causes', searchQuery],
    queryFn: () => getCausesBySearch(searchQuery, '', 1),
  });

  // Joined collectives
  const { data: joinedCollectivesData, isLoading: collectivesLoading } = useQuery({
    queryKey: ['joined-collectives', currentUser?.id],
    queryFn: () => getJoinCollective(currentUser?.id?.toString() || ''),
    enabled: !!currentUser?.id,
  });

  // Create donation box
  const createBoxMutation = useMutation({
    mutationFn: createDonationBox,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      setJustCreatedBox(true); // Flag to indicate we just created the box
      setStep(2);
      // Open review bottom sheet after creating
      setTimeout(() => {
        reviewBottomSheetRef.current?.open();
      }, 100);
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message || 'Failed to create box'),
  });


  // Mutation to remove cause from box
  const removeCauseMutation = useMutation({
    mutationFn: (causeId: string) => removeCauseFromBox(causeId),
    onSuccess: async () => {
      console.log('Cause removed successfully');
      // Invalidate and refetch donation box data
      await queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
      await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      // Refetch the donation box query
      await donationBoxQuery.refetch();
      setShowDeleteModal(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      console.error('Error removing cause:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to remove cause';
      Alert.alert('Error', errorMessage);
    },
  });

  // Mutation to remove collective from box
  const removeCollectiveMutation = useMutation({
    mutationFn: (collectiveId: string) => removeCollectiveFromBox(collectiveId),
    onSuccess: async () => {
      console.log('Collective removed successfully');
      // Invalidate and refetch donation box data
      await queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
      await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      // Refetch the donation box query
      await donationBoxQuery.refetch();
      setShowDeleteModal(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      console.error('Error removing collective:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to remove collective';
      Alert.alert('Error', errorMessage);
    },
  });

  // Handle delete confirmation
  const handleDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'cause') {
        removeCauseMutation.mutate(itemToDelete.id);
      } else {
        removeCollectiveMutation.mutate(itemToDelete.id);
      }
    }
  };

  const activateDonationBoxConfirm = useMutation({
    mutationFn: confirmMobileActivation,
    onSuccess: () => {
      // Alert.alert('Success', 'Donation box activated');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      // Set flag to show confetti in checkout screen
      setFromPaymentResult(true);
      setIsProcessingPayment(false);
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.response?.data?.message || 'Activation failed');
      setIsProcessingPayment(false);
    },
  });

  // Activate donation box (Stripe PaymentSheet)
  const activateMutation = useMutation({
    mutationFn: activateDonationBoxMobile,
    onSuccess: async (response: any) => {
      const clientSecret = response?.client_secret;
      if (!clientSecret) {
        Alert.alert('Error', 'Missing client secret');
        setIsProcessingPayment(false);
        return;
      }
      
      setIsProcessingPayment(true);
      try {
        const merchantDisplayName = getMerchantDisplayName();
        const init = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: `${merchantDisplayName} via CRWD`,
          allowsDelayedPaymentMethods: false,
          applePay: {
            merchantCountryCode: 'US',
          }
        });
        if (init.error) {
          Alert.alert('Error', init.error.message || 'Failed to initialize payment');
          setIsProcessingPayment(false);
          return;
        }
        const present = await presentPaymentSheet();
        if (present.error && present.error.code !== 'Canceled') {
          Alert.alert('Payment Failed', present.error.message || 'Unable to complete payment');
          setIsProcessingPayment(false);
          return;
        }

        if(!present.error) {
          // Keep loader showing while confirming
          activateDonationBoxConfirm.mutate({
           payment_intent_id: response.payment_intent_id,
          });
        } else {
          setIsProcessingPayment(false);
        }
      } catch (error) {
        setIsProcessingPayment(false);
        Alert.alert('Error', 'Payment processing failed');
      }
    },
    onError: (e: any) => {
      console.log('error', e);
      Alert.alert('Error', e?.response?.data?.message || 'Activation failed');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      setIsProcessingPayment(false);
    },
  });

  // Generate merchant display name from donation box (Apple guideline requirement)
  const getMerchantDisplayName = (): string => {
    const donationBoxData = donationBoxQuery.data || donationBox;
    if (!donationBoxData) {
      return 'CRWD';
    }

    const causes = donationBoxData.manual_causes || [];
    const collectives = donationBoxData.attributing_collectives || [];
    const allItems = [...causes, ...collectives];

    if (allItems.length === 0) {
      return 'CRWD';
    }

    if (allItems.length === 1) {
      // Single organization: show its name
      return allItems[0]?.name || 'CRWD';
    }

    // Multiple organizations: show them in a readable format
    // Apple Pay has display limits, so we'll show up to 2-3 names or use a summary
    const names = allItems
      .map(item => item?.name)
      .filter(Boolean)
      .slice(0, 3); // Limit to first 3 to avoid truncation

    if (names.length === 0) {
      return 'CRWD';
    }

    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }

    if (names.length === 3 && allItems.length === 3) {
      return `${names[0]}, ${names[1]} & ${names[2]}`;
    }

    // More than 3 selected, show first 2 and count
    const remainingCount = allItems.length - 2;
    return `${names[0]} & ${names[1]} +${remainingCount} more`;
  };

  const handleToggleCollective = async (collectiveId: number) => {
    const isExpanded = expandedCollectives.has(collectiveId);
    const newExpanded = new Set(expandedCollectives);
    
    if (isExpanded) {
      newExpanded.delete(collectiveId);
    } else {
      newExpanded.add(collectiveId);
      // Fetch collective details if not already cached
      if (!collectiveDetails[collectiveId]) {
        try {
          const details = await getCollectiveById(collectiveId.toString());
          setCollectiveDetails(prev => ({ ...prev, [collectiveId]: details }));
        } catch (error) {
          console.error('Error fetching collective details:', error);
        }
      }
    }
    setExpandedCollectives(newExpanded);
  };

  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setDonationAmount(roundedValue);
    setInputValue(roundedValue.toString());
  };

  // Handle continue to review button
  const handleContinueToReview = () => {
    if (step === 1) {
      // Donation box not setup - create it first
      const prepareRequestData = async () => {
        const requestData: any = {
          monthly_amount: donationAmount.toString(),
          causes: [],
        };

        // Get preselected causes and collective ID from route params
        const maybeParams: any = (route as any)?.params;
        const preselectedCauseIds = maybeParams?.preselectedCauses || [];
        const preselectedCollectiveId = maybeParams?.preselectedCollectiveId;
        const hasPreselectedCollective = preselectedCollectiveId !== undefined;

        // Add causes from selectedCauseIds
        // If they came from preselectedCollectiveId, add attributed_collective
        selectedCauseIds.forEach((causeId) => {
          if (hasPreselectedCollective && preselectedCauseIds.includes(causeId)) {
            // This cause came from the preselected collective
            requestData.causes.push({
              cause_id: causeId,
              attributed_collective: preselectedCollectiveId,
            });
          } else {
            // Standalone cause, no attributed_collective
            requestData.causes.push({
              cause_id: causeId,
            });
          }
        });

        // Add causes from selectedCollectiveIds
        if (selectedCollectiveIds.length > 0) {
          for (const collectiveId of selectedCollectiveIds) {
            try {
              let collectiveDetailsData = collectiveDetails[collectiveId];
              
              if (!collectiveDetailsData) {
                collectiveDetailsData = await getCollectiveById(collectiveId.toString());
                setCollectiveDetails(prev => ({ ...prev, [collectiveId]: collectiveDetailsData }));
              }
              
              if (collectiveDetailsData?.causes && Array.isArray(collectiveDetailsData.causes)) {
                collectiveDetailsData.causes.forEach((causeItem: any) => {
                  const causeId = causeItem.cause?.id || causeItem.id;
                  if (causeId && !selectedCauseIds.includes(causeId)) {
                    // Only add if not already added from selectedCauseIds
                    requestData.causes.push({
                      cause_id: causeId,
                      attributed_collective: collectiveId,
                    });
                  }
                });
              }
            } catch (error) {
              console.error(`Error fetching collective ${collectiveId} details:`, error);
            }
          }
        }

        createBoxMutation.mutate(requestData);
      };

      prepareRequestData();
    } else {
      // Donation box already setup - just open review bottom sheet
      reviewBottomSheetRef.current?.open();
    }
  };

  useEffect(() => {
    // If navigated with initialTab param, open the requested tab
    const maybeParams: any = (route as any)?.params;
    if (maybeParams?.initialTab === 'onetime') {
      setActiveTab('onetime');
    } else if (maybeParams?.initialTab === 'setup') {
      setActiveTab('setup');
    }
    
    // Handle preselected causes (array) for setup tab - only once
    if (maybeParams?.preselectedCauses && Array.isArray(maybeParams.preselectedCauses) && maybeParams?.initialTab === 'setup' && !preselectedItemAdded) {
      const preselectedCauseIds = maybeParams.preselectedCauses;
      const preselectedCausesData = maybeParams.preselectedCausesData || [];
      
      // Set selected cause IDs
      setSelectedCauseIds(preselectedCauseIds);
      
      // Set selected causes data if provided
      if (preselectedCausesData.length > 0) {
        setSelectedCausesData(preselectedCausesData);
      }
      
      setPreselectedItemAdded(true);
    }
    
    // Handle preselected item for setup tab (collectives) - only once
    if (maybeParams?.preselectedItem && maybeParams?.initialTab === 'setup' && !preselectedItemAdded) {
      const preselectedItem = maybeParams.preselectedItem;
      if (preselectedItem.type === 'collective') {
        const collectiveId = parseInt(preselectedItem.id);
        if (!isNaN(collectiveId)) {
          // Add to selectedCollectiveIds
          setSelectedCollectiveIds(prev => {
            if (!prev.includes(collectiveId)) {
              return [...prev, collectiveId];
            }
            return prev;
          });
          // Also add to selectedCollectivesData so it shows in the UI
          if (preselectedItem.data) {
            setSelectedCollectivesData(prev => {
              // Check if already exists
              const exists = prev.some(c => c.id === collectiveId);
              if (!exists) {
                return [...prev, preselectedItem.data];
              }
              return prev;
            });
          }
          setPreselectedItemAdded(true);
        }
      }
    }
    // Handle preselected item for one-time donations
    if (maybeParams?.preselectedItem && maybeParams?.initialTab === 'onetime') {
      // preselectedItem is already being passed to OneTimeDonation below
    }
  }, [route, preselectedItemAdded]);

  if (!currentUser?.id) {
            return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav title={'Donation Box'} />
                <View style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    paddingHorizontal: 32,
                    backgroundColor: 'white'
                }}>
                    {/* Icon */}
                    <View style={{
                        width: 80,
                        height: 80,
                        backgroundColor: '#dbeafe',
                        borderRadius: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 24
                    }}>
                        {/* <Text style={{ fontSize: 40, color: '#2563eb' }}>👤</Text> */}
                        <User size={40} color={PrimaryBlue} />
                    </View>
                    
                    {/* Title */}
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: 12,
                        textAlign: 'center'
                    }}>
                        Sign in to make a donation
                    </Text>
                    
                    {/* Description */}
                    <Text style={{
                        fontSize: 16,
                        color: '#6b7280',
                        marginBottom: 32,
                        textAlign: 'center',
                        lineHeight: 24
                    }}>
                        Sign in to make a donation, manage your causes, and connect with your community.
                    </Text>
                    
                    {/* CTA Button */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login' as never)}
                        style={{
                            backgroundColor: '#2563eb',
                            paddingHorizontal: 32,
                            paddingVertical: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                            Sign In to Continue
                        </Text>
                    </TouchableOpacity>
                    
                    {/* Additional Info */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ClaimProfile' as never)}
                      >
                    <Text style={{
                        fontSize: 14,
                        color: '#6b7280',
                        marginTop: 24,
                        textAlign: 'center'
                    }}>
                        Don't have an account? 
                        <Text style={{ color: '#2563eb', fontWeight: '500' }}> Create one here</Text>
                    </Text>
</TouchableOpacity>
                </View>
            </SafeAreaView>
        )
  }


  if (donationBoxQuery.isLoading) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
        <MainHeaderNav show={false} menu={false} title={'Donation Box'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        {/* {step > 1 && activeTab !== 'onetime' ? (
          <TouchableOpacity
            onPress={() => setStep(s => s - 1)}
            style={styles.headerButton}
          >
            <ChevronLeft  color="#374151"  />
          </TouchableOpacity>
        )  : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            
            <ChevronLeft color='#374151' />
          </TouchableOpacity>
        )}  */}

        <Text style={styles.headerTitle}>Donation Box</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'setup' && styles.activeTab
            ]}
            onPress={() => {
              if (checkout) {
                setCheckout(false);
              }
              setActiveTab('setup');
              // Don't reset step - let useEffect handle it based on donation box existence
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'setup' && styles.activeTabText
            ]}>
              Monthly Giving
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'onetime' && styles.activeTab
            ]}
            onPress={() => {
              if (checkout) {
                setCheckout(false);
              }
              setActiveTab('onetime');
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'onetime' && styles.activeTabText
            ]}>
              One-Time Donation
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {checkout ? (
          <CheckoutScreen
            donationAmount={donationAmount}
            selectedOrganizations={selectedOrganizations}
            onBack={() => {
              setCheckout(false);
              setFromPaymentResult(false); // Clear flag when going back
            }}
            donationBox={donationBoxQuery.data || donationBox}
            fromPaymentResult={fromPaymentResult}
            onConfettiShown={() => setFromPaymentResult(false)} // Clear flag after confetti is shown
          />
        ) : activeTab === 'onetime' ? (
          <OneTimeDonation
            setCheckout={setCheckout}
            selectedOrganizations={selectedOrganizations}
            setSelectedOrganizations={setSelectedOrganizations}
            preselectedItem={(route.params as any)?.preselectedItem}
            activeTab={(route.params as any)?.activeTab}
          />
        ) : (
        <View style={styles.setupContentWrapper}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <>
              {step === 1 ? (
                <View style={styles.stepContent}>
                  {/* Header */}
                  <View style={styles.step1Header}>
                    <Text style={styles.step1Title}>Set your monthly gift</Text>
                    <Text style={styles.step1Subtitle}>
                      Support multiple causes with one donation, split evenly. Change anytime.
                    </Text>
                  </View>

                  {/* Donation Box Card */}
                  <View style={styles.amountCard}>
                    {/* Your Monthly Impact Section */}
                    <View style={styles.monthlyImpactSection}>
                      <Text style={styles.monthlyImpactTitle}>Your Monthly Impact</Text>
                      
                      {/* Amount Selector */}
                      <View style={styles.amountSelectorContainer}>
                        <TouchableOpacity
                          onPress={() => {
                            if (donationAmount > 5) {
                              const newAmount = Math.max(5, donationAmount - 5);
                              setDonationAmount(newAmount);
                              setInputValue(newAmount.toString());
                            }
                          }}
                          style={[
                            styles.amountButton,
                            donationAmount <= 5 && styles.amountButtonDisabled
                          ]}
                        >
                          <Text style={[
                            styles.minusIcon,
                            donationAmount > 5 && styles.minusIconWhite
                          ]}>−</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.amountDisplay}>
                          <Text style={styles.amountValue}>${donationAmount}</Text>
                          <Text style={styles.amountLabel}>per month</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            const newAmount = donationAmount + 5;
                            setDonationAmount(newAmount);
                            setInputValue(newAmount.toString());
                          }}
                          style={styles.amountButton}
                        >
                          <Plus size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Donation Box Capacity Section */}
                    {(() => {
                      const calculateFees = (grossAmount: number) => {
                        const gross = grossAmount;
                        const stripeFee = (gross * 0.029) + 0.30;
                        const crwdFee = (gross - stripeFee) * 0.07;
                        const net = gross - stripeFee - crwdFee;
                        return {
                          stripeFee: Math.round(stripeFee * 100) / 100,
                          crwdFee: Math.round(crwdFee * 100) / 100,
                          net: Math.round(net * 100) / 100,
                        };
                      };

                      const actualDonationAmount = parseFloat(donationAmount.toString());
                      const fees = calculateFees(actualDonationAmount);
                      const net = fees.net;
                      const maxCapacity = Math.floor(net / 0.20);
                      const currentCapacity = selectedCauseIds.length + selectedCollectiveIds.length;
                      const capacityPercentage = maxCapacity > 0 ? Math.min(100, (currentCapacity / maxCapacity) * 100) : 0;
                      
                      return (
                        <View style={styles.capacityCard}>
                          <View style={styles.capacityHeader}>
                            <Text style={styles.capacityTitle}>Donation Box Capacity</Text>
                            <Text style={styles.capacityCount}>
                              {currentCapacity}/{maxCapacity} causes
                            </Text>
                          </View>
                          
                          {/* Progress Bar */}
                          <View style={styles.progressBarContainer}>
                            <View
                              style={[
                                styles.progressBar,
                                { width: `${capacityPercentage}%` }
                              ]}
                            />
                          </View>
                          
                          <Text style={styles.capacityText}>
                            For every ${donationAmount}, you can support {maxCapacity} cause{maxCapacity !== 1 ? 's' : ''}.
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  {/* Your Selected Causes */}
                  {selectedCauseIds.length > 0 && (
                    <View style={styles.selectedCausesSection}>
                      <View style={styles.selectedCausesHeader}>
                        <View>
                          <Text style={styles.selectedCausesTitle}>Your Selected Causes</Text>
                          <Text style={styles.selectedCausesSubtitle}>Your Donation Box. Add or remove anytime.</Text>
                        </View>
                        <View style={styles.selectedCausesBadge}>
                          <Text style={styles.selectedCausesBadgeText}>{selectedCauseIds.length}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.selectedCausesList}>
                        {selectedCausesData.map((cause: any) => {
                          const avatarColors = ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
                          const getConsistentColor = (id: number) => {
                            return avatarColors[id % avatarColors.length];
                          };
                          const getInitials = (name: string) => {
                            if (!name) return 'N';
                            const words = name.trim().split(' ');
                            if (words.length >= 2) {
                              return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
                            }
                            return name.charAt(0).toUpperCase();
                          };
                          const avatarBgColor = getConsistentColor(cause.id);
                          const initials = getInitials(cause.name);
                          
                          return (
                            <View key={cause.id} style={styles.selectedCauseItem}>
                              <Avatar size={48} style={[styles.selectedCauseAvatar, { borderRadius: 8 }]}>
                                <AvatarImage src={cause.image} />
                                <AvatarFallback
                                  style={{ backgroundColor: avatarBgColor }}
                                  textStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
                                >
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <View style={styles.selectedCauseInfo}>
                                <Text style={styles.selectedCauseName}>{cause.name}</Text>
                                <Text style={styles.selectedCauseDescription} numberOfLines={1}>
                                  {cause.mission || cause.description || 'No description available'}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedCauseIds(selectedCauseIds.filter(id => id !== cause.id));
                                  setSelectedCausesData(selectedCausesData.filter(c => c.id !== cause.id));
                                }}
                                style={styles.removeCauseButton}
                              >
                                <Trash2 size={16} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Add More Causes Section */}
                  <View style={styles.addMoreSection}>
                    <Text style={styles.addMoreTitle}>Add More Causes</Text>
                    
                    {/* Search Bar */}
                    <View style={styles.searchBarContainer}>
                      <View style={styles.searchInputWrapper}>
                        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                          placeholder="Search for causes..."
                          placeholderTextColor="#9ca3af"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          style={styles.searchInput}
                        />
                      </View>
                    </View>

                    {/* Request Nonprofit Link */}
                    <TouchableOpacity
                      onPress={() => setShowRequestModal(true)}
                      style={styles.requestLinkContainer}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.requestLink}>
                        Can't find your nonprofit? Request it here
                      </Text>
                    </TouchableOpacity>
                    {/* Nonprofits List */}
                    <View style={styles.causesList}>
                      {causesLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#9ca3af" />
                        </View>
                      ) : causesData?.results?.length > 0 ? (
                        causesData.results
                          .filter((cause: any) => !selectedCauseIds.includes(cause.id))
                          .map((cause: any) => {
                            const avatarColors = ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
                            const getConsistentColor = (id: number) => {
                              return avatarColors[id % avatarColors.length];
                            };
                            const getInitials = (name: string) => {
                              if (!name) return 'N';
                              const words = name.trim().split(' ');
                              if (words.length >= 2) {
                                return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
                              }
                              return name.charAt(0).toUpperCase();
                            };
                            const avatarBgColor = getConsistentColor(cause.id);
                            const initials = getInitials(cause.name);
                            
                            return (
                              <View key={cause.id} style={styles.causeItem}>
                                <Avatar size={48} style={[styles.causeAvatar, { borderRadius: 8 }]}>
                                  <AvatarImage src={cause.image} />
                                  <AvatarFallback
                                    style={{ backgroundColor: avatarBgColor }}
                                    textStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
                                  >
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <View style={styles.causeInfo}>
                                  <Text style={styles.causeName}>{cause.name}</Text>
                                  <Text style={styles.causeDescription} numberOfLines={1}>
                                    {cause.mission || cause.description || 'No description available'}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  onPress={() => {
                                    // Calculate max capacity
                                    const calculateFees = (grossAmount: number) => {
                                      const gross = grossAmount;
                                      const stripeFee = (gross * 0.029) + 0.30;
                                      const crwdFee = (gross - stripeFee) * 0.07;
                                      const net = gross - stripeFee - crwdFee;
                                      return {
                                        stripeFee: Math.round(stripeFee * 100) / 100,
                                        crwdFee: Math.round(crwdFee * 100) / 100,
                                        net: Math.round(net * 100) / 100,
                                      };
                                    };
                                    const actualDonationAmount = parseFloat(donationAmount.toString());
                                    const fees = calculateFees(actualDonationAmount);
                                    const net = fees.net;
                                    const maxCapacity = Math.floor(net / 0.20);
                                    const currentCapacity = selectedCauseIds.length + selectedCollectiveIds.length;
                                    
                                    // Check if adding this cause would exceed capacity
                                    if (currentCapacity >= maxCapacity) {
                                      Alert.alert(
                                        'Capacity Reached',
                                        `You can only add up to ${maxCapacity} cause${maxCapacity !== 1 ? 's' : ''} for $${donationAmount}. Increase your donation amount to support more causes.`
                                      );
                                      return;
                                    }
                                    
                                    setSelectedCauseIds([...selectedCauseIds, cause.id]);
                                    setSelectedCausesData([...selectedCausesData, cause]);
                                  }}
                                  style={styles.addCauseButton}
                                >
                                  <Plus size={16} color="#ec4899" />
                                </TouchableOpacity>
                              </View>
                            );
                          })
                      ) : (
                        <Text style={styles.noCausesText}>No nonprofits found</Text>
                      )}
                    </View>
                  </View>

                  {/* Choose Collective to Support */}
                  {/* <View style={{ marginTop: 24 }}>
                    <Text style={[styles.organizationsTitle, { marginTop: 0 }]}>Choose collective to support</Text>
                    <View style={styles.organizationsList}>
                      {collectivesLoading ? (
                        <ActivityIndicator />
                      ) : (
                        (joinedCollectivesData?.data || []).map((item: any) => {
                          const collective = item.collective;
                          const isSelected = selectedCollectiveIds.includes(collective.id);
                          const isExpanded = expandedCollectives.has(collective.id);
                          const details = collectiveDetails[collective.id];
                          const isLoading = isExpanded && !details;
                          
                          return (
                            <View key={collective.id}>
                              <View style={[styles.organizationItem, isSelected && styles.selectedOrganizationItem]}>
                                <TouchableOpacity
                                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                                  onPress={() => handleToggleCollective(collective.id)}
                                >
                                  <View style={[styles.orgAvatar, { backgroundColor: '#dcfce7' }]}>
                                    <Text style={[styles.orgAvatarText, { color: '#16a34a' }]}>{collective.name?.charAt(0).toUpperCase() || 'C'}</Text>
                                  </View>
                                  <View style={styles.orgInfo}>
                                    <Text style={styles.orgName}>{collective.name}</Text>
                                    {!!collective.description && <Text style={styles.orgDescription} numberOfLines={1}>{collective.description}</Text>}
                                  </View>
                                  {isLoading ? (
                                    <ActivityIndicator size="small" color={PrimaryBlue} style={{ marginLeft: 8 }} />
                                  ) : (
                                    <ChevronDown 
                                      size={20} 
                                      color="#6b7280" 
                                      style={{ 
                                        marginLeft: 8,
                                        transform: [{ rotate: isExpanded ? '180deg' : '0deg' }]
                                      }} 
                                    />
                                  )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    if (isSelected) {
                                      setSelectedCollectiveIds(selectedCollectiveIds.filter(id => id !== collective.id));
                                      setSelectedCollectivesData(selectedCollectivesData.filter(c => c.id !== collective.id));
                                    } else {
                                      setSelectedCollectiveIds([...selectedCollectiveIds, collective.id]);
                                      setSelectedCollectivesData([...selectedCollectivesData, collective]);
                                    }
                                  }}
                                  style={{ marginLeft: 8 }}
                                >
                                  <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                  </View>
                                </TouchableOpacity>
                              </View>
                              {isExpanded && details && details.causes && details.causes.length > 0 && (
                                <View style={{ paddingLeft: 60, paddingTop: 8, paddingBottom: 8, backgroundColor: '#f9fafb' }}>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 }}>Nonprofits ({details.causes.length})</Text>
                                  {details.causes.map((causeItem: any) => (
                                    <View key={causeItem.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                                      <View style={[styles.orgAvatar, { backgroundColor: '#dbeafe', marginRight: 12, width: 32, height: 32 }]}>
                                        <Text style={[styles.orgAvatarText, { color: '#2563eb', fontSize: 12 }]}>{causeItem.cause?.name?.charAt(0).toUpperCase() || 'N'}</Text>
                                      </View>
                                      <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14 }}>{causeItem.cause?.name}</Text>
                                        {!!causeItem.cause?.description && (
                                          <Text style={{ color: '#6b7280', fontSize: 12 }} numberOfLines={2}>{causeItem.cause.description}</Text>
                                        )}
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  </View> */}
                </View>
              ) : step === 2 ? (
                <View style={styles.step2Content}>
                  {/* Show loading state if data is still being fetched */}
                  {donationBoxQuery.isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
                      <ActivityIndicator size="large" color={PrimaryBlue} />
                    </View>
                  ) : (
                    <>
                      {/* Donation Box Summary Card */}
                      <DonationBoxSummaryCard
                        monthlyAmount={Math.round(parseFloat((donationBoxQuery.data?.monthly_amount || donationBox?.monthly_amount || donationAmount).toString()))}
                        lifetimeAmount={Math.round((donationHistoryData?.results?.reduce((sum: number, transaction: any) => {
                          return sum + parseFloat(transaction.gross_amount || '0');
                        }, 0) || 0))}
                        causesCount={(() => {
                          const boxCauses = donationBoxQuery.data?.box_causes || donationBox?.box_causes || [];
                          const causes = boxCauses.map((boxCause: any) => boxCause.cause).filter((cause: any) => cause != null);
                          return causes.length;
                        })()}
                        collectivesCount={(() => {
                          const attributingCollectives = donationBoxQuery.data?.attributing_collectives || donationBox?.attributing_collectives || [];
                          return attributingCollectives.length;
                        })()}
                        currentCapacity={(() => {
                          const boxCauses = donationBoxQuery.data?.box_causes || donationBox?.box_causes || [];
                          const uniqueCauseIds = new Set(boxCauses.map((bc: any) => bc.cause?.id).filter(Boolean));
                          return uniqueCauseIds.size;
                        })()}
                        maxCapacity={(() => {
                          const actualAmount = parseFloat((donationBoxQuery.data?.monthly_amount || donationBox?.monthly_amount || donationAmount).toString());
                          const calculateFees = (grossAmount: number) => {
                            const gross = grossAmount;
                            const stripeFee = (gross * 0.029) + 0.30;
                            const crwdFee = (gross - stripeFee) * 0.07;
                            const net = gross - stripeFee - crwdFee;
                            return {
                              stripeFee: Math.round(stripeFee * 100) / 100,
                              crwdFee: Math.round(crwdFee * 100) / 100,
                              net: Math.round(net * 100) / 100,
                            };
                          };
                          const fees = calculateFees(actualAmount);
                          const net = fees.net;
                          return Math.floor(net / 0.20);
                        })()}
                        donationBox={donationBoxQuery.data || donationBox}
                        onAddCauses={() => {
                          navigation.navigate('ManageDonationBox' as never);
                        }}
                      />

                      {/* Currently Supporting Section */}
                      <View style={styles.currentlySupportingSection}>
                        <View style={styles.currentlySupportingHeader}>
                          <Text style={styles.currentlySupportingTitle}>Currently Supporting</Text>
                          <Text style={styles.currentlySupportingSubtitle}>
                            Supporting {(() => {
                              const boxCauses = donationBoxQuery.data?.box_causes || donationBox?.box_causes || [];
                              const causes = boxCauses.map((boxCause: any) => boxCause.cause).filter((cause: any) => cause != null);
                              return causes.length;
                            })()} nonprofit{(() => {
                              const boxCauses = donationBoxQuery.data?.box_causes || donationBox?.box_causes || [];
                              const causes = boxCauses.map((boxCause: any) => boxCause.cause).filter((cause: any) => cause != null);
                              return causes.length;
                            })() !== 1 ? 's' : ''}
                          </Text>
                        </View>

                        {/* Causes List from box_causes */}
                        <View style={styles.causesListContainer}>
                          {(() => {
                            const boxCauses = donationBoxQuery.data?.box_causes || donationBox?.box_causes || [];
                            const causes = boxCauses.map((boxCause: any) => boxCause.cause).filter((cause: any) => cause != null);
                            
                            // Helper for consistent avatar colors
                            const avatarColors = [
                              '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
                              '#F97316', '#84CC16', '#A855F7', '#14B8A6', '#F43F5E', '#6366F1', '#22C55E', '#EAB308',
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

                            const actualDonationAmount = parseFloat((donationBoxQuery.data?.monthly_amount || donationBox?.monthly_amount || donationAmount).toString());
                            const totalItems = causes.length;
                            const distributionPercentage = totalItems > 0 ? Math.floor(100 / totalItems) : 0;
                            const amountPerItem = totalItems > 0 ? (actualDonationAmount * 0.9) / totalItems : 0;

                            if (causes.length > 0) {
                              return causes.map((cause: any) => {
                                const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                                const initials = getInitials(cause.name || 'N');
                                return (
                                  <View key={cause.id} style={styles.causeCardStep2}>
                                    <Avatar size={48} style={[styles.causeIconStep2, { borderRadius: 8 }]}>
                                      <AvatarImage src={cause.image} />
                                      <AvatarFallback
                                        style={{ backgroundColor: avatarBgColor }}
                                        textStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
                                      >
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <View style={styles.causeInfoStep2}>
                                      <Text style={styles.causeNameStep2}>{cause.name}</Text>
                                      <Text style={styles.causeDescriptionStep2} numberOfLines={1}>
                                        {cause.mission || cause.description || 'Making a positive impact in the community'}
                                      </Text>
                                    </View>
                                    <View style={styles.causeActionsStep2}>
                                      <View style={styles.amountInfoStep2}>
                                        <Text style={styles.amountPercentageStep2}>{distributionPercentage}%</Text>
                                        <Text style={styles.amountPerMonthStep2}>${amountPerItem.toFixed(2)}/mo</Text>
                                      </View>
                                      <TouchableOpacity
                                        onPress={() => {
                                          setItemToDelete({ id: cause.id.toString(), name: cause.name, type: 'cause' });
                                          setShowDeleteModal(true);
                                        }}
                                        style={styles.trashButtonStep2}
                                        activeOpacity={0.7}
                                      >
                                        <Trash2 size={18} color="#ef4444" />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                );
                              });
                            } else {
                              return (
                                <View style={styles.noCausesContainer}>
                                  <Text style={styles.noCausesText}>No causes</Text>
                                </View>
                              );
                            }
                          })()}
                        </View>
                      </View>
                    </>
                  )}
                </View>
              ) : null}
            </>
          </ScrollView>
          
          {/* Footer Button - Always visible at bottom */}
          {activeTab === 'setup' && !checkout && step === 1 && (
            <View style={styles.continueButtonContainer}>
              <TouchableOpacity
                onPress={handleContinueToReview}
                disabled={
                  createBoxMutation.isPending || 
                  (selectedCauseIds.length === 0 && selectedCollectiveIds.length === 0)
                }
                style={[
                  styles.continueButton,
                  (createBoxMutation.isPending || 
                  (selectedCauseIds.length === 0 && selectedCollectiveIds.length === 0)) && 
                  styles.continueButtonDisabled
                ]}
              >
                <Text style={styles.continueButtonText}>
                  {createBoxMutation.isPending ? 'Creating...' : 'Continue to Review'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

      {activeTab === 'setup' && step === 2 && !donationBoxQuery.data?.is_active && (
        <View style={styles.continueButtonContainer}>     
          <TouchableOpacity
            onPress={() => reviewBottomSheetRef.current?.open()}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>
              Continue to Review
            </Text>
          </TouchableOpacity>
        </View>
      )}
        </View>
        )}
      </View>

      {/* Payment Processing Loader */}
      <Modal
        visible={isProcessingPayment || activateMutation.isPending || activateDonationBoxConfirm.isPending}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PrimaryBlue} />
            <Text style={styles.loaderText}>Processing payment...</Text>
          </View>
        </View>
      </Modal>

      {/* Donation Review Bottom Sheet */}
      <DonationReviewBottomSheet
        ref={reviewBottomSheetRef}
        donationAmount={
          step === 2 && donationBoxQuery.data?.monthly_amount && !justCreatedBox
            ? parseFloat(donationBoxQuery.data.monthly_amount.toString())
            : donationAmount
        }
        selectedCauses={
          (step === 1 || justCreatedBox) && selectedCausesData.length > 0
            ? selectedCausesData
            : (donationBoxQuery.data?.box_causes || []).map((boxCause: any) => {
                const cause = boxCause.cause || boxCause;
                return {
                  id: cause.id,
                  name: cause.name,
                  description: cause.description || cause.mission,
                  image: cause.image,
                };
              }).filter((cause: any) => cause.id != null)
        }
        onComplete={() => {
          reviewBottomSheetRef.current?.close();
          setJustCreatedBox(false); // Reset flag
          setCheckout(true);
        }}
        onClose={() => {
          setJustCreatedBox(false); // Reset flag when closing
        }}
      />

      {/* Request Nonprofit Modal */}
      <RequestNonprofitModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />

      {/* Remove Cause Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
      >
        <View style={styles.deleteModalOverlay}>
          <Pressable
            style={styles.deleteModalBackdrop}
            onPress={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
          />
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHandle} />
            <View style={styles.deleteModalBody}>
              <Text style={styles.deleteModalTitle}>Remove Cause?</Text>
              <Text style={styles.deleteModalDescription}>
                Are you sure you want to remove <Text style={styles.deleteModalBold}>{itemToDelete?.name}</Text> from your donation box? This action cannot be undone.
              </Text>
            </View>
            <View style={styles.deleteModalFooter}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                disabled={removeCauseMutation.isPending || removeCollectiveMutation.isPending}
                style={[styles.deleteModalCancelButton, (removeCauseMutation.isPending || removeCollectiveMutation.isPending) && styles.deleteModalButtonDisabled]}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={removeCauseMutation.isPending || removeCollectiveMutation.isPending}
                style={[styles.deleteModalConfirmButton, (removeCauseMutation.isPending || removeCollectiveMutation.isPending) && styles.deleteModalButtonDisabled]}
                activeOpacity={0.7}
              >
                {removeCauseMutation.isPending || removeCollectiveMutation.isPending ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteModalConfirmText}>Removing...</Text>
                  </>
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5
  },
  headerTitle: {
    flex: 1,
    // textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  closeIcon: {
    fontSize: 20,
    color: '#374151',
    fontWeight: 'bold',
  },
  minusIcon: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  minusIconWhite: {
    color: '#ffffff',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  activeTab: {
    backgroundColor: PrimaryBlue,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
  },
  setupContentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
    paddingBottom: 100, // Space for continue button
  },
  step1Header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  step1Title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1600ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  step1Subtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  amountCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  amountCardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  amountSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  amountButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1600ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  monthlyImpactSection: {
    marginBottom: 16,
  },
  monthlyImpactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountDisplay: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1600ff',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 18,
    color: '#6b7280',
  },
  organizationsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  organizationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  organizationsList: {
    gap: 16,
  },
  organizationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  selectedOrganizationItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#2563eb',
  },
  orgAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  orgAvatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  orgDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  relatedSection: {
    marginTop: 24,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  selectedSection: {
    marginBottom: 24,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  selectedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  nextSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    color: '#6b7280',
  },
  nextButton: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  nextButtonIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  confirmButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom:30,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedCount: {
    fontSize: 16,
    color: '#6b7280',
  },
  donateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  manageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  // New styles for updated UI
  capacityCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  capacityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1600ff',
  },
  capacityCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1600ff',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#bfdbfe',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1600ff',
    borderRadius: 4,
  },
  capacityText: {
    fontSize: 12,
    color: '#1600ff',
  },
  selectedCausesSection: {
    marginBottom: 24,
  },
  selectedCausesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedCausesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  selectedCausesSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  selectedCausesBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1600ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCausesBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedCausesList: {
    gap: 12,
    marginTop: 12,
  },
  selectedCauseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  selectedCauseAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedCauseAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedCauseInfo: {
    flex: 1,
    minWidth: 0,
  },
  selectedCauseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  selectedCauseDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeCauseButton: {
    padding: 8,
  },
  addMoreSection: {
    marginBottom: 24,
  },
  addMoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#111827',
  },
  requestLinkContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  requestLink: {
    fontSize: 12,
    color: '#1600ff',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  causesList: {
    gap: 12,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  causeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  causeAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  causeInfo: {
    flex: 1,
    minWidth: 0,
  },
  causeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  causeDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  addCauseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCausesText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  step2Content: {
    padding: 16,
    paddingBottom: 100,
  },
  currentlySupportingSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  currentlySupportingHeader: {
    marginBottom: 16,
  },
  currentlySupportingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  currentlySupportingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  causesListContainer: {
    gap: 10,
  },
  causeCardStep2: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  causeIconStep2: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  causeIconTextStep2: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  causeInfoStep2: {
    flex: 1,
    minWidth: 0,
  },
  causeNameStep2: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  causeDescriptionStep2: {
    fontSize: 12,
    color: '#6b7280',
  },
  causeActionsStep2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  amountInfoStep2: {
    alignItems: 'flex-end',
  },
  amountPercentageStep2: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  amountPerMonthStep2: {
    fontSize: 12,
    color: '#6b7280',
  },
  noCausesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  continueButtonContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
  },
  continueButton: {
    backgroundColor: '#1600ff',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  trashButtonStep2: {
    padding: 8,
    borderRadius: 8,
  },
  deleteModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  deleteModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  deleteModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  deleteModalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  deleteModalDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  deleteModalBold: {
    fontWeight: '600',
    color: '#111827',
  },
  deleteModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  deleteModalConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  deleteModalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteModalButtonDisabled: {
    opacity: 0.5,
  },
});
