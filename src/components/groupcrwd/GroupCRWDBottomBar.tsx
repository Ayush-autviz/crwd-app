import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PrimaryBlue } from '../../Constants/Colors';

const GroupCRWDBottomBar: React.FC = () => {
  const navigation = useNavigation();

  const handleDonate = () => {
    navigation.navigate('Donation' as never);
  };

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        onPress={handleDonate}
        style={{
          backgroundColor: PrimaryBlue,
          paddingVertical: 15,
          borderRadius: 12,
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 4 },
          // shadowOpacity: 0.3,
          // shadowRadius: 8,
          // elevation: 8,
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


const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 13,
    paddingBottom:30,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
})

export default GroupCRWDBottomBar;
