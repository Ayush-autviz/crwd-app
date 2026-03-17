import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  SafeAreaView,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { X, Trash2, Pencil } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getCollectiveById } from '../../services/api/crwd';
import { PrimaryBlue, SecondaryGrey } from '../../Constants/Colors';
import { useQueryClient, useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import DonationBoxSummaryCard from './DonationBoxSummaryCard';
import {
  getDonationHistory,
  removeCauseFromBox,
  cancelDonationBox,
  addCausesToBox,
  getPreviouslySupportedCauses,
} from '../../services/api/donation';
import { PreviouslySupportedCauses } from './PreviouslySupportedCauses';
import { getNonprofitColor } from '../../lib/getNonprofitColor';
import RequestNonprofitModal from '../newsearch/RequestNonprofitModal';
import { Alert } from 'react-native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import EditDonationSplitBottomSheet from './EditDonationSplitBottomSheet';
import PaymentMethodsBottomSheet from './PaymentMethodsBottomSheet';

const { width, height } = Dimensions.get('window');

interface CheckoutScreenProps {
  donationAmount?: number;
  selectedOrganizations?: string[];
  onBack: () => void;
  donationBox?: any;
  fromPaymentResult?: boolean;
  onConfettiShown?: () => void;
}

// Mock data for CRWDS section
// const mockCrowds = [
//   { id: '1', name: 'Feed the hungry', color: '#1a8cff' },
//   { id: '2', name: 'Clean Water', color: '#00bcd4' },
// ];

export default function CheckoutScreen({
  donationAmount = 25,
  selectedOrganizations = [],
  onBack,
  donationBox,
  fromPaymentResult = false,
  onConfettiShown,
}: CheckoutScreenProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);
  const confettiShownRef = useRef(false);
  const [expandedCollectives, setExpandedCollectives] = useState<Set<number>>(new Set());
  const [collectiveDetails, setCollectiveDetails] = useState<Record<number, any>>({});
  const [loadingCollectives, setLoadingCollectives] = useState<Set<number>>(new Set());
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [causeToRemove, setCauseToRemove] = useState<{ id: number; name: string } | null>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedPauseOption, setSelectedPauseOption] = useState<number | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditSplitSheet, setShowEditSplitSheet] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showPauseConfirmModal, setShowPauseConfirmModal] = useState(false);
  const [showPaymentMethodsSheet, setShowPaymentMethodsSheet] = useState(false);

  // Get box_causes from donation box API (main source)
  const boxCauses = donationBox?.box_causes || [];
  // Extract cause objects from box_causes
  const causes = boxCauses.map((boxCause: any) => boxCause.cause).filter((cause: any) => cause != null);

  // Also get manual_causes for backward compatibility
  const manualCauses = donationBox?.manual_causes || [];
  const attributingCollectives = donationBox?.attributing_collectives || [];
  const previouslySupportedCauses = donationBox?.previously_supported_causes || [];
  const actualDonationAmount = parseFloat(donationBox?.monthly_amount || donationAmount.toString());

  // Use API data if available, otherwise fall back to selectedOrganizations
  const hasApiData = causes.length > 0 || manualCauses.length > 0 || attributingCollectives.length > 0;
  const totalCauses = causes.length || manualCauses.length;
  const totalCollectives = attributingCollectives.length;

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

  const fees = calculateFees(actualDonationAmount);
  const net = fees.net;
  const maxCapacity = Math.floor(net / 0.20);

  // Get current capacity from box_causes only
  const uniqueCauseIds = new Set(boxCauses.map((bc: any) => bc.cause?.id).filter(Boolean));
  const currentCapacity = uniqueCauseIds.size;

  // Fetch donation history for lifetime amount
  const { data: donationHistoryData } = useQuery({
    queryKey: ['donationHistory'],
    queryFn: getDonationHistory,
  });

  // Calculate lifetime amount from donation history
  const lifetimeAmount = donationHistoryData?.results?.reduce((sum: number, transaction: any) => {
    return sum + parseFloat(transaction.gross_amount || '0');
  }, 0) || 0;

  // Fetch previously supported causes
  const {
      data: previouslySupportedInfiniteData,
      fetchNextPage: fetchNextPreviouslySupported,
      hasNextPage: hasMorePreviouslySupported,
      isFetchingNextPage: isFetchingMorePreviouslySupported,
  } = useInfiniteQuery({
      queryKey: ['previouslySupportedCauses'],
      queryFn: ({ pageParam = 1 }) => getPreviouslySupportedCauses(pageParam as number),
      getNextPageParam: (lastPage: any) => {
          if (lastPage.next) {
              const url = new URL(lastPage.next);
              const page = url.searchParams.get('page');
              return page ? parseInt(page) : undefined;
          }
          return undefined;
      },
      initialPageParam: 1,
  });

  const displayPreviouslySupported = useMemo(() => {
      return previouslySupportedInfiniteData?.pages.flatMap((page: any) => page.results) || [];
  }, [previouslySupportedInfiniteData]);

  // Mutation to remove cause from box
  const removeCauseMutation = useMutation({
    mutationFn: (causeId: string) => removeCauseFromBox(causeId),
    onSuccess: () => {
      console.log('Cause removed successfully');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      queryClient.invalidateQueries({ queryKey: ['previouslySupportedCauses'] });
      setShowRemoveModal(false);
      setCauseToRemove(null);
    },
    onError: (error: any) => {
      console.error('Error removing cause:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to remove cause');
    },
  });

  // Mutation to add cause back to box
  const addCauseMutation = useMutation({
    mutationFn: (causeId: number) => addCausesToBox({ causes: [{ cause_id: causeId }] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      queryClient.invalidateQueries({ queryKey: ['previouslySupportedCauses'] });
    },
    onError: (error: any) => {
      console.error('Error adding cause:', error);
      Alert.alert('Error', error?.response?.data?.message || "Failed to add cause");
    },
  });

  // Mutation to cancel donation box
  const cancelDonationBoxMutation = useMutation({
    mutationFn: () => cancelDonationBox(),
    onSuccess: () => {
      console.log('Donation box cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      setShowPauseModal(false);
      Alert.alert('Success', 'Your subscription has been cancelled');
    },
    onError: (error: any) => {
      console.error('Error cancelling donation box:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to cancel subscription');
    },
  });

  const handleRemoveCause = (cause: any) => {
    setCauseToRemove({ id: cause.id, name: cause.name });
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = () => {
    if (causeToRemove) {
      removeCauseMutation.mutate(causeToRemove.id.toString());
    }
  };

  const handleCancelSubscription = () => {
    setShowCancelConfirmModal(true);
  };

  const handleConfirmCancel = () => {
    cancelDonationBoxMutation.mutate();
    setSelectedPauseOption(null);
    setShowCancelConfirmModal(false);
  };

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

  // Reset confetti ref when fromPaymentResult becomes false
  useEffect(() => {
    if (!fromPaymentResult) {
      confettiShownRef.current = false;
    }
  }, [fromPaymentResult]);

  // Show confetti when coming from successful payment (only once)
  useEffect(() => {
    if (fromPaymentResult && donationBox?.id && !confettiShownRef.current) {
      // Show confetti modal
      setShowCongratulationsModal(true);
      confettiShownRef.current = true;

      // Refetch donation box data
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      queryClient.refetchQueries({ queryKey: ['donationBox'] });

      // Fire confetti after modal appears
      setTimeout(() => {
        confettiRef.current?.start();
      }, 300);

      // Notify parent that confetti has been shown (to clear the flag)
      if (onConfettiShown) {
        onConfettiShown();
      }
    }
  }, [fromPaymentResult, donationBox?.id, onConfettiShown, queryClient]);

  const handleCloseCongratulationsModal = () => {
    setShowCongratulationsModal(false);
  };

  const handleToggleCollectiveDropdown = async (collectiveId: number) => {
    const isExpanded = expandedCollectives.has(collectiveId);
    const newExpanded = new Set(expandedCollectives);

    if (isExpanded) {
      newExpanded.delete(collectiveId);
      setLoadingCollectives(prev => {
        const newSet = new Set(prev);
        newSet.delete(collectiveId);
        return newSet;
      });
    } else {
      newExpanded.add(collectiveId);
      // Fetch collective details if not already cached
      if (!collectiveDetails[collectiveId]) {
        setLoadingCollectives(prev => new Set(prev).add(collectiveId));
        try {
          const details = await getCollectiveById(collectiveId.toString());
          setCollectiveDetails(prev => ({ ...prev, [collectiveId]: details }));
        } catch (error) {
          console.error('Error fetching collective details:', error);
        } finally {
          setLoadingCollectives(prev => {
            const newSet = new Set(prev);
            newSet.delete(collectiveId);
            return newSet;
          });
        }
      }
    }
    setExpandedCollectives(newExpanded);
  };

  const getOrganizationDescription = (orgName: string): string => {
    const descriptions: { [key: string]: string } = {
      "Hunger Initiative": "Fighting hunger in local communities",
      "Clean Water Initiative": "Providing clean water access",
      "Education for All": "Quality education access",
      "Animal Rescue Network": "Rescuing and caring for animals",
    };
    return descriptions[orgName] || "Making a positive impact in the community";
  };

  // Use organization names directly (like Vite Checkout) - fallback to local state if no API data
  const selectedOrganizationsList = hasApiData ? [] : selectedOrganizations;

  // Calculate equal distribution percentage and amount per item
  const hasCustomPercentages = boxCauses.some((bc: any) => bc.percentage != null && bc.percentage !== undefined);
  const totalItems = hasApiData
    ? (totalCauses + totalCollectives)
    : selectedOrganizationsList.length;
  const distributionPercentage =
    totalItems > 0
      ? Math.floor(100 / totalItems)
      : 0;
  const amountPerItem = totalItems > 0 ? (actualDonationAmount * 0.9) / totalItems : 0; // 90% after fees, divided equally


  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Donation Box Summary Card */}
          <View style={{ marginHorizontal: 16, }}>
            <DonationBoxSummaryCard
              monthlyAmount={Math.round(actualDonationAmount)}
              lifetimeAmount={Math.round(lifetimeAmount)}
              causesCount={totalCauses}
              collectivesCount={totalCollectives}
              currentCapacity={currentCapacity}
              maxCapacity={maxCapacity}
              donationBox={donationBox}
              onEditPayment={() => setShowPaymentMethodsSheet(true)}
              onAddCauses={() => navigation.navigate('ManageDonationBox' as never)}
            />
          </View>

          {/* Currently Supporting Section */}
          {causes.length > 0 && (
            <View style={styles.causesSection}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Currently Supporting</Text>
                </View>
                {causes.length > 1 && (
                  <TouchableOpacity
                    onPress={() => setShowEditSplitSheet(true)}
                    style={styles.editSplitButton}
                  >
                    <Pencil size={16} color="#374151" />
                    <Text style={styles.editSplitButtonText}>Edit Split</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.sectionSubtitle}>
                Supporting {causes.length} nonprofit{causes.length !== 1 ? 's' : ''}
              </Text>

              {/* Causes List from box_causes */}
              <View style={styles.causesList}>
                {causes.map((cause: any) => {
                  const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                  const initials = getInitials(cause.name || 'N');
                  return (
                    <TouchableOpacity
                      key={cause.id}
                      style={styles.causeCard}
                      onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
                    >
                      <View style={styles.causeCardContent}>
                        {/* Avatar */}
                        <Avatar size={48} style={{ ...styles.causeIcon, borderRadius: 8 }}>
                          <AvatarImage src={cause.image} />
                          <AvatarFallback
                            style={{ backgroundColor: avatarBgColor }}
                            textStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Cause Info */}
                        <View style={styles.causeInfo}>
                          <Text style={styles.causeName}>{cause.name}</Text>
                          <Text style={styles.causeDescription} numberOfLines={1}>
                            {cause.mission || cause.description || 'Making a positive impact in the community'}
                          </Text>
                        </View>

                        {/* Donation Info & Remove Button */}
                        <View style={styles.causeActions}>
                          <View style={styles.amountInfo}>
                            <Text style={styles.amountPercentage}>
                              {hasCustomPercentages
                                ? Number(boxCauses.find((bc: any) => bc.cause?.id === cause.id)?.percentage || 0).toFixed(1)
                                : distributionPercentage.toFixed(1)
                              }%
                            </Text>
                            <Text style={styles.amountPerMonth}>
                              ${hasCustomPercentages
                                ? ((net * Number(boxCauses.find((bc: any) => bc.cause?.id === cause.id)?.percentage || 0)) / 100).toFixed(2)
                                : amountPerItem.toFixed(2)
                              }/mo
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveCause(cause)}
                            style={styles.trashButton}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Fallback to selectedOrganizations if no API data */}
          {!hasApiData && selectedOrganizationsList.length > 0 && (
            <View style={styles.causesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Currently Supporting</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Supporting {selectedOrganizationsList.length} nonprofit{selectedOrganizationsList.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.causesList}>
                {selectedOrganizationsList.map((orgName: string, index: number) => {
                  const avatarBgColor = getConsistentColor(orgName, avatarColors);
                  const initials = getInitials(orgName);
                  return (
                    <View key={`${orgName}-${index}`} style={styles.causeCard}>
                      <View style={styles.causeCardContent}>
                        <View style={[styles.causeIcon, { backgroundColor: avatarBgColor }]}>
                          <Text style={styles.causeIconText}>
                            {initials}
                          </Text>
                        </View>
                        <View style={styles.causeInfo}>
                          <Text style={styles.causeName}>{orgName}</Text>
                          <Text style={styles.causeDescription} numberOfLines={1}>
                            {getOrganizationDescription(orgName)}
                          </Text>
                        </View>
                        <View style={styles.causeActions}>
                          <View style={styles.amountInfo}>
                            <Text style={styles.amountPercentage}>{distributionPercentage}%</Text>
                            <Text style={styles.amountPerMonth}>${amountPerItem.toFixed(2)}/mo</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Previously Supported Section */}
          <PreviouslySupportedCauses
            causes={displayPreviouslySupported}
            onAdd={(causeId) => addCauseMutation.mutate(causeId)}
            hasNextPage={hasMorePreviouslySupported}
            fetchNextPage={fetchNextPreviouslySupported}
            isFetchingNextPage={isFetchingMorePreviouslySupported}
          />

          {/* Request Nonprofit Section */}
          <View style={styles.requestSection}>
            <TouchableOpacity
              onPress={() => setShowRequestModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.requestText}>
                Don't see your nonprofit? Request it
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cancel Subscription Button */}
          <View style={styles.pauseSection}>
            <TouchableOpacity
              onPress={handleCancelSubscription}
              disabled={cancelDonationBoxMutation.isPending}
              activeOpacity={0.7}
            >
              <Text style={styles.pauseText}>
                {cancelDonationBoxMutation.isPending ? 'Cancelling...' : 'Cancel subscription completely'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

      </SafeAreaView>

      {/* <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>
              Confirm ${donationAmount}/month
            </Text>
          </TouchableOpacity>
          </View> */}

      {/* Congratulations Modal */}
      <Modal
        visible={showCongratulationsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseCongratulationsModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseCongratulationsModal}>
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

            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseCongratulationsModal}
                >
                  <Text style={styles.closeButtonText}>x</Text>
                </TouchableOpacity>

                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>Welcome to Checkout!</Text>
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
                        <Text style={styles.summaryCardTitle}>Monthly Donation Box</Text>
                        <Text style={styles.summaryCardAmount}>${actualDonationAmount}/month</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.supportingText}>
                    Supporting {totalItems} {totalItems === 1 ? 'organization' : 'organizations'} with your monthly donation.
                  </Text>

                  {/* Explore CRWD Button */}
                  {/* <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => navigation.navigate('Home' as never)}
                >
                  <Text style={styles.exploreButtonText}>
                    Explore CRWD
                  </Text>
                </TouchableOpacity> */}

                  {/* Download App Text */}
                  {/* <Text style={styles.downloadText}>
                  Download the app to track and update anytime.
                </Text> */}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Remove Cause Modal */}
      <Modal
        visible={showRemoveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowRemoveModal(false);
          setCauseToRemove(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowRemoveModal(false);
          setCauseToRemove(null);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.removeModalContent}>
                {/* Handle Bar */}
                <View style={styles.modalHandleBar}>
                  <View style={styles.modalHandle} />
                </View>

                {/* Content */}
                <View style={styles.removeModalBody}>
                  <Text style={styles.removeModalTitle}>Remove Cause?</Text>
                  <Text style={styles.removeModalDescription}>
                    Are you sure you want to remove <Text style={styles.removeModalBold}>{causeToRemove?.name}</Text> from your donation box? This action cannot be undone.
                  </Text>
                </View>

                {/* Footer Buttons */}
                <View style={styles.removeModalFooter}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowRemoveModal(false);
                      setCauseToRemove(null);
                    }}
                    disabled={removeCauseMutation.isPending}
                    style={[styles.removeModalButton, styles.removeModalCancelButton]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmRemove}
                    disabled={removeCauseMutation.isPending}
                    style={[styles.removeModalButton, styles.removeModalConfirmButton]}
                    activeOpacity={0.7}
                  >
                    {removeCauseMutation.isPending ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.removeModalConfirmText}>Removing...</Text>
                      </>
                    ) : (
                      <Text style={styles.removeModalConfirmText}>Remove</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCancelConfirmModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCancelConfirmModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.removeModalContent}>
                {/* Handle Bar */}
                <View style={styles.modalHandleBar}>
                  <View style={styles.modalHandle} />
                </View>

                {/* Content */}
                <View style={styles.removeModalBody}>
                  <Text style={styles.removeModalTitle}>Cancel Subscription?</Text>
                  <Text style={styles.removeModalDescription}>
                    Are you sure you want to cancel your subscription completely?
                  </Text>
                </View>

                {/* Footer Buttons */}
                <View style={styles.removeModalFooter}>
                  <TouchableOpacity
                    onPress={() => setShowCancelConfirmModal(false)}
                    disabled={cancelDonationBoxMutation.isPending}
                    style={[styles.removeModalButton, styles.removeModalCancelButton]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeModalCancelText}>No</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmCancel}
                    disabled={cancelDonationBoxMutation.isPending}
                    style={[styles.removeModalButton, styles.removeModalConfirmButton]}
                    activeOpacity={0.7}
                  >
                    {cancelDonationBoxMutation.isPending ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.removeModalConfirmText}>Cancelling...</Text>
                      </>
                    ) : (
                      <Text style={styles.removeModalConfirmText}>Yes, Cancel</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Pause Donations Modal */}
      <Modal
        visible={showPauseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowPauseModal(false);
          setSelectedPauseOption(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowPauseModal(false);
          setSelectedPauseOption(null);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.pauseModalContent}>
                {/* Header */}
                <View style={styles.pauseModalHeader}>
                  <View style={styles.pauseModalHeaderContent}>
                    <Text style={styles.pauseModalTitle}>Pause Your Donations</Text>
                    <Text style={styles.pauseModalSubtitle}>
                      We understand that life happens. Choose how long you'd like to pause your recurring donations.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPauseModal(false);
                      setSelectedPauseOption(null);
                    }}
                    style={styles.pauseModalCloseButton}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.pauseModalBody}>
                  {/* Pause Options */}
                  <View style={styles.pauseOptionsContainer}>
                    {/* Option 1: Skip this month */}
                    <TouchableOpacity
                      onPress={() => setSelectedPauseOption(1)}
                      style={[
                        styles.pauseOption,
                        selectedPauseOption === 1 && styles.pauseOptionSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pauseOptionContent}>
                        <Text style={styles.pauseOptionText}>Skip this month</Text>
                        <Text style={styles.pauseOptionSubtext}>Resume next month</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Option 2: Pause for 2 months */}
                    <TouchableOpacity
                      onPress={() => setSelectedPauseOption(2)}
                      style={[
                        styles.pauseOption,
                        selectedPauseOption === 2 && styles.pauseOptionSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pauseOptionContent}>
                        <Text style={styles.pauseOptionText}>Pause for 2 months</Text>
                        <Text style={styles.pauseOptionSubtext}>Resume in 2 months</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Option 3: Pause for 3 months */}
                    <TouchableOpacity
                      onPress={() => setSelectedPauseOption(3)}
                      style={[
                        styles.pauseOption,
                        selectedPauseOption === 3 && styles.pauseOptionSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pauseOptionContent}>
                        <Text style={styles.pauseOptionText}>Pause for 3 months</Text>
                        <Text style={styles.pauseOptionSubtext}>Resume in 3 months</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Cancel Subscription Link */}
                  {/* <View style={styles.pauseCancelSection}>
                  <TouchableOpacity
                    onPress={handleCancelSubscription}
                    disabled={cancelDonationBoxMutation.isPending}
                    style={styles.pauseCancelButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pauseCancelText}>
                      {cancelDonationBoxMutation.isPending ? 'Cancelling...' : 'Cancel subscription completely'}
                    </Text>
                  </TouchableOpacity>
                </View> */}
                </View>

                {/* Footer */}
                <View style={styles.pauseModalFooter}>
                  <TouchableOpacity
                    onPress={handleCancelSubscription}
                    disabled={cancelDonationBoxMutation.isPending}
                    style={styles.pauseModalCancelButton}
                    activeOpacity={0.7}
                  >
                    {cancelDonationBoxMutation.isPending ? (
                      <Text style={styles.pauseModalCancelText}>Cancelling...</Text>
                    ) : (
                      <Text style={styles.pauseModalCancelText}>Cancel subscription completely</Text>
                    )}
                  </TouchableOpacity>
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

      {/* Edit Donation Split Bottom Sheet */}
      {(() => {
        console.log('=== CheckoutScreen: Preparing causes for Edit Split ===');
        console.log('causes:', causes);
        console.log('causes.length:', causes?.length);
        console.log('causes is array:', Array.isArray(causes));
        console.log('boxCauses:', boxCauses);
        console.log('boxCauses.length:', boxCauses?.length);
        console.log('donationBox:', donationBox);
        console.log('actualDonationAmount:', actualDonationAmount);
        console.log('showEditSplitSheet:', showEditSplitSheet);

        const causesForEditSplit = (causes || [])
          .filter((cause: any, index: number) => {
            console.log(`Filtering cause ${index}:`, cause);
            const isValid = cause != null && cause.id != null;
            console.log(`Cause ${index} isValid:`, isValid);
            return isValid;
          })
          .map((cause: any, index: number) => {
            const mappedCause = {
              id: cause.id,
              name: cause.name || 'Unknown Cause',
              image: cause.image || cause.logo || '',
              logo: cause.logo || cause.image || '',
            };
            console.log(`Mapped cause ${index}:`, mappedCause);
            return mappedCause;
          });

        console.log('Final causesForEditSplit:', causesForEditSplit);
        console.log('causesForEditSplit.length:', causesForEditSplit.length);

        return (
          <EditDonationSplitBottomSheet
            isOpen={showEditSplitSheet}
            onClose={() => {
              console.log('Closing Edit Split sheet from CheckoutScreen');
              setShowEditSplitSheet(false);
            }}
            causes={causesForEditSplit}
            monthlyAmount={actualDonationAmount}
            boxCauses={boxCauses}
          />
        );
      })()}

      {/* Payment Methods Bottom Sheet */}
      <PaymentMethodsBottomSheet
        isOpen={showPaymentMethodsSheet}
        onClose={() => setShowPaymentMethodsSheet(false)}
      />

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  blueSummaryCard: {
    backgroundColor: '#2563eb',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    paddingBottom: 32,
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  amountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  perMonthSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perMonthText: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 4,
    fontFamily: 'Outfit-Regular',
  },
  helpIcon: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    marginLeft: 4,
  },
  helpIconGray: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },
  settingsIcon: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 4,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    fontFamily: 'Outfit-Regular',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ffffff',
    opacity: 0.2,
  },
  manageSection: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 16,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  manageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    fontFamily: 'Outfit-Medium',
  },
  causesSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  causeImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  causeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  causeInfoContent: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontFamily: 'Outfit-Regular',
  },
  causesList: {
    marginBottom: 32,
    gap: 12,
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
    // marginBottom: 12,
  },
  causeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 8,
  },
  causeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  causeIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    // paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  causeImage: {
    width: 48,
    height: 48,
  },
  causeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  causeAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
  },
  causeInfo: {
    flex: 1,
  },
  causeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  causeDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  causeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amountPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  amountPerMonth: {
    fontSize: 14,
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
  causePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
    fontFamily: 'Outfit-SemiBold',
  },
  crowdsSection: {
    paddingHorizontal: 32,
  },
  crowdGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  crowdItem: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crowdInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
  },
  paymentSection: {
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Medium',
  },
  cardExpiry: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit-Medium',
  },
  nextPaymentSection: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  nextPaymentDate: {
    fontSize: 16,
    color: '#374151',
    marginTop: 8,
    fontFamily: 'Outfit-Regular',
  },
  giveTogetherCard: {
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  giveTogetherText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Outfit-Regular',
  },
  learnMoreLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  addMoreCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addMoreTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Outfit-Medium',
  },
  addMoreDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    fontFamily: 'Outfit-Regular',
  },
  taxNote: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
    fontFamily: 'Outfit-Regular',
  },
  addMoreButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Outfit-SemiBold',
  },
  noCausesMessage: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCausesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
    fontFamily: 'Outfit-Medium',
  },
  noCausesSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  actionButtons: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  confirmButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Outfit-SemiBold',
  },
  oneTimeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  oneTimeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    fontFamily: 'Outfit-Medium',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 20,
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
    // width: 32,
    // height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: 'bold',
    fontFamily: 'Outfit-Bold',
  },
  modalBody: {
    alignItems: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  successIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Regular',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-SemiBold',
  },
  summaryCardAmount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  supportingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Outfit-Regular',
  },
  exploreButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  downloadText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
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
  trashButton: {
    padding: 4,
    // marginLeft: 8,
  },
  requestSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestText: {
    fontSize: 14,
    color: '#1600ff',
    textDecorationLine: 'underline',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  pauseSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Outfit-Medium',
  },
  removeModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '90%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHandleBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 6,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  removeModalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  },
  removeModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
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
  pauseModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '90%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  pauseModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pauseModalHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  pauseModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  pauseModalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
    fontFamily: 'Outfit-Regular',
  },
  pauseModalCloseButton: {
    padding: 4,
  },
  pauseModalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pauseOptionsContainer: {
    gap: 8,
  },
  pauseOption: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  pauseOptionSelected: {
    borderColor: '#1600ff',
    backgroundColor: '#EFF6FF',
  },
  pauseOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pauseOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  pauseOptionSubtext: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  pauseCancelSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pauseCancelButton: {
    width: '100%',
    paddingVertical: 6,
  },
  pauseCancelText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Outfit-Medium',
  },
  pauseModalFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  pauseModalCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseModalCancelText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
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
