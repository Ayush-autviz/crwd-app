import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LightGrey } from '../../Constants/Colors';

interface OnboardingHeaderProps {
  showBackButton?: boolean;
}

export default function OnboardingHeader({ showBackButton = true }: OnboardingHeaderProps) {
  const navigation = useNavigation();

  return (
    <View
      style={{
        // marginHorizontal: 16,
        marginTop: 5,
        // paddingHorizontal: 16,
        paddingBottom: 10,
        borderRadius: 16,
        // backgroundColor: '#ffffff',
        // borderWidth: 1,
        borderColor: LightGrey,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Back Button */}
      {showBackButton ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: 6,
            borderRadius: 50,
            // backgroundColor: '#f2f2f2',      
          }}
        >
          <ChevronLeft size={20} color="#000" />
        </TouchableOpacity>
      ) : (
        <View style={{ padding: 6, width: 32 }} />
      )}

      {/* Logo */}
      <Image
        source={require('../../assets/logo/logo3.webp')}
        style={{
          width: 100,
          height: 40,
          resizeMode: 'contain',
        }}
      />

      {/* Right Icon Placeholder */}
      <TouchableOpacity disabled style={{ padding: 6 }}>
        <Plus size={20} color="transparent" />
      </TouchableOpacity>
    </View>
  );
}
