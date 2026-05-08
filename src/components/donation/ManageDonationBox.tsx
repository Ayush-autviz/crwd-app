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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import { Plus, Minus, Trash2, Search, X, ChevronLeft, ChevronDown, FileText, Pencil } from 'lucide-react-native';
import EditDonationSplitBottomSheet from './EditDonationSplitBottomSheet';
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
import { useToast } from '../../contexts/ToastContext';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef } from 'react';

export default function ManageDonationBoxScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  // Fetch donation box data
  const donationBoxQuery = useQuery({
    queryKey: ['donationBox'],
    queryFn: getDonationBox,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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

  // Refetch donation box data when component mounts to get latest amount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['donationBox'] });
    donationBoxQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [temporarilyRemovedCauses, setTemporarilyRemovedCauses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCauses, setSelectedCauses] = useState<number[]>([]);
  const [selectedCollectives, setSelectedCollectives] = useState<number[]>([]);
  const [selectedCausesData, setSelectedCausesData] = useState<any[]>([]);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    name: string;
    type: 'cause' | 'collective';
    isNewlySelected: boolean
  } | null>(null);
  const [expandedCollectives, setExpandedCollectives] = useState<Set<number>>(new Set());
  const [collectiveDetails, setCollectiveDetails] = useState<Record<number, any>>({});
  const [loadingCollectives, setLoadingCollectives] = useState<Set<number>>(new Set());
  const [showEditSplitSheet, setShowEditSplitSheet] = useState(false);

  const deleteBottomSheetRef = useRef<BottomSheetModal>(null);
  const cancelBottomSheetRef = useRef<BottomSheetModal>(null);

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
    enabled: !!searchQuery, // Always enable to allow adding causes after reload
    refetchOnMount: true,
  });

  // Fetch joined collectives
  const { data: joinedCollectivesData, isLoading: joinedCollectivesLoading } = useQuery({
    queryKey: ['joined-collectives', currentUser?.id],
    queryFn: () => getJoinCollective(currentUser?.id || ''),
    enabled: activeTab === 'collectives',
  });

  // Mutation to update donation box (all-in-one update)
  const updateDonationBoxMutation = useMutation({
    mutationFn: (data: any) => updateDonationBox(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      showToast('Donation box updated successfully!', 3000);
    },
    onError: (error: any) => {
      console.error('Error updating donation box:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update donation box. Please try again.';
      showToast(errorMessage, 3000);
    },
  });

  // Mutation to cancel/deactivate donation box
  const cancelDonationBoxMutation = useMutation({
    mutationFn: () => cancelDonationBox(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      cancelBottomSheetRef.current?.dismiss();
      handleBack();
    },
    onError: (error: any) => {
      console.error('Error canceling donation box:', error);
    },
  });

  // Helper function to calculate max capacity for a given amount
  const calculateMaxCapacity = (amount: number) => {
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
    const fees = calculateFees(amount);
    return Math.floor(fees.net / 0.20);
  };

  const incrementAmount = () => {
    setEditableAmount(prev => Math.round(prev) + 1);
  };

  const decrementAmount = () => {
    if (editableAmount > 5) {
      const newAmount = Math.max(5, Math.round(editableAmount) - 1);
      const newMaxCapacity = calculateMaxCapacity(newAmount);
      const currentCapacity = totalCauseIds.length;

      // Check if new amount would reduce capacity below current causes
      if (currentCapacity > newMaxCapacity) {
        showToast(`You have ${currentCapacity} cause${currentCapacity !== 1 ? 's' : ''} selected. Please remove ${currentCapacity - newMaxCapacity} cause${currentCapacity - newMaxCapacity !== 1 ? 's' : ''} to lower the donation amount to $${newAmount}.`, 4000);
        return;
      }

      setEditableAmount(newAmount);
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
    deleteBottomSheetRef.current?.present();
  };

  const handleDeselectCollective = (collectiveId: number, isNewlySelected: boolean, collectiveName: string) => {
    setItemToDelete({ id: collectiveId, name: collectiveName, type: 'collective', isNewlySelected });
    deleteBottomSheetRef.current?.present();
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

    deleteBottomSheetRef.current?.dismiss();
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
      // Check capacity before adding
      const newMaxCapacity = calculateMaxCapacity(editableAmount);
      const currentCapacity = totalCauseIds.length;

      if (currentCapacity >= newMaxCapacity) {
        showToast(`You've reached the maximum capacity of ${newMaxCapacity} cause${newMaxCapacity !== 1 ? 's' : ''} for this donation amount. Please increase your donation amount to add more nonprofits.`, 4000);
        return;
      }

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
      // Include collectives from both existingCollectives (from causes array) and attributingCollectives (directly from donation box)
      const existingCollectiveIdsUpdate = existingCollectives
        .map(c => {
          const id = c.id.replace('collective-', '');
          return parseInt(id);
        })
        .filter(id => !isNaN(id));
      const attributingCollectiveIdsUpdate = attributingCollectives.map((collective: any) => collective.id).filter((id: any) => id != null);
      const allCollectiveIdsUpdate = [...existingCollectiveIdsUpdate, ...attributingCollectiveIdsUpdate];
      // Remove duplicates
      const uniqueCollectiveIdsUpdate = Array.from(new Set(allCollectiveIdsUpdate));

      const remainingExistingCollectiveIds = uniqueCollectiveIdsUpdate.filter((collectiveId: number) => {
        const collectiveIdString = `collective-${collectiveId}`;
        return !temporarilyRemovedCauses.includes(collectiveIdString);
      });

      // Combine existing (not removed) + newly selected causes/collectives
      const allCauseIds = [...remainingExistingCauseIds, ...selectedCauses];
      const allCollectiveIdsForUpdate = [...remainingExistingCollectiveIds, ...selectedCollectives];

      // Validate minimum amount
      if (editableAmount < 5) {
        showToast('The minimum monthly donation is $5.', 3000);
        return;
      }

      // Validate that at least one nonprofit or collective exists
      if (allCauseIds.length === 0 && allCollectiveIdsForUpdate.length === 0) {
        showToast('Please add at least one nonprofit or collective to your donation box.', 3000);
        return;
      }

      // Build causes array with cause_id and optional attributed_collective
      const causesArray: Array<{ cause_id: number; attributed_collective?: number }> = [];

      // Get box_causes from donation box data to map attributed_collectives
      const boxCausesFromDonationBox = donationBox?.box_causes || [];
      const causeToAttributedCollective = new Map<number, number>();

      // Map existing causes to their attributed_collective from box_causes
      boxCausesFromDonationBox.forEach((boxCause: any) => {
        const causeId = boxCause.cause?.id;
        if (causeId) {
          // Check if attributed_collectives exists and is not "manual"
          const attributedCollectives = boxCause.attributed_collectives || [];
          // Find the first numeric collective ID (not "manual")
          const numericCollectiveId = attributedCollectives.find((ac: any) =>
            typeof ac === 'number' && ac !== 0
          );
          if (numericCollectiveId) {
            causeToAttributedCollective.set(causeId, numericCollectiveId);
          }
        }
      });

      // Add existing causes (not removed) with their attributed_collective from box_causes
      remainingExistingCauseIds.forEach((causeId) => {
        const attributedCollective = causeToAttributedCollective.get(causeId);
        const causeEntry: { cause_id: number; attributed_collective?: number } = {
          cause_id: causeId,
        };
        // Only add attributed_collective if it exists and is not 0
        if (attributedCollective && attributedCollective !== 0) {
          causeEntry.attributed_collective = attributedCollective;
        }
        causesArray.push(causeEntry);
      });

      // Add newly selected causes (standalone, no attributed_collective)
      selectedCauses.forEach((causeId) => {
        causesArray.push({
          cause_id: causeId,
        });
      });

      // Add causes from newly selected collectives
      // When a collective is selected, we need to get its causes and add them with attributed_collective
      for (const collectiveId of selectedCollectives) {
        try {
          const collectiveData = collectiveDetails[collectiveId] || await getCollectiveById(collectiveId.toString());
          if (collectiveData?.causes) {
            collectiveData.causes.forEach((collectiveCause: any) => {
              const causeId = collectiveCause.cause?.id || collectiveCause.id;
              if (causeId) {
                // Check if this cause is already in the array (shouldn't happen for newly selected, but just in case)
                const alreadyExists = causesArray.some(c => c.cause_id === causeId);
                if (!alreadyExists) {
                  const causeEntry: { cause_id: number; attributed_collective?: number } = {
                    cause_id: causeId,
                    attributed_collective: collectiveId,
                  };
                  causesArray.push(causeEntry);
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching collective ${collectiveId} details:`, error);
        }
      }

      // Note: Causes from existing collectives are already included in remainingExistingCauseIds
      // with their attributed_collective mapped from box_causes above, so we don't need to add them separately

      // Prepare payload with new format (matching Vite)
      const payload: {
        monthly_amount: string;
        causes: Array<{ cause_id: number; attributed_collective?: number }>;
      } = {
        monthly_amount: editableAmount.toString(),
        causes: causesArray,
      };

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
    } catch (error: any) {
      console.error('Error updating donation box:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update donation box. Please try again.';
      showToast(errorMessage, 3000);
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

  // Get existing collective IDs to filter them out
  // Include collectives from both existingCollectives (from causes array) and attributingCollectives (directly from donation box)
  const existingCollectiveIdsFromCausesFilter = existingCollectives
    .map(c => {
      const id = c.id.replace('collective-', '');
      return parseInt(id);
    })
    .filter(id => !isNaN(id));
  const attributingCollectiveIdsFilter = attributingCollectives.map((collective: any) => collective.id).filter((id: any) => id != null);
  const allExistingCollectiveIdsFilter = [...existingCollectiveIdsFromCausesFilter, ...attributingCollectiveIdsFilter];
  // Remove duplicates
  const existingCollectiveIds = Array.from(new Set(allExistingCollectiveIdsFilter));

  const allSelectedCauseIds = [...existingCauseIds, ...selectedCauses];
  // Include collectives from both existingCollectives (from causes array) and attributingCollectives (directly from donation box)
  const attributingCollectiveIdsForSelection = attributingCollectives.map((collective: any) => collective.id).filter((id: any) => id != null);
  const allExistingCollectiveIdsForSelection = [...existingCollectiveIds, ...attributingCollectiveIdsForSelection];
  // Remove duplicates
  const uniqueExistingCollectiveIdsForSelection = Array.from(new Set(allExistingCollectiveIdsForSelection));
  const allSelectedCollectiveIds = [...uniqueExistingCollectiveIdsForSelection, ...selectedCollectives];

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
      imageUrl: cause.image || cause.logo || cause.imageUrl || '',
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

  // Get collectives from both existingCollectives (from causes array) and attributingCollectives (directly from donation box)
  // This ensures we count all collectives even if there are any edge cases
  const existingCollectiveIdsFromCauses = existingCollectives
    .map(c => {
      const id = c.id.replace('collective-', '');
      return parseInt(id);
    })
    .filter(id => !isNaN(id));
  const attributingCollectiveIds = attributingCollectives.map((collective: any) => collective.id).filter((id: any) => id != null);
  const allCollectiveIds = [...existingCollectiveIdsFromCauses, ...attributingCollectiveIds];
  // Remove duplicates
  const uniqueCollectiveIds = Array.from(new Set(allCollectiveIds));

  const remainingExistingCollectiveIds = uniqueCollectiveIds.filter((collectiveId: number) => {
    const collectiveIdString = `collective-${collectiveId}`;
    return !temporarilyRemovedCauses.includes(collectiveIdString);
  });

  const totalCauseIds = [...remainingExistingCauseIds, ...selectedCauses];
  const totalCollectiveIds = [...remainingExistingCollectiveIds, ...selectedCollectives];

  // Check if there are any items selected (either nonprofits or collectives)
  const hasItems = totalCauseIds.length > 0 || totalCollectiveIds.length > 0;

  // Calculate fees and capacity using the provided formula
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
  const distributionPercentage = totalItems > 0 ? 100 / totalItems : 0;
  const amountPerItem = totalItems > 0 ? fees.net / totalItems : 0; // Net amount after fees, divided equally

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
        <KeyboardAwareScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
          enableOnAndroid={true}
          extraScrollHeight={20}
        >

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
                    <View style={styles.amountControls}>
                      <TouchableOpacity
                        onPress={decrementAmount}
                        disabled={editableAmount <= 5}
                        style={[
                          styles.amountControlButton,
                          editableAmount <= 5 && styles.amountControlButtonDisabled
                        ]}
                      >
                        <Minus size={16} color={editableAmount <= 5 ? '#9CA3AF' : 'white'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={incrementAmount}
                        style={styles.amountControlButton}
                      >
                        <Plus size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {lifetimeAmount > 0 && (
                    <Text style={styles.lifetimeAmount}>${Math.round(lifetimeAmount).toLocaleString()} lifetime</Text>
                  )}
                  {/* Billing Cycle Info - Only show when donation box is active */}
                  {donationBox?.is_active && donationBox?.next_charge_date && (
                    <View style={styles.billingCycleBanner}>
                      <Text style={styles.billingCycleText}>
                        Changes take effect on your next billing cycle ({getChargeDay(donationBox.next_charge_date)} of the month)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Supported Entities */}
                <View style={styles.entitiesContainer}>
                  <Text style={styles.entitiesText}>
                    {totalCausesCount} Nonprofit{totalCausesCount !== 1 ? 's' : ''} • {totalCollectivesCount} Giving Group{totalCollectivesCount !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Donation Box Capacity */}
                {/* <View style={styles.capacityContainer}>
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
                </View> */}

                {/* Payment Schedule - Commented out to match Vite version */}
                {/* <Text style={styles.scheduleText}>on the {getChargeDay(donationBox?.next_charge_date)} of every month</Text> */}

                {/* Action Buttons - Commented out to match Vite version */}
                {/* <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setIsEditingAmount(true)}
                  >
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
                    <FileText size={16} color="#111827" style={{ marginBottom: 4 }} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextUnderline]}>transaction history</Text>
                  </TouchableOpacity>
                </View> */}
              </View>
            </View>
          </View>

          {/* Tabs Navigation - Commented out to match Vite version */}
          {/* <View style={styles.tabsContainer}>
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
        </View> */}

          {/* Content Area - Only show nonprofits (tabs commented out to match Vite) */}
          <View style={styles.contentSection}>
            {/* Selected Nonprofits */}
            {(() => {
              const selectedCausesForDisplay = getSelectedCausesForDisplay();
              return selectedCausesForDisplay.length > 0 && (
                <View style={styles.selectedSection}>
                  <View style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitleLarge}>Your Selected Nonprofits</Text>
                      <Text style={styles.sectionSubtitle}>Your Donation Box. Add or remove anytime.</Text>
                    </View>
                    {/* {selectedCausesForDisplay.length > 1 && (
                      <TouchableOpacity
                        onPress={() => setShowEditSplitSheet(true)}
                        style={styles.editSplitButton}
                      >
                        <Pencil size={16} color="#374151" />
                        <Text style={styles.editSplitButtonText}>Edit Split</Text>
                      </TouchableOpacity>
                    )} */}
                  </View>
                  <View style={styles.list}>
                    {selectedCausesForDisplay.map((org, index) => {
                      const causeId = org.isNewlySelected ? (org as any).causeId : parseInt(org.id.replace('cause-', ''));
                      const colors = getNonprofitColor(causeId || org.name);
                      const initials = org.name.charAt(0).toUpperCase();
                      const isLast = index === selectedCausesForDisplay.length - 1;
                      return (
                        <TouchableOpacity
                          key={org.id}
                          style={[styles.causeItem, isLast && { borderBottomWidth: 0 }]}
                          onPress={() => (navigation as any).navigate('CauseScreen', { id: causeId })}
                        >
                          <View style={styles.causeCardContent}>
                            <Avatar size={44} style={styles.causeIcon}>
                              <AvatarImage src={org.imageUrl} />
                              <AvatarFallback
                                style={{ backgroundColor: colors.bgColor }}
                                textStyle={{ color: colors.textColor, fontSize: 18, fontWeight: '700' }}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <View style={styles.causeInfo}>
                              <Text style={styles.causeName}>{org.name}</Text>
                              {org.description && (
                                <Text style={styles.causeDescription} numberOfLines={1}>
                                  {org.description}
                                </Text>
                              )}
                            </View>
                            <View style={styles.causeActions}>
                              <TouchableOpacity
                                style={styles.removeButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleDeselectCause(causeId, org.isNewlySelected, org.name);
                                }}
                              >
                                <Trash2 size={18} color="#6B7280" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })()}

            {/* Search Section */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitleLarge}>Add More Nonprofits</Text>
              <View style={styles.searchContainer}>
                <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
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
                    {displayCauses.map((cause: any, index: number) => {
                      const isSelected = selectedCauses.includes(cause.id);
                      const colors = getNonprofitColor(cause.id || cause.name);
                      const initials = cause.name?.charAt(0)?.toUpperCase() || 'C';
                      const isLast = index === displayCauses.length - 1;
                      return (
                        <TouchableOpacity
                          key={cause.id}
                          style={[styles.causeItem, isLast && { borderBottomWidth: 0 }]}
                          onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
                        >
                          <View style={styles.causeCardContent}>
                            <Avatar size={44} style={styles.causeIcon}>
                              <AvatarImage src={cause.image} />
                              <AvatarFallback
                                style={{ backgroundColor: colors.bgColor }}
                                textStyle={{ color: colors.textColor, fontSize: 18, fontWeight: '700' }}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <View style={styles.causeInfo}>
                              <Text style={styles.causeName}>{cause.name}</Text>
                              <Text style={styles.causeDescription} numberOfLines={1}>
                                {cause.mission || cause.description}
                              </Text>
                            </View>
                            {!isSelected ? (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleToggleCause(cause.id);
                                }}
                                style={styles.addButton}
                              >
                                <Plus size={14} color="#2222EE" />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleToggleCause(cause.id);
                                }}
                                style={styles.checkboxSelected}
                              >
                                <View style={styles.checkmarkWhite} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <></>
                  // <Text style={styles.loadingText}>No nonprofits available</Text>
                )}
              </View>
            )}

            {/* Search Results */}
            {showSearchResults && (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>Search Results</Text>
                {causesLoading ? (
                  <Text style={styles.loadingText}>Loading...</Text>
                ) : (() => {
                  const searchResults = causesData?.results
                    ? causesData.results
                      .filter((cause: any) => !allSelectedCauseIds.includes(cause.id))
                    : [];
                  return searchResults.length > 0 ? (
                    <View style={styles.list}>
                      {searchResults.map((cause: any) => {
                        const isSelected = selectedCauses.includes(cause.id);
                        const colors = getNonprofitColor(cause.id || cause.name);
                        const initials = cause.name?.charAt(0)?.toUpperCase() || 'C';
                        return (
                          <TouchableOpacity
                            key={cause.id}
                            style={styles.causeCard}
                            onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
                          >
                            <View style={styles.causeCardContent}>
                              <Avatar size={40} style={[styles.causeIcon, { borderRadius: 8 }]}>
                                <AvatarImage src={cause.image} />
                                <AvatarFallback
                                  style={{ backgroundColor: colors.bgColor }}
                                  textStyle={{ color: colors.textColor, fontSize: 18, fontWeight: '700' }}
                                >
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <View style={styles.causeInfo}>
                                <Text style={styles.causeName}>{cause.name}</Text>
                                <Text style={styles.causeDescription} numberOfLines={1}>
                                  {cause.mission || cause.description}
                                </Text>
                              </View>
                              {!isSelected ? (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    handleToggleCause(cause.id);
                                  }}
                                  style={styles.addButton}
                                >
                                  <Plus size={14} color="#2222EE" />
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    handleToggleCause(cause.id);
                                  }}
                                  style={styles.checkboxSelected}
                                >
                                  <View style={styles.checkmarkWhite} />
                                </TouchableOpacity>
                              )}
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
          {/* Collectives tab - Commented out to match Vite version */}
          {/* ) : (
          <View style={styles.contentSection}>
            {/* Selected Collectives */}
          {/* {(() => {
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
                                  <Text style={styles.amountPercentage}>{distributionPercentage.toFixed(1)}%</Text>
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

            {/* Available Collectives - Commented out to match Vite version */}
          {/* <View style={styles.collectivesSection}>
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
        )} */}

          {/* Distribution Details */}
          {/* <View style={styles.distributionSection}>
          <Text style={styles.distributionText}>
            Your ${Math.round(editableAmount)} becomes ${(Math.round(editableAmount) * 0.9).toFixed(2)}{" "}
            after fees, split evenly across causes. Your donation will be evenly
            distributed across all {visibleCauses.length} organizations.
          </Text>
        </View> */}

          {/* Next Payment Section */}
          {/* <View style={styles.nextPaymentSection}>
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
        </Text> */}
        </KeyboardAwareScrollView>

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

            {/* Deactivate Subscription Button - Commented out to match Vite version */}
            {/* {isActive && (
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
          )} */}
          </View>
        </SafeAreaView>

        {/* Remove Cause Confirmation Bottom Sheet */}
        <BottomSheetModal
          ref={deleteBottomSheetRef}
          index={0}
          snapPoints={['35%']}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              opacity={0.5}
            />
          )}
          enablePanDownToClose
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.modalHandle}
          onDismiss={() => setItemToDelete(null)}
        >
          <BottomSheetView style={styles.removeModalBody}>
            <Text style={styles.removeModalTitle}>Remove Cause?</Text>
            <Text style={styles.removeModalDescription}>
              Are you sure you want to remove <Text style={styles.removeModalBold}>{itemToDelete?.name}</Text> from your donation box? This action cannot be undone.
            </Text>

            <View style={styles.removeModalFooter}>
              <TouchableOpacity
                onPress={() => deleteBottomSheetRef.current?.dismiss()}
                style={[styles.removeModalButton, styles.removeModalCancelButton]}
                activeOpacity={0.7}
              >
                <Text style={styles.removeModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={[styles.removeModalButton, styles.removeModalConfirmButton]}
                activeOpacity={0.7}
              >
                <Text style={styles.removeModalConfirmText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        {/* Cancel/Deactivate Confirmation Bottom Sheet */}
        <BottomSheetModal
          ref={cancelBottomSheetRef}
          index={0}
          snapPoints={['35%']}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              opacity={0.5}
            />
          )}
          enablePanDownToClose
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.modalHandle}
        >
          <BottomSheetView style={styles.removeModalBody}>
            <Text style={styles.removeModalTitle}>Deactivate Subscription</Text>
            <Text style={styles.removeModalDescription}>
              Are you sure you want to deactivate your donation box subscription? This will cancel all future monthly donations. You can reactivate it at any time.
            </Text>

            <View style={styles.removeModalFooter}>
              <TouchableOpacity
                onPress={() => cancelBottomSheetRef.current?.dismiss()}
                disabled={cancelDonationBoxMutation.isPending}
                style={[styles.removeModalButton, styles.removeModalCancelButton]}
                activeOpacity={0.7}
              >
                <Text style={styles.removeModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => cancelDonationBoxMutation.mutate()}
                disabled={cancelDonationBoxMutation.isPending}
                style={[styles.removeModalButton, { ...styles.removeModalConfirmButton, backgroundColor: '#dc2626' }]}
                activeOpacity={0.7}
              >
                {cancelDonationBoxMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.removeModalConfirmText}>Deactivate</Text>
                )}
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        {/* Edit Donation Split Bottom Sheet */}
        {(() => {
          // Get causes from boxCauses for the edit split sheet
          // Use boxCauses directly and extract cause objects
          const causesForEditSplit = (boxCauses || [])
            .map((boxCause: any) => {
              // Handle both boxCause.cause and direct cause structure
              const cause = boxCause?.cause || boxCause;
              return cause;
            })
            .filter((cause: any) => cause != null && cause.id != null)
            .map((cause: any) => ({
              id: cause.id,
              name: cause.name || 'Unknown Cause',
              image: cause.image || cause.logo || '',
              logo: cause.logo || cause.image || '',
            }));

          // Only show if we have more than 1 cause and the sheet is open
          if (causesForEditSplit.length > 1 && showEditSplitSheet) {
            return (
              <EditDonationSplitBottomSheet
                isOpen={showEditSplitSheet}
                onClose={() => setShowEditSplitSheet(false)}
                causes={causesForEditSplit}
                monthlyAmount={amount}
                boxCauses={boxCauses}
              />
            );
          }
          return null;
        })()}
      </View>
    </RNSafeAreaView >
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
    fontFamily: 'Outfit-Bold',
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
    // marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#F5F9F2',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  gradientHeader: {
    height: 4,
    width: '100%',
    backgroundColor: PrimaryBlue,
  },
  summaryCardContent: {
    padding: 16,
  },
  monthlySection: {
    marginBottom: 24,
  },
  monthlyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-Medium',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
  },
  amountDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    minWidth: 80,
    fontFamily: 'Outfit-Bold',
  },
  perMonthText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  amountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1600ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountControlButtonDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
  },
  lifetimeAmount: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
  },
  billingCycleBanner: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  billingCycleText: {
    fontSize: 13,
    color: PrimaryBlue,
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  entitiesContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  entitiesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  capacityContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
    fontFamily: 'Outfit-Bold',
  },
  capacityCount: {
    fontSize: 13,
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  progressBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  capacityText: {
    fontSize: 13,
    color: PrimaryBlue,
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Medium',
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
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',
    fontFamily: 'Outfit-Regular',
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 35,
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
  // Removed duplicate styles to resolve lint errors
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
    fontFamily: 'Outfit-SemiBold',
  },
  sectionTitleLarge: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    // marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    fontFamily: 'Outfit-Regular',
  },
  causeCard: {
    backgroundColor: 'white',
    // Removed individual card styling to use grouped list style
  },
  causeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
  },
  causeIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  causeIconText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  amountPerMonth: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-SemiBold',
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
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  collectiveCauseInfo: {
    flex: 1,
  },
  collectiveCauseName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  collectiveCauseDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 12,
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
    fontFamily: 'Outfit-Medium',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    fontFamily: 'Outfit-SemiBold',
  },
  list: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  causeItem: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    fontFamily: 'Outfit-Bold',
  },
  causeInfo: {
    flex: 1,
  },
  causeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Outfit-Bold',
  },
  causeDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-SemiBold',
  },
  resultDescription: {
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
  checkmarkWhite: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    // backgroundColor: '#fce7f3',
    borderWidth: 1,
    borderColor: '#2222EE',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'Outfit-Regular',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: -2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 5,
    width: '100%',
  },
  updateButton: {
    backgroundColor: PrimaryBlue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: 12,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-Medium',
  },
  nextPaymentDate: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  nextPaymentAmount: {
    alignItems: 'flex-end',
    gap: 2,
  },
  nextPaymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Outfit-Medium',
  },
  nextPaymentFrequency: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  allocationNote: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
    fontFamily: 'Outfit-Regular',
  },
  bottomSheetBackground: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginTop: 8,
  },
  removeModalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  removeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit-Bold',
  },
  removeModalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: 'Outfit-Regular',
  },
  removeModalBold: {
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  removeModalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  removeModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  removeModalCancelButton: {
    backgroundColor: '#E5E7EB',
  },
  removeModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  removeModalConfirmButton: {
    backgroundColor: '#EF4444',
  },
  removeModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit-SemiBold',
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
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit-Medium',
  },
});
