import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';

const CauseAboutCard: React.FC = () => {
  const navigation = useNavigation();

  const handleSearchAnimalWelfare = () => {
    navigation.navigate('Search' as never);
  };

  const fullDescription = `This is a bio about Non Profit and how they give back to their community so that users can learn about how their money is supporting others. Here's more information about our non-profit. This is a long description so that you can learn about all the details of our organization. We love what we do and we hope you do too. Please reach out if you have any questions.`;

  return (
    <View style={{ 
      backgroundColor: 'white', 
      padding: 20, 
      marginHorizontal: 12, 
      marginBottom: 8 
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={{ width: 48, height: 48, borderRadius: 12 }} 
        />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
          Helping humanity
        </Text>
      </View>

      {/* Description */}
      <Text style={{ 
        fontSize: 16, 
        color: '#374151', 
        lineHeight: 24, 
        marginBottom: 16 
      }}>
        {fullDescription}
      </Text>

      {/* Details Section */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 }}>
          <MapPin size={20} color={PrimaryGrey} />
        </View>
        
        <View style={{ flex: 1, gap: 24 }}>
          {/* Address */}
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
              Address
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
              123 Main Street. USA 10010
            </Text>
          </View>

          {/* Main Focus */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: PrimaryGrey, marginBottom: 4 }}>
              MAIN FOCUS
            </Text>
            <TouchableOpacity onPress={handleSearchAnimalWelfare}>
              <Text style={{ 
                fontSize: 14, 
                color: PrimaryBlue, 
                textDecorationLine: 'underline' 
              }}>
                Animal Welfare
              </Text>
            </TouchableOpacity>
          </View>

          {/* Established */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: PrimaryGrey, marginBottom: 4 }}>
              ESTABLISHED
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
              2012
            </Text>
          </View>

          {/* Tax ID */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: PrimaryGrey, marginBottom: 4 }}>
              TAX ID
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
              10125-3129
            </Text>
          </View>

          {/* Legal Notice */}
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Helping Humanity is a 501(c)(3) public charity, EIN 13-1788491.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CauseAboutCard;
