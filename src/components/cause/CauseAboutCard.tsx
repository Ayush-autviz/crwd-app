import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { categories } from '../../Constants/categories';
import { MapPin } from 'lucide-react-native';

interface CauseAboutCardProps {
  causeData?: any;
}

const CauseAboutCard: React.FC<CauseAboutCardProps> = ({ causeData }) => {
  const navigation = useNavigation();

  const handleSearchCategory = () => {
    navigation.navigate('Search' as never);
  };

  // Find the category based on causeData.category
  const category = categories.find((cat) => cat.id === causeData?.category);

  return (
    <View style={{ 
      backgroundColor: 'white', 
      paddingHorizontal: 20, 
      // marginHorizontal: 12, 
      marginBottom: 8 
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingHorizontal: 12 }}>
        <Image 
          source={{ uri: causeData?.logo }} 
          style={{ width: 48, height: 48, borderRadius: 12 }} 
        />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', }}>
          {causeData?.name}
        </Text>
      </View>

      {/* Description */}
      <Text style={{ 
        fontSize: 16, 
        color: '#374151', 
        lineHeight: 24, 
        marginBottom: 16 
      }}>
        {causeData?.mission}
      </Text>

      {/* Details Section */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 }}>
          {/* <Text style={{ fontSize: 20, color: PrimaryGrey }}>📍</Text> */}
          <MapPin size={20} color={PrimaryGrey} />
        </View>
        
        <View style={{ flex: 1, gap: 24 }}>
          {/* Address */}
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
              Address
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
              {causeData?.street && causeData?.city && causeData?.state 
                ? `${causeData.street}, ${causeData.city}, ${causeData.state}`
                : 'Not Available'
              }
            </Text>
          </View>

          {/* Main Focus */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: PrimaryGrey, marginBottom: 4 }}>
              MAIN FOCUS
            </Text>
            <TouchableOpacity onPress={handleSearchCategory}>
              <Text style={{ 
                fontSize: 14, 
                color: PrimaryBlue, 
                textDecorationLine: 'underline' 
              }}>
                {category?.name || 'Not Available'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Established */}
          {/* <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: PrimaryGrey, marginBottom: 4 }}>
              ESTABLISHED
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
              2012
            </Text>
          </View> */}

          {/* Tax ID */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: PrimaryGrey, marginBottom: 4 }}>
              TAX ID
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
              {causeData?.tax_id_number || 'Not Available'}
            </Text>
          </View>

          {/* Legal Notice */}
          {/* <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Helping Humanity is a 501(c)(3) public charity, EIN 13-1788491.
          </Text> */}
        </View>
      </View>
    </View>
  );
};

export default CauseAboutCard;
