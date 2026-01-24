import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function StartMakingDifference() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Headline */}
        <Text style={styles.headline}>Ready to stop wishing and start showing up?</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          It's not about how much. It's about showing up. The commitment matters.
        </Text>

        {/* Call-to-Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('OnBoard' as never)}
        >
          <Text style={styles.buttonText}>Get Started for Free</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#a955f7',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  content: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  headline: {
    fontSize: 30,
    fontWeight: '900',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
    // lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 600,
    // lineHeight: 28,
  },
  button: {
    backgroundColor: '#aeff30',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'black',
    fontWeight: '900',
    fontSize: 18,
  },
});

