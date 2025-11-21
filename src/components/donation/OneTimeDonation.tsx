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
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createOneTimeDonationMobile } from '../../services/api/donation';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { getCausesBySearch, getJoinCollective } from '../../services/api/crwd';
import { useAuthStore } from '../../store/store';
import { useStripe } from '@stripe/stripe-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

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
  show?: boolean;
}

export default function OneTimeDonation({
  setCheckout,
  selectedOrganizations,
  setSelectedOrganizations,
  preselectedItem,
  activeTab,
  show=true
}: OneTimeDonationProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [donationAmount, setDonationAmount] = useState(7);
  const [inputValue, setInputValue] = useState('7');
  const [preselectedItemAdded, setPreselectedItemAdded] = useState(false);
  const [activeTabState, setActiveTabState] = useState<'nonprofits' | 'collectives'>(
    (activeTab === 'collectives' ? 'collectives' : 'nonprofits') as 'nonprofits' | 'collectives'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPresenting, setIsPresenting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);

  // Handle preselected item from navigation
  useEffect(() => {
    if (preselectedItem && !preselectedItemAdded) {
      console.log('OneTimeDonation: Setting preselected item:', preselectedItem);
      setSelectedItems([preselectedItem]);
      setSelectedOrganizations([preselectedItem.id]);
      setPreselectedItemAdded(true);
    }
  }, [preselectedItem, setSelectedOrganizations, preselectedItemAdded]);

  // Fetch nonprofits (causes)
  const { data: causesData, isLoading: causesLoading } = useQuery({
    queryKey: ['causes', searchQuery],
    queryFn: () => getCausesBySearch(searchQuery, '', 1),
  });

  // Fetch joined collectives
  const { data: joinedCollectivesData, isLoading: collectivesLoading } = useQuery({
    queryKey: ['joined-collectives', currentUser?.id],
    queryFn: () => getJoinCollective(currentUser?.id?.toString() || ''),
    enabled: !!currentUser?.id,
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

  const incrementDonation = () => {
    const newAmount = donationAmount + 1;
    setDonationAmount(newAmount);
    setInputValue(newAmount.toString());
  };

  const decrementDonation = () => {
    if (donationAmount > 5) {
      const newAmount = donationAmount - 1;
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
    setDonationAmount(finalValue);
    setInputValue(finalValue.toString());
  };

  const handleSelectItem = (item: SelectedItem) => {
    // Check if item is already selected to prevent duplicates
    const isAlreadySelected = selectedItems.some(selectedItem => 
      selectedItem.id === item.id && selectedItem.type === item.type
    );
    
    if (!isAlreadySelected) {
      setSelectedItems((prev: SelectedItem[]) => [...prev, item]);
      // Also update the legacy selectedOrganizations for backward compatibility
      setSelectedOrganizations([...selectedOrganizations, item.id]);
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
    const causeIds: number[] = [];
    let collectiveId: number[] = [];

    // Separate causes and collectives from selected items
    selectedItems.forEach(item => {
      if (item.type === 'cause') {
        causeIds.push(parseInt(item.id));
      } else if (item.type === 'collective') {
        collectiveId.push(parseInt(item.id));
      }
    });

    // Build request body - only include the relevant field based on what's selected
    let requestBody: any = {
      amount: donationAmount.toString(),
    };

    if (causeIds.length > 0) {
      // If causes are selected, send cause_ids
      requestBody.cause_ids = causeIds;
    } else if (collectiveId.length > 0) {
      // If a collective is selected, send collective_id
      requestBody.collective_ids = collectiveId;
    } else {
      // Fallback if nothing is selected (shouldn't happen due to button disabled state)
      Alert.alert('Error', 'Please select at least one organization');
      return;
    }

    console.log('Sending one-time donation request:', requestBody);
    oneTimeDonationMutation.mutate(requestBody);
  };

  return (
    <View style={styles.containerWrapper}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <View style={styles.selectedSection}>
          {/* Separate nonprofits and collectives */}
          {selectedItems.filter(item => item.type === 'cause').length > 0 && (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedCardTitle}>Nonprofits</Text>
              {selectedItems.filter(item => item.type === 'cause').map((item) => (
                <View key={`${item.type}-${item.id}`} style={styles.selectedItemRow}>
                  <View style={[styles.orgAvatar, { backgroundColor: '#dbeafe', marginRight: 12 }]}>
                    <Text style={[styles.orgAvatarText, { color: '#2563eb' }]}>
                      {item.data?.name?.charAt(0)?.toUpperCase() || 'N'}
                    </Text>
                  </View>
                  <View style={styles.selectedItemInfo}>
                    <Text numberOfLines={1} style={styles.selectedItemName}>{item.data?.name || 'Unknown'}</Text>
                    {!!item.data?.description && (
                      <Text style={styles.selectedItemDescription} numberOfLines={1}>
                        {item.data.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(`${item.type}-${item.id}`)}
                    style={styles.removeIconButton}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {selectedItems.filter(item => item.type === 'collective').length > 0 && (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedCardTitle}>Collectives</Text>
              {selectedItems.filter(item => item.type === 'collective').map((item) => (
                <View key={`${item.type}-${item.id}`} style={styles.selectedItemRow}>
                  <View style={[styles.orgAvatar, { backgroundColor: '#dcfce7', marginRight: 12 }]}>
                    <Text style={[styles.orgAvatarText, { color: '#16a34a' }]}>
                      {item.data?.name?.charAt(0)?.toUpperCase() || 'C'}
                    </Text>
                  </View>
                  <View style={styles.selectedItemInfo}>
                    <Text numberOfLines={1} style={styles.selectedItemName}>{item.data?.name || 'Unknown'}</Text>
                    {!!item.data?.description && (
                      <Text style={styles.selectedItemDescription} numberOfLines={1}>
                        {item.data.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(`${item.type}-${item.id}`)}
                    style={styles.removeIconButton}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {selectedItems.length === 0 && (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>No organizations selected</Text>
          <Text style={styles.emptyStateSubtext}>Search and select causes or collectives below</Text>
        </View>
      )}

      {/* Donation Amount Section */}
      <View style={styles.amountSection}>
        <Text style={styles.amountTitle}>Enter donation amount</Text>

        <View style={styles.amountSelector}>
          <TouchableOpacity
            onPress={decrementDonation}
            style={styles.amountButton}
          >
            <Minus size={18} color="#374151" />
          </TouchableOpacity>

          <View style={styles.amountInput}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              value={inputValue}
              onChangeText={handleInputChange}
              onBlur={handleInputBlur}
              style={styles.amountText}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            onPress={incrementDonation}
            style={styles.amountButton}
          >
            <Plus size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        <Text style={styles.amountHint}>
          Input amount over $5
        </Text>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalAmount}>${donationAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTabState('nonprofits')}
          style={[styles.tabButton, activeTabState === 'nonprofits' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTabState === 'nonprofits' && styles.tabButtonTextActive]}>Nonprofits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTabState('collectives')}
          style={[styles.tabButton, activeTabState === 'collectives' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTabState === 'collectives' && styles.tabButtonTextActive]}>Collectives</Text>
        </TouchableOpacity>
      </View>

      {/* Search for nonprofits */}
      {activeTabState === 'nonprofits' && (
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search nonprofits..."
            placeholderTextColor={PrimaryGrey}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      )}

      {/* List for active tab */}
      {activeTabState === 'nonprofits' ? (
        <View style={styles.listContainer}>
          {causesLoading ? (
            <ActivityIndicator />
          ) : (causesData?.results || []).slice(0, 10).map((cause: any) => {
            const isSelected = selectedItems.some(i => i.type === 'cause' && i.id === String(cause.id));
            return (
              <TouchableOpacity
                key={cause.id}
                style={[styles.organizationItem, isSelected && styles.selectedOrganizationItem]}
                onPress={() => handleSelectItem({ id: String(cause.id), type: 'cause', data: { name: cause.name, image: '', description: cause.mission } })}
              >
                <View style={[styles.orgAvatar, { backgroundColor: '#dbeafe' }]}>
                  <Text style={[styles.orgAvatarText, { color: '#2563eb' }]}>{cause.name?.charAt(0)?.toUpperCase() || 'N'}</Text>
                </View>
                <View style={styles.orgInfo}>
                  <Text style={styles.orgName}>{cause.name}</Text>
                  {!!cause.mission && <Text style={styles.orgDescription} numberOfLines={1}>{cause.mission}</Text>}
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {collectivesLoading ? (
            <ActivityIndicator />
          ) : (joinedCollectivesData?.data || []).map((item: any) => {
            const collective = item.collective;
            const isSelected = selectedItems.some(i => i.type === 'collective' && i.id === String(collective.id));
            return (
              <TouchableOpacity
                key={collective.id}
                style={[styles.organizationItem, isSelected && styles.selectedOrganizationItem]}
                onPress={() => handleSelectItem({ id: String(collective.id), type: 'collective', data: { name: collective.name, created_by: { profile_picture: '' }, member_count: collective.member_count, description: collective.description } })}
              >
                <View style={[styles.orgAvatar, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.orgAvatarText, { color: '#16a34a' }]}>{collective.name?.charAt(0)?.toUpperCase() || 'C'}</Text>
                </View>
                <View style={styles.orgInfo}>
                  <Text style={styles.orgName}>{collective.name}</Text>
                  {!!collective.description && <Text style={styles.orgDescription} numberOfLines={1}>{collective.description}</Text>}
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
            <Text style={styles.checkoutButtonText}>Checkout</Text>
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
  amountSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  amountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  amountSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 8,
  },
  amountButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  amountInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    width: 80,
  },
  amountHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
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
