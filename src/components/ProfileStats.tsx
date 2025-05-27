import { View, Text, FlatList } from 'react-native'
import React from 'react'
import { LightGrey, PrimaryGrey } from '../Constants/Colors';

export default function ProfileStats() {

    const stats = [
        {
            id: 1,
            name: "Causes",
            number: 10,
        },
        {
            id: 2,
            name: "CRWDS",
            number: 3,
        },
        {
            id: 3,
            name: "Followers",
            number: 58,
        },
        {
            id: 4,
            name: "Following",
            number: 8,
        }
    ];

    const categories = [
        "Environment",
        "Food Insecurity",
        "Education",
        "Healthcare",
    ];

  return (
    <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            {stats.map((stat) => (
                <View key={stat.id} style={{ alignItems: 'center', borderRightWidth: 1, borderRightColor: PrimaryGrey, paddingEnd: 20, }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{stat.number}</Text>
                    <Text>{stat.name}</Text>
                </View>
            ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20, borderBottomColor: LightGrey, borderBottomWidth: 1, paddingBottom: 10 }}>
            <FlatList
                data={categories}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={{ marginHorizontal: 10, marginVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LightGrey, padding: 10, borderRadius: 10 }} >
                        <Text style={{ fontSize: 14, fontWeight: 500 }}>{item}</Text>
                    </View>
                )}
            />
        </View>
    </View>
  )
}