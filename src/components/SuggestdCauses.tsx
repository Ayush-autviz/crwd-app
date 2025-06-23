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
            description: "An health organization that...",
            image: require("../assets/images/redcross.png")
        },
        {
            name: "St. Judes",
            description: "The leading children's hea...",
            image: require("../assets/images/grocery.jpg"),
        },
        {
            name: "Women's Healthcare of At...",
            description: "We are Atlanta's #1 healthca...",
            image: require("../assets/images/redcross.png"),
        },
    ];

    return (
        <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Suggested Causes</Text>
            <FlatList
                data={suggestedCauses}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={handleVisitCause} style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Image source={item.image} style={{ width: 40, height: 40, borderRadius: 20, }} />
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</Text>
                            <Text style={{ fontSize: 12, color: 'grey' }}>{item.description}</Text>
                        </View>
                        </View>
                        <TouchableOpacity
                            onPress={handleVisitCause}
                            style={{ backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 }}
                        >
                            <Text style={{ color: 'white' }}>Visit</Text>
                        </TouchableOpacity>
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