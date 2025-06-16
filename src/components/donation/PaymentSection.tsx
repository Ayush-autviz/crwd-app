import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { CreditCard as CreditCardIcon } from 'lucide-react-native';

interface PaymentSectionProps {
  setCheckout: (value: boolean) => void;
  amount: number;
}

export default function PaymentSection({ setCheckout, amount }: PaymentSectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<'apple_pay' | 'card' | null>(null);

  const handlePayment = () => {
    if (!selectedMethod) {
      return;
    }
    // Here you would integrate with your payment processor
    setCheckout(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Method</Text>
      
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[
            styles.paymentOption,
            selectedMethod === 'apple_pay' && styles.selectedOption
          ]}
          onPress={() => setSelectedMethod('apple_pay')}
        >
          {/* <Image
            source={require('../../assets/apple-pay.png')}
            style={styles.applePayLogo}
            resizeMode="contain"
          /> */}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.paymentOption,
          selectedMethod === 'card' && styles.selectedOption
        ]}
        onPress={() => setSelectedMethod('card')}
      >
        <CreditCardIcon size={24} color="#374151" />
        <Text style={styles.paymentOptionText}>Credit or Debit Card</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.checkoutButton,
          !selectedMethod && styles.disabledButton
        ]}
        onPress={handlePayment}
        disabled={!selectedMethod}
      >
        <Text style={styles.checkoutButtonText}>
          Pay ${amount.toFixed(2)}
        </Text>
      </TouchableOpacity>

      <View style={styles.securityInfo}>
        <View style={styles.securityIcon}>
          <Text style={styles.securityIconText}>🔒</Text>
        </View>
        <Text style={styles.securityText}>
          Your payment is secure and encrypted
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  selectedOption: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  applePayLogo: {
    height: 24,
    width: 48,
  },
  paymentOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  checkoutButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  securityIcon: {
    marginRight: 8,
  },
  securityIconText: {
    fontSize: 14,
  },
  securityText: {
    fontSize: 14,
    color: '#6b7280',
  },
}); 