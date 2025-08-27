import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { PrimaryBlue, LightGrey } from '../Constants/Colors';
import { useNavigation } from '@react-navigation/native';

interface ProfileInterestsProps {
  interests: string[];
  title?: string;
  className?: string;
}

const ProfileInterests: React.FC<ProfileInterestsProps> = ({ 
  interests, 
  title, 
  className 
}) => {
  const navigation = useNavigation();

  const handleInterestPress = (interest: string) => {
    navigation.navigate('Search' as never, { query: interest } as never);
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
      {title && (
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#111827' }}>
          {title}
        </Text>
      )}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {interests.map((interest, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleInterestPress(interest)}
            style={{
              backgroundColor: LightGrey,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              minWidth: 'auto',
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: '#374151',
              textAlign: 'center',
            }}>
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ProfileInterests;
