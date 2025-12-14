import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Plus, Trash2, Search, X, ChevronLeft, ChevronDown, FileText, Pencil } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView as RNSafeAreaView, SafeAreaView } from 'react-native-safe-area-context';
import { Organization } from '../../Constants/organizations';
import { PrimaryBlue, PrimaryGrey, LightGrey, SecondaryGrey } from '../../Constants/Colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCausesBySearch, getJoinCollective, getCollectiveById } from '../../services/api/crwd';
import { getDonationBox, updateDonationBox, cancelDonationBox } from '../../services/api/donation';
import { useAuthStore } from '../../store/store';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { getDonationHistory } from '../../services/api/donation';
import { getNonprofitColor } from '../../lib/getNonprofitColor';
import DonationBoxSummaryCard from './DonationBoxSummaryCard';

export default function ManageDonationBoxScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  
  // Fetch donation box data
  const donationBoxQuery = useQuery({
    queryKey: ['donationBox'],
    queryFn: getDonationBox,
  });

  const donationBox = donationBoxQuery.data;
  const amount = donationBox?.monthly_amount || 7;
  
  // Get box_causes from donation box API (main source)
  const boxCauses = donationBox?.box_causes || [];
  // Extract cause objects from box_causes
  const causesFromBox = boxCauses.map((boxCause: any) => boxCause.cause).filter((cause: any) => cause != null);

  // Also get manual_causes for backward compatibility
  const manualCauses = donationBox?.manual_causes || [];
  const attributingCollectives = donationBox?.attributing_collectives || [];
  
  // Prepare causes from donation box data - use box_causes as primary source
  const causes: Organization[] = [
    ...causesFromBox.map((cause: any) => ({
      id: `cause-${cause.id}`,
      name: cause.name,
      imageUrl: cause.image || cause.logo || '',
      color: '#4F46E5',
      description: cause.mission || cause.description || '',
      type: 'cause' as const,
    })),
    // Also include manual_causes if not already in box_causes (for backward compatibility)
    ...manualCauses
      .filter((manualCause: any) => !causesFromBox.some((c: any) => c.id === manualCause.id))
      .map((cause: any) => ({
        id: `cause-${cause.id}`,
        name: cause.name,
        imageUrl: cause.logo || '',
        color: '#4F46E5',
        description: cause.mission || cause.description || '',
        type: 'cause' as const,
      })),
    ...(attributingCollectives || []).map((collective: any) => ({
      id: `collective-${collective.id}`,
      name: collective.name,
      imageUrl: collective.cover_image || '',
      color: '#9333EA',
      description: collective.description || '',
      type: 'collective' as const,
    })),
  ];

  const handleBack = async () => {
    await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
    navigation.goBack();
  };

  const [activeTab, setActiveTab] = useState<'nonprofits' | 'collectives'>('nonprofits');
  const [editableAmount, setEditableAmount] = useState(7);

  // Update editableAmount when donation box data loads
  useEffect(() => {
    if (donationBox?.monthly_amount) {
      setEditableAmount(Math.round(donationBox.monthly_amount));
    }
  }, [donationBox?.monthly_amount]);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [temporarilyRemovedCauses, setTemporarilyRemovedCauses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCauses, setSelectedCauses] = useState<number[]>([]);
  const [selectedCollectives, setSelectedCollectives] = useState<number[]>([]);
  const [selectedCausesData, setSelectedCausesData] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ 
    id: number; 
    name: string; 
    type: 'cause' | 'collective'; 
    isNewlySelected: boolean 
  } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [expandedCollectives, setExpandedCollectives] = useState<Set<number>>(new Set());
  const [collectiveDetails, setCollectiveDetails] = useState<Record<number, any>>({});
  const [loadingCollectives, setLoadingCollectives] = useState<Set<number>>(new Set());
  
  // Get isActive from donationBox
  const isActive = donationBox?.is_active ?? true;

  // Format next charge date
  const formatNextChargeDate = (dateString?: string) => {
    if (!dateString) return 'December 26, 2024'; // Fallback
    
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'December 26, 2024'; // Fallback
    }
  };

  // Get day of month from next charge date
  const getChargeDay = (dateString?: string) => {
    if (!dateString) return '26th'; // Fallback
    
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      // Add ordinal suffix
      if (day > 3 && day < 21) return `${day}th`;
      switch (day % 10) {
        case 1: return `${day}st`;
        case 2: return `${day}nd`;
        case 3: return `${day}rd`;
        default: return `${day}th`;
      }
    } catch (error) {
      console.error('Error getting charge day:', error);
      return '26th'; // Fallback
    }
  };

  // Separate existing causes/collectives from new selections
  // Note: Organization type doesn't have 'type' property, so we'll treat all as causes by default
  // In a real implementation, you might need to extend the Organization interface
  const existingCauses = causes.filter(c => !(c as any).type || (c as any).type === 'cause');
  const existingCollectives = causes.filter(c => (c as any).type === 'collective');

  // Fetch causes - show 5 by default, or search results if searching
  const { data: causesData, isLoading: causesLoading } = useQuery({
    queryKey: ['causes-manage', searchQuery, currentUser?.id],
    queryFn: () => getCausesBySearch(searchQuery || '', '', 1),
    enabled: activeTab === 'nonprofits',
  });

  // Fetch joined collectives
  const { data: joinedCollectivesData, isLoading: joinedCollectivesLoading } = useQuery({
    queryKey: ['joined-collectives-manage'],
    queryFn: () => getJoinCollective(currentUser?.id || ''),
    enabled: activeTab === 'collectives',
  });

  // Mutation to update donation box (all-in-one update)
  const updateDonationBoxMutation = useMutation({
    mutationFn: (data: any) => updateDonationBox(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      handleBack();
    },
    onError: (error: any) => {
      console.error('Error updating donation box:', error);
    },
  });

  // Mutation to cancel/deactivate donation box
  const cancelDonationBoxMutation = useMutation({
    mutationFn: () => cancelDonationBox(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      setShowCancelModal(false);
      handleBack();
    },
    onError: (error: any) => {
      console.error('Error canceling donation box:', error);
    },
  });

  const incrementAmount = () => {
    setEditableAmount(prev => Math.round(prev) + 1);
  };

  const decrementAmount = () => {
    if (editableAmount > 1) {
      setEditableAmount(prev => Math.max(1, Math.round(prev) - 1));
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      setEditableAmount(0);
    } else {
      const parsed = parseInt(numericValue, 10);
      setEditableAmount(isNaN(parsed) ? 0 : parsed);
    }
  };

  const handleRemove = (id: string) => {
    setTemporarilyRemovedCauses(prev => [...prev, id]);
  };

  const handleDeselectCause = (causeId: number, isNewlySelected: boolean, causeName: string) => {
    setItemToDelete({ id: causeId, name: causeName, type: 'cause', isNewlySelected });
    setShowDeleteModal(true);
  };

  const handleDeselectCollective = (collectiveId: number, isNewlySelected: boolean, collectiveName: string) => {
    setItemToDelete({ id: collectiveId, name: collectiveName, type: 'collective', isNewlySelected });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'cause') {
      if (itemToDelete.isNewlySelected) {
        setSelectedCauses(prev => prev.filter(id => id !== itemToDelete.id));
        setSelectedCausesData(prev => prev.filter(c => c.id !== itemToDelete.id));
      } else {
        handleRemove(`cause-${itemToDelete.id}`);
      }
    } else {
      if (itemToDelete.isNewlySelected) {
        setSelectedCollectives(prev => prev.filter(id => id !== itemToDelete.id));
      } else {
        handleRemove(`collective-${itemToDelete.id}`);
      }
    }

    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleToggleCause = (causeId: number) => {
    if (selectedCauses.includes(causeId)) {
      setSelectedCauses(prev => prev.filter(id => id !== causeId));
      setSelectedCausesData(prev => prev.filter(c => c.id !== causeId));
    } else {
      const causeData = causesData?.results?.find((c: any) => c.id === causeId);
      if (causeData) {
        setSelectedCauses(prev => [...prev, causeId]);
        setSelectedCausesData(prev => [...prev, causeData]);
      }
    }
  };

  const handleToggleCollective = (collectiveId: number) => {
    setSelectedCollectives(prev => 
      prev.includes(collectiveId) 
        ? prev.filter(id => id !== collectiveId)
        : [...prev, collectiveId]
    );
  };

  const handleToggleCollectiveDropdown = async (collectiveId: number) => {
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

  const handleUpdateDonation = async () => {
    try {
      // Get existing cause IDs that are NOT removed
      const remainingExistingCauseIds = existingCauses
        .filter(c => !temporarilyRemovedCauses.includes(c.id))
        .map(c => {
          const id = c.id.replace('cause-', '');
          return parseInt(id);
        })
        .filter(id => !isNaN(id));

      // Get existing collective IDs that are NOT removed
      const remainingExistingCollectiveIds = existingCollectives
        .filter(c => !temporarilyRemovedCauses.includes(c.id))
        .map(c => {
          const id = c.id.replace('collective-', '');
          return parseInt(id);
        })
        .filter(id => !isNaN(id));

      // Combine existing (not removed) + newly selected causes/collectives
      const allCauseIds = [...remainingExistingCauseIds, ...selectedCauses];
      const allCollectiveIds = [...remainingExistingCollectiveIds, ...selectedCollectives];

      // Prepare payload with amount and all causes/collectives
      const payload: any = {
        monthly_amount: Math.round(editableAmount),
      };

      if (allCauseIds.length > 0) {
        payload.cause_ids = allCauseIds;
      }

      if (allCollectiveIds.length > 0) {
        payload.collective_ids = allCollectiveIds;
      }

      // Send single update call with all data
      await updateDonationBoxMutation.mutateAsync(payload);

      // Clear temporarily removed causes after successful update
      setTemporarilyRemovedCauses([]);
      setSelectedCauses([]);
      setSelectedCollectives([]);
      setSelectedCausesData([]);

      // Refresh and go back
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      handleBack();
    } catch (error) {
      console.error('Error updating donation box:', error);
      // You might want to show an error toast here
    }
  };

  // Filter out temporarily removed causes for display
  const visibleCauses = causes.filter(
    (cause) => !temporarilyRemovedCauses.includes(cause.id)
  );

  // Get existing cause IDs to filter them out from search results
  const existingCauseIds = existingCauses
    .map(c => {
      const id = c.id.replace('cause-', '');
      return parseInt(id);
    })
    .filter(id => !isNaN(id));

  const existingCollectiveIds = existingCollectives
    .map(c => {
      const id = c.id.replace('collective-', '');
      return parseInt(id);
    })
    .filter(id => !isNaN(id));

  const allSelectedCauseIds = [...existingCauseIds, ...selectedCauses];
  const allSelectedCollectiveIds = [...existingCollectiveIds, ...selectedCollectives];

  // Create combined selected causes list for display
  const getSelectedCausesForDisplay = () => {
    const existingList = existingCauses.filter(c => !temporarilyRemovedCauses.includes(c.id));
    const newlySelectedCauses = selectedCausesData;
    
    return [...existingList.map(c => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl,
      description: c.description,
      isExisting: true,
      isNewlySelected: false,
    })), ...newlySelectedCauses.map((cause: any) => ({
      id: `cause-${cause.id}`,
      name: cause.name,
      imageUrl: cause.logo || '',
      description: cause.mission || cause.description || '',
      isExisting: false,
      isNewlySelected: true,
      causeId: cause.id,
    }))];
  };

  // Create combined selected collectives list for display
  const getSelectedCollectivesForDisplay = () => {
    const existingList = existingCollectives.filter(c => !temporarilyRemovedCauses.includes(c.id));
    const newlySelectedFromList = joinedCollectivesData?.data?.map((item: any) => item.collective).filter((collective: any) => 
      selectedCollectives.includes(collective.id)
    ) || [];
    return [...existingList.map(c => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl,
      description: c.description,
      isExisting: true,
      isNewlySelected: false,
    })), ...newlySelectedFromList.map((collective: any) => ({
      id: `collective-${collective.id}`,
      name: collective.name,
      imageUrl: collective.cover_image || '',
      description: collective.description || '',
      isExisting: false,
      isNewlySelected: true,
      collectiveId: collective.id,
    }))];
  };

  // Get causes to display - show first 5 by default, or search results if searching
  const displayCauses = causesData?.results 
    ? causesData.results
        .filter((cause: any) => !allSelectedCauseIds.includes(cause.id))
        .slice(0, 5)
    : [];

  // Get joined collectives, excluding all selected ones
  const joinedCollectives = joinedCollectivesData?.data?.map((item: any) => item.collective) || [];
  const availableCollectives = joinedCollectives.filter((collective: any) => 
    !allSelectedCollectiveIds.includes(collective.id)
  );

  // Calculate remaining items (existing items not removed + newly selected items)
  const remainingExistingCauseIds = existingCauses
    .filter(c => !temporarilyRemovedCauses.includes(c.id))
    .map(c => {
      const id = c.id.replace('cause-', '');
      return parseInt(id);
    })
    .filter(id => !isNaN(id));

  const remainingExistingCollectiveIds = existingCollectives
    .filter(c => !temporarilyRemovedCauses.includes(c.id))
    .map(c => {
      const id = c.id.replace('collective-', '');
      return parseInt(id);
    })
    .filter(id => !isNaN(id));

  const totalCauseIds = [...remainingExistingCauseIds, ...selectedCauses];
  const totalCollectiveIds = [...remainingExistingCollectiveIds, ...selectedCollectives];

  // Check if there are any items selected (either nonprofits or collectives)
  const hasItems = totalCauseIds.length > 0 || totalCollectiveIds.length > 0;

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

  const actualDonationAmount = parseFloat(editableAmount.toString());
  const fees = calculateFees(actualDonationAmount);
  const net = fees.net;
  const maxCapacity = Math.floor(net / 0.20);
  
  // Calculate capacity for summary card
  const currentCapacity = totalCauseIds.length;
  const totalCausesCount = totalCauseIds.length;
  const totalCollectivesCount = totalCollectiveIds.length;

  // Calculate equal distribution percentage and amount per item
  const totalItems = totalCauseIds.length + totalCollectiveIds.length;
  const distributionPercentage = totalItems > 0 ? Math.floor(100 / totalItems) : 0;
  const amountPerItem = totalItems > 0 ? (editableAmount * 0.9) / totalItems : 0; // 90% after fees, divided equally

  // Fetch donation history for lifetime amount
  const { data: donationHistoryData } = useQuery({
    queryKey: ['donationHistory'],
    queryFn: getDonationHistory,
  });

  // Calculate lifetime amount from donation history
  const lifetimeAmount = donationHistoryData?.results?.reduce((sum: number, transaction: any) => {
    return sum + parseFloat(transaction.gross_amount || '0');
  }, 0) || 0;

  if (donationBoxQuery.isLoading) {
    return (
      <RNSafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
        </View>
      </RNSafeAreaView>
    );
  }

  return (
    <RNSafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header with title and back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerButton}
        >
          <ChevronLeft size={18} color="#374151" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Manage Donation Box</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Donation Box Summary Card */}
          <View style={styles.summaryCardContainer}>
            <View style={styles.summaryCard}>
              {/* Gradient Header */}
              <View style={styles.gradientHeader} />

              <View style={styles.summaryCardContent}>
                {/* Monthly Donation Section */}
                <View style={styles.monthlySection}>
                  <Text style={styles.monthlyLabel}>Monthly Donation</Text>
                  <View style={styles.amountRow}>
                    <View style={styles.amountControlsRow}>
                      <TouchableOpacity
                        onPress={decrementAmount}
                        style={styles.amountControlButton}
                      >
                        <Text style={styles.amountControlMinus}>−</Text>
                      </TouchableOpacity>
                      <View style={styles.amountDisplayContainer}>
                        {isEditingAmount ? (
                          <TextInput
                            value={Math.round(editableAmount).toString()}
                            onChangeText={handleAmountChange}
                            onBlur={() => {
                              setIsEditingAmount(false);
                              setEditableAmount(prev => Math.round(prev));
                            }}
                            autoFocus
                            style={styles.amountInput}
                            keyboardType="numeric"
                          />
                        ) : (
                          <>
                            <Text style={styles.amountText}>${Math.round(editableAmount)}</Text>
                            <Text style={styles.perMonthText}>/   month</Text>
                          </>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={incrementAmount}
                        style={styles.amountControlButton}
                      >
                        <Plus size={16} color={PrimaryGrey} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Supported Entities */}
                <View style={styles.entitiesContainer}>
                  <Text style={styles.entitiesText}>
                    {totalCausesCount} Cause{totalCausesCount !== 1 ? 's' : ''} • {totalCollectivesCount} Collective{totalCollectivesCount !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Donation Box Capacity */}
                <View style={styles.capacityContainer}>
                  <View style={styles.capacityHeader}>
                    <Text style={styles.capacityTitle}>Donation Box Capacity</Text>
                    <Text style={styles.capacityCount}>{currentCapacity}/{maxCapacity} causes</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${(currentCapacity / maxCapacity) * 100}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.capacityText}>
                    You can support {maxCapacity - currentCapacity} more cause{(maxCapacity - currentCapacity) !== 1 ? 's' : ''} with this donation amount.
                  </Text>
                </View>

                {/* Payment Schedule */}
                <Text style={styles.scheduleText}>on the {getChargeDay(donationBox?.next_charge_date)} of every month</Text>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setIsEditingAmount(true)}
                  >
                    {/* <Text style={styles.actionButtonIcon}>$</Text> */}
                    <Pencil size={16} color="#111827" style={{ marginBottom: 4 }} />
                    <Text style={styles.actionButtonText}>Edit amount</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      // @ts-ignore
                      navigation.navigate('DrawerNav', { screen: 'TransactionHistory' })
                    }}
                  >
                    {/* <Text style={styles.actionButtonIcon}>📖</Text> */}
                    <FileText size={16} color="#111827" style={{ marginBottom: 4 }} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextUnderline]}>transaction history</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

        {/* Tabs Navigation */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'nonprofits' && styles.tabActive]}
              onPress={() => {
                setActiveTab('nonprofits');
                setShowSearchResults(false);
                setSearchQuery('');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'nonprofits' && styles.tabTextActive]}>
                Nonprofits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'collectives' && styles.tabActive]}
              onPress={() => {
                setActiveTab('collectives');
                setShowSearchResults(false);
                setSearchQuery('');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'collectives' && styles.tabTextActive]}>
                Collectives
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        {activeTab === 'nonprofits' ? (
          <View style={styles.contentSection}>
            {/* Selected Nonprofits */}
            {(() => {
              const selectedCausesForDisplay = getSelectedCausesForDisplay();
              return selectedCausesForDisplay.length > 0 && (
                <View style={styles.selectedSection}>
                  <Text style={styles.sectionTitle}>Selected Nonprofits</Text>
                  <View style={styles.list}>
                    {selectedCausesForDisplay.map((org) => {
                      const causeId = org.isNewlySelected ? (org as any).causeId : parseInt(org.id.replace('cause-', ''));
                      const colors = getNonprofitColor(causeId || org.name);
                      return (
                        <View key={org.id} style={styles.causeCard}>
                          <View style={styles.causeCardContent}>
                            <View style={[styles.causeIcon, { backgroundColor: colors.bgColor }]}>
                              <Text style={[styles.causeIconText, { color: colors.textColor }]}>
                                {org.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.causeInfo}>
                              <Text style={styles.causeName}>{org.name}</Text>
                              {org.description && (
                                <Text style={styles.causeDescription} numberOfLines={1}>
                                  {org.description}
                                </Text>
                              )}
                            </View>
                            <View style={styles.causeActions}>
                              <View style={styles.amountInfo}>
                                <Text style={styles.amountPercentage}>{distributionPercentage}%</Text>
                                <Text style={styles.amountPerMonth}>${amountPerItem.toFixed(2)}/mo</Text>
                              </View>
                              <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleDeselectCause(causeId, org.isNewlySelected, org.name)}
                              >
                                <Trash2 size={18} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })()}

            {/* Search Section */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>ADD NONPROFITS</Text>
              <View style={styles.searchContainer}>
                <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search nonprofits..."
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
              {/* Search button hidden - user can press enter in input */}
            </View>

            {/* Default Causes - Show when no search is active */}
            {!showSearchResults && (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>Suggested Nonprofits</Text>
                {causesLoading ? (
                  <Text style={styles.loadingText}>Loading...</Text>
                ) : displayCauses.length > 0 ? (
                  <View style={styles.list}>
                    {displayCauses.map((cause: any) => {
                      const isSelected = selectedCauses.includes(cause.id);
                      const colors = getNonprofitColor(cause.id || cause.name);
                      return (
                        <TouchableOpacity
                          key={cause.id}
                          style={styles.causeCard}
                          onPress={() => handleToggleCause(cause.id)}
                        >
                          <View style={styles.causeCardContent}>
                            <View style={[styles.causeIcon, { backgroundColor: colors.bgColor }]}>
                              <Text style={[styles.causeIconText, { color: colors.textColor }]}>
                                {cause.name?.charAt(0)?.toUpperCase() || 'C'}
                              </Text>
                            </View>
                            <View style={styles.causeInfo}>
                              <Text style={styles.causeName}>{cause.name}</Text>
                              <Text style={styles.causeDescription} numberOfLines={1}>
                                {cause.mission || cause.description}
                              </Text>
                            </View>
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                              {isSelected && (
                                <View style={styles.checkmark} />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.loadingText}>No nonprofits available</Text>
                )}
              </View>
            )}

            {/* Search Results */}
            {showSearchResults && (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>Search Results (Max 5)</Text>
                {causesLoading ? (
                  <Text style={styles.loadingText}>Loading...</Text>
                ) : (() => {
                  const searchResults = causesData?.results 
                    ? causesData.results
                        .filter((cause: any) => !allSelectedCauseIds.includes(cause.id))
                        .slice(0, 5)
                    : [];
                  return searchResults.length > 0 ? (
                    <View style={styles.list}>
                      {searchResults.map((cause: any) => {
                        const isSelected = selectedCauses.includes(cause.id);
                        const colors = getNonprofitColor(cause.id || cause.name);
                        return (
                          <TouchableOpacity
                            key={cause.id}
                            style={styles.causeCard}
                            onPress={() => handleToggleCause(cause.id)}
                          >
                            <View style={styles.causeCardContent}>
                              <View style={[styles.causeIcon, { backgroundColor: colors.bgColor }]}>
                                <Text style={[styles.causeIconText, { color: colors.textColor }]}>
                                  {cause.name?.charAt(0)?.toUpperCase() || 'C'}
                                </Text>
                              </View>
                              <View style={styles.causeInfo}>
                                <Text style={styles.causeName}>{cause.name}</Text>
                                <Text style={styles.causeDescription} numberOfLines={1}>
                                  {cause.mission || cause.description}
                                </Text>
                              </View>
                              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                {isSelected && (
                                  <View style={styles.checkmark} />
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.loadingText}>No nonprofits found</Text>
                  );
                })()}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.contentSection}>
            {/* Selected Collectives */}
            {(() => {
              const selectedCollectivesForDisplay = getSelectedCollectivesForDisplay();
              return selectedCollectivesForDisplay.length > 0 && (
                <View style={styles.selectedSection}>
                  <Text style={styles.sectionTitle}>Selected Collectives</Text>
                  <View style={styles.list}>
                    {selectedCollectivesForDisplay.map((org) => {
                      const collectiveId = org.isNewlySelected ? (org as any).collectiveId : parseInt(org.id.replace('collective-', ''));
                      const isExpanded = expandedCollectives.has(collectiveId);
                      const details = collectiveDetails[collectiveId];
                      const isLoading = loadingCollectives.has(collectiveId);
                      
                      // Generate consistent color for collective
                      const collectiveColors = [
                        { bg: '#dbeafe', text: '#1e40af' }, // blue
                        { bg: '#fce7f3', text: '#831843' }, // pink
                        { bg: '#e9d5ff', text: '#6b21a8' }, // purple
                        { bg: '#d1fae5', text: '#065f46' }, // green
                        { bg: '#fed7aa', text: '#9a3412' }, // orange
                      ];
                      const colorIndex = (org.name?.charCodeAt(0) || 0) % collectiveColors.length;
                      const collectiveColor = collectiveColors[colorIndex];
                      
                      return (
                        <View key={org.id}>
                          <View style={styles.causeCard}>
                            <View style={styles.causeCardContent}>
                              <TouchableOpacity
                                style={styles.collectiveHeader}
                                onPress={() => handleToggleCollectiveDropdown(collectiveId)}
                              >
                                <View style={[styles.causeIcon, { backgroundColor: collectiveColor.bg }]}>
                                  <Text style={[styles.causeIconText, { color: collectiveColor.text }]}>
                                    {org.name.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.causeInfo}>
                                  <Text style={styles.causeName}>{org.name}</Text>
                                  {org.description && (
                                    <Text style={styles.causeDescription} numberOfLines={1}>
                                      {org.description}
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                              <View style={styles.causeActions}>
                                <View style={styles.amountInfo}>
                                  <Text style={styles.amountPercentage}>{distributionPercentage}%</Text>
                                  <Text style={styles.amountPerMonth}>${amountPerItem.toFixed(2)}/mo</Text>
                                </View>
                                <View style={styles.collectiveActions}>
                                  {isLoading ? (
                                    <ActivityIndicator size="small" color={PrimaryBlue} />
                                  ) : (
                                    isExpanded ? (
                                      <ChevronDown size={20} color="#6b7280" style={{ transform: [{ rotate: '180deg' }] }} />
                                    ) : (
                                      <ChevronDown size={20} color="#6b7280" />
                                    )
                                  )}
                                  <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleDeselectCollective(collectiveId, org.isNewlySelected, org.name)}
                                  >
                                    <Trash2 size={18} color="#ef4444" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                          {isExpanded && details && details.causes && details.causes.length > 0 && (
                            <View style={styles.collectiveExpandedContent}>
                              <Text style={styles.collectiveExpandedTitle}>Nonprofits ({details.causes.length})</Text>
                              <View style={styles.collectiveCausesList}>
                                {details.causes.map((causeItem: any) => (
                                  <View key={causeItem.id} style={styles.collectiveCauseItem}>
                                    <View style={styles.collectiveCauseIcon}>
                                      <Text style={styles.collectiveCauseIconText}>
                                        {causeItem.cause?.name?.charAt(0).toUpperCase() || 'N'}
                                      </Text>
                                    </View>
                                    <View style={styles.collectiveCauseInfo}>
                                      <Text style={styles.collectiveCauseName}>{causeItem.cause?.name}</Text>
                                      {causeItem.cause?.description && (
                                        <Text style={styles.collectiveCauseDescription} numberOfLines={2}>
                                          {causeItem.cause.description}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })()}

            {/* Available Collectives */}
            <View style={styles.collectivesSection}>
              <Text style={styles.sectionTitle}>Joined Collectives</Text>
              {joinedCollectivesLoading ? (
                <Text style={styles.loadingText}>Loading...</Text>
              ) : availableCollectives.length > 0 ? (
                <View style={styles.list}>
                  {availableCollectives.map((collective: any) => {
                    const isSelected = selectedCollectives.includes(collective.id);
                    const isExpanded = expandedCollectives.has(collective.id);
                    const details = collectiveDetails[collective.id];
                    const isLoading = loadingCollectives.has(collective.id);
                    
                    // Generate consistent color for collective
                    const collectiveColors = [
                      { bg: '#dbeafe', text: '#1e40af' }, // blue
                      { bg: '#fce7f3', text: '#831843' }, // pink
                      { bg: '#e9d5ff', text: '#6b21a8' }, // purple
                      { bg: '#d1fae5', text: '#065f46' }, // green
                      { bg: '#fed7aa', text: '#9a3412' }, // orange
                    ];
                    const colorIndex = (collective.name?.charCodeAt(0) || 0) % collectiveColors.length;
                    const collectiveColor = collectiveColors[colorIndex];
                    
                    return (
                      <View key={collective.id}>
                        <TouchableOpacity
                          style={styles.causeCard}
                          onPress={() => handleToggleCollectiveDropdown(collective.id)}
                        >
                          <View style={styles.causeCardContent}>
                            <View style={styles.collectiveHeader}>
                              <View style={[styles.causeIcon, { backgroundColor: collectiveColor.bg }]}>
                                <Text style={[styles.causeIconText, { color: collectiveColor.text }]}>
                                  {collective.name?.charAt(0)?.toUpperCase() || 'C'}
                                </Text>
                              </View>
                              <View style={styles.causeInfo}>
                                <Text style={styles.causeName}>{collective.name}</Text>
                                <Text style={styles.causeDescription} numberOfLines={1}>
                                  {collective.description || 'Community collective'}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.collectiveActions}>
                              {isLoading ? (
                                <ActivityIndicator size="small" color={PrimaryBlue} />
                              ) : (
                                isExpanded ? (
                                  <ChevronDown size={20} color="#6b7280" style={{ transform: [{ rotate: '180deg' }] }} />
                                ) : (
                                  <ChevronDown size={20} color="#6b7280" />
                                )
                              )}
                              <TouchableOpacity
                                onPress={() => handleToggleCollective(collective.id)}
                                style={{ marginLeft: 8 }}
                              >
                                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                  {isSelected && (
                                    <View style={styles.checkmark} />
                                  )}
                                </View>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                        {isExpanded && details && details.causes && details.causes.length > 0 && (
                          <View style={styles.collectiveExpandedContent}>
                            <Text style={styles.collectiveExpandedTitle}>Nonprofits ({details.causes.length})</Text>
                            <View style={styles.collectiveCausesList}>
                              {details.causes.map((causeItem: any) => (
                                <View key={causeItem.id} style={styles.collectiveCauseItem}>
                                  <View style={styles.collectiveCauseIcon}>
                                    <Text style={styles.collectiveCauseIconText}>
                                      {causeItem.cause?.name?.charAt(0).toUpperCase() || 'N'}
                                    </Text>
                                  </View>
                                  <View style={styles.collectiveCauseInfo}>
                                    <Text style={styles.collectiveCauseName}>{causeItem.cause?.name}</Text>
                                    {causeItem.cause?.description && (
                                      <Text style={styles.collectiveCauseDescription} numberOfLines={2}>
                                        {causeItem.cause.description}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.loadingText}>No collectives available</Text>
              )}
            </View>
          </View>
        )}

        {/* Distribution Details */}
        <View style={styles.distributionSection}>
          <Text style={styles.distributionText}>
            Your ${Math.round(editableAmount)} becomes ${(Math.round(editableAmount) * 0.9).toFixed(2)}{" "}
            after fees, split evenly across causes. Your donation will be evenly
            distributed across all {visibleCauses.length} organizations.
          </Text>
        </View>

        {/* Next Payment Section */}
        <View style={styles.nextPaymentSection}>
          <Text style={styles.sectionTitle}>NEXT PAYMENT</Text>
          <View style={styles.nextPaymentCard}>
            <View style={styles.nextPaymentInfo}>
              <Text style={styles.nextPaymentLabel}>Next payment date</Text>
              <Text style={styles.nextPaymentDate}>{formatNextChargeDate(donationBox?.next_charge_date)}</Text>
            </View>
            <View style={styles.nextPaymentAmount}>
              <Text style={styles.nextPaymentValue}>${Math.round(editableAmount)}</Text>
              <Text style={styles.nextPaymentFrequency}>Monthly</Text>
            </View>
          </View>
        </View>

        <Text style={styles.allocationNote}>
          Allocations will automatically adjust for 100% distribution
        </Text>
      </ScrollView>

      {/* Update Donation Button Footer - Always visible at bottom */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#ffffff' }}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.updateButton, 
              (updateDonationBoxMutation.isPending || !hasItems) && styles.updateButtonDisabled
            ]}
            onPress={handleUpdateDonation}
            disabled={updateDonationBoxMutation.isPending || !hasItems}
          >
            {updateDonationBoxMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.updateButtonText}>Update Donation</Text>
            )}
          </TouchableOpacity>
          
          {/* Deactivate Subscription Button - Only show if subscription is active */}
          {isActive && (
            <TouchableOpacity
              style={[styles.deactivateButton, cancelDonationBoxMutation.isPending && styles.deactivateButtonDisabled]}
              onPress={() => setShowCancelModal(true)}
              disabled={cancelDonationBoxMutation.isPending}
            >
              {cancelDonationBoxMutation.isPending ? (
                <ActivityIndicator color="#dc2626" />
              ) : (
                <Text style={styles.deactivateButtonText}>Deactivate Subscription</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirm Removal</Text>
                <Text style={styles.modalDescription}>
                  Are you sure you want to remove {itemToDelete?.name} from your donation box? This action cannot be undone.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowDeleteModal(false);
                      setItemToDelete(null);
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalRemoveButton}
                    onPress={handleConfirmDelete}
                  >
                    <Text style={styles.modalRemoveText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Cancel/Deactivate Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCancelModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowCancelModal(false);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Deactivate Subscription</Text>
                <Text style={styles.modalDescription}>
                  Are you sure you want to deactivate your donation box subscription? This will cancel all future monthly donations. You can reactivate it at any time.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowCancelModal(false);
                    }}
                    disabled={cancelDonationBoxMutation.isPending}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalRemoveButton, { backgroundColor: '#dc2626' }]}
                    onPress={() => cancelDonationBoxMutation.mutate()}
                    disabled={cancelDonationBoxMutation.isPending}
                  >
                    <Text style={styles.modalRemoveText}>
                      {cancelDonationBoxMutation.isPending ? 'Deactivating...' : 'Deactivate Subscription'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </View>
    </RNSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  headerSpacer: {
    width: 32,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  summaryCardContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: SecondaryGrey,
    overflow: 'hidden',
  },
  gradientHeader: {
    height: 2,
    width: '100%',
    backgroundColor: PrimaryBlue,
  },
  summaryCardContent: {
    padding: 24,
  },
  monthlySection: {
    marginBottom: 24,
  },
  monthlyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  amountRow: {
    marginBottom: 8,
  },
  amountControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  amountControlButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: LightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountControlMinus: {
    fontSize: 16,
    fontWeight: '600',
    color: PrimaryGrey,
  },
  amountDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: SecondaryGrey,
    width: 100,
    textAlign: 'center',
    paddingVertical: 4,
  },
  entitiesContainer: {
    backgroundColor: LightGrey,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  entitiesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  capacityContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  capacityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  capacityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PrimaryBlue,
  },
  capacityCount: {
    fontSize: 14,
    color: '#111827',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: PrimaryBlue,
  },
  capacityText: {
    fontSize: 14,
    color: PrimaryBlue,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    maxWidth: 300,
    alignSelf: 'center',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    backgroundColor: LightGrey,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  actionButtonTextUnderline: {
    // textDecorationLine: 'underline',
  },
  transactionLink: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  transactionLinkText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 35,
  },
  amountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  amountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 24,
  },
  dollarIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  perMonthText: {
    fontSize: 16,
    color: '#6b7280',
  },
  amountControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  amountControlText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PrimaryBlue,
    lineHeight: 24,
  },
  amountControlInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: SecondaryGrey,
    minWidth: 100,
    textAlign: 'center',
    paddingVertical: 4,
  },
  amountDisplay: {
    minWidth: 100,
    alignItems: 'center',
  },
  amountDisplayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  scheduleText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 300,
  },
  // actionButton: {
  //   flex: 1,
  //   backgroundColor: 'rgba(255, 255, 255, 0.1)',
  //   borderRadius: 12,
  //   paddingVertical: 12,
  //   alignItems: 'center',
  // },
  // actionButtonText: {
  //   fontSize: 12,
  //   color: '#ffffff',
  //   marginTop: 4,
  // },
  tabsContainer: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  contentSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  selectedSection: {
    marginBottom: 24,
  },
  searchSection: {
    marginBottom: 24,
  },
  collectivesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  causeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: SecondaryGrey,
    // marginBottom: 2,
  },
  causeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  causeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  causeIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  causeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amountPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  amountPerMonth: {
    fontSize: 14,
    color: '#6b7280',
  },
  collectiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  collectiveActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectiveExpandedContent: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginLeft: 16,
  },
  collectiveExpandedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  collectiveCausesList: {
    gap: 12,
    paddingLeft: 56,
  },
  collectiveCauseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  collectiveCauseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collectiveCauseIconText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  collectiveCauseInfo: {
    flex: 1,
  },
  collectiveCauseName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 14,
  },
  collectiveCauseDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
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
  searchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  causeImageContainer: {
    marginRight: 16,
  },
  causeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  causePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  causePlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 14,
    color: '#6b7280',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 4,
    // backgroundColor: '#f3f4f6',
    // paddingHorizontal: 8,
    // paddingVertical: 4,
    // borderRadius: 6,
  },
  removeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resultDescription: {
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
  checkboxSelected: {
    backgroundColor: PrimaryBlue,
    borderColor: PrimaryBlue,
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 16,
  },
  distributionSection: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  distributionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
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
  updateButton: {
    backgroundColor: PrimaryBlue,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deactivateButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deactivateButtonDisabled: {
    opacity: 0.5,
  },
  deactivateButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  nextPaymentSection: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  nextPaymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPaymentInfo: {
    gap: 2,
  },
  nextPaymentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  nextPaymentDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  nextPaymentAmount: {
    alignItems: 'flex-end',
    gap: 2,
  },
  nextPaymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  nextPaymentFrequency: {
    fontSize: 12,
    color: '#6b7280',
  },
  allocationNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalRemoveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  modalRemoveText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});
