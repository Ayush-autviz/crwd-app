import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { Share2, Bookmark, UserPlus } from 'lucide-react-native';
import { PrimaryBlue, LightGrey, PrimaryGrey } from '../../Constants/Colors';

const orgAvatars = [
  require('../../assets/images/grocery.jpg'),
  require('../../assets/images/redcross.png'),
  require('../../assets/images/grocery.jpg'),
  require('../../assets/images/redcross.png'),
  require('../../assets/images/grocery.jpg'),
  require('../../assets/images/redcross.png'),
  require('../../assets/images/grocery.jpg'),
  require('../../assets/images/redcross.png'),
  require('../../assets/images/grocery.jpg'),
];

const interests = ['Animal Welfare', 'Environment', 'Food Insecurity'];

const categories = [
  "Animal Welfare",
  "Environment",
  "Food Insecurity",
  "Food Insecurity",
  "Environment",
  "Education",
  "Healthcare",
  "Social Justice",
  "Homelessness",
];

const GroupCRWDHeader: React.FC = () => {

  return (
    <View style={{ backgroundColor: 'white', padding: 16, margin: 8, borderRadius: 12 }}>
      {/* Action Buttons Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity style={{ 
          borderWidth: 1, 
          borderColor: LightGrey, 
          padding: 10, 
          borderRadius: 8,
          backgroundColor: 'white'
        }}>
          <Share2 size={20} color={PrimaryGrey} />
        </TouchableOpacity>
        <TouchableOpacity style={{ 
          borderWidth: 1, 
          borderColor: LightGrey, 
          padding: 10, 
          borderRadius: 8,
          backgroundColor: 'white'
        }}>
          <Bookmark size={20} color={PrimaryGrey} />
        </TouchableOpacity>
        <TouchableOpacity style={{ 
          backgroundColor: PrimaryBlue, 
          paddingVertical: 10, 
          paddingHorizontal: 20, 
          borderRadius: 8 ,
          justifyContent:"center",
          alignItems:"center"
        }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Join</Text>
        </TouchableOpacity>
      </View>

      {/* Group Info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={{ width: 48, height: 48, borderRadius: 12 }} 
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: "#374151" }}>
            Feed the hungry
          </Text>
        </View>
      </View>

      {/* Bio */}
      <Text style={{ fontSize: 16, color: '#374151', marginBottom: 16, lineHeight: 24 }}>
        families experiencing food insecurity in the greater Atlanta area. Join us in the cause to solve world hunger.
      </Text>

      {/* Founder */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={{ width: 20, height: 20, borderRadius: 10 }} 
        />
        <Text style={{ fontSize: 12, color: PrimaryGrey }}>
          Founded by <Text style={{ fontWeight: '600', color: '#374151' }}>@ChadFofana1</Text>
        </Text>
      </View>

      {/* Stats */}
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: '#f9fafb', 
        borderRadius: 12, 
        paddingVertical: 16,
        marginBottom: 16
      }}>
        <View style={{ flex: 1, alignItems: 'center',justifyContent:"center" }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827',textAlign:'center' }}>10</Text>
          <Text style={{ fontSize: 12, color: PrimaryGrey,textAlign:'center' }}>Causes</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
        <View style={{ flex: 1, alignItems: 'center',justifyContent:"center" }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827',textAlign:"center" }}>58</Text>
          <Text style={{ fontSize: 12, color: PrimaryGrey,textAlign:"center" }}>Members</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
        <View style={{ flex: 1, alignItems: 'center',justifyContent:"center" }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827',textAlign:"center" }}>102</Text>
          <Text style={{ fontSize: 12, color: PrimaryGrey,textAlign:"center" }}>Impact Score</Text>
        </View>
      </View>

      {/* Interest Tags */}
      {/* <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {interests.map((interest, index) => (
          <View key={index} style={{ 
            backgroundColor: LightGrey, 
            paddingHorizontal: 13, 
            paddingVertical: 12, 
            borderRadius: 10,
            marginTop:15,
           // marginLeft:10
          }}>
            <Text style={{ fontSize: 13, color: '#000',fontWeight:'500' }}>{interest}</Text>
          </View>
        ))}
      </View> */}


<FlatList data={categories}
                    horizontal={true}
                    
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item,index }) => (
                        <View key={index} style={{ 
                            backgroundColor: LightGrey, 
                            paddingHorizontal: 13, 
                            paddingVertical: 12, 
                            borderRadius: 10,
                            marginTop:10,
                            marginLeft:10
                          }}>
                            <Text style={{ fontSize: 13, color: '#000',fontWeight:'500' }}>{item}</Text>
                          </View>
                    )}
                />

      {/* Organization Avatars */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8,marginTop:24 }}>
        {orgAvatars.slice(0, 6).map((avatar, index) => (
          <Image 
            key={index} 
            source={avatar} 
            style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 14, 
              borderWidth: 2, 
              borderColor: 'white',
              marginLeft: index > 0 ? -8 : 0
            }} 
          />
        ))}
      </View>

      {/* Supporting Text */}
      <Text style={{ fontSize: 12, color: PrimaryGrey, lineHeight: 16 }}>
        Currently supporting <Text style={{ fontWeight: '600' }}>10 Non Profits</Text>: Grocery Spot, Food for Thought, Meals on Wheels, American Red Cross, & Pizza Hut…{' '}
        <Text style={{ color: PrimaryBlue, textDecorationLine: 'underline' }}>See More</Text>
      </Text>
    </View>
  );
};

export default GroupCRWDHeader;
