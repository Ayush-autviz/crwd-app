import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ChevronLeft, Plus, Trash2, User, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import DonationStep2 from '../components/donation/DonationStep2';
import DonationStep3 from '../components/donation/DonationStep3';
import OneTimeDonation from '../components/donation/OneTimeDonation';
import CheckoutScreen from '../components/donation/CheckoutScreen';
import PaymentSection from '../components/donation/PaymentSection';
import ManageDonationBox from '../components/donation/ManageDonationBox';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDonationBox, createDonationBox, removeCauseFromBox, removeCollectiveFromBox, activateDonationBoxMobile, confirmMobileActivation } from '../services/api/donation';
import { getCausesBySearch, getJoinCollective } from '../services/api/crwd';
import { useAuthStore } from '../store/store';
import { Alert, ActivityIndicator, Modal } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import MainHeaderNav from '../components/MainHeaderNav';


export default function DonationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<'setup' | 'onetime'>('setup');
  const [checkout, setCheckout] = useState(false);
  const [showManageDonationBox, setShowManageDonationBox] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [donationAmount, setDonationAmount] = useState(7);
  const [step, setStep] = useState(1);
  const [inputValue, setInputValue] = useState('7');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCauseIds, setSelectedCauseIds] = useState<number[]>([]);
  const [selectedCollectiveIds, setSelectedCollectiveIds] = useState<number[]>([]);
  const [selectedCausesData, setSelectedCausesData] = useState<any[]>([]);
  const [selectedCollectivesData, setSelectedCollectivesData] = useState<any[]>([]);
  const [donationBox, setDonationBox] = useState<any>(null);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Load current donation box
  const donationBoxQuery = useQuery({
    queryKey: ['donationBox'],
    queryFn: getDonationBox,
  });

  // Decide step based on existing box - only when setup tab is active
  useEffect(() => {
    if (activeTab === 'setup') {
    if (donationBoxQuery.data && donationBoxQuery.data.id) {
      setDonationBox(donationBoxQuery.data);
      if(donationBoxQuery.data.is_active) {
        setCheckout(true);
      } else {
        // If donation box exists but is not active, show step 2 (not checkout)
        setCheckout(false);
      }
      setStep(2);
    } else {
      setCheckout(false);
      setStep(1);
    }
    }
  }, [donationBoxQuery.data, activeTab]);

  // Causes search (max 5 rendered)
  const { data: causesData, isLoading: causesLoading } = useQuery({
    queryKey: ['causes', searchQuery],
    queryFn: () => getCausesBySearch(searchQuery, '', 1),
  });

  // Joined collectives
  const { data: joinedCollectivesData, isLoading: collectivesLoading } = useQuery({
    queryKey: ['joined-collectives', currentUser?.id],
    queryFn: () => getJoinCollective(currentUser?.id?.toString() || ''),
    enabled: !!currentUser?.id,
  });

  // Create donation box
  const createBoxMutation = useMutation({
    mutationFn: createDonationBox,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      setStep(2);
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message || 'Failed to create box'),
  });


  const activateDonationBoxConfirm = useMutation({
    mutationFn: confirmMobileActivation,
    onSuccess: () => {
      Alert.alert('Success', 'Donation box activated');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message || 'Activation failed'),
  });

  // Activate donation box (Stripe PaymentSheet)
  const activateMutation = useMutation({
    mutationFn: activateDonationBoxMobile,
    onSuccess: async (response: any) => {
      const clientSecret = response?.client_secret;
      if (!clientSecret) {
        Alert.alert('Error', 'Missing client secret');
        return;
      }
      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'CRWD',
      });
      if (init.error) {
        Alert.alert('Error', init.error.message || 'Failed to initialize payment');
        return;
      }
      const present = await presentPaymentSheet();
      if (present.error && present.error.code !== 'Canceled') {
        Alert.alert('Payment Failed', present.error.message || 'Unable to complete payment');
        return;
      }


      if(!present.error) {
        activateDonationBoxConfirm.mutate({
         payment_intent_id: response.payment_intent_id,
        });
      }
    },
    onError: (e: any) => {
      console.log('error', e);
      Alert.alert('Error', e?.response?.data?.message || 'Activation failed');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
    },
  });

  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setDonationAmount(roundedValue);
    setInputValue(roundedValue.toString());
  };

  useEffect(() => {
    // If navigated with initialTab param, open the requested tab
    const maybeParams: any = (route as any)?.params;
    if (maybeParams?.initialTab === 'onetime') {
      setActiveTab('onetime');
    }
    // Handle preselected item for one-time donations
    if (maybeParams?.preselectedItem) {
      // preselectedItem is already being passed to OneTimeDonation below
    }
  }, [route]);

  if (!currentUser?.id) {
            return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav title={'Donation Box'} />
                <View style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    paddingHorizontal: 32,
                    backgroundColor: 'white'
                }}>
                    {/* Icon */}
                    <View style={{
                        width: 80,
                        height: 80,
                        backgroundColor: '#dbeafe',
                        borderRadius: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 24
                    }}>
                        {/* <Text style={{ fontSize: 40, color: '#2563eb' }}>👤</Text> */}
                        <User size={40} color={PrimaryBlue} />
                    </View>
                    
                    {/* Title */}
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: 12,
                        textAlign: 'center'
                    }}>
                        Sign in to make a donation
                    </Text>
                    
                    {/* Description */}
                    <Text style={{
                        fontSize: 16,
                        color: '#6b7280',
                        marginBottom: 32,
                        textAlign: 'center',
                        lineHeight: 24
                    }}>
                        Sign in to make a donation, manage your causes, and connect with your community.
                    </Text>
                    
                    {/* CTA Button */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login' as never)}
                        style={{
                            backgroundColor: '#2563eb',
                            paddingHorizontal: 32,
                            paddingVertical: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                            Sign In to Continue
                        </Text>
                    </TouchableOpacity>
                    
                    {/* Additional Info */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ClaimProfile' as never)}
                      >
                    <Text style={{
                        fontSize: 14,
                        color: '#6b7280',
                        marginTop: 24,
                        textAlign: 'center'
                    }}>
                        Don't have an account? 
                        <Text style={{ color: '#2563eb', fontWeight: '500' }}> Create one here</Text>
                    </Text>
</TouchableOpacity>
                </View>
            </SafeAreaView>
        )
  }

  // Prepare donation box data for ManageDonationBox
  const donationBoxData = donationBoxQuery.data || donationBox;
  const causesAsObjects = [
    ...(donationBoxData?.manual_causes || []).map((cause: any) => ({
      id: `cause-${cause.id}`,
      name: cause.name,
      imageUrl: cause.logo || '',
      color: '#4F46E5',
      description: cause.mission || cause.description || '',
      type: 'cause' as const,
    })),
    ...(donationBoxData?.attributing_collectives || []).map((collective: any) => ({
      id: `collective-${collective.id}`,
      name: collective.name,
      imageUrl: collective.cover_image || '',
      color: '#9333EA',
      description: collective.description || '',
      type: 'collective' as const,
    })),
  ];

  if (donationBoxQuery.isLoading) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
        <MainHeaderNav show={false} menu={false} title={'Donation Box'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        {/* {step > 1 && activeTab !== 'onetime' ? (
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
            
            <ChevronLeft color='#374151' />
          </TouchableOpacity>
        )}  */}

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
              if (checkout) {
                setCheckout(false);
              }
              setActiveTab('setup');
              // Don't reset step - let useEffect handle it based on donation box existence
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
            onPress={() => {
              if (checkout) {
                setCheckout(false);
              }
              setActiveTab('onetime');
            }}
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
        {checkout ? (
          <CheckoutScreen
            donationAmount={donationAmount}
            selectedOrganizations={selectedOrganizations}
            onBack={() => setCheckout(false)}
            donationBox={donationBoxQuery.data || donationBox}
          />
        ) : showManageDonationBox ? (
          <ManageDonationBox
            amount={donationBoxData?.monthly_amount || donationAmount}
            causes={causesAsObjects}
            onBack={async () => {
              setShowManageDonationBox(false);
              // Invalidate and refetch to get updated donation box data
              await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
              const result = await donationBoxQuery.refetch();
              
              // If donation box was deactivated, update checkout state
              if (result.data && !result.data.is_active) {
                setCheckout(false);
                setStep(2);
              }
            }}
            donationBox={donationBoxData}
          />
        ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'onetime' ? (
            <OneTimeDonation
              setCheckout={setCheckout}
              selectedOrganizations={selectedOrganizations}
              setSelectedOrganizations={setSelectedOrganizations}
              preselectedItem={(route.params as any)?.preselectedItem}
              activeTab={(route.params as any)?.activeTab}
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

                  {/* Selected Items Display */}
                  {(selectedCauseIds.length > 0 || selectedCollectiveIds.length > 0) && (
                    <View style={styles.selectedSection}>
                      <Text style={styles.selectedTitle}>Your selection</Text>
                      
                      {selectedCauseIds.length > 0 && (
                        <View style={styles.selectedCard}>
                          <Text style={styles.selectedCardTitle}>Nonprofits</Text>
                          {selectedCausesData.map((cause: any) => (
                            <View key={cause.id} style={styles.selectedItemRow}>
                              <View style={[styles.orgAvatar, { backgroundColor: '#dbeafe', marginRight: 12 }]}>
                                <Text style={[styles.orgAvatarText, { color: '#2563eb' }]}>{cause.name?.charAt(0) || 'N'}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', color: '#111827' }}>{cause.name}</Text>
                                {!!cause.mission && <Text style={{ color: '#6b7280' }} numberOfLines={1}>{cause.mission}</Text>}
                              </View>
                              <TouchableOpacity onPress={() => {
                                setSelectedCauseIds(selectedCauseIds.filter(id => id !== cause.id));
                                setSelectedCausesData(selectedCausesData.filter(c => c.id !== cause.id));
                              }} style={{ padding: 8 }}>
                                <Trash2 size={18} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}

                      {selectedCollectiveIds.length > 0 && (
                        <View style={styles.selectedCard}>
                          <Text style={styles.selectedCardTitle}>Collectives</Text>
                          {selectedCollectivesData.map((collective: any) => (
                            <View key={collective.id} style={styles.selectedItemRow}>
                              <View style={[styles.orgAvatar, { backgroundColor: '#dcfce7', marginRight: 12 }]}>
                                <Text style={[styles.orgAvatarText, { color: '#16a34a' }]}>{collective.name?.charAt(0) || 'C'}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', color: '#111827' }}>{collective.name}</Text>
                                {!!collective.description && <Text style={{ color: '#6b7280' }} numberOfLines={1}>{collective.description}</Text>}
                              </View>
                              <TouchableOpacity onPress={() => {
                                setSelectedCollectiveIds(selectedCollectiveIds.filter(id => id !== collective.id));
                                setSelectedCollectivesData(selectedCollectivesData.filter(c => c.id !== collective.id));
                              }} style={{ padding: 8 }}>
                                <Trash2 size={18} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Choose Nonprofit to Support */}
                  <View style={styles.organizationsCard}>
                    <Text style={styles.organizationsTitle}>Choose nonprofit to support</Text>
                    <TextInput
                      placeholder="Search nonprofits..."
                      placeholderTextColor="#9ca3af"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={{
                        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, height: 40, marginBottom: 12,
                      }}
                    />
                    <View style={styles.organizationsList}>
                      {causesLoading ? (
                        <ActivityIndicator />
                      ) : (
                        (causesData?.results || []).slice(0, 5).map((cause: any) => {
                          const isSelected = selectedCauseIds.includes(cause.id);
                          return (
                            <TouchableOpacity
                              key={cause.id}
                              style={[styles.organizationItem, isSelected && styles.selectedOrganizationItem]}
                              onPress={() => {
                                if (isSelected) {
                                  setSelectedCauseIds(selectedCauseIds.filter(id => id !== cause.id));
                                  setSelectedCausesData(selectedCausesData.filter(c => c.id !== cause.id));
                                } else {
                                  setSelectedCauseIds([...selectedCauseIds, cause.id]);
                                  setSelectedCausesData([...selectedCausesData, cause]);
                                }
                              }}
                            >
                              <View style={[styles.orgAvatar, { backgroundColor: '#dbeafe' }]}>
                                <Text style={[styles.orgAvatarText, { color: '#2563eb' }]}>{cause.name?.charAt(0) || 'N'}</Text>
                              </View>
                              <View style={styles.orgInfo}>
                                <Text style={styles.orgName}>{cause.name}</Text>
                                {!!cause.mission && <Text style={styles.orgDescription} numberOfLines={1}>{cause.mission}</Text>}
                              </View>
                              <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                                {isSelected && <Text style={styles.checkmark}>✓</Text>}
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  </View>

                  {/* Choose Collective to Support */}
                  <View style={styles.organizationsCard}>
                    <Text style={styles.organizationsTitle}>Choose collective to support</Text>
                    <View style={styles.organizationsList}>
                      {collectivesLoading ? (
                        <ActivityIndicator />
                      ) : (
                        (joinedCollectivesData?.data || []).map((item: any) => {
                          const collective = item.collective;
                          const isSelected = selectedCollectiveIds.includes(collective.id);
                          return (
                            <TouchableOpacity
                              key={collective.id}
                              style={[styles.organizationItem, isSelected && styles.selectedOrganizationItem]}
                              onPress={() => {
                                if (isSelected) {
                                  setSelectedCollectiveIds(selectedCollectiveIds.filter(id => id !== collective.id));
                                  setSelectedCollectivesData(selectedCollectivesData.filter(c => c.id !== collective.id));
                                } else {
                                  setSelectedCollectiveIds([...selectedCollectiveIds, collective.id]);
                                  setSelectedCollectivesData([...selectedCollectivesData, collective]);
                                }
                              }}
                            >
                              <View style={[styles.orgAvatar, { backgroundColor: '#dcfce7' }]}>
                                <Text style={[styles.orgAvatarText, { color: '#16a34a' }]}>{collective.name?.charAt(0).toUpperCase() || 'C'}</Text>
                              </View>
                              <View style={styles.orgInfo}>
                                <Text style={styles.orgName}>{collective.name}</Text>
                                {!!collective.description && <Text style={styles.orgDescription} numberOfLines={1}>{collective.description}</Text>}
                              </View>
                              <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                                {isSelected && <Text style={styles.checkmark}>✓</Text>}
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
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
                <View style={{ padding: 16 }}>
                  {/* Show loading state if data is still being fetched */}
                  {donationBoxQuery.isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
                      <ActivityIndicator size="large" color={PrimaryBlue} />
                    </View>
                  ) : (
                    <>
                      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Nonprofits</Text>
                        {(donationBoxQuery.data?.manual_causes || donationBox?.manual_causes || []).length > 0 ? (
                          (donationBoxQuery.data?.manual_causes || donationBox?.manual_causes || []).map((cause: any) => (
                            <View key={cause.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                              <View style={[styles.orgAvatar, { backgroundColor: '#dbeafe', marginRight: 12 }]}><Text style={[styles.orgAvatarText, { color: '#2563eb' }]}>{cause.name?.charAt(0).toUpperCase() || 'N'}</Text></View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', color: '#111827' }}>{cause.name}</Text>
                                {!!cause.mission && <Text style={{ color: '#6b7280' }} numberOfLines={1}>{cause.mission}</Text>}
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text style={{ color: PrimaryGrey, paddingVertical: 12 }}>No nonprofits added yet</Text>
                        )}
                      </View>

                      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Collectives</Text>
                        {(donationBoxQuery.data?.attributing_collectives || donationBox?.attributing_collectives || []).length > 0 ? (
                          (donationBoxQuery.data?.attributing_collectives || donationBox?.attributing_collectives || []).map((collective: any) => (
                            <View key={collective.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                              <View style={[styles.orgAvatar, { backgroundColor: '#dcfce7', marginRight: 12 }]}><Text style={[styles.orgAvatarText, { color: '#16a34a' }]}>{collective.name?.charAt(0).toUpperCase() || 'C'}</Text></View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', color: '#111827' }}>{collective.name}</Text>
                                {!!collective.description && <Text style={{ color: '#6b7280' }} numberOfLines={1}>{collective.description}</Text>}
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text style={{ color: PrimaryGrey, paddingVertical: 12 }}>No collectives added yet</Text>
                        )}
                      </View>

                      {/* Manage Donation Box Button - Always show if donation box exists */}
                      {(donationBoxQuery.data?.id || donationBox?.id) && (
                        <TouchableOpacity
                          onPress={() => {
                            setShowManageDonationBox(true);
                          }}
                          style={styles.manageButton}
                        >
                          <Text style={styles.manageButtonText}>Manage Donation Box</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
        )}

        {/* Footer - Only show for step 1 */}

      </View>
    {/* </SafeAreaView> */}
    {activeTab === 'setup' && step === 1 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryContent}>
              <View>
                <Text style={styles.summaryAmount}>${donationAmount} per month</Text>
                <Text style={styles.summaryCount}>
                  {selectedCauseIds.length} nonprofits, {selectedCollectiveIds.length} collectives
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  createBoxMutation.mutate({
                    monthly_amount: donationAmount,
                    cause_ids: selectedCauseIds,
                    collective_ids: selectedCollectiveIds,
                  });
                }}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>{createBoxMutation.isPending ? 'Creating...' : 'Next'}</Text>
                <Text style={styles.nextButtonIcon}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'setup' && step === 2 && !donationBoxQuery.data?.is_active && (
          <View style={styles.footer}>     
          <TouchableOpacity
            onPress={() => activateMutation.mutate({monthly_amount: donationAmount})}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonText}>{activateMutation.isPending ? 'Activating...' : 'Activate Donation Box'}</Text>
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
  selectedSection: {
    marginBottom: 24,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  selectedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
  manageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
  },
});
