import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { PrimaryBlue } from '../Constants/Colors';
import { ChevronRight } from 'lucide-react-native';

export default function SuggestdCauses() {
    const navigation = useNavigation();

    const handleVisitCause = () => {
        navigation.navigate('CauseScreen' as never);
    };

    const handleDiscoverMore = () => {
        navigation.navigate('Search' as never);
    };

    // Sample data for suggested causes
    const suggestedCauses = [
        {
            name: "The Red Cross",
            description: "An health organization that provides medical care to those in need",
            image: require("../assets/images/redcross.png")
        },
        {
            name: "St. Judes",
            description: "The leading children's health organization in the world",
            image: require("../assets/images/grocery.jpg"),
        },
        {
            name: "Women's Healthcare of At...",
            description: "We are Atlanta's #1 healthcare organization",
            image: require("../assets/images/redcross.png"),
        },
    ];

    return (
        <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Suggested Causes</Text>
            <FlatList
                data={suggestedCauses}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={handleVisitCause} style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Image source={item.image} style={{ width: 40, height: 40, borderRadius: 20, }} />
                        <View style={{width: '55%'}}>
                            <Text style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</Text>
                            <Text style={{ fontSize: 12, color: 'grey'}} numberOfLines={2}>{item.description}</Text>
                        </View>
                        </View>
                        <View style={{alignItems: 'center'}}>
                            <TouchableOpacity onPress={() =>  navigation.navigate('Donation' as never)} style={{backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, marginBottom: 5}}>
                                <Text style={{color: 'white'}}>Donate Now</Text>
                            </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleVisitCause}
                        >
                            <Text style={{ color: PrimaryBlue }}>Visit Profile</Text>
                        </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )} />
            <TouchableOpacity
                onPress={handleDiscoverMore}
                style={{ paddingVertical: 10, marginTop: 10, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' }}
            >
                <Text style={{ color: PrimaryBlue }}>Discover More</Text>
                <ChevronRight color={PrimaryBlue} size={16} />
            </TouchableOpacity>
        </View>
    )
}