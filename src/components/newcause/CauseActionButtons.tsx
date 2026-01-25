import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Check } from 'lucide-react-native';
import { useAuthStore } from '../../store/store';

interface CauseActionButtonsProps {
  onAddToDonationBox: () => void;
  onDonate: () => void;
  isAlreadyInBox?: boolean;
}

export default function CauseActionButtons({
  onAddToDonationBox,
  onDonate,
  isAlreadyInBox = false,
}: CauseActionButtonsProps) {
  const navigation = useNavigation();
  const { user: currentUser } = useAuthStore();

  const handleAddToDonationBox = () => {
    if (!currentUser?.id) {
      navigation.navigate('SplashScreen' as never);
      return;
    }
    // If already in box, navigate to donation box setup tab instead of showing modal
    if (isAlreadyInBox) {
      // Navigate to bottom tab "Donate" with setup tab
      (navigation as any).reset({
        index: 0,
        routes: [
          {
            name: 'DrawerNav',
            state: {
              routes: [
                {
                  name: 'MainTabs',
                  state: {
                    routes: [
                      { name: 'Home' },
                      { name: 'Search' },
                      {
                        name: 'Donate',
                        params: {
                          initialTab: 'setup',
                        },
                      },
                      { name: 'Collectives' },
                      { name: 'Profile' },
                    ],
                    index: 2, // Donate tab index
                  },
                },
              ],
              index: 0,
            },
          },
        ],
      });
      return;
    }
    onAddToDonationBox();
  };

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
        onPress={handleAddToDonationBox}
        style={[
          styles.addToBoxButton,
          isAlreadyInBox && styles.addedButton
        ]}
        activeOpacity={0.7}
      >
        {isAlreadyInBox ? (
          <>
            <Check size={20} color="#16a34a" />
            <Text style={styles.addedButtonText}>Added</Text>
          </>
        ) : (
          <>
            <Plus size={20} color="#fff" />
            <Text style={styles.addToBoxButtonText}>Add to Donation Box</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Donate button is commented out in Vite version */}
      {/* <TouchableOpacity
        onPress={handleDonate}
        style={styles.donateButton}
        activeOpacity={0.7}
      >
        <Text style={styles.donateButtonText}>Be the First to Donate</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  addToBoxButton: {
    width: '100%',
    backgroundColor: '#1661ff',
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addedButton: {
    backgroundColor: '#dcfce7',
  },
  addToBoxButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#fff',
  },
  addedButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#fff',
  },
  donateButton: {
    width: '100%',
    backgroundColor: '#1600ff',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#FFFFFF',
  },
});

