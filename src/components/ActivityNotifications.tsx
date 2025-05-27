import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { ArrowLeftRight } from 'lucide-react-native'

export default function ActivityNotifications() {

    const notifications = [{
        type: 'connect' as const,
        avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
        username: 'mandy',
        message: 'Mandy would like to connect with you',
        time: '17h',
    }]
    const donation = [{
        type: 'donation' as const,
        message: 'Your $25 monthly donation was processed',
        time: '1d',
    }]
    const post =
        [{
            type: 'post' as const,
            avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
            username: 'mynameismya',
            message: '',
            time: '2d',
            groupName: 'marchofdimes',
            groupAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            link: 'https://example.com/article-about-health',
        }]
    const event =
        [{
            type: 'event' as const,
            avatarUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
            username: 'mynameismya',
            message: '',
            time: '3d',
            groupName: 'marchofdimes',
            groupAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            eventTitle: 'Community Fundraiser',
            eventDate: 'June 15, 2023 • 2:00 PM',
        }]


    return (
        <View style={{ marginTop: 20 }}>
            {/* notifcations */}
            <FlatList
                data={notifications}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomColor: LightGrey, borderBottomWidth: 1, paddingBottom: 10 }}>
                        <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={{ fontSize: 14, fontWeight: 500 }}>@{item.username} .</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.time}</Text>
                            </View>
                            <Text style={{ fontSize: 14, color: PrimaryGrey }}>{item.message}</Text>

                            <TouchableOpacity style={{ backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 }}>
                                <Text style={{ color: 'white' }}>Follow Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* donation */}
            <FlatList
                data={donation}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 20 }}>
                        {/* <Image source={{uri: item.}} style={{width: 40, height: 40}} /> */}
                        <ArrowLeftRight size={24} color={'#000'} />
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={{ fontSize: 14, color: PrimaryGrey }}>{item.message}</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: PrimaryGrey, marginTop: 10 }}>{item.time}</Text>
                        </View>
                    </View>
                )}
            />

            <View style={{ paddingVertical: 10, backgroundColor: LightGrey, paddingHorizontal: 10, marginHorizontal: -20, borderRadius: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '500' }}>Community Updates</Text>
            </View>

            {/* post */}
            <FlatList
                data={post}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomColor: LightGrey, borderBottomWidth: 1, paddingBottom: 10, marginTop: 20 }}>
                        <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={{ fontSize: 14, fontWeight: 500 }}>@{item.username}</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.time}</Text>
                            </View>
                            <View style={{ padding: 5, backgroundColor: LightGrey, borderRadius: 10, marginTop: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={{ uri: item.groupAvatar }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                                    <Text style={{ fontSize: 14 }}>{item.groupName}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}>
                                
                                <Image source={{ uri: 'https://placehold.co/80x80/e6e7eb/818cf8' }} style={{ width: 100, height: 100, borderRadius: 10, marginTop: 10, backgroundColor: PrimaryGrey }} />
                                <View>
                                    <Text>Health Article: Latest Research</Text>
                                    <Text style={{ color: PrimaryGrey }}>This article discusses the latest research findings on health and wellness, providing valuable insights for community members.</Text>
                                    </View>
                            </View> 
                            </View>
                            {/* <Text style={{fontSize: 14, color: 'grey'}}>{item.message}</Text> */}
                        </View>
                    </View>
                )}
            />

            {/* event */}
            <FlatList
                data={event}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomColor: LightGrey, borderBottomWidth: 1, paddingBottom: 10 }}>
                        <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={{ fontSize: 14, fontWeight: 500 }}>@{item.username} .</Text>
                                <Text style={{ fontSize: 12, color: 'grey' }}>{item.time}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Image source={{ uri: item.groupAvatar }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                                <Text style={{ fontSize: 14, color: 'grey' }}>{item.groupName}</Text>
                            </View>
                            <Text style={{ fontSize: 14, color: 'grey' }}>{item.eventTitle}</Text>
                            <Text style={{ fontSize: 12, color: 'grey' }}>{item.eventDate}</Text>
                        </View>
                    </View>
                )}
            />
        </View>
        // </View>
    )
}