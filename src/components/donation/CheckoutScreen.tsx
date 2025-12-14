import React, { useState, useEffect, useRef } from 'react';
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
import { X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getCollectiveById } from '../../services/api/crwd';
import { PrimaryBlue, SecondaryGrey } from '../../Constants/Colors';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import DonationBoxSummaryCard from './DonationBoxSummaryCard';
import { getDonationHistory } from '../../services/api/donation';
import { getNonprofitColor } from '../../lib/getNonprofitColor';

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

  // Get box_causes from donation box API (main source)
  const boxCauses = donationBox?.box_causes || [];
  // Extract cause objects from box_causes
  const causes = boxCauses.map((boxCause: any) => boxCause.cause).filter((cause: any) => cause != null);

  // Also get manual_causes for backward compatibility
  const manualCauses = donationBox?.manual_causes || [];
  const attributingCollectives = donationBox?.attributing_collectives || [];
  const actualDonationAmount = parseFloat(donationBox?.monthly_amount || donationAmount.toString());
  
  // Use API data if available, otherwise fall back to selectedOrganizations
  const hasApiData = causes.length > 0 || manualCauses.length > 0 || attributingCollectives.length > 0;
  const totalCauses = causes.length || manualCauses.length;
  const totalCollectives = 0; // No longer showing collectives

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
        <DonationBoxSummaryCard
          monthlyAmount={Math.round(actualDonationAmount)}
          lifetimeAmount={Math.round(lifetimeAmount)}
          causesCount={totalCauses}
          collectivesCount={totalCollectives}
          currentCapacity={currentCapacity}
          maxCapacity={maxCapacity}
          onEditAmount={() => navigation.navigate('ManageDonationBox' as never)}
        />

        {/* Currently Supporting Section */}
        {causes.length > 0 && (
          <View style={styles.causesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Currently Supporting</Text>
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
                  <View key={cause.id} style={styles.causeCard}>
                    <View style={styles.causeCardContent}>
                      {/* Avatar */}
                      <View style={[styles.causeIcon, { backgroundColor: avatarBgColor }]}>
                        <Text style={styles.causeIconText}>
                          {initials}
                        </Text>
                      </View>

                      {/* Cause Info */}
                      <View style={styles.causeInfo}>
                        <Text style={styles.causeName}>{cause.name}</Text>
                        <Text style={styles.causeDescription} numberOfLines={1}>
                          {cause.mission || cause.description || 'Making a positive impact in the community'}
                        </Text>
                      </View>

                      {/* Donation Info */}
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
          
          <TouchableWithoutFeedback onPress={() => {}}>
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
  },
  perMonthSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perMonthText: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 4,
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
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
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
  causePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
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
  },
  cardExpiry: {
    fontSize: 14,
    color: '#6b7280',
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
  },
  nextPaymentSection: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  nextPaymentDate: {
    fontSize: 16,
    color: '#374151',
    marginTop: 8,
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
  },
  learnMoreLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
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
  },
  addMoreDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  taxNote: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
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
  },
  noCausesSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
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
  },
  oneTimeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  oneTimeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
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
  },
  downloadText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
