import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, CreditCard } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { getPaymentMethod, getPaymentMethodSetupIntent, updatePaymentMethod } from '../../services/api/donation';
import { useStripe } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';

interface PaymentMethodsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentMethodsBottomSheet({
  isOpen,
  onClose,
}: PaymentMethodsBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const queryClient = useQueryClient();
  const { initPaymentSheet, presentPaymentSheet, retrieveSetupIntent } = useStripe();

  const snapPoints = useMemo(() => ['50%'], []);

  // Open/close bottom sheet based on isOpen prop
  React.useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);

  const { data: paymentMethodsData, isLoading } = useQuery({
    queryKey: ['paymentMethod'],
    queryFn: getPaymentMethod,
    enabled: isOpen,
  });

  const updateMethodMutation = useMutation({
    mutationFn: async () => {
      const setupIntentResponse = await getPaymentMethodSetupIntent();
      const clientSecret = setupIntentResponse?.client_secret;
      if (!clientSecret) {
        throw new Error('Missing setup intent client secret');
      }

      const init = await initPaymentSheet({
        setupIntentClientSecret: clientSecret,
        merchantDisplayName: 'CRWD',
        allowsDelayedPaymentMethods: false,
        applePay: {
          merchantCountryCode: 'US',
        },
      });

      if (init.error) {
        console.log('init.error:', init.error);
        throw new Error(init.error.message || 'Failed to initialize payment');
      }

      const present = await presentPaymentSheet();

      if (present.error && (present.error as any).code !== 'Canceled') {
        console.log('present.error:', present.error);
        throw new Error(present.error.message || 'Unable to update payment method');
      }

      if (!present.error) {
        // Retrieve the setup intent to get the payment method ID
        const retrieved = await retrieveSetupIntent(clientSecret);
        if (retrieved.error) {
          throw new Error(retrieved.error.message || 'Failed to retrieve setup intent');
        }

        const paymentMethodId = retrieved.setupIntent?.paymentMethodId;
        if (!paymentMethodId) {
          throw new Error('Payment method ID not found in setup intent');
        }

        await updatePaymentMethod({ payment_method_id: paymentMethodId });

        // Invalidate payment method query to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['paymentMethod'] });
      }
    },
    onError: (error: any) => {
      console.log('error:', error);
      Alert.alert('Error', error?.message || 'Failed to update payment method');
    },
  });

  const handleUpdatePaymentMethod = () => {
    updateMethodMutation.mutate();
  };

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

  // Helper to format expiry
  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year}`;
  };

  const method = paymentMethodsData?.payment_method;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'white' }}
      onDismiss={onClose}
      enableDynamicSizing={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Payment Methods</Text>
            <Text style={styles.subtitle}>
              Manage your payment methods for donations
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Update/Add Button */}
          <TouchableOpacity
            onPress={handleUpdatePaymentMethod}
            disabled={updateMethodMutation.isPending}
            style={[
              styles.updateButton,
              updateMethodMutation.isPending && styles.updateButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            {updateMethodMutation.isPending ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.updateButtonText}>Updating...</Text>
              </>
            ) : (
              <Text style={styles.updateButtonText}>
                {method ? 'Update Payment Method' : 'Add Payment Method'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Payment Method List */}
          <View style={styles.methodsList}>
            {isLoading ? (
              <View style={styles.loadingCard}>
                <View style={styles.loadingIcon} />
                <View style={styles.loadingText}>
                  <View style={styles.loadingLine1} />
                  <View style={styles.loadingLine2} />
                </View>
              </View>
            ) : method ? (
              <View style={styles.methodCard}>
                <View style={styles.methodIconContainer}>
                  <CreditCard size={24} color="#3B82F6" />
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodHeader}>
                    <Text style={styles.methodBrand}>
                      {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                    </Text>
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  </View>
                  <Text style={styles.methodExpiry}>
                    Expires {formatExpiry(method.exp_month, method.exp_year)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No payment methods found.</Text>
              </View>
            )}
          </View>
        </BottomSheetScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your payment information is securely encrypted and stored. We never share your payment details with nonprofits or third parties.
          </Text>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
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
    fontFamily: 'Outfit-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  updateButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Medium',
  },
  methodsList: {
    gap: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  methodIconContainer: {
    width: 48,
    height: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  methodBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  defaultBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
    fontFamily: 'Outfit-Medium',
  },
  methodExpiry: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  loadingIcon: {
    width: 48,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  loadingText: {
    flex: 1,
    gap: 8,
  },
  loadingLine1: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '33%',
  },
  loadingLine2: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '25%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'Outfit-Regular',
  },
});
