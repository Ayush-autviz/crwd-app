import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { PrimaryBlue, PrimaryGreen, PrimaryGrey } from '../Constants/Colors'
import { ChevronRight } from 'lucide-react-native';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';

interface SuggestedCrwdProps {
  collectives?: any[];
  isLoading?: boolean;
  error?: any;
}

export default function SuggestedCrwd({ collectives = [], isLoading = false, error = null }: SuggestedCrwdProps) {
  const navigation = useNavigation();

  const handleVisitCrwd = (collectiveId: string) => {
    navigation.navigate('GroupCRWD' as never, { collectiveId });
  };

  // Use API data or fallback to sample data
  // const suggestedCRWDs = collectives.length > 0 ? collectives.slice(0, 3) : [
  //   {
  //     id: "1",
  //     name: "Grocery Spot",
  //     members: "303 Members",
  //     description: "Community lunches every Saturday",
  //     image: require("../assets/images/grocery.jpg"),
  //   },
  //   {
  //     id: "2", 
  //     name: "Food for Thought",
  //     members: "78 Members",
  //     description: "Solving world hunger. One meal at a time.",
  //     image: require("../assets/images/grocery.jpg"),
  //   },
  //   {
  //     id: "3",
  //     name: "Community Care",
  //     members: "156 Members", 
  //     description: "Supporting local families in need",
  //     image: require("../assets/images/grocery.jpg"),
  //   },
  // ];

    return (
    <>
    <View style={{marginVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 5}}>
      <Text style={{fontSize: 17, fontWeight: 'bold'}}>Discover giving in action</Text>
      <TouchableOpacity onPress={() => navigation.navigate('CreateCRWD')}>
      <ChevronRight color={PrimaryBlue} size={19} style={{marginTop: 1}}/>
      </TouchableOpacity>
    </View>
    
    {isLoading ? (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PrimaryBlue} />
        <Text style={{ marginTop: 10, color: PrimaryGrey }}>Loading collectives...</Text>
      </View>
    ) : error ? (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Failed to load collectives. Please try again.
        </Text>
      </View>
    ) : (
      <FlatList 
        data={collectives.slice(0, 10)}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        renderItem={({item}) => (
          <TouchableOpacity 
            onPress={() => handleVisitCrwd(item.id)}  
            style={{marginHorizontal: 10, marginBottom:10, alignItems: 'center', gap: 10,}}
          >
            {/* <Image 
              source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
              style={{width: 40, height:40, borderRadius: 20,}} 
            /> */}
            <Avatar size={40}>
              <AvatarImage src={item.image} />
            <AvatarFallback>
              {item.name.split(' ')[0][0].toUpperCase()}
            </AvatarFallback>
            </Avatar>
            <View style={{alignItems: 'center', marginBottom: 10}}>
              <Text style={{fontSize: 14, fontWeight: 500}}>{item.name}</Text>
              <Text style={{fontSize: 12, color: 'grey'}}>{item.members}</Text>
              <Text style={{fontSize: 12, color: 'grey', width: 150, textAlign: 'center'}}>
                {item.description?.slice(0, 21)}..
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleVisitCrwd(item.id)}
              style={{backgroundColor: PrimaryGreen, paddingVertical: 10, paddingHorizontal: 15 , borderRadius: 10}}
            >
              <Text style={{color: 'white'}}>Learn More</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    )}
    </>
  )
}