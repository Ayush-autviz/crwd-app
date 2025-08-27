import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';

// Sample data for suggested CRWDs
const suggestedCRWDs = [
  {
    name: "Grocery Spot",
    members: "303 Members",
    description: "Community lunches every Saturday",
    image: require('../../assets/images/grocery.jpg'),
  },
  {
    name: "Food for Thought",
    members: "78 Members",
    description: "Solving world hunger. One meal at a time.",
    image: require('../../assets/images/grocery.jpg'),
  },
];

const GroupCRWDSuggested: React.FC = () => {
  const navigation = useNavigation();

  const handleVisit = (crwd: any) => {
    navigation.navigate('GroupCRWD' as never);
  };

  const handleDiscoverMore = () => {
    navigation.navigate('Search' as never);
  };

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
      <Text style={{ 
        fontSize: 18, 
        fontWeight: '600', 
        marginBottom: 16,
        color: '#111827'
      }}>
        Suggested CRWDS
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {suggestedCRWDs.map((crwd, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => handleVisit(crwd)}
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                padding: 16,
                minWidth: 200,
                alignItems: 'center',
                gap: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            >
              {/* Image on top */}
              <View style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden' }}>
                <Image 
                  source={crwd.image} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>

              {/* Text content below image */}
              <View style={{ alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '500', 
                  color: '#111827',
                  marginBottom: 4,
                  textAlign: 'center'
                }}>
                  {crwd.name}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#6b7280',
                  marginBottom: 4
                }}>
                  {crwd.members}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#6b7280',
                  width: 144,
                  lineHeight: 16,
                  textAlign: 'center'
                }}>
                  {crwd.description.length > 21
                    ? `${crwd.description.slice(0, 21)}..`
                    : crwd.description}
                </Text>
              </View>

              {/* Button at the bottom */}
              <TouchableOpacity 
                style={{
                  backgroundColor: '#16a34a',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: 12, 
                  fontWeight: '600' 
                }}>
                  Learn More
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
        <TouchableOpacity 
          onPress={handleDiscoverMore}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            paddingVertical: 8
          }}
        >
          <Text style={{ 
            color: PrimaryBlue, 
            fontSize: 14,
            marginRight: 4
          }}>
            Discover More
          </Text>
          <ChevronRight size={16} color={PrimaryBlue} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupCRWDSuggested;
