import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Share, Dimensions, Modal, Pressable, TouchableWithoutFeedback, ActivityIndicator, Linking, Alert, BackHandler, Keyboard } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { useInAppBrowser } from '../hooks/useInAppBrowser'
import { Heart, MessageCircle, ChevronRight, Trash2, Ellipsis, X } from 'lucide-react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import DiscardBottomSheet from '../components/ui/DiscardBottomSheet'
import { useNavigation, useRoute, useFocusEffect, NavigationProp, CommonActions, usePreventRemove } from '@react-navigation/native'
import { useToast } from '../contexts/ToastContext'
import { formatDistanceToNow } from 'date-fns'
import { getPostById, getPostComments, createPostComment, getCommentReplies, likePost, unlikePost, likeComment, unlikeComment, deleteComment, mentionSearch } from '../services/api/social'
import { useAuthStore } from '../store/store'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'
import { MentionInput } from '../components/post/MentionInput'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface CommentData {
  id: number;
  username: string;
  avatarUrl: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: CommentData[];
  repliesCount?: number;
  parentComment?: number;
  isLiked?: boolean;
  userId?: string | number; // User ID to check if comment belongs to current user
  color?: string;
  mentions?: any[];
}

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
  text: string;
  username: string;
  avatarUrl: string;
  imageUrl?: string;
  previewDetails?: PreviewDetails | null;
  time: string;
  org: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  created_at?: string;
  timestamp?: string | Date;
  user?: {
    id: string;
    username: string;
    profile_picture: string;
    color: string;
  };
  collective?: {
    id: string;
    name: string;
  };
  mentions?: any[];
}

interface RouteParams {
  post: Post;
}

// Removed static comments - now using API data only


type RootStackParamList = {
  UserProfile: { userId: any };
  PostDetail: { post: Post };
};

export default function PostDetail() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute()
  const { showToast } = useToast()
  const { user: currentUser } = useAuthStore()
  const { openInAppBrowser } = useInAppBrowser()
  const queryClient = useQueryClient()

  // Helper function for avatar colors
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  // Get post ID from route params
  const postId = (route.params as any)?.postId || (route.params as RouteParams)?.post?.id
  console.log('PostDetail - Post ID:', postId)

  const [comment, setComment] = useState('')
  const screenWidth = Dimensions.get('window').width
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set())
  const discardSheetRef = React.useRef<BottomSheetModal>(null)
  const [isConfirmedDiscard, setIsConfirmedDiscard] = useState(false)
  const [pendingAction, setPendingAction] = useState<any>(null)
  const [imageWidth, setImageWidth] = useState<number | null>(null)
  const [previewImageWidth, setPreviewImageWidth] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)

  // Fetch post data using API
  const { data: postData, isLoading: isLoadingPost, error: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId || ''),
    enabled: !!postId,
  });

  // Transform API response to Post format
  const post: Post | undefined = postData ? {
    id: postData.id,
    text: postData.content || '',
    username: postData.user?.full_name || (postData.user?.first_name && postData.user?.last_name ? `${postData.user.first_name} ${postData.user.last_name}` : null) || postData.user?.username || 'Unknown User',
    avatarUrl: postData.user?.profile_picture,
    imageUrl: postData.media || undefined,
    previewDetails: postData.preview_details || null,
    time: postData.created_at || new Date().toISOString(), // Pass raw timestamp for proper relative time calculation
    created_at: postData.created_at, // Also include created_at for ProfileActivityCard to use
    timestamp: postData.created_at, // Include timestamp as well
    org: postData.collective?.name || 'Feed',
    likes: postData.likes_count || 0,
    comments: postData.comments_count || 0,
    shares: 0,
    isLiked: postData.is_liked || false,
    user: {
      id: postData.user?.id?.toString() || '',
      username: postData.user?.username || postData.user?.full_name || 'Unknown User',
      profile_picture: postData.user?.profile_picture || '',
      color: postData.user?.color || stringToColor(postData.user?.username || postData.user?.full_name || 'Unknown User'),
    },
    collective: {
      id: postData.collective?.id?.toString() || '',
      name: postData.collective?.name || 'Unknown Collective',
    },
    mentions: postData.mentions || [],
  } : (route.params as RouteParams)?.post;

  // Fetch comments for the post with infinite query
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['postComments', postId],
    queryFn: ({ pageParam = 1 }) => getPostComments(postId || '', pageParam),
    enabled: !!postId,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const match = lastPage.next.match(/[?&]page=(\d+)/);
        return match ? parseInt(match[1]) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // Calculate image sizes
  useEffect(() => {
    if (post?.imageUrl) {
      Image.getSize(
        post.imageUrl,
        (width, height) => {
          const calculatedWidth = (200 * width) / height;
          setImageWidth(Math.min(calculatedWidth, screenWidth - 40)); // padding 20 on each side
        },
        (error) => console.log('Image size error', error)
      );
    }
  }, [post?.imageUrl, screenWidth]);

  useEffect(() => {
    if (post?.previewDetails?.image) {
      Image.getSize(
        post.previewDetails.image,
        (width, height) => {
          const calculatedWidth = (200 * width) / height;
          setPreviewImageWidth(Math.min(calculatedWidth, screenWidth - 42)); // padding + border
        },
        (error) => console.log('Preview image size error', error)
      );
    }
  }, [post?.previewDetails?.image, screenWidth]);

  // Transform API comments to CommentData format
  const apiComments = React.useMemo(() => {
    if (!commentsData?.pages) return [];

    return commentsData.pages.flatMap(page =>
      (page.results || []).map((comment: any) => ({
        id: comment.id,
        username: comment.user?.full_name || (comment.user?.first_name && comment.user?.last_name ? `${comment.user.first_name} ${comment.user.last_name}` : null) || comment.user?.username || 'Unknown User',
        avatarUrl: comment.user?.profile_picture,
        color: comment.user?.color || stringToColor(comment.user?.full_name || (comment.user?.first_name && comment.user?.last_name ? `${comment.user.first_name} ${comment.user.last_name}` : null) || comment.user?.username || 'Unknown User'),
        content: comment.content,
        timestamp: new Date(comment.created_at),
        likes: comment.likes_count || 0,
        replies: [],
        repliesCount: comment.replies_count || 0,
        parentComment: comment.parent_comment,
        isLiked: comment.is_liked || false,
        userId: comment.user?.id?.toString(),
        mentions: comment.mentions,
      }))
    );
  }, [commentsData]);

  // Use API comments only
  const [comments, setComments] = useState<CommentData[]>(apiComments);
  const [replyingTo, setReplyingTo] = useState<CommentData | null>(null);

  // Update comments when API data changes
  React.useEffect(() => {
    if (apiComments.length > 0) {
      setComments(apiComments);
    }
  }, [apiComments, postId]);

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; mentions?: any[] }) => createPostComment(postId || '', { content: data.content, mentions: data.mentions }),
    onSuccess: () => {
      setReplyingTo(null);
      // showToast('Comment added successfully!', 3000);
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
    },
    onError: () => {
      showToast('Failed to add comment. Please try again.', 3000);
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: number; data: { content: string; mentions?: any[] } }) =>
      createPostComment(postId || '', { content: data.content, parent_comment_id: commentId, mentions: data.mentions }),
    onSuccess: () => {
      // showToast('Reply added successfully!', 3000);
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      // Fetch replies for the parent comment to ensure they are displayed
      // We need to find the top-level parent if this was a nested reply, or just the parent
      // For simplicity, we just invalidate queries which should refresh the list
      // But we might want to expand the parent
      setReplyingTo(null);
    },
    onError: () => {
      showToast('Failed to add reply. Please try again.', 3000);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      // showToast('Comment deleted successfully!', 2000);
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      // Also invalidate the post query to update comment count
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: () => {
      showToast('Failed to delete comment. Please try again.', 2000);
    },
  });

  const handleAddComment = (content: string, mentions: any[]) => {
    if (content.trim()) {
      // Create a set for easy lookup
      const mentionIds = new Set(mentions.map(m => m.id));

      let finalMentions = [...mentions];

      // Implicitly add reply target
      if (replyingTo) {
        const targetId = replyingTo.userId || replyingTo.id;
        if (!mentionIds.has(targetId)) {
          finalMentions.push({ type: 'user', id: targetId });
        }
        createReplyMutation.mutate({ commentId: replyingTo.id, data: { content: content.trim(), mentions: finalMentions } });
      } else {
        createCommentMutation.mutate({ content: content.trim(), mentions: finalMentions });
      }
    }
  };

  const handleReplyAction = (commentId: number) => {
    // Find the comment object
    const findComment = (commentsList: CommentData[]): CommentData | undefined => {
      for (const c of commentsList) {
        if (c.id === commentId) return c;
        if (c.replies && c.replies.length > 0) {
          const found = findComment(c.replies);
          if (found) return found;
        }
      }
      return undefined;
    };

    const targetComment = findComment(comments);

    if (targetComment) {
      setReplyingTo(targetComment);
    }
  };

  // Like/Unlike post mutations
  const likePostMutation = useMutation({
    mutationFn: () => likePost(postId || ''),
    onSuccess: () => {
      // showToast('Post liked!', 3000);
      queryClient.invalidateQueries({ queryKey: ['posts', post.collective?.id] });
      queryClient.invalidateQueries({ queryKey: ['communityUpdatesPosts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: () => {
      showToast('Failed to like post', 3000);
    },
  });

  const unlikePostMutation = useMutation({
    mutationFn: () => unlikePost(postId || ''),
    onSuccess: () => {
      // showToast('Post unliked!', 3000);
      queryClient.invalidateQueries({ queryKey: ['posts', post.collective?.id] });
      queryClient.invalidateQueries({ queryKey: ['communityUpdatesPosts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: () => {
      showToast('Failed to unlike post', 3000);
    },
  });

  const handlePostLike = () => {
    if (post?.isLiked) {
      unlikePostMutation.mutate();
    } else {
      likePostMutation.mutate();
    }
  };

  // Comment like/unlike mutations
  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => likeComment(commentId),
    onSuccess: () => {
      // showToast('Comment liked!', 3000);
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
    },
    onError: () => {
      showToast('Failed to like comment', 3000);
    },
  });

  const unlikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => unlikeComment(commentId),
    onSuccess: () => {
      // showToast('Comment unliked!', 3000);
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
    },
    onError: () => {
      showToast('Failed to unlike comment', 3000);
    },
  });

  const handleCommentLike = (commentId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment?.isLiked) {
      unlikeCommentMutation.mutate(commentId.toString());
    } else {
      likeCommentMutation.mutate(commentId.toString());
    }
  };

  const renderCommentContent = (content: string, mentions: any[] = []) => {
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

    const pattern = triggers.length > 0
      ? `(${triggers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|@\\w+)`
      : '(@\\w+)';
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
              if (currentUser?.id && targetId && currentUser.id.toString() === targetId.toString()) {
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

  // Comment component definition
  const Comment = ({
    comment,
    onReply,
    onLike,
    onToggleReplies,
    onFetchReplies,
    onDelete,
    isExpanded = false,
    isLoadingReplies = false,
    level = 0
  }: {
    comment: CommentData;
    onReply: (commentId: number) => void;
    onLike: (commentId: number) => void;
    onToggleReplies?: (commentId: number) => void;
    onFetchReplies?: (commentId: number) => void;
    onDelete?: (commentId: number) => void;
    isExpanded?: boolean;
    isLoadingReplies?: boolean;
    level?: number;
  }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isOwnComment = currentUser?.id && comment.userId && (currentUser.id.toString() === comment.userId.toString());

    const handleReplyClick = () => {
      onReply(comment.id);
    };

    const handleLike = () => {
      onLike(comment.id);
    };

    const handleToggleReplies = () => {
      if (onToggleReplies) {
        onToggleReplies(comment.id);
      }
    };

    return (
      <View style={{ marginLeft: level * 20 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          {/* <Image 
            source={{ uri: comment.avatarUrl }} 
            style={{ width: 32, height: 32, borderRadius: 16 }} 
          /> */}
          <TouchableOpacity onPress={() => {
            // If it's the current user's own profile, navigate to Profile tab
            // Otherwise navigate to UserProfile page
            if (currentUser?.id && comment.userId && currentUser.id.toString() === comment.userId.toString()) {
              // Profile is in Tab Navigator (MainTabs) within DrawerNav
              // Use reset to properly navigate to the Me tab
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
                              routes: [{ name: 'Me' as never }],
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
            } else if (comment.userId) {
              (navigation as any).navigate('UserProfile', { userId: comment.userId.toString() });
            }
          }}>
            <Avatar size={40}>
              <AvatarImage src={comment.avatarUrl} />
              <AvatarFallback style={{ backgroundColor: comment.color || stringToColor(comment.username) }} textStyle={{ color: 'white' }}>
                {comment.username.split(' ')[0][0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: LightGrey, padding: 12, borderRadius: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <TouchableOpacity onPress={() => {
                  // If it's the current user's own profile, navigate to Profile tab
                  // Otherwise navigate to UserProfile page
                  if (currentUser?.id && comment.userId && currentUser.id.toString() === comment.userId.toString()) {
                    // Profile is in Tab Navigator (MainTabs) within DrawerNav
                    // Use reset to properly navigate to the Me tab
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
                                    routes: [{ name: 'Me' as never }],
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
                  } else if (comment.userId) {
                    (navigation as any).navigate('UserProfile', { userId: comment.userId.toString() });
                  }
                }}>
                  <Text style={{ fontFamily: 'Outfit-Bold', fontWeight: '700', fontSize: 15, color: '#111827' }}>{comment.username}</Text>
                </TouchableOpacity>
                {isOwnComment && (
                  <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                      onPress={() => setShowMenu(!showMenu)}
                      style={{ padding: 4 }}
                    >
                      <Ellipsis size={16} color={PrimaryGrey} />
                    </TouchableOpacity>
                    {showMenu && (
                      <View style={{
                        position: 'absolute',
                        right: 0,
                        top: 24,
                        backgroundColor: 'white',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 5,
                        zIndex: 10,
                        minWidth: 120
                      }}>
                        <TouchableOpacity
                          onPress={() => {
                            setShowMenu(false);
                            setShowDeleteConfirm(true);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10
                          }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                          <Text style={{ fontSize: 14, color: '#ef4444', fontWeight: '500' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 15, fontFamily: 'Outfit-Regular', color: '#111827', lineHeight: 20 }}>
                {renderCommentContent(comment.content, comment.mentions)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <Text style={{ fontSize: 14, color: PrimaryGrey, fontFamily: 'Outfit-Regular' }}>
                {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
              </Text>
              {/* <button
              onClick={handleLike}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`} />
              {likes}
            </button> */}
              {/* Only show reply button for main comments (not replies) */}
              <TouchableOpacity
                onPress={handleReplyClick}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <MessageCircle size={16} color={PrimaryGrey} />
                <Text style={{ fontSize: 12, color: PrimaryGrey }}>Reply</Text>
              </TouchableOpacity>
              {comment.repliesCount && comment.repliesCount > 0 && (
                <TouchableOpacity
                  onPress={handleToggleReplies}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <ChevronRight
                    size={16}
                    color={PrimaryGrey}
                    style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                  />
                  <Text style={{ fontSize: 12, color: PrimaryGrey }}>
                    {isLoadingReplies ? 'Loading...' : `View ${comment.repliesCount} ${comment.repliesCount === 1 ? 'reply' : 'replies'}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Render replies if expanded */}
            {isExpanded && comment.replies && comment.replies.length > 0 && (
              <View style={{ marginTop: 12 }}>
                {comment.replies.map((reply) => (
                  <Comment
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    onLike={onLike}
                    onToggleReplies={onToggleReplies}
                    onFetchReplies={onFetchReplies}
                    onDelete={onDelete}
                    isExpanded={false}
                    isLoadingReplies={false}
                    level={level + 1}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Delete Confirmation Dialog */}
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDeleteConfirm(false)}>
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20
            }}>
              <TouchableWithoutFeedback onPress={() => { }}>
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
                    Delete Comment
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#6b7280',
                    marginBottom: 20
                  }}>
                    Are you sure you want to delete this comment? This action cannot be undone.
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 12
                  }}>
                    <TouchableOpacity
                      onPress={() => setShowDeleteConfirm(false)}
                      disabled={false}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#e5e7eb'
                      }}
                    >
                      <Text style={{ color: '#111827', fontSize: 14, fontWeight: '500' }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (onDelete) {
                          onDelete(comment.id);
                        }
                        setShowDeleteConfirm(false);
                        setShowMenu(false);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 6,
                        backgroundColor: '#ef4444'
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId.toString());
    // Remove comment from local state
    setComments(prev => {
      // First, try to remove it as a main comment
      const filteredComments = prev.filter(c => c.id !== commentId);

      // If not found, it might be a reply - remove from parent comment's replies
      if (filteredComments.length === prev.length) {
        return prev.map(comment => ({
          ...comment,
          replies: comment.replies.filter(reply => reply.id !== commentId),
          repliesCount: comment.replies.filter(reply => reply.id !== commentId).length,
        }));
      }

      return filteredComments;
    });
  };

  const fetchReplies = async (commentId: number) => {
    setLoadingReplies(prev => new Set(prev).add(commentId));
    try {
      const repliesData = await getCommentReplies(commentId.toString());

      // Support multiple possible response shapes: {replies: [...]}, {results: [...]}, or a bare array
      const repliesArray =
        repliesData?.replies ||
        repliesData?.results ||
        (Array.isArray(repliesData) ? repliesData : []);

      const transformedReplies: CommentData[] = repliesArray.map((reply: any) => ({
        id: reply.id,
        username: reply.user?.full_name ||
          (reply.user?.first_name && reply.user?.last_name
            ? `${reply.user.first_name} ${reply.user.last_name}`
            : null) ||
          reply.user?.username ||
          'Unknown User',
        avatarUrl: reply.user?.profile_picture,
        content: reply.content,
        timestamp: new Date(reply.created_at),
        color: reply.user?.color || stringToColor(
          reply.user?.full_name ||
          (reply.user?.first_name && reply.user?.last_name
            ? `${reply.user.first_name} ${reply.user.last_name}`
            : null) ||
          reply.user?.username ||
          'Unknown User'
        ),
        likes: reply.likes_count || 0,
        replies: [],
        repliesCount: reply.replies_count || 0,
        parentComment: commentId,
        isLiked: reply.is_liked || false,
        userId: reply.user?.id?.toString(),
        mentions: reply.mentions,
      })) || [];

      setComments(prev => prev.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: transformedReplies }
          : comment
      ));
    } catch (error) {
      console.error('Error fetching replies:', error);
      showToast('Failed to load replies', 3000);
    } finally {
      setLoadingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const toggleReplies = (commentId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    if (expandedComments.has(commentId)) {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      setExpandedComments(prev => new Set(prev).add(commentId));
      if ((comment.replies?.length || 0) === 0 && (comment.repliesCount || 0) > 0) {
        fetchReplies(commentId);
      }
    }
  };

  // Handle back button and navigation
  // Navigation guard - using usePreventRemove for better compatibility (e.g. iOS back button)
  usePreventRemove(
    !!comment.trim() && !isConfirmedDiscard,
    (e) => {
      Keyboard.dismiss();
      setPendingAction(e.data.action);
      discardSheetRef.current?.present();
    }
  );

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (comment.trim() && !isConfirmedDiscard) {
        Keyboard.dismiss();
        // Trigger navigation back which will be caught by beforeRemove
        navigation.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [comment, isConfirmedDiscard, navigation]);

  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
    setComment('');
    navigation.goBack();
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      const result = await Share.share({
        message: post.text,
        title: `Post by ${post.username}`,
      });

      if (result.action === Share.sharedAction) {
        // showToast('Post shared successfully!');
      }
    } catch (error) {
      showToast('Failed to share post');
      console.error('Error sharing:', error);
    }
  };





  // Loading state
  if (isLoadingPost) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
        <MainHeaderNav show menu={false} title={'Post'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <Text style={{ marginTop: 16, color: PrimaryGrey }}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Error state
  if (postError) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
        <MainHeaderNav show menu={false} title={'Post'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Error loading post</Text>
          <Text style={{ color: PrimaryGrey, textAlign: 'center', marginBottom: 16 }}>
            {postError.message || 'Something went wrong. Please try again.'}
          </Text>
          <TouchableOpacity
            onPress={() => queryClient.invalidateQueries({ queryKey: ['post', postId] })}
            style={{
              backgroundColor: PrimaryBlue,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8
            }}
          >
            <Text style={{ color: 'white', fontWeight: '500' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (!post) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
        <MainHeaderNav show menu={false} title={'Post'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Post not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show menu={false} title={post?.org || 'Post'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400;
            if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={16}
        >
          {/* Post Content */}
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => {
                // If it's the current user's own profile, navigate to Profile tab
                // Otherwise navigate to UserProfile page
                if (currentUser?.id && post?.user?.id && currentUser.id.toString() === post.user.id.toString()) {
                  // Profile is in Tab Navigator (MainTabs) within DrawerNav
                  // Use reset to properly navigate to the Me tab
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
                                  routes: [{ name: 'Me' as never }],
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
                } else if (post?.user?.id) {
                  (navigation as any).navigate('UserProfile', { userId: post.user.id.toString() });
                }
              }}>
                {/* <Image 
                  source={{ uri: post.avatarUrl }} 
                  style={{width: 40, height: 40, borderRadius: 20}}
                /> */}
                <Avatar size={40}>
                  <AvatarImage src={post.avatarUrl} />
                  <AvatarFallback style={{ backgroundColor: post?.user?.color || stringToColor(post.username) }} textStyle={{ color: 'white' }}>
                    {(post.username || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <TouchableOpacity onPress={() => {
                    // If it's the current user's own profile, navigate to Profile tab
                    // Otherwise navigate to UserProfile page
                    if (currentUser?.id && post?.user?.id && currentUser.id.toString() === post.user.id.toString()) {
                      // Profile is in Tab Navigator (MainTabs) within DrawerNav
                      // Use reset to properly navigate to the Me tab
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
                                      routes: [{ name: 'Me' as never }],
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
                    } else if (post?.user?.id) {
                      (navigation as any).navigate('UserProfile', { userId: post.user.id.toString() });
                    }
                  }}>
                    <Text style={{ fontSize: 15, fontFamily: 'Outfit-Bold', fontWeight: '700', color: '#111827' }}>{post.username}</Text>
                  </TouchableOpacity>
                  {/* <Text style={{ fontSize: 14, color: PrimaryGrey }}>•</Text> */}
                  {/* <Text style={{ fontSize: 12, color: PrimaryGrey }}>
                    {post.created_at || post.timestamp
                      ? formatDistanceToNow(new Date(post.created_at || post.timestamp as string), { addSuffix: true })
                      : post.time}
                  </Text> */}
                </View>
                <Text style={{ fontSize: 13, color: PrimaryGrey, marginTop: 0, fontFamily: 'Outfit-Regular' }}>
                  {post.created_at || post.timestamp
                    ? formatDistanceToNow(new Date(post.created_at || post.timestamp as string), { addSuffix: true })
                    : post.time}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 15, marginTop: 12, lineHeight: 22, color: '#111827', fontFamily: 'Outfit-Regular' }}>
              {renderCommentContent(post.text, post.mentions)}
            </Text>

            {/* Show preview card if previewDetails exists, otherwise show image */}
            {post.previewDetails ? (
              <TouchableOpacity
                onPress={() => {
                  if (post.previewDetails?.url) {
                    openInAppBrowser(post.previewDetails.url);
                  }
                }}
                style={{
                  // alignSelf: 'flex-start',
                  marginTop: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  backgroundColor: 'white',
                  overflow: 'hidden',
                }}
              >
                {post.previewDetails.image && (
                  <View style={{ flexDirection: 'row', padding: 12, borderRadius: 8 }}>
                    <Image
                      source={{ uri: post.previewDetails.image }}
                      style={{
                        width: previewImageWidth || 0,
                        height: 200,
                        opacity: previewImageWidth ? 1 : 0,
                        borderRadius: 8,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                )}
                <View style={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: post.previewDetails.image ? 0 : 12 }}>
                  {post.previewDetails.site_name && (
                    <Text style={{ fontSize: 10, color: PrimaryGrey, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: 'Outfit-SemiBold' }}>
                      {post.previewDetails.site_name}
                    </Text>
                  )}
                  {post.previewDetails.title ? (
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4, fontFamily: 'Outfit-Bold' }} numberOfLines={2}>
                      {post.previewDetails.title}
                    </Text>
                  ) : (
                    !post.previewDetails.description && !post.previewDetails.image && post.previewDetails.url && (
                      <Text style={{ fontSize: 14, color: '#1600ff', marginBottom: 4, textDecorationLine: 'underline', fontFamily: 'Outfit-Medium' }} numberOfLines={1}>
                        {post.previewDetails.url}
                      </Text>
                    )
                  )}
                  {post.previewDetails.description && (
                    <Text style={{ fontSize: 12, color: PrimaryGrey, marginBottom: 4, fontFamily: 'Outfit-Regular' }} numberOfLines={2}>
                      {post.previewDetails.description}
                    </Text>
                  )}
                  {post.previewDetails.domain && (
                    <Text style={{ fontSize: 12, color: '#6B7280', marginVertical: 0, fontFamily: 'Outfit-SemiBold' }}>
                      {post.previewDetails.domain}
                    </Text>
                  )}
                  {!post.previewDetails.title && (post.previewDetails.description || post.previewDetails.image) && post.previewDetails.url && (
                    <Text style={{ fontSize: 12, color: '#1600ff', textDecorationLine: 'underline', marginTop: 4, fontFamily: 'Outfit-Medium' }} numberOfLines={1}>
                      {post.previewDetails.url}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ) : post.imageUrl ? (
              <TouchableOpacity
                onPress={() => {
                  setSelectedImage(post.imageUrl || null);
                  setIsImageModalVisible(true);
                }}
                activeOpacity={0.9}
                style={{ flexDirection: 'row', borderRadius: 8, marginTop: 12 }}
              >
                <Image
                  source={{ uri: post.imageUrl }}
                  style={{
                    width: imageWidth || 0,
                    height: 200,
                    borderRadius: 8,
                    opacity: imageWidth ? 1 : 0
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : null}

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#E5E5E5'
            }}>
              <View style={{ flexDirection: 'row', gap: 24 }}>
                <TouchableOpacity
                  onPress={handlePostLike}
                  disabled={likePostMutation.isPending || unlikePostMutation.isPending}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: (likePostMutation.isPending || unlikePostMutation.isPending) ? 0.5 : 1 }}
                >
                  <Heart size={18} color={post.isLiked ? 'red' : PrimaryGrey} fill={post.isLiked ? 'red' : 'none'} />
                  <Text style={{ fontSize: 12, color: post.isLiked ? 'red' : PrimaryGrey }}>
                    {likePostMutation.isPending || unlikePostMutation.isPending ? '' : post.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MessageCircle size={18} color={PrimaryGrey} />
                  <Text style={{ fontSize: 12, color: PrimaryGrey }}>{comments.length}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                onPress={handleShare}
              >
                <Image
                  source={require('../assets/icons/forward.png')}
                  style={{ width: 18, height: 18 }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#E5E5E5' }}>
            {/* Only count and render top-level comments (no parentComment) */}
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
              {comments.filter(c => !c.parentComment).length} {comments.filter(c => !c.parentComment).length === 1 ? 'comment' : 'comments'}
            </Text>

            {comments.filter(c => !c.parentComment).length === 0 ? (
              <View style={{
                alignItems: 'center',
                padding: 20,
                backgroundColor: LightGrey,
                borderRadius: 12,
                marginBottom: 20
              }}>
                <MessageCircle size={40} color={PrimaryGrey} style={{ marginBottom: 12 }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: PrimaryGrey,
                  marginBottom: 8
                }}>No comments yet</Text>
                <Text style={{
                  fontSize: 14,
                  color: PrimaryGrey,
                  textAlign: 'center',
                  marginBottom: 12
                }}>Be the first one to share your thoughts!</Text>
              </View>
            ) : (
              <View style={{ marginBottom: 20 }}>
                {comments
                  .filter((comment) => !comment.parentComment)
                  .map((comment) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      onReply={handleReplyAction}
                      onLike={handleCommentLike}
                      onToggleReplies={toggleReplies}
                      onFetchReplies={fetchReplies}
                      onDelete={handleDeleteComment}
                      isExpanded={expandedComments.has(comment.id)}
                      isLoadingReplies={loadingReplies.has(comment.id)}
                    />
                  ))}
                {isFetchingNextPage && (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#1600ff" />
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Join Conversation Input */}
        <MentionInput
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSubmit={handleAddComment}
          disabled={createCommentMutation.isPending || createReplyMutation.isPending}
        />

        {/* Full Image Modal */}
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: Platform.OS === 'ios' ? 60 : 40,
                right: 20,
                zIndex: 10,
                padding: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 20
              }}
              onPress={() => setIsImageModalVisible(false)}
            >
              <X color="white" size={24} />
            </TouchableOpacity>

            <TouchableWithoutFeedback onPress={() => setIsImageModalVisible(false)}>
              <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                {selectedImage && (
                  <Image
                    source={{ uri: selectedImage }}
                    style={{
                      width: '100%',
                      height: '80%',
                    }}
                    resizeMode="contain"
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>

        {/* Exit Confirmation Modal */}
        <Modal
          transparent={true}
          visible={showExitConfirmation}
          onRequestClose={() => setShowExitConfirmation(false)}
          animationType="fade"
        >
          <TouchableWithoutFeedback onPress={() => setShowExitConfirmation(false)}>
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20
            }}>
              <TouchableWithoutFeedback onPress={() => { }}>
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
                    marginBottom: 8
                  }}>Leave this page?</Text>
                  <Text style={{
                    fontSize: 14,
                    color: PrimaryGrey,
                    marginBottom: 20
                  }}>You have typed a comment. If you leave now, your comment will be lost.</Text>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 12
                  }}>
                    <TouchableOpacity
                      onPress={() => setShowExitConfirmation(false)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#E5E5E5'
                      }}
                    >
                      <Text>Stay on this page</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleConfirmExit}
                      style={{
                        backgroundColor: '#EF4444',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 6
                      }}
                    >
                      <Text style={{ color: 'white' }}>Leave anyway</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Discard Confirmation Sheet */}
        <DiscardBottomSheet
          ref={discardSheetRef}
          onDiscard={() => {
            setIsConfirmedDiscard(true);
            discardSheetRef.current?.dismiss();
            setTimeout(() => {
              if (pendingAction) {
                navigation.dispatch(pendingAction);
              } else {
                navigation.goBack();
              }
            }, 300);
          }}
          onCancel={() => discardSheetRef.current?.dismiss()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}