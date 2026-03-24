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
    onStatPress?: (tab: 'causes' | 'following' | 'followers' | 'crwds') => void;
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
    isLoadingFollowing = false,
    onStatPress
}: ProfileStatsProps) {
    const navigation = useNavigation()

    const handleStatsPress = (tab: 'causes' | 'following' | 'followers' | 'crwds') => {
        if (onStatPress) {
            onStatPress(tab);
        } else {
            (navigation as any).navigate('Statistics', { screen: tab, userId: profileId || undefined })
        }
    }

    return (
        <View style={{
            flexDirection: 'row',
            // backgroundColor: '#f9fafb', 
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#595959', textAlign: 'center' }}>
                            {causes}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#595959', textAlign: 'center', fontFamily: 'Outfit-Medium' }}>nonprofit{causes !== 1 ? 's' : ''}</Text>
                    </View>

                )}
                {/* <Text style={{ fontSize: 14, color: PrimaryGrey, textAlign: 'center' }}>Causes</Text> */}
            </TouchableOpacity>
            {/* <View style={{ width: 4, height: 4, backgroundColor: '#595959', marginHorizontal: 8, borderRadius: 5, alignSelf: 'center' }} /> */}
            <TouchableOpacity
                onPress={() => handleStatsPress('crwds')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                {isLoadingCrwds ? (
                    <ActivityIndicator size="small" color={PrimaryBlue} />
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#595959', textAlign: "center" }}>
                            {crwds}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#595959', textAlign: "center", fontFamily: 'Outfit-Medium' }}>collective{crwds !== 1 ? 's' : ''}</Text>
                    </View>
                )}
            </TouchableOpacity>
            {/* <View style={{ width: 4, height: 4, backgroundColor: '#595959', marginHorizontal: 8, borderRadius: 5, alignSelf: 'center' }} /> */}
            <TouchableOpacity
                onPress={() => handleStatsPress('followers')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                {isLoadingFollowers ? (
                    <ActivityIndicator size="small" color={PrimaryBlue} />
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#595959', textAlign: "center" }}>
                            {followers}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#595959', textAlign: "center", fontFamily: 'Outfit-Medium' }}>follower{followers !== 1 ? 's' : ''}</Text>
                    </View>
                )}
            </TouchableOpacity>
            {/* <View style={{ width: 4, height: 4, backgroundColor: '#595959', marginHorizontal: 8, borderRadius: 5, alignSelf: 'center' }} /> */}
            <TouchableOpacity
                onPress={() => handleStatsPress('following')}
                style={{ flex: 1, alignItems: 'center', justifyContent: "center" }}
            >
                {isLoadingFollowing ? (
                    <ActivityIndicator size="small" color={PrimaryBlue} />
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#595959', textAlign: "center" }}>
                            {following}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#595959', textAlign: "center", fontFamily: 'Outfit-Medium' }}>following</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    )
}