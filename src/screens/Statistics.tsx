import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { Search } from 'lucide-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserFollowers, getUserFollowing, getFavoriteCausesByUserId, followUser, unfollowUser } from '../services/api/social'
import { getJoinCollective } from '../services/api/crwd'
import { useAuthStore } from '../store/store'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar'
import { useToast } from '../contexts/ToastContext'
// import { MapPin } from 'lucide-react-native'

export default function Statistics() {
    const route = useRoute()
    const routeParams = route.params as { screen?: 'causes' | 'following' | 'followers' | 'crwds'; userId?: string } | undefined
    const defaultTab = routeParams?.screen || 'causes'
    const [activeTab, setActiveTab] = useState<'causes' | 'following' | 'followers' | 'crwds'>(defaultTab)
    const [causesSearch, setCausesSearch] = useState('')
    const [crwdsSearch, setCrwdsSearch] = useState('')
    const navigation = useNavigation()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const { showToast } = useToast()

    // Use userId from route params if provided, otherwise use current user's id
    const targetUserId = routeParams?.userId || user?.id?.toString() || ''

    // Follow user mutation
    const followUserMutation = useMutation({
        mutationFn: followUser,
        onSuccess: () => {
            // Invalidate all follower/following queries
            queryClient.invalidateQueries({ queryKey: ['followers'] })
            queryClient.invalidateQueries({ queryKey: ['following'] })
            // Invalidate current user's profile to update following count
            queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })
            // Invalidate target user's profile if viewing someone else's stats
            if (targetUserId && targetUserId !== user?.id?.toString()) {
                queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] })
            }
            showToast('Followed')
        },
        onError: (error) => {
            console.error('Error following user:', error)
            showToast('Error following user')
        },
    })

    // Unfollow user mutation
    const unfollowUserMutation = useMutation({
        mutationFn: unfollowUser,
        onSuccess: () => {
            // Invalidate all follower/following queries
            queryClient.invalidateQueries({ queryKey: ['followers'] })
            queryClient.invalidateQueries({ queryKey: ['following'] })
            // Invalidate current user's profile to update following count
            queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })
            // Invalidate target user's profile if viewing someone else's stats
            if (targetUserId && targetUserId !== user?.id?.toString()) {
                queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] })
            }
            showToast('Unfollowed')
        },
        onError: (error) => {
            console.error('Error unfollowing user:', error)
            showToast('Error unfollowing user')
        },
    })

    const handleFollowToggle = (userId: string, isFollowing: boolean) => {
        if (isFollowing) {
            unfollowUserMutation.mutate(userId, {
                onSuccess: () => {
                    // Also invalidate the followed user's profile (their followers count changes)
                    queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
                }
            })
        } else {
            followUserMutation.mutate(userId, {
                onSuccess: () => {
                    // Also invalidate the followed user's profile (their followers count changes)
                    queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
                }
            })
        }
    }

    // API calls for real data
    const { data: followersData, isLoading: followersLoading, error: followersError } = useQuery({
        queryKey: ['followers', targetUserId],
        queryFn: () => getUserFollowers(targetUserId),
        enabled: !!targetUserId,
    });

    const { data: followingData, isLoading: followingLoading, error: followingError } = useQuery({
        queryKey: ['following', targetUserId],
        queryFn: () => getUserFollowing(targetUserId),
        enabled: !!targetUserId,
    });

    const { data: causesData, isLoading: causesLoading, error: causesError } = useQuery({
        queryKey: ['favoriteCauses', targetUserId],
        queryFn: () => getFavoriteCausesByUserId(targetUserId),
        enabled: !!targetUserId,
    });

    const { data: collectivesData, isLoading: collectivesLoading, error: collectivesError } = useQuery({
        queryKey: ['joinCollective', targetUserId],
        queryFn: () => getJoinCollective(targetUserId),
        enabled: !!targetUserId,
    });

    console.log(followersData, 'followersData');
    console.log(followingData, 'followingData');
    


    // Use API data with fallbacks - handling nested structures
    const causes = causesData?.results?.map((item: any) => {
        const cause = item.cause || item; // Handle nested cause structure
        return {
            name: cause.name || 'Unknown Cause',
            avatar: cause.image || cause.avatar || '',
            impact: cause.mission || 'Supported',
            id: cause.id,
            description: cause.mission || '',
            category: cause.category || '',
            state: cause.state || '',
            city: cause.city || '',
        };
    }) || []

    const crwds = collectivesData?.data?.map((item: any) => {
        const collective = item.collective || item; // Handle nested collective structure
        return {
            name: collective.name || 'Unknown Collective',
            avatar: collective.created_by?.profile_picture || collective.avatar || collective.image || '',
            role: item.role || 'Member',
            id: collective.id,
            description: collective.description || '',
            memberCount: collective.member_count || 0,
            createdBy: collective.created_by || null,
        };
    }) || []

    const following = followingData?.following?.map((item: any) => {
        const userData = item.followee || item.following || item.user || item
        return {
            name: userData.first_name && userData.last_name 
                ? `${userData.first_name} ${userData.last_name}` 
                : userData.first_name || userData.name || 'Unknown User',
            username: userData.username || 'unknown',
            avatar: userData.profile_picture || userData.avatar || '',
            connected: userData.is_following || false,
            id: userData.id,
            is_following: userData.is_following || false,
        }
    }) || []

    const followers = followersData?.followers?.map((item: any) => {
        const userData = item.follower || item.user || item
        return {
            name: userData.first_name && userData.last_name 
                ? `${userData.first_name} ${userData.last_name}` 
                : userData.first_name || userData.name || 'Unknown User',
            username: userData.username || 'unknown',
            avatar: userData.profile_picture || userData.avatar || '',
            connected: userData.is_following || false,
            id: userData.id,
            is_following: userData.is_following || false,
        }
    }) || []


    const renderCausesTab = () => {
        if (causesLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                    <Text style={styles.loadingText}>Loading causes...</Text>
                </View>
            )
        }

        return (
            <ScrollView style={styles.causesContainer}>
                {causes.length > 0 ? causes.map((cause: any, index: number) => (
                    <View key={cause.id || index} style={styles.causeItem}>
                        <View style={styles.causeInfo}>
                            <Avatar size={40}>
                                <AvatarImage src={cause.avatar} />
                                <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
                                    {cause.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <View style={styles.causeDetails}>
                                <View style={[styles.typeBadge, styles.nonprofitBadge]}>
                                    <Text style={[styles.typeText, styles.nonprofitText]}>Nonprofit</Text>
                                </View>
                                <Text style={styles.causeName}>{cause.name}</Text>
                                <Text style={styles.causeDescription}>{cause.description}</Text>
                           
                            </View>
                        </View>
                        <View style={styles.causeActions}>
                            <TouchableOpacity 
                                style={styles.donateButton} 
                                onPress={() => (navigation as any).navigate('CauseScreen', { causeId: cause.id })}
                            >
                                <Text style={styles.donateButtonText}>View Details</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No causes found</Text>
                    </View>
                )}
            </ScrollView>
        )
    }

    const renderCRWDsTab = () => {
        if (collectivesLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                    <Text style={styles.loadingText}>Loading collectives...</Text>
                </View>
            )
        }

        return (
            <ScrollView style={styles.causesContainer}>
                {crwds.length > 0 ? crwds.map((crwd: any, index: number) => (
                    <View key={crwd.id || index} style={styles.causeItem}>
                        <View style={styles.causeInfo}>
                            <Avatar size={40}>
                                <AvatarImage src={crwd.avatar} />
                                <AvatarFallback style={{ backgroundColor: '#dcfce7' }} textStyle={{ color: '#16a34a', fontWeight: '600' }}>
                                    {crwd.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <View style={styles.causeDetails}>
                                <View style={[styles.typeBadge, styles.crwdBadge]}>
                                    <Text style={[styles.typeText, styles.crwdText]}>Collective</Text>
                                </View>
                                <Text style={styles.causeName}>{crwd.name}</Text>
                                <Text style={styles.causeDescription}>{crwd.description}</Text>
                                
                            </View>
                        </View>
                        <View style={styles.causeActions}>
                            <TouchableOpacity 
                                style={styles.donateButton} 
                                onPress={() => (navigation as any).navigate('GroupCRWD', { collectiveId: crwd.id })}
                            >
                                <Text style={styles.donateButtonText}>View Details</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No collectives found</Text>
                    </View>
                )}
            </ScrollView>
        )
    }

    const renderMembersTab = (members: typeof following, title: string) => {
        const isLoading = title === 'Following' ? followingLoading : followersLoading
        // In the Following tab, all users are already being followed, so always show "Following"
        const isFollowingTab = title === 'Following'
        
        if (isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                    <Text style={styles.loadingText}>Loading {title.toLowerCase()}...</Text>
                </View>
            )
        }

        return (
            <View style={styles.membersContainer}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color={PrimaryGrey} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search ${title.toLowerCase()}...`}
                            placeholderTextColor={PrimaryGrey}
                        />
                    </View>
                </View>

                {/* Members List */}
                <ScrollView style={styles.membersList}>
                    {members.length > 0 ? members.map((member: any, index: number) => {
                        // In Following tab, user is always following, otherwise use member.is_following
                        const isFollowing = isFollowingTab ? true : (member.is_following || false)
                        
                        return (
                        <View key={member.id || index} style={styles.memberItem}>
                            <View style={styles.memberInfo}>
                                <Avatar size={40}>
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback>
                                        {member.name.split(' ').map((word: string) => word[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <View>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberUsername}>@{member.username}</Text>
                                </View>
                            </View>
                                {member.id !== user?.id && (
                                    <TouchableOpacity 
                                        style={isFollowing ? styles.followingButton : styles.followButton}
                                        onPress={() => handleFollowToggle(member.id.toString(), isFollowing)}
                                        disabled={followUserMutation.isPending || unfollowUserMutation.isPending}
                                    >
                                        <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        )
                    }) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No {title.toLowerCase()} found</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        )
    }

    const tabs = [
        { label: "Causes", value: "causes" },
        { label: "Following", value: "following" },
        { label: "Followers", value: "followers" },
        { label: "CRWDs", value: "crwds" },
    ]


    return (
        <SafeAreaView style={styles.container}>
            <MainHeaderNav show menu={false} title={'Statistics'}  />
            
           

            {/* Tab Headers */}
            <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.value}
                        onPress={() => setActiveTab(tab.value as typeof activeTab)}
                        style={[
                            styles.tab,
                            activeTab === tab.value && styles.activeTab
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.value && styles.activeTabText
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
                {activeTab === 'causes' && renderCausesTab()}
                {activeTab === 'following' && renderMembersTab(following, 'Following')}
                {activeTab === 'followers' && renderMembersTab(followers, 'Followers')}
                {activeTab === 'crwds' && renderCRWDsTab()}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#374151',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: LightGrey,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: PrimaryBlue,
    },
    tabText: {
        fontSize: 14,
        color: PrimaryGrey,
        fontWeight: '500',
    },
    activeTabText: {
        color: PrimaryBlue,
        fontWeight: '600',
    },
    tabContent: {
        flex: 1,
        paddingHorizontal: 16,
    },
    causesContainer: {
        flex: 1,
    },
    causeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        marginBottom: 12,
        borderRadius: 8,
    },
    causeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    causeImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    causeDetails: {
        flex: 1,
        minWidth: 0,
        marginLeft: 6,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    crwdBadge: {
        backgroundColor: '#dcfce7',
    },
    nonprofitBadge: {
        backgroundColor: '#dbeafe',
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    crwdText: {
        color: '#16a34a',
    },
    nonprofitText: {
        color: '#2563eb',
    },
    causeName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    causeDescription: {
        fontSize: 12,
        color: PrimaryGrey,
        lineHeight: 16,
    },
    causeActions: {
        alignItems: 'center',
        gap: 8,
    },
    donateButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    donateButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    joinButton: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    joinButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    visitProfileText: {
        color: PrimaryBlue,
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    crwdsContainer: {
        flex: 1,
    },
    crwdItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: LightGrey,
    },
    crwdInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    crwdAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    crwdName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111',
    },
    crwdRole: {
        fontSize: 12,
        color: PrimaryGrey,
        marginTop: 4,
    },
    viewButton: {
        backgroundColor: '#F0F2FB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 0,
    },
    viewButtonText: {
        color: PrimaryBlue,
        fontSize: 14,
        fontWeight: '500',
    },
    membersContainer: {
        flex: 1,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F4F8',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#000',
    },
    membersList: {
        flex: 1,
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
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111',
    },
    memberUsername: {
        fontSize: 12,
        color: PrimaryGrey,
        marginTop: 4,
    },
    followButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    followingButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followingButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: PrimaryGrey,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: PrimaryGrey,
        textAlign: 'center',
    },
    causeLocation: {
        fontSize: 11,
        color: PrimaryGrey,
        marginTop: 2,
    },
    crwdMemberCount: {
        fontSize: 11,
        color: PrimaryGrey,
        marginTop: 2,
    },
}) 