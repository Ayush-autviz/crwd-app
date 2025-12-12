import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { PrimaryBlue, PrimaryGreen, PrimaryGrey, LightGrey, PrimaryDark } from '../Constants/Colors'
import { ChevronRight } from 'lucide-react-native';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';

interface SuggestedCrwdProps {
  collectives?: any[];
  isLoading?: boolean;
  error?: any;
}

export default function SuggestedCrwd({ collectives = [], isLoading = false, error = null }: SuggestedCrwdProps) {
  const navigation = useNavigation();
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    if (!collectives || collectives.length === 0) return;

    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % collectives.slice(0, 10).length;
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [collectives]);

  const handleVisitCrwd = (collectiveId: string) => {
    navigation.navigate('GroupCRWD' as never, { collectiveId });
  };

  return (
    <>
      <View style={{ marginVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Text style={{ fontSize: 17, fontWeight: 'bold', color: PrimaryDark }}>Discover giving in action</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateCRWD' as never)}>
          <ChevronRight color={PrimaryBlue} size={19} style={{ marginTop: 1 }} />
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
      )
        :
        collectives.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: PrimaryGrey, textAlign: 'center' }}>
              No collectives found.
            </Text>
          </View>
        ) : (
          <FlatList ref={flatListRef} data={collectives.slice(0, 10)} horizontal={true} pagingEnabled={true} showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({ length: 200, offset: 200 * index, index,
            })} renderItem={({ item }) => ( <TouchableOpacity
                onPress={() => handleVisitCrwd(item.id)} style={{
                  marginHorizontal: 10, marginBottom: 10, alignItems: 'center', gap: 10, backgroundColor: LightGrey,
                  borderRadius: 16, padding: 16,}} >

                <Avatar size={40}>
                  <AvatarImage src={item.image} />
                  <AvatarFallback>
                    {item?.name?.split(' ')[0][0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500' }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.members}</Text>
                  <Text style={{ fontSize: 12, color: PrimaryGrey, width: 150, textAlign: 'center' }}>
                    {item.description?.slice(0, 21)}..
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleVisitCrwd(item.id)}
                  style={{ backgroundColor: PrimaryGreen, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 }}
                >
                  <Text style={{ color: 'white' }}>Learn More</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
    </>
  )
}
