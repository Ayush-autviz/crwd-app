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
} from 'react-native';
import { ChevronLeft, Check } from 'lucide-react-native';
import { CROWDS, RECENTS, SUGGESTED, Organization } from '../../Constants/organizations';
import ManageDonationBox from './ManageDonationBox';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface CheckoutScreenProps {
  donationAmount?: number;
  selectedOrganizations?: string[];
  onBack: () => void;
}

// Mock data for CRWDS section
const mockCrowds = [
  { id: '1', name: 'Feed the hungry', color: '#1a8cff' },
  { id: '2', name: 'Clean Water', color: '#00bcd4' },
];

export default function CheckoutScreen({
  donationAmount = 25,
  selectedOrganizations = [],
  onBack,
}: CheckoutScreenProps) {
  const [showManageDonationBox, setShowManageDonationBox] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);
  const navigation = useNavigation();

  // Show congratulations modal when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCongratulationsModal(true);
      // Fire confetti after modal appears
      setTimeout(() => {
        confettiRef.current?.start();
      }, 300);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCloseCongratulationsModal = () => {
    setShowCongratulationsModal(false);
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

  // Use selectedOrganizations prop - no fallback to mock data
  const orgNames = selectedOrganizations;

  const distributionPercentage = orgNames.length > 0 ? Math.floor(100 / orgNames.length) : 0;

  if (showManageDonationBox) {
    return (
      <ManageDonationBox
        amount={donationAmount}
        causes={orgNames.map(name => ({
          id: name,
          name: name,
          imageUrl: '',
          color: '#9333ea',
          shortDesc: getOrganizationDescription(name),
          description: getOrganizationDescription(name)
        }))}
        onBack={() => setShowManageDonationBox(false)}
      />
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donation Box</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Blue Summary Card */}
        <View style={styles.blueSummaryCard}>
          <View style={styles.amountSection}>
            <Text style={styles.amountText}>${donationAmount}</Text>
            <View style={styles.perMonthSection}>
              <Text style={styles.perMonthText}>per month</Text>
              <Text style={styles.helpIcon}>?</Text>
            </View>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{orgNames.length}</Text>
              <Text style={styles.statLabel}>Causes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockCrowds.length}</Text>
              <Text style={styles.statLabel}>CRWDS</Text>
            </View>
            <View style={styles.statDivider} />

            <View style={styles.manageSection}>
              <TouchableOpacity
                onPress={() => setShowManageDonationBox(true)}
                style={styles.manageButton}
              >
                <Text style={styles.settingsIcon}>⚙</Text>
                <Text style={styles.manageText}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Causes Section */}
        <View style={styles.causesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CAUSES</Text>
            {/* <Text style={styles.helpIconGray}>?</Text> */}
          </View>

          <View style={styles.causesList}>
            {orgNames.length > 0 ? (
              orgNames.map((orgName, index) => (
                <View key={`${orgName}-${index}`} style={styles.causeItem}>
                  <View style={[styles.causeAvatar, { backgroundColor: '#9333ea' }]}>
                    <Text style={styles.causeAvatarText}>
                      {orgName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.causeInfo}>
                    <Text style={styles.causeName}>{orgName}</Text>
                    <Text style={styles.causeDescription}>{getOrganizationDescription(orgName)}</Text>
                  </View>
                  <Text style={styles.causePercentage}>{distributionPercentage}%</Text>
                </View>
              ))
            ) : (
              <View style={styles.noCausesMessage}>
                <Text style={styles.noCausesText}>No organizations selected</Text>
                <Text style={styles.noCausesSubtext}>Go back to select organizations for your donation</Text>
              </View>
            )}
          </View>
        </View>

        {/* Want to give together? Card */}
        <View style={styles.giveTogetherCard}>
          <Text style={styles.giveTogetherText}>Want to give together? Turn this into a Giving Circle</Text>
          <TouchableOpacity>
            <Text style={styles.learnMoreLink}>Learn more</Text>
          </TouchableOpacity>
        </View>

        {/* Add more causes Card */}
        <View style={styles.addMoreCard}>
          <Text style={styles.addMoreTitle}>Add up to 45 more causes to this box</Text>
          <Text style={styles.addMoreDescription}>
            Allocations will automatically adjust for 100% distribution
          </Text>
          <Text style={styles.taxNote}>Donations are not tax deductible at this time</Text>
          <TouchableOpacity>
            <Text style={styles.learnMoreLink}>Learn More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMoreButton} onPress={() => navigation.navigate('Search' as never)}>
            <Text style={styles.addMoreButtonText}>+ Add More Causes</Text>
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
                  <Text style={styles.summaryCardAmount}>${donationAmount}/month</Text>
                </View>
              </View>
            </View>

            <Text style={styles.supportingText}>
              Supporting {selectedOrganizations.length} nonprofits with your monthly donation.
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
      </View>
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
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
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
    paddingHorizontal: 32,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  causesList: {
    marginBottom: 32,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  causeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  causeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
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
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  causeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  causePercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginLeft: 12,
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
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  giveTogetherText: {
    fontSize: 16,
    fontWeight: '500',
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
    fontSize: 18,
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
