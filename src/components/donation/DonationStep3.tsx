import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { Trash2, Bookmark } from 'lucide-react-native';
import { CROWDS, RECENTS, SUGGESTED, Organization } from '../../Constants/organizations';
import PaymentSection from './PaymentSection';

interface DonationStep3Props {
  selectedOrganizations: string[];
  setSelectedOrganizations: (orgs: string[]) => void;
  setCheckout: (checkout: boolean) => void;
  setStep: (step: number) => void;
}

export default function DonationStep3({
  selectedOrganizations,
  setSelectedOrganizations,
  setCheckout,
  setStep,
}: DonationStep3Props) {
  const [bookmarkedOrgs, setBookmarkedOrgs] = useState<string[]>([]);

  const getOrganizationById = (orgId: string): Organization | undefined => {
    return [...CROWDS, ...RECENTS, ...SUGGESTED].find(org => org.id === orgId);
  };

  const selectedOrgs = selectedOrganizations
    .map(id => getOrganizationById(id))
    .filter((org): org is Organization => !!org);

  const removeOrganization = (orgId: string) => {
    setSelectedOrganizations(selectedOrganizations.filter(id => id !== orgId));
  };

  const toggleBookmark = (orgId: string) => {
    if (bookmarkedOrgs.includes(orgId)) {
      setBookmarkedOrgs(bookmarkedOrgs.filter(id => id !== orgId));
    } else {
      setBookmarkedOrgs([...bookmarkedOrgs, orgId]);
    }
  };

  const renderOrganizationCard = (org: Organization) => {
    const isBookmarked = bookmarkedOrgs.includes(org.id);

    return (
      <View key={org.id} style={styles.orgCard}>
        <View style={styles.orgHeader}>
          <Image source={{ uri: org.imageUrl }} style={styles.orgImage} />
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{org.name}</Text>
            <Text style={styles.orgDesc}>{org.shortDesc}</Text>
          </View>
          <View style={styles.orgActions}>
            <TouchableOpacity
              onPress={() => toggleBookmark(org.id)}
              style={[styles.actionButton, isBookmarked && styles.bookmarkedButton]}
            >
              <Bookmark
                size={16}
                color={isBookmarked ? '#ffffff' : '#6b7280'}
                fill={isBookmarked ? '#ffffff' : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removeOrganization(org.id)}
              style={styles.actionButton}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Your Selection</Text>
        <Text style={styles.headerSubtitle}>
          {selectedOrgs.length} organization{selectedOrgs.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      {/* Selected Organizations */}
      <ScrollView style={styles.orgList} showsVerticalScrollIndicator={false}>
        {selectedOrgs.map(renderOrganizationCard)}

        {selectedOrgs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No organizations selected. Go back to add some causes to your donation box.
            </Text>
            <TouchableOpacity
              onPress={() => setStep(2)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add Organizations</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Distribution Info */}
      {selectedOrgs.length > 0 && (
        <>
          <View style={styles.distributionInfo}>
            <Text style={styles.distributionTitle}>Distribution</Text>
            <Text style={styles.distributionText}>
              Your donation will be evenly distributed across all {selectedOrgs.length} organization{selectedOrgs.length !== 1 ? 's' : ''}.
            </Text>
            <Text style={styles.distributionPercentage}>
              Each organization receives: {Math.floor(100 / selectedOrgs.length)}%
            </Text>
          </View>

           {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          onPress={() => setStep(2)}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Add More</Text>
        </TouchableOpacity>
        </View>

          <PaymentSection setCheckout={setCheckout} amount={7} />
        </>
      )}

      {/* Action Buttons
      <View style={styles.actionSection}>
        <TouchableOpacity
          onPress={() => setStep(2)}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Add More</Text>
        </TouchableOpacity> */}

        {/* {selectedOrgs.length > 0 && (
          <TouchableOpacity
            onPress={() => setCheckout(true)}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue to Checkout</Text>
          </TouchableOpacity>
        )} */}
      {/* </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  orgList: {
    flex: 1,
  },
  orgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
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
  orgDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  orgActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkedButton: {
    backgroundColor: '#2563eb',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  distributionInfo: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  distributionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  distributionPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
