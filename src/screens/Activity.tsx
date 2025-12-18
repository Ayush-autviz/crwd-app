import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { SafeAreaView } from 'react-native-safe-area-context'
import PopularPosts from '../components/PopularPosts'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { ArrowLeftRight, Trophy, Heart, MessageCircle, MoreHorizontal, User, HandHeart, Users, Mountain, ArrowLeft } from 'lucide-react-native'
import { useAuthStore } from '../store/store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllNotificationsAsRead } from '../services/api/notification'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'

// Helper function to format time ago - matching Vite format
const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) {
            return `${diffInSeconds} seconds ago`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        }
    } catch {
        return '';
    }
};

export default function Activity() {
    const route = useRoute()
    const {tab}: any = route.params ?? 'community'
    const [activeTab, setActiveTab] = useState<'community' | 'notifications'>(tab ?? 'notifications')
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

    // Transform personal notifications - matching Vite RegularNotifications logic
    const transformedPersonalNotifications = useMemo(() => {
        if (!personalNotifications || personalNotifications.length === 0) return [];

        return personalNotifications.map((notification: any) => {
            // Determine notification type and extract data
            const isDonation = notification.title?.toLowerCase().includes('donation') || 
                              notification.body?.toLowerCase().includes('donation') ||
                              notification.data?.donor_id;
            const isNewMember = notification.title?.toLowerCase().includes('member') || 
                               notification.body?.toLowerCase().includes('joined') ||
                               notification.data?.new_member_id;
            
            // Extract collective name from body or title
            let collectiveName = '';
            if (notification.body) {
                const receivedMatch = notification.body.match(/received.*?donation.*?to (.+)/i);
                if (receivedMatch) {
                    collectiveName = receivedMatch[1].trim();
                } else {
                    const joinedMatch = notification.body.match(/joined (.+)/i);
                    if (joinedMatch) {
                        collectiveName = joinedMatch[1].trim();
                    }
                }
            }
            
            // Extract user name for new member notifications
            let memberName = '';
            if (isNewMember && notification.body) {
                const nameMatch = notification.body.match(/^([^ ]+ [^ ]+)/);
                if (nameMatch) {
                    memberName = nameMatch[1].trim();
                }
            }
            
            // Extract donation amount
            let donationAmount = '';
            if (isDonation && notification.body) {
                const amountMatch = notification.body.match(/\$(\d+)/);
                if (amountMatch) {
                    donationAmount = `$${amountMatch[1]}`;
                }
            }

            return {
                id: notification.id,
                type: isDonation ? 'donation' : isNewMember ? 'new_member' : 'other',
                title: isDonation ? 'Donation Received' : isNewMember ? 'New Member' : notification.title || 'Notification',
                description: notification.body || notification.title || '',
                collectiveName: collectiveName,
                memberName: memberName,
                donationAmount: donationAmount,
                time: formatTimeAgo(notification.created_at || notification.updated_at),
                avatarUrl: notification.user?.profile_picture || notification.data?.profile_picture || '',
                collectiveId: notification.data?.collective_id,
            };
        });
    }, [personalNotifications]);

    // Transform community notifications to posts - matching Vite CommunityUpdates logic
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

            // Extract collective name from body - patterns like "posted in Heart for you" or "joined n jnum"
            let collectiveName = '';
            if (notification.body) {
                // Try pattern: "in [collective name]"
                const inMatch = notification.body.match(/in (.+)$/);
                if (inMatch) {
                    collectiveName = inMatch[1].trim();
                }
                // If no match, try extracting after "joined"
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

            // Determine if it's a join notification
            const isJoin = notification.type === "community" && notification.body?.includes("joined");
            // Determine if it's a post notification
            const isPost = notification.type === "community_post" || (notification.type === "community" && notification.body?.includes("posted"));

            // Check if this is the current user's own profile
            const isCurrentUser = currentUser?.id && (
                (userId && currentUser.id.toString() === userId.toString()) || 
                (username && currentUser.username === username)
            );

            // Remove the duplicate collective name from text if it's a join notification to avoid duplication
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
                profileLink: isCurrentUser ? undefined : (userId ? `/user-profile/${userId}` : username ? `/user-profile/${username}` : undefined),
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
                link: notification.data?.post_id ? `/post/${notification.data.post_id}` : undefined,
                postId: notification.data?.post_id,
                collectiveId: notification.data?.collective_id,
            };
        });
    }, [communityNotifications, currentUser]);

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
        return (
            <View style={{ 
                paddingHorizontal: 12, 
                paddingVertical: 16, 
                borderBottomWidth: 1, 
                borderBottomColor: '#F3F4F6' 
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    {/* Avatar with overlay icon */}
                    <View style={{ position: 'relative' }}>
                        {item.type === 'donation' ? (
                            <>
                                {/* Green circle with 'C' */}
                                <View style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: '#10B981',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>C</Text>
                                </View>
                                {/* Hand icon overlay */}
                                <View style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: '#60A5FA',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: '#FFFFFF'
                                }}>
                                    <HandHeart size={12} color="#FFFFFF" />
                                </View>
                            </>
                        ) : item.type === 'new_member' ? (
                            <>
                                {/* Gray circle with landscape icon */}
                                <View style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: '#E5E7EB',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: '#D1D5DB'
                                }}>
                                    <Mountain size={24} color="#6B7280" />
                                </View>
                                {/* People icon overlay */}
                                <View style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: '#34D399',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: '#FFFFFF'
                                }}>
                                    <Users size={12} color="#FFFFFF" />
                                </View>
                            </>
                        ) : (
                            <>
                                {/* Default avatar */}
                                <Avatar size={48}>
                                    <AvatarImage src={item.avatarUrl} />
                                    <AvatarFallback 
                                        style={{ backgroundColor: '#E5E7EB' }}
                                        textStyle={{ color: '#4B5563', fontSize: 14, fontWeight: '600' }}
                                    >
                                        {item.title?.charAt(0) || 'N'}
                                    </AvatarFallback>
                                </Avatar>
                            </>
                        )}
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ 
                            fontWeight: '700', 
                            color: '#111827', 
                            fontSize: 14, 
                            marginBottom: 2 
                        }}>
                            {item.title}
                        </Text>
                        <Text style={{ 
                            color: '#374151', 
                            fontSize: 12, 
                            marginBottom: 6 
                        }}>
                            {item.type === 'donation' 
                                ? `Your collective ${item.collectiveName || 'Community Champions'} received a ${item.donationAmount || '$50'} donation`
                                : item.type === 'new_member'
                                ? `${item.memberName || 'Taylor Kim'} joined ${item.collectiveName || 'Community Champions'}`
                                : item.description
                            }
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 10 }}>
                            {item.time}
                        </Text>
                    </View>
                </View>
            </View>
        );
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
            {/* Header - matching Vite */}
            <View style={{ 
                height: 56, 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: 6, 
                paddingHorizontal: 12 
            }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ padding: 8, marginRight: 4 }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color="#374151" />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', flex: 1 }}>
                    Notifications
                </Text>
            </View>
            
            {/* Tab Headers */}
            {/* <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LightGrey }}>
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
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: activeTab === 'notifications' ? '#000' : PrimaryGrey,
                    }}>
                        Notifications
                    </Text>
                </TouchableOpacity>
            </View> */}

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
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 }}>
                            <ActivityIndicator size="large" color="#9CA3AF" />
                            <Text style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
                                Loading community updates...
                            </Text>
                        </View>
                    ) : transformedCommunityPosts.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48, paddingHorizontal: 12 }}>
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: '#F3F4F6',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 12
                            }}>
                                <MessageCircle size={24} color="#9CA3AF" />
                            </View>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: 6,
                                textAlign: 'center'
                            }}>
                                No community updates yet
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: '#6B7280',
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