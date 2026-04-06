import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Minus, Plus } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function NewDonationAmount() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;
  const [amount, setAmount] = useState<number>(10);
  const [isCustom, setIsCustom] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleIncrement = () => {
    setAmount((prev) => prev + 1);
    setIsCustom(false);
  };

  const handleDecrement = () => {
    setAmount((prev) => Math.max(5, prev - 1));
    setIsCustom(false);
  };

  const handleInputChange = (text: string) => {
    // Basic cleaning for numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 5) return;

    if (cleaned === '') {
      setAmount(0);
      return;
    }
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) {
      setAmount(num);
    }
  };

  const handleInputBlur = () => {
    if (amount < 5) {
      setAmount(5);
    }
  };

  const handleContinue = () => {
    if (amount < 5) return;
    (navigation as any).navigate('OnboardSuccess', {
      ...params,
      amount: amount,
    });
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'DrawerNav',
          params: {
            screen: 'MainTabs',
            params: {
              screen: 'Profile',
            },
          },
        },
      ] as any,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Progress Indicator - Step 4 of 5 */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={styles.progressStep} />
          </View>

          {/* Heading */}
          <View style={styles.headingContent}>
            <Text style={styles.title}>How much do you want to give each month?</Text>
            <Text style={styles.subtitle}>$5 minimum.</Text>
          </View>

          {/* Amount Selector */}
          <View style={styles.selectorContainer}>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={handleDecrement}
                style={styles.stepperButton}
                activeOpacity={0.7}
              >
                <Minus size={24} color="#9CA3AF" />
              </TouchableOpacity>

              <View style={styles.amountDisplay}>
                {isCustom ? (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      ref={inputRef}
                      style={styles.customInput}
                      keyboardType="numeric"
                      value={amount > 0 ? amount.toString() : ''}
                      onChangeText={handleInputChange}
                      onBlur={handleInputBlur}
                      autoFocus
                      selectTextOnFocus
                      caretHidden={false}
                    />
                  </View>
                ) : (
                  <Text style={styles.amountText}>${amount}</Text>
                )}
                <Text style={styles.intervalText}>per month</Text>
              </View>

              <TouchableOpacity
                onPress={handleIncrement}
                style={styles.stepperButton}
                activeOpacity={0.7}
              >
                <Plus size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setIsCustom(true)}
              style={styles.customToggle}
              activeOpacity={0.7}
            >
              <Text style={styles.customToggleText}>Enter custom amount</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Start with what feels comfortable. You can always adjust.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleContinue}
          style={[styles.continueButton, amount < 5 && styles.buttonDisabled]}
          disabled={amount < 5}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
          <Text style={styles.skipLinkText}>Skip for now, I'll set this up later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressStep: {
    height: 4,
    width: (width - 48 - 32) / 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#1600ff',
  },
  headingContent: {
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectorContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 24,
    marginBottom: 24,
  },
  stepperButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  amountDisplay: {
    alignItems: 'center',
    minWidth: 140,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1600ff',
    letterSpacing: -2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1600ff',
    letterSpacing: -2,
    marginRight: -2,
  },
  customInput: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1600ff',
    padding: 0,
    margin: 0,
    minWidth: 60,
    textAlign: 'center',
  },
  intervalText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: -4,
  },
  customToggle: {
    paddingVertical: 8,
  },
  customToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  infoBox: {
    backgroundColor: '#F9F9F5',
    borderRadius: 20,
    padding: 24,
    marginBottom: 'auto',
  },
  infoText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4B5563',
    // lineHeight: 26,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
  },
  continueButton: {
    backgroundColor: '#1600ff',
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipLink: {
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '700',
  },
});
