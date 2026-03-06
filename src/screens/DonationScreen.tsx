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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ChevronLeft, Plus, Trash2, User, X, ChevronDown, Search, Pencil, Minus } from 'lucide-react-native';
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
import { getDonationBox, createDonationBox, removeCauseFromBox, removeCollectiveFromBox, activateDonationBoxMobile, confirmMobileActivation, getDonationHistory, addCausesToBox, updateDonationBox } from '../services/api/donation';
import DonationBoxSummaryCard from '../components/donation/DonationBoxSummaryCard';
import { getCausesBySearch, getJoinCollective, getCollectiveById } from '../services/api/crwd';
import { useAuthStore } from '../store/store';
import { ActivityIndicator, Modal, Pressable } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { useToast } from '../contexts/ToastContext';
import DonationReviewBottomSheet from '../components/donation/DonationReviewBottomSheet';
import RequestNonprofitModal from '../components/newsearch/RequestNonprofitModal';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import EditDonationSplitBottomSheet from '../components/donation/EditDonationSplitBottomSheet';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';


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
  const [showEditSplitSheet, setShowEditSplitSheet] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editableAmount, setEditableAmount] = useState(0);
  const [addingCauseId, setAddingCauseId] = useState<number | null>(null);
  const reviewBottomSheetRef = useRef<any>(null);
  const amountBottomSheetRef = useRef<BottomSheetModal>(null);
  const [amountDraft, setAmountDraft] = useState('5');
  const [amountTarget, setAmountTarget] = useState<'donationAmount' | 'editableAmount'>('donationAmount');
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const boxCauses = donationBox?.box_causes || [];
  const causes = boxCauses.map((boxCause: any) => boxCause.cause).filter((cause: any) => cause != null);
  const actualDonationAmount = parseFloat(donationBox?.monthly_amount || donationAmount.toString());
  const totalItems = causes.length;
  const hasCustomPercentages = boxCauses.some((bc: any) => bc.percentage != null);
  const distributionPercentage = totalItems > 0 ? (hasCustomPercentages ? null : 100 / totalItems) : 0;

  const getCausePercentage = (causeId: number) => {
    const boxCause = boxCauses.find((bc: any) => bc.cause?.id === causeId);
    const percentage = boxCause?.percentage;
    return percentage != null ? Number(percentage) : null; // Return custom percentage as number if exists
  };

  const getAmountPerItem = (causeId: number) => {
    const customPercentage = getCausePercentage(causeId);
    if (customPercentage != null) {
      return (actualDonationAmount * 0.9 * customPercentage) / 100;
    }
    return totalItems > 0 ? (actualDonationAmount * 0.9) / totalItems : 0;
  };

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
        if (donationBoxQuery.data.is_active) {
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



  // Calculate fees and capacity
  const calculateFees = (grossAmount: number) => {
    const gross = grossAmount;
    let crwdFee: number;
    let net: number;

    if (gross < 10.00) {
      // Flat fee of $1.00
      crwdFee = 1.00;
      net = gross - crwdFee;
    } else {
      // 10% of total
      crwdFee = gross * 0.10;
      net = gross - crwdFee;
    }

    return {
      crwdFee: Math.round(crwdFee * 100) / 100,
      net: Math.round(net * 100) / 100,
    };
  };

  // Sync editable amount
  useEffect(() => {
    const box = donationBoxQuery.data;
    if (box?.monthly_amount) {
      setEditableAmount(Math.round(parseFloat(box.monthly_amount)));
    }
  }, [donationBoxQuery.data]);

  // Update amount mutation
  const updateAmountMutation = useMutation({
    mutationFn: (amount: number) => updateDonationBox({ monthly_amount: amount.toString() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      setIsEditingAmount(false);
      showToast('Monthly donation amount updated!');
    },
    onError: (e: any) => showToast(e?.response?.data?.message || 'Failed to update amount'),
  });

  const handleSaveAmount = () => {
    const fees = calculateFees(editableAmount);
    const net = fees.net;
    const maxCapacity = Math.floor(net / 0.20);
    const currentDonationBoxCauses = donationBox?.box_causes?.length || 0;

    if (currentDonationBoxCauses > maxCapacity) {
      showToast(`You can support up to ${maxCapacity} causes with $${editableAmount}. Please increase amount.`);
      return;
    }
    updateAmountMutation.mutate(editableAmount);
  };

  const handleCancelEdit = () => {
    const box = donationBoxQuery.data;
    if (box?.monthly_amount) {
      setEditableAmount(Math.round(parseFloat(box.monthly_amount)));
    }
    setIsEditingAmount(false);
  };

  // Add causes mutation
  const addCausesMutation = useMutation({
    mutationFn: (causeId: number) => addCausesToBox({ causes: [{ cause_id: causeId }] }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      setSearchQuery(''); // Clear search
    },
    onError: (e: any) => showToast(e?.response?.data?.message || 'Failed to add cause'),
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
    onError: (e: any) => showToast(e?.response?.data?.message || 'Failed to create box'),
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
      showToast(errorMessage);
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
      showToast(errorMessage);
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
      showToast(e?.response?.data?.message || 'Activation failed');
      setIsProcessingPayment(false);
    },
  });

  // Activate donation box (Stripe PaymentSheet)
  const activateMutation = useMutation({
    mutationFn: activateDonationBoxMobile,
    onSuccess: async (response: any) => {
      const clientSecret = response?.client_secret;
      if (!clientSecret) {
        showToast('Missing client secret');
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
          showToast(init.error.message || 'Failed to initialize payment');
          setIsProcessingPayment(false);
          return;
        }
        const present = await presentPaymentSheet();
        if (present.error && present.error.code !== 'Canceled') {
          showToast(present.error.message || 'Unable to complete payment');
          setIsProcessingPayment(false);
          return;
        }

        if (!present.error) {
          // Keep loader showing while confirming
          activateDonationBoxConfirm.mutate({
            payment_intent_id: response.payment_intent_id,
          });
        } else {
          setIsProcessingPayment(false);
        }
      } catch (error) {
        setIsProcessingPayment(false);
        showToast('Payment processing failed');
      }
    },
    onError: (e: any) => {
      console.log('error', e);
      showToast(e?.response?.data?.message || 'Activation failed');
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

  const openAmountBottomSheet = () => {
    setAmountTarget('donationAmount');
    setAmountDraft(String(donationAmount));
    amountBottomSheetRef.current?.present();
  };

  const openEditableAmountBottomSheet = () => {
    setAmountTarget('editableAmount');
    setAmountDraft(String(editableAmount));
    amountBottomSheetRef.current?.present();
  };

  const closeAmountBottomSheet = () => {
    amountBottomSheetRef.current?.dismiss();
  };

  const handleAmountDigitPress = (digit: string) => {
    setAmountDraft(prev => {
      const next = (prev || '0') === '0' ? digit : `${prev}${digit}`;
      if (next.length > 6) return prev || '0';
      return next;
    });
  };

  const handleAmountBackspace = () => {
    setAmountDraft(prev => {
      if (!prev || prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleAmountSet = () => {
    const parsed = parseInt(amountDraft || '0', 10);
    const finalValue = Math.max(5, Number.isFinite(parsed) ? parsed : 5);
    if (amountTarget === 'editableAmount') {
      const fees = calculateFees(finalValue);
      const net = fees.net;
      const maxCapacity = Math.floor(net / 0.20);
      const currentDonationBoxCauses = (donationBoxQuery.data?.box_causes || donationBox?.box_causes || []).length;

      if (currentDonationBoxCauses > maxCapacity) {
        showToast(`You can support up to ${maxCapacity} causes with $${finalValue}. Please increase amount.`);
        return;
      }

      setEditableAmount(finalValue);
      setIsEditingAmount(true);
    } else {
      setDonationAmount(finalValue);
      setInputValue(finalValue.toString());
    }
    closeAmountBottomSheet();
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
        <MainHeaderNav title={'Donation Box'} menu={false} />
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

        {/* Tab Navigation - Hide when in checkout */}
        {!checkout && (
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
        )}

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
              <KeyboardAwareScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 0 }}
                enableOnAndroid={true}
                extraScrollHeight={100}
              >
                <>
                  {step === 1 ? (
                    <View style={styles.stepContent}>
                      {/* Header */}
                      <View style={styles.step1Header}>
                        <Text style={styles.step1Title}>
                          {(route.params as any)?.collectiveName ? `Supporting ${(route.params as any).collectiveName}` : 'Set your monthly gift'}
                        </Text>
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

                            <TouchableOpacity
                              onPress={openAmountBottomSheet}
                              style={styles.amountDisplay}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.amountValue}>${donationAmount}</Text>
                              <Text style={styles.amountLabel}>per month</Text>
                            </TouchableOpacity>

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
                        {/* {(() => {
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
                        })()} */}
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
                                <TouchableOpacity
                                  key={cause.id}
                                  style={styles.selectedCauseItem}
                                  onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
                                >
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
                                </TouchableOpacity>
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
                                  <TouchableOpacity
                                    key={cause.id}
                                    style={styles.causeItem}
                                    onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
                                  >
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
                                        const actualDonationAmount = parseFloat(donationAmount.toString());
                                        const fees = calculateFees(actualDonationAmount);
                                        const net = fees.net;
                                        const maxCapacity = Math.floor(net / 0.20);
                                        const currentCapacity = selectedCauseIds.length + selectedCollectiveIds.length;

                                        // Check if adding this cause would exceed capacity
                                        if (currentCapacity >= maxCapacity) {
                                          showToast(`You can only add up to ${maxCapacity} causes for $${donationAmount}. Increase donation to support more.`);
                                          return;
                                        }

                                        setSelectedCauseIds([...selectedCauseIds, cause.id]);
                                        setSelectedCausesData([...selectedCausesData, cause]);
                                      }}
                                      style={styles.addCauseButton}
                                    >
                                      <Plus size={16} color="#ec4899" {...({ strokeWidth: 3 } as any)} />
                                    </TouchableOpacity>
                                  </TouchableOpacity>
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
                      {donationBoxQuery.isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
                          <ActivityIndicator size="large" color={PrimaryBlue} />
                        </View>
                      ) : (
                        <>
                          {/* Header */}
                          <View style={styles.step1Header}>
                            <Text style={styles.step1Title}>Set your monthly gift</Text>
                            <Text style={styles.step1Subtitle}>
                              Support multiple causes with one donation, split evenly. Change anytime.
                            </Text>
                          </View>

                          {/* Donation Box Card (Amount) */}
                          <View style={styles.amountCard}>
                            <View style={styles.monthlyImpactSection}>
                              <Text style={styles.monthlyImpactTitle}>Your Monthly Impact</Text>
                              <View style={styles.amountSelectorContainer}>
                                <TouchableOpacity
                                  onPress={() => {
                                    if (!isEditingAmount) setIsEditingAmount(true);
                                    if (editableAmount > 5) {
                                      setEditableAmount(prev => Math.max(5, prev - 5));
                                    }
                                  }}
                                  style={[
                                    styles.amountButton,
                                    editableAmount <= 5 && !isEditingAmount && styles.amountButtonDisabled
                                  ]}
                                >
                                  <Minus size={18} color={donationAmount > 5 ? "#ffffff" : "#9ca3af"} {...({ strokeWidth: 3 } as any)} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={openEditableAmountBottomSheet}
                                  style={styles.amountDisplay}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.amountValue}>${editableAmount}</Text>
                                  <Text style={styles.amountLabel}>per month</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => {
                                    if (!isEditingAmount) setIsEditingAmount(true);
                                    setEditableAmount(prev => prev + 5);
                                  }}
                                  style={styles.amountButton}
                                >
                                  <Plus size={20} color="white" />
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Save/Cancel Buttons */}
                            {isEditingAmount && (
                              <View style={styles.editActions}>
                                <TouchableOpacity
                                  onPress={handleCancelEdit}
                                  style={styles.cancelButton}
                                  disabled={updateAmountMutation.isPending}
                                >
                                  <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={handleSaveAmount}
                                  style={styles.saveButton}
                                  disabled={updateAmountMutation.isPending}
                                >
                                  {updateAmountMutation.isPending ? (
                                    <ActivityIndicator size="small" color="white" />
                                  ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                  )}
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>

                          {/* Your Selected Causes */}
                          <View style={styles.selectedCausesSection}>
                            <View style={styles.selectedCausesHeader}>
                              <View>
                                <Text style={styles.selectedCausesTitle}>Your Selected Causes</Text>
                                <Text style={styles.selectedCausesSubtitle}>Your Donation Box. Add or remove anytime.</Text>
                              </View>
                              <View style={styles.selectedCausesBadge}>
                                <Text style={styles.selectedCausesBadgeText}>
                                  {(donationBoxQuery.data?.box_causes || []).length}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.selectedCausesList}>
                              {(donationBoxQuery.data?.box_causes || []).length > 0 ? (
                                (donationBoxQuery.data?.box_causes || []).map((boxCause: any) => {
                                  const cause = boxCause.cause;
                                  if (!cause) return null;
                                  return (
                                    <TouchableOpacity
                                      key={cause.id}
                                      style={styles.causeItem}
                                      onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
                                    >
                                      <Avatar size={48} style={styles.causeAvatar}>
                                        <AvatarImage src={cause.image || cause.logo} />
                                        <AvatarFallback
                                          textStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                                          style={{ backgroundColor: PrimaryBlue }}
                                        >
                                          {cause.name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <View style={styles.causeInfo}>
                                        <Text style={styles.causeName} numberOfLines={1}>{cause.name}</Text>
                                        <Text style={styles.causeDescription} numberOfLines={1}>
                                          {cause.mission || cause.description || 'Making a positive impact'}
                                        </Text>
                                      </View>
                                      <View style={{ alignItems: 'flex-end', marginRight: 6 }}>
                                        {/* <Text style={{ fontWeight: '700', fontSize: 13, color: '#111827' }}>
                                          {(() => {
                                            const customPercentage = getCausePercentage(cause.id);
                                            return customPercentage != null
                                              ? `${Number(customPercentage).toFixed(1)}%`
                                              : distributionPercentage != null
                                                ? `${Number(distributionPercentage).toFixed(1)}%`
                                                : '0%';
                                          })()}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#6B7280' }}>
                                          ${getAmountPerItem(cause.id).toFixed(2)}/mo
                                        </Text> */}
                                      </View>
                                      <TouchableOpacity
                                        onPress={() => {
                                          setItemToDelete({ id: cause.id.toString(), name: cause.name, type: 'cause' });
                                          setShowDeleteModal(true);
                                        }}
                                        style={styles.removeCauseButton}
                                      >
                                        <Trash2 size={20} color="#EF4444" />
                                      </TouchableOpacity>
                                    </TouchableOpacity>
                                  );
                                })
                              ) : (
                                <Text style={{ textAlign: 'center', color: '#6B7280', padding: 16 }}>
                                  No causes in your box yet.
                                </Text>
                              )}
                            </View>
                          </View>

                          {/* Add More Causes */}
                          <View style={styles.addMoreSection}>
                            <Text style={styles.addMoreTitle}>Add More Causes</Text>

                            <View style={styles.searchBarContainer}>
                              <View style={styles.searchInputWrapper}>
                                <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                                <TextInput
                                  style={styles.searchInput}
                                  placeholder="Search for causes..."
                                  placeholderTextColor="#9CA3AF"
                                  value={searchQuery}
                                  onChangeText={setSearchQuery}
                                />
                              </View>
                            </View>

                            <TouchableOpacity
                              onPress={() => setShowRequestModal(true)}
                              style={styles.requestLinkContainer}
                            >
                              <Text style={styles.requestLink}>
                                Can't find your nonprofit? Request it here
                              </Text>
                            </TouchableOpacity>

                            <View style={styles.causesList}>
                              {causesLoading ? (
                                <ActivityIndicator size="small" color={PrimaryBlue} style={{ marginVertical: 20 }} />
                              ) : causesData?.results?.length > 0 ? (
                                causesData.results
                                  .filter((cause: any) => !(donationBoxQuery.data?.box_causes || []).some((bc: any) => bc.cause?.id === cause.id))
                                  .slice(0, 5)
                                  .map((cause: any) => (
                                    <TouchableOpacity
                                      key={cause.id}
                                      style={styles.causeItem}
                                      onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
                                    >
                                      <Avatar size={48} style={styles.causeAvatar}>
                                        <AvatarImage src={cause.image || cause.logo} />
                                        <AvatarFallback
                                          textStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                                          style={{ backgroundColor: PrimaryBlue }}
                                        >
                                          {cause.name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <View style={styles.causeInfo}>
                                        <Text style={styles.causeName} numberOfLines={1}>{cause.name}</Text>
                                        <Text style={styles.causeDescription} numberOfLines={1}>{cause.mission || 'Nonprofit'}</Text>
                                      </View>
                                      <TouchableOpacity
                                        onPress={() => {
                                          setAddingCauseId(cause.id);
                                          addCausesMutation.mutate(cause.id, {
                                            onSettled: () => setAddingCauseId(null)
                                          });
                                        }}
                                        disabled={addCausesMutation.isPending}
                                        style={styles.addCauseButton}
                                      >
                                        {addingCauseId === cause.id ? (
                                          <ActivityIndicator size="small" color="#db2777" />
                                        ) : (
                                          <Plus size={16} color="#db2777" {...({ strokeWidth: 3 } as any)} />
                                        )}
                                      </TouchableOpacity>
                                    </TouchableOpacity>
                                  ))
                              ) : searchQuery ? (
                                <Text style={styles.noCausesText}>No nonprofits found matching "{searchQuery}"</Text>
                              ) : null}
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  ) : null}
                </>
              </KeyboardAwareScrollView>

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
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Home' as never)}
                    style={styles.skipButton}
                  >
                    <Text style={styles.skipButtonText}>Skip for now</Text>
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
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Home' as never)}
                    style={styles.skipButton}
                  >
                    <Text style={styles.skipButtonText}>Skip for now</Text>
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
                  percentage: boxCause.percentage,
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
          showEditButton={step === 2}
          onEditCauses={() => {
            reviewBottomSheetRef.current?.close();
            setShowEditSplitSheet(true);
          }}
        />

        <BottomSheetModal
          ref={amountBottomSheetRef}
          snapPoints={['75%']}
          enablePanDownToClose
          enableDynamicSizing={false}
          backdropComponent={(props: any) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              opacity={0.5}
            />
          )}
          backgroundStyle={styles.amountSheetBackground}
          handleIndicatorStyle={styles.amountSheetHandleIndicator}
          onDismiss={() => {
            setAmountDraft(amountTarget === 'editableAmount' ? String(editableAmount) : String(donationAmount));
          }}
        >
          <BottomSheetView style={styles.amountSheetContainer}>
            <View style={styles.amountSheetHeader}>
              <View style={styles.amountSheetHeaderSpacer} />
              <Text style={styles.amountSheetTitle}>Set Amount</Text>
              <TouchableOpacity onPress={closeAmountBottomSheet} style={styles.amountSheetCloseButton} activeOpacity={0.7}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.amountSheetAmountContainer}>
              <Text style={styles.amountSheetAmount}>
                ${String(parseInt(amountDraft || '0', 10) || 0)}
              </Text>
              <Text style={styles.amountSheetSubtitle}>Monthly Donation</Text>
            </View>

            <View style={styles.amountSheetKeypad}>
              <View style={styles.amountSheetKeypadRow}>
                {['1', '2', '3'].map(d => (
                  <TouchableOpacity key={d} onPress={() => handleAmountDigitPress(d)} style={styles.amountSheetKey} activeOpacity={0.7}>
                    <Text style={styles.amountSheetKeyText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.amountSheetKeypadRow}>
                {['4', '5', '6'].map(d => (
                  <TouchableOpacity key={d} onPress={() => handleAmountDigitPress(d)} style={styles.amountSheetKey} activeOpacity={0.7}>
                    <Text style={styles.amountSheetKeyText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.amountSheetKeypadRow}>
                {['7', '8', '9'].map(d => (
                  <TouchableOpacity key={d} onPress={() => handleAmountDigitPress(d)} style={styles.amountSheetKey} activeOpacity={0.7}>
                    <Text style={styles.amountSheetKeyText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.amountSheetKeypadRow}>
                <View style={styles.amountSheetKeyPlaceholder} />
                <TouchableOpacity onPress={() => handleAmountDigitPress('0')} style={styles.amountSheetKey} activeOpacity={0.7}>
                  <Text style={styles.amountSheetKeyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAmountBackspace} style={styles.amountSheetKey} activeOpacity={0.7}>
                  <Text style={styles.amountSheetKeyText}>⌫</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleAmountSet} style={styles.amountSheetPrimaryButton} activeOpacity={0.8}>
              <Text style={styles.amountSheetPrimaryButtonText}>Set Amount</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeAmountBottomSheet} style={styles.amountSheetCancelButton} activeOpacity={0.7}>
              <Text style={styles.amountSheetCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheetModal>

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

        {/* Edit Donation Split Bottom Sheet */}
        {(() => {
          const boxCauses = donationBoxQuery.data?.box_causes || donationBox?.box_causes || [];
          console.log('=== DonationScreen: Preparing causes for Edit Split ===');
          console.log('boxCauses:', boxCauses);
          console.log('boxCauses.length:', boxCauses?.length);
          console.log('donationBoxQuery.data:', donationBoxQuery.data);
          console.log('donationBox:', donationBox);

          const causesForEditSplit = (boxCauses || [])
            .map((boxCause: any, index: number) => {
              console.log(`Processing boxCause ${index}:`, boxCause);
              // Handle both boxCause.cause and direct cause structure
              const cause = boxCause?.cause || boxCause;
              console.log(`Extracted cause ${index}:`, cause);
              return cause;
            })
            .filter((cause: any) => {
              const isValid = cause != null && cause.id != null;
              console.log('Filtering cause:', cause, 'isValid:', isValid);
              return isValid;
            })
            .map((cause: any) => {
              const mappedCause = {
                id: cause.id,
                name: cause.name || 'Unknown Cause',
                image: cause.image || cause.logo || '',
                logo: cause.logo || cause.image || '',
              };
              console.log('Mapped cause:', mappedCause);
              return mappedCause;
            });

          console.log('Final causesForEditSplit:', causesForEditSplit);
          console.log('causesForEditSplit.length:', causesForEditSplit.length);
          console.log('showEditSplitSheet:', showEditSplitSheet);
          console.log('monthlyAmount:', parseFloat((donationBoxQuery.data?.monthly_amount || donationBox?.monthly_amount || donationAmount).toString()));

          return (
            <EditDonationSplitBottomSheet
              isOpen={showEditSplitSheet}
              onClose={() => {
                console.log('Closing Edit Split sheet');
                setShowEditSplitSheet(false);
                setTimeout(() => {
                  reviewBottomSheetRef.current?.open();
                }, 100);
              }}
              causes={causesForEditSplit}
              monthlyAmount={parseFloat((donationBoxQuery.data?.monthly_amount || donationBox?.monthly_amount || donationAmount).toString())}
              boxCauses={boxCauses}
            />
          );
        })()}
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
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
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
    // fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  headerSpacer: {
    width: 32,
  },
  closeIcon: {
    fontSize: 20,
    color: '#374151',
    fontWeight: 'bold',
    fontFamily: 'Outfit-Bold',
  },
  minusIcon: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-Medium',
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
    // paddingBottom: 100, // Space for continue button
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
    fontFamily: 'Outfit-Bold',
  },
  step1Subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amountCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    fontFamily: 'Outfit-Bold',
  },
  amountCardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: 'Outfit-Regular',
  },
  amountSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 16
  },
  amountButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: PrimaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  monthlyImpactSection: {
    // marginBottom: 16,
  },
  monthlyImpactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Outfit-Bold',
  },
  amountDisplay: {
    alignItems: 'center',
    // marginHorizontal: 24,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: PrimaryBlue,
    fontFamily: 'Outfit-Bold',
  },
  amountLabel: {
    fontSize: 13,
    color: '#111827',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
  },
  amountSheetBackground: {
    backgroundColor: '#ffffff',
  },
  amountSheetHandleIndicator: {
    backgroundColor: '#d1d5db',
    width: 48,
  },
  amountSheetContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  amountSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  amountSheetHeaderSpacer: {
    width: 40,
  },
  amountSheetTitle: {
    fontSize: 18,
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  amountSheetCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSheetAmountContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  amountSheetAmount: {
    fontSize: 52,
    color: PrimaryBlue,
    fontFamily: 'Outfit-Bold',
  },
  amountSheetSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Outfit-Medium',
  },
  amountSheetKeypad: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  amountSheetKeypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 34,
    marginVertical: 10,
  },
  amountSheetKey: {
    width: 70,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSheetKeyText: {
    fontSize: 22,
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  amountSheetKeyPlaceholder: {
    width: 70,
    height: 56,
  },
  amountSheetPrimaryButton: {
    backgroundColor: PrimaryBlue,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginTop: 8,
  },
  amountSheetPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },
  amountSheetCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSheetCancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-SemiBold',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'Outfit-SemiBold',
  },
  orgDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Bold',
  },
  relatedSection: {
    marginTop: 24,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    fontFamily: 'Outfit-SemiBold',
  },
  selectedSection: {
    marginBottom: 24,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-SemiBold',
  },
  summaryCount: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  nextSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-SemiBold',
  },
  footer: {
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
  selectedCount: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-Medium',
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
    fontFamily: 'Outfit-Medium',
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
    fontFamily: 'Outfit-Bold',
  },
  capacityCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1600ff',
    fontFamily: 'Outfit-Medium',
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
    fontSize: 13,
    color: '#1600ff',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Bold',
  },
  selectedCausesSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-Bold',
  },
  selectedCauseDescription: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  removeCauseButton: {
    paddingVertical: 8,
  },
  addMoreSection: {
    marginBottom: 24,
  },
  addMoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-Regular',
  },
  requestLinkContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  requestLink: {
    fontSize: 13,
    color: '#1600ff',
    textDecorationLine: 'underline',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
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
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-Bold',
  },
  causeDescription: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Regular',
  },
  step2Content: {
    padding: 16,
    // paddingBottom: 100,
  },
  currentlySupportingSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  currentlySupportingHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentlySupportingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  currentlySupportingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-Bold',
  },
  causeDescriptionStep2: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Bold',
  },
  amountPerMonthStep2: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-Bold',
  },
  deleteModalDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    fontFamily: 'Outfit-Regular',
  },
  deleteModalBold: {
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-SemiBold',
  },
  deleteModalButtonDisabled: {
    opacity: 0.5,
  },
  editSplitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editSplitButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit-Medium',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    fontFamily: 'Outfit-Medium',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1600ff',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Outfit-Medium',
  },
  causeDesc: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  skipButton: {
    paddingBottom: 10,
    paddingTop: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
});
