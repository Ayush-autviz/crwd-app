import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, Trash2, Search, X } from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createOneTimeDonationMobile } from '../../services/api/donation';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { getCausesBySearch, getJoinCollective } from '../../services/api/crwd';
import { useAuthStore } from '../../store/store';
import { useStripe } from '@stripe/stripe-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import RequestNonprofitModal from '../newsearch/RequestNonprofitModal';

const { width, height } = Dimensions.get('window');

interface SelectedItem {
  id: string;
  type: 'cause' | 'collective';
  data: any;
}

interface OneTimeDonationProps {
  setCheckout: (checkout: boolean) => void;
  selectedOrganizations: string[];
  setSelectedOrganizations: (orgs: string[]) => void;
  preselectedItem?: {
    id: string;
    type: 'cause' | 'collective';
    data: any;
  };
  activeTab?: string;
  preselectedCauses?: number[];
  preselectedCausesData?: any[];
  preselectedCollectiveId?: number;
  show?: boolean;
}

export default function OneTimeDonation({
  setCheckout,
  selectedOrganizations,
  setSelectedOrganizations,
  preselectedItem,
  activeTab,
  preselectedCauses,
  preselectedCausesData,
  preselectedCollectiveId,
  show=true
}: OneTimeDonationProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [donationAmount, setDonationAmount] = useState(5);
  const [inputValue, setInputValue] = useState('5');
  const [preselectedItemAdded, setPreselectedItemAdded] = useState(false);
  const [preselectedCausesProcessed, setPreselectedCausesProcessed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { user: currentUser } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPresenting, setIsPresenting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);

  // Handle preselected item from navigation
  useEffect(() => {
    if (preselectedItem && !preselectedItemAdded && !preselectedCausesProcessed) {
      console.log('OneTimeDonation: Setting preselected item:', preselectedItem);
      setSelectedItems([preselectedItem]);
      setSelectedOrganizations([preselectedItem.id]);
      setPreselectedItemAdded(true);
    }
  }, [preselectedItem, setSelectedOrganizations, preselectedItemAdded, preselectedCausesProcessed]);

  // Handle preselected causes from collective (multiple causes)
  useEffect(() => {
    if (preselectedCauses && preselectedCauses.length > 0 && !preselectedCausesProcessed && !preselectedItemAdded) {
      console.log('OneTimeDonation: Setting preselected causes:', preselectedCauses, preselectedCausesData);
      
      // If we have the full cause data, use it directly
      if (preselectedCausesData && preselectedCausesData.length > 0) {
        const causesAsItems: SelectedItem[] = preselectedCausesData.map((cause: any) => ({
          id: cause.id.toString(),
          type: 'cause' as const,
          data: cause,
        }));
        
        setSelectedItems(causesAsItems);
        setSelectedOrganizations(causesAsItems.map(item => item.id));
        setPreselectedCausesProcessed(true);
      } else {
        // Fallback: create items from IDs only
        const causesAsItems: SelectedItem[] = preselectedCauses.map((causeId: number) => ({
          id: causeId.toString(),
          type: 'cause' as const,
          data: { id: causeId },
        }));
        
        setSelectedItems(causesAsItems);
        setSelectedOrganizations(causesAsItems.map(item => item.id));
        setPreselectedCausesProcessed(true);
      }
    }
  }, [preselectedCauses, preselectedCausesData, preselectedCausesProcessed, preselectedItemAdded, setSelectedOrganizations]);

  // Fetch causes with search - only when search is active
  const { data: causesData, isLoading: causesLoading } = useQuery({
    queryKey: ['causes', searchQuery],
    queryFn: () => getCausesBySearch(searchQuery || '', '', 1),
    enabled: showSearchResults && searchQuery.length > 0,
  });

  // Fetch default causes (no search query)
  const { data: defaultCausesData, isLoading: defaultCausesLoading } = useQuery({
    queryKey: ['defaultCauses'],
    queryFn: () => getCausesBySearch('', '', 1),
    enabled: !showSearchResults,
  });

  // One-time donation mutation
  const oneTimeDonationMutation = useMutation({
    mutationFn: createOneTimeDonationMobile,
    onSuccess: async (response) => {
      console.log('One-time donation response:', response);
      const clientSecret = response?.client_secret;
      if (!clientSecret) {
        Alert.alert('Error', 'Missing client secret from server response');
        return;
      }

      try {
        setIsPresenting(true);
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
          console.error('PaymentSheet init error:', init.error);
          Alert.alert('Error', init.error.message || 'Failed to initialize payment');
          return;
        }

        const present = await presentPaymentSheet();
        if (present.error) {
          if (present.error.code === 'Canceled') {
            // User canceled, don't show error
            return;
          }
          console.error('PaymentSheet present error:', present.error);
          Alert.alert('Payment Failed', present.error.message || 'Unable to complete payment');
          return;
        }

        // Payment succeeded
        setShowSuccessModal(true);
        // Fire confetti after modal appears
        setTimeout(() => {
          confettiRef.current?.start();
        }, 300);
        setSelectedItems([]);
        setSelectedOrganizations([]);
      } catch (err: any) {
        console.error('Stripe confirmation exception:', err);
        Alert.alert('Error', err?.message || 'Payment confirmation failed');
      } finally {
        setIsPresenting(false);
      }
    },
    onError: (error: any) => {
      console.error('One-time donation error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to process donation');
    },
  });

  // Calculate fees and capacity using the provided formula
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

  const incrementDonation = () => {
    const newAmount = donationAmount + 5;
    setDonationAmount(newAmount);
    setInputValue(newAmount.toString());
  };

  const decrementDonation = () => {
    if (donationAmount > 5) {
      const newAmount = donationAmount - 5;
      
      // Calculate max capacity for new amount
      const fees = calculateFees(newAmount);
      const net = fees.net;
      const newMaxCapacity = Math.floor(net / 0.20);
      const currentCapacity = selectedItems.length;
      
      // Check if new amount would reduce capacity below current causes
      if (currentCapacity > newMaxCapacity) {
        Alert.alert('Error', `You have ${currentCapacity} cause${currentCapacity !== 1 ? 's' : ''} selected. Please remove ${currentCapacity - newMaxCapacity} cause${currentCapacity - newMaxCapacity !== 1 ? 's' : ''} to lower the donation amount to $${newAmount}.`);
        return;
      }
      
      setDonationAmount(newAmount);
      setInputValue(newAmount.toString());
    }
  };

  const handleInputChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setInputValue(numericValue);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue) || 1;
    const finalValue = numValue < 5 ? 5 : numValue;
    
    // Only validate if the amount is being lowered
    if (finalValue < donationAmount) {
      // Calculate max capacity for new amount
      const fees = calculateFees(finalValue);
      const net = fees.net;
      const newMaxCapacity = Math.floor(net / 0.20);
      const currentCapacity = selectedItems.length;
      
      // Check if new amount would reduce capacity below current causes
      if (currentCapacity > newMaxCapacity) {
        Alert.alert('Error', `You have ${currentCapacity} cause${currentCapacity !== 1 ? 's' : ''} selected. Please remove ${currentCapacity - newMaxCapacity} cause${currentCapacity - newMaxCapacity !== 1 ? 's' : ''} to lower the donation amount to $${finalValue}.`);
        // Revert to current donation amount
        setInputValue(donationAmount.toString());
        return;
      }
    }
    
    setDonationAmount(finalValue);
    setInputValue(finalValue.toString());
  };

  const handleSelectItem = (item: SelectedItem) => {
    // Check if item is already selected to prevent duplicates
    const isAlreadySelected = selectedItems.some(selectedItem => 
      selectedItem.id === item.id && selectedItem.type === item.type
    );
    
    if (!isAlreadySelected) {
      // Calculate max capacity before adding
      const actualDonationAmount = parseFloat(donationAmount.toString());
      const fees = calculateFees(actualDonationAmount);
      const net = fees.net;
      const maxCapacity = Math.floor(net / 0.20);
      const currentCapacity = selectedItems.length;
      
      // Check if adding this item would exceed capacity
      if (currentCapacity >= maxCapacity) {
        Alert.alert('Error', `You can only add up to ${maxCapacity} cause${maxCapacity !== 1 ? 's' : ''} for $${donationAmount}. Increase your donation amount to support more causes.`);
        return;
      }
      
      setSelectedItems((prev: SelectedItem[]) => [...prev, item]);
      // Also update the legacy selectedOrganizations for backward compatibility
      setSelectedOrganizations([...selectedOrganizations, item.id]);
      // Clear search after selection
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev: SelectedItem[]) => prev.filter(item => `${item.type}-${item.id}` !== id));
    // Also update the legacy selectedOrganizations for backward compatibility
    setSelectedOrganizations(selectedOrganizations.filter((orgId: string) => orgId !== id.split('-')[1]));
  };

  const handleClearAllItems = () => {
    console.log('handleClearAllItems called');
    setSelectedItems([]);
    setSelectedOrganizations([]);
  };

  // Generate merchant display name from selected items (Apple guideline requirement)
  const getMerchantDisplayName = (): string => {
    if (selectedItems.length === 0) {
      return 'CRWD';
    }
    
    if (selectedItems.length === 1) {
      // Single organization: show its name
      return selectedItems[0].data?.name || 'CRWD';
    }
    
    // Multiple organizations: show them in a readable format
    // Apple Pay has display limits, so we'll show up to 2-3 names or use a summary
    const names = selectedItems
      .map(item => item.data?.name)
      .filter(Boolean)
      .slice(0, 3); // Limit to first 3 to avoid truncation
    
    if (names.length === 0) {
      return 'CRWD';
    }
    
    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }
    
    if (names.length === 3 && selectedItems.length === 3) {
      return `${names[0]}, ${names[1]} & ${names[2]}`;
    }
    
    // More than 3 selected, show first 2 and count
    const remainingCount = selectedItems.length - 2;
    return `${names[0]} & ${names[1]} +${remainingCount} more`;
  };

  const handleCheckout = () => {
    // Prepare request body according to API specification
    // Format: { amount: string, causes: [{ cause_id: number, attributed_collective?: number }] }
    const causes: Array<{ cause_id: number; attributed_collective?: number }> = [];

    // Process selected items and build causes array
    selectedItems.forEach(item => {
      if (item.type === 'cause') {
        const causeId = parseInt(item.id);
        const causeEntry: { cause_id: number; attributed_collective?: number } = {
          cause_id: causeId,
        };
        
        // Only include attributed_collective if preselectedCollectiveId exists, is not 0, and cause_id is not 0
        if (preselectedCollectiveId && preselectedCollectiveId > 0 && causeId > 0) {
          causeEntry.attributed_collective = preselectedCollectiveId;
        }
        
        causes.push(causeEntry);
      }
      // Note: For one-time donations, we're only handling causes, not collectives directly
    });

    // Build request body
    const requestBody: {
      amount: string;
      causes: Array<{ cause_id: number; attributed_collective?: number }>;
    } = {
      amount: donationAmount.toString(),
      causes: causes.length > 0 ? causes : [{ cause_id: 0 }], // Fallback if no causes selected (no attributed_collective for fallback)
    };

    console.log('Sending one-time donation request:', requestBody);
    oneTimeDonationMutation.mutate(requestBody);
  };

  // Calculate capacity for display
  const actualDonationAmount = parseFloat(donationAmount.toString());
  const fees = calculateFees(actualDonationAmount);
  const net = fees.net;
  const maxCapacity = Math.floor(net / 0.20);
  const currentCapacity = selectedItems.length;
  const capacityPercentage = maxCapacity > 0 ? Math.min(100, (currentCapacity / maxCapacity) * 100) : 0;

  // Avatar colors for consistent coloring
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

  // Get causes list (search results or default)
  const causes = showSearchResults ? (causesData?.results || []) : (defaultCausesData?.results || []);
  
  // Filter out already selected items
  const filteredCauses = causes.filter((cause: any) => 
    !selectedItems.some(item => item.id === cause.id.toString() && item.type === 'cause')
  ).slice(0, 20); // Show up to 20 causes

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  return (
    <View style={styles.containerWrapper}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Set your one-time gift</Text>
          <Text style={styles.headerSubtitle}>Support multiple causes with one donation, split evenly. Change anytime.</Text>
        </View>

        {/* Donation Box Card */}
        <View style={styles.donationBoxCard}>
          {/* Your One-Time Impact Section */}
          <View style={styles.impactSection}>
            <Text style={styles.impactTitle}>Your One-Time Impact</Text>
            
            {/* Amount Selector */}
            <View style={styles.amountSelectorContainer}>
              <TouchableOpacity
                onPress={decrementDonation}
                disabled={donationAmount <= 5}
                style={[styles.amountButton, donationAmount <= 5 && styles.amountButtonDisabled]}
              >
                <Minus size={18} color={donationAmount > 5 ? "#ffffff" : "#9ca3af"} strokeWidth={3} />
              </TouchableOpacity>
              <View style={styles.amountDisplay}>
                <Text style={styles.amountValue}>${donationAmount}</Text>
                <Text style={styles.amountLabel}>per donation</Text>
              </View>
              <TouchableOpacity
                onPress={incrementDonation}
                style={styles.amountButton}
              >
                <Plus size={18} color="#ffffff" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Donation Box Capacity Section */}
          <View style={styles.capacityCard}>
            <View style={styles.capacityHeader}>
              <Text style={styles.capacityTitle}>Donation Box Capacity</Text>
              <Text style={styles.capacityCount}>{currentCapacity}/{maxCapacity} causes</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${capacityPercentage}%` }]} />
              </View>
            </View>
            <Text style={styles.capacityText}>
              For every ${donationAmount}, you can support {maxCapacity} cause{maxCapacity !== 1 ? 's' : ''}.
            </Text>
          </View>
        </View>

        {/* Your Selected Causes */}
        {selectedItems.filter(item => item.type === 'cause').length > 0 && (
          <View style={styles.selectedCausesSection}>
            <View style={styles.selectedCausesHeader}>
              <View>
                <Text style={styles.selectedCausesTitle}>Your Selected Causes</Text>
                <Text style={styles.selectedCausesSubtitle}>Your One-Time Donation. Add or remove anytime.</Text>
              </View>
              <View style={styles.selectedCausesBadge}>
                <Text style={styles.selectedCausesBadgeText}>{selectedItems.filter(item => item.type === 'cause').length}</Text>
              </View>
            </View>
            
            <View style={styles.selectedCausesList}>
              {selectedItems
                .filter(item => item.type === 'cause')
                .map((item) => {
                  const cause = item.data;
                  const causeId = typeof cause.id === 'number' ? cause.id : parseInt(cause.id) || cause.id;
                  const avatarBgColor = getConsistentColor(causeId, avatarColors);
                  const initials = getInitials(cause.name || '');
                  return (
                    <View key={item.id} style={styles.selectedCauseItem}>
                      <Avatar size={48} style={{ borderRadius: 8, overflow: 'hidden', marginRight:  4 }}>
                        <AvatarImage src={cause.image || cause.logo} />
                        <AvatarFallback
                          style={{ backgroundColor: avatarBgColor }}
                          textStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <View style={styles.selectedCauseInfo}>
                        <Text style={styles.selectedCauseName}>{cause.name}</Text>
                        {!!(cause.mission || cause.description) && (
                          <Text style={styles.selectedCauseDescription} numberOfLines={1}>
                            {cause.mission || cause.description || 'No description available'}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveItem(`${item.type}-${item.id}`)}
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

          {/* Search Section */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchInputWrapper}>
              <Search size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                placeholder="Search for causes..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim()) {
                    setShowSearchResults(true);
                  } else {
                    setShowSearchResults(false);
                  }
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                style={styles.searchInput}
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  style={styles.clearButton}
                >
                  <X size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowRequestModal(true)}
            style={styles.requestLinkContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.requestLink}>Can't find your nonprofit? Request it here</Text>
          </TouchableOpacity>

          {/* Causes List */}
          <View style={styles.causesList}>
            {showSearchResults ? (
              causesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={PrimaryBlue} />
                  <Text style={styles.loadingText}>Loading causes...</Text>
                </View>
              ) : filteredCauses.length > 0 ? (
                filteredCauses.map((cause: any) => {
                  const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                  const initials = getInitials(cause.name || '');
                  return (
                    <TouchableOpacity
                      key={cause.id}
                      style={styles.causeItem}
                      onPress={() => handleSelectItem({ id: String(cause.id), type: 'cause', data: cause })}
                    >
                      <Avatar size={48} style={[styles.causeAvatar, { borderRadius: 8 }]}>
                        <AvatarImage src={cause.image || cause.logo} />
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
                          {cause.description || cause.mission || 'Supporting this nonprofit\'s mission'}
                        </Text>
                      </View>
                      <View style={styles.addCauseButton}>
                        <Plus size={16} color="#ec4899" strokeWidth={3} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={styles.noCausesText}>No causes found</Text>
                </View>
              )
            ) : (
              defaultCausesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={PrimaryBlue} />
                  <Text style={styles.loadingText}>Loading causes...</Text>
                </View>
              ) : filteredCauses.length > 0 ? (
                filteredCauses.map((cause: any) => {
                  const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                  const initials = getInitials(cause.name || '');
                  return (
                    <TouchableOpacity
                      key={cause.id}
                      style={styles.causeItem}
                      onPress={() => handleSelectItem({ id: String(cause.id), type: 'cause', data: cause })}
                    >
                      <Avatar size={48} style={[styles.causeAvatar, { borderRadius: 8 }]}>
                        <AvatarImage src={cause.image || cause.logo} />
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
                          {cause.description || cause.mission || 'Supporting this nonprofit\'s mission'}
                        </Text>
                      </View>
                      <View style={styles.addCauseButton}>
                        <Plus size={16} color="#ec4899" strokeWidth={3} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={styles.noCausesText}>No causes available</Text>
                </View>
              )
            )}
          </View>
        </View>
        </ScrollView>
      
      {/* Checkout Button Footer - Always visible at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={oneTimeDonationMutation.isPending || isPresenting || selectedItems.length === 0}
          style={[
            styles.checkoutButton,
            (oneTimeDonationMutation.isPending || isPresenting || selectedItems.length === 0) && styles.checkoutButtonDisabled
          ]}
        >
          {(oneTimeDonationMutation.isPending || isPresenting) ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Continue to Review</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal with Confetti */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuccessModal(false)}>
          <View style={styles.modalOverlay}>
            {/* Confetti */}
            <View style={styles.confettiContainer}>
              <ConfettiCannon
                ref={confettiRef}
                count={200}
                origin={{ x: width / 2, y: 0 }}
                autoStart={false}
                colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']}
                fadeOut
              />
            </View>
            
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
                
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>Donation Successful! 🎉</Text>
                  <Text style={styles.modalDescription}>
                    Here's your donation summary:
                  </Text>

                  {/* Donation Summary Card */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryCardContent}>
                      <View style={styles.summaryIcon}>
                        <Text style={styles.heartEmoji}>💝</Text>
                      </View>
                      <View style={styles.summaryTextContainer}>
                        <Text style={styles.summaryCardTitle}>One-Time Donation</Text>
                        <Text style={styles.summaryCardAmount}>${donationAmount.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* <Text style={styles.supportingText}>
                    Supporting {selectedItems.length} {selectedItems.length === 1 ? 'organization' : 'organizations'} with your one-time donation.
                  </Text> */}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Request Nonprofit Modal */}
      <RequestNonprofitModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectedSection: {
    marginBottom: 24,
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
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
    marginBottom: 2,
  },
  selectedItemDescription: {
    color: '#6b7280',
    fontSize: 14,
  },
  removeIconButton: {
    padding: 8,
  },
  trashIcon: {
    fontSize: 16,
    color: '#ef4444',
  },
  emptyStateCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  headerSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PrimaryBlue,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  donationBoxCard: {
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
  impactSection: {
    marginBottom: 16,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  amountSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  amountDisplay: {
    alignItems: 'center',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: PrimaryBlue,
  },
  amountLabel: {
    fontSize: 12,
    color: '#111827',
    marginTop: 4,
  },
  capacityCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PrimaryBlue,
  },
  capacityCount: {
    fontSize: 12,
    fontWeight: '500',
    color: PrimaryBlue,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PrimaryBlue,
    borderRadius: 4,
  },
  capacityText: {
    fontSize: 12,
    color: PrimaryBlue,
  },
  selectedCausesSection: {
    marginBottom: 16,
  },
  selectedCausesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedCausesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  selectedCausesSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedCausesBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PrimaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCausesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectedCausesList: {
    gap: 8,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectedCauseInfo: {
    flex: 1,
  },
  selectedCauseName: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  addMoreTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  requestLinkContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  requestLink: {
    fontSize: 14,
    color: PrimaryBlue,
    textDecorationLine: 'underline',
  },
  causesList: {
    gap: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  causeAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  causeInfo: {
    flex: 1,
  },
  causeName: {
    fontSize: 16,
    fontWeight: '700',
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
    borderRadius: 8,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCausesText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    // paddingBottom: 30,
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
  checkoutButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
  },
  tabButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    marginBottom: 8,
  },
  listContainer: {
    // marginBottom: 16,
    gap: 8,
  },
  organizationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  modalBody: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heartEmoji: {
    fontSize: 20,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  summaryCardAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  supportingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
});
