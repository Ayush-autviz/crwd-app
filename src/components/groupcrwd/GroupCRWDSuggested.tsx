import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';

const suggestedCauses = [
  {
    name: "The Red Cross",
    description: "An health organization that...",
    image: require('../../assets/images/redcross.png'),
  },
  {
    name: "St. Judes",
    description: "The leading children's hea...",
    image: require('../../assets/images/grocery.jpg'),
  },
];

const GroupCRWDSuggested: React.FC = () => {
  const navigation = useNavigation();

  const handleVisit = (cause: any) => {
    // Navigate to another GroupCRWD screen or cause details
    navigation.navigate('GroupCRWD' as never);
  };

  const handleDiscoverMore = () => {
    navigation.navigate('Search' as never);
  };

  const renderSuggestedItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => handleVisit(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'white',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
        <Image 
          source={item.image} 
          style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 20,
            marginRight: 12
          }} 
        />
        <View style={{ flex: 1 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: '#111827',
            marginBottom: 2
          }}>
            {item.name}
          </Text>
          <Text style={{ 
            fontSize: 12, 
            color: PrimaryGrey,
            numberOfLines: 1
          }}>
            {item.description}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => handleVisit(item)}
        style={{
          backgroundColor: PrimaryBlue,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 6,
        }}
      >
        <Text style={{ 
          color: 'white', 
          fontSize: 12, 
          fontWeight: '600' 
        }}>
          Visit
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
      
      <FlatList
        data={suggestedCauses}
        renderItem={renderSuggestedItem}
        keyExtractor={(item, index) => index.toString()}
        scrollEnabled={false}
      />
      
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
