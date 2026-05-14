import { View, Text, ScrollView, TouchableOpacity, Share, Alert, StyleSheet, ActivityIndicator, Clipboard, TouchableWithoutFeedback, Dimensions, Image, Modal, RefreshControl } from 'react-native'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRoute, useNavigation } from '@react-navigation/native'
import { ArrowLeft, Ellipsis, Share2, Flag, MapPin, ChevronRight, X, Users, MessageCircle } from 'lucide-react-native'
import { getUserProfileById, followUserById, unfollowUserById, getPosts, getSupportedCausesByUserId, getUserFollowers, getUserFollowing } from '../services/api/social'
import { getJoinCollective } from '../services/api/crwd'
import { useAuthStore } from '../store/store'
import { useToast } from '../contexts/ToastContext'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar'
import ProfileBio from '../components/ProfileBio'
import ProfileStats from '../components/ProfileStats'
import PopularPosts from '../components/PopularPosts'
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { WEB_BASE_URL } from '../Constants/url'
import CommentsBottomSheet from '../components/post/CommentsBottomSheet'
import SharePost from '../components/SharePost'
import { truncateAtFirstPeriod } from '../utils/truncateFirstPeriod'
import { CompactProfileHeader } from '../components/profile/CompactProfileHeader'
import { ProfileDonationBox } from '../components/profile/ProfileDonationBox'
import { ProfileGroups } from '../components/profile/ProfileGroups'
import { Skeleton } from '../components/ui/Skeleton'

// Avatar colors for consistent fallback styling
const avatarColors = [
    '#FF6B6B', '#4CAF50', '#FF9800', '#9C27B0', '#2196F3',
    '#FFC107', '#E91E63', '#00BCD4', '#8BC34A', '#FF5722',
    '#673AB7', '#009688', '#FFEB3B', '#795548', '#607D8B',
];

const getConsistentColor = (id: number | string, colors: string[]) => {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

// Helper function to get initials from name
const getInitials = (firstName?: string, lastName?: string, username?: string): string => {
    // if (firstName && lastName) {
    //     return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    // }
    if (firstName) {
        return firstName.charAt(0).toUpperCase();
    }
    if (username) {
        return username.charAt(0).toUpperCase();
    }
    return 'U';
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

export default function UserProfile() {
    const route = useRoute()
    const navigation = useNavigation()
    const { userId } = route.params as { userId?: string };
    const [showMenu, setShowMenu] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showStatsSheet, setShowStatsSheet] = useState(false);
    const [activeStatsTab, setActiveStatsTab] = useState<'causes' | 'crwds' | 'followers' | 'following'>('causes');
    const [showCommentsSheet, setShowCommentsSheet] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [showFounderSheet, setShowFounderSheet] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const menuRef = useRef<View>(null);
    const { showToast } = useToast();
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [modalImageFailed, setModalImageFailed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Use userId if available
    const targetUserId = userId || '';

    // Check if viewing own profile
    const isOwnProfile = currentUser?.id?.toString() === targetUserId;

    // Fetch user profile
    const { data: userProfile, isLoading, error } = useQuery({
        queryKey: ['userProfile', targetUserId],
        queryFn: () => getUserProfileById(targetUserId || ''),
        enabled: !!targetUserId,
    });

    // Fetch user posts with pagination
    const {
        data: postsData,
        isLoading: postsLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['posts', targetUserId],
        queryFn: ({ pageParam = 1 }) => getPosts(targetUserId, '', pageParam),
        getNextPageParam: (lastPage: any) => {
            // Extract page number from next URL if available
            if (lastPage?.next) {
                const match = lastPage.next.match(/page=(\d+)/);
                return match ? parseInt(match[1]) : undefined;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!targetUserId,
    });

    // Flatten pages into a single array
    const posts = postsData ? {
        results: postsData.pages.flatMap((page: any) => page.results || []),
        next: postsData.pages[postsData.pages.length - 1]?.next || null,
        count: postsData.pages[0]?.count || 0,
    } : undefined;

    // Follow user mutation
    const followMutation = useMutation({
        mutationFn: () => followUserById(targetUserId || ''),
        onSuccess: () => {
            setIsFollowing(true);
            // showToast("Followed successfully!");
            queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
        },
        onError: (error: any) => {
            console.error('Error following user:', error);
            showToast("Failed to follow user");
        },
    });

    // Unfollow user mutation
    const unfollowMutation = useMutation({
        mutationFn: () => unfollowUserById(targetUserId || ''),
        onSuccess: () => {
            setIsFollowing(false);
            // showToast("Unfollowed successfully!");
            queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
        },
        onError: (error: any) => {
            console.error('Error unfollowing user:', error);
            showToast("Failed to unfollow user");
        },
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] }),
            queryClient.invalidateQueries({ queryKey: ['posts', targetUserId] }),
            queryClient.invalidateQueries({ queryKey: ['supportedCauses', targetUserId] }),
            queryClient.invalidateQueries({ queryKey: ['joinCollective', targetUserId] }),
            queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] }),
            queryClient.invalidateQueries({ queryKey: ['following', targetUserId] }),
        ]);
        setRefreshing(false);
    }, [targetUserId, queryClient]);

    const handleFollowClick = () => {
        if (!currentUser?.id) {
            (navigation as any).navigate('Login');
            return;
        }
        if (isFollowing) {
            unfollowMutation.mutate();
        } else {
            followMutation.mutate();
        }
    };

    const handleShareProfile = async () => {
        if (!targetUserId) return;
        shareSheetRef.current?.present();
        setShowMenu(false);
    };

    // Statistics bottom sheet queries
    const statsTargetUserId = userProfile?.id?.toString() || targetUserId || '';

    const { data: statsCausesData, isLoading: statsCausesLoading } = useQuery({
        queryKey: ['supportedCauses', statsTargetUserId],
        queryFn: () => getSupportedCausesByUserId(statsTargetUserId),
        enabled: !!statsTargetUserId,
    });

    const { data: statsCollectivesData, isLoading: statsCollectivesLoading } = useQuery({
        queryKey: ['joinCollective', statsTargetUserId],
        queryFn: () => getJoinCollective(statsTargetUserId),
        enabled: !!statsTargetUserId,
    });

    // Fetch all joined collectives to check for admin status
    const { data: allCollectivesData } = useQuery({
        queryKey: ['allCollectives', statsTargetUserId],
        queryFn: () => getJoinCollective(statsTargetUserId),
        enabled: !!statsTargetUserId,
    });

    // Filter collectives to only show those where user is admin
    const adminCollectives = useMemo(() => {
        return allCollectivesData?.data?.filter((item: any) => item.role === 'admin') || [];
    }, [allCollectivesData]);

    // Fetch admin collectives for founder bottom sheet (only when sheet is open)
    const { data: adminCollectivesData, isLoading: adminCollectivesLoading } = useQuery({
        queryKey: ['adminCollectives', statsTargetUserId],
        queryFn: () => getJoinCollective(statsTargetUserId),
        enabled: !!statsTargetUserId && showFounderSheet,
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

    const { data: statsFollowersData, isLoading: statsFollowersLoading } = useQuery({
        queryKey: ['followers', statsTargetUserId],
        queryFn: () => getUserFollowers(statsTargetUserId),
        enabled: !!statsTargetUserId,
    });

    const { data: statsFollowingData, isLoading: statsFollowingLoading } = useQuery({
        queryKey: ['following', statsTargetUserId],
        queryFn: () => getUserFollowing(statsTargetUserId),
        enabled: !!statsTargetUserId,
    });

    // Follow/Unfollow mutations for users in bottom sheet
    const followUserMutation = useMutation({
        mutationFn: followUserById,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followers', statsTargetUserId] });
            queryClient.invalidateQueries({ queryKey: ['following', statsTargetUserId] });
            queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
            // showToast('Followed');
        },
        onError: (error: any) => {
            console.error('Error following user:', error);
            showToast('Error following user');
        },
    });

    const unfollowUserMutation = useMutation({
        mutationFn: unfollowUserById,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followers', statsTargetUserId] });
            queryClient.invalidateQueries({ queryKey: ['following', statsTargetUserId] });
            queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
            // showToast('Unfollowed');
        },
        onError: (error: any) => {
            console.error('Error unfollowing user:', error);
            showToast('Error unfollowing user');
        },
    });

    const handleFollowToggle = (targetUserId: string, isCurrentlyFollowing: boolean) => {
        if (isCurrentlyFollowing) {
            unfollowUserMutation.mutate(targetUserId);
        } else {
            followUserMutation.mutate(targetUserId);
        }
    };

    const handleStatPress = (tab: 'causes' | 'following' | 'followers' | 'crwds') => {
        setActiveStatsTab(tab);
        setShowStatsSheet(true);
        bottomSheetRef.current?.present();
    };

    // Initialize following state from API data
    useEffect(() => {
        if (userProfile) {
            setIsFollowing(userProfile.is_following || false);
        }
    }, [userProfile]);

    // Transform statistics data
    const statsCauses = statsCausesData?.results?.map((item: any) => {
        const cause = item.cause || item;
        const imageUrl = cause.image || cause.avatar || cause.logo || cause.profile_picture || '';
        console.log(`Mapping user profile cause ${cause.name}: image=${imageUrl}`);
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
        console.log(`Mapping user profile collective ${collective.name}: image=${imageUrl}`);
        return {
            name: collective.name || 'Unknown Collective',
            avatar: imageUrl,
            id: collective.id,
            member_count: collective.member_count || 0,
            color: collective.color || undefined,
        };
    }) || [];

    // Transform posts data to match PostDetail interface
    const userPosts = posts?.results?.map((post: any) => ({
        id: post.id,
        userId: post.user?.id,
        avatarUrl: post.user?.profile_picture,
        username: post.user?.full_name || 'Unknown User',
        time: post.created_at || new Date().toISOString(), // Pass raw timestamp for proper relative time calculation
        created_at: post.created_at, // Also include created_at for ProfileActivityCard to use
        timestamp: post.created_at, // Include timestamp as well
        org: post.collective?.name,
        orgUrl: post.collective?.id,
        text: post.content || '',
        imageUrl: post.media || undefined,
        media_type: post.media_type || undefined,
        previewDetails: post.preview_details || null,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: 0, // API doesn't provide shares count
        isLiked: post.is_liked || false,
        color: post.user?.color,
        mentions: post.mentions || [],
    })) || [];

    // Redirect to own profile if viewing own profile
    useEffect(() => {
        if (isOwnProfile) {
            (navigation as any).navigate('DrawerNav', { screen: 'MainTabs', params: { screen: 'Profile' } });
        }
    }, [isOwnProfile, navigation]);

    // Handle click outside menu
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (menuRef.current && (menuRef.current as any).contains && (menuRef.current as any).contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            // In React Native, we use TouchableWithoutFeedback instead
            // This is handled in the JSX
        }

        return () => {
            // Cleanup if needed
        };
    }, [showMenu]);

    useEffect(() => {
        if (showImageModal) {
            setModalImageFailed(false);
        }
    }, [showImageModal]);

    // Bottom sheet ref and snap points
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const shareSheetRef = useRef<BottomSheetModal>(null);
    const founderSheetRef = useRef<BottomSheetModal>(null);
    const screenHeight = Dimensions.get('window').height;
    const snapPoints = useMemo(() => [screenHeight * 0.75], [screenHeight]);
    const founderSnapPoints = useMemo(() => [screenHeight * 0.75], [screenHeight]);

    // Get tab title and subtitle
    const getTabInfo = () => {
        switch (activeStatsTab) {
            case 'causes':
                return { title: 'Nonprofits', subtitle: `All nonprofits that ${fullName} support` };
            case 'crwds':
                return { title: 'Giving Groups', subtitle: `Giving Groups ${fullName} is part of` };
            case 'followers':
                return { title: 'Followers', subtitle: `People following ${fullName}` };
            case 'following':
                return { title: 'Following', subtitle: `People ${fullName} is following` };
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

    // Show loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load profile</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => {
                        queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
                    }}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Don't render if no user profile data
    if (!userProfile) {
        return null;
    }

    // Get user full name
    const fullName = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : '';

    // Render statistics content
    const renderStatsContent = () => {
        if (activeStatsTab === 'causes') {
            if (statsCausesLoading) {
                return (
                    <View style={styles.statsLoadingContainer}>
                        <ActivityIndicator size="large" color={PrimaryBlue} />
                        <Text style={styles.statsLoadingText}>Loading causes...</Text>
                    </View>
                );
            }
            return (
                <View>
                    {statsCauses.length > 0 ? statsCauses.map((cause: any, index: number) => {
                        const colorIndex = (cause.name?.charCodeAt(0) || 0) % avatarColors.length;
                        const causeBgColor = avatarColors[colorIndex];

                        return (
                            <TouchableOpacity
                                key={cause.id || index}
                                style={styles.statsItem}
                                onPress={() => {
                                    bottomSheetRef.current?.dismiss();
                                    (navigation as any).navigate('CauseScreen', { id: cause.id });
                                }}
                            >
                                <Avatar size={48} style={{ borderRadius: 10 }}>
                                    <AvatarImage src={cause.avatar} />
                                    <AvatarFallback style={{ backgroundColor: cause.avatar ? 'transparent' : causeBgColor }} textStyle={{ color: '#FFFFFF', fontFamily: 'Outfit-Bold', fontSize: 20 }}>
                                        {cause.name?.charAt(0)?.toUpperCase() || 'N'}
                                    </AvatarFallback>
                                </Avatar>
                                <View style={styles.statsItemContent}>
                                    <Text style={styles.statsItemName}>{cause.name || 'Unknown Cause'}</Text>
                                    <Text style={styles.statsItemDescription}>
                                        {truncateAtFirstPeriod(cause.description || 'Supporting this cause')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={styles.statsEmptyContainer}>
                            <Text style={styles.statsEmptyText}>No nonprofits found</Text>
                        </View>
                    )}
                </View>
            );
        }

        if (activeStatsTab === 'crwds') {
            if (statsCollectivesLoading) {
                return (
                    <View style={styles.statsLoadingContainer}>
                        <ActivityIndicator size="large" color={PrimaryBlue} />
                        <Text style={styles.statsLoadingText}>Loading Giving Groups...</Text>
                    </View>
                );
            }
            return (
                <View>
                    {statsCrwds.length > 0 ? statsCrwds.map((crwd: any, index: number) => {
                        const hasImage = crwd.avatar &&
                            (crwd.avatar.startsWith('http') || crwd.avatar.startsWith('/') || crwd.avatar.startsWith('data:'));
                        const iconColor = crwd.color || (!hasImage ? '#10B981' : undefined);
                        const iconLetter = crwd.name?.charAt(0)?.toUpperCase() || 'N';

                        return (
                            <TouchableOpacity
                                key={crwd.id || index}
                                style={styles.statsItem}
                                onPress={() => {
                                    bottomSheetRef.current?.dismiss();
                                    (navigation as any).navigate('GroupCRWD', { id: crwd.id });
                                }}
                            >
                                <Avatar size={48} style={{ borderRadius: 10 }}>
                                    {hasImage ? (
                                        <AvatarImage src={crwd.avatar} />
                                    ) : null}
                                    <AvatarFallback
                                        style={{ backgroundColor: hasImage ? 'transparent' : (iconColor || '#10B981') }}
                                        textStyle={{ color: '#FFFFFF', fontFamily: 'Outfit-Bold', fontSize: 20 }}>
                                        {iconLetter}
                                    </AvatarFallback>
                                </Avatar>
                                <View style={styles.statsItemContent}>
                                    <Text style={styles.statsItemName}>{crwd.name || 'Unknown Collective'}</Text>
                                    <Text style={styles.statsItemDescription} numberOfLines={1}>
                                        {crwd.member_count} members
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={styles.statsEmptyContainer}>
                            <Text style={styles.statsEmptyText}>No Giving Groups found</Text>
                        </View>
                    )}
                </View>
            );
        }

        const renderMembersList = (members: any[], title: string) => {
            const isLoading = title === 'Following' ? statsFollowingLoading : statsFollowersLoading;
            const isFollowingTab = title === 'Following';

            if (isLoading) {
                return (
                    <View style={styles.statsLoadingContainer}>
                        <ActivityIndicator size="large" color={PrimaryBlue} />
                        <Text style={styles.statsLoadingText}>Loading {title.toLowerCase()}...</Text>
                    </View>
                );
            }

            return (
                <View>
                    {members.length > 0 ? (
                        members.map((item: any, index: number) => {
                            const userData = isFollowingTab
                                ? (item.followee || item.following || item.user || item)
                                : (item.follower || item.user || item);
                            const isCurrentlyFollowing = isFollowingTab ? true : (item.is_following ?? userData.is_following ?? false);

                            return (
                                <TouchableOpacity
                                    key={userData.id || index}
                                    style={styles.memberItem}
                                    onPress={() => {
                                        bottomSheetRef.current?.dismiss();
                                        if (userData.id === currentUser?.id) {
                                            (navigation as any).navigate('DrawerNav', { screen: 'MainTabs', params: { screen: 'Profile' } });
                                        } else {
                                            (navigation as any).navigate('UserProfile', { userId: userData.id });
                                        }
                                    }}
                                >
                                    <View style={styles.memberInfo}>
                                        <Avatar size={48}>
                                            <AvatarImage src={userData.profile_picture || userData.avatar} />
                                            <AvatarFallback
                                                // style={{ backgroundColor: (userData.profile_picture || userData.avatar) ? 'transparent' : (userData.color || getConsistentColor(userData.id || userData.username || 'U', avatarColors)) }}
                                                style={{ backgroundColor: userData.color || getConsistentColor(userData.id || userData.username || 'U', avatarColors) }}
                                                textStyle={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Outfit-SemiBold' }}
                                            >
                                                {getInitials(userData.first_name, userData.last_name, userData.username || userData.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <View style={styles.memberDetails}>
                                            <Text style={styles.memberName}>
                                                {userData.first_name && userData.last_name
                                                    ? `${userData.first_name} ${userData.last_name}`
                                                    : userData.first_name || userData.name || 'Unknown User'}
                                            </Text>
                                            <Text style={styles.memberUsername} numberOfLines={1}>{userData.bio || userData.location}</Text>
                                        </View>
                                    </View>
                                    {userData.id !== currentUser?.id && (
                                        <TouchableOpacity
                                            style={[styles.followButton, isCurrentlyFollowing && styles.followingButton]}
                                            onPress={() => handleFollowToggle(userData.id.toString(), isCurrentlyFollowing)}
                                            disabled={followUserMutation.isPending || unfollowUserMutation.isPending}
                                        >
                                            <Text style={[styles.followButtonText, isCurrentlyFollowing && styles.followingButtonText]}>
                                                {isCurrentlyFollowing ? 'Following' : 'Follow'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={styles.statsEmptyContainer}>
                            <Text style={styles.statsEmptyText}>No {title.toLowerCase()} found</Text>
                        </View>
                    )}
                </View>
            );
        };

        if (activeStatsTab === 'following') {
            return renderMembersList(statsFollowingData?.following || [], 'Following');
        }

        if (activeStatsTab === 'followers') {
            return renderMembersList(statsFollowersData?.followers || [], 'Followers');
        }

        return null;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Custom Header with back arrow, name, and menu dots */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={20} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {fullName || userProfile?.username || 'Profile'}
                    </Text>
                </View>
                <View style={{ position: 'relative' }} ref={menuRef}>
                    <TouchableOpacity
                        onPress={() => setShowMenu(!showMenu)}
                        style={styles.menuButton}
                        activeOpacity={0.7}
                    >
                        <Ellipsis size={24} color="#374151" />
                    </TouchableOpacity>

                    {showMenu && (
                        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                            <View style={styles.menuDropdown}>
                                <TouchableOpacity
                                    onPress={handleShareProfile}
                                    style={styles.menuItem}
                                    activeOpacity={0.7}
                                >
                                    <Share2 size={16} color="#374151" />
                                    <Text style={styles.menuItemText}>Share Profile</Text>
                                </TouchableOpacity>
                                {/* <TouchableOpacity
                                    onPress={() => {
                                        setShowMenu(false);
                                        Alert.alert('Report Profile', 'Report functionality would go here');
                                    }}
                                    style={styles.menuItem}
                                    activeOpacity={0.7}
                                >
                                    <Flag size={16} color="#ef4444" />
                                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Report Profile</Text>
                                </TouchableOpacity> */}
                            </View>
                        </TouchableWithoutFeedback>
                    )}
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={'#9CA3AF'}
                        colors={['#9CA3AF']}
                    />
                }
            >
                <View style={styles.content}>
                    <CompactProfileHeader
                        profileData={userProfile}
                        followersCount={statsFollowersData?.count || userProfile?.followers_count || 0}
                        followingCount={statsFollowingData?.count || userProfile?.following_count || 0}
                        onAvatarPress={() => setShowImageModal(true)}
                        onFollowersPress={() => handleStatPress('followers')}
                        onFollowingPress={() => handleStatPress('following')}
                        getConsistentColor={getConsistentColor}
                        avatarColors={avatarColors}
                        getInitials={getInitials}
                    />

                    {/* Profile Bio */}
                    <View style={userProfile.bio ? { marginBottom: 10 } : {}}>
                        <ProfileBio bio={userProfile.bio} />
                    </View>

                    {/* People Inspired */}
                    {/* {userProfile.inspired_people_count > 0 && (
                        <Text style={{
                            fontSize: 13,
                            fontFamily: 'Outfit-Bold',
                            color: '#111827',
                            textAlign: 'center',

                            marginBottom: 12
                    {/* Action Buttons */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <TouchableOpacity
                            onPress={handleFollowClick}
                            style={[
                                styles.followButtonMain,
                                { flex: 1 },
                                isFollowing && styles.followButtonMainOutline
                            ]}
                            disabled={followMutation.isPending || unfollowMutation.isPending}
                            activeOpacity={0.7}
                        >
                            {followMutation.isPending || unfollowMutation.isPending ? (
                                <ActivityIndicator size="small" color={isFollowing ? PrimaryBlue : '#FFFFFF'} />
                            ) : (
                                <Text style={[
                                    styles.followButtonTextMain,
                                    isFollowing && styles.followButtonTextMainOutline
                                ]}>
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                if (!currentUser?.id) {
                                    (navigation as any).navigate('Login');
                                } else {
                                    (navigation as any).navigate('Messages', { userId: targetUserId });
                                }
                            }}
                            style={[
                                styles.followButtonMain,
                                styles.followButtonMainOutline,
                                { flex: 1, flexDirection: 'row', gap: 6 }
                            ]}
                            activeOpacity={0.7}
                        >
                            <MessageCircle size={18} color="#374151" />
                            <Text style={[styles.followButtonTextMain, styles.followButtonTextMainOutline]}>
                                Message
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ProfileDonationBox
                        causes={statsCausesData?.results?.map((item: any) => item.cause || item) || []}
                        totalCount={userProfile?.supported_causes_count || 0}
                        onSectionPress={() => handleStatPress('causes')}
                        onCausePress={(id) => (navigation as any).navigate('CauseScreen', { id })}
                        getConsistentColor={getConsistentColor}
                        avatarColors={avatarColors}
                    />

                    <ProfileGroups
                        collectives={statsCollectivesData?.data || []}
                        totalCount={statsCollectivesData?.data?.length || 0}
                        onSectionPress={() => handleStatPress('crwds')}
                        onCollectivePress={(id) => (navigation as any).navigate('GroupCRWD', { id: id.toString() })}
                        getConsistentColor={getConsistentColor}
                        avatarColors={avatarColors}
                    />

                    {/* Posts Section */}
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 20, paddingBottom: 40 }}>
                        {postsLoading ? (
                            <View style={{ paddingVertical: 10 }}>
                                <PostSkeleton />
                                <PostSkeleton />
                                <PostSkeleton />
                            </View>
                        ) : userPosts.length > 0 ? (
                            <>
                                <View style={{ marginBottom: 0 }}>
                                    <Text style={{ fontSize: 13, fontFamily: 'Outfit-Bold', color: '#6b7280', textTransform: 'uppercase' }}>
                                        Posts
                                    </Text>
                                </View>
                                <PopularPosts
                                    posts={userPosts}
                                    title=""
                                    onLoadMore={fetchNextPage}
                                    hasMore={false}
                                    isLoadingMore={isFetchingNextPage}
                                    onCommentPress={(post) => {
                                        const originalPost = posts?.results?.find((p: any) => p.id?.toString() === post.id);
                                        setSelectedPost({
                                            id: parseInt(post.id),
                                            username: post.username,
                                            text: post.text,
                                            avatarUrl: post.avatarUrl,
                                            firstName: originalPost?.user?.first_name || post.username?.split(' ')[0],
                                            lastName: originalPost?.user?.last_name || post.username?.split(' ').slice(1).join(' ') || '',
                                        });
                                        setShowCommentsSheet(true);
                                    }}
                                />
                                {hasNextPage && (
                                    <View style={{ marginTop: 0, alignItems: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => fetchNextPage()}
                                            disabled={isFetchingNextPage}
                                            style={{
                                                paddingVertical: 12,
                                                paddingHorizontal: 20,
                                                borderWidth: 1,
                                                borderColor: '#d1d5db',
                                                borderRadius: 10,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                backgroundColor: '#f9fafb',
                                                // width: '100%',
                                                // marginTop: 10,
                                                // marginBottom: 30
                                            }}
                                        >
                                            {isFetchingNextPage ? (
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
                                    Updates will appear here as they share and interact in their Giving Groups.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Profile Stats */}
                    {/* <ProfileStats
                        profileId={userProfile.id?.toString() || ''}
                        causes={userProfile.supported_causes_count || 0}
                        crwds={userProfile.joined_collectives_count || 0}
                        followers={userProfile.followers_count || 0}
                        following={userProfile.following_count || 0}
                        isLoadingCauses={isLoading}
                        isLoadingCrwds={isLoading}
                        isLoadingFollowers={isLoading}
                        isLoadingFollowing={isLoading}
                        onStatPress={handleStatPress}
                    /> */}
                </View>
            </ScrollView>

            <Modal
                visible={showImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowImageModal(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View>
                                <TouchableOpacity onPress={() => setShowImageModal(false)}>
                                    <Image
                                        source={{ uri: userProfile?.profile_picture || 'https://randomuser.me/api/portraits/women/44.jpg' }}
                                        style={{ width: 300, height: 300, borderRadius: 150, resizeMode: 'cover' }}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Statistics Bottom Sheet */}
            <BottomSheetModal
                ref={bottomSheetRef}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: 'white' }}
                enableDynamicSizing={false}
                onDismiss={() => setShowStatsSheet(false)}
            >
                <View style={styles.titleSection}>
                    <Text style={styles.bottomSheetTitle}>{getTabInfo().title}</Text>
                    <Text style={styles.bottomSheetSubtitle}>{getTabInfo().subtitle}</Text>
                </View>

                {/* Tabs */}
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
                    <View style={[styles.bottomSheetHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 10 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#111827' }}>
                                Collectives founded by {userProfile.first_name && userProfile.last_name
                                    ? `${userProfile.first_name} ${userProfile.last_name}`
                                    : userProfile.username || 'User'}
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
                        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
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

                                    // Priority: 1. Use color from API, 2. Fallback to generated color
                                    const hasColor = collective.color;
                                    const hasLogo = collective.logo && (collective.logo.startsWith("http") || collective.logo.startsWith("/") || collective.logo.startsWith("data:"));
                                    const avatarBgColor = hasColor || (!hasLogo ? getConsistentColor(collective.id || collective.name || 'U', avatarColors) : undefined);
                                    const collectiveName = collective.name || 'Unknown Collective';
                                    const initials = collectiveName.charAt(0).toUpperCase();
                                    const imageUrl = hasLogo ? collective.logo : (collective.image || collective.avatar || undefined);

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
                                            <Avatar size={48} style={{ borderRadius: 10 }}>
                                                <AvatarImage src={imageUrl} />
                                                <AvatarFallback
                                                    style={avatarBgColor ? { backgroundColor: imageUrl ? 'transparent' : avatarBgColor } : {}}
                                                    textStyle={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Outfit-Bold' }}
                                                >
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#111827', marginBottom: 2 }}>
                                                    {collectiveName}
                                                </Text>
                                                <Text style={{ fontSize: 11, color: '#6B7280', lineHeight: 16 }}>
                                                    {collective.description || 'No description available'}
                                                </Text>
                                            </View>
                                            <ChevronRight size={18} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={{ padding: 32, alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                    No collectives found
                                </Text>
                            </View>
                        )}
                    </BottomSheetScrollView>

                    {/* Fixed Footer */}
                    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' }}>
                        {/* Motivational Message */}
                        {adminCollectivesForSheet.length > 0 && (
                            <View style={{ marginBottom: 12, alignItems: 'center' }}>
                                <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
                                    Keep building your impact! Create another Collective to bring even more people together.
                                </Text>
                            </View>
                        )}

                        {/* Create Your Own Collective Button */}
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
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Outfit-SemiBold' }}>
                                Create Your Own Collective
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
            {/* Share Sheet */}
            <SharePost
                ref={shareSheetRef}
                url={`${WEB_BASE_URL}/u/${userProfile?.username}`}
                title={''}
                message={''}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: PrimaryGrey,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Outfit-SemiBold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
    },
    menuButton: {
        padding: 8,
    },
    menuDropdown: {
        position: 'absolute',
        right: 0,
        top: 40,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 144,
        zIndex: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemText: {
        fontSize: 14,
        color: '#374151',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    profileHeader: {
        alignItems: 'center',
        paddingBottom: 8,
    },
    profileName: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    profileMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#000',
    },
    followButtonMain: {
        backgroundColor: PrimaryBlue,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        // alignSelf: 'center',
        // marginTop: 16,
        minWidth: 120,
    },
    followButtonMainOutline: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    followButtonTextMain: {
        fontSize: 14,
        fontFamily: 'Outfit-SemiBold',
        color: '#FFFFFF',
    },
    followButtonTextMainOutline: {
        color: '#374151',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    supportsSection: {
        marginTop: 16,
    },
    supportsTitle: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
        marginBottom: 16,
    },
    supportsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    supportsCard: {
        width: '48%',
        marginHorizontal: '1%',
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        height: 100,
        justifyContent: 'space-between',
    },
    supportsIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    supportsIconText: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        color: '#FFFFFF',
    },
    supportsName: {
        fontSize: 12,
        fontFamily: 'Outfit-SemiBold',
        color: '#111827',
        textAlign: 'center',
        height: 32,
    },
    supportsMore: {
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    supportsMoreText: {
        fontSize: 14,
        color: '#6B7280',
    },
    supportsMoreLink: {
        fontSize: 14,
        color: PrimaryBlue,
        fontFamily: 'Outfit-Medium',
    },
    activitySection: {
        paddingTop: 16,
    },
    bottomSheetContent: {
        flex: 1,
        paddingHorizontal: 16,
    },
    dragHandle: {
        width: 48,
        height: 6,
        backgroundColor: '#D1D5DB',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    bottomSheetHeader: {
        marginBottom: 16,
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
    bottomSheetScrollView: {
        flex: 1,
    },
    statsLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    statsLoadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#6B7280',
    },
    statsEmptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    statsEmptyText: {
        fontSize: 14,
        color: '#6B7280',
    },
    statsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    statsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    statsItemContent: {
        flex: 1,
        minWidth: 0,
    },
    statsItemName: {
        fontSize: 15,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
        marginBottom: 4,
    },
    statsItemDescription: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Outfit-Regular',
    },
    causeIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    causeIconText: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        color: '#FFFFFF',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'Outfit-SemiBold',
    },
    viewButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewButtonText: {
        fontSize: 12,
        fontFamily: 'Outfit-SemiBold',
        color: '#FFFFFF',
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
});
