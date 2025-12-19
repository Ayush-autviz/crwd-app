import { View, Text, ScrollView, TouchableOpacity, Share, Alert, Image, Modal, TouchableWithoutFeedback, ActivityIndicator, RefreshControl, Clipboard, StyleSheet, Dimensions } from 'react-native'
import React, { useState, useCallback, useMemo, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import MainHeaderNav from '../components/MainHeaderNav'
import ProfileBio from '../components/ProfileBio'
import ProfileStats from '../components/ProfileStats'
import PopularPosts from '../components/PopularPosts'
import ProfileInterests from '../components/ProfileInterests'
import { PrimaryBlue, PrimaryGrey, LightGrey } from '../Constants/Colors'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { Share2, Flag, ChevronRight, Ellipsis, MessageCircle, MessageSquare, ArrowLeft } from 'lucide-react-native'
import { getPosts, getUserProfileById, getUserFollowers, getUserFollowing, getFavoriteCauses, getSupportedCausesByUserId, followUser, unfollowUser } from '../services/api/social'
import { getUserCollectives, getJoinCollective } from '../services/api/crwd'
import { useAuthStore } from '../store/store'
import { Pencil } from 'lucide-react-native'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'
import { useMutation } from '@tanstack/react-query'
import { logout } from '../services/api/auth'
import { MapPin } from 'lucide-react-native'
import { DoorOpenIcon } from 'lucide-react-native'
import { useToast } from '../contexts/ToastContext'
import { WEB_BASE_URL } from '../Constants/url'
import CommentsBottomSheet from '../components/post/CommentsBottomSheet'

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
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (name) {
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return words[0]?.charAt(0).toUpperCase() || 'U';
  }
  return username?.charAt(0).toUpperCase() || 'U';
};

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
    
    // Bottom sheet ref
    const bottomSheetRef = useRef<BottomSheet>(null);
    const screenHeight = Dimensions.get('window').height;
    const snapPoints = useMemo(() => [screenHeight * 0.75], [screenHeight]);

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
                    onPress: () => {
                        queryClient.clear();
                        logoutStore();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
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

    // Fetch user posts - matching Vite version
    const postsQuery = useQuery({
        queryKey: ['posts', user?.id],
        queryFn: () => getPosts(user?.id?.toString() || '', ''),
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
            showToast('Followed');
        },
        onError: (error) => {
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
            showToast('Unfollowed');
        },
        onError: (error) => {
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
    const userPosts = postsQuery?.data?.results?.map((post: any) => ({
        id: post.id,
        userId: post.user?.id?.toString(),
        avatarUrl: post.user?.profile_picture,
        username: post.user?.username || post.user?.full_name || 'Unknown User',
        time: new Date(post.created_at).toLocaleDateString(),
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

    const handleShare = async () => {
        try {
            if (!user?.id) return;
            
            const webUrl = `${WEB_BASE_URL}/user-profile/${user.id}`;
            const shareMessage = `Check out my profile!\n${webUrl}`;
            
            const result = await Share.share({
                message: shareMessage,
                title: `My Profile`,
                url: webUrl, // iOS only
            });
            
            // Copy link to clipboard when sharing
            if (result.action === Share.sharedAction) {
                try {
                    await Clipboard.setString(webUrl);
                    showToast('Link copied to clipboard!');
                } catch (clipboardError) {
                    console.log('Error copying to clipboard:', clipboardError);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to share profile');
        }
        finally {
            setShowMenu(false);
        }
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
    const statsCauses = statsCausesData?.results?.map((item: any) => {
        const cause = item.cause || item;
        return {
            name: cause.name || 'Unknown Cause',
            avatar: cause.image || cause.avatar || '',
            id: cause.id,
            description: cause.mission || '',
        };
    }) || [];

    const statsCrwds = statsCollectivesData?.data?.map((item: any) => {
        const collective = item.collective || item;
        return {
            name: collective.name || 'Unknown Collective',
            avatar: collective.created_by?.profile_picture || collective.avatar || collective.image || '',
            logo: collective.logo || undefined,
            color: collective.color || undefined,
            role: item.role || 'Member',
            id: collective.id,
            description: collective.description || '',
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
        };
    }) || [];

    // Get tab title and subtitle
    const getTabInfo = () => {
        switch (activeStatsTab) {
            case 'causes':
                return { title: 'Causes', subtitle: 'Causes you support' };
            case 'crwds':
                return { title: 'Collectives', subtitle: "Collectives you're part of" };
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

    // Render statistics content
    const renderStatsContent = () => {
        const tabInfo = getTabInfo();

        if (activeStatsTab === 'causes') {
            if (statsCausesLoading) {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                        <ActivityIndicator size="large" color={PrimaryBlue} />
                        <Text style={{ marginTop: 10, fontSize: 16, color: PrimaryGrey }}>Loading causes...</Text>
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
                                    (navigation as any).navigate('CauseScreen', { causeId: cause.id });
                                }}
                            >
                                <View style={[styles.causeIcon, { backgroundColor: causeBgColor }]}>
                                    <Text style={styles.causeIconText}>
                                        {cause.name?.charAt(0)?.toUpperCase() || 'N'}
                                    </Text>
                                </View>
                                <View style={styles.causeContent}>
                                    <Text style={styles.causeName}>{cause.name}</Text>
                                    <Text style={styles.causeDescription} numberOfLines={2}>
                                        {cause.description || 'Supporting this cause'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={{ fontSize: 16, color: PrimaryGrey }}>No causes found</Text>
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
                        <Text style={{ marginTop: 10, fontSize: 16, color: PrimaryGrey }}>Loading collectives...</Text>
                    </View>
                );
            }
            return (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {statsCrwds.length > 0 ? statsCrwds.map((crwd: any, index: number) => {
                        // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
                        const hasColor = crwd.color;
                        const hasLogo = crwd.logo && 
                            (crwd.logo.startsWith('http') || crwd.logo.startsWith('/') || crwd.logo.startsWith('data:'));
                        const iconColor = hasColor || (!hasLogo ? '#10B981' : undefined);
                        const showImage = hasLogo && !hasColor;
                        const iconLetter = crwd.name.charAt(0).toUpperCase();
                        
                        return (
                        <View key={crwd.id || index} style={styles.statsItem}>
                            <View style={styles.statsItemLeft}>
                                <Avatar size={40}>
                                    {showImage ? (
                                        <AvatarImage src={crwd.logo} />
                                    ) : null}
                                    <AvatarFallback style={{ backgroundColor: iconColor || '#10B981' }} textStyle={{ color: '#FFFFFF', fontWeight: '600' }}>
                                        {iconLetter}
                                    </AvatarFallback>
                                </Avatar>
                                <View style={styles.statsItemInfo}>
                                    <View style={[styles.badge, styles.crwdBadge]}>
                                        <Text style={[styles.badgeText, styles.crwdText]}>Collective</Text>
                                    </View>
                                    <Text style={styles.statsItemName}>{crwd.name}</Text>
                                    <Text style={styles.statsItemDescription} numberOfLines={2}>{crwd.description}</Text>
                                </View>
                            </View>
                            <TouchableOpacity 
                                style={styles.viewButton}
                                onPress={() => {
                                    bottomSheetRef.current?.close();
                                    (navigation as any).navigate('GroupCRWD', { collectiveId: crwd.id });
                                }}
                            >
                                <Text style={styles.viewButtonText}>View Details</Text>
                            </TouchableOpacity>
                        </View>
                        );
                    }) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={{ fontSize: 16, color: PrimaryGrey }}>No collectives found</Text>
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
                        <Text style={{ marginTop: 10, fontSize: 16, color: PrimaryGrey }}>Loading {title.toLowerCase()}...</Text>
                    </View>
                );
            }

            return (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {members.length > 0 ? members.map((member: any, index: number) => {
                        const isFollowing = isFollowingTab ? true : (member.is_following || false);
                        return (
                            <View key={member.id || index} style={styles.memberItem}>
                                <View style={styles.memberInfo}>
                                    <Avatar size={40}>
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback 
                                            style={{ backgroundColor: getConsistentColor(member.id || member.username || member.name || 'U', avatarColors) }}
                                            textStyle={{ color: '#FFFFFF', fontWeight: '600' }}
                                        >
                                            {getInitials(member.first_name, member.last_name, member.name, member.username)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <View style={styles.memberDetails}>
                                        <Text style={styles.memberName}>{member.name}</Text>
                                        <Text style={styles.memberUsername}>@{member.username}</Text>
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
                            </View>
                        );
                    }) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={{ fontSize: 16, color: PrimaryGrey }}>No {title.toLowerCase()} found</Text>
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
                postsQuery.refetch(),
                followersQuery.refetch(),
                followingQuery.refetch(),
                favoriteCausesQuery.refetch(),
                userCollectivesQuery.refetch(),
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
                <MainHeaderNav title={'Me'} show menu={false} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                    <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>
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
                <MainHeaderNav title={'Me'} show menu={false} />
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
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1, paddingBottom: 80 }} edges={['top', 'left', 'right']}>
            <MainHeaderNav title={'Me'} menu={false} />

            {/* Top right buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
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
                                <TouchableWithoutFeedback onPress={() => {}}>
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
                <TouchableOpacity
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
                    <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>Edit</Text>
                </TouchableOpacity>
            </View>

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
                <View style={{ paddingHorizontal: 20 }}>
                    {/* Profile Header */}
                    <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
                        {/* Avatar */}
                        <TouchableOpacity onPress={() => setShowImageModal(true)}>
                            {/* <Image
                                source={{ uri: profileData?.profile_picture || 'https://randomuser.me/api/portraits/women/44.jpg' }}
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    marginBottom: 16
                                }}
                            /> */}
                            <Avatar size={64}>
                                <AvatarImage src={profileData?.profile_picture} />
                                <AvatarFallback 
                                    style={{ backgroundColor: getConsistentColor(profileData?.id || profileData?.username || 'U', avatarColors) }}
                                    textStyle={{ color: '#FFFFFF', fontWeight: '600' }}
                                >
                                    {getInitials(profileData?.first_name, profileData?.last_name, profileData?.username, profileData?.username)}
                                </AvatarFallback>
                            </Avatar> 
                        </TouchableOpacity>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#111827',
                            marginVertical: 16
                        }}>
                            {profileData?.first_name && profileData?.last_name 
                                ? `${profileData.first_name} ${profileData.last_name}` 
                                : profileData?.username || 'User'
                            }
                        </Text>

                        {/* Location and Link */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {profileData?.location && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    {/* <Text style={{ fontSize: 16, color: '#6b7280' }}>📍</Text> */}
                                    <MapPin size={16} color="#6b7280" />
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>{profileData.location}</Text>
                                </View>
                            )}
                            {/* {profileData?.username && (
                                <TouchableOpacity>
                                    <Text style={{ fontSize: 12, color: PrimaryBlue,}}>
                                        {profileData.username}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                Active since {profileData?.date_joined ? new Date(profileData.date_joined).getFullYear() : '2023'}
                            </Text> */}
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                        <TouchableOpacity onPress={handleEditProfile} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', minWidth: 120 }}>
                            <Text style={{ fontSize: 14, color: '#595959', fontWeight: '700', textAlign: 'center' }}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShare} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', minWidth: 120 }}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center'}}>
                                <Share2 size={16} color="#595959" />
                            <Text style={{ fontSize: 14, color: '#595959', fontWeight: '700' }}>Share Profile</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Stats */}
                    <ProfileStats 
                        causes={ profileData?.supported_causes_count || 0}
                        crwds={userCollectivesQuery?.data?.data?.length || profileData?.joined_collectives_count || 0}
                        followers={followersQuery?.data?.count || profileData?.followers_count || 0}
                        following={followingQuery?.data?.count || profileData?.following_count || 0}
                        profileId={profileData?.id?.toString() || ''}
                        isLoadingCauses={favoriteCausesQuery?.isLoading || profileLoading}
                        isLoadingCrwds={userCollectivesQuery?.isLoading || profileLoading}
                        isLoadingFollowers={followersQuery?.isLoading || false}
                        isLoadingFollowing={followingQuery?.isLoading || false}
                        onStatPress={(tab) => {
                            setActiveStatsTab(tab);
                            bottomSheetRef.current?.snapToIndex(0);
                        }}
                    />

                    <View style={{ height: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8, marginTop: 8 }}></View>

                    {/* Recently Supported Section */}
                    {profileData?.recently_supported_causes && profileData.recently_supported_causes.length > 0 && (
                    <View style={{ marginTop: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                                Supports
                            </Text>
                        </View>

                        {/* Grid Layout - 2 rows, 3 columns */}
                        <View style={{ 
                            flexDirection: 'row', 
                            flexWrap: 'wrap', 
                            
                            marginHorizontal: -6,
                        }}>
                            {profileData.recently_supported_causes.slice(0, 6).map((cause: any, i: number) => {
                                // Generate consistent color based on cause ID
                                const bgColor = getConsistentColor(cause.id || cause.name || 'N', avatarColors);
                                
                                return (
                                    <TouchableOpacity 
                                        key={cause.id || i} 
                                        onPress={() => navigation.navigate('CauseScreen' as never)} 
                                        style={{
                                            width: '33.333%',
                                            paddingHorizontal: 6,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <View style={{
                                            backgroundColor: 'white',
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: '#e5e7eb',
                                            padding: 12,
                                            alignItems: 'center',
                                            height: 100,
                                            justifyContent: 'space-between',
                                        }}>
                                        {cause.logo ? (
                                            <View style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 8,
                                                marginBottom: 8,
                                                overflow: 'hidden',
                                            }}>
                                                <Image 
                                                    source={{ uri: cause.logo }} 
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 8,
                                                    }}
                                                    resizeMode="cover"
                                                />
                                            </View>
                                        ) : (
                                            <View style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 8,
                                                backgroundColor: bgColor,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginBottom: 8,
                                            }}>
                                                <Text style={{
                                                    fontSize: 20,
                                                    fontWeight: '600',
                                                    color: 'white',
                                                }}>
                                                    {cause.name?.charAt(0)?.toUpperCase() || 'N'}
                                                </Text>
                                            </View>
                                        )}
                                        <Text 
                                            numberOfLines={2}
                                            ellipsizeMode="tail"
                                            style={{ 
                                                fontSize: 12, 
                                                fontWeight: '600', 
                                                color: '#111827', 
                                                textAlign: 'center',
                                                height: 32,
                                            }}
                                        >
                                            {cause.name}
                                        </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Show more causes text and link */}
                        {profileData.recently_supported_causes.length > 6 && (
                            <View style={{ alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                                    + {profileData.recently_supported_causes.length - 6} more causes
                                </Text>
                                <TouchableOpacity onPress={handleMoreInterests}>
                                    <Text style={{ 
                                        fontSize: 14, 
                                        color: PrimaryBlue, 
                                        fontWeight: '500' 
                                    }}>
                                        See all {profileData.recently_supported_causes.length} →
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                    <View style={{ height: 1, backgroundColor: '#e5e7eb', marginTop: 16 }}></View>

                    </View>
                    )}

                    {/* <View style={{ height: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8, marginTop: 16 }}></View> */}

                    {/* Profile Bio */}
                    {profileData?.bio && <ProfileBio bio={profileData.bio} />}

                    {/* Recent Activity */}
                    <View style={{ paddingVertical: 16 }}>
                        {postsQuery.isLoading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={PrimaryBlue} />
                                <Text style={{ marginTop: 10, color: PrimaryGrey }}>Loading posts...</Text>
                            </View>
                        ) : userPosts.length === 0 ? (
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Recent Activity</Text>
                            <View style={{ 
                                backgroundColor: 'white',
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: '#e5e7eb',
                                    padding: 48,
                                alignItems: 'center',
                            }}>
                                    <View style={{ marginBottom: 16 }}>
                                        <MessageSquare size={48} color="#d1d5db" />
                                    </View>
                                <Text style={{ 
                                    fontSize: 18, 
                                    fontWeight: '600', 
                                    color: '#111827',
                                    marginBottom: 8,
                                    textAlign: 'center'
                                }}>
                                    No posts yet
                                </Text>
                                    <Text style={{ 
                                        fontSize: 14, 
                                        color: '#6b7280',
                                        textAlign: 'center',
                                        maxWidth: 300
                                    }}>
                                        This user hasn't shared any posts yet. Check back later to see their activity.
                                    </Text>
                              </View>
                            </View>
                        ) : (
                            <PopularPosts
                                posts={userPosts}
                                title="Recent Activity"
                                onLoadMore={async () => {}}
                                hasMore={false}
                                onCommentPress={(post) => {
                                    // Find the original post data to get firstName and lastName
                                    const originalPost = postsQuery?.data?.results?.find((p: any) => p.id?.toString() === post.id);
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
                        <TouchableWithoutFeedback onPress={() => {}}>
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
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>✕</Text>
                                    </View>
                                </TouchableOpacity>
                                
                                <TouchableOpacity onPress={() => setShowImageModal(false)}>
                                    <Image
                                        source={{ uri: profileData?.profile_picture || 'https://randomuser.me/api/portraits/women/44.jpg' }}
                                        style={{
                                            width: 300,
                                            height: 300,
                                            borderRadius: 150,
                                            resizeMode: 'cover'
                                        }}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Statistics Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
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

                    <BottomSheetScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
    >
                        {renderStatsContent()}
                    </BottomSheetScrollView>
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
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        textAlign: 'center',
    },
    menuButtonHeader: {
        padding: 4,
    },
    titleSection: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
    },
    bottomSheetTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    bottomSheetSubtitle: {
        fontSize: 14,
        color: '#6b7280',
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
        fontWeight: '600',
    },
    activeTabText: {
        color: '#111827',
        fontWeight: '700',
    },
    causeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
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
        fontWeight: '700',
        color: 'white',
    },
    causeContent: {
        flex: 1,
    },
    causeName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    causeDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 20,
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
        fontWeight: '600',
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
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
    },
    statsItemDescription: {
        fontSize: 12,
        color: PrimaryGrey,
        lineHeight: 16,
    },
    viewButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: LightGrey,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    memberDetails: {
        marginLeft: 12,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    memberUsername: {
        fontSize: 12,
        color: PrimaryGrey,
        marginTop: 2,
    },
    followButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followingButton: {
        backgroundColor: '#f3f4f6',
    },
    followButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    followingButtonText: {
        color: '#6b7280',
    },
});