import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, StyleSheet, Modal, Pressable, ActivityIndicator, Alert, Share, TouchableWithoutFeedback, Clipboard, Linking } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'

import { Ellipsis, Heart, MessageCircle, Trash2, Share2, MessageSquare, Users, MapPin, MoreHorizontal, Pencil, Flag, Play, Repeat } from 'lucide-react-native'
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native'
import VideoPlayer from '../ui/VideoPlayer'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../contexts/ToastContext'
import { useAuthStore } from '../../store/store'
import { deletePost, likePost, unlikePost } from '../../services/api/social'
import { patchFundraiser } from '../../services/api/crwd'
import { WEB_BASE_URL } from '../../Constants/url'
import { encodePostId } from '../../utils/truncateFirstPeriod'
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../../Constants/Colors'
import { useInAppBrowser } from '../../hooks/useInAppBrowser'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar'
import SocialShare from '../SocialShare'
import SharePost from '../SharePost'
import DeletePostBottomSheet from '../post/DeletePostBottomSheet'


// Format date to relative time or full date
const formatPostTime = (timeString: string | undefined): string => {
    if (!timeString) return '';

    // Check if it's already a relative time string (like "1h ago", "2d ago")
    if (timeString.includes('ago') || timeString.includes('just now')) {
        return timeString;
    }

    let date: Date;

    // Handle DD/MM/YYYY format (e.g., "15/12/2025")
    const ddmmyyyyMatch = timeString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        // Create date in YYYY-MM-DD format for proper parsing
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else {
        // Try to parse as ISO date string or other date formats
        date = new Date(timeString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        // If parsing fails, return the original string
        return timeString;
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInSeconds / 3600);

    // Show relative time for recent posts (within 24 hours)
    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
        // For older posts, show full date
        const currentYear = now.getFullYear();
        const postYear = date.getFullYear();

        const options: Intl.DateTimeFormatOptions = {
            month: 'long',
            day: 'numeric',
        };

        // Add year only if it's not the current year
        if (postYear !== currentYear) {
            options.year = 'numeric';
        }

        return date.toLocaleDateString('en-US', options);
    }
};


interface PreviewDetails {
    title: string | null;
    description: string | null;
    image: string | null;
    site_name: string | null;
    url: string;
    domain: string;
}

interface Post {
    id: string;
    userId?: string;
    username: string;
    avatarUrl: string;
    time: string;
    org: string;
    orgUrl?: string | number; // Collective ID for navigation
    text: string;
    imageUrl?: string;
    media_type?: string;
    previewDetails?: PreviewDetails | null;
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
    mentions?: any[];
    fundraiser?: {
        id: number;
        name: string;
        description?: string;
        image?: string | null;
        color?: string | null;
        target_amount: string;
        current_amount: string;
        progress_percentage: number;
        is_active?: boolean;
        total_donors?: number;
        end_date?: string;
    };
    reposted_from?: {
        id: number;
        content?: string;
        mentions?: any[];
        user?: {
            id: number;
            username: string;
            first_name?: string;
            last_name?: string;
            full_name?: string;
        };
    };
}

interface PopularPostsProps {
    posts: Post[];
    showTitle?: boolean;
    showDelete?: boolean;
    onLoadMore?: () => Promise<void>;
    hasMore?: boolean;
    related?: boolean;
    title?: string;
    postButton?: boolean;
    subheading?: boolean;
    collectiveId?: string | number;
    isLoading?: boolean;
    isLoadingMore?: boolean;
    error?: any;
    onCommentPress?: (post: Post) => void;
    showSimplifiedHeader?: boolean; // When true, hide collective name (for collective view)
    scrollEnabled?: boolean;
}

type RootStackParamList = {
    PostDetail: { post: Post };
    UserProfile: { userId: string };
    Profile: undefined;
    GroupCRWD: { collectiveId: string };
};

export default function GivingPost({
    posts,
    showTitle = true,
    showDelete = false,
    related = false,
    title = 'Recent Posts to Collectives',
    postButton = false,
    subheading = false,
    collectiveId,
    onLoadMore = async () => {
        // Default implementation to make button visible
        await new Promise(resolve => setTimeout(resolve, 1000));
    },
    hasMore = true,
    isLoading = false,
    error = null,
    onCommentPress,
    showSimplifiedHeader = false,
    scrollEnabled = true,
}: PopularPostsProps) {
    // Handle "no title" case - don't show title if title is "no title" or empty
    const shouldShowTitle = showTitle && title && title !== 'no title' && title.trim() !== '';
    const [showTooltip, setShowTooltip] = useState(false);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const screenWidth = Dimensions.get('window').width;
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [postsLikesCount, setPostsLikesCount] = useState<Record<string, number>>({});
    const [showFundraiserMenu, setShowFundraiserMenu] = useState<number | null>(null);
    const shareSheetRef = useRef<BottomSheetModal>(null);
    const [shareData, setShareData] = useState({ url: '', title: '', message: '' });
    const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number, height: number }>>({});
    const deleteBottomSheetRef = useRef<BottomSheetModal>(null);

    const queryClient = useQueryClient();
    const { openInAppBrowser } = useInAppBrowser();
    const { showToast } = useToast();
    const { user } = useAuthStore();

    console.log(posts, 'posts from API');

    // Handle start conversation button press
    const handleStartConversation = () => {
        console.log('Start conversation clicked with collectiveId:', collectiveId);
        if (collectiveId) {
            navigation.navigate('Post' as any, { collectiveId: collectiveId });
        }
    };

    // Like post mutation
    const likeMutation = useMutation({
        mutationFn: likePost,
        onSuccess: (_data: any, postId: string) => {
            setLikedPosts(prev => new Set([...prev, postId]));
            setPostsLikesCount(prev => ({
                ...prev,
                [postId]: (prev[postId] || 0) + 1
            }));
            // showToast('Post liked!', 2000);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
        },
        onError: (error: any) => {
            console.error('Error liking post:', error);
            showToast('Failed to like post', 2000);
        },
    });

    // Unlike post mutation
    const unlikeMutation = useMutation({
        mutationFn: unlikePost,
        onSuccess: (_data: any, postId: string) => {
            setLikedPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
            setPostsLikesCount(prev => ({
                ...prev,
                [postId]: Math.max((prev[postId] || 1) - 1, 0)
            }));
            // showToast('Post unliked!', 2000);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });

        },
        onError: (error: any) => {
            console.error('Error unliking post:', error);
            showToast('Failed to unlike post', 2000);
        },
    });

    // Delete post mutation
    const deletePostMutation = useMutation({
        mutationFn: deletePost,
        onSuccess: () => {
            // showToast('Post deleted successfully!', 2000);
            deleteBottomSheetRef.current?.dismiss();
            setTooltipVisible(false);
            setSelectedPost(null);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
        onError: (error: any) => {
            console.error('Error deleting post:', error);
            showToast('Failed to delete post', 2000);
            deleteBottomSheetRef.current?.dismiss();
        },
    });

    // End Fundraiser Mutation
    const endFundraiserMutation = useMutation({
        mutationFn: (fundraiserId: number) => patchFundraiser(fundraiserId.toString(), { is_active: false }),
        onSuccess: () => {
            // showToast('Fundraiser ended successfully', 2000);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            setShowFundraiserMenu(null);
        },
        onError: (error: any) => {
            console.error('Error ending fundraiser:', error);
            showToast(`Failed to end fundraiser: ${error?.response?.data?.message || error?.message || 'Unknown error'}`, 3000);
            setShowFundraiserMenu(null);
        },
    });

    const handleEndFundraiser = (fundraiserId: number) => {
        Alert.alert(
            'End Fundraiser',
            'Are you sure you want to end this fundraiser? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Fundraiser',
                    style: 'destructive',
                    onPress: () => endFundraiserMutation.mutate(fundraiserId),
                },
            ]
        );
    };

    const handleEditFundraiser = (fundraiserId: number, collectiveId: string) => {
        (navigation as any).navigate('EditFundraiser', {
            id: fundraiserId,
            fundraiserId: fundraiserId,
        });
        setShowFundraiserMenu(null);
    };

    // Initialize liked posts state based on posts data
    useEffect(() => {
        if (!posts || !Array.isArray(posts)) {
            return;
        }

        const likedSet = new Set<string>();
        const likesCount: Record<string, number> = {};

        posts.forEach(post => {
            if (post.isLiked) {
                likedSet.add(post.id);
            }
            likesCount[post.id] = post.likes;
        });

        setLikedPosts(likedSet);
        setPostsLikesCount(likesCount);
    }, [posts]);

    // Calculate image dimensions for all posts
    useEffect(() => {
        if (!posts) return;
        posts.forEach(item => {
            const imageUrl = item.fundraiser?.image || item.previewDetails?.image || item.imageUrl;
            if (imageUrl && !imageDimensions[item.id] && item.media_type !== 'video') {
                Image.getSize(imageUrl, (width, height) => {
                    const maxWidth = screenWidth - 70;
                    const targetHeight = 200;
                    let calculatedWidth = (targetHeight * width) / height;
                    let finalHeight = targetHeight;

                    if (calculatedWidth > maxWidth) {
                        calculatedWidth = maxWidth;
                        finalHeight = (maxWidth * height) / width;
                    }

                    setImageDimensions(prev => ({
                        ...prev,
                        [item.id]: { width: calculatedWidth, height: finalHeight }
                    }));
                }, (error) => console.log('Image size error for post', item.id, error));
            }
        });
    }, [posts, screenWidth]);

    // Handle like button press
    const handleLikePress = (postId: string) => {
        const isLiked = likedPosts.has(postId);
        if (isLiked) {
            unlikeMutation.mutate(postId);
        } else {
            likeMutation.mutate(postId);
        }
    };


    const handlePostPress = (post: Post) => {
        navigation.navigate('PostDetail', { post });
    };

    const handleEllipsisPress = (event: any, post: Post) => {
        const { pageX, pageY } = event.nativeEvent;
        setTooltipPosition({ x: pageX - 50, y: pageY + 30 });
        setSelectedPost(post);
        setTooltipVisible(true);
    };

    const handleLoadMore = async () => {
        if (isLoading || !hasMore) return;
        try {
            await onLoadMore();
        } catch (error) {
            console.error('Error loading more posts:', error);
        }
    };

    const handleShare = async (post?: Post) => {
        let webUrl = '';
        let shareMessage = '';
        let shareTitle = '';

        if (post) {
            if (post.fundraiser) {
                // Share fundraiser
                webUrl = `${WEB_BASE_URL}/fundraiser/${encodePostId(post.fundraiser.id)}`;
            } else {
                // Share post
                webUrl = `${WEB_BASE_URL}/post/${encodePostId(post.id)}`;
            }
            shareMessage = ``;
            shareTitle = '';
        } else if (user?.id) {
            // Share profile
            webUrl = `${WEB_BASE_URL}/u/${user.username}`;
            shareMessage = ``;
            shareTitle = '';
        }

        if (webUrl) {
            setShareData({
                url: webUrl,
                title: shareTitle,
                message: shareMessage
            });
            shareSheetRef.current?.present();
            setTooltipVisible(false);
        }
    };

    const renderHighlightedText = (content: string, mentions: any[] = []) => {
        if (!content) return null;
        const mentionMap = new Map();
        const triggers: string[] = [];

        (mentions || []).forEach((m: any) => {
            if (!m) return;
            const details = m.mention_details || m;

            if (details?.name) {
                const nameKey = `@${details.name}`.toLowerCase();
                mentionMap.set(nameKey, m);
                if (!triggers.includes(`@${details.name}`)) triggers.push(`@${details.name}`);
            }

            if (details?.username) {
                const userKey = `@${details.username}`.toLowerCase();
                mentionMap.set(userKey, m);
                if (!triggers.includes(`@${details.username}`)) triggers.push(`@${details.username}`);
            }

            if (m.trigger_name) {
                const triggerStr = m.trigger_name.startsWith('@') ? m.trigger_name : `@${m.trigger_name}`;
                const triggerKey = triggerStr.toLowerCase();
                mentionMap.set(triggerKey, m);
                if (!triggers.includes(triggerStr)) triggers.push(triggerStr);
            }
        });

        triggers.sort((a, b) => b.length - a.length);

        const urlPattern = '(https?:\\/\\/[^\\s]+)';
        const pattern = triggers.length > 0
            ? `(${urlPattern}|${triggers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|@\\w+)`
            : `(${urlPattern}|@\\w+)`;
        const regex = new RegExp(pattern, 'gi');

        return content.split(regex).map((part, index) => {
            if (!part) return null;

            if (part.match(/^https?:\/\//i)) {
                return (
                    <Text
                        key={`${index}-${part}`}
                        style={{ color: PrimaryBlue, textDecorationLine: 'underline', fontFamily: 'Outfit-Medium' }}
                        onPress={() => openInAppBrowser(part)}
                    >
                        {part}
                    </Text>
                );
            }

            if (part.startsWith('@')) {
                const mention = mentionMap.get(part.toLowerCase());
                const handlePress = () => {
                    if (mention) {
                        const mDetails = mention.mention_details || mention;
                        const type = (mention.mention_type || mDetails?.mention_type || mDetails?.type || '').toLowerCase();
                        const targetId = mDetails?.id || mDetails?.target_id || mention.id || mention.target_id || mDetails?.sort_name || mDetails?.username || part.substring(1);

                        if (type === 'collective' || type === 'group') {
                            (navigation as any).navigate('GroupCRWD', { id: targetId.toString() });
                        } else if (type === 'cause' || type === 'nonprofit' || type === 'organization') {
                            (navigation as any).navigate('CauseScreen', { id: targetId.toString() });
                        } else {
                            // User
                            if (user?.id && targetId && user.id.toString() === targetId.toString()) {
                                navigation.dispatch(
                                    CommonActions.reset({
                                        index: 0,
                                        routes: [
                                            {
                                                name: 'DrawerNav' as never,
                                                state: {
                                                    routes: [
                                                        {
                                                            name: 'MainTabs' as never,
                                                            state: {
                                                                routes: [{ name: 'Profile' as never }],
                                                                index: 0,
                                                            },
                                                        },
                                                    ],
                                                    index: 0,
                                                },
                                            },
                                        ],
                                    })
                                );
                            } else {
                                (navigation as any).navigate('UserProfile', { userId: targetId.toString() });
                            }
                        }
                    } else {
                        // Fallback
                        (navigation as any).navigate('UserProfile', { userId: part.substring(1) });
                    }
                };

                return (
                    <Text
                        key={index}
                        style={{ color: PrimaryBlue, fontFamily: 'Outfit-Medium' }}
                        onPress={handlePress}
                    >
                        {part}
                    </Text>
                );
            }
            return part;
        });
    };

    const renderFooter = () => {
        if (!hasMore) return null;

        return (
            <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color={PrimaryBlue} size="small" />
                ) : (
                    <Text style={styles.loadMoreText}>Load More</Text>
                )}
            </TouchableOpacity>
        );
    };



    return (
        <>
            <View style={{ marginTop: 0, marginBottom: 0 }}>
                {shouldShowTitle && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontSize: 18, fontFamily: 'Outfit-SemiBold' }}>{related ? 'Related Posts' : title}</Text>
                            <TouchableOpacity
                                onPress={() => setShowTooltip(!showTooltip)}
                                style={{ padding: 8 }}
                            >
                                <View style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: '#6c757d',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Text style={{ color: 'white', fontSize: 12, fontFamily: 'Outfit-Bold' }}>?</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        {postButton && (
                            <TouchableOpacity
                                onPress={handleStartConversation}
                                style={{ padding: 8, backgroundColor: SecondaryGrey, borderRadius: 8 }}
                            >
                                <Text style={{ fontSize: 14, fontFamily: 'Outfit-Medium' }}>Create Post

                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {subheading && <Text style={{ fontSize: 12, fontStyle: 'italic', color: 'grey', marginBottom: 8, fontFamily: 'Outfit-Regular' }}>Members share updates, questions and articles here.</Text>}

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={PrimaryBlue} />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            {error?.message || 'Failed to load posts. Please try again.'}
                        </Text>
                    </View>
                )}

                {/* Tooltip */}
                {showTooltip && shouldShowTitle && (
                    <View style={{
                        position: 'absolute',
                        top: 50,
                        left: 10,
                        backgroundColor: '#000',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                        zIndex: 1000,
                        maxWidth: 200,
                    }}>
                        <Text style={{
                            color: 'white',
                            fontSize: 12,
                            fontFamily: 'Outfit-Medium',
                            textAlign: 'center'
                        }}>
                            You can engage with others in Collectives.
                        </Text>
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 40,
                            width: 0,
                            height: 0,
                            borderLeftWidth: 6,
                            borderRightWidth: 6,
                            borderBottomWidth: 6,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderBottomColor: '#000',
                        }} />
                    </View>
                )}

                {/* Empty State */}
                {!isLoading && !error && (!posts || posts.length === 0) && (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Users size={48} color="#1600ff" strokeWidth={1.5} {...({} as any)} />
                        </View>
                        <Text style={styles.emptyTitle}>No posts yet</Text>
                        <Text style={styles.emptyDescription}>
                            Posts appear when you share updates in your collectives. Join or start a collective to start sharing your impact!
                        </Text>
                    </View>
                )}

                {!isLoading && !error && posts && posts.length > 0 && (
                    <FlatList
                        scrollEnabled={scrollEnabled}
                        data={posts || []}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        renderItem={({ item }) => {
                            // Avatar colors for consistent coloring (matching Vite)
                            const avatarColors = [
                                '#EF4444', // Red
                                '#8B5CF6', // Purple
                                '#EC4899', // Pink
                                '#F97316', // Orange
                                '#10B981', // Green
                                '#3B82F6', // Blue
                            ];

                            // Use color from API if available, otherwise generate consistent color
                            const getConsistentColor = (id: number | string, colors: string[]) => {
                                const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                                return colors[hash % colors.length];
                            };

                            const avatarBgColor = (item as any).color
                                || (item.userId ? getConsistentColor(item.userId, avatarColors)
                                    : (item.username ? getConsistentColor(item.username, avatarColors) : avatarColors[0]));

                            // Get initials from firstName/lastName or username
                            const getInitials = (firstName?: string, lastName?: string, username?: string) => {
                                if (firstName) {
                                    return `${firstName[0]}`.toUpperCase();
                                }
                                if (username) {
                                    return username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
                                }
                                return 'U';
                            };

                            const initials = getInitials((item as any).firstName, (item as any).lastName, item.username);

                            // Generate different color for collective tag based on post ID (so same collective can have different colors)
                            const tagColors = [
                                '#ec4899', // pink
                                '#3b82f6', // blue
                                '#10b981', // green
                                '#f59e0b', // amber
                                '#8b5cf6', // purple
                                '#ef4444', // red
                                '#06b6d4', // cyan
                                '#f97316', // orange
                                '#84cc16', // lime
                                '#a855f7', // violet
                                '#14b8a6', // teal
                                '#f43f5e', // rose
                                '#6366f1', // indigo
                            ];
                            // Use post ID to generate different colors even for same collective
                            // Handle both string and number IDs, and undefined cases
                            let tagColorIndex = 0;
                            if (item.id) {
                                const idStr = String(item.id);
                                if (idStr.length > 0) {
                                    tagColorIndex = idStr.charCodeAt(idStr.length - 1) % tagColors.length;
                                } else {
                                    // Fallback: use a hash of the org name or random
                                    tagColorIndex = (item.org?.charCodeAt(0) || 0) % tagColors.length;
                                }
                            } else {
                                // Fallback: use org name or random index
                                tagColorIndex = (item.org?.charCodeAt(0) || Math.floor(Math.random() * tagColors.length)) % tagColors.length;
                            }
                            const tagBgColor = tagColors[tagColorIndex];

                            return (
                                <View style={[
                                    styles.postCard,
                                    item.fundraiser?.is_active && { backgroundColor: '#fbfcff' }
                                ]}>
                                    {item.reposted_from && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 4 }}>
                                            <Repeat size={12} color={PrimaryGrey} />
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: PrimaryGrey, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Reposted from {item.reposted_from.user?.full_name || item.reposted_from.user?.username || (item.reposted_from.user?.first_name ? `${item.reposted_from.user.first_name} ${item.reposted_from.user.last_name || ''}`.trim() : '')}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const targetId = item.reposted_from?.user?.id;
                                                    if (targetId) {
                                                        if (user?.id && user.id.toString() === targetId.toString()) {
                                                            navigation.dispatch(
                                                                CommonActions.reset({
                                                                    index: 0,
                                                                    routes: [
                                                                        {
                                                                            name: 'DrawerNav',
                                                                            state: {
                                                                                routes: [
                                                                                    {
                                                                                        name: 'MainTabs',
                                                                                        state: {
                                                                                            routes: [{ name: 'Profile' }],
                                                                                            index: 0,
                                                                                        },
                                                                                    },
                                                                                ],
                                                                                index: 0,
                                                                            },
                                                                        },
                                                                    ],
                                                                })
                                                            );
                                                        } else {
                                                            navigation.navigate('UserProfile', { userId: targetId.toString() });
                                                        }
                                                    }
                                                }}
                                            >
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: PrimaryBlue, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    {item.reposted_from.user?.full_name || item.reposted_from.user?.username || (item.reposted_from.user?.first_name ? `${item.reposted_from.user.first_name} ${item.reposted_from.user.last_name || ''}`.trim() : '')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    {/* Pinned Fundraiser Header - Only show if active */}
                                    {item.fundraiser?.is_active && (
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 12,
                                            paddingHorizontal: 4
                                        }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <MapPin size={16} color="#1600ff" />
                                                <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: '#1600ff' }}>
                                                    PINNED FUNDRAISER
                                                </Text>
                                            </View>
                                            <View style={{ position: 'relative' }}>
                                                <TouchableOpacity
                                                    style={{ padding: 4 }}
                                                    onPress={() => {
                                                        setShowFundraiserMenu(showFundraiserMenu === item.fundraiser?.id ? null : item.fundraiser?.id || null);
                                                    }}
                                                >
                                                    <MoreHorizontal size={20} color="#6b7280" />
                                                </TouchableOpacity>

                                                {/* Fundraiser Menu Dropdown */}
                                                {showFundraiserMenu === item.fundraiser?.id && (
                                                    <>
                                                        <TouchableWithoutFeedback onPress={() => setShowFundraiserMenu(null)}>
                                                            <View style={StyleSheet.absoluteFillObject} />
                                                        </TouchableWithoutFeedback>
                                                        <View style={styles.fundraiserMenu}>
                                                            <TouchableOpacity
                                                                style={styles.fundraiserMenuItem}
                                                                onPress={() => {
                                                                    if (item.fundraiser && item.orgUrl) {
                                                                        handleEditFundraiser(item.fundraiser.id, item.orgUrl.toString());
                                                                    }
                                                                }}
                                                            >
                                                                <Pencil size={16} color="#6B7280" style={{ marginRight: 8 }} />
                                                                <Text style={styles.fundraiserMenuText}>Edit Fundraiser</Text>
                                                            </TouchableOpacity>
                                                            <View style={styles.fundraiserMenuDivider} />
                                                            <TouchableOpacity
                                                                style={styles.fundraiserMenuItem}
                                                                onPress={() => {
                                                                    if (item.fundraiser) {
                                                                        handleEndFundraiser(item.fundraiser.id);
                                                                    }
                                                                }}
                                                                disabled={endFundraiserMutation.isPending}
                                                            >
                                                                <Flag size={16} color="#DC2626" style={{ marginRight: 8 }} />
                                                                <Text style={[styles.fundraiserMenuText, styles.fundraiserMenuTextDanger]}>
                                                                    {endFundraiserMutation.isPending ? 'Ending...' : 'End Fundraiser'}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    {/* Header Row: Avatar and User Info centered together */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingTop: 5, paddingBottom: 0 }}>
                                        {/* Avatar Left Column */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (user?.id && item.userId && user.id.toString() === item.userId.toString()) {
                                                    navigation.dispatch(
                                                        CommonActions.reset({
                                                            index: 0,
                                                            routes: [
                                                                {
                                                                    name: 'DrawerNav',
                                                                    state: {
                                                                        routes: [
                                                                            {
                                                                                name: 'MainTabs',
                                                                                state: {
                                                                                    routes: [{ name: 'Profile' }],
                                                                                    index: 0,
                                                                                },
                                                                            },
                                                                        ],
                                                                        index: 0,
                                                                    },
                                                                },
                                                            ],
                                                        })
                                                    );
                                                } else {
                                                    navigation.navigate('UserProfile', { userId: item.userId || '' });
                                                }
                                            }}
                                            style={styles.avatarContainer}
                                        >
                                            <Avatar size={40}>
                                                <AvatarImage src={item.avatarUrl} />
                                                <AvatarFallback
                                                    style={{ backgroundColor: item.avatarUrl ? 'transparent' : avatarBgColor }}
                                                    textStyle={{ color: 'white', fontFamily: 'Outfit-SemiBold', fontSize: 14 }}
                                                >
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TouchableOpacity>

                                        {/* Header Info Column */}
                                        <View style={{ flex: 1, marginLeft: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={styles.headerInfo}>
                                                <View style={styles.headerTop}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                if (user?.id && item.userId && user.id.toString() === item.userId.toString()) {
                                                                    navigation.dispatch(
                                                                        CommonActions.reset({
                                                                            index: 0,
                                                                            routes: [
                                                                                {
                                                                                    name: 'DrawerNav',
                                                                                    state: {
                                                                                        routes: [
                                                                                            {
                                                                                                name: 'MainTabs',
                                                                                                state: {
                                                                                                    routes: [{ name: 'Profile' }],
                                                                                                    index: 0,
                                                                                                },
                                                                                            },
                                                                                        ],
                                                                                        index: 0,
                                                                                    },
                                                                                },
                                                                            ],
                                                                        })
                                                                    );
                                                                } else {
                                                                    navigation.navigate('UserProfile', { userId: item.userId || '' });
                                                                }
                                                            }}
                                                        >
                                                            <Text style={styles.username}>{item.username || 'Unknown User'}</Text>
                                                        </TouchableOpacity>
                                                        {item.fundraiser && (
                                                            <View style={styles.founderBadge}>
                                                                <Text style={styles.founderBadgeText}>Organizer</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    {item.fundraiser && (
                                                        <Text style={[styles.startedFundraiserText, { marginTop: -2, marginBottom: 2 }]}>started a fundraiser</Text>
                                                    )}
                                                    {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            {item.org && (
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        if (item.orgUrl) {
                                                                            (navigation as any).navigate('GroupCRWD', { collectiveId: item.orgUrl.toString() });
                                                                        }
                                                                    }}
                                                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                                                >
                                                                    <Users size={14} color="#6b7280" strokeWidth={2.5} {...({} as any)} />
                                                                    <Text style={{ fontSize: 13, color: '#6b7280', fontFamily: 'Outfit-Regular' }}>
                                                                        {item.org}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View> */}
                                                </View>
                                            </View>
                                            {/* Ellipsis Menu - positioned in top right of content */}
                                            {user?.id && user.id.toString() === item.userId?.toString() && !item.fundraiser?.is_active && (
                                                <TouchableOpacity
                                                    onPress={(event) => handleEllipsisPress(event, item)}
                                                    style={styles.menuButton}
                                                >
                                                    <Ellipsis size={20} color="#6b7280" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>

                                    {/* Content Block Column (Indented under avatar) */}
                                    <View style={{ flexDirection: 'row', paddingHorizontal: 5, paddingBottom: 0, paddingTop: 0 }}>
                                        {/* Left Spacer to match avatar width (40px) */}
                                        <View style={{ width: 40 }} />

                                        <View style={{ flex: 1, marginLeft: 12 }}>

                                            {/* Clickable Post Content/Media/Fundraiser */}
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (item.fundraiser) {
                                                        (navigation as any).navigate('FundraiserDetail', { fundraiserId: item.fundraiser.id });
                                                    } else {
                                                        handlePostPress(item);
                                                    }
                                                }}
                                                activeOpacity={1}
                                            >
                                                {/* Fundraiser Post UI */}
                                                {item.fundraiser?.is_active ? (
                                                    <>
                                                        {/* Fundraiser Cover Image/Color */}
                                                        <View style={{ width: '100%', height: 200, borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: 'hidden' }}>
                                                            {item.fundraiser.color ? (
                                                                <View style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    backgroundColor: item.fundraiser.color,
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    <Text style={{ color: 'white', fontSize: 20, fontFamily: 'Outfit-Bold', textAlign: 'center' }}>
                                                                        {item.fundraiser.name}
                                                                    </Text>
                                                                </View>
                                                            ) : item.fundraiser.image ? (
                                                                <View style={{ flexDirection: 'row' }}>
                                                                    <Image
                                                                        source={{ uri: item.fundraiser.image }}
                                                                        style={{
                                                                            width: imageDimensions[item.id]?.width || 0,
                                                                            height: imageDimensions[item.id]?.height || 200,
                                                                            borderRadius: 8,
                                                                            opacity: imageDimensions[item.id] ? 1 : 0
                                                                        }}
                                                                        resizeMode="contain"
                                                                    />
                                                                </View>
                                                            ) : (
                                                                <View style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    backgroundColor: '#1600ff',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    <Text style={{ color: 'white', fontSize: 20, fontFamily: 'Outfit-Bold' }}>
                                                                        {item.fundraiser.name}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>

                                                        {/* Fundraiser Info */}
                                                        <View style={{ marginBottom: 8, backgroundColor: 'white', padding: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                                                            <Text style={{ fontSize: 16, fontFamily: 'Outfit-Bold', color: '#111827', marginBottom: 12 }}>
                                                                {item.fundraiser.name}
                                                            </Text>
                                                            <View style={{ marginBottom: 8 }}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                                                                    <Text style={{ fontSize: 18, fontFamily: 'Outfit-Bold', color: '#1600ff' }}>
                                                                        ${parseFloat(item.fundraiser.current_amount || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                    </Text>
                                                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                                                                        raised of ${parseFloat(item.fundraiser.target_amount || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} goal
                                                                    </Text>
                                                                </View>
                                                                <View style={{
                                                                    width: '100%',
                                                                    height: 6,
                                                                    backgroundColor: '#e5e7eb',
                                                                    borderRadius: 999,
                                                                    overflow: 'hidden',
                                                                    marginBottom: 6
                                                                }}>
                                                                    <View style={{
                                                                        height: '100%',
                                                                        backgroundColor: '#1600ff',
                                                                        width: `${Math.min(item.fundraiser.progress_percentage || 0, 100)}%`
                                                                    }} />
                                                                </View>
                                                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                                                    {item.fundraiser.total_donors !== undefined && (
                                                                        <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Outfit-Regular' }}>
                                                                            <Text style={{ fontFamily: 'Outfit-SemiBold' }}>{item.fundraiser.total_donors}</Text> donor{item.fundraiser.total_donors !== 1 ? 's' : ''}
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </>
                                                ) : item.fundraiser ? (
                                                    <View style={{ width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#EFF6FF', marginBottom: 8 }}>
                                                        <View style={{ width: '100%', height: 160 }}>
                                                            {item.fundraiser.image ? (
                                                                <Image source={{ uri: item.fundraiser.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                                                            ) : (
                                                                <View style={{ width: '100%', height: '100%', backgroundColor: item.fundraiser.color || '#1600ff', justifyContent: 'center', alignItems: 'center' }}>
                                                                    <Text style={{ color: 'white', fontSize: 18, fontFamily: 'Outfit-Bold' }}>{item.fundraiser.name}</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        <View style={{ padding: 12 }}>
                                                            <Text style={{ fontSize: 16, fontFamily: 'Outfit-Bold', color: '#111827', marginBottom: 4 }}>{item.fundraiser.name}</Text>
                                                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                                                <Text style={{ fontSize: 16, fontFamily: 'Outfit-Bold', color: '#1600ff' }}>${parseFloat(item.fundraiser.current_amount || '0').toLocaleString()}</Text>
                                                                <Text style={{ fontSize: 13, color: '#374151' }}>raised of ${parseFloat(item.fundraiser.target_amount || '0').toLocaleString()}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                ) : (
                                                    <Text style={styles.postText}>{renderHighlightedText(item.text, item.mentions?.length ? item.mentions : item.reposted_from?.mentions)}</Text>
                                                )}

                                                {/* Media Section */}
                                                {!item.fundraiser && !item.previewDetails && item.imageUrl && (
                                                    item.media_type === 'video' ? (
                                                        <View style={{ marginBottom: 12 }}>
                                                            <VideoPlayer
                                                                src={item.imageUrl}
                                                                user={{
                                                                    name: item.username || 'User',
                                                                    username: item.username,
                                                                    avatar: item.avatarUrl || '',
                                                                    isVerified: false
                                                                }}
                                                                caption={item.text}
                                                                likes={postsLikesCount[item.id] || item.likes || 0}
                                                                comments={item.comments || 0}
                                                                isLiked={likedPosts.has(item.id)}
                                                                onLike={() => likedPosts.has(item.id) ? unlikeMutation.mutate(item.id) : likeMutation.mutate(item.id)}
                                                                onComment={() => onCommentPress ? onCommentPress(item) : navigation.navigate('PostDetail', { postId: item.id })}
                                                                onShare={() => {
                                                                    setShareData({
                                                                        url: `${WEB_BASE_URL}/post/${encodePostId(item.id)}`,
                                                                        title: '',
                                                                        message: ''
                                                                    });
                                                                    shareSheetRef.current?.present();
                                                                }}
                                                                onUserPress={(username) => {
                                                                    navigation.navigate('UserProfile', { userId: item.userId || username });
                                                                }}
                                                            />
                                                        </View>
                                                    ) : (
                                                        <View style={styles.mediaContainer}>
                                                            <TouchableOpacity
                                                                onPress={() => (navigation as any).navigate('FullscreenImage', {
                                                                    src: item.imageUrl,
                                                                    user: {
                                                                        name: item.username || 'User',
                                                                        username: item.username,
                                                                        avatar: item.avatarUrl || '',
                                                                        isVerified: false
                                                                    },
                                                                    caption: item.text,
                                                                    likes: postsLikesCount[item.id] || item.likes || 0,
                                                                    comments: item.comments || 0,
                                                                    isLiked: likedPosts.has(item.id),
                                                                    onLike: () => handleLikePress(item.id),
                                                                    onComment: () => onCommentPress ? onCommentPress(item) : (navigation as any).navigate('PostDetail', { postId: item.id }),
                                                                    onShare: () => handleShare(item),
                                                                    onUserPress: (username) => {
                                                                        navigation.navigate('UserProfile', { userId: item.userId || username });
                                                                    }
                                                                })}
                                                                activeOpacity={0.9}
                                                                style={[styles.mediaContainer, { alignSelf: 'flex-start', width: 'auto', maxWidth: '100%' }]}
                                                            >
                                                                <Image
                                                                    source={{ uri: item.imageUrl }}
                                                                    style={[styles.postImage, {
                                                                        width: imageDimensions[item.id]?.width || 0,
                                                                        height: imageDimensions[item.id]?.height || 200,
                                                                        opacity: imageDimensions[item.id] ? 1 : 0
                                                                    }]}
                                                                    resizeMode="contain"
                                                                />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )
                                                )}

                                                {/* Link Preview Section */}
                                                {!item.fundraiser && item.previewDetails && (
                                                    <TouchableOpacity
                                                        onPress={() => item.previewDetails?.url && openInAppBrowser(item.previewDetails.url)}
                                                        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: 'white', overflow: 'hidden', marginBottom: 12 }}
                                                        activeOpacity={0.8}
                                                    >
                                                        {item.previewDetails.image && (
                                                            <Image source={{ uri: item.previewDetails.image }} style={{ width: '100%', height: 180 }} resizeMode="contain" />
                                                        )}
                                                        <View style={{ padding: 10 }}>
                                                            {item.previewDetails.site_name && (
                                                                <Text style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', marginBottom: 2, fontFamily: 'Outfit-SemiBold' }}>{item.previewDetails.site_name.toUpperCase()}</Text>
                                                            )}
                                                            {item.previewDetails.title ? (
                                                                <Text style={{ fontSize: 14, fontFamily: 'Outfit-Bold', color: '#111827' }} numberOfLines={2}>{item.previewDetails.title}</Text>
                                                            ) : (
                                                                !item.previewDetails.description && !item.previewDetails.image && item.previewDetails.url && (
                                                                    <Text style={{ fontSize: 13, color: PrimaryBlue, fontFamily: 'Outfit-Medium', marginBottom: 4 }} numberOfLines={1}>{item.previewDetails.url}</Text>
                                                                )
                                                            )}
                                                            {item.previewDetails.description && (
                                                                <Text style={{ fontSize: 13, color: '#4B5563', fontFamily: 'Outfit-Regular', marginTop: 2 }} numberOfLines={2}>{item.previewDetails.description}</Text>
                                                            )}
                                                            {item.previewDetails.domain && (
                                                                <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Outfit-Regular', marginTop: 4 }}>{item.previewDetails.domain}</Text>
                                                            )}
                                                            {!item.previewDetails.title && (item.previewDetails.description || item.previewDetails.image) && item.previewDetails.url && (
                                                                <Text style={{ fontSize: 13, color: PrimaryBlue, fontFamily: 'Outfit-Medium', marginTop: 4 }} numberOfLines={1}>{item.previewDetails.url}</Text>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                )}
                                            </TouchableOpacity>

                                            {/* Footer Interaction Buttons */}
                                            <View style={[styles.postFooter, { marginTop: 0, borderTopWidth: 0, paddingBottom: 6 }]}>
                                                <View style={styles.footerLeft}>
                                                    <TouchableOpacity
                                                        style={styles.footerButton}
                                                        onPress={() => handleLikePress(item.id)}
                                                        disabled={likeMutation.isPending || unlikeMutation.isPending}
                                                    >
                                                        <Heart
                                                            size={18}
                                                            color={likedPosts.has(item.id) ? '#ef4444' : '#374151'}
                                                            fill={likedPosts.has(item.id) ? '#ef4444' : 'none'}
                                                            {...({} as any)}
                                                        />
                                                        <Text style={styles.footerCount}>
                                                            {postsLikesCount[item.id] !== undefined ? postsLikesCount[item.id] : item.likes}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.footerButton}
                                                        onPress={() => onCommentPress && onCommentPress(item)}
                                                    >
                                                        <MessageSquare size={18} color="#374151" />
                                                        <Text style={styles.footerCount}>
                                                            {item.comments || 0} {item.comments === 1 ? 'reply' : 'replies'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        }}
                        ListFooterComponent={renderFooter}
                    />
                )}

                <Modal
                    transparent={true}
                    visible={tooltipVisible}
                    onRequestClose={() => setTooltipVisible(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setTooltipVisible(false)}>
                        <View style={StyleSheet.absoluteFill}>
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <View style={[
                                    styles.tooltip,
                                    {
                                        position: 'absolute',
                                        left: tooltipPosition.x - 100,
                                        top: tooltipPosition.y - 20,
                                    }
                                ]}>
                                    {/* {selectedPost && user?.id && selectedPost.userId && selectedPost.userId === user.id.toString() && ( */}
                                    <TouchableOpacity
                                        style={styles.tooltipItem}
                                        onPress={() => {
                                            setTooltipVisible(false);
                                            deleteBottomSheetRef.current?.present();
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Trash2 size={16} color="#ef4444" />
                                            <Text style={[styles.tooltipText, { color: '#ef4444' }]}>Delete Post</Text>
                                        </View>
                                    </TouchableOpacity>
                                    {/* )} */}
                                    {/* <TouchableOpacity 
                                    style={styles.tooltipItem}
                                    onPress={handleShare}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Share2 size={16} color={PrimaryGrey} />
                                        <Text style={styles.tooltipText}>Share Post</Text>
                                    </View>
                                </TouchableOpacity> */}
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <SocialShare
                    visible={shareModalVisible}
                    onClose={() => setShareModalVisible(false)}
                    title={selectedPost?.username + "'s post"}
                    message={selectedPost?.text || ''}
                    url={selectedPost?.imageUrl}
                />

                {/* Delete Confirmation Dialog removed and replaced with BottomSheet below */}

            </View >
            <SharePost
                ref={shareSheetRef}
                url={shareData.url}
                title={shareData.title}
                message={shareData.message}
                entityId={selectedPost?.fundraiser ? selectedPost.fundraiser.id : selectedPost?.id}
                entityType={selectedPost?.fundraiser ? 'fundraiser' : 'post'}
            />

            <DeletePostBottomSheet
                ref={deleteBottomSheetRef}
                onDelete={() => {
                    if (selectedPost) {
                        deletePostMutation.mutate(selectedPost.id);
                    }
                }}
                onCancel={() => deleteBottomSheetRef.current?.dismiss()}
                isDeleting={deletePostMutation.isPending}
            />
        </>
    );
}

const styles = StyleSheet.create({
    postCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        // marginHorizontal: 4,
        marginBottom: 16,
        // padding: 16,
        // borderWidth: 1,
        // borderColor: '#e5e7eb',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    avatarContainer: {
        marginRight: 0,
    },
    headerInfo: {
        flex: 1,
    },
    headerTop: {
        // flexDirection: 'row',
        // alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
    },
    username: {
        fontSize: 15,
        // fontWeight: '600',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    date: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'Outfit-Regular',
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '500',
        color: 'white',
        fontFamily: 'Outfit-Medium',
    },
    menuButton: {
        padding: 4,
    },
    fundraiserMenu: {
        position: 'absolute',
        right: 0,
        top: 28,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 160,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    fundraiserMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    fundraiserMenuText: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'Outfit-Regular',
    },
    fundraiserMenuTextDanger: {
        color: '#DC2626',
    },
    fundraiserMenuDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    postText: {
        fontSize: 15,
        color: '#111827',
        lineHeight: 20,
        marginBottom: 12,
        fontFamily: 'Outfit-Regular',
    },
    mediaContainer: {
        width: '100%',
        borderRadius: 8,
        backgroundColor: 'white',
        overflow: 'hidden',
        marginBottom: 6,
    },
    postImage: {
        height: 200,
        borderRadius: 8,
    },
    mediaPlaceholder: {
        width: '100%',
        height: 300,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIconText: {
        fontSize: 48,
        fontFamily: 'Outfit-Bold',
    },
    previewContent: {
        padding: 12,
    },
    previewSiteName: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
        fontFamily: 'Outfit-SemiBold',
    },
    previewTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
        fontFamily: 'Outfit-SemiBold',
    },
    previewDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
        fontFamily: 'Outfit-Regular',
    },
    previewDomain: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'Outfit-Regular',
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        paddingVertical: 3,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerCount: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'Outfit-Regular',
    },
    shareButton: {
        padding: 4,
    },
    container: {
        flexDirection: 'row',
        paddingVertical: 16,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5'
    },
    tooltip: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: 160,
    },
    tooltipItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    tooltipText: {
        fontSize: 14,
        color: '#111',
        fontFamily: 'Outfit-Medium',
    },
    loadMoreButton: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: PrimaryBlue,
    },
    loadMoreText: {
        color: PrimaryBlue,
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Outfit-Medium',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: PrimaryGrey,
        fontFamily: 'Outfit-Regular',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        marginVertical: 16,
    },
    errorText: {
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
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
    founderBadge: {
        backgroundColor: '#1600ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    founderBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Outfit-Bold',
    },
    startedFundraiserText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        fontFamily: 'Outfit-Regular',
    },
});