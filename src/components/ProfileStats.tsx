import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { LightGrey, PrimaryGrey } from '../Constants/Colors'
import { useNavigation } from '@react-navigation/native'

export default function ProfileStats() {
    const navigation = useNavigation()

    const handleStatsPress = () => {
        navigation.navigate('Statistics' as never)
    }

    return (
        <TouchableOpacity 
            onPress={handleStatsPress}
            style={{ 
                flexDirection: 'row', 
                backgroundColor: '#f9fafb', 
                borderRadius: 12, 
                paddingVertical: 16,
                marginTop: 25
            }}
        >
            <View style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>10</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: 'center' }}>Causes</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>3</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>CRWDs</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>58</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>Followers</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>8</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>Following</Text>
            </View>
        </TouchableOpacity>
    )
}