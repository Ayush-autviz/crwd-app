import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { CreditCard as CreditCardIcon } from 'lucide-react-native';
import { AppleIcon } from 'lucide-react-native';
import { Apple } from 'lucide-react-native';

interface PaymentSectionProps {
  setCheckout: (value: boolean) => void;
  amount: number;
}

export default function PaymentSection({ setCheckout, amount }: PaymentSectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<'apple_pay' | 'card' | null>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const handlePayment = () => {
    // if (!selectedMethod) {
    //   return;
    // }
    // Here you would integrate with your payment processor
    setCheckout(true);
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
      <Text style={styles.title}>Select Payment Method</Text>
      
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[
            styles.paymentOption,
            selectedMethod === 'apple_pay' && styles.selectedOption
          ]}
          onPress={() => setSelectedMethod('apple_pay')}
        >
          <Image
            source={require('../../assets/logo/apple-pay.png')}
            style={styles.applePayLogo}
            resizeMode="contain"
          />
          {/* <Apple size={24} color="#374151" /> */}
          <Text style={styles.paymentOptionText}>Apple Pay</Text>
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

      {selectedMethod === 'card' && (
        <View style={styles.cardDetailsContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
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
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.checkoutButton,
          // !selectedMethod && styles.disabledButton
        ]}
        onPress={handlePayment}
        // disabled={!selectedMethod}
      >
        <Text style={styles.checkoutButtonText}>
          Pay ${amount.toFixed(2)}
        </Text>
      </TouchableOpacity>

      {/* <View style={styles.securityInfo}>
        <View style={styles.securityIcon}>
          <Text style={styles.securityIconText}>🔒</Text>
        </View>
        <Text style={styles.securityText}>
          Your payment is secure and encrypted
        </Text>
      </View> */}
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
    width: 24,
  },
  paymentOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  cardDetailsContainer: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 18,
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