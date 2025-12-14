import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/store';

interface CauseActionButtonsProps {
  onAddToDonationBox: () => void;
  onDonate: () => void;
}

export default function CauseActionButtons({
  onAddToDonationBox,
  onDonate,
}: CauseActionButtonsProps) {
  const navigation = useNavigation();
  const { user: currentUser } = useAuthStore();

  const handleDonate = () => {
    if (!currentUser?.id) {
      navigation.navigate('SplashScreen' as never);
      return;
    }
    onDonate();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleDonate}
        style={styles.donateButton}
        activeOpacity={0.7}
      >
        <Text style={styles.donateButtonText}>Be the First to Donate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  donateButton: {
    width: '100%',
    backgroundColor: '#1600ff',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

