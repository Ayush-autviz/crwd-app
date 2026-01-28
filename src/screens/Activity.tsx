import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { SafeAreaView } from 'react-native-safe-area-context'
import PopularPosts from '../components/PopularPosts'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { ArrowLeftRight, Trophy, Heart, MessageCircle, MoreHorizontal, User, ArrowLeft } from 'lucide-react-native'
import { useAuthStore } from '../store/store'
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { getNotifications, markAllNotificationsAsRead } from '../services/api/notification'
import { getUserProfileById } from '../services/api/social'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'

// Avatar colors for consistent coloring
const avatarColors = [
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#10B981', // Green
    '#3B82F6', // Blue
];

const getConsistentColor = (id: number | string, colors: string[]) => {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName) {
        return firstName.charAt(0).toUpperCase();
    }
    if (username) {
        return username.charAt(0).toUpperCase();
    }
    return 'U';
};

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
    const { tab }: any = route.params ?? 'community'
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

    // Extract unique user IDs from personal notifications for profile fetching
    const uniqueUserIdsFromPersonal = useMemo(() => {
        if (!personalNotifications || personalNotifications.length === 0) return [];
        return Array.from(
            new Set(
                personalNotifications
                    .map((notification: any) => {
                        const userId =
                            notification.data?.liker_id ||
                            notification.data?.commenter_id ||
                            notification.data?.mentioner_id ||
                            notification.data?.follower_id ||
                            notification.data?.donor_id ||
                            notification.data?.new_member_id ||
                            notification.user?.id ||
                            notification.data?.user_id;
                        return userId;
                    })
                    .filter((id: any) => id !== null && id !== undefined)
            )
        ) as (string | number)[];
    }, [personalNotifications]);

    // Fetch user profiles for personal notifications
    const userProfileQueries = useQueries({
        queries: uniqueUserIdsFromPersonal.map((userId: string | number) => ({
            queryKey: ['userProfile', userId],
            queryFn: () => getUserProfileById(userId.toString()),
            enabled: !!currentUser?.id && !!userId,
        })),
    });

    // Create a map of user ID to user profile
    const userProfilesMap = useMemo(() => {
        const map = new Map();
        userProfileQueries.forEach((query: any, index: number) => {
            if (query.data && uniqueUserIdsFromPersonal[index]) {
                const profileUser = query.data?.user || query.data;
                map.set(uniqueUserIdsFromPersonal[index].toString(), profileUser);
            }
        });
        return map;
    }, [userProfileQueries, uniqueUserIdsFromPersonal]);

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
                // Pattern 1: "received donation to [collective]"
                const receivedMatch = notification.body.match(/received.*?donation.*?to (.+)/i);
                if (receivedMatch) {
                    collectiveName = receivedMatch[1].trim();
                } else {
                    // Pattern 2: "joined [collective]" or "@username joined [collective]"
                    const joinedMatch = notification.body.match(/joined\s+(.+?)(?:\.|Supporting)/i);
                    if (joinedMatch) {
                        collectiveName = joinedMatch[1].trim();
                    } else {
                        // Pattern 3: "posted in [collective]"
                        const postedMatch = notification.body.match(/posted\s+in\s+(.+)/i);
                        if (postedMatch) {
                            collectiveName = postedMatch[1].trim();
                        } else {
                            // Pattern 4: Just "joined [collective]" without period
                            const simpleJoinedMatch = notification.body.match(/joined\s+(.+)/i);
                            if (simpleJoinedMatch) {
                                collectiveName = simpleJoinedMatch[1].trim();
                            }
                        }
                    }
                }
            }

            // Extract user name for new member notifications
            let memberName = '';
            if (isNewMember && notification.body) {
                // Try to extract name before "joined"
                const nameMatch = notification.body.match(/^([^ ]+ [^ ]+)/);
                if (nameMatch) {
                    memberName = nameMatch[1].trim();
                }
                // Remove "joined [collective]" from description to avoid duplication
                if (collectiveName && notification.body.includes(collectiveName)) {
                    // The description will be parsed to show names clickable, so we don't need to reconstruct it
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

            // Extract user info for avatar - get the user who triggered the notification
            // For likes, comments, mentions, etc., check liker_id, commenter_id, mentioner_id, etc.
            const userId =
                notification.data?.liker_id ||
                notification.data?.commenter_id ||
                notification.data?.mentioner_id ||
                notification.data?.follower_id ||
                notification.data?.donor_id ||
                notification.data?.new_member_id ||
                notification.user?.id ||
                notification.data?.user_id;

            // Extract username from body if it contains @username pattern (e.g., "@jake_long liked your post")
            // Also check data.follower_username for follower notifications
            let username = '';
            if (notification.body) {
                const usernameMatch = notification.body.match(/@(\w+)/);
                if (usernameMatch) {
                    username = usernameMatch[1];
                }
            }
            // Use follower_username from data if available
            if (!username && notification.data?.follower_username) {
                username = notification.data.follower_username;
            }

            // Get user profile from fetched profiles map if available
            const userProfile = userId ? userProfilesMap.get(userId.toString()) : null;
            const profileUser = userProfile?.user || userProfile;

            // Extract full name from body text if it appears (e.g., "Aayush Bajaj commented", "Jake Smith joined", "Chad F has started")
            let extractedFirstName = '';
            let extractedLastName = '';
            if (notification.body && !username) {
                // Try to extract full name pattern: "First Last" or "First L" at the start
                // Matches: "Aayush Bajaj", "Jake Smith", "Chad F", etc.
                const fullNameMatch = notification.body.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]*)?)\s/);
                if (fullNameMatch) {
                    const nameParts = fullNameMatch[1].split(/\s+/);
                    if (nameParts.length >= 2) {
                        extractedFirstName = nameParts[0];
                        extractedLastName = nameParts.slice(1).join(' ');
                    } else if (nameParts.length === 1) {
                        extractedFirstName = nameParts[0];
                    }
                }
            }

            // Get user info from fetched profile, notification.user, notification.data, or extracted from body
            const firstName =
                profileUser?.first_name ||
                notification.user?.first_name ||
                notification.data?.first_name ||
                extractedFirstName || '';
            const lastName =
                profileUser?.last_name ||
                notification.user?.last_name ||
                notification.data?.last_name ||
                extractedLastName || '';
            const extractedUsername =
                username ||
                profileUser?.username ||
                notification.user?.username ||
                notification.data?.username ||
                notification.data?.follower_username || '';

            const postId = notification.data?.post_id || notification.data?.post?.id || notification.post_id;
            const collectiveId = notification.data?.collective_id || notification.data?.collective?.id;
            const nonprofitId = notification.data?.nonprofit_id;

            return {
                id: notification.id,
                type: isDonation ? 'donation' : isNewMember ? 'new_member' : 'other',
                title: isDonation ? 'Donation Received' : isNewMember ? 'New Member' : notification.title || 'Notification',
                description: notification.body || notification.title || '',
                collectiveName: collectiveName,
                memberName: memberName,
                donationAmount: donationAmount,
                time: formatTimeAgo(notification.created_at || notification.updated_at),
                avatarUrl: notification.data?.user_profile_picture || '',
                collectiveId: collectiveId,
                nonprofitId: nonprofitId,
                postId: postId,
                userId: userId,
                firstName: firstName,
                lastName: lastName,
                username: extractedUsername,
                color: notification.data?.user_color || profileUser?.color || notification.user?.color || undefined,
            };
        });
    }, [personalNotifications, userProfilesMap]);

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

            // Extract user info for avatar
            const firstName = notification.user?.first_name || notification.data?.first_name || '';
            const lastName = notification.user?.last_name || notification.data?.last_name || '';

            return {
                id: notification.id,
                // avatarUrl: notification.user?.profile_picture || notification.data?.user_profile_picture || '',
                avatarUrl: notification.data?.user_profile_picture || '',
                username: username,
                userId: userId,
                firstName: firstName,
                lastName: lastName,
                color: notification.data?.user_color || undefined,
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
                        fontFamily: 'Outfit-Bold',
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
                        <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Outfit-Medium' }}>
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
                            <Text style={{ color: '#2563eb', fontFamily: 'Outfit-Medium' }}> Create one here</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const renderNotificationItem = ({ item }: { item: any }) => {
        const handleAvatarPress = () => {
            if (item.userId) {
                (navigation as any).navigate('UserProfile', { userId: item.userId.toString() });
            }
        };

        const handleItemPress = () => {
            if (item.postId) {
                (navigation as any).navigate('PostDetail', { postId: item.postId });
            } else if (item.userId) {
                (navigation as any).navigate('UserProfile', { userId: item.userId.toString() });
            } else if (item.collectiveId) {
                (navigation as any).navigate('GroupCRWD', { crwdId: item.collectiveId.toString() });
            }
        };

        // Parse description to make usernames and collectives clickable (matching vite)
        const renderDescription = () => {
            const description = item.description || '';
            if (!description) return <Text style={{ color: '#374151', fontSize: 12 }}>{description}</Text>;

            // Handle donation type with "donated to" format
            if (item.type === 'donation' && description.includes('donated to')) {
                const parts: React.ReactElement[] = [];
                const donatedSplit = description.split(' donated to ');
                if (donatedSplit.length === 2) {
                    const donorPart = donatedSplit[0];
                    const restPart = donatedSplit[1];

                    // Handle Donor Link
                    if (donorPart.startsWith('@') && item.userId) {
                        parts.push(
                            <Text
                                key="donor"
                                style={{ fontFamily: 'Outfit-SemiBold', color: '#374151', fontSize: 14 }}
                                onPress={() => {
                                    (navigation as any).navigate('UserProfile', { userId: item.userId.toString() });
                                }}
                            >
                                {donorPart}
                            </Text>
                        );
                    } else {
                        parts.push(
                            <Text key="donor-text" style={{ color: '#374151', fontSize: 14 }}>
                                {donorPart}
                            </Text>
                        );
                    }

                    parts.push(
                        <Text key="donated-to" style={{ color: '#374151', fontSize: 14 }}>
                            {' '}donated to{' '}
                        </Text>
                    );

                    // Handle Nonprofit Link - check for " and X other"
                    const otherMatch = restPart.match(/(.*)( and \d+ other.*)/);
                    const nonprofitName = otherMatch ? otherMatch[1] : restPart;
                    const suffix = otherMatch ? otherMatch[2] : '';

                    if (item.nonprofitId) {
                        parts.push(
                            <Text
                                key="nonprofit"
                                style={{ fontFamily: 'Outfit-SemiBold', color: '#374151', fontSize: 14 }}
                                onPress={() => {
                                    (navigation as any).navigate('CauseDetail', { causeId: item.nonprofitId });
                                }}
                            >
                                {nonprofitName}
                            </Text>
                        );
                    } else {
                        parts.push(
                            <Text key="nonprofit-text" style={{ color: '#374151', fontSize: 14 }}>
                                {nonprofitName}
                            </Text>
                        );
                    }

                    if (suffix) {
                        parts.push(
                            <Text key="suffix" style={{ color: '#374151', fontSize: 14 }}>
                                {suffix}
                            </Text>
                        );
                    }

                    return <Text style={{ color: '#374151', fontSize: 14 }}>{parts}</Text>;
                }
            }

            // Handle donation type with collective format
            if (item.type === 'donation') {
                return (
                    <Text style={{ color: '#374151', fontSize: 14 }}>
                        Your collective{' '}
                        {item.collectiveId && item.collectiveName ? (
                            <Text
                                style={{ fontFamily: 'Outfit-SemiBold', color: '#374151', fontSize: 14 }}
                                onPress={() => {
                                    if (item.collectiveId) {
                                        (navigation as any).navigate('GroupCRWD', { crwdId: item.collectiveId.toString() });
                                    }
                                }}
                            >
                                {item.collectiveName}
                            </Text>
                        ) : (
                            <Text style={{ color: '#374151', fontSize: 14 }}>
                                {item.collectiveName || 'Community Champions'}
                            </Text>
                        )}
                        {' '}received a {item.donationAmount || '$50'} donation
                    </Text>
                );
            }

            // Handle new_member type
            if (item.type === 'new_member') {
                const parts: React.ReactElement[] = [];
                let lastIndex = 0;

                // Find member name and make it clickable
                if (item.userId && item.memberName) {
                    const memberPattern = new RegExp(item.memberName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    let match;
                    while ((match = memberPattern.exec(description)) !== null) {
                        if (match.index > lastIndex) {
                            parts.push(
                                <Text key={`text-${match.index}`} style={{ color: '#374151', fontSize: 14 }}>
                                    {description.substring(lastIndex, match.index)}
                                </Text>
                            );
                        }
                        parts.push(
                            <Text
                                key={`member-${match.index}`}
                                style={{ fontFamily: 'Outfit-SemiBold', color: '#374151', fontSize: 14 }}
                                onPress={() => {
                                    (navigation as any).navigate('UserProfile', { userId: item.userId.toString() });
                                }}
                            >
                                {match[0]}
                            </Text>
                        );
                        lastIndex = match.index + match[0].length;
                    }
                }

                // Find collective name and make it clickable
                if (item.collectiveId && item.collectiveName) {
                    const collectivePattern = new RegExp(item.collectiveName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    let match;
                    while ((match = collectivePattern.exec(description)) !== null) {
                        if (match.index >= lastIndex) {
                            if (match.index > lastIndex) {
                                parts.push(
                                    <Text key={`text-${match.index}`} style={{ color: '#374151', fontSize: 14 }}>
                                        {description.substring(lastIndex, match.index)}
                                    </Text>
                                );
                            }
                            parts.push(
                                <Text
                                    key={`collective-${match.index}`}
                                    style={{ fontFamily: 'Outfit-SemiBold', color: '#374151', fontSize: 14 }}
                                    onPress={() => {
                                        (navigation as any).navigate('GroupCRWD', { crwdId: item.collectiveId.toString() });
                                    }}
                                >
                                    {match[0]}
                                </Text>
                            );
                            lastIndex = match.index + match[0].length;
                        }
                    }
                }

                if (lastIndex < description.length) {
                    parts.push(
                        <Text key="text-end" style={{ color: '#374151', fontSize: 14 }}>
                            {description.substring(lastIndex)}
                        </Text>
                    );
                }

                return parts.length > 0 ? (
                    <Text style={{ color: '#374151', fontSize: 14 }}>{parts}</Text>
                ) : (
                    <Text style={{ color: '#374151', fontSize: 14 }}>{description}</Text>
                );
            }

            // Handle other types - parse full names, @username mentions, and collective names
            const parts: React.ReactElement[] = [];
            let lastIndex = 0;

            // Collect all matches with their positions
            const matches: Array<{ index: number; length: number; type: 'username' | 'fullname' | 'collective'; userId?: string; collectiveId?: string }> = [];

            // Find @username mentions - make them clickable if we have userId
            const usernamePattern = /@(\w+)/gi;
            let match;
            while ((match = usernamePattern.exec(description)) !== null) {
                const matchedUsername = match[1];
                // If we have userId, make the @username clickable (it's the user who triggered the notification)
                if (item.userId) {
                    matches.push({
                        index: match.index,
                        length: match[0].length,
                        type: 'username',
                        userId: item.userId.toString()
                    });
                }
            }

            // Find full names (pattern: "First Last" at start of sentence or after certain words)
            // Match names like "Aayush Bajaj", "Jake Smith", "Chad F", etc.
            if (item.userId && item.firstName && item.lastName) {
                const fullNamePattern = new RegExp(`\\b${item.firstName}\\s+${item.lastName}\\b`, 'gi');
                let nameMatch: RegExpExecArray | null;
                while ((nameMatch = fullNamePattern.exec(description)) !== null) {
                    // Check if this position is not already covered by a username match
                    const isOverlapping = matches.some(m =>
                        nameMatch!.index >= m.index && nameMatch!.index < m.index + m.length
                    );
                    if (!isOverlapping) {
                        matches.push({
                            index: nameMatch.index,
                            length: nameMatch[0].length,
                            type: 'fullname',
                            userId: item.userId.toString()
                        });
                    }
                }
            }

            // Find collective name mentions
            if (item.collectiveId && item.collectiveName) {
                const collectivePattern = new RegExp(item.collectiveName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                let collectiveMatch: RegExpExecArray | null;
                while ((collectiveMatch = collectivePattern.exec(description)) !== null) {
                    // Check if this position is not already covered
                    const isOverlapping = matches.some(m =>
                        collectiveMatch!.index >= m.index && collectiveMatch!.index < m.index + m.length
                    );
                    if (!isOverlapping) {
                        matches.push({
                            index: collectiveMatch.index,
                            length: collectiveMatch[0].length,
                            type: 'collective',
                            collectiveId: item.collectiveId.toString()
                        });
                    }
                }
            }

            // Sort matches by index
            matches.sort((a, b) => a.index - b.index);

            // Build parts array
            for (const matchItem of matches) {
                // Add text before match
                if (matchItem.index > lastIndex) {
                    parts.push(
                        <Text key={`text-${matchItem.index}`} style={{ color: '#374151', fontSize: 14 }}>
                            {description.substring(lastIndex, matchItem.index)}
                        </Text>
                    );
                }

                // Add clickable link based on type
                if (matchItem.type === 'username' || matchItem.type === 'fullname') {
                    if (matchItem.userId) {
                        parts.push(
                            <Text
                                key={`user-${matchItem.index}`}
                                style={{ fontFamily: 'Outfit-SemiBold', color: '#374151', fontSize: 14 }}
                                onPress={() => {
                                    (navigation as any).navigate('UserProfile', { userId: matchItem.userId });
                                }}
                            >
                                {description.substring(matchItem.index, matchItem.index + matchItem.length)}
                            </Text>
                        );
                    } else {
                        parts.push(
                            <Text key={`user-text-${matchItem.index}`} style={{ color: '#374151', fontSize: 14 }}>
                                {description.substring(matchItem.index, matchItem.index + matchItem.length)}
                            </Text>
                        );
                    }
                } else if (matchItem.type === 'collective') {
                    if (matchItem.collectiveId) {
                        parts.push(
                            <Text
                                key={`collective-${matchItem.index}`}
                                style={{ fontFamily: 'Outfit-SemiBold', color: '#374151', fontSize: 14 }}
                                onPress={() => {
                                    (navigation as any).navigate('GroupCRWD', { crwdId: matchItem.collectiveId });
                                }}
                            >
                                {description.substring(matchItem.index, matchItem.index + matchItem.length)}
                            </Text>
                        );
                    } else {
                        parts.push(
                            <Text key={`collective-text-${matchItem.index}`} style={{ color: '#374151', fontSize: 14 }}>
                                {description.substring(matchItem.index, matchItem.index + matchItem.length)}
                            </Text>
                        );
                    }
                }

                lastIndex = matchItem.index + matchItem.length;
            }

            // Add remaining text
            if (lastIndex < description.length) {
                parts.push(
                    <Text key="text-end" style={{ color: '#374151', fontSize: 14 }}>
                        {description.substring(lastIndex)}
                    </Text>
                );
            }

            return parts.length > 0 ? (
                <Text style={{ color: '#374151', fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 20 }}>{parts}</Text>
            ) : (
                <Text style={{ color: '#374151', fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 20 }}>{description}</Text>
            );
        };

        return (
            <TouchableOpacity
                style={{
                    paddingHorizontal: 12,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                    backgroundColor: item.postId ? 'transparent' : 'white',
                }}
                onPress={handleItemPress}
                activeOpacity={item.postId ? 0.7 : 1}
            >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    {/* Avatar - matching vite size and style */}
                    <TouchableOpacity
                        onPress={handleAvatarPress}
                        activeOpacity={0.7}
                        style={{ flexShrink: 0 }}
                    >
                        {(() => {
                            const bgColor = item.userId
                                ? (item.color || getConsistentColor(item.userId, avatarColors))
                                : (item.username ? getConsistentColor(item.username, avatarColors) : avatarColors[0]);

                            return (
                                <Avatar size={40}>
                                    <AvatarImage src={item.avatarUrl} />
                                    <AvatarFallback
                                        style={{ backgroundColor: bgColor }}
                                        textStyle={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Outfit-Bold' }}
                                    >
                                        {getInitials(item.firstName, item.lastName, item.username)}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })()}
                    </TouchableOpacity>

                    {/* Content - matching vite layout */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                        {/* Title - matching vite font size */}
                        <Text style={{
                            fontFamily: 'Outfit-Bold',
                            color: '#111827',
                            fontSize: 15,
                            fontWeight: '700',
                            marginBottom: 4
                        }}>
                            {item.title}
                        </Text>
                        {/* Description - matching vite font size and color */}
                        <View style={{ marginBottom: 6 }}>
                            {renderDescription()}
                        </View>
                        {/* Time - matching vite font size */}
                        <Text style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'Outfit-Regular' }}>
                            {item.time}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
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
                        {(() => {
                            const bgColor = item.userId
                                ? (item.color || getConsistentColor(item.userId, avatarColors))
                                : (item.username ? getConsistentColor(item.username, avatarColors) : '#E5E7EB');

                            // Show image if available, otherwise use fallback color like Vite
                            return (
                                <Avatar size={40}>
                                    <AvatarImage src={item.avatarUrl} />
                                    <AvatarFallback
                                        style={{ backgroundColor: bgColor }}
                                        textStyle={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Outfit-Bold' }}
                                    >
                                        {getInitials(item.firstName, item.lastName, item.username)}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })()}
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
                                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 15, fontWeight: '700', color: '#111' }}>{item.username}</Text>
                                        <Text style={{ fontSize: 14, fontFamily: 'Outfit-Regular', color: PrimaryGrey }}>• {item.time}</Text>
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
                                    <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium', color: PrimaryBlue, marginTop: 2 }}>{item.org}</Text>
                                </TouchableOpacity>
                            )}

                            <View style={{ marginTop: 8, marginBottom: 12 }}>
                                {item.isJoin ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={{ color: '#374151', fontSize: 15, fontFamily: 'Outfit-Regular' }}>{item.text}</Text>
                                        {item.groupName && (
                                            <TouchableOpacity onPress={() => {
                                                if (item.collectiveId) {
                                                    (navigation as any).navigate('GroupCRWD', { collectiveId: item.collectiveId.toString() });
                                                }
                                            }}>
                                                <Text style={{ color: PrimaryBlue, fontFamily: 'Outfit-SemiBold', fontSize: 15 }}>{item.groupName}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : item.isPost ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                        <Text style={{ color: '#374151', fontSize: 15, fontFamily: 'Outfit-Regular' }}>{item.text}</Text>
                                        {item.postId && (
                                            <TouchableOpacity onPress={() => {
                                                (navigation as any).navigate('PostDetail', { postId: item.postId });
                                            }}>
                                                <Text style={{ color: PrimaryBlue, textDecorationLine: 'underline', fontSize: 15, fontFamily: 'Outfit-SemiBold' }}>post</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <View>
                                        <Text style={{ color: '#374151', fontSize: 15, fontFamily: 'Outfit-Regular', lineHeight: 22 }}>{item.text}</Text>
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
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#111', marginBottom: 4 }}>
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
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#111' }}>Date</Text>
                                            <Text style={{ color: '#6B7280' }}>{item.eventDetails.date}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#111' }}>Time</Text>
                                            <Text style={{ color: '#6B7280' }}>{item.eventDetails.time}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#111' }}>RSVP</Text>
                                            <Text style={{ color: '#6B7280' }}>{item.eventDetails.rsvp}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#111' }}>Maybe</Text>
                                            <Text style={{ color: '#6B7280' }}>{item.eventDetails.maybe}</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#111' }}>Place</Text>
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
                <Text style={{ fontSize: 20, fontFamily: 'Outfit-Bold', color: '#111827', flex: 1 }}>
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
                        fontFamily: 'Outfit-Medium',
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
                        fontFamily: 'Outfit-Medium',
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
                                fontFamily: 'Outfit-SemiBold',
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
                                fontFamily: 'Outfit-SemiBold',
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