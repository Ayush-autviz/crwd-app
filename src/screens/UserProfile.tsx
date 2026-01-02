import { View, Text, ScrollView, TouchableOpacity, Share, Alert, StyleSheet, ActivityIndicator, Clipboard, TouchableWithoutFeedback, Dimensions } from 'react-native'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useRoute, useNavigation } from '@react-navigation/native'
import { ArrowLeft, Ellipsis, Share2, Flag } from 'lucide-react-native'
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

// Helper function to get consistent color based on ID or name
const getConsistentColor = (id: string | number | undefined, fallbackName?: string): string => {
  const avatarColors = [
    '#10b981', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];
  
  if (id !== undefined && id !== null) {
    const idStr = String(id);
    const hash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  }
  
  if (fallbackName) {
    const hash = fallbackName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  }
  
  return avatarColors[0]; // Default to first color
};

// Helper function to get initials from name
const getInitials = (firstName?: string, lastName?: string, username?: string): string => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (username) {
    return username.charAt(0).toUpperCase();
  }
  return 'U';
};

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
    const menuRef = useRef<View>(null);
    const { showToast } = useToast();
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();

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
        getNextPageParam: (lastPage) => {
            // Extract page number from next URL if available
            if (lastPage.next) {
                try {
                    const url = new URL(lastPage.next);
                    const page = url.searchParams.get('page');
                    return page ? parseInt(page) : undefined;
                } catch (e) {
                    return undefined;
                }
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!targetUserId,
    });

    // Flatten pages into a single array
    const posts = postsData ? {
        results: postsData.pages.flatMap(page => page.results || []),
        next: postsData.pages[postsData.pages.length - 1]?.next || null,
        count: postsData.pages[0]?.count || 0,
    } : undefined;

    // Follow user mutation
    const followMutation = useMutation({
        mutationFn: () => followUserById(targetUserId || ''),
        onSuccess: () => {
            setIsFollowing(true);
            showToast("Followed successfully!");
            queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
        },
        onError: (error) => {
            console.error('Error following user:', error);
            showToast("Failed to follow user");
        },
    });

    // Unfollow user mutation
    const unfollowMutation = useMutation({
        mutationFn: () => unfollowUserById(targetUserId || ''),
        onSuccess: () => {
            setIsFollowing(false);
            showToast("Unfollowed successfully!");
            queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
        },
        onError: (error) => {
            console.error('Error unfollowing user:', error);
            showToast("Failed to unfollow user");
        },
    });

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
        try {
            if (!targetUserId) return;
            
            const profileUrl = `${WEB_BASE_URL}/user-profile/${targetUserId}`;
            const result = await Share.share({
                message: `Check out ${userProfile?.first_name} ${userProfile?.last_name}'s profile!\n${profileUrl}`,
                title: `${userProfile?.first_name} ${userProfile?.last_name}'s Profile`,
                url: profileUrl, // iOS only
            });
            
            if (result.action === Share.sharedAction) {
                try {
                    await Clipboard.setString(profileUrl);
                    showToast('Link copied to clipboard!');
                } catch (clipboardError) {
                    console.log('Error copying to clipboard:', clipboardError);
                }
            }
            setShowMenu(false);
        } catch (err) {
            console.error("Failed to share profile:", err);
            showToast("Failed to share profile");
        }
    };

    // Statistics bottom sheet queries
    const statsTargetUserId = userProfile?.id?.toString() || targetUserId || '';

    const { data: statsCausesData, isLoading: statsCausesLoading } = useQuery({
        queryKey: ['supportedCauses', statsTargetUserId],
        queryFn: () => getSupportedCausesByUserId(statsTargetUserId),
        enabled: !!statsTargetUserId && showStatsSheet && activeStatsTab === 'causes',
    });

    const { data: statsCollectivesData, isLoading: statsCollectivesLoading } = useQuery({
        queryKey: ['joinCollective', statsTargetUserId],
        queryFn: () => getJoinCollective(statsTargetUserId),
        enabled: !!statsTargetUserId && showStatsSheet && activeStatsTab === 'crwds',
    });

    const { data: statsFollowersData, isLoading: statsFollowersLoading } = useQuery({
        queryKey: ['followers', statsTargetUserId],
        queryFn: () => getUserFollowers(statsTargetUserId),
        enabled: !!statsTargetUserId && showStatsSheet && activeStatsTab === 'followers',
    });

    const { data: statsFollowingData, isLoading: statsFollowingLoading } = useQuery({
        queryKey: ['following', statsTargetUserId],
        queryFn: () => getUserFollowing(statsTargetUserId),
        enabled: !!statsTargetUserId && showStatsSheet && activeStatsTab === 'following',
    });

    // Follow/Unfollow mutations for users in bottom sheet
    const followUserMutation = useMutation({
        mutationFn: followUserById,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followers', statsTargetUserId] });
            queryClient.invalidateQueries({ queryKey: ['following', statsTargetUserId] });
            queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
            showToast('Followed');
        },
        onError: (error) => {
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
            showToast('Unfollowed');
        },
        onError: (error) => {
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
    };

    // Initialize following state from API data
    useEffect(() => {
        if (userProfile) {
            setIsFollowing(userProfile.is_following || false);
        }
    }, [userProfile]);

    // Transform posts data to match PostDetail interface
    const userPosts = posts?.results?.map((post: any) => ({
        id: post.id,
        userId: post.user?.id,
        avatarUrl: post.user?.profile_picture || '/placeholder.svg',
        username: post.user?.username || post.user?.full_name || 'Unknown User',
        time: post.created_at || new Date().toISOString(), // Pass raw timestamp for proper relative time calculation
        created_at: post.created_at, // Also include created_at for ProfileActivityCard to use
        timestamp: post.created_at, // Include timestamp as well
        org: post.collective?.name || 'Unknown Collective',
        orgUrl: post.collective?.id,
        text: post.content || '',
        imageUrl: post.media || undefined,
        previewDetails: post.preview_details || null,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: 0, // API doesn't provide shares count
        isLiked: post.is_liked || false,
    })) || [];

    // Redirect to own profile if viewing own profile
    useEffect(() => {
        if (isOwnProfile) {
            (navigation as any).navigate('Profile');
        }
    }, [isOwnProfile, navigation]);

    // Handle click outside menu
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
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

    // Bottom sheet ref and snap points
    const bottomSheetRef = useRef<BottomSheet>(null);
    const screenHeight = Dimensions.get('window').height;
    const snapPoints = useMemo(() => [screenHeight * 0.75], [screenHeight]);

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
                    {statsCausesData?.results?.length > 0 ? (
                        statsCausesData.results.map((item: any, index: number) => {
                            const cause = item.cause || item;
                            const causeColors = [
                                '#f97316', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
                            ];
                            const colorIndex = (cause.name?.charCodeAt(0) || 0) % causeColors.length;
                            const causeBgColor = causeColors[colorIndex];

                            return (
                                <TouchableOpacity
                                    key={cause.id || index}
                                    style={styles.statsItem}
                                    onPress={() => {
                                        bottomSheetRef.current?.close();
                                        (navigation as any).navigate('CauseScreen', { id: cause.id });
                                    }}
                                >
                                    <View style={[styles.causeIcon, { backgroundColor: causeBgColor }]}>
                                        <Text style={styles.causeIconText}>
                                            {cause.name?.charAt(0)?.toUpperCase() || 'N'}
                                        </Text>
                                    </View>
                                    <View style={styles.statsItemContent}>
                                        <Text style={styles.statsItemName}>{cause.name || 'Unknown Cause'}</Text>
                                        <Text style={styles.statsItemDescription} numberOfLines={2}>
                                            {cause.mission || 'Supporting this cause'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={styles.statsEmptyContainer}>
                            <Text style={styles.statsEmptyText}>No causes found</Text>
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
                        <Text style={styles.statsLoadingText}>Loading collectives...</Text>
                    </View>
                );
            }
            return (
                <View>
                    {statsCollectivesData?.data?.length > 0 ? (
                        statsCollectivesData.data.map((item: any, index: number) => {
                            const collective = item.collective || item;
                            // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
                            const hasColor = collective.color;
                            const hasLogo = collective.logo && 
                                (collective.logo.startsWith('http') || collective.logo.startsWith('/') || collective.logo.startsWith('data:'));
                            const iconColor = hasColor || (!hasLogo ? '#10B981' : undefined);
                            const showImage = hasLogo && !hasColor;
                            const iconLetter = collective.name?.charAt(0)?.toUpperCase() || 'N';
                            
                            return (
                                <View key={collective.id || index} style={styles.statsItem}>
                                    <View style={styles.statsItemLeft}>
                                        <Avatar size={40}>
                                            {showImage ? (
                                                <AvatarImage src={collective.logo} />
                                            ) : null}
                                            <AvatarFallback style={{ backgroundColor: iconColor || '#10B981' }} textStyle={{ color: '#FFFFFF', fontWeight: '600' }}>
                                                {iconLetter}
                                            </AvatarFallback>
                                        </Avatar>
                                        <View style={styles.statsItemContent}>
                                            <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                                                <Text style={[styles.badgeText, { color: '#16a34a' }]}>Collective</Text>
                                            </View>
                                            <Text style={styles.statsItemName}>{collective.name || 'Unknown Collective'}</Text>
                                            <Text style={styles.statsItemDescription} numberOfLines={2}>
                                                {collective.description || ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.viewButton}
                                        onPress={() => {
                                            bottomSheetRef.current?.close();
                                            (navigation as any).navigate('GroupCRWD', { id: collective.id });
                                        }}
                                    >
                                        <Text style={styles.viewButtonText}>View Details</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.statsEmptyContainer}>
                            <Text style={styles.statsEmptyText}>No collectives found</Text>
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
                                <View key={userData.id || index} style={styles.memberItem}>
                                    <View style={styles.memberInfo}>
                                        <Avatar size={40}>
                                            <AvatarImage src={userData.profile_picture || userData.avatar} />
                                            <AvatarFallback
                                                style={{ backgroundColor: userData.color || getConsistentColor(userData.id, userData.username || userData.first_name || userData.name) }}
                                                textStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}
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
                                            <Text style={styles.memberUsername}>@{userData.username || 'unknown'}</Text>
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
                                </View>
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
                        <Ellipsis size={24} color="#374151" strokeWidth={3} />
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
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowMenu(false);
                                        Alert.alert('Report Profile', 'Report functionality would go here');
                                    }}
                                    style={styles.menuItem}
                                    activeOpacity={0.7}
                                >
                                    <Flag size={16} color="#ef4444" />
                                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Report Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    )}
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <Avatar size={80}>
                            <AvatarImage src={userProfile.profile_picture} />
                            <AvatarFallback
                                style={{ backgroundColor: userProfile.color || getConsistentColor(userProfile.id, userProfile.username || userProfile.first_name) }}
                                textStyle={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700' }}
                            >
                                {getInitials(userProfile.first_name, userProfile.last_name, userProfile.username)}
                            </AvatarFallback>
                        </Avatar>
                        <Text style={styles.profileName}>
                            {userProfile.first_name && userProfile.last_name
                                ? `${userProfile.first_name} ${userProfile.last_name}`
                                : userProfile.username || 'User'}
                        </Text>
                        <View style={styles.profileMeta}>
                            {userProfile.location && (
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaText}>{userProfile.location}</Text>
                                </View>
                            )}
                            {userProfile.username && (
                                <Text style={[styles.metaText, { color: PrimaryBlue }]}>
                                    @{userProfile.username}
                                </Text>
                            )}
                            <Text style={styles.metaText}>
                                Active since {userProfile.date_joined ? new Date(userProfile.date_joined).getFullYear() : '2023'}
                            </Text>
                        </View>
                    </View>

                    {/* Follow Button */}
                    <TouchableOpacity
                        onPress={handleFollowClick}
                        style={[
                            styles.followButtonMain,
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

                    {/* Profile Stats */}
                    <ProfileStats
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
                    />

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Supports Section */}
                    {userProfile.recently_supported_causes && userProfile.recently_supported_causes.length > 0 && (
                        <>
                            <View style={styles.supportsSection}>
                                <Text style={styles.supportsTitle}>Supports</Text>
                                
                                {/* Grid Layout - 2 cols mobile, 3 cols tablet, 4 cols desktop */}
                                <View style={styles.supportsGrid}>
                                    {userProfile.recently_supported_causes.slice(0, 6).map((cause: any, i: number) => {
                                        const colors = [
                                            '#f97316', // orange
                                            '#ec4899', // pink
                                            '#3b82f6', // blue
                                            '#ef4444', // red
                                            '#10b981', // green
                                            '#f97316', // orange (repeat)
                                        ];
                                        const bgColor = colors[i % colors.length];

                                        return (
                                            <TouchableOpacity
                                                key={cause.id || i}
                                                style={styles.supportsCard}
                                                onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
                                                activeOpacity={0.7}
                                            >
                                                {cause.logo ? (
                                                    <Avatar size={48}>
                                                        <AvatarImage src={cause.logo} />
                                                        <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
                                                            {cause.name?.charAt(0)?.toUpperCase() || 'N'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <View style={[styles.supportsIcon, { backgroundColor: bgColor }]}>
                                                        <Text style={styles.supportsIconText}>
                                                            {cause.name?.charAt(0)?.toUpperCase() || 'N'}
                                                        </Text>
                                                    </View>
                                                )}
                                                <Text style={styles.supportsName} numberOfLines={2}>
                                                    {cause.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Show more causes text and link */}
                                {userProfile.recently_supported_causes.length > 6 && (
                                    <View style={styles.supportsMore}>
                                        <Text style={styles.supportsMoreText}>
                                            + {userProfile.recently_supported_causes.length - 6} more causes
                                        </Text>
                                        <TouchableOpacity onPress={() => (navigation as any).navigate('Interests')}>
                                            <Text style={styles.supportsMoreLink}>
                                                See all {userProfile.recently_supported_causes.length} →
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Divider */}
                            <View style={styles.divider} />
                        </>
                    )}

                    {/* Profile Bio */}
                    <View style={userProfile.bio ? { marginTop: 20 } : {}}>
                    <ProfileBio bio={userProfile.bio} />
                    </View>

                    {/* Recent Activity */}
                    <View style={styles.activitySection}>
                        <PopularPosts
                            posts={userPosts}
                            showTitle={true}
                            title="Recent Activity"
                            onLoadMore={() => fetchNextPage()}
                            hasMore={hasNextPage || false}
                            isLoadingMore={isFetchingNextPage}
                            isLoading={postsLoading}
                            error={null}
                            onCommentPress={(post) => {
                                // Find the original post data to get firstName and lastName
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
                    </View>
                </View>
            </ScrollView>

            {/* Statistics Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={showStatsSheet ? 0 : -1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                onChange={(index) => setShowStatsSheet(index >= 0)}
            >
                <BottomSheetView style={styles.bottomSheetContent}>
                    {/* Drag Handle */}
                    {/* <View style={styles.dragHandle} /> */}

                    {/* Header */}
                    <View style={styles.bottomSheetHeader}>
                        <Text style={styles.bottomSheetTitle}>
                            {activeStatsTab === 'causes' && 'Causes'}
                            {activeStatsTab === 'crwds' && 'Collectives'}
                            {activeStatsTab === 'followers' && 'Followers'}
                            {activeStatsTab === 'following' && 'Following'}
                        </Text>
                        <Text style={styles.bottomSheetSubtitle}>
                            {activeStatsTab === 'causes' && 'Causes they support'}
                            {activeStatsTab === 'crwds' && "Collectives they're part of"}
                            {activeStatsTab === 'followers' && 'People following them'}
                            {activeStatsTab === 'following' && 'People they follow'}
                        </Text>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        {[
                            { label: 'Causes', value: 'causes' },
                            { label: 'Collectives', value: 'crwds' },
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

                    {/* Content */}
                    <BottomSheetScrollView style={styles.bottomSheetScrollView} showsVerticalScrollIndicator={false}>
                        {renderStatsContent()}
                    </BottomSheetScrollView>
                </BottomSheetView>
            </BottomSheet>

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
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
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
        fontWeight: '700',
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
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    profileHeader: {
        alignItems: 'center',
        paddingBottom: 16,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
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
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    followButtonMain: {
        backgroundColor: PrimaryBlue,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 16,
        minWidth: 120,
    },
    followButtonMainOutline: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    followButtonTextMain: {
        fontSize: 14,
        fontWeight: '600',
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
        fontWeight: '700',
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
        fontWeight: '700',
        color: '#FFFFFF',
    },
    supportsName: {
        fontSize: 12,
        fontWeight: '600',
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
        fontWeight: '500',
    },
    activitySection: {
        // paddingVertical: 16,
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
    bottomSheetTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    bottomSheetSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    tabsContainer: {
        flexDirection: 'row',
        // paddingHorizontal: 8,
        marginTop: 16,
        marginBottom: 8,
        paddingVertical: 4,
        gap: 2,
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        // marginHorizontal: 2,
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
        fontWeight: '600',
    },
    activeTabText: {
        color: '#111827',
        fontWeight: '700',
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
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    statsItemDescription: {
        fontSize: 12,
        color: '#6B7280',
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
        fontWeight: '700',
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
        fontWeight: '600',
    },
    viewButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: '600',
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
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    memberUsername: {
        fontSize: 12,
        color: '#6B7280',
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
        fontWeight: '600',
        color: '#FFFFFF',
    },
    followingButtonText: {
        color: '#6B7280',
    },
});
