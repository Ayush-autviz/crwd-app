import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { X, MessageCircle, ArrowRight, Loader2 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPostComments, createPostComment, getCommentReplies, likeComment, unlikeComment, deleteComment } from '../../services/api/social';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { useAuthStore } from '../../store/store';
import { Comment, CommentData } from './Comment';

interface CommentsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: number;
    username: string;
    text: string;
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
  };
}

const { height: screenHeight } = Dimensions.get('window');

export default function CommentsBottomSheet({
  isOpen,
  onClose,
  post,
}: CommentsBottomSheetProps) {
  console.log('CommentsBottomSheet rendered with props:', { isOpen, post });
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentData[]>([]);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const snapPoints = useMemo(() => ['75%', '90%'], []);

  // Handle opening/closing the bottom sheet
  useEffect(() => {
    console.log('CommentsBottomSheet useEffect - isOpen changed:', isOpen);
    console.log('bottomSheetRef.current:', bottomSheetRef.current);
    if (isOpen) {
      console.log('Presenting bottom sheet modal');
      // Use setTimeout to ensure the ref is ready
      setTimeout(() => {
        console.log('Attempting to present, ref:', bottomSheetRef.current);
        if (bottomSheetRef.current) {
          // If comments exist, open at max height (index 1 = 90%), otherwise at 75% (index 0)
          const hasComments = comments.length > 0;
          const snapIndex = hasComments ? 1 : 0; // 1 = 90%, 0 = 75%
          console.log('Presenting at snap index:', snapIndex, 'hasComments:', hasComments, 'comments.length:', comments.length);
          bottomSheetRef.current.present();
          // After presenting, snap to the desired index
          setTimeout(() => {
            bottomSheetRef.current?.snapToIndex(snapIndex);
          }, 50);
          console.log('present() called');
        } else {
          console.log('bottomSheetRef.current is null!');
        }
      }, 100);
    } else {
      console.log('Dismissing bottom sheet');
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen, comments.length]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    onClose();
    setCommentText('');
    setExpandedComments(new Set());
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        onPress={handleClose}
      />
    ),
    [handleClose]
  );

  // Fetch comments
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ['postComments', post.id],
    queryFn: () => getPostComments(post.id.toString()),
    enabled: isOpen && !!post.id,
  });

  // Get display name helper
  const getDisplayName = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return user?.username || user?.full_name || 'Unknown User';
  };

  // Transform API comments to CommentData format - memoized
  const apiComments = useMemo(() => {
    return commentsData?.results?.map((comment: any) => ({
      id: comment.id,
      username: getDisplayName(comment.user),
      firstName: comment.user?.first_name,
      lastName: comment.user?.last_name,
      avatarUrl: comment.user?.profile_picture || '',
      content: comment.content,
      timestamp: new Date(comment.created_at),
      likes: comment.likes_count || 0,
      replies: [],
      repliesCount: comment.replies_count || 0,
      parentComment: comment.parent_comment,
      isLiked: comment.is_liked || false,
      userId: comment.user?.id,
    })) || [];
  }, [commentsData?.results]);

  // Update comments when API data changes, but preserve existing replies
  useEffect(() => {
    if (commentsData !== undefined) {
      if (apiComments.length > 0) {
        setComments(prev => {
          return apiComments.map((apiComment: CommentData) => {
            const existingComment = prev.find(c => c.id === apiComment.id);
            return {
              ...apiComment,
              replies: existingComment?.replies || [],
            };
          });
        });
      } else {
        setComments([]);
      }
    }
  }, [apiComments, commentsData]);

  // Adjust bottom sheet height when comments are loaded
  useEffect(() => {
    if (isOpen && bottomSheetRef.current && comments.length > 0) {
      // If comments exist and we're at the lower snap point, move to higher one
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1); // Move to 90%
      }, 200);
    }
  }, [isOpen, comments.length]);

  // Adjust bottom sheet height when comments are loaded
  useEffect(() => {
    if (isOpen && bottomSheetRef.current && comments.length > 0) {
      // If comments exist and we're at the lower snap point, move to higher one
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1); // Move to 90%
      }, 200);
    }
  }, [isOpen, comments.length]);

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string }) => createPostComment(post.id.toString(), { content: data.content }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: number; data: { content: string } }) =>
      createPostComment(post.id.toString(), { content: data.content, parent_comment_id: commentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
    },
    onError: () => {
      console.error('Failed to add reply');
    },
  });

  // Like/Unlike comment mutations
  const likeCommentMutation = useMutation({
    mutationFn: (commentId: number) => likeComment(commentId.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
    },
    onError: (error) => {
      console.error('Error liking comment:', error);
    },
  });

  const unlikeCommentMutation = useMutation({
    mutationFn: (commentId: number) => unlikeComment(commentId.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
    },
    onError: (error) => {
      console.error('Error unliking comment:', error);
    },
  });

  const handleReply = (commentId: number, content: string) => {
    if (content.trim()) {
      createReplyMutation.mutate({ commentId, data: { content: content.trim() } });
    }
  };

  const handleLike = (commentId: number, isLiked: boolean) => {
    if (isLiked) {
      unlikeCommentMutation.mutate(commentId);
    } else {
      likeCommentMutation.mutate(commentId);
    }
  };

  const fetchReplies = async (commentId: number) => {
    setLoadingReplies(prev => new Set(prev).add(commentId));
    try {
      const repliesData = await getCommentReplies(commentId.toString());
      const repliesArray = repliesData?.results || (Array.isArray(repliesData) ? repliesData : []);

      const transformedReplies: CommentData[] = repliesArray.map((reply: any) => ({
        id: reply.id,
        username: getDisplayName(reply.user),
        firstName: reply.user?.first_name,
        lastName: reply.user?.last_name,
        avatarUrl: reply.user?.profile_picture || '',
        content: reply.content,
        timestamp: new Date(reply.created_at),
        likes: reply.likes_count || 0,
        replies: [],
        repliesCount: reply.replies_count || 0,
        parentComment: reply.parent_comment || commentId,
        isLiked: reply.is_liked || false,
        userId: reply.user?.id,
      }));

      setComments(prev => {
        return prev.map(comment =>
          comment.id === commentId
            ? { ...comment, replies: transformedReplies }
            : comment
        );
      });

      setExpandedComments(prev => new Set(prev).add(commentId));
    } catch (error) {
      console.error('Error fetching replies:', error);
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
      if ((!comment.replies || comment.replies.length === 0) && comment.repliesCount && comment.repliesCount > 0) {
        fetchReplies(commentId);
      } else {
        setExpandedComments(prev => new Set(prev).add(commentId));
      }
    }
  };

  const handleDeleteComment = (commentId: number) => {
    setComments(prev => {
      const filteredComments = prev.filter(c => c.id !== commentId);
      if (filteredComments.length === prev.length) {
        return prev.map(comment => ({
          ...comment,
          replies: comment.replies.filter(reply => reply.id !== commentId),
          repliesCount: comment.replies.filter(reply => reply.id !== commentId).length,
        }));
      }
      return filteredComments;
    });
    queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
  };

  const handleSubmit = () => {
    if (commentText.trim() && !createCommentMutation.isPending) {
      createCommentMutation.mutate({ content: commentText.trim() });
    }
  };

  const postDisplayName = post.firstName && post.lastName
    ? `${post.firstName} ${post.lastName}`
    : post.username;

  const postUserInitials = post.firstName && post.lastName
    ? `${post.firstName.charAt(0)}${post.lastName.charAt(0)}`.toUpperCase()
    : post.username.charAt(0).toUpperCase();

  const avatarColors = [
    '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B',
    '#EF4444', '#06B6D4', '#F97316', '#84CC16', '#A855F7',
    '#14B8A6', '#F43F5E', '#6366F1', '#22C55E', '#EAB308',
  ];
  const postAvatarColor = avatarColors[post.id % avatarColors.length];

  const topLevelComments = comments.filter(c => !c.parentComment);

  console.log('BottomSheetModal render - isOpen:', isOpen);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={handleClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Commenting on <Text style={styles.headerTitle}>{postDisplayName}</Text>'s post
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Original Post */}
          <View style={styles.originalPostContainer}>
            <Avatar size={40} style={styles.originalPostAvatar}>
              <AvatarImage src={post.avatarUrl} alt={postDisplayName} />
              <AvatarFallback style={{ backgroundColor: postAvatarColor }} textStyle={styles.originalPostAvatarFallbackText}>
                {postUserInitials}
              </AvatarFallback>
            </Avatar>
            <View style={styles.originalPostContent}>
              <Text style={styles.originalPostDisplayName}>{postDisplayName}</Text>
              <Text style={styles.originalPostText} numberOfLines={2}>{post.text}</Text>
            </View>
          </View>

          {/* Comments List */}
          <BottomSheetScrollView contentContainerStyle={styles.commentsListContainer}>
            {isLoadingComments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1600ff" />
                <Text style={styles.loadingText}>Loading comments...</Text>
              </View>
            ) : topLevelComments.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MessageCircle size={40} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No comments yet. Be the first to comment!</Text>
              </View>
            ) : (
              <>
                <Text style={styles.commentsCountText}>
                  {topLevelComments.length} comment{topLevelComments.length !== 1 ? "s" : ""}
                </Text>
                {topLevelComments.map((comment) => (
                  <Comment
                    key={comment.id}
                    {...comment}
                    onReply={handleReply}
                    onLike={handleLike}
                    onToggleReplies={toggleReplies}
                    isExpanded={expandedComments.has(comment.id)}
                    isLoadingReplies={loadingReplies.has(comment.id)}
                    showReplyButton={true}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </>
            )}
          </BottomSheetScrollView>

          {/* Input Bar */}
          {currentUser && (
            <View style={styles.inputBarContainer}>
              <BottomSheetTextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Join the conversation"
                placeholderTextColor="#6B7280"
                style={styles.commentInput}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                editable={!createCommentMutation.isPending}
              />
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!commentText.trim() || createCommentMutation.isPending}
                style={[styles.sendButton, (!commentText.trim() || createCommentMutation.isPending) && styles.sendButtonDisabled]}
              >
                {createCommentMutation.isPending ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <ArrowRight size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  headerTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  originalPostContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  originalPostAvatar: {
    borderRadius: 20,
  },
  originalPostAvatarFallbackText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  originalPostContent: {
    flex: 1,
  },
  originalPostDisplayName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  originalPostText: {
    fontSize: 13,
    color: '#374151',
  },
  commentsListContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
  commentsCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#111827',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#1600ff',
    borderRadius: 24,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

