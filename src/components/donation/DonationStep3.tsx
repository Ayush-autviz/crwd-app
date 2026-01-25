import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { Country, State } from 'country-state-city';
import { Trash2, Bookmark, Heart } from 'lucide-react-native';
import { CROWDS, RECENTS, SUGGESTED, Organization } from '../../Constants/organizations';
import PaymentSection from './PaymentSection';
import { PrimaryBlue, SecondaryGrey } from '../../Constants/Colors';
import { CreditCard } from 'lucide-react-native';
// import { CreditCard } from 'lucide-react-native';

interface DonationStep3Props {
  selectedOrganizations: string[];
  setSelectedOrganizations: (orgs: string[]) => void;
  setCheckout: (checkout: boolean) => void;
  setStep: (step: number) => void;
  donationAmount: number;
  selectedPaymentMethod?: string;
  setSelectedPaymentMethod?: (method: string) => void;
}

export default function DonationStep3({
  selectedOrganizations,
  setSelectedOrganizations,
  setCheckout,
  setStep,
  donationAmount,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
}: DonationStep3Props) {
  const [bookmarkedOrgs, setBookmarkedOrgs] = useState<string[]>([]);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardAddress: '',
    country: '',
    state: '',
    zipCode: ''
  });

  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [statePickerVisible, setStatePickerVisible] = useState(false);

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

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
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

        {/* Payment Method Selection */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionTitle}>Select Payment Method</Text>
          <Text style={styles.paymentSectionSubtitle}>
            Choose a payment method to complete your donation.
          </Text>

          <View style={styles.paymentOptions}>
            {/* Apple Pay Option */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'apple-pay' && styles.selectedPaymentOption
                ]}
                onPress={() => setSelectedPaymentMethod?.('apple-pay')}
              >
                <View style={styles.paymentIconContainer}>
                  <Image
                    source={require('../../assets/logo/apple-pay.png')}
                    style={styles.applePayIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.paymentOptionText}>Apple Pay</Text>
                {selectedPaymentMethod === 'apple-pay' && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Credit/Debit Card Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'card' && styles.selectedPaymentOption
              ]}
              onPress={() => setSelectedPaymentMethod?.('card')}
            >
              <View style={styles.paymentIconContainer}>
                <CreditCard size={20} color="#374151" />
              </View>
              <Text style={styles.paymentOptionText}>Credit or Debit Card</Text>
              {selectedPaymentMethod === 'card' && (
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Card Details Form */}
          {selectedPaymentMethod === 'card' && (
            <View style={styles.cardDetailsContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={SecondaryGrey}
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardDetails.cardNumber}
                  onChangeText={(text) => setCardDetails({
                    ...cardDetails,
                    cardNumber: formatCardNumber(text)
                  })}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor={SecondaryGrey}
                    keyboardType="numeric"
                    maxLength={5}
                    value={cardDetails.expiryDate}
                    onChangeText={(text) => setCardDetails({
                      ...cardDetails,
                      expiryDate: formatExpiryDate(text)
                    })}
                  />
                </View>

                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={SecondaryGrey}
                    keyboardType="numeric"
                    maxLength={3}
                    value={cardDetails.cvv}
                    onChangeText={(text) => setCardDetails({
                      ...cardDetails,
                      cvv: text
                    })}
                  />
                </View>
              </View>


              {/* Country and State */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TouchableOpacity
                    style={[styles.input, { justifyContent: 'center' }]}
                    onPress={() => setCountryPickerVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: cardDetails.country ? '#111827' : SecondaryGrey, flexShrink: 1 }} numberOfLines={1} ellipsizeMode='tail'>
                      {cardDetails.country ? (Country.getCountryByCode(cardDetails.country)?.name || cardDetails.country) : 'Select Country'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TouchableOpacity
                    style={[styles.input, { justifyContent: 'center' }]}
                    onPress={() => cardDetails.country && setStatePickerVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: cardDetails.state ? '#111827' : SecondaryGrey, flexShrink: 1 }} numberOfLines={1} ellipsizeMode='tail'>
                      {!cardDetails.country ? 'Select State' : (cardDetails.state ? (State.getStateByCodeAndCountry(cardDetails.state, cardDetails.country)?.name || cardDetails.state) : 'Select State')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Zip Code */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Zip Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12345"
                  keyboardType="numeric"
                  placeholderTextColor={SecondaryGrey}
                  maxLength={10}
                  value={cardDetails.zipCode}
                  onChangeText={(text) => {
                    const value = text.replace(/\D/g, '');
                    if (value.length <= 10) {
                      setCardDetails({ ...cardDetails, zipCode: value })
                    }
                  }}
                />
              </View>

            </View>
          )}
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      {countryPickerVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setCountryPickerVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {Country.getAllCountries().map((c) => (
                <TouchableOpacity
                  key={c.isoCode}
                  style={styles.modalItem}
                  onPress={() => {
                    setCardDetails({ ...cardDetails, country: c.isoCode, state: '' })
                    setCountryPickerVisible(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* State Picker Modal */}
      {statePickerVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStatePickerVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {State.getStatesOfCountry(cardDetails.country).map((s) => (
                <TouchableOpacity
                  key={s.isoCode}
                  style={styles.modalItem}
                  onPress={() => {
                    setCardDetails({ ...cardDetails, state: s.isoCode })
                    setStatePickerVisible(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

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
    fontFamily: 'Outfit-Bold',
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
    fontFamily: 'Outfit-SemiBold',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'Outfit-SemiBold',
  },
  orgDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-SemiBold',
  },
  distributionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Outfit-Regular',
  },
  distributionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    fontFamily: 'Outfit-SemiBold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 500,
    left: 0,
    right: 0,
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    maxHeight: '70%',
    backgroundColor: 'white',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 16
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: '#E5E7EB'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  modalClose: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB'
  },
  modalItemText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-SemiBold',
  },
  paymentSection: {
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
  paymentSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'Outfit-SemiBold',
  },
  paymentSectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontFamily: 'Outfit-Regular',
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  selectedPaymentOption: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  paymentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  applePayIcon: {
    width: 20,
    height: 20,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit-Medium',
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Outfit-Bold',
  },
  creditCardIcon: {
    fontSize: 16,
  },
  cardDetailsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
