import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { PrimaryBlue } from '../Constants/Colors'

export default function SuggestedCrwd() {
  const navigation = useNavigation();

  const handleVisitCrwd = () => {
    navigation.navigate('GroupCRWD' as never);
  };

          // Sample data for suggested CRWDs
          const suggestedCRWDs = [
            {
              name: "Grocery Spot",
              members: "303 Members",
              description: "Community lunches every Saturday",
              image: "/grocery.jpg",
            },
            {
              name: "Food for Thought",
              members: "78 Members",
              description: "Solving world hunger. One meal at a time.",
              image: "/grocery.jpg",
            },
            {
              name: "Food for Thought",
              members: "78 Members",
              description: "Solving world hunger. One meal at a time.",
              image: "/grocery.jpg",
            },
          ];

    return (
    <>
    <View style={{marginVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
      <Text style={{fontSize: 18, fontWeight: 'bold'}}>Suggested CRWD's</Text>
      <TouchableOpacity onPress={() => navigation.navigate('CreateCRWD')}>
      <Text style={{color: PrimaryBlue}}>Create a CRWD</Text>
      </TouchableOpacity>
    </View>
    <FlatList data={suggestedCRWDs}
    horizontal={true}
    showsHorizontalScrollIndicator={false}
    renderItem={({item}) => (
      <TouchableOpacity onPress={handleVisitCrwd}  style={{marginHorizontal: 10, marginBottom:10, flexDirection: 'row', alignItems: 'center', gap: 10}}>
        <Image source={require('../assets/images/grocery.jpg')} style={{width: 40, height:40, borderRadius: 20,}} />
        <View>
        <Text style={{fontSize: 14, fontWeight: 500}}>{item.name}</Text>
        <Text style={{fontSize: 12, color: 'grey'}}>{item.members}</Text>
        <Text style={{fontSize: 12, color: 'grey', width: 200}}>{item.description.slice(0, 30)}..</Text>
      </View>
      <TouchableOpacity
        onPress={handleVisitCrwd}
        style={{backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 15 , borderRadius: 10}}
      >
        <Text style={{color: 'white'}}>Visit</Text>
      </TouchableOpacity>
      </TouchableOpacity>
    )}
    />
    </>
  )
}