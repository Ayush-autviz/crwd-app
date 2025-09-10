import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { PrimaryBlue, PrimaryGreen, SecondaryBlue, SecondaryGreen, TertiaryBlue } from '../Constants/Colors';

export default function NearbyCauses() {
    const navigation = useNavigation();

    const handleVisitCause = () => {
        navigation.navigate('CauseScreen' as never);
    };

    // Sample data for nearby causes
  const nearbyCauses = [
    {
      name: "The Red Cross",
      description: "An health organization that provides medical care to those in need",
      image: require("../assets/images/redcross.png"),
      type: "Circle"
    },
    {
      name: "St. Judes",
      description: "The leading children's health organization in the world",
      image: require("../assets/images/grocery.jpg"),
      type: "Nonprofit"
    },
    {
      name: "Women's Healthcare of At...",
      description: "We are Atlanta's #1 healthcare organization",
      image: require("../assets/images/redcross.png"),
      type: "Circle"
    },
  ];

  return (
    <View style={{marginVertical: 20}}>
      <Text style={{fontSize: 18, fontWeight: 'bold'}}>Causes near you</Text>
      <FlatList
        data={nearbyCauses}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={handleVisitCause} style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Image source={item.image} style={{ width: 40, height: 40, borderRadius: 20, }} />
              <View style={{width: '55%'}}>
                <View style={{backgroundColor: item.type === "Circle" ? SecondaryGreen : SecondaryBlue, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 5, alignSelf: 'flex-start'}}>
                  <Text style={{ fontSize: 12, color: item.type === "Circle" ? PrimaryGreen : PrimaryBlue, fontWeight: '500'}}>{item.type}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: 'grey'}} numberOfLines={2}>{item.description}</Text>
              </View>
            </View>
            <View style={{alignItems: 'center'}}>
              {item.type === "Nonprofit" && (
                <>
                  <TouchableOpacity onPress={() => navigation.navigate('Donation' as never)} style={{backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, marginBottom: 5}}>
                    <Text style={{color: 'white'}}>Donate Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleVisitCause}>
                    <Text style={{ color: PrimaryBlue }}>Visit Profile</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.type === "Circle" && (
                <TouchableOpacity onPress={() => navigation.navigate('GroupCRWD' as never)} style={{backgroundColor: PrimaryGreen, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10}}>
                  <Text style={{color: 'white'}}>Join Circle</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}