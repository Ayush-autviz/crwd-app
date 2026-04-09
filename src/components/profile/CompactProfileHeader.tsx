import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Pencil } from 'lucide-react-native';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

interface CompactProfileHeaderProps {
    profileData: any;
    followersCount: number;
    followingCount: number;
    onAvatarPress?: () => void;
    onFollowersPress?: () => void;
    onFollowingPress?: () => void;
    getConsistentColor: (id: number | string, colors: string[]) => string;
    avatarColors: string[];
    getInitials: (firstName?: string, lastName?: string, name?: string, username?: string) => string;
    isOwnProfile?: boolean;
    onEditPress?: () => void;
}

export const CompactProfileHeader: React.FC<CompactProfileHeaderProps> = ({
    profileData,
    followersCount,
    followingCount,
    onAvatarPress,
    onFollowersPress,
    onFollowingPress,
    getConsistentColor,
    avatarColors,
    getInitials,
    isOwnProfile,
    onEditPress,
}) => {
    return (
        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 5 }}>
            {/* Avatar */}
            <View>
                <View style={{ position: 'relative' }}>
                    <TouchableOpacity onPress={onAvatarPress}>
                        <Avatar size={80}>
                            <AvatarImage src={profileData?.profile_picture} />
                            <AvatarFallback
                                style={{ backgroundColor: profileData?.profile_picture ? 'transparent' : (profileData?.color || getConsistentColor(profileData?.id || profileData?.username || 'U', avatarColors)) }}
                                textStyle={{ color: '#FFFFFF', fontFamily: 'Outfit-Bold', fontSize: 28 }}
                            >
                                {getInitials(profileData?.first_name, profileData?.last_name, profileData?.username, profileData?.username)}
                            </AvatarFallback>
                        </Avatar>
                    </TouchableOpacity>
                    {isOwnProfile && !profileData?.profile_picture && (
                        <TouchableOpacity
                            onPress={onEditPress}
                            style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                backgroundColor: '#2222EE',
                                borderRadius: 100,
                                padding: 6,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                                elevation: 3,
                                // borderWidth: 1.5,
                                // borderColor: 'white',
                                zIndex: 10
                            }}
                        >
                            <Pencil size={11} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Name/Stats */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{
                    fontSize: 20,
                    fontFamily: 'Outfit-Bold',
                    color: '#111827',
                    marginBottom: 2,
                }}>
                    {profileData?.first_name && profileData?.last_name
                        ? `${profileData.first_name} ${profileData.last_name}`
                        : profileData?.username || 'User'
                    }
                </Text>
                {profileData?.location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                        <MapPin size={14} color="#6b7280" />
                        <Text style={{ fontSize: 14, color: '#6b7280', fontFamily: 'Outfit-Medium' }}>{profileData.location}</Text>
                    </View>
                ) : (
                    isOwnProfile && (
                        <TouchableOpacity onPress={onEditPress} style={{ marginBottom: 3 }}>
                            <Text style={{ fontSize: 14, color: '#2222EE', fontFamily: 'Outfit-Bold' }}>Add your location</Text>
                        </TouchableOpacity>
                    )
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <TouchableOpacity onPress={onFollowersPress}>
                        <Text style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', fontFamily: 'Outfit-Medium' }}>
                            <Text style={{ color: '#111827', fontFamily: 'Outfit-Bold', fontStyle: 'normal' }}>{followersCount}</Text> followers
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onFollowingPress}>
                        <Text style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', fontFamily: 'Outfit-Medium' }}>
                            <Text style={{ color: '#111827', fontFamily: 'Outfit-Bold', fontStyle: 'normal' }}>{followingCount}</Text> following
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
