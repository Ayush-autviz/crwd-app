import { View, Text, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native'
import React, { useState } from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { SafeAreaView } from 'react-native-safe-area-context'
import PopularPosts from '../components/PopularPosts'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useNavigation } from '@react-navigation/native'
import { ArrowLeftRight, Trophy, Heart, MessageCircle, MoreHorizontal } from 'lucide-react-native'

export default function Activity() {
    const [activeTab, setActiveTab] = useState<'community' | 'notifications'>('community')
    const navigation = useNavigation()

    // Regular notifications data
    const regularNotifications = [
        {
            type: 'connect' as const,
            avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
            username: 'mandy',
            message: 'Mandy would like to connect with you',
            time: '17h',
        },
        {
            type: 'donation' as const,
            message: 'Your $25 monthly donation was processed',
            time: '2h',
        },
        {
            type: 'mention' as const,
            avatarUrl: 'https://randomuser.me/api/portraits/men/15.jpg',
            username: 'conrad',
            message: 'Conrad mentioned you',
            time: '19h',
        },
        {
            type: 'like' as const,
            avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
            username: 'chad',
            message: 'Chad liked your post',
            time: '1d',
        },
        {
            type: 'comment' as const,
            avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
            username: 'chad',
            message: 'Chad commented on your post',
            time: '1d',
        },
        {
            type: 'achievement' as const,
            message: 'Congratulations! You have donated 2 months in a row!',
            time: '1d',
        },
        {
            type: 'crwd_activity' as const,
            message: 'Congratulations! Your CRWD has made 10 collective donations',
            time: '1d',
        },
        {
            type: 'crwd_join' as const,
            avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
            username: 'mandy',
            message: 'Mandy joined runforourrights',
            time: '17h',
            groupName: 'runforourrights',
        },
        {
            type: 'event_attend' as const,
            avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
            username: 'chad',
            message: "Chad RSVP'd to your event",
            time: '1d',
        },
    ]

    // Community posts data
    const communityPosts = [
        {
            id: 2,
            avatarUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
            username: 'mynameismya',
            time: '17h',
            org: 'feedthehungry',
            text: 'The quick, brown fox jumps over a lazy dog. DJs flock by when MTV ax quiz prog. Junk MTV quiz graced by fox whelps. Bawds jog, flick quartz, vex nymphs. Waltz, bad nymph, for quick jigs vex!',
            imageUrl: null,
            likes: 2,
            comments: 0,
            shares: 3,
        },
        {
            id: 3,
            avatarUrl: 'https://randomuser.me/api/portraits/men/15.jpg',
            username: 'conrad',
            time: '4h',
            org: null,
            text: 'donated to',
            imageUrl: null,
            likes: 0,
            comments: 0,
            shares: 0,
            isDonation: true,
            donatedTo: 'The Red Cross',
            organizationName: 'The Red Cross',
            organizationLogo: '/redcross.png'
        },
        {
            id: 4,
            avatarUrl: 'https://randomuser.me/api/portraits/women/25.jpg',
            username: 'emma_321',
            time: '1d',
            org: 'larelief',
            text: 'The quick, brown fox jumps over a lazy dog. DJs flock by when MTV ax quiz prog. Junk',
            link: 'www.thisisaurl.com',
            imageUrl: 'https://images.unsplash.com/photo-1574870111867-089730e5a72b?auto=format&fit=crop&w=600&q=80',
            likes: 2,
            comments: 0,
            shares: 3,
            linkPreview: {
                title: 'The LA wildfires have depleted local resources',
                description: 'The quick, brown fox jumps over a lazy dog. DJs flock by when MTV ax quiz prog. Junk'
            }
        },
        {
            id: 5,
            avatarUrl: 'https://randomuser.me/api/portraits/women/30.jpg',
            username: 'rachelwilson',
            time: '3d',
            org: 'foodforall',
            text: 'Join us this saturday!',
            imageUrl: null,
            likes: 2,
            comments: 0,
            shares: 3,
            isEvent: true,
            eventDetails: {
                date: '3/8/2025',
                time: '7:00 am',
                rsvp: '8',
                maybe: '17',
                place: '123 Main St. Somewhere, USA'
            }
        },
    ]

    const renderNotificationItem = ({ item }: { item: any }) => {
        switch (item.type) {
            case 'connect':
                return (
                    <View style={{ 
                        flexDirection: 'row', 
                        padding: 16, 
                        borderTopWidth: 1, 
                        borderTopColor: LightGrey,
                        gap: 12 
                    }}>
                        <Image 
                            source={{ uri: item.avatarUrl }} 
                            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: LightGrey }} 
                        />
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontWeight: '600', color: '#111' }}>@{item.username}</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>• {item.time}</Text>
                            </View>
                            <Text style={{ color: '#374151', marginTop: 4 }}>{item.message}</Text>
                            <TouchableOpacity 
                                style={{ 
                                    backgroundColor: PrimaryBlue, 
                                    paddingHorizontal: 40, 
                                    paddingVertical: 6, 
                                    borderRadius: 8, 
                                    alignSelf: 'flex-start', 
                                    marginTop: 8 
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: '500', fontSize: 14 }}>Follow Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )

            case 'donation':
                return (
                    <TouchableOpacity 
                        style={{ 
                            flexDirection: 'row', 
                            padding: 16, 
                            borderTopWidth: 1, 
                            borderTopColor: LightGrey,
                            gap: 12,
                            alignItems: 'center'
                        }}
                        onPress={() => navigation.navigate('Donation' as never)}
                    >
                        <ArrowLeftRight size={24} color="#374151" />
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#374151' }}>{item.message}</Text>
                        </View>
                    </TouchableOpacity>
                )

            case 'mention':
            case 'like':
            case 'comment':
                return (
                    <TouchableOpacity 
                        style={{ 
                            flexDirection: 'row', 
                            padding: 16, 
                            borderTopWidth: 1, 
                            borderTopColor: LightGrey,
                            gap: 12 
                        }}
                        onPress={() => navigation.navigate('Profile' as never)}
                    >
                        <Image 
                            source={{ uri: item.avatarUrl }} 
                            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: LightGrey }} 
                        />
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontWeight: '600', color: '#111' }}>@{item.username}</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>• {item.time}</Text>
                            </View>
                            <Text style={{ color: '#374151', marginTop: 4 }}>{item.message}</Text>
                        </View>
                    </TouchableOpacity>
                )

            case 'achievement':
            case 'crwd_activity':
                return (
                    <View style={{ 
                        flexDirection: 'row', 
                        padding: 16, 
                        borderTopWidth: 1, 
                        borderTopColor: LightGrey,
                        gap: 12,
                        alignItems: 'center'
                    }}>
                        <Trophy size={24} color="#F59E0B" />
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#374151' }}>{item.message}</Text>
                            <Text style={{ fontSize: 12, color: PrimaryGrey, marginTop: 4 }}>• {item.time}</Text>
                        </View>
                    </View>
                )

            case 'crwd_join':
            case 'event_attend':
                return (
                    <View style={{ 
                        flexDirection: 'row', 
                        padding: 16, 
                        borderTopWidth: 1, 
                        borderTopColor: LightGrey,
                        gap: 12 
                    }}>
                        <Image 
                            source={{ uri: item.avatarUrl }} 
                            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: LightGrey }} 
                        />
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontWeight: '600', color: '#111' }}>@{item.username}</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>• {item.time}</Text>
                            </View>
                            <Text style={{ color: '#374151', marginTop: 4 }}>{item.message}</Text>
                        </View>
                    </View>
                )

            default:
                return null
        }
    }

    const renderCommunityPost = ({ item }: { item: any }) => {
        return (
            <View style={{ 
                backgroundColor: 'white',
                borderBottomWidth: 1,
                borderBottomColor: LightGrey,
                padding: 16
            }}>
                <TouchableOpacity onPress={() => navigation.navigate('PostDetail' as never)}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Image 
                            source={{ uri: item.avatarUrl }} 
                            style={{ width: 40, height: 40, borderRadius: 20 }} 
                        />
                        
                        <View style={{ flex: 1 }}>
                            {!item.isDonation && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={{ fontWeight: '600', fontSize: 14, color: '#111' }}>{item.username}</Text>
                                        <Text style={{ fontSize: 12, color: PrimaryGrey }}>• {item.time}</Text>
                                    </View>
                                    <MoreHorizontal size={16} color={PrimaryGrey} />
                                </View>
                            )}
                            
                            {item.org && (
                                <TouchableOpacity onPress={() => navigation.navigate('GroupCRWD' as never)}>
                                    <Text style={{ fontSize: 12, color: PrimaryBlue, marginTop: 2 }}>{item.org}</Text>
                                </TouchableOpacity>
                            )}

                            <View style={{ marginTop: 8, marginBottom: 12 }}>
                                {item.isDonation ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={{ fontWeight: '600', color: '#111' }}>@{item.username}</Text>
                                        <Text style={{ color: '#374151' }}>{item.text}</Text>
                                        {item.donatedTo && (
                                            <>
                                                <Text style={{ color: PrimaryBlue, fontWeight: '600' }}>{item.donatedTo}</Text>
                                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>• {item.time}</Text>
                                            </>
                                        )}
                                    </View>
                                ) : (
                                    <View>
                                        <Text style={{ color: '#374151', lineHeight: 20 }}>{item.text}</Text>
                                        {item.link && (
                                            <Text style={{ color: PrimaryBlue, marginTop: 4 }}>{item.link}</Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {item.imageUrl && (
                                <View style={{ width: '100%', height: 192, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} />
                                </View>
                            )}

                            {item.linkPreview && (
                                <View style={{ 
                                    borderWidth: 1, 
                                    borderColor: LightGrey, 
                                    borderRadius: 8, 
                                    padding: 12, 
                                    marginBottom: 12 
                                }}>
                                    <Text style={{ fontWeight: '600', color: '#111', marginBottom: 4 }}>
                                        {item.linkPreview.title}
                                    </Text>
                                    <Text style={{ color: '#6B7280' }}>
                                        {item.linkPreview.description}
                                    </Text>
                                </View>
                            )}

                            {item.isEvent && item.eventDetails && (
                                <View style={{ marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
                                        <View>
                                            <Text style={{ fontWeight: '600', color: '#111' }}>Date</Text>
                                            <Text style={{ color: '#6B7280' }}>{item.eventDetails.date}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontWeight: '600', color: '#111' }}>Time</Text>
                                            <Text style={{ color: '#6B7280' }}>{item.eventDetails.time}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontWeight: '600', color: '#111' }}>RSVP</Text>
                                            <Text style={{ color: '#6B7280' }}>{item.eventDetails.rsvp}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontWeight: '600', color: '#111' }}>Maybe</Text>
                                            <Text style={{ color: '#6B7280' }}>{item.eventDetails.maybe}</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={{ fontWeight: '600', color: '#111' }}>Place</Text>
                                        <Text style={{ color: '#6B7280' }}>{item.eventDetails.place}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Heart size={16} color={PrimaryGrey} />
                                        <Text style={{ color: PrimaryGrey, fontSize: 12 }}>{item.likes}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <MessageCircle size={16} color={PrimaryGrey} />
                                        <Text style={{ color: PrimaryGrey, fontSize: 12 }}>{item.comments}</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Image source={require('../assets/icons/forward.png')} style={{ width: 18, height: 18 }} />
                                    <Text style={{ color: PrimaryGrey, fontSize: 12 }}>{item.shares}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
            <MainHeaderNav show={true} />
            
            {/* Tab Headers */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LightGrey }}>
                <TouchableOpacity
                    onPress={() => setActiveTab('community')}
                    style={{
                        flex: 1,
                        paddingHorizontal: 24,
                        paddingVertical: 16,
                        borderBottomWidth: activeTab === 'community' ? 2 : 0,
                        borderBottomColor: activeTab === 'community' ? '#000' : 'transparent',
                    }}
                >
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: activeTab === 'community' ? '#000' : PrimaryGrey,
                        textAlign: 'center'
                    }}>
                        Community Updates
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    onPress={() => setActiveTab('notifications')}
                    style={{
                        flex: 1,
                        paddingHorizontal: 24,
                        paddingVertical: 16,
                        borderBottomWidth: activeTab === 'notifications' ? 2 : 0,
                        borderBottomColor: activeTab === 'notifications' ? '#000' : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                    }}
                >
                    {/* Red dot notification indicator */}
                    <View style={{ width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4 }} />
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: activeTab === 'notifications' ? '#000' : PrimaryGrey,
                    }}>
                        Notifications
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={{ flex: 1 }}>
                {activeTab === 'notifications' && (
                    <FlatList
                        data={regularNotifications}
                        renderItem={renderNotificationItem}
                        keyExtractor={(item, index) => `notification-${index}`}
                        showsVerticalScrollIndicator={false}
                    />
                )}
                
                {activeTab === 'community' && (
                    <FlatList
                        data={communityPosts}
                        renderItem={renderCommunityPost}
                        keyExtractor={(item) => `community-${item.id}`}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    )
}