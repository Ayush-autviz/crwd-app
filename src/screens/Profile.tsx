import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal, TouchableWithoutFeedback, ActivityIndicator, RefreshControl, StyleSheet, Dimensions } from 'react-native'
import * as React from 'react';
import { useState, useCallback, useMemo, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetModal } from '@gorhom/bottom-sheet'
import MainHeaderNav from '../components/MainHeaderNav'
import ProfileBio from '../components/ProfileBio'
import PopularPosts from '../components/PopularPosts'
import ProfileInterests from '../components/ProfileInterests'
import { PrimaryBlue, PrimaryGrey, LightGrey } from '../Constants/Colors'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { Share2, Flag, ChevronRight, Ellipsis, MessageCircle, MessageSquare, ArrowLeft, X, Users, Plus, MapPin, DoorOpenIcon, Pencil, Heart } from 'lucide-react-native'
import SharePost from '../components/SharePost'
import { getPosts, getUserProfileById, getUserFollowers, getUserFollowing, getFavoriteCauses, getSupportedCausesByUserId, followUser, unfollowUser } from '../services/api/social'
import { getUserCollectives, getJoinCollective } from '../services/api/crwd'
import { getDonationBox } from '../services/api/donation'
import { useAuthStore } from '../store/store'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'
import { logout, unregisterToken } from '../services/api/auth'
import messaging from '@react-native-firebase/messaging';
import { useToast } from '../contexts/ToastContext'
import { WEB_BASE_URL } from '../Constants/url'
import CommentsBottomSheet from '../components/post/CommentsBottomSheet'
import { truncateAtFirstPeriod } from '../utils/truncateFirstPeriod'
import { CompactProfileHeader } from '../components/profile/CompactProfileHeader'
import { ProfileDonationBox } from '../components/profile/ProfileDonationBox'
import { ProfileGroups } from '../components/profile/ProfileGroups'
import { Skeleton } from '../components/ui/Skeleton'
import { useInfiniteQuery } from '@tanstack/react-query';

type RootStackParamList = {
    ProfileEdit: undefined;
    Interests: undefined;
    Search: undefined;
};

// Avatar colors for consistent fallback styling (same as NewCreateCollective.tsx)
const avatarColors = [
    '#FF6B6B', '#4CAF50', '#FF9800', '#9C27B0', '#2196F3',
    '#FFC107', '#E91E63', '#00BCD4', '#8BC34A', '#FF5722',
    '#673AB7', '#009688', '#FFEB3B', '#795548', '#607D8B',
];

const getConsistentColor = (id: number | string, colors: string[]) => {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const getInitials = (firstName?: string, lastName?: string, name?: string, username?: string) => {
    if (firstName && lastName) {
        return `${firstName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
        return firstName.charAt(0).toUpperCase();
    }
    if (name) {
        const words = name.split(' ').filter(Boolean);
        // if (words.length >= 2) {
        //     return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
        // }
        return words[0]?.charAt(0).toUpperCase() || 'U';
    }
    return username?.charAt(0).toUpperCase() || 'U';
};

const PostSkeleton = () => (
    <View style={{ marginBottom: 24, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View>
                <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width={80} height={12} borderRadius={4} />
            </View>
        </View>
        <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={200} borderRadius={12} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 24 }}>
                <Skeleton width={40} height={20} borderRadius={4} />
                <Skeleton width={40} height={20} borderRadius={4} />
            </View>
            <Skeleton width={20} height={20} borderRadius={4} />
        </View>
    </View>
);

export default function Profile() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user, token, logout: logoutStore } = useAuthStore();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeStatsTab, setActiveStatsTab] = useState<'causes' | 'following' | 'followers' | 'crwds'>('causes');
    const [showCommentsSheet, setShowCommentsSheet] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [showFounderSheet, setShowFounderSheet] = useState(false);

    // Bottom sheet ref
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const founderSheetRef = useRef<BottomSheetModal>(null);
    const shareSheetRef = useRef<BottomSheetModal>(null);
    const screenHeight = Dimensions.get('window').height;
    const snapPoints = useMemo(() => [screenHeight * 0.75], [screenHeight]);
    const founderSnapPoints = useMemo(() => [screenHeight * 0.75], [screenHeight]);

    console.log('user', token);


    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            console.log('Logout successful');
            // Clear auth store
            logoutStore();
            // Navigate to login screen
            navigation.navigate('Login' as never);
        },
        onError: (error: any) => {
            console.error('Logout error:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Logout failed';
            Alert.alert('Error', errorMessage);
        },
    });

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Get current FCM token
                            const fcmToken = await messaging().getToken();
                            if (fcmToken) {
                                await unregisterToken({ token: fcmToken });
                            }
                        } catch (error) {
                            console.error('Error unregistering token:', error);
                        } finally {
                            queryClient.clear();
                            logoutStore();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'OnBoard' as never }],
                            });
                        }
                    }
                }
            ]
        );
    };

    // API integrations - matching Vite version
    const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
        queryKey: ['userProfile', user?.id],
        queryFn: () => getUserProfileById(user?.id?.toString() || ''),
        enabled: !!user?.id,
    });

    const { data: donationBoxData, isLoading: donationBoxLoading, refetch: refetchDonationBox } = useQuery({
        queryKey: ['donationBox'],
        queryFn: getDonationBox,
        enabled: !!user?.id,
    });

    // Fetch user posts - matching Vite version with pagination
    const {
        data: postsData,
        isLoading: postsLoading,
        fetchNextPage: fetchNextPosts,
        hasNextPage: hasNextPosts,
        isFetchingNextPage: isFetchingNextPosts,
        refetch: refetchPosts
    } = useInfiniteQuery({
        queryKey: ['posts', user?.id],
        queryFn: ({ pageParam = 1 }) => getPosts(user?.id?.toString() || '', '', pageParam),
        getNextPageParam: (lastPage: any) => {
            if (lastPage?.next) {
                const match = lastPage.next.match(/page=(\d+)/);
                return match ? parseInt(match[1]) : undefined;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!user?.id,
    });

    // Fetch followers data - matching Vite version
    const followersQuery = useQuery({
        queryKey: ['followers', user?.id],
        queryFn: () => getUserFollowers(user?.id?.toString() || ''),
        enabled: !!user?.id,
    });

    // Fetch following data - matching Vite version
    const followingQuery = useQuery({
        queryKey: ['following', user?.id],
        queryFn: () => getUserFollowing(user?.id?.toString() || ''),
        enabled: !!user?.id,
    });

    // Fetch favorite causes data - matching Vite version
    const favoriteCausesQuery = useQuery({
        queryKey: ['favoriteCauses', user?.id],
        queryFn: () => getFavoriteCauses(),
        enabled: !!user?.id,
    });

    // Fetch user collectives data - matching Vite version
    const userCollectivesQuery = useQuery({
        queryKey: ['joinCollective', user?.id],
        queryFn: () => getJoinCollective(user?.id),
        enabled: !!user?.id,
    });

    // Filter collectives to only show those where user is admin
    const adminCollectives = useMemo(() => {
        return userCollectivesQuery.data?.data?.filter((item: any) => item.role === 'admin') || [];
    }, [userCollectivesQuery.data]);

    // Fetch admin collectives for founder bottom sheet (only when sheet is open)
    const { data: adminCollectivesData, isLoading: adminCollectivesLoading } = useQuery({
        queryKey: ['adminCollectives', user?.id],
        queryFn: () => getJoinCollective(user?.id),
        enabled: !!user?.id && showFounderSheet,
    });

    // Filter collectives for bottom sheet to only show those where user is admin
    const adminCollectivesForSheet = useMemo(() => {
        const data = adminCollectivesData?.data || [];
        return Array.isArray(data) ? data.filter((item: any) => item.role === 'admin') : [];
    }, [adminCollectivesData]);

    // Handle sheet opening/closing
    React.useEffect(() => {
        if (showFounderSheet) {
            founderSheetRef.current?.present();
        } else {
            founderSheetRef.current?.dismiss();
        }
    }, [showFounderSheet]);

    // Statistics bottom sheet queries
    const targetUserId = profileData?.id?.toString() || user?.id?.toString() || '';

    const { data: statsCausesData, isLoading: statsCausesLoading } = useQuery({
        queryKey: ['supportedCauses', targetUserId],
        queryFn: () => getSupportedCausesByUserId(targetUserId),
        enabled: !!targetUserId,
    });

    const { data: statsCollectivesData, isLoading: statsCollectivesLoading } = useQuery({
        queryKey: ['joinCollective', targetUserId],
        queryFn: () => getJoinCollective(targetUserId),
        enabled: !!targetUserId,
    });

    const { data: statsFollowersData, isLoading: statsFollowersLoading } = useQuery({
        queryKey: ['followers', targetUserId],
        queryFn: () => getUserFollowers(targetUserId),
        enabled: !!targetUserId,
    });

    const { data: statsFollowingData, isLoading: statsFollowingLoading } = useQuery({
        queryKey: ['following', targetUserId],
        queryFn: () => getUserFollowing(targetUserId),
        enabled: !!targetUserId,
    });

    // Follow/Unfollow mutations
    const followUserMutation = useMutation({
        mutationFn: followUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followers'] });
            queryClient.invalidateQueries({ queryKey: ['following'] });
            queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
            if (targetUserId && targetUserId !== user?.id?.toString()) {
                queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
            }
            // showToast('Followed');
        },
        onError: (error: any) => {
            console.error('Error following user:', error);
            showToast('Error following user');
        },
    });

    const unfollowUserMutation = useMutation({
        mutationFn: unfollowUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followers'] });
            queryClient.invalidateQueries({ queryKey: ['following'] });
            queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
            if (targetUserId && targetUserId !== user?.id?.toString()) {
                queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
            }
            // showToast('Unfollowed');
        },
        onError: (error: any) => {
            console.error('Error unfollowing user:', error);
            showToast('Error unfollowing user');
        },
    });

    const handleFollowToggle = (userId: string, isFollowing: boolean) => {
        if (isFollowing) {
            unfollowUserMutation.mutate(userId, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
                }
            });
        } else {
            followUserMutation.mutate(userId, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
                }
            });
        }
    };



    // Transform posts data to match PostDetail interface - matching Vite version
    const userPosts = useMemo(() => {
        return postsData?.pages?.flatMap((page: any) => page.results || [])?.map((post: any) => ({
            id: post.id,
            userId: post.user?.id?.toString(),
            avatarUrl: post.user?.profile_picture,
            username: post.user?.first_name + ' ' + post.user?.last_name || 'Unknown User',
            time: post.created_at || new Date().toISOString(),
            created_at: post.created_at,
            timestamp: post.created_at,
            org: post.collective?.name,
            orgUrl: post.collective?.id,
            text: post.content || '',
            imageUrl: post.media || undefined,
            media_type: post.media_type || undefined,
            previewDetails: post.preview_details || null,
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            shares: 0,
            isLiked: post.is_liked || false,
            color: post.user?.color,
            mentions: post.mentions || [],
            reposted_from: post.reposted_from,
        })) || [];
    }, [postsData]);

    const handleShare = () => {
        if (!user?.id) return;
        setShowMenu(false);
        shareSheetRef.current?.present();
    };

    const handleReportProfile = () => {
        Alert.alert('Report Profile', 'Report functionality would go here');
        setShowMenu(false);
    };

    const handleEditProfile = () => {
        navigation.navigate('NewSettings' as never);
        setShowMenu(false);
    };


    const handleMoreInterests = () => {
        navigation.navigate('Interests' as never);
    };

    // Transform statistics data
    // Transform statistics data
    const statsCauses = statsCausesData?.results?.map((item: any) => {
        const cause = item.cause || item;
        const imageUrl = cause.image || cause.avatar || cause.logo || cause.profile_picture || '';
        console.log(`Mapping cause ${cause.name}: image=${imageUrl}`);
        return {
            name: cause.name || 'Unknown Cause',
            avatar: imageUrl,
            id: cause.id,
            description: cause.mission || cause.description || '',
        };
    }) || [];

    const statsCrwds = statsCollectivesData?.data?.map((item: any) => {
        const collective = item.collective || item;
        const imageUrl = collective.logo || collective.image || collective.avatar || collective.created_by?.profile_picture || '';
        console.log(`Mapping collective ${collective.name}: image=${imageUrl}`);
        return {
            name: collective.name || 'Unknown Collective',
            avatar: imageUrl,
            id: collective.id,
            member_count: collective.member_count || 0,
            color: collective.color || undefined,
        };
    }) || [];

    const statsFollowing = statsFollowingData?.following?.map((item: any) => {
        const userData = item.followee || item.following || item.user || item;
        const isFollowing = item.is_following ?? userData.is_following ?? false;
        return {
            name: userData.first_name && userData.last_name
                ? `${userData.first_name} ${userData.last_name}`
                : userData.first_name || userData.name || 'Unknown User',
            username: userData.username || 'unknown',
            avatar: userData.profile_picture || userData.avatar || '',
            id: userData.id,
            is_following: isFollowing,
            color: userData.color || undefined,
            bio: userData.bio || '',
            location: userData.location || '',
        };
    }) || [];

    const statsFollowers = statsFollowersData?.followers?.map((item: any) => {
        const userData = item.follower || item.user || item;
        const isFollowing = item.is_following ?? userData.is_following ?? false;
        return {
            name: userData.first_name && userData.last_name
                ? `${userData.first_name} ${userData.last_name}`
                : userData.first_name || userData.name || 'Unknown User',
            username: userData.username || 'unknown',
            avatar: userData.profile_picture || userData.avatar || '',
            id: userData.id,
            is_following: isFollowing,
            color: userData.color || undefined,
            bio: userData.bio || '',
            location: userData.location || '',
        };
    }) || [];

    // Get tab title and subtitle
    const getTabInfo = () => {
        switch (activeStatsTab) {
            case 'causes':
                return { title: 'All Nonprofits', subtitle: 'All nonprofits that you support' };
            case 'crwds':
                return { title: 'Giving Groups', subtitle: "Giving Groups you're part of" };
            case 'followers':
                return { title: 'Followers', subtitle: 'People following you' };
            case 'following':
                return { title: 'Following', subtitle: 'People you follow' };
            default:
                return { title: 'Statistics', subtitle: '' };
        }
    };

    // Bottom sheet backdrop
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    // Founder sheet backdrop
    const renderFounderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    // Render statistics content
    const renderStatsContent = () => {
        const tabInfo = getTabInfo();

        if (activeStatsTab === 'causes') {
            if (statsCausesLoading) {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                        <ActivityIndicator size="large" color={PrimaryBlue} />
                        <Text style={{ marginTop: 10, fontSize: 15, color: PrimaryGrey }}>Loading nonprofits...</Text>
                    </View>
                );
            }
            return (
                <View>
                    {statsCauses.length > 0 ? statsCauses.map((cause: any, index: number) => {
                        // Generate consistent color based on cause ID
                        const causeBgColor = getConsistentColor(cause.id || cause.name || 'N', avatarColors);

                        return (
                            <TouchableOpacity
                                key={cause.id || index}
                                style={styles.causeItem}
                                onPress={() => {
                                    bottomSheetRef.current?.close();
                                    (navigation as any).navigate('CauseScreen', { id: cause.id });
                                }}
                            >
                                <Avatar size={48} style={{ borderRadius: 10 }}>
                                    <AvatarImage src={cause.avatar} />
                                    <AvatarFallback style={{ backgroundColor: cause.avatar ? 'transparent' : causeBgColor }} textStyle={{ color: '#FFFFFF', fontFamily: 'Outfit-Bold', fontSize: 20 }}>
                                        {cause.name?.charAt(0)?.toUpperCase() || 'N'}
                                    </AvatarFallback>
                                </Avatar>
                                <View style={styles.causeContent}>
                                    <Text style={styles.causeName}>{cause.name}</Text>
                                    <Text style={styles.causeDescription} numberOfLines={2}>
                                        {truncateAtFirstPeriod(cause.description || 'Supporting this cause')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={{ fontSize: 15, color: PrimaryGrey, fontFamily: 'Outfit-Regular' }}>No nonprofits found</Text>
                        </View>
                    )}
                </View>
            );
        }

        if (activeStatsTab === 'crwds') {
            if (statsCollectivesLoading) {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                        <ActivityIndicator size="large" color={PrimaryBlue} />
                        <Text style={{ marginTop: 10, fontSize: 15, color: PrimaryGrey }}>Loading collectives...</Text>
                    </View>
                );
            }
            return (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {statsCrwds.length > 0 ? statsCrwds.map((crwd: any, index: number) => {
                        const hasImage = crwd.avatar &&
                            (crwd.avatar.startsWith('http') || crwd.avatar.startsWith('/') || crwd.avatar.startsWith('data:'));
                        const iconColor = crwd.color || (!hasImage ? '#10B981' : undefined);
                        const iconLetter = crwd.name.charAt(0).toUpperCase();

                        return (
                            <TouchableOpacity
                                key={crwd.id || index}
                                style={styles.causeItem}
                                onPress={() => {
                                    bottomSheetRef.current?.close();
                                    (navigation as any).navigate('GroupCRWD', { id: crwd.id.toString() });
                                }}
                            >
                                <Avatar size={48} style={{ borderRadius: 10 }}>
                                    {hasImage ? (
                                        <AvatarImage src={crwd.avatar} />
                                    ) : null}
                                    <AvatarFallback style={{ backgroundColor: hasImage ? 'transparent' : (iconColor || '#10B981') }} textStyle={{ color: '#FFFFFF', fontFamily: 'Outfit-Bold', fontSize: 20 }}>
                                        {iconLetter}
                                    </AvatarFallback>
                                </Avatar>
                                <View style={styles.causeContent}>
                                    <Text style={styles.causeName}>{crwd.name}</Text>
                                    <Text style={styles.causeDescription} numberOfLines={1}>{crwd.member_count} members</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={{ fontSize: 15, color: PrimaryGrey, fontFamily: 'Outfit-Regular' }}>No collectives found</Text>
                        </View>
                    )}
                </ScrollView>
            );
        }

        const renderMembersList = (members: typeof statsFollowing, title: string) => {
            const isLoading = title === 'Following' ? statsFollowingLoading : statsFollowersLoading;
            const isFollowingTab = title === 'Following';

            if (isLoading) {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                        <ActivityIndicator size="large" color={PrimaryBlue} />
                        <Text style={{ marginTop: 10, fontSize: 15, color: PrimaryGrey }}>Loading {title.toLowerCase()}...</Text>
                    </View>
                );
            }

            return (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {members.length > 0 ? members.map((member: any, index: number) => {
                        const isFollowing = isFollowingTab ? true : (member.is_following || false);
                        return (
                            <TouchableOpacity
                                key={member.id || index}
                                style={styles.memberItem}
                                onPress={() => {
                                    bottomSheetRef.current?.close();
                                    if (member.id !== user?.id) {
                                        (navigation as any).navigate('UserProfile', { userId: member.id });
                                    }
                                }}
                            >
                                <View style={styles.memberInfo}>
                                    <Avatar size={48}>
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback
                                            style={{ backgroundColor: member.color || getConsistentColor(member.id || member.username || member.name || 'U', avatarColors) }}
                                            textStyle={{ color: '#FFFFFF', fontFamily: 'Outfit-SemiBold' }}
                                        >
                                            {getInitials(member.first_name, member.last_name, member.name, member.username)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <View style={styles.memberDetails}>
                                        <Text style={styles.memberName}>{member.name}</Text>
                                        <Text style={styles.memberUsername} numberOfLines={1}>{member.bio || member.location}</Text>
                                    </View>
                                </View>
                                {member.id !== user?.id && (
                                    <TouchableOpacity
                                        style={[styles.followButton, isFollowing && styles.followingButton]}
                                        onPress={() => handleFollowToggle(member.id.toString(), isFollowing)}
                                        disabled={followUserMutation.isPending || unfollowUserMutation.isPending}
                                    >
                                        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={{ fontSize: 15, color: PrimaryGrey, fontFamily: 'Outfit-Regular' }}>No {title.toLowerCase()} found</Text>
                        </View>
                    )}
                </ScrollView>
            );
        };

        if (activeStatsTab === 'following') {
            return renderMembersList(statsFollowing, 'Following');
        }

        if (activeStatsTab === 'followers') {
            return renderMembersList(statsFollowers, 'Followers');
        }

        return null;
    };

    // Pull to refresh handler
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            // Refetch all queries
            await Promise.all([
                refetchProfile(),
                refetchPosts(),
                followersQuery.refetch(),
                followingQuery.refetch(),
                favoriteCausesQuery.refetch(),
                userCollectivesQuery.refetch(),
                refetchDonationBox(),
            ]);
        } catch (error) {
            console.error('Error refreshing profile:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Show login prompt if user is not logged in - matching Vite version
    if (!user?.id) {
        navigation.navigate('Login' as never);
    }

    // Show loading state - matching Vite version
    if (profileLoading) {
        return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav title={'Me'} menu={false} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                    <Text style={{ marginTop: 16, fontSize: 15, color: '#6b7280' }}>
                        Loading profile...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state - matching Vite version
    if (profileError) {
        return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav title={'Me'} menu={false} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#ef4444' }}>
                        Error loading profile
                    </Text>
                    <TouchableOpacity
                        onPress={() => refetchProfile()}
                        style={{
                            marginTop: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            backgroundColor: '#374151',
                            borderRadius: 6
                        }}
                    >
                        <Text style={{ color: 'white' }}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
            {/* <MainHeaderNav title={'Me'} menu={false} /> */}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {/* <TouchableOpacity onPress={() => (navigation as any).goBack()}>
                        <ArrowLeft size={24} color="#111827" />
                    </TouchableOpacity> */}
                    <Text style={{ fontSize: 18, fontFamily: 'Outfit-Bold', color: '#111827' }}>
                        {profileData?.first_name && profileData?.last_name
                            ? `${profileData.first_name} ${profileData.last_name}`
                            : profileData?.username || 'Profile'
                        }
                    </Text>
                </View>
                <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                        onPress={() => setShowMenu(!showMenu)}
                        style={{
                            paddingHorizontal: 8,
                            borderRadius: 20,
                        }}
                    >
                        {/* <Text style={{ fontSize: 24, color: '#374151' }}>⋯</Text> */}
                        <Ellipsis size={24} color="#374151" />
                    </TouchableOpacity>

                    {showMenu && (
                        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                            <View style={{
                                position: 'absolute',
                                right: 0,
                                top: 40,
                                backgroundColor: 'white',
                                borderWidth: 1,
                                borderColor: '#e5e7eb',
                                borderRadius: 8,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 5,
                                width: 144,
                                zIndex: 20,
                            }}>
                                <TouchableWithoutFeedback onPress={() => { }}>
                                    <View>
                                        <TouchableOpacity
                                            onPress={handleShare}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#f3f4f6',
                                            }}
                                        >
                                            <Share2 size={16} color="#374151" />
                                            <Text style={{ fontSize: 14, color: '#374151' }}>Share Profile</Text>
                                        </TouchableOpacity>
                                        {/* <TouchableOpacity
                                            onPress={handleReportProfile}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                            }}
                                        >
                                            <Flag size={16} color="#ef4444" />
                                            <Text style={{ fontSize: 14, color: '#ef4444' }}>Report Profile</Text>
                                        </TouchableOpacity> */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowMenu(false);
                                                handleLogout();
                                            }}
                                            disabled={logoutMutation.isPending}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                opacity: logoutMutation.isPending ? 0.5 : 1,
                                            }}
                                        >
                                            {logoutMutation.isPending ? (
                                                <ActivityIndicator size={16} color="#ef4444" />
                                            ) : (
                                                <DoorOpenIcon size={16} color="#ef4444" />
                                            )}
                                            <Text style={{ fontSize: 14, color: '#ef4444' }}>
                                                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    )}
                </View>
                {/* Edit button - outside menu like crwd-vite */}
                {/* <TouchableOpacity
                    onPress={handleEditProfile}
                    style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 6,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        backgroundColor: 'white',
                    }}
                >
                    <Text style={{ fontSize: 14, color: '#111827', fontFamily: 'Outfit-Medium' }}>Edit</Text>
                </TouchableOpacity> */}
            </View>

            {/* Activate Donation Box Prompt */}
            {!donationBoxData?.is_active && !donationBoxLoading && (
                <TouchableOpacity
                    onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Donate' })}
                    style={{ backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FEE2E2', paddingVertical: 12, alignItems: 'center', zIndex: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Heart size={16} color="#EF4444" fill="#EF4444" />
                        <Text style={{ color: '#EF4444', fontFamily: 'Outfit-SemiBold', fontSize: 14 }}>
                            Activate your Donation Box
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={PrimaryBlue}
                        colors={[PrimaryBlue]}
                    />
                }
            >
                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                    <CompactProfileHeader
                        profileData={profileData}
                        followersCount={followersQuery?.data?.count || profileData?.followers_count || 0}
                        followingCount={followingQuery?.data?.count || profileData?.following_count || 0}
                        onAvatarPress={() => setShowImageModal(true)}
                        onFollowersPress={() => {
                            setActiveStatsTab('followers');
                            bottomSheetRef.current?.present();
                        }}
                        onFollowingPress={() => {
                            setActiveStatsTab('following');
                            bottomSheetRef.current?.present();
                        }}
                        getConsistentColor={getConsistentColor}
                        avatarColors={avatarColors}
                        getInitials={getInitials}
                        isOwnProfile={true}
                        onEditPress={handleEditProfile}
                    />

                    {profileData?.bio ? (
                        <ProfileBio bio={profileData.bio} />
                    ) : (
                        <TouchableOpacity onPress={handleEditProfile}>
                            <Text style={{ color: '#2222EE', fontFamily: 'Outfit-Bold', fontSize: 14, marginVertical: 5 }}>Add a bio</Text>
                        </TouchableOpacity>
                    )}


                    {/* People Inspired */}
                    {/* {profileData?.inspired_people_count > 0 && (
                        <Text style={{ 
                            fontSize: 13, 
                            fontWeight: '700', 
                            color: '#111827', 
                            textAlign: 'center',
                            // marginTop: 4,
                            marginBottom: 4
                        }}>
                            {profileData.inspired_people_count} {profileData.inspired_people_count === 1 ? 'Person' : 'People'} Inspired
                        </Text>
                    )} */}


                    <TouchableOpacity
                        onPress={handleEditProfile}
                        style={{
                            width: '100%',
                            height: 40,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginVertical: 10,
                        }}
                    >
                        <Text style={{ fontSize: 16, color: '#111827', fontFamily: 'Outfit-Bold' }}>Edit Profile</Text>
                    </TouchableOpacity>

                    <ProfileDonationBox
                        causes={profileData?.recently_supported_causes || []}
                        totalCount={profileData?.supported_causes_count || 0}
                        onSectionPress={() => {
                            setActiveStatsTab('causes');
                            bottomSheetRef.current?.present();
                        }}
                        onCausePress={(id) => (navigation as any).navigate('CauseScreen', { id })}
                        getConsistentColor={getConsistentColor}
                        avatarColors={avatarColors}
                    />

                    <ProfileGroups
                        collectives={userCollectivesQuery?.data?.data || []}
                        totalCount={userCollectivesQuery?.data?.data?.length || 0}
                        onSectionPress={() => {
                            setActiveStatsTab('crwds');
                            bottomSheetRef.current?.present();
                        }}
                        onCollectivePress={(id) => (navigation as any).navigate('GroupCRWD', { id: id.toString() })}
                        getConsistentColor={getConsistentColor}
                        avatarColors={avatarColors}
                    />

                    {/* Posts Section */}
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, paddingBottom: 100 }}>
                        {postsLoading ? (
                            <View style={{ paddingVertical: 10 }}>
                                <PostSkeleton />
                                <PostSkeleton />
                                <PostSkeleton />
                            </View>
                        ) : userPosts.length > 0 ? (
                            <>
                                <View style={{}}>
                                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-Bold', color: '#6b7280', textTransform: 'uppercase' }}>
                                        POSTS
                                    </Text>
                                </View>
                                <PopularPosts
                                    posts={userPosts}
                                    title=""
                                    onLoadMore={fetchNextPosts}
                                    hasMore={false}
                                    isLoadingMore={isFetchingNextPosts}
                                    onCommentPress={(post) => {
                                        const originalPost = postsData?.pages?.flatMap(page => page.results || [])?.find((p: any) => p.id.toString() === post.id.toString());
                                        setSelectedPost({
                                            id: parseInt(post.id),
                                            username: post.username,
                                            text: post.text,
                                            avatarUrl: post.avatarUrl,
                                            firstName: originalPost?.user?.first_name || post.username?.split(' ')[0],
                                            lastName: originalPost?.user?.last_name || post.username?.split(' ').slice(1).join(' ') || '',
                                            color: originalPost?.user?.color || post.color,
                                            mentions: originalPost?.mentions || post.mentions || [],
                                            reposted_from: originalPost?.reposted_from || post.reposted_from,
                                        });
                                        setShowCommentsSheet(true);
                                    }}
                                />
                                {hasNextPosts && (
                                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => fetchNextPosts()}
                                            disabled={isFetchingNextPosts}
                                            style={{
                                                paddingVertical: 10,
                                                paddingHorizontal: 20,
                                                borderWidth: 1,
                                                borderColor: '#d1d5db',
                                                borderRadius: 10,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                backgroundColor: '#f9fafb',
                                            }}
                                        >
                                            {isFetchingNextPosts ? (
                                                <>
                                                    <ActivityIndicator size="small" color={PrimaryBlue} />
                                                    <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#374151' }}>Loading...</Text>
                                                </>
                                            ) : (
                                                <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#374151' }}>Show More Posts</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <Users size={32} color="#16a34a" />
                                </View>
                                <Text style={{ fontSize: 18, fontFamily: 'Outfit-Bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>No posts yet</Text>
                                <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', fontFamily: 'Outfit-Regular', lineHeight: 20 }}>
                                    Updates will appear here as you share and interact in your Giving Groups. Join a new group to get started!
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Image View Modal */}
            <Modal
                visible={showImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowImageModal(false)}>
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        // opacity: 0.9,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View>
                                <TouchableOpacity
                                    style={{
                                        position: 'absolute',
                                        top: 50,
                                        right: 20,
                                        zIndex: 1
                                    }}
                                    onPress={() => setShowImageModal(false)}
                                >
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setShowImageModal(false)}>
                                    {profileData?.profile_picture ? (
                                        <Image
                                            source={{ uri: profileData.profile_picture }}
                                            style={{
                                                width: 300,
                                                height: 300,
                                                borderRadius: 150,
                                                resizeMode: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <View style={{
                                            width: 300,
                                            height: 300,
                                            borderRadius: 150,
                                            backgroundColor: profileData?.color || getConsistentColor(profileData?.id || profileData?.username || 'U', avatarColors),
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                            <Text style={{
                                                color: '#FFFFFF',
                                                fontFamily: 'Outfit-SemiBold',
                                                fontSize: 100
                                            }}>
                                                {getInitials(profileData?.first_name, profileData?.last_name, profileData?.username, profileData?.username)}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Statistics Bottom Sheet */}
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: 'white' }}
                enableDynamicSizing={false}
            >



                <View style={styles.titleSection}>
                    <Text style={styles.bottomSheetTitle}>{getTabInfo().title}</Text>
                    <Text style={styles.bottomSheetSubtitle}>{getTabInfo().subtitle}</Text>
                </View>


                <View style={styles.tabsContainer}>
                    {[
                        { label: 'Nonprofits', value: 'causes' },
                        { label: 'Groups', value: 'crwds' },
                        { label: 'Followers', value: 'followers' },
                        { label: 'Following', value: 'following' },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.value}
                            onPress={() => setActiveStatsTab(tab.value as typeof activeStatsTab)}
                            style={[
                                styles.tab,
                                activeStatsTab === tab.value && styles.activeTab
                            ]}
                        >
                            <Text style={[
                                styles.tabText,
                                activeStatsTab === tab.value && styles.activeTabText
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <BottomSheetScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
                >
                    {renderStatsContent()}
                </BottomSheetScrollView>
            </BottomSheetModal>

            {/* Founder/Organizer Bottom Sheet */}
            <BottomSheetModal
                ref={founderSheetRef}
                snapPoints={founderSnapPoints}
                enablePanDownToClose
                backdropComponent={renderFounderBackdrop}
                onDismiss={() => setShowFounderSheet(false)}
                enableDynamicSizing={false}
                backgroundStyle={{ backgroundColor: 'white' }}
            >
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={[styles.bottomSheetHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#111827' }}>
                                Collectives founded by {profileData?.first_name && profileData?.last_name
                                    ? `${profileData.first_name} ${profileData.last_name}`
                                    : profileData?.username || 'User'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowFounderSheet(false)}
                            style={{ padding: 4, marginLeft: 8 }}
                        >
                            <X size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Content */}
                    <BottomSheetScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 16 }}
                        style={{ flex: 1 }}
                    >
                        {adminCollectivesLoading ? (
                            <View style={{ padding: 16, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={PrimaryBlue} />
                            </View>
                        ) : adminCollectivesForSheet.length > 0 ? (
                            <View style={{ gap: 8 }}>
                                {adminCollectivesForSheet.map((item: any) => {
                                    const collective = item.collective || item;
                                    if (!collective || !collective.id) return null;

                                    const avatarBgColor = collective.color || getConsistentColor(collective.id, avatarColors);
                                    const collectiveName = collective.name || 'Unknown Giving Group';
                                    const initials = getInitials(collectiveName, '', collectiveName);

                                    return (
                                        <TouchableOpacity
                                            key={collective.id}
                                            onPress={() => {
                                                setShowFounderSheet(false);
                                                (navigation as any).navigate('GroupCRWD', { id: collective.id.toString() });
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: 10,
                                                backgroundColor: '#F9FAFB',
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderColor: '#E5E7EB',
                                            }}
                                        >
                                            <Avatar size={44} style={{ borderRadius: 10 }}>
                                                <AvatarImage src={collective.logo || collective.image} />
                                                <AvatarFallback
                                                    style={{ backgroundColor: avatarBgColor }}
                                                    textStyle={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Outfit-Bold' }}
                                                >
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#111827', marginBottom: 2 }}>
                                                    {collectiveName}
                                                </Text>
                                                <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'Outfit-Regular' }}>
                                                    {collective.member_count || 0} member{collective.member_count !== 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                            <ChevronRight size={18} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={{ padding: 32, alignItems: 'center' }}>
                                <Text style={{ fontSize: 15, color: '#6B7280', fontFamily: 'Outfit-Regular' }}>
                                    No Giving Groups found
                                </Text>
                            </View>
                        )}
                    </BottomSheetScrollView>

                    {/* Fixed Footer */}
                    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' }}>
                        {/* Motivational Message */}
                        {adminCollectivesForSheet.length > 0 && (
                            <View style={{ marginBottom: 12, alignItems: 'center' }}>
                                <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', fontFamily: 'Outfit-Regular' }}>
                                    Keep building your impact! Create another Collective to bring even more people together.
                                </Text>
                            </View>
                        )}

                        {/* Create Another Collective Button */}
                        <TouchableOpacity
                            onPress={() => {
                                setShowFounderSheet(false);
                                (navigation as any).navigate('NewCreateCollective');
                            }}
                            style={{
                                backgroundColor: '#1600ff',
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'Outfit-SemiBold' }}>
                                {adminCollectivesForSheet.length > 0 ? 'Create Another Collective' : 'Create Your Own Collective'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomSheetModal>

            {/* Comments Bottom Sheet */}
            {selectedPost && (
                <CommentsBottomSheet
                    isOpen={showCommentsSheet}
                    onClose={() => {
                        setShowCommentsSheet(false);
                        setSelectedPost(null);
                    }}
                    post={selectedPost}
                />
            )}
            {/* Share Post Sheet */}
            <SharePost
                ref={shareSheetRef}
                url={`${WEB_BASE_URL}/u/${user?.username}`}
                title={user?.full_name || user?.username || ''}
                message={user?.bio || ''}
                entityType="profile"
                entityId={user?.id}
                onClose={() => setShowMenu(false)}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => (navigation as any).navigate('Post')}
                activeOpacity={0.8}
            >
                <Plus size={32} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    bottomSheetContent: {
        flex: 1,
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 4,
    },
    headerName: {
        fontSize: 16,
        fontFamily: 'Outfit-SemiBold',
        color: '#111827',
        flex: 1,
        textAlign: 'center',
    },
    menuButtonHeader: {
        padding: 4,
    },
    titleSection: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    bottomSheetTitle: {
        fontSize: 24,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
        marginBottom: 4,
    },
    bottomSheetSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'Outfit-Regular',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        paddingVertical: 4,
        gap: 2,
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        marginHorizontal: 2
    },
    tab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        // backgroundColor: ,
    },
    activeTab: {
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    tabText: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'Outfit-SemiBold',
    },
    activeTabText: {
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    causeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8
        // paddingHorizontal: 16,
    },
    causeIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    causeIconText: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        color: 'white',
    },
    causeContent: {
        flex: 1,
    },
    causeName: {
        fontSize: 15,
        fontFamily: 'Outfit-SemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    causeDescription: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'Outfit-Regular',
        // lineHeight: 20,
    },
    statsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: LightGrey,
    },
    statsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    statsItemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'Outfit-SemiBold',
    },
    nonprofitBadge: {
        backgroundColor: '#dbeafe',
    },
    nonprofitText: {
        color: '#2563eb',
    },
    crwdBadge: {
        backgroundColor: '#dcfce7',
    },
    crwdText: {
        color: '#16a34a',
    },
    statsItemName: {
        fontSize: 15,
        fontFamily: 'Outfit-SemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    statsItemDescription: {
        fontSize: 14,
        color: PrimaryGrey,
        lineHeight: 16,
        fontFamily: 'Outfit-Regular',
    },
    viewButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        minWidth: 0,
    },
    memberDetails: {
        flex: 1,
        minWidth: 0,
    },
    memberName: {
        fontSize: 15,
        fontFamily: 'Outfit-Medium',
        color: '#111827',
        marginBottom: 2,
    },
    memberUsername: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Outfit-Regular',
    },
    followButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followingButton: {
        backgroundColor: '#F3F4F6',
    },
    followButtonText: {
        fontSize: 12,
        fontFamily: 'Outfit-SemiBold',
        color: '#FFFFFF',
    },
    followingButtonText: {
        color: '#6B7280',
    },
    emptyContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        // borderWidth: 1,
        // borderColor: '#E5E7EB',
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginTop: 8,
        marginBottom: 8,
        fontFamily: 'Outfit-Bold',
    },
    emptyDescription: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 300,
        fontFamily: 'Outfit-Regular',
    },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        backgroundColor: '#1600ff',
        width: 50,
        height: 50,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        zIndex: 1000,
    },
});