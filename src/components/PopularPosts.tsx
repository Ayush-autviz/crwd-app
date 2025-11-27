import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, StyleSheet, Modal, Pressable, ActivityIndicator, Alert, Share, TouchableWithoutFeedback, Clipboard, Linking } from 'react-native'
import React, { useState, useEffect } from 'react'
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors'
import { Ellipsis, Heart, MessageCircle, Trash2, Share2 } from 'lucide-react-native'
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native'
import SocialShare from './SocialShare'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { likePost, unlikePost, deletePost } from '../services/api/social'
import { useToast } from '../contexts/ToastContext'
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar'
import { useAuthStore } from '../store/store'
import { WEB_BASE_URL } from '../Constants/url'


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
    previewDetails?: PreviewDetails | null;
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
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
    error?: any;
}

type RootStackParamList = {
        PostDetail: { post: Post };
        UserProfile: { userId: string };
        Profile: undefined;
        GroupCRWD: { collectiveId: string };
};

export default function PopularPosts({
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
    error = null
}: PopularPostsProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const screenWidth = Dimensions.get('window').width;
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [postsLikesCount, setPostsLikesCount] = useState<Record<string, number>>({});

    const queryClient = useQueryClient();
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
        onSuccess: (data, postId) => {
            setLikedPosts(prev => new Set([...prev, postId]));
            setPostsLikesCount(prev => ({
                ...prev,
                [postId]: (prev[postId] || 0) + 1
            }));
            showToast('Post liked!', 2000);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
        onError: (error) => {
            console.error('Error liking post:', error);
            showToast('Failed to like post', 2000);
        },
    });

    // Unlike post mutation
    const unlikeMutation = useMutation({
        mutationFn: unlikePost,
        onSuccess: (data, postId) => {
            setLikedPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
            setPostsLikesCount(prev => ({
                ...prev,
                [postId]: Math.max((prev[postId] || 1) - 1, 0)
            }));
            showToast('Post unliked!', 2000);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
        onError: (error) => {
            console.error('Error unliking post:', error);
            showToast('Failed to unlike post', 2000);
        },
    });

    // Delete post mutation
    const deletePostMutation = useMutation({
        mutationFn: deletePost,
        onSuccess: () => {
            showToast('Post deleted successfully!', 2000);
            setDeleteConfirmVisible(false);
            setTooltipVisible(false);
            setSelectedPost(null);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
        onError: (error) => {
            console.error('Error deleting post:', error);
            showToast('Failed to delete post', 2000);
            setDeleteConfirmVisible(false);
        },
    });

    // Initialize liked posts state based on posts data
    useEffect(() => {
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
        setTooltipPosition({ x: pageX-50, y: pageY+30 });
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

    const handleShare = async (postId?: string) => {
        try {
            let webUrl = '';
            let shareMessage = '';
            let shareTitle = '';



            if (postId) {
                // Share post
                webUrl = `${WEB_BASE_URL}/post/${postId}`;
                shareMessage = `Check out this post: ${webUrl}`;
                shareTitle = 'Post';
            } else if (user?.id) {
                // Share profile
                webUrl = `${WEB_BASE_URL}/user-profile/${user.id}`;
                shareMessage = `Check out my profile!\n${webUrl}`;
                shareTitle = 'My Profile';
            }

            if (webUrl) {
                const result = await Share.share({
                    message: shareMessage,
                    title: shareTitle,
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
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to share');
        } finally {
            setTooltipVisible(false);
        }
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
        <View style={{marginTop: 20, marginBottom: 50}}>
            {showTitle && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{fontSize: 18, fontWeight: '600'}}>{related ? 'Related Posts' : title}</Text>
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
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>?</Text>
                        </View>
                    </TouchableOpacity>
                    </View>
                    {postButton && (
                    <TouchableOpacity
                        onPress={handleStartConversation}
                        style={{ padding: 8, backgroundColor: SecondaryGrey, borderRadius: 8 }}
                    >
                        <Text style={{ fontSize: 14,}}>Start a Conversation</Text>
                    </TouchableOpacity>
                    )}
                </View>
            )}

            {subheading && <Text style={{fontSize: 12, fontStyle: 'italic', color: 'grey', marginBottom: 8}}>Members share updates, questions and articles here.</Text>}

            {/* Loading State */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                    <Text style={styles.loadingText}>Loading posts...</Text>
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
            {showTooltip && showTitle && (
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
                        fontWeight: '500',
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
            {!isLoading && !error && (
            <FlatList
                data={posts}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item }) => {
                    // Generate consistent color based on username
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
                    const colorIndex = (item.username?.charCodeAt(0) || 0) % avatarColors.length;
                    const avatarBgColor = avatarColors[colorIndex];
                    
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
                    <View style={styles.postCard}>
                        {/* Header */}
                        <View style={styles.postHeader}>
                            <TouchableOpacity 
                                onPress={() => {
                                    // If it's the current user's own profile, navigate to Profile tab
                                    // Otherwise navigate to UserProfile page
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
                                                                        routes: [{ name: 'Me' }],
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
                                    <AvatarFallback style={{ backgroundColor: avatarBgColor }} textStyle={{ color: 'white', fontWeight: '600' }}>
                                        {item.username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                            </TouchableOpacity>
                            <View style={styles.headerInfo}>
                                <View style={styles.headerTop}>
                                    <Text style={styles.username}>{item.username}</Text>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                                    <Text style={styles.date}>{item.time}</Text>
                                    {item.org && (
                                        <View style={[styles.tag, { backgroundColor: tagBgColor }]}>
                                            <Text style={styles.tagText}>{item.org}</Text>
                                        </View>
                                    )}
                                    </View>
                                </View>
                            </View>
                            {user?.id && user.id.toString() === item.userId?.toString() && (
                            <TouchableOpacity 
                                onPress={(event) => handleEllipsisPress(event, item)}
                                style={styles.menuButton}
                            >
                                <Ellipsis size={20} color="#6b7280" />
                            </TouchableOpacity>
                            )}
                        </View>

                        {/* Content */}
                        <TouchableOpacity 
                            onPress={() => handlePostPress(item)}
                            activeOpacity={1}
                        >
                            <Text style={styles.postText}>{item.text}</Text>
                            
                            {/* Media Section - Only show if there's actual media content */}
                            {item.previewDetails && (item.previewDetails.image || item.previewDetails.title || item.previewDetails.description) ? (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        if (item.previewDetails?.url) {
                                            Linking.openURL(item.previewDetails.url).catch(err => {
                                                console.error('Failed to open URL:', err);
                                                Alert.alert('Error', 'Failed to open link');
                                            });
                                        }
                                    }}
                                    activeOpacity={0.7}
                                    style={styles.mediaContainer}
                                >
                                    {item.previewDetails.image && (
                                        <Image
                                            source={{ uri: item.previewDetails.image }}
                                            style={styles.mediaImage}
                                            resizeMode="cover"
                                        />
                                    )}
                                    <View style={styles.previewContent}>
                                        {item.previewDetails.site_name && (
                                            <Text style={styles.previewSiteName}>
                                                {item.previewDetails.site_name.toUpperCase()}
                                            </Text>
                                        )}
                                        {item.previewDetails.title && (
                                            <Text style={styles.previewTitle} numberOfLines={2}>
                                                {item.previewDetails.title}
                                            </Text>
                                        )}
                                        {item.previewDetails.description && (
                                            <Text style={styles.previewDescription} numberOfLines={2}>
                                                {item.previewDetails.description}
                                            </Text>
                                        )}
                                        {item.previewDetails.domain && (
                                            <Text style={styles.previewDomain} numberOfLines={1}>
                                                {item.previewDetails.domain}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ) : item.imageUrl ? (
                                <Image 
                                    source={{ uri: item.imageUrl }} 
                                    style={styles.mediaImage}
                                    resizeMode="cover"
                                />
                            ) : null}

                            {/* Footer */}
                            <View style={styles.postFooter}>
                                <View style={styles.footerLeft}>
                                    <TouchableOpacity 
                                        style={styles.footerButton}
                                        onPress={() => handleLikePress(item.id)}
                                        disabled={likeMutation.isPending || unlikeMutation.isPending}
                                    >
                                        <Heart 
                                            size={18} 
                                            color={likedPosts.has(item.id) ? '#ef4444' : '#6b7280'}
                                            fill={likedPosts.has(item.id) ? '#ef4444' : 'none'}
                                        />
                                        <Text style={styles.footerCount}>
                                            {postsLikesCount[item.id] !== undefined ? postsLikesCount[item.id] : item.likes}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.footerButton}>
                                        <MessageCircle size={18} color="#6b7280" />
                                        <Text style={styles.footerCount}>{item.comments}</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => {
                                        setSelectedPost(item);
                                        handleShare(item.id);
                                    }}
                                    style={styles.shareButton}
                                >
                                    <Share2 size={18} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
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
                        <TouchableWithoutFeedback onPress={() => {}}>
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
                                        setDeleteConfirmVisible(true);
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

            {/* Delete Confirmation Dialog */}
            <Modal
                visible={deleteConfirmVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteConfirmVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setDeleteConfirmVisible(false)}>
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20
                    }}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View style={{
                                backgroundColor: 'white',
                                borderRadius: 12,
                                padding: 20,
                                width: '100%',
                                maxWidth: 400
                            }}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: 8
                                }}>
                                    Delete Post
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    color: '#6b7280',
                                    marginBottom: 20
                                }}>
                                    Are you sure you want to delete this post? This action cannot be undone.
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    gap: 12
                                }}>
                                    <TouchableOpacity
                                        onPress={() => setDeleteConfirmVisible(false)}
                                        disabled={deletePostMutation.isPending}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            borderRadius: 6,
                                            borderWidth: 1,
                                            borderColor: '#e5e7eb',
                                            opacity: deletePostMutation.isPending ? 0.5 : 1
                                        }}
                                    >
                                        <Text style={{ color: '#111827', fontSize: 14, fontWeight: '500' }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (selectedPost) {
                                                deletePostMutation.mutate(selectedPost.id);
                                            }
                                        }}
                                        disabled={deletePostMutation.isPending}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            borderRadius: 6,
                                            backgroundColor: '#ef4444',
                                            opacity: deletePostMutation.isPending ? 0.5 : 1
                                        }}
                                    >
                                        {deletePostMutation.isPending ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <ActivityIndicator size="small" color="white" />
                                                <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                                                    Deleting...
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                                                Delete
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    postCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 4,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#595959',
        shadowOffset: {
            width: 2,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
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
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    date: {
        fontSize: 12,
        color: '#6b7280',
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
    },
    menuButton: {
        padding: 4,
    },
    postText: {
        fontSize: 14,
        color: '#111827',
        lineHeight: 20,
        marginBottom: 12,
    },
    mediaContainer: {
        width: '100%',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: 'white',
        overflow: 'hidden',
        marginBottom: 12,
    },
    mediaImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    mediaPlaceholder: {
        width: '100%',
        height: 200,
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
    },
    previewContent: {
        padding: 12,
    },
    previewSiteName: {
        fontSize: 10,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    previewDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    previewDomain: {
        fontSize: 11,
        color: '#6b7280',
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
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
        color: '#6b7280',
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
        color: '#dc2626',
        textAlign: 'center',
    }
});