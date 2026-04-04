import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

interface CollectiveItem {
    id: string | number;
    name: string;
    logo?: string;
    avatar?: string;
    color?: string;
}

interface ProfileGroupsProps {
    collectives: any[];
    totalCount: number;
    onSectionPress?: () => void;
    onCollectivePress?: (id: string | number) => void;
    getConsistentColor: (id: number | string, colors: string[]) => string;
    avatarColors: string[];
}

export const ProfileGroups: React.FC<ProfileGroupsProps> = ({
    collectives,
    totalCount,
    onSectionPress,
    onCollectivePress,
    getConsistentColor,
    avatarColors,
}) => {
    if (!collectives || totalCount === 0) return null;

    return (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 }}>
            <TouchableOpacity onPress={onSectionPress} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Outfit-Bold', color: '#6b7280', textTransform: 'uppercase' }}>
                    Groups · {totalCount}
                </Text>
            </TouchableOpacity>

            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: -4,
            }}>
                {collectives.slice(0, 3).map((item, i) => {
                    const collective = item.collective || item;
                    const bgColor = collective.color || getConsistentColor(collective.id || collective.name || 'G', avatarColors);
                    return (
                        <TouchableOpacity
                            key={collective.id || i}
                            onPress={() => onCollectivePress?.(collective.id)}
                            style={{
                                width: '25%',
                                paddingHorizontal: 4,
                                marginBottom: 8,
                            }}
                        >
                            <View style={{
                                backgroundColor: 'white',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#f3f4f6',
                                paddingVertical: 10,
                                paddingHorizontal: 4,
                                alignItems: 'center',
                                minHeight: 110,
                                justifyContent: 'center',
                            }}>
                                <Avatar size={44} style={{ borderRadius: 8, marginBottom: 8 }}>
                                    <AvatarImage src={collective.logo || collective.avatar} />
                                    <AvatarFallback
                                        style={{ backgroundColor: bgColor }}
                                        textStyle={{ color: 'white', fontSize: 16, fontFamily: 'Outfit-Bold' }}
                                    >
                                        {collective.name?.charAt(0)?.toUpperCase() || 'G'}
                                    </AvatarFallback>
                                </Avatar>
                                <Text
                                    numberOfLines={2}
                                    style={{
                                        fontSize: 12,
                                        fontFamily: 'Outfit-Bold',
                                        color: '#111827',
                                        textAlign: 'center',
                                        lineHeight: 14,
                                    }}
                                >
                                    {collective.name}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {totalCount > 3 && (
                    <TouchableOpacity
                        onPress={onSectionPress}
                        style={{
                            width: '25%',
                            paddingHorizontal: 4,
                            marginBottom: 8,
                        }}
                    >
                        <View style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#f3f4f6',
                            height: 110,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{ fontSize: 16, fontFamily: 'Outfit-Bold', color: '#6b7280' }}>
                                +{totalCount - 3}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
