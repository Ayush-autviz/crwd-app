import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { PrimaryBlue, PrimaryGreen, SecondaryBlue, SecondaryGreen, TertiaryBlue, PrimaryGrey } from '../Constants/Colors';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';

interface NearbyCausesProps {
  causes?: any[];
  isLoading?: boolean;
  error?: any;
}

export default function NearbyCauses({ causes = [], isLoading = false, error = null }: NearbyCausesProps) {
    const navigation = useNavigation();

    const handleVisitCause = (causeId: string) => {
        navigation.navigate('CauseScreen' as never, { causeId });
    };

    // Use API data or fallback to sample data
    const nearbyCauses = causes.length > 0 ? causes.slice(0, 3) : [];

  return (
    <View style={{marginBottom: 20}}>
      {/* <Text style={{fontSize: 18, fontWeight: 'bold'}}>Causes near you</Text> */}
      
      {isLoading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <Text style={{ marginTop: 10, color: PrimaryGrey }}>Loading causes...</Text>
        </View>
      ) : error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: 'red', textAlign: 'center' }}>
            Failed to load causes. Please try again.
          </Text>
        </View>
      ) : (
        <FlatList
          data={nearbyCauses}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleVisitCause(item.id)} 
              style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {/* <Image 
                  source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
                  style={{ width: 40, height: 40, borderRadius: 20, }} 
                /> */}
                <Avatar size={40}>
                    <AvatarImage src={item.image} />
                    <AvatarFallback>
                        {item.name.split(' ')[0][0].toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <View style={{width: '55%'}}>
                  <View style={{backgroundColor: item.type === "Collective" ? SecondaryGreen : SecondaryBlue, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 5, alignSelf: 'flex-start'}}>
                    <Text style={{ fontSize: 12, color: item.type === "Collective" ? PrimaryGreen : PrimaryBlue, fontWeight: '500'}}>{item.type}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: 'grey'}} numberOfLines={2}>{item.description}</Text>
                </View>
              </View>
              <View style={{alignItems: 'center'}}>
                {item.type === "Nonprofit" && (
                  <>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('CauseScreen' as never, { causeId: item.id })} 
                      style={{backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, marginBottom: 5}}
                    >
                      <Text style={{color: 'white'}}>Donate Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleVisitCause(item.id)}>
                      <Text style={{ color: PrimaryBlue }}>Visit Profile</Text>
                    </TouchableOpacity>
                  </>
                )}
                {item.type === "Collective" && (
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('GroupCRWD' as never, { collectiveId: item.id })} 
                    style={{backgroundColor: PrimaryGreen, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10}}
                  >
                    <Text style={{color: 'white'}}>Learn More</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}