import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/store';

export default function HelloGreeting() {
  const { user } = useAuthStore();

  // Get user's first name or fallback to a default
  const getUserName = () => {
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.username) {
      return user.username;
    }
    return "there";
  };

  const userName = getUserName();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Hi {userName}! You're making a difference.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
});

