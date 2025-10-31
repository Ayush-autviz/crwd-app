import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, StyleSheet, Modal, Pressable, ActivityIndicator, Alert, Share, TouchableWithoutFeedback } from 'react-native'
import React, { useState, useEffect } from 'react'
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors'
import { Ellipsis, Heart, MessageCircle, Flag, Trash2, Share2 } from 'lucide-react-native'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import SocialShare from './SocialShare'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { likePost, unlikePost } from '../services/api/social'
import { useToast } from '../contexts/ToastContext'
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar'

interface Post {
    id: string;
    username: string;
    avatarUrl: string;
    time: string;
    org: string;
    text: string;
    imageUrl?: string;
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
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [postsLikesCount, setPostsLikesCount] = useState<Record<string, number>>({});

    const queryClient = useQueryClient();
    const { showToast } = useToast();

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
        setIsLoading(true);
        try {
            await onLoadMore();
        } catch (error) {
            console.error('Error loading more posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
 
        try {
        // setTooltipVisible(false);

            const result = await Share.share({
                message: `Check out my profile!`,
                title: `My Profile`,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share profile');
        }
        finally {
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
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.container}
                        onPress={() => handlePostPress(item)}
                    >
                        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}>
                            {/* <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} /> */}
                            <Avatar size={40}>
                                <AvatarImage src={item.avatarUrl} />
                                <AvatarFallback>
                                    {item.username.split(' ')[0][0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500' }}>{item.username}</Text>
                                    <Text style={{ fontSize: 14, color: PrimaryGrey }}>•</Text>
                                    <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.time}</Text>
                                </View>
                                <TouchableOpacity onPress={(event) => handleEllipsisPress(event, item)}>
                                    <Ellipsis size={18} color={PrimaryGrey} />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 12, color: PrimaryBlue }}>{item.org}</Text>
                            <Text ellipsizeMode='tail' style={{ fontSize: 14, fontWeight: '400', flexWrap: 'wrap', width: screenWidth - 120, marginTop: 5 }} numberOfLines={3}>{item.text}</Text>
                            { item.imageUrl && <Image source={{ uri: item.imageUrl }} style={{ width: screenWidth - 120, height: 150, borderRadius: 10, marginTop: 10 }} />}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: screenWidth - 120, gap: 10, marginTop: 10 }}>
                                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                    <TouchableOpacity 
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                                        onPress={() => handleLikePress(item.id)}
                                        disabled={likeMutation.isPending || unlikeMutation.isPending}
                                    >
                                        <Heart 
                                            size={18} 
                                            color={likedPosts.has(item.id) ? '#ef4444' : PrimaryGrey}
                                            fill={likedPosts.has(item.id) ? '#ef4444' : 'none'}
                                        />
                                        <Text style={{ color: PrimaryGrey }}>
                                            {postsLikesCount[item.id] !== undefined ? postsLikesCount[item.id] : item.likes}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <MessageCircle size={18} color={PrimaryGrey} />
                                        <Text style={{ color: '#808080' }}>{item.comments}</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={require('../assets/icons/forward.png')} style={{ width: 18, height: 18 }} />
                                    
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
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
                                {showDelete && (
                                <TouchableOpacity 
                                    style={styles.tooltipItem}
                                    onPress={() => {
                                        // Handle delete post
                                        setTooltipVisible(false)
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Trash2 size={16} color="#ef4444" />
                                        <Text style={[styles.tooltipText, { color: '#ef4444' }]}>Delete Post</Text>
                                    </View>
                                </TouchableOpacity>
                                )}
                                <TouchableOpacity 
                                    style={styles.tooltipItem}
                                    onPress={handleShare}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Share2 size={16} color={PrimaryGrey} />
                                        <Text style={styles.tooltipText}>Share Post</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.tooltipItem}
                                    onPress={() => {
                                        // Handle report post
                                        setTooltipVisible(false)
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Flag size={16} color={PrimaryGrey} />
                                        <Text style={styles.tooltipText}>Report Post</Text>
                                    </View>
                                </TouchableOpacity>
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
        </View>
    )
}

const styles = StyleSheet.create({
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