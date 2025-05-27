import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { PrimaryBlue } from '../Constants/Colors'

export default function SuggestedCrwd() {
  
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
      <Text style={{color: PrimaryBlue}}>Create a CRWD</Text>
    </View>
    <FlatList data={suggestedCRWDs}
    horizontal={true}
    showsHorizontalScrollIndicator={false}
    renderItem={({item}) => (
      <View style={{marginHorizontal: 10, marginBottom:10, flexDirection: 'row', alignItems: 'center', gap: 10}}>
        <Image source={require('../assets/images/grocery.jpg')} style={{width: 40, height:40, borderRadius: 20,}} />
        <View>
        <Text style={{fontSize: 14, fontWeight: 500}}>{item.name}</Text>
        <Text style={{fontSize: 12, color: 'grey'}}>{item.members}</Text>
        <Text style={{fontSize: 12, color: 'grey', width: 200}}>{item.description.slice(0, 30)}..</Text>
      </View>
      <TouchableOpacity style={{backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 15 , borderRadius: 10}}>
        <Text style={{color: 'white'}}>Visit</Text>
      </TouchableOpacity>
      </View>
    )}
    />
    </>
  )
}