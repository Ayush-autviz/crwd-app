import React, { useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X, Info } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { activateDonationBoxMobile, confirmMobileActivation } from '../../services/api/donation';
import CrwdAnimation from '../ui/CrwdAnimation';
import { useStripe } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/store';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface DonationReviewBottomSheetProps {
  donationAmount: number;
  selectedCauses: any[];
  onComplete: () => void;
  onClose?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DonationReviewBottomSheet = forwardRef<any, DonationReviewBottomSheetProps>(({
  donationAmount,
  selectedCauses,
  onComplete,
  onClose,
}, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [showLogoAnimation, setShowLogoAnimation] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const snapPoints = useMemo(() => [screenHeight * 0.9], []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    open: () => {
      bottomSheetRef.current?.expand();
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    onClose?.();
  }, [onClose]);

  // Generate merchant display name from selected causes
  const getMerchantDisplayName = (): string => {
    if (selectedCauses.length === 0) {
      return 'CRWD';
    }

    if (selectedCauses.length === 1) {
      return selectedCauses[0]?.name || 'CRWD';
    }

    const names = selectedCauses
      .map(cause => cause?.name)
      .filter(Boolean)
      .slice(0, 3);

    if (names.length === 0) {
      return 'CRWD';
    }

    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }

    if (names.length === 3 && selectedCauses.length === 3) {
      return `${names[0]}, ${names[1]} & ${names[2]}`;
    }

    const remainingCount = selectedCauses.length - 2;
    return `${names[0]} & ${names[1]} +${remainingCount} more`;
  };

  // Mutation to activate donation box
  const activateBoxMutation = useMutation({
    mutationFn: activateDonationBoxMobile,
    onSuccess: async (response: any) => {
      const clientSecret = response?.client_secret;
      if (!clientSecret) {
        Alert.alert('Error', 'Missing client secret');
        setIsProcessingPayment(false);
        return;
      }
      
      setIsProcessingPayment(true);
      try {
        const merchantDisplayName = getMerchantDisplayName();
        const init = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: `${merchantDisplayName} via CRWD`,
          allowsDelayedPaymentMethods: false,
          applePay: {
            merchantCountryCode: 'US',
          }
        });
        if (init.error) {
          Alert.alert('Error', init.error.message || 'Failed to initialize payment');
          setIsProcessingPayment(false);
          return;
        }
        const present = await presentPaymentSheet();
        if (present.error && present.error.code !== 'Canceled') {
          Alert.alert('Payment Failed', present.error.message || 'Unable to complete payment');
          setIsProcessingPayment(false);
          return;
        }

        if(!present.error) {
          // Keep loader showing while confirming
          confirmActivationMutation.mutate({
            payment_intent_id: response.payment_intent_id,
          });
        } else {
          setIsProcessingPayment(false);
        }
      } catch (error) {
        setIsProcessingPayment(false);
        Alert.alert('Error', 'Payment processing failed');
      }
    },
    onError: (error: any) => {
      console.error('Error activating donation box:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Activation failed');
      setIsProcessingPayment(false);
    },
  });

  const confirmActivationMutation = useMutation({
    mutationFn: confirmMobileActivation,
    onSuccess: () => {
      // Show logo animation
      setShowLogoAnimation(true);
      // Wait for animation to complete (3 seconds) before navigating
      setTimeout(() => {
        setShowLogoAnimation(false);
        queryClient.invalidateQueries({ queryKey: ['donationBox'] });
        onComplete();
      }, 3000);
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.response?.data?.message || 'Activation failed');
      setIsProcessingPayment(false);
      setShowLogoAnimation(false);
    },
  });

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Calculate fees using the provided formula
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

  const actualDonationAmount = parseFloat(donationAmount.toString());
  const fees = calculateFees(actualDonationAmount);
  
  // Platform fee = CRWD fee + Stripe fee (sum of both)
  const platformFee = fees.stripeFee + fees.crwdFee;
  
  // Calculate totals - only count causes (not collectives)
  const totalCauses = selectedCauses.length;
  const perCause = totalCauses > 0 ? fees.net / totalCauses : 0;

  // Avatar colors for consistent coloring
  const avatarColors = [
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#10B981', // Green
    '#3B82F6', // Blue
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

  return (
    <>
      {/* Logo Animation Overlay */}
      {showLogoAnimation && (
        <Modal
          visible={showLogoAnimation}
          transparent
          animationType="fade"
        >
          <View style={styles.logoAnimationContainer}>
            <CrwdAnimation size="lg" />
            <Text style={styles.creatingText}>Creating collective...</Text>
          </View>
        </Modal>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: 'white' }}
        onClose={handleClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Complete Your Monthly Gift</Text>
              <Text style={styles.subtitle}>
                Review your recurring donation details and set up monthly payment.
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content - Scrollable */}
          <BottomSheetScrollView 
            contentContainerStyle={[styles.content, { paddingBottom: 100 }]} 
            showsVerticalScrollIndicator={false}
          >
            {/* Summary Box */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount:</Text>
                <Text style={styles.summaryValue}>${donationAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Split among:</Text>
                <Text style={styles.summaryValue}>{totalCauses} cause{totalCauses !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelRow}>
                  <Text style={styles.summaryLabel}>Platform fee:</Text>
                  <Info size={14} color="#9CA3AF" />
                </View>
                <Text style={styles.summaryValue}>${platformFee.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Per cause:</Text>
                <Text style={styles.summaryValue}>${perCause.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total:</Text>
                <Text style={styles.summaryTotalValue}>${donationAmount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              Donations are distributed as grants through the CRWD Foundation, a 501(c)(3) (EIN: 41-2423690). Tax-deductible receipts sent via email.
            </Text>

            {/* Selected Causes */}
            <View style={styles.causesSection}>
              <Text style={styles.causesTitle}>Your Selected Causes ({totalCauses})</Text>
              <View style={styles.causesList}>
                {selectedCauses.map((cause: any) => {
                  const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                  const initials = getInitials(cause.name);
                  return (
                    <View key={cause.id} style={styles.causeItem}>
                      <View
                        style={[
                          styles.causeAvatar,
                          { backgroundColor: avatarBgColor },
                        ]}
                      >
                        <Text style={styles.causeAvatarText}>
                          {initials}
                        </Text>
                      </View>
                      <View style={styles.causeInfo}>
                        <Text style={styles.causeName} numberOfLines={1}>
                          {cause.name}
                        </Text>
                      </View>
                      <Text style={styles.causeAmount}>
                        ${perCause.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Complete Monthly Gift Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => activateBoxMutation.mutate({ monthly_amount: donationAmount })}
                disabled={activateBoxMutation.isPending || showLogoAnimation || isProcessingPayment}
                style={[
                  styles.completeButton,
                  (activateBoxMutation.isPending || showLogoAnimation || isProcessingPayment) && styles.completeButtonDisabled,
                ]}
              >
                {activateBoxMutation.isPending || isProcessingPayment ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.completeButtonText}>Activating...</Text>
                  </>
                ) : (
                  <Text style={styles.completeButtonText}>Complete Monthly Gift</Text>
                )}
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </View>
      </BottomSheet>
    </>
  );
});

DonationReviewBottomSheet.displayName = 'DonationReviewBottomSheet';

export default DonationReviewBottomSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1600ff',
  },
  disclaimer: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 14,
    marginBottom: 16,
  },
  causesSection: {
    marginBottom: 16,
  },
  causesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  causesList: {
    gap: 6,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  causeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  causeAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  causeInfo: {
    flex: 1,
    minWidth: 0,
  },
  causeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  causeAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    // marginTop: 16,
  },
  completeButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoAnimationContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatingText: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    color: '#1600ff',
  },
});

