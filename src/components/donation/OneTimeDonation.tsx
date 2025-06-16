import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { Minus, Plus, Bookmark, Trash2 } from 'lucide-react-native';
import { CROWDS, RECENTS, SUGGESTED, Organization } from '../../Constants/organizations';
import PaymentSection from './PaymentSection';

interface OneTimeDonationProps {
  setCheckout: (checkout: boolean) => void;
  selectedOrganizations: string[];
  setSelectedOrganizations: (orgs: string[]) => void;
  show?: boolean
}

export default function OneTimeDonation({
  setCheckout,
  selectedOrganizations,
  setSelectedOrganizations,
  show=true
}: OneTimeDonationProps) {
  const [bookmarkedOrgs, setBookmarkedOrgs] = useState<string[]>([]);
  const [donationAmount, setDonationAmount] = useState(7);
  const [inputValue, setInputValue] = useState('7');

  const incrementDonation = () => {
    const newAmount = donationAmount + 1;
    setDonationAmount(newAmount);
    setInputValue(newAmount.toString());
  };

  const decrementDonation = () => {
    if (donationAmount > 1) {
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

  const getOrganizationById = (orgId: string): Organization | undefined => {
    return [...CROWDS, ...RECENTS, ...SUGGESTED].find(org => org.id === orgId);
  };

  const selectedOrgs = selectedOrganizations
    .map(id => getOrganizationById(id))
    .filter((org): org is Organization => !!org);

  const toggleOrganization = (orgId: string) => {
    if (selectedOrganizations.includes(orgId)) {
      setSelectedOrganizations(selectedOrganizations.filter(id => id !== orgId));
    } else {
      setSelectedOrganizations([...selectedOrganizations, orgId]);
    }
  };

  const toggleBookmark = (orgId: string) => {
    if (bookmarkedOrgs.includes(orgId)) {
      setBookmarkedOrgs(bookmarkedOrgs.filter(id => id !== orgId));
    } else {
      setBookmarkedOrgs([...bookmarkedOrgs, orgId]);
    }
  };

  const renderOrganizationCard = (org: Organization) => {
    const isSelected = selectedOrganizations.includes(org.id);
    const isBookmarked = bookmarkedOrgs.includes(org.id);

    return (
      <TouchableOpacity
        key={org.id}
        style={[styles.orgCard, isSelected && styles.selectedOrgCard]}
        onPress={() => toggleOrganization(org.id)}
      >
        <View style={styles.orgHeader}>
          <Image source={{ uri: org.imageUrl }} style={styles.orgImage} />
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{org.name}</Text>
            <Text style={styles.orgDesc}>{org.shortDesc}</Text>
          </View>
          <View style={styles.orgActions}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleBookmark(org.id);
              }}
              style={[styles.actionButton, isBookmarked && styles.bookmarkedButton]}
            >
              <Bookmark
                size={16}
                color={isBookmarked ? '#ffffff' : '#6b7280'}
                fill={isBookmarked ? '#ffffff' : 'none'}
              />
            </TouchableOpacity>
            <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Amount Section */}
      { show &&
      <View style={styles.amountSection}>
        <Text style={styles.amountTitle}>Donation Amount</Text>

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
          Minimum donation amount is $5
        </Text>
      </View> }

      {/* Selected Organizations Summary */}
      {/* {selectedOrgs.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedTitle}>
            Selected Organizations ({selectedOrgs.length})
          </Text>
          {selectedOrgs.map(org => (
            <View key={org.id} style={styles.selectedOrgCard}>
              <Image source={{ uri: org.imageUrl }} style={styles.selectedOrgImage} />
              <View style={styles.selectedOrgInfo}>
                <Text style={styles.selectedOrgName}>{org.name}</Text>
                <Text style={styles.selectedOrgAmount}>
                  ${Math.floor(donationAmount / selectedOrgs.length)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleOrganization(org.id)}
                style={styles.removeButton}
              >
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )} */}

      {/* Organizations List */}
      <View style={styles.orgSection}>
        {show && <Text style={styles.sectionTitle}>Choose Organizations</Text> }

        {show && <Text style={styles.subsectionTitle}>CROWDS</Text> }
        {show && CROWDS.map(renderOrganizationCard)} 

        <Text style={styles.subsectionTitle}>RECENT</Text>
        {RECENTS.map(renderOrganizationCard)}

        <Text style={styles.subsectionTitle}>SUGGESTED</Text>
        {SUGGESTED.map(renderOrganizationCard)}
      </View>

      {/* Donate Button */}
      <PaymentSection setCheckout={setCheckout} amount={donationAmount} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  amountSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  amountTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  selectedSection: {
    marginBottom: 24,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  selectedOrgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedOrgImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  selectedOrgInfo: {
    flex: 1,
  },
  selectedOrgName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedOrgAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgSection: {
    // marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  orgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  selectedOrgCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
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
    alignItems: 'center',
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
  donateSection: {
    paddingBottom: 40,
  },
  donateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
