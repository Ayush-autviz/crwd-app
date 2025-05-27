import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, HelpCircle, Settings } from 'lucide-react-native';
import { CROWDS, RECENTS, SUGGESTED, Organization } from '../../Constants/organizations';
import ManageDonationBox from './ManageDonationBox';

interface CheckoutScreenProps {
  donationAmount?: number;
  onBack: () => void;
}

// Mock data for demonstration
const mockSelectedOrganizations = ['1', '4', '7']; // Some organization IDs
const mockCrowds = [
  { id: '1', name: 'Feed the hungry', color: '#1a8cff' },
  { id: '2', name: 'Clean Water', color: '#00bcd4' },
];

export default function CheckoutScreen({
  donationAmount = 25,
  onBack,
}: CheckoutScreenProps) {
  const [showManageDonationBox, setShowManageDonationBox] = useState(false);

  const getOrganizationById = (orgId: string): Organization | undefined => {
    return [...CROWDS, ...RECENTS, ...SUGGESTED].find(org => org.id === orgId);
  };

  const selectedOrgs = mockSelectedOrganizations
    .map(id => getOrganizationById(id))
    .filter((org): org is Organization => !!org);

  const distributionPercentage = selectedOrgs.length > 0 ? Math.floor(100 / selectedOrgs.length) : 0;

  if (showManageDonationBox) {
    return (
      <ManageDonationBox
        amount={donationAmount}
        causes={selectedOrgs}
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
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donation Box</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Blue Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.amountSection}>
            <Text style={styles.amountText}>${donationAmount}</Text>
            <View style={styles.perMonthSection}>
              <Text style={styles.perMonthText}>per month</Text>
              <HelpCircle size={16} color="#ffffff" style={styles.helpIcon} />
            </View>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{selectedOrgs.length}</Text>
              <Text style={styles.statLabel}>Causes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockCrowds.length}</Text>
              <Text style={styles.statLabel}>CRWDS</Text>
            </View>
            <View style={styles.manageSection}>
              <TouchableOpacity
                onPress={() => setShowManageDonationBox(true)}
                style={styles.manageButton}
              >
                <Settings size={16} color="#ffffff" />
                <Text style={styles.manageText}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Causes Section */}
        <View style={styles.causesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CAUSES</Text>
            <HelpCircle size={16} color="#6b7280" />
          </View>

          <View style={styles.causesList}>
            {selectedOrgs.map((org) => (
              <View key={org.id} style={styles.causeItem}>
                <Image source={{ uri: org.imageUrl }} style={styles.causeImage} />
                <View style={styles.causeInfo}>
                  <Text style={styles.causeName}>{org.name}</Text>
                  <Text style={styles.causeDescription}>{org.shortDesc || org.description}</Text>
                </View>
                <Text style={styles.causePercentage}>{distributionPercentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CROWDS Section */}
        <View style={styles.crowdsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CRWDS</Text>
            <HelpCircle size={16} color="#6b7280" />
          </View>

          <View style={styles.crowdGrid}>
            {mockCrowds.map((crowd) => (
              <View
                key={crowd.id}
                style={[styles.crowdItem, { backgroundColor: crowd.color }]}
              >
                <Text style={styles.crowdInitial}>
                  {crowd.name.charAt(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
          <View style={styles.paymentCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNumber}>•••• •••• •••• 4242</Text>
              <Text style={styles.cardExpiry}>12/25</Text>
            </View>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Payment */}
        <View style={styles.nextPaymentSection}>
          <Text style={styles.sectionTitle}>NEXT PAYMENT</Text>
          <Text style={styles.nextPaymentDate}>January 26, 2024</Text>
        </View>

        {/* Action Buttons */}
      </ScrollView>

    </SafeAreaView>

          <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>
              Confirm ${donationAmount}/month
            </Text>
          </TouchableOpacity>
          </View>

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
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
    opacity: 0.8,
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
    alignItems: 'flex-end',
    paddingLeft: 16,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
});
