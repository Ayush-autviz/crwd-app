import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { SafeAreaView } from 'react-native-safe-area-context'
import PopularPosts from '../components/PopularPosts'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { ArrowLeftRight, Trophy, Heart, MessageCircle, MoreHorizontal, User } from 'lucide-react-native'
import { useAuthStore } from '../store/store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllNotificationsAsRead } from '../services/api/notification'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) {
            return `${diffInSeconds}s`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d`;
        }
    } catch {
        return '';
    }
};

export default function Activity() {
    const route = useRoute()
    const {tab}: any = route.params ?? 'community'
    const [activeTab, setActiveTab] = useState<'community' | 'notifications'>(tab ?? 'community')
    const navigation = useNavigation()
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();

    // Fetch notifications from API
    const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        enabled: !!currentUser?.id,
    });

    const markAllNotificationsAsReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            console.log('Mark all notifications as read successfully');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        },
    });

    // Mark all notifications as read on mount
    useFocusEffect(
        useCallback(() => {
          if (currentUser?.id && notificationsData?.results?.length > 0) {
            markAllNotificationsAsReadMutation.mutate();
          }
        }, [currentUser?.id, notificationsData?.results?.length])
      );
      

    // Filter notifications by type
    const personalNotifications = useMemo(() => {
        return (notificationsData?.results || []).filter(
            (notification: any) => notification.type === "personal"
        );
    }, [notificationsData]);

    const communityNotifications = useMemo(() => {
        return (notificationsData?.results || []).filter(
            (notification: any) => notification.type === "community" || notification.type === "community_post"
        );
    }, [notificationsData]);

    // Transform personal notifications
    const transformedPersonalNotifications = useMemo(() => {
        if (!personalNotifications || personalNotifications.length === 0) return [];

        return personalNotifications.map((notification: any) => {
            // Extract username from body if it contains @username pattern
            let username = '';
            const usernameMatch = notification.body?.match(/@(\w+)/);
            if (usernameMatch) {
                username = usernameMatch[1];
            } else {
                username = notification.user?.username || notification.data?.follower_username || '';
            }

            // Determine notification type based on title/body
            let notificationType: 'connect' | 'donation' | 'mention' | 'like' | 'comment' | 'achievement' | 'crwd_activity' | 'crwd_join' | 'event_attend' = 'connect';
            if (notification.title?.includes('Follower') || notification.body?.includes('started following')) {
                notificationType = 'connect';
            } else if (notification.title?.includes('Mention') || notification.body?.includes('@')) {
                notificationType = 'mention';
            } else if (notification.title?.includes('Like')) {
                notificationType = 'like';
            } else if (notification.title?.includes('Comment')) {
                notificationType = 'comment';
            } else if (notification.title?.includes('Donation') || notification.body?.includes('donation')) {
                notificationType = 'donation';
            }

            // Extract user ID from notification data based on type
            const userId = 
                notification.data?.follower_id || 
                notification.data?.liker_id ||
                notification.data?.user_id || 
                notification.data?.donor_id ||
                notification.user?.id ||
                null;

            return {
                id: notification.id,
                type: notificationType,
                message: notification.body || notification.title || '',
                time: formatTimeAgo(notification.created_at || notification.updated_at),
                avatarUrl: notification.user?.profile_picture || notification.data?.profile_picture || '',
                username: username,
                userId: userId,
            };
        });
    }, [personalNotifications]);

    // Transform community notifications to posts
    const transformedCommunityPosts = useMemo(() => {
        if (!communityNotifications || communityNotifications.length === 0) return [];

        return communityNotifications.map((notification: any) => {
            // Extract username from body if it contains @username pattern
            let username = '';
            const usernameMatch = notification.body?.match(/@(\w+)/);
            if (usernameMatch) {
                username = usernameMatch[1];
            } else {
                username = notification.user?.username || notification.data?.creator_id || notification.data?.new_member_id || '';
            }

            // Extract collective name from body
            let collectiveName = '';
            if (notification.body) {
                const inMatch = notification.body.match(/in (.+)$/);
                if (inMatch) {
                    collectiveName = inMatch[1].trim();
                }
                if (!collectiveName && notification.body.includes('joined')) {
                    const joinMatch = notification.body.match(/joined (.+)$/);
                    if (joinMatch) {
                        collectiveName = joinMatch[1].trim();
                    }
                }
            }

            // Extract user ID from notification data based on type
            const userId = 
                notification.data?.new_member_id || 
                notification.data?.creator_id || 
                notification.data?.donor_id ||
                notification.data?.liker_id ||
                notification.data?.user_id ||
                null;

            const isJoin = notification.type === "community" && notification.body?.includes("joined");
            const isPost = notification.type === "community_post" || (notification.type === "community" && notification.body?.includes("posted"));

            // Remove the collective name from text if it's a join notification to avoid duplication
            let displayText = notification.body || notification.title || '';
            if (isJoin && collectiveName && displayText.includes(collectiveName)) {
                // Remove the duplicate collective name from the end of the text
                const regex = new RegExp(`\\s*${collectiveName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
                displayText = displayText.replace(regex, '').trim();
            }

            return {
                id: notification.id,
                avatarUrl: notification.user?.profile_picture || notification.data?.profile_picture || '',
                username: username,
                userId: userId,
                time: formatTimeAgo(notification.created_at || notification.updated_at),
                org: collectiveName || null,
                text: displayText,
                imageUrl: null,
                likes: 0,
                comments: 0,
                shares: 0,
                isJoin: isJoin,
                isPost: isPost,
                groupName: collectiveName,
                postId: notification.data?.post_id,
                collectiveId: notification.data?.collective_id,
            };
        });
    }, [communityNotifications]);

    // Check if there are unread personal notifications
    const hasUnreadNotifications = personalNotifications.some(
        (notification: any) => !notification.is_read
    ) || false;


    if (!currentUser?.id) {
        return (
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
            <MainHeaderNav title={'Activity'} show={true} />
            <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center', 
                paddingHorizontal: 32,
                backgroundColor: 'white'
            }}>
                {/* Icon */}
                <View style={{
                    width: 80,
                    height: 80,
                    backgroundColor: '#dbeafe',
                    borderRadius: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 24
                }}>
                    <User size={40} color={PrimaryBlue} />
                </View>
                
                {/* Title */}
                <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: 12,
                    textAlign: 'center'
                }}>
                    Sign in to view your Notifications and Community Updates
                </Text>
                
                {/* Description */}
                <Text style={{
                    fontSize: 16,
                    color: '#6b7280',
                    marginBottom: 32,
                    textAlign: 'center',
                    lineHeight: 24
                }}>
                    Sign in to view your Notifications and Community Updates, manage your causes, and connect with your community.
                </Text>
                
                {/* CTA Button */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Login' as never)}
                    style={{
                        backgroundColor: '#2563eb',
                        paddingHorizontal: 32,
                        paddingVertical: 12,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                    }}
                >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                        Sign In to Continue
                    </Text>
                </TouchableOpacity>
                
                {/* Additional Info */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('ClaimProfile' as never)}
                  >
                <Text style={{
                    fontSize: 14,
                    color: '#6b7280',
                    marginTop: 24,
                    textAlign: 'center'
                }}>
                    Don't have an account? 
                    <Text style={{ color: '#2563eb', fontWeight: '500' }}> Create one here</Text>
                </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

    const renderNotificationItem = ({ item }: { item: any }) => {
        switch (item.type) {
            case 'connect':
                return (
                    <TouchableOpacity 
                        style={{ 
                            flexDirection: 'row', 
                            padding: 16, 
                            borderTopWidth: 1, 
                            borderTopColor: LightGrey,
                            gap: 12 
                        }}
                        onPress={() => {
                            if (item.userId) {
                                (navigation as any).navigate('UserProfile', { userId: item.userId.toString() });
                            }
                        }}
                    >
                        <Avatar size={44}>
                            <AvatarImage src={item.avatarUrl} />
                            <AvatarFallback>
                                {item.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontWeight: '600', color: '#111' }}>@{item.username}</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>• {item.time}</Text>
                            </View>
                            <Text style={{ color: '#374151', marginTop: 4 }}>{item.message}</Text>
                            {/* <TouchableOpacity 
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
                            </TouchableOpacity> */}
                        </View>
                    </TouchableOpacity>
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
                        onPress={() => {
                            if (item.userId) {
                                (navigation as any).navigate('UserProfile', { userId: item.userId.toString() });
                            }
                        }}
                    >
                        <Avatar size={44}>
                            <AvatarImage src={item.avatarUrl} />
                            <AvatarFallback>
                                {item.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
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
                        <Trophy size={24} color="#000" />
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#374151' }}>{item.message}</Text>
                            <Text style={{ fontSize: 12, color: PrimaryGrey, marginTop: 4 }}>• {item.time}</Text>
                        </View>
                    </View>
                )

            case 'crwd_join':
            case 'event_attend':
                return (
                    <TouchableOpacity 
                        style={{ 
                            flexDirection: 'row', 
                            padding: 16, 
                            borderTopWidth: 1, 
                            borderTopColor: LightGrey,
                            gap: 12 
                        }}
                        onPress={() => {
                            if (item.userId) {
                                (navigation as any).navigate('UserProfile', { userId: item.userId.toString() });
                            }
                        }}
                    >
                        <Avatar size={44}>
                            <AvatarImage src={item.avatarUrl} />
                            <AvatarFallback>
                                {item.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontWeight: '600', color: '#111' }}>@{item.username}</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>• {item.time}</Text>
                            </View>
                            <Text style={{ color: '#374151', marginTop: 4 }}>{item.message}</Text>
                        </View>
                    </TouchableOpacity>
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
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (item.userId) {
                                (navigation as any).navigate('UserProfile', { userId: item.userId.toString() });
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <Avatar size={40}>
                            <AvatarImage src={item.avatarUrl} />
                            <AvatarFallback>
                                {item.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => {
                            if (item.postId) {
                                (navigation as any).navigate('PostDetail', { postId: item.postId });
                            }
                        }}
                        style={{ flex: 1 }}
                        activeOpacity={0.7}
                    >
                        
                        <View style={{ flex: 1 }}>
                            {!item.isDonation && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={{ fontWeight: '600', fontSize: 14, color: '#111' }}>{item.username}</Text>
                                        <Text style={{ fontSize: 12, color: PrimaryGrey }}>• {item.time}</Text>
                                    </View>
                                    {/* <MoreHorizontal size={16} color={PrimaryGrey} /> */}
                                </View>
                            )}
                            
                            {item.org && (
                                <TouchableOpacity onPress={() => {
                                    if (item.collectiveId) {
                                        (navigation as any).navigate('GroupCRWD', { collectiveId: item.collectiveId.toString() });
                                    }
                                }}>
                                    <Text style={{ fontSize: 12, color: PrimaryBlue, marginTop: 2 }}>{item.org}</Text>
                                </TouchableOpacity>
                            )}

                            <View style={{ marginTop: 8, marginBottom: 12 }}>
                                {item.isJoin ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={{ color: '#374151' }}>{item.text}</Text>
                                        {item.groupName && (
                                            <TouchableOpacity onPress={() => {
                                                if (item.collectiveId) {
                                                    (navigation as any).navigate('GroupCRWD', { collectiveId: item.collectiveId.toString() });
                                                }
                                            }}>
                                                <Text style={{ color: PrimaryBlue, fontWeight: '600' }}>{item.groupName}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : item.isPost ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                        <Text style={{ color: '#374151' }}>{item.text}</Text>
                                        {item.postId && (
                                            <TouchableOpacity onPress={() => {
                                                (navigation as any).navigate('PostDetail', { postId: item.postId });
                                            }}>
                                                <Text style={{ color: PrimaryBlue, textDecorationLine: 'underline' }}>post</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <View>
                                        <Text style={{ color: '#374151', lineHeight: 20 }}>{item.text}</Text>
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

                            {/* <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
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
                            </View> */}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
            <MainHeaderNav show menu={false} title={'Notifications'}  />
            
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
                    {/* Red dot notification indicator - show only if there are unread notifications */}
                    {/* {hasUnreadNotifications && (
                        <View style={{ width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4 }} />
                    )} */}
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
                    isLoadingNotifications ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                            <ActivityIndicator size="large" color={PrimaryBlue} />
                            <Text style={{ marginTop: 12, fontSize: 14, color: PrimaryGrey }}>
                                Loading notifications...
                            </Text>
                        </View>
                    ) : transformedPersonalNotifications.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                            <View style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: '#f3f4f6',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16
                            }}>
                                <User size={32} color={PrimaryGrey} />
                            </View>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: 8,
                                textAlign: 'center'
                            }}>
                                No notifications yet
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6b7280',
                                textAlign: 'center',
                                maxWidth: 280
                            }}>
                                When someone follows you, mentions you, or interacts with your posts, you'll see it here.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={transformedPersonalNotifications}
                            renderItem={renderNotificationItem}
                            keyExtractor={(item) => `notification-${item.id}`}
                            showsVerticalScrollIndicator={false}
                        />
                    )
                )}
                
                {activeTab === 'community' && (
                    isLoadingNotifications ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                            <ActivityIndicator size="large" color={PrimaryBlue} />
                            <Text style={{ marginTop: 12, fontSize: 14, color: PrimaryGrey }}>
                                Loading community updates...
                            </Text>
                        </View>
                    ) : transformedCommunityPosts.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                            <View style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: '#f3f4f6',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16
                            }}>
                                <MessageCircle size={32} color={PrimaryGrey} />
                            </View>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: 8,
                                textAlign: 'center'
                            }}>
                                No community updates yet
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: '#6b7280',
                                textAlign: 'center',
                                maxWidth: 280
                            }}>
                                When members of your collectives post updates or join, you'll see them here.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={transformedCommunityPosts}
                            renderItem={renderCommunityPost}
                            keyExtractor={(item) => `community-${item.id}`}
                            showsVerticalScrollIndicator={false}
                        />
                    )
                )}
            </View>
        </SafeAreaView>
    )
}