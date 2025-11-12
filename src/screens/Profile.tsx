import { View, Text, ScrollView, TouchableOpacity, Share, Alert, Image, Modal, TouchableWithoutFeedback, ActivityIndicator, RefreshControl, Clipboard } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import MainHeaderNav from '../components/MainHeaderNav'
import ProfileBio from '../components/ProfileBio'
import ProfileStats from '../components/ProfileStats'
import PopularPosts from '../components/PopularPosts'
import ProfileInterests from '../components/ProfileInterests'
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { Share2, Flag, ChevronRight, Ellipsis, MessageCircle, MessageSquare } from 'lucide-react-native'
import { getPosts, getUserProfileById, getUserFollowers, getUserFollowing, getFavoriteCauses } from '../services/api/social'
import { getUserCollectives, getJoinCollective } from '../services/api/crwd'
import { useAuthStore } from '../store/store'
import { Pencil } from 'lucide-react-native'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'
import { useMutation } from '@tanstack/react-query'
import { logout } from '../services/api/auth'
import { MapPin } from 'lucide-react-native'
import { DoorOpenIcon } from 'lucide-react-native'
import { useToast } from '../contexts/ToastContext'

const WEB_BASE_URL = 'https://crwd-vite-1.onrender.com';

type RootStackParamList = {
    ProfileEdit: undefined;
    Interests: undefined;
    Search: undefined;
};


export default function Profile() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user, token, logout: logoutStore } = useAuthStore();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
        navigation.navigate('ProfileEdit' as never);
        setShowMenu(false);
    };


    const handleMoreInterests = () => {
        navigation.navigate('Interests' as never);
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
        // return (
        //     <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
        //         <MainHeaderNav title={'Me'} />
        //         <View style={{ 
        //             flex: 1, 
        //             justifyContent: 'center', 
        //             alignItems: 'center', 
        //             paddingHorizontal: 32,
        //             backgroundColor: 'white'
        //         }}>
        //             {/* Icon */}
        //             <View style={{
        //                 width: 80,
        //                 height: 80,
        //                 backgroundColor: '#dbeafe',
        //                 borderRadius: 40,
        //                 justifyContent: 'center',
        //                 alignItems: 'center',
        //                 marginBottom: 24
        //             }}>
        //                 <Text style={{ fontSize: 40, color: '#2563eb' }}>👤</Text>
        //             </View>
                    
        //             {/* Title */}
        //             <Text style={{
        //                 fontSize: 24,
        //                 fontWeight: 'bold',
        //                 color: '#111827',
        //                 marginBottom: 12,
        //                 textAlign: 'center'
        //             }}>
        //                 Sign in to view your profile
        //             </Text>
                    
        //             {/* Description */}
        //             <Text style={{
        //                 fontSize: 16,
        //                 color: '#6b7280',
        //                 marginBottom: 32,
        //                 textAlign: 'center',
        //                 lineHeight: 24
        //             }}>
        //                 Sign in to view your profile, manage your causes, and connect with your community.
        //             </Text>
                    
        //             {/* CTA Button */}
        //             <TouchableOpacity
        //                 onPress={() => navigation.navigate('Login' as never)}
        //                 style={{
        //                     backgroundColor: '#2563eb',
        //                     paddingHorizontal: 32,
        //                     paddingVertical: 12,
        //                     borderRadius: 8,
        //                     flexDirection: 'row',
        //                     alignItems: 'center',
        //                     gap: 8
        //                 }}
        //             >
        //                 <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
        //                     Sign In to Continue
        //                 </Text>
        //             </TouchableOpacity>
                    
        //             {/* Additional Info */}
        //             <Text style={{
        //                 fontSize: 14,
        //                 color: '#6b7280',
        //                 marginTop: 24,
        //                 textAlign: 'center'
        //             }}>
        //                 Don't have an account? 
        //                 <Text style={{ color: '#2563eb', fontWeight: '500' }}> Create one here</Text>
        //             </Text>
        //         </View>
        //     </SafeAreaView>
        // );
        navigation.navigate('Login' as never);
    }

    // Show loading state - matching Vite version
    if (profileLoading) {
        return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav title={'Me'} show />
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
                <MainHeaderNav title={'Me'} show />
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
            <MainHeaderNav title={'Me'}  />

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
                            <Avatar size={56}>
                                <AvatarImage src={profileData?.profile_picture} />
                                <AvatarFallback>
                                    {profileData?.username?.split(' ')[0][0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar> 
                        </TouchableOpacity>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#111827',
                            marginBottom: 16
                        }}>
                            {profileData?.first_name && profileData?.last_name 
                                ? `${profileData.first_name} ${profileData.last_name}` 
                                : profileData?.username || 'User'
                            }
                        </Text>

                        {/* Location and Link */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {profileData?.location && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {/* <Text style={{ fontSize: 16, color: '#6b7280' }}>📍</Text> */}
                                    <MapPin size={16} color="#6b7280" />
                                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{profileData.location}</Text>
                                </View>
                            )}
                            {profileData?.username && (
                                <TouchableOpacity>
                                    <Text style={{ fontSize: 12, color: PrimaryBlue,}}>
                                        {profileData.username}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                Active since {profileData?.date_joined ? new Date(profileData.date_joined).getFullYear() : '2023'}
                            </Text>
                        </View>
                    </View>

                    {/* Profile Stats */}
                    <ProfileStats 
                        causes={favoriteCausesQuery?.data?.count || profileData?.favorite_causes_count || 0}
                        crwds={userCollectivesQuery?.data?.data?.length || profileData?.joined_collectives_count || 0}
                        followers={followersQuery?.data?.count || profileData?.followers_count || 0}
                        following={followingQuery?.data?.count || profileData?.following_count || 0}
                        profileId={profileData?.id?.toString() || ''}
                        isLoadingCauses={favoriteCausesQuery?.isLoading || profileLoading}
                        isLoadingCrwds={userCollectivesQuery?.isLoading || profileLoading}
                        isLoadingFollowers={followersQuery?.isLoading || false}
                        isLoadingFollowing={followingQuery?.isLoading || false}
                    />

                    {/* Recently Supported Section */}
                    {profileData?.recently_supported_causes && profileData.recently_supported_causes.length > 0 && (
                    <View style={{ marginTop: 24, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                                Recently Supported
                            </Text>
                            {/* <TouchableOpacity onPress={handleMoreInterests}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ fontSize: 14, color: PrimaryBlue, textDecorationLine: 'underline' }}>
                                        More
                                    </Text>
                                    <ChevronRight size={16} color={PrimaryBlue} />
                                </View>
                            </TouchableOpacity> */}
                        </View>

                            {/* Organization Avatars - Horizontal Scrollable */}
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ 
                                    paddingLeft: 20,
                                    paddingRight: 20,
                                    gap: 16,
                                    alignItems: 'center'
                                }}
                                style={{ 
                                    marginHorizontal: -20,
                                    flexGrow: 0 
                                }}
                            >
                                {profileData.recently_supported_causes.map((cause: any, i: number) => (
                                <TouchableOpacity 
                                        key={cause.id || i} 
                                    onPress={() => navigation.navigate('CauseScreen' as never)} 
                                        style={{
                                            alignItems: 'center', 
                                            width: 80,
                                            flexShrink: 0
                                        }}
                                    >
                                        <Avatar size={56}>
                                            <AvatarImage src={cause.logo} />
                                            <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
                                                {cause.name?.charAt(0)?.toUpperCase() || 'N'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Text 
                                            numberOfLines={2}
                                            ellipsizeMode="tail"
                                            style={{ 
                                                fontSize: 12, 
                                                fontWeight: '600', 
                                                color: '#6b7280', 
                                                marginTop: 4, 
                                                textAlign: 'center',
                                                width: 80,
                                            }}
                                        >
                                            {cause.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            </ScrollView>
                        </View>
                    )}

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
        </SafeAreaView>
    )
}