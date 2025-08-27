import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { PrimaryBlue, LightGrey, PrimaryGrey } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';

const orgAvatars = [
  {
    name: "ASPCA",
    image: require('../../assets/images/grocery.jpg'),
  },
  {
    name: "CRI",
    image: require('../../assets/images/redcross.png'),
  },
  {
    name: "CureSearch",
    image: require('../../assets/images/grocery.jpg'),
  },
  {
    name: "Paws",
    image: require('../../assets/images/redcross.png'),
  },
];

const interests = ['Animal Welfare', 'Environment', 'Food Insecurity'];

interface GroupCRWDHeaderProps {
  hasJoined?: boolean;
  onJoin?: () => void;
  id?: string;
}

const GroupCRWDHeader: React.FC<GroupCRWDHeaderProps> = ({
  hasJoined = false,
  onJoin,
  id = "",
}) => {
  const navigation = useNavigation();

  const handleStatsPress = (type: string) => {
    if (type === 'causes') {
      navigation.navigate('Members' as never, { tab: 'Causes' });
    } else if (type === 'members') {
      navigation.navigate('Members' as never, { tab: 'Members' });
    } else if (type === 'donations') {
      navigation.navigate('Members' as never, { tab: 'Collective Donations' });
    }
  };

  const handleOrgPress = () => {
    navigation.navigate('CauseScreen' as never);
  };

  const handleSeeAllPress = () => {
    navigation.navigate('Members' as never);
  };

  return (
    <View style={{ backgroundColor: 'white', padding: 16, margin: 8, borderRadius: 12 }}>
      {/* Top Row - Group Title */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '600', color: '#374151', marginTop: 8 }}>
              Feed the hungry
            </Text>
          </View>
        </View>
      </View>

      {/* Founder */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={{ width: 56, height: 56, borderRadius: 28 }} 
        />
        <Text style={{ fontSize: 14, color: '#6b7280' }}>Founded by</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>@ChadFofana1</Text>
        <TouchableOpacity style={{ 
          borderWidth: 1, 
          borderColor: LightGrey, 
          padding: 8, 
          borderRadius: 6,
          backgroundColor: 'white'
        }}>
          <Bookmark size={20} color={PrimaryGrey} />
        </TouchableOpacity>
      </View>

      {/* Bio */}
      <Text style={{ fontSize: 20, color: '#374151', marginBottom: 16, lineHeight: 28, textAlign: 'center' }}>
        families experiencing food insecurity in the greater Atlanta area. Join us in the cause to solve world hunger.
      </Text>

      {/* Stats */}
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: '#f9fafb', 
        borderRadius: 12, 
        paddingVertical: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
      }}>
        <TouchableOpacity 
          onPress={() => handleStatsPress('causes')}
          style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>10</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', width: '70%' }}>Causes Supported</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleStatsPress('members')}
          style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>58</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>Members</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleStatsPress('donations')}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>12</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', width: '70%' }}>Collective Donations</Text>
        </TouchableOpacity>
      </View>

      {/* Interest Tags */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {interests.map((interest, index) => (
          <View key={index} style={{ 
            backgroundColor: LightGrey, 
            paddingHorizontal: 10, 
            paddingVertical: 10, 
            borderRadius: 10,
          }}>
            <Text style={{ fontSize: 13, color: '#000', fontWeight: '500' }}>{interest}</Text>
          </View>
        ))}
      </View>

      {/* Recently Supported Nonprofits */}
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 16 }}>
        Recently Supported Nonprofits
      </Text>

      {/* Organization Avatars */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' }}>
        {orgAvatars.map((org, index) => (
          <TouchableOpacity key={index} onPress={handleOrgPress} style={{ alignItems: 'center', marginRight: 20 }}>
            <Image 
              source={org.image} 
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 8,
                marginBottom: 4
              }} 
            />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280' }}>
              {org.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Supporting Text */}
      <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 16 }}>
        Currently supporting{' '}
        <Text style={{ fontWeight: '600' }}>10 Non Profits</Text>: Grocery Spot, Food for Thought, Meals on Wheels, American Red Cross, & Pizza Hut…{' '}
        <Text 
          style={{ color: PrimaryBlue, textDecorationLine: 'underline' }}
          onPress={handleSeeAllPress}
        >
          See All
        </Text>
      </Text>
    </View>
  );
};

export default GroupCRWDHeader;
