import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Check } from 'lucide-react-native';
import { PrimaryBlue } from '../../Constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

export default function AutomaticImpact() {
  const amountOptions = [5, 25, 50];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Heading */}
        <Text style={styles.heading}>
          One Decision. <Text style={styles.headingHighlight}>Automatic Impact.</Text> Every Cause You Love.
        </Text>

        {/* Three Step Cards */}
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.card}>
            <View style={styles.stepNumberContainer}>
              <Text style={[styles.stepNumber, { color: PrimaryBlue }]}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Set one monthly amount</Text>
            <View style={styles.amountButtonsContainer}>
              {amountOptions.map((amount) => (
                <View
                  key={amount}
                  style={[
                    styles.amountButton,
                    {
                      backgroundColor:
                        amount === 5
                          ? '#1600ff'
                          : amount === 25
                          ? '#ff3366'
                          : '#a854f7',
                    },
                  ]}
                >
                  <Text style={styles.amountButtonText}>${amount}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.amountSubtext}>whatever works for you</Text>
          </View>

          {/* Step 2 */}
          <View style={styles.card}>
            <View style={[styles.stepNumberContainer, { backgroundColor: '#fce7f3' }]}>
              <Text style={[styles.stepNumber, { color: '#ec4899' }]}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Split it across every nonprofit you care about</Text>
          </View>

          {/* Step 3 */}
          <View style={styles.card}>
            <View style={[styles.stepNumberContainer, { backgroundColor: '#f3e8ff' }]}>
              <Text style={[styles.stepNumber, { color: '#a855f7' }]}>3</Text>
            </View>
            <Text style={styles.stepTitle}>We handle everything automatically</Text>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitsRow}>
            <View style={styles.benefitItem}>
              <View style={styles.checkContainer}>
                <Check size={16} color="#15803d" />
              </View>
              <Text style={styles.benefitText}>No decision fatigue</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.checkContainer}>
                <Check size={16} color="#15803d" />
              </View>
              <Text style={styles.benefitText}>No guilt</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.checkContainer}>
                <Check size={16} color="#15803d" />
              </View>
              <Text style={styles.benefitText}>No choosing</Text>
            </View>
          </View>

          <Text style={styles.benefitsMessage}>
            Just set it once, and become someone who actually makes a difference.
          </Text>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <View style={styles.footerCheckContainer}>
            <Check size={16} color="#15803d" />
          </View>
          <Text style={styles.footerNoteText}>
            Your donations are tax-deductible and you'll receive a consolidated receipt for easy filing
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f9ff',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 32,
  },
  headingHighlight: {
    color: '#1600ff',
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    minWidth: screenWidth > 768 ? 200 : screenWidth * 0.85,
    // maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  stepNumberContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  amountButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  amountButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  amountButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  amountSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    marginHorizontal: screenWidth > 768 ? 40 : 0,
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  benefitsMessage: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1600ff',
    textAlign: 'center',
    lineHeight: 24,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerCheckContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    flex: 1,
    maxWidth: 600,
  },
});

