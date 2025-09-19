import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import DonationStep2 from '../components/donation/DonationStep2';
import DonationStep3 from '../components/donation/DonationStep3';
import OneTimeDonation from '../components/donation/OneTimeDonation';
import CheckoutScreen from '../components/donation/CheckoutScreen';
import PaymentSection from '../components/donation/PaymentSection';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryBlue } from '../Constants/Colors';


const { width } = Dimensions.get('window');

export default function DonationScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'setup' | 'onetime'>('setup');
  const [checkout, setCheckout] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [donationAmount, setDonationAmount] = useState(7);
  const [step, setStep] = useState(1);
  const [inputValue, setInputValue] = useState('7');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setDonationAmount(roundedValue);
    setInputValue(roundedValue.toString());
  };

  if (checkout) {
    return (
      <CheckoutScreen
        donationAmount={donationAmount}
        selectedOrganizations={selectedOrganizations}
        onBack={() => setCheckout(false)}
      />
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 && activeTab !== 'onetime' ? (
          <TouchableOpacity
            onPress={() => setStep(s => s - 1)}
            style={styles.headerButton}
          >
            <ChevronLeft  color="#374151"  />
          </TouchableOpacity>
        )  : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            {/* <Text style={styles.closeIcon}>×</Text> */}
            <ChevronLeft color='#374151' />
          </TouchableOpacity>
        )} 

        <Text style={styles.headerTitle}>Donation Box</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'setup' && styles.activeTab
            ]}
            onPress={() => {
              setActiveTab('setup');
              setStep(1);
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'setup' && styles.activeTabText
            ]}>
              Set up donation box
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'onetime' && styles.activeTab
            ]}
            onPress={() => setActiveTab('onetime')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'onetime' && styles.activeTabText
            ]}>
              One-Time Donation
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'onetime' ? (
            <OneTimeDonation
              setCheckout={setCheckout}
              selectedOrganizations={selectedOrganizations}
              setSelectedOrganizations={setSelectedOrganizations}
            />
          ) : (
            <>
              {step === 1 ? (
                <View style={styles.stepContent}>
                  {/* Set Monthly Donation Amount Section */}
                  <View style={styles.amountCard}>
                    <Text style={styles.amountCardTitle}>
                      Set monthly donation amount
                      </Text>
                    <Text style={styles.amountCardDescription}>
                      Set one monthly amount and we'll split it across causes
                      you're passionate about. You can edit at any time.
                    </Text>

                    {/* Amount Selector */}
                    <View style={styles.amountSelectorContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          if (donationAmount > 5) {
                            const newAmount = donationAmount - 1;
                            setDonationAmount(newAmount);
                            setInputValue(newAmount.toString());
                          }
                        }}
                        style={styles.amountButton}
                      >
                        <Text style={styles.minusIcon}>−</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.amountDisplay}>
                        <Text style={styles.amountValue}>${donationAmount}</Text>
                        <Text style={styles.amountLabel}>per month</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          const newAmount = donationAmount + 1;
                          setDonationAmount(newAmount);
                          setInputValue(newAmount.toString());
                        }}
                        style={styles.amountButton}
                      >
                        <Plus size={20} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Choose Organizations Section */}
                  <View style={styles.organizationsCard}>
                    <Text style={styles.organizationsTitle}>
                      Choose organizations to support
                    </Text>

                    {/* Organization List */}
                    <View style={styles.organizationsList}>
                      {/* Hunger Initiative */}
                      <TouchableOpacity
                        style={[
                          styles.organizationItem,
                          selectedOrganizations.includes('Hunger Initiative') && styles.selectedOrganizationItem
                        ]}
                        onPress={() => {
                          if (selectedOrganizations.includes('Hunger Initiative')) {
                            setSelectedOrganizations(selectedOrganizations.filter(org => org !== 'Hunger Initiative'));
                          } else {
                            setSelectedOrganizations([...selectedOrganizations, 'Hunger Initiative']);
                          }
                        }}
                      >
                        <View style={[styles.orgAvatar, { backgroundColor: '#fed7aa' }]}>
                          <Text style={[styles.orgAvatarText, { color: '#ea580c' }]}>H</Text>
                        </View>
                        <View style={styles.orgInfo}>
                          <Text style={styles.orgName}>Hunger Initiative</Text>
                          <Text style={styles.orgDescription}>
                            Fighting hunger in local communities
                          </Text>
                        </View>
                        <View style={[
                          styles.checkbox,
                          selectedOrganizations.includes('Hunger Initiative') && styles.checkedBox
                        ]}>
                          {selectedOrganizations.includes('Hunger Initiative') && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Clean Water Initiative */}
                      <TouchableOpacity
                        style={[
                          styles.organizationItem,
                          selectedOrganizations.includes('Clean Water Initiative') && styles.selectedOrganizationItem
                        ]}
                        onPress={() => {
                          if (selectedOrganizations.includes('Clean Water Initiative')) {
                            setSelectedOrganizations(selectedOrganizations.filter(org => org !== 'Clean Water Initiative'));
                          } else {
                            setSelectedOrganizations([...selectedOrganizations, 'Clean Water Initiative']);
                          }
                        }}
                      >
                        <View style={[styles.orgAvatar, { backgroundColor: '#dbeafe' }]}>
                          <Text style={[styles.orgAvatarText, { color: '#2563eb' }]}>C</Text>
                        </View>
                        <View style={styles.orgInfo}>
                          <Text style={styles.orgName}>Clean Water Initiative</Text>
                          <Text style={styles.orgDescription}>
                            Providing clean water access
                          </Text>
                        </View>
                        <View style={[
                          styles.checkbox,
                          selectedOrganizations.includes('Clean Water Initiative') && styles.checkedBox
                        ]}>
                          {selectedOrganizations.includes('Clean Water Initiative') && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                      </View>
                      </TouchableOpacity>

                      {/* Education for All */}
                      <TouchableOpacity
                        style={[
                          styles.organizationItem,
                          selectedOrganizations.includes('Education for All') && styles.selectedOrganizationItem
                        ]}
                        onPress={() => {
                          if (selectedOrganizations.includes('Education for All')) {
                            setSelectedOrganizations(selectedOrganizations.filter(org => org !== 'Education for All'));
                          } else {
                            setSelectedOrganizations([...selectedOrganizations, 'Education for All']);
                          }
                        }}
                      >
                        <View style={[styles.orgAvatar, { backgroundColor: '#dcfce7' }]}>
                          <Text style={[styles.orgAvatarText, { color: '#16a34a' }]}>E</Text>
                        </View>
                        <View style={styles.orgInfo}>
                          <Text style={styles.orgName}>Education for All</Text>
                          <Text style={styles.orgDescription}>
                            Quality education access
                      </Text>
                    </View>
                        <View style={[
                          styles.checkbox,
                          selectedOrganizations.includes('Education for All') && styles.checkedBox
                        ]}>
                          {selectedOrganizations.includes('Education for All') && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Related Section */}
                      <View style={styles.relatedSection}>
                        <Text style={styles.relatedTitle}>Related</Text>
                        
                        {/* Animal Rescue Network */}
                        <TouchableOpacity
                          style={[
                            styles.organizationItem,
                            selectedOrganizations.includes('Animal Rescue Network') && styles.selectedOrganizationItem
                          ]}
                          onPress={() => {
                            if (selectedOrganizations.includes('Animal Rescue Network')) {
                              setSelectedOrganizations(selectedOrganizations.filter(org => org !== 'Animal Rescue Network'));
                            } else {
                              setSelectedOrganizations([...selectedOrganizations, 'Animal Rescue Network']);
                            }
                          }}
                        >
                          <View style={[styles.orgAvatar, { backgroundColor: '#e9d5ff' }]}>
                            <Text style={[styles.orgAvatarText, { color: '#9333ea' }]}>A</Text>
                          </View>
                          <View style={styles.orgInfo}>
                            <Text style={styles.orgName}>Animal Rescue Network</Text>
                            <Text style={styles.orgDescription}>
                              Rescuing and caring for animals
                            </Text>
                          </View>
                          <View style={[
                            styles.checkbox,
                            selectedOrganizations.includes('Animal Rescue Network') && styles.checkedBox
                          ]}>
                            {selectedOrganizations.includes('Animal Rescue Network') && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              // ) : step === 2 ? (
              //   <DonationStep2
              //     selectedOrganizations={selectedOrganizations}
              //     setSelectedOrganizations={setSelectedOrganizations}
              //     setStep={setStep}
              //   />
              ) : step === 2 ? (
                <DonationStep3
                  setCheckout={setCheckout}
                  selectedOrganizations={selectedOrganizations}
                  setSelectedOrganizations={setSelectedOrganizations}
                  setStep={setStep}
                  donationAmount={donationAmount}
                  selectedPaymentMethod={selectedPaymentMethod}
                  setSelectedPaymentMethod={setSelectedPaymentMethod}
                />
              ) : null}
            </>
          )}
        </ScrollView>

        {/* Footer - Only show for step 1 */}

      </View>
    {/* </SafeAreaView> */}
    {activeTab === 'setup' && step === 1 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryContent}>
              <View>
                <Text style={styles.summaryAmount}>${donationAmount} per month</Text>
                <Text style={styles.summaryCount}>
                  {selectedOrganizations.length} organizations selected
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setStep(2)}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Text style={styles.nextButtonIcon}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

{activeTab === 'setup' && step === 2 && (
          <View style={styles.footer}>     
          <TouchableOpacity
            onPress={() => setCheckout(true)}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonText}>Confirm your donation</Text>
          </TouchableOpacity>
        </View>
          
        )}

        {/* {activeTab === 'setup' && step === 3 && (
          <View style={styles.footer}>
            <View style={styles.nextSection}>
              <PaymentSection setCheckout={setCheckout} amount={7} />
            </View>
          </View>
        )} */}

{/* {activeTab === 'onetime' && (
          <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => setCheckout(true)}
            style={styles.donateButton}
          >
            <Text style={styles.donateButtonText}>
              Donate ${donationAmount} Now
            </Text>
          </TouchableOpacity>
          </View>
        )} */}
        </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
    // backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5
  },
  headerTitle: {
    flex: 1,
    // textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  closeIcon: {
    fontSize: 20,
    color: '#374151',
    fontWeight: 'bold',
  },
  minusIcon: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  activeTab: {
    backgroundColor: PrimaryBlue,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  amountCard: {
    backgroundColor: '#eff6ff',
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
  amountCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  amountCardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  amountSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  amountButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountDisplay: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 18,
    color: '#6b7280',
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
  selectedOrganizationItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#2563eb',
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
  relatedSection: {
    marginTop: 24,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryBar: {
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
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  nextSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    color: '#6b7280',
  },
  nextButton: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  nextButtonIcon: {
    fontSize: 16,
    color: '#ffffff',
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
  selectedCount: {
    fontSize: 16,
    color: '#6b7280',
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
