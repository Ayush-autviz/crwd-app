import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { LightGrey, PrimaryGrey, PrimaryBlue } from '../Constants/Colors'
import { useNavigation } from '@react-navigation/native'

interface ProfileStatsProps {
    causes?: number;
    crwds?: number;
    followers?: number;
    following?: number;
    profileId?: string;
    isLoadingCauses?: boolean;
    isLoadingCrwds?: boolean;
    isLoadingFollowers?: boolean;
    isLoadingFollowing?: boolean;
}

export default function ProfileStats({ 
    causes = 0, 
    crwds = 0, 
    followers = 0, 
    following = 0,
    profileId = '',
    isLoadingCauses = false,
    isLoadingCrwds = false,
    isLoadingFollowers = false,
    isLoadingFollowing = false
}: ProfileStatsProps) {
    const navigation = useNavigation()

    const handleStatsPress = (tab: 'causes' | 'following' | 'followers' | 'crwds') => {
        navigation.navigate('Statistics' as never, { screen: tab, userId: profileId || undefined })
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
                {isLoadingCauses ? (
                    <ActivityIndicator size="small" color={PrimaryBlue} />
                ) : (
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                        {causes}
                    </Text>
                )}
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: 'center' }}>Causes</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <TouchableOpacity 
                onPress={() => handleStatsPress('crwds')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                {isLoadingCrwds ? (
                    <ActivityIndicator size="small" color={PrimaryBlue} />
                ) : (
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>
                        {crwds}
                    </Text>
                )}
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>Collectives</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <TouchableOpacity 
                onPress={() => handleStatsPress('followers')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                {isLoadingFollowers ? (
                    <ActivityIndicator size="small" color={PrimaryBlue} />
                ) : (
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>
                        {followers}
                    </Text>
                )}
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>Followers</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 }} />
            <TouchableOpacity 
                onPress={() => handleStatsPress('following')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                {isLoadingFollowing ? (
                    <ActivityIndicator size="small" color={PrimaryBlue} />
                ) : (
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: "center" }}>
                        {following}
                    </Text>
                )}
                <Text style={{ fontSize: 12, color: PrimaryGrey, textAlign: "center" }}>Following</Text>
            </TouchableOpacity>
        </View>
    )
}