import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PrimaryBlue } from '../../Constants/Colors';

const CauseDonateBar: React.FC = () => {
  const navigation = useNavigation();

  const handleDonate = () => {
    navigation.navigate('Donation' as never);
  };

  return (
    <View style={{
      position: 'absolute',
      bottom: 96, // Above the tab bar
      left: 0,
      right: 0,
      paddingHorizontal: 12,
      zIndex: 20,
    }}>
      <TouchableOpacity 
        onPress={handleDonate}
        style={{
          backgroundColor: PrimaryBlue,
          paddingVertical: 20,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text style={{
          color: 'white',
          fontSize: 18,
          fontWeight: '600',
          textAlign: 'center',
        }}>
          Donate
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CauseDonateBar;
