import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { Trash2, Bookmark, Heart } from 'lucide-react-native';
import { CROWDS, RECENTS, SUGGESTED, Organization } from '../../Constants/organizations';
import PaymentSection from './PaymentSection';
import { PrimaryBlue } from '../../Constants/Colors';

interface DonationStep3Props {
  selectedOrganizations: string[];
  setSelectedOrganizations: (orgs: string[]) => void;
  setCheckout: (checkout: boolean) => void;
  setStep: (step: number) => void;
  donationAmount: number;
}

export default function DonationStep3({
  selectedOrganizations,
  setSelectedOrganizations,
  setCheckout,
  setStep,
  donationAmount,
}: DonationStep3Props) {
  const [bookmarkedOrgs, setBookmarkedOrgs] = useState<string[]>([]);

  const getOrganizationDescription = (orgName: string): string => {
    const descriptions: { [key: string]: string } = {
      "Hunger Initiative": "Fighting hunger in local communities",
      "Clean Water Initiative": "Providing clean water access",
      "Education for All": "Quality education access",
      "Animal Rescue Network": "Rescuing and caring for animals",
    };
    return descriptions[orgName] || "Making a positive impact in the community";
  };

  const removeOrganization = (orgName: string) => {
    setSelectedOrganizations(selectedOrganizations.filter(name => name !== orgName));
  };

  const toggleBookmark = (orgName: string) => {
    if (bookmarkedOrgs.includes(orgName)) {
      setBookmarkedOrgs(bookmarkedOrgs.filter(name => name !== orgName));
    } else {
      setBookmarkedOrgs([...bookmarkedOrgs, orgName]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Selected Organizations Section */}
        <View style={styles.organizationsCard}>
          <Text style={styles.organizationsTitle}>
            Selected Organizations
          </Text>

          {/* Organization List */}
          <View style={styles.organizationsList}>
            {selectedOrganizations.map((orgName: string, index: number) => (
              <View
                key={`${orgName}-${index}`}
                style={styles.organizationItem}
              >
                <View style={[styles.orgAvatar, { backgroundColor: '#dbeafe' }]}>
                  <Text style={[styles.orgAvatarText, { color: '#2563eb' }]}>
                    {orgName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.orgInfo}>
                  <Text style={styles.orgName}>{orgName}</Text>
                  <Text style={styles.orgDescription}>
                    {getOrganizationDescription(orgName)}
                  </Text>
                </View>
                <View style={styles.orgActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => toggleBookmark(orgName)}
                  >
                    <Heart
                      size={20}
                      color={bookmarkedOrgs.includes(orgName) ? 'red' : '#6b7280'}
                      fill={bookmarkedOrgs.includes(orgName) ? 'red' : 'none'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeOrganization(orgName)}
                    style={styles.actionButton}
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Distribution Details */}
        <View style={styles.distributionCard}>
          <Text style={styles.distributionTitle}>
            Distribution
          </Text>
          <Text style={styles.distributionDescription}>
            Your ${donationAmount} becomes ${(donationAmount * 0.9).toFixed(2)}{" "}
            after fees, split evenly across causes. Your donation will be evenly
            distributed across all {selectedOrganizations.length} organizations.
          </Text>
          <Text style={styles.distributionAmount}>
            Each organization receives: $
            {selectedOrganizations.length > 0
              ? (donationAmount / selectedOrganizations.length).toFixed(2)
              : "0.00"}{" "}
            per month
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {/* <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => setCheckout(true)}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmButtonText}>
            Confirm your donation
          </Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
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
  orgActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributionCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  distributionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  distributionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  distributionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
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
  },
});
