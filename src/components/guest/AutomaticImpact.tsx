import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PrimaryBlue } from '../../Constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

export default function AutomaticImpact() {
  const amountOptions = [5, 25, 50];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Heading */}
        <Text style={styles.heading}>
          From Caring to <Text style={styles.headingHighlight}>Doing</Text> in 3 Simple Steps.
        </Text>

        {/* Three Step Cards */}
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.card}>
            <View style={styles.stepCircleBlue}>
              <Text style={styles.stepNumberBlue}>1</Text>
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
            <View style={styles.stepCirclePink}>
              <Text style={styles.stepNumberPink}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Split it across every nonprofit you care about</Text>
          </View>

          {/* Step 3 */}
          <View style={styles.card}>
            <View style={styles.stepCirclePurple}>
              <Text style={styles.stepNumberPurple}>3</Text>
            </View>
            <Text style={styles.stepTitle}>We handle everything automatically</Text>
          </View>
        </View>

        <Text style={styles.benefitsMessage}>
          Just set it once, and become someone who actually makes a difference.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc', // from-blue-50 via-purple-50 to-pink-50 approximated
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 36,
  },
  headingHighlight: {
    color: '#1600ff',
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: screenWidth > 768 ? (screenWidth - 80) / 3 : screenWidth - 32,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  stepCircleBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PrimaryBlue,
  },
  stepCirclePink: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberPink: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  stepCirclePurple: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberPurple: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a855f7',
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
  benefitsMessage: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1600ff',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
});

