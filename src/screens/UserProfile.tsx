import { View, Text, ScrollView, TouchableOpacity, Share, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MainHeaderNav from '../components/MainHeaderNav'
import ProfileBio from '../components/ProfileBio'
import ProfileStats from '../components/ProfileStats'
import PopularPosts from '../components/PopularPosts'
import { PrimaryBlue, PrimaryGrey, LightGrey } from '../Constants/Colors'
import { useToast } from '../contexts/ToastContext'
import { useRoute, useNavigation } from '@react-navigation/native'
import { getUserProfileById, followUserById, unfollowUserById, getPosts } from '../services/api/social'
import { useAuthStore } from '../store/store'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar'
import { Flag, Share2 } from 'lucide-react-native'
import { MapPin } from 'lucide-react-native'

// Organization avatars matching Vite version
const orgAvatars = [
    {
        name: "ASPCA",
        image: require('../assets/ngo/aspca.jpg'),
    },
    {
        name: "CRI", 
        image: require('../assets/ngo/CRI.jpg'),
    },
    {
        name: "CureSearch",
        image: require('../assets/ngo/cureSearch.png'),
    },
    {
        name: "Paws",
        image: require('../assets/ngo/paws.jpeg'),
    },
];

export default function UserProfile() {
    const route = useRoute()
    const navigation = useNavigation()
    const {  userId } = route.params as { userId?: string };
    const [showMenu, setShowMenu] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const { showToast } = useToast();
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();

    // Debug logging
    console.log('UserProfile - route.params:', route.params);
    console.log('UserProfile - userId:', userId);
    // console.log('UserProfile - username:', username);

    // Use userId if available, otherwise fallback to username or current user
    const targetUserId = userId  
    
    console.log('UserProfile - targetUserId:', targetUserId);

    // Check if viewing own profile
    const isOwnProfile = currentUser?.id?.toString() === targetUserId;

    // Fetch user profile
    const { data: userProfile, isLoading, error } = useQuery({
        queryKey: ['userProfile', targetUserId],
        queryFn: () => getUserProfileById(targetUserId || ''),
        enabled: !!targetUserId,
    });

    // Fetch user posts
    const postsQuery = useQuery({
        queryKey: ['posts', targetUserId],
        queryFn: () => getPosts(targetUserId, ''),
        enabled: !!targetUserId,
    });

    // Debug API responses
    console.log('UserProfile - userProfile:', userProfile);
    console.log('UserProfile - isLoading:', isLoading);
    console.log('UserProfile - error:', error);
    console.log('UserProfile - postsQuery.data:', postsQuery.data);

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
        if (isFollowing) {
            unfollowMutation.mutate();
        } else {
            followMutation.mutate();
        }
    };

    // Initialize following state from API data
    useEffect(() => {
        if (userProfile) {
            setIsFollowing(userProfile.is_following || false);
        }
    }, [userProfile]);

    // Transform posts data to match PostDetail interface
    const userPosts = postsQuery?.data?.results?.map((post: any) => ({
        id: post.id,
        userId: post.user?.id,
        avatarUrl: post.user?.profile_picture || '',
        username: post.user?.username || post.user?.full_name || 'Unknown User',
        time: new Date(post.created_at).toLocaleDateString(),
        org: post.collective?.name || 'Unknown Collective',
        orgUrl: post.collective?.id,
        text: post.content || '',
        imageUrl: post.media || undefined,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: 0, // API doesn't provide shares count
        isLiked: post.is_liked || false,
    })) || [];

    // Redirect to own profile if viewing own profile
    useEffect(() => {
        if (isOwnProfile) {
            navigation.navigate('Profile' as never);
        }
    }, [isOwnProfile, navigation]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${userProfile?.first_name} ${userProfile?.last_name}'s profile!`,
                title: `${userProfile?.first_name} ${userProfile?.last_name}'s Profile`,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share profile');
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav show={true} menu={false} title="Profile"/>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                    <Text style={styles.loadingText}>Target User ID: {targetUserId}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error) {
        return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav show={true} menu={false} title="Profile"/>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load profile</Text>
                    <Text style={styles.errorText}>Error: {error.message}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => {
                        // Reload the component by refetching queries
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
        return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav show={true} menu={false} title="Profile"/>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>No user profile data</Text>
                    <Text style={styles.loadingText}>Error: {error ? (error as any).message : 'None'}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show fallback if no targetUserId
    if (!targetUserId) {
        return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav show={true} menu={false} title="Profile"/>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>No user ID provided</Text>
                    <Text style={styles.loadingText}>Please navigate with proper parameters</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
            <MainHeaderNav title={'Profile'} show />

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
                        <Text style={{ fontSize: 24, color: '#374151' }}>⋯</Text>
                    </TouchableOpacity>

                    {showMenu && (
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
                            elevation: 3,
                            zIndex: 10,
                            minWidth: 140,
                        }}>
                            <TouchableOpacity 
                                onPress={() => {
                                    setShowMenu(false);
                                    handleShare();
                                }}
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
                                {/* <Text style={{ fontSize: 16 }}>📤</Text> */}
                                <Share2 size={16} color="#374151" />
                                <Text style={{ fontSize: 14, color: '#374151' }}>Share Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => {
                                    setShowMenu(false);
                                    Alert.alert('Report', 'Report profile functionality');
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                }}
                            >
                                {/* <Text style={{ fontSize: 16 }}>🚩</Text> */}
                                <Flag size={16} color="#ef4444" />
                                <Text style={{ fontSize: 14, color: '#ef4444' }}>Report Profile</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                
                <TouchableOpacity
                    onPress={handleFollowClick}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    style={{
                        backgroundColor: isFollowing ? 'white' : PrimaryBlue,
                        borderWidth: isFollowing ? 1 : 0,
                        borderColor: '#e5e7eb',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        opacity: (followMutation.isPending || unfollowMutation.isPending) ? 0.5 : 1,
                    }}
                >
                    {followMutation.isPending || unfollowMutation.isPending ? (
                        <ActivityIndicator size="small" color={isFollowing ? PrimaryBlue : 'white'} />
                    ) : (
                        <Text style={{
                            color: isFollowing ? '#374151' : 'white',
                            fontSize: 14,
                            fontWeight: '600',
                        }}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 20 }}>
                    {/* Profile Header */}
                    <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
                        {/* Avatar */}
                        <Avatar size={56}>
                            <AvatarImage src={userProfile.profile_picture} />
                            <AvatarFallback>
                                {userProfile.first_name?.charAt(0)}{userProfile.last_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#111827',
                            marginTop: 16,
                            marginBottom: 16
                        }}>
                            {userProfile.first_name && userProfile.last_name 
                                ? `${userProfile.first_name} ${userProfile.last_name}` 
                                : userProfile.username || 'User'
                            }
                        </Text>

                        {/* Location and Link */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {userProfile.location && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {/* <Text style={{ fontSize: 16, color: '#6b7280' }}>📍</Text> */}
                                    <MapPin size={16} color="#6b7280" />
                                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{userProfile.location}</Text>
                                </View>
                            )}
                            {userProfile.username && (
                                <TouchableOpacity>
                                    <Text style={{ fontSize: 12, color: PrimaryBlue }}>
                                        @{userProfile.username}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                Active since {userProfile.date_joined ? new Date(userProfile.date_joined).getFullYear() : '2023'}
                            </Text>
                        </View>
                    </View>

                    {/* Profile Stats */}
                    <ProfileStats
                        causes={userProfile.favorite_causes_count || 0}
                        crwds={userProfile.joined_collectives_count || 0}
                        followers={userProfile.followers_count || 0}
                        following={userProfile.following_count || 0}
                    />

                    {/* Recently Supported Section */}
                    <View style={{ marginTop: 24, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Recently Supported</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Interests' as never)}>
                                <Text style={{ fontSize: 14, color: PrimaryBlue, textDecorationLine: 'underline' }}>More →</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            {orgAvatars.map((org, index) => (
                                <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                                    <Image source={org.image} style={{ width: 56, height: 56, borderRadius: 8 }} />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: PrimaryGrey, marginTop: 4, textAlign: 'center' }}>
                                        {org.name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Profile Bio */}
                    <ProfileBio bio={userProfile.bio || "No bio available"} />
                    
                    {/* Recent Activity */}
                    <View style={{ marginTop: 24 }}>
                        <PopularPosts 
                            posts={userPosts} 
                            showTitle={true}
                            title="Recent Activity"
                            onLoadMore={async () => {}}
                            hasMore={false}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
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
});