import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ArrowLeft, X, Minus, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import DonationStep2 from '../components/donation/DonationStep2';
import DonationStep3 from '../components/donation/DonationStep3';
import OneTimeDonation from '../components/donation/OneTimeDonation';
import CheckoutScreen from '../components/donation/CheckoutScreen';


const { width } = Dimensions.get('window');

export default function DonationScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'setup' | 'onetime'>('setup');
  const [checkout, setCheckout] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [donationAmount, setDonationAmount] = useState(7);
  const [step, setStep] = useState(1);
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

  if (checkout) {
    return (
      <CheckoutScreen
        donationAmount={donationAmount}
        onBack={() => setCheckout(false)}
      />
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 && activeTab !== 'onetime' ? (
          <TouchableOpacity
            onPress={() => setStep(s => s - 1)}
            style={styles.headerButton}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <X size={20} color="#374151" />
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
                  {/* Welcome Card */}
                  <View style={styles.welcomeCard}>
                    <View style={styles.welcomeHeader}>
                      <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>$</Text>
                      </View>
                      <Text style={styles.welcomeTitle}>
                        Welcome to your donation box
                      </Text>
                    </View>

                    <Text style={styles.welcomeDescription}>
                      Your donation box makes giving back easy! Just set your
                      price and you can add as many of your favorite causes at
                      any time. Your donation will be evenly distributed across
                      all of the organizations in your box.
                    </Text>

                    {/* Amount Selector */}
                    <View style={styles.amountSection}>
                      <Text style={styles.amountTitle}>
                        Enter monthly donation
                      </Text>

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
                        Input amount over $5
                      </Text>
                    </View>

                    {/* Security Message */}
                    <View style={styles.securityMessage}>
                      <View style={styles.checkIcon}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                      <Text style={styles.securityText}>
                        Your donation is protected and guaranteed.{' '}
                        <Text style={styles.learnMore}>Learn More</Text>
                      </Text>
                    </View>
                  </View>
                </View>
              ) : step === 2 ? (
                <DonationStep2
                  selectedOrganizations={selectedOrganizations}
                  setSelectedOrganizations={setSelectedOrganizations}
                  setStep={setStep}
                />
              ) : step === 3 ? (
                <DonationStep3
                  setCheckout={setCheckout}
                  selectedOrganizations={selectedOrganizations}
                  setSelectedOrganizations={setSelectedOrganizations}
                  setStep={setStep}
                />
              ) : null}
            </>
          )}
        </ScrollView>

        {/* Footer - Only show for step 1 */}

      </View>
    </SafeAreaView>
    {activeTab === 'setup' && step === 1 && (
          <View style={styles.footer}>
            <View style={styles.nextSection}>
              <Text style={styles.nextText}>Now let's add some causes</Text>
              <TouchableOpacity
                onPress={() => setStep(2)}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

{activeTab === 'setup' && step === 2 && (
          <View style={styles.footer}>
        <View style={styles.nextSection}>
          <Text style={styles.selectedCount}>
            {selectedOrganizations.length} organization{selectedOrganizations.length !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            onPress={() => setStep(3)}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
          </View>
        )}

{activeTab === 'onetime' && (
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
        )}
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
    backgroundColor: '#2563eb',
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
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
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
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  welcomeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  amountSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  amountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
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
  },
  securityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkText: {
    fontSize: 14,
    color: '#16a34a',
  },
  securityText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  learnMore: {
    color: '#2563eb',
    fontWeight: '500',
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
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
