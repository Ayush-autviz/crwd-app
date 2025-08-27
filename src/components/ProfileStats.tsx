import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { LightGrey, PrimaryGrey } from '../Constants/Colors'
import { useNavigation } from '@react-navigation/native'

export default function ProfileStats() {
    const navigation = useNavigation()

    const handleStatsPress = (tab: 'causes' | 'following' | 'followers' | 'crwds') => {
        navigation.navigate('Statistics' as never, { screen: tab })
    }

    return (
        <View style={{ 
            flexDirection: 'row', 
            backgroundColor: '#f9fafb', 
            borderRadius: 12, 
            paddingVertical: 16,
            marginTop: 25
        }}>
            <TouchableOpacity 
                onPress={() => handleStatsPress('causes')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>10</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: 'center' }}>Causes</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <TouchableOpacity 
                onPress={() => handleStatsPress('crwds')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>3</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>CRWDs</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <TouchableOpacity 
                onPress={() => handleStatsPress('followers')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>58</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>Followers</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <TouchableOpacity 
                onPress={() => handleStatsPress('following')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>8</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>Following</Text>
            </TouchableOpacity>
        </View>
    )
}