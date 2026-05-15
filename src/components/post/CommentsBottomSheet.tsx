import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Dimensions, TextInput } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { X, MessageCircle } from 'lucide-react-native';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPostComments, createPostComment, getCommentReplies, likeComment, unlikeComment, deleteComment, mentionSearch } from '../../services/api/social';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { useAuthStore } from '../../store/store';
import { Comment, CommentData } from './Comment';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MentionSearchResults } from './MentionSearchResults';
import DiscardBottomSheet from '../ui/DiscardBottomSheet';

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
    color?: string;
    mentions?: any[];
    reposted_from?: any;
  };
}

const { height: screenHeight } = Dimensions.get('window');

// --- ISOLATED FOOTER COMPONENT WITH INTERNAL STATE ---
// This prevents the parent (and thus the renderFooter callback) from updating on every keystroke
interface CommentInputFooterHandle {
  focus: () => void;
  clear: () => void;
  setText: (text: string) => void;
  addMention: (mention: { type: string; id: number | string; name: string }) => void;
  hasContent: () => boolean;
}

interface CommentInputFooterProps {
  footerProps: any;
  replyingTo: CommentData | null;
  onCancelReply: () => void;
  onSubmit: (text: string, mentions: any[]) => void;
  isPending: boolean;
}

const CommentInputFooter = memo(React.forwardRef<CommentInputFooterHandle, CommentInputFooterProps>(({
  footerProps,
  replyingTo,
  onCancelReply,
  onSubmit,
  isPending
}, ref) => {
  const [text, setText] = useState('');
  const [mentionSearchQuery, setMentionSearchQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<{ type: string; id: number | string; name: string }[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const selectionLockRef = useRef(false);

  const inputRef = useRef<TextInput>(null);

  // Expose methods to parent
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    clear: () => {
      setText('');
      setSelectedMentions([]);
      setMentionSearchQuery(null);
      setMentionResults([]);
    },
    setText: (newText: string) => setText(newText),
    addMention: (mention: { type: string; id: number | string; name: string }) => {
      setSelectedMentions(prev => [
        ...prev.filter(m => m.name !== mention.name),
        mention
      ]);
    },
    hasContent: () => text.trim().length > 0
  }));

  useEffect(() => {
    const fetchMentions = async () => {
      if (mentionSearchQuery !== null) {
        try {
          const data = await mentionSearch(mentionSearchQuery);
          setMentionResults(data.results || (Array.isArray(data) ? data : []));
        } catch (error) {
          console.error('Mention search error:', error);
          setMentionResults([]);
        }
      } else {
        setMentionResults([]);
      }
    };

    const timer = setTimeout(fetchMentions, 150);
    return () => clearTimeout(timer);
  }, [mentionSearchQuery]);

  useEffect(() => {
    if (selectionLockRef.current) return;
    const cursorPosition = selection.start;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbolIndex !== -1) {
      const charBeforeAt = lastAtSymbolIndex > 0 ? textBeforeCursor[lastAtSymbolIndex - 1] : null;
      const isStartOfWord = !charBeforeAt || charBeforeAt === ' ' || charBeforeAt === '\n';

      if (isStartOfWord) {
        const query = textBeforeCursor.substring(lastAtSymbolIndex + 1);
        // Only trigger search if query doesn't end with a space (meaning selection or finishing word)
        if (query.trim().split(/\s+/).length <= 3 && !query.includes('\n') && query.length <= 30) {
          setMentionSearchQuery(query);
          return;
        }
      }
    }
    setMentionSearchQuery(null);
  }, [text, selection]);

  const handleTextChange = (value: string) => {
    setText(value);
  };

  const handleMentionSelect = (user: any) => {
    const cursorPosition = selection.start;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const textAfterCursor = text.substring(cursorPosition);

    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    const mentionText = `@${user.name} `;
    const newTextBeforeCursor = textBeforeCursor.substring(0, lastAtSymbolIndex) + mentionText;

    const newText = newTextBeforeCursor + textAfterCursor;

    // Lock mentions during selection update
    selectionLockRef.current = true;

    // Explicitly update selection to the end of the new mention
    const newPos = newTextBeforeCursor.length;
    setSelection({ start: newPos, end: newPos });
    setText(newText);

    setSelectedMentions(prev => [
      ...prev.filter(m => m.name !== user.name),
      { type: user.type, id: user.id, name: user.name }
    ]);

    setMentionSearchQuery(null);
    setMentionResults([]);

    // Focus and unlock
    setTimeout(() => {
      inputRef.current?.focus();
      // Small delay to ensure all state/selection updates are processed
      setTimeout(() => {
        selectionLockRef.current = false;
      }, 100);
    }, 100);
  };

  const renderHighlightedText = (text: string) => {
    if (!text) return null;

    const mentionNames = selectedMentions.map(m => `@${m.name}`);
    const mentionNamesLower = mentionNames.map(n => n.toLowerCase());
    mentionNames.sort((a, b) => b.length - a.length);

    const renderPart = (part: string, key: string | number) => {
      if (part.startsWith('@')) {
        return <Text key={key} style={{ color: PrimaryBlue, fontFamily: 'Outfit-Medium' }}>{part}</Text>;
      }
      return <Text key={key}>{part}</Text>;
    };

    // Fallback: simple highlighter if no selected mentions
    if (mentionNames.length === 0) {
      const parts = text.split(/(@[\w\s]{1,30}(?=\s|$)|@\w+)/g);
      return parts.map((part, i) => renderPart(part, i));
    }

    const pattern = mentionNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');

    const mainParts = text.split(regex);
    return mainParts.map((part, i) => {
      if (!part) return null;
      if (mentionNamesLower.includes(part.toLowerCase())) {
        return renderPart(part, i);
      }
      const subParts = part.split(/(@[\w\s]{1,30}(?=\s|$)|@\w+)/g);
      return subParts.map((subPart, j) => {
        if (!subPart) return null;
        return renderPart(subPart, `${i}-${j}`);
      });
    });
  };

  const handleSend = () => {
    if (text.trim()) {
      const finalMentions = selectedMentions
        .filter(m => text.includes(`@${m.name}`))
        .map(({ type, id }) => ({ type, id }));

      onSubmit(text.trim(), finalMentions);
    }
  };

  return (
    <BottomSheetFooter {...footerProps} bottomInset={0}>
      <View style={styles.inputBarContainer}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <View style={styles.replyingToContent}>
              <Text style={styles.replyingToLabel}>Replying to @{replyingTo.username}</Text>
              <Text numberOfLines={1} style={styles.replyingToText}>{replyingTo.content}</Text>
            </View>
            <TouchableOpacity onPress={onCancelReply} style={styles.replyingToClose}>
              <X size={16} color={PrimaryGrey} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputWrapper}>
          <View style={styles.blueAccentBar} />
          <MentionSearchResults
            results={mentionResults}
            onSelect={handleMentionSelect}
          />
          <BottomSheetTextInput
            ref={inputRef as any}
            placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Share your thoughts..."}
            placeholderTextColor={PrimaryGrey}
            onChangeText={handleTextChange}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            multiline
            style={styles.commentInput}
          >
            {renderHighlightedText(text)}
          </BottomSheetTextInput>
        </View>
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || isPending}
            style={[styles.replyPillButton, (!text.trim() || isPending) && styles.replyButtonDisabled]}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[styles.replyButtonText, (!text.trim() || isPending) && styles.replyButtonTextDisabled]}>Reply</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetFooter>
  );
}));

export default function CommentsBottomSheet({
  isOpen,
  onClose,
  post,
}: CommentsBottomSheetProps) {
  console.log('CommentsBottomSheet rendered with props:', { isOpen, post });
  const isForceClosing = useRef(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const discardSheetRef = useRef<BottomSheetModal>(null);
  const footerRef = useRef<CommentInputFooterHandle>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<CommentData | null>(null);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  const snapPoints = useMemo(() => ['90%'], []);

  // Handle opening/closing the bottom sheet
  useEffect(() => {
    if (isOpen) {
      isForceClosing.current = false;
      // Use setTimeout to ensure the ref is ready
      setTimeout(() => {
        if (bottomSheetRef.current) {
          bottomSheetRef.current.present();
        }
      }, 100);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);

  const forceClose = useCallback(() => {
    isForceClosing.current = true;
    bottomSheetRef.current?.dismiss();
    onClose();
    footerRef.current?.clear();
    setReplyingTo(null);
    setExpandedComments(new Set());
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (isForceClosing.current) return;

    if (footerRef.current?.hasContent()) {
      discardSheetRef.current?.present();
    } else {
      forceClose();
    }
  }, [forceClose]);

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

  // Fetch comments with infinite query
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['postComments', post.id],
    queryFn: ({ pageParam = 1 }) => getPostComments(post.id.toString(), pageParam),
    enabled: isOpen && !!post.id,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const match = lastPage.next.match(/[?&]page=(\d+)/);
        return match ? parseInt(lastPage.next.match(/[?&]page=(\d+)/)[1]) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
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
    if (!commentsData?.pages) return [];

    return commentsData.pages.flatMap(page =>
      (page.results || []).map((comment: any) => ({
        id: comment.id,
        username: getDisplayName(comment.user),
        firstName: comment.user?.first_name,
        lastName: comment.user?.last_name,
        avatarUrl: comment.user?.profile_picture || '',
        color: comment.user?.color,
        content: comment.content,
        timestamp: new Date(comment.created_at),
        likes: comment.likes_count || 0,
        replies: [],
        repliesCount: comment.replies_count || 0,
        parentComment: comment.parent_comment,
        isLiked: comment.is_liked || false,
        userId: comment.user?.id,
        mentions: comment.mentions,
      }))
    );
  }, [commentsData?.pages]);

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

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; mentions?: any[] }) => createPostComment(post.id.toString(), { content: data.content, mentions: data.mentions }),
    onSuccess: () => {
      footerRef.current?.clear();
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      console.error('Error creating comment:', error);
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: number; data: { content: string; mentions?: any[] } }) =>
      createPostComment(post.id.toString(), { content: data.content, parent_comment_id: commentId, mentions: data.mentions }),
    onSuccess: (_: any, variables: any) => {
      footerRef.current?.clear();
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
      // Fetch replies to show the new one and expand
      fetchReplies(variables.commentId);
    },
    onError: () => {
      console.error('Failed to add reply');
    },
  });

  const renderMentionText = (content: string, mentions: any[] = []) => {
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
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <Text
            key={index}
            style={{ color: PrimaryBlue, textDecorationLine: 'underline' }}
            onPress={() => {
              import('react-native').then(({ Linking }) => Linking.openURL(part));
            }}
          >
            {part}
          </Text>
        );
      }

      if (part.startsWith('@')) {
        const mention = mentionMap.get(part.toLowerCase());

        const handlePress = () => {
          console.log('mention', mention);
          handleClose();
          if (mention) {
            const mDetails = mention.mention_details || mention;
            const type = (mention.mention_type || mDetails?.mention_type || mDetails?.type || '').toLowerCase();
            const targetId = mDetails?.target_id || mDetails?.id || mention.target_id || mention.id || part.substring(1);

            if (type === 'collective' || type === 'group') {
              navigation.navigate('GroupCRWD', { id: targetId.toString() });
            } else if (type === 'cause' || type === 'nonprofit' || type === 'organization') {
              navigation.navigate('CauseScreen', { id: targetId.toString() });
            } else {
              // User
              if (currentUser?.id && targetId && currentUser.id.toString() === targetId.toString()) {
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
          } else {
            // Fallback
            navigation.navigate('UserProfile', { userId: part.substring(1) });
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

  // Like/Unlike comment mutations
  const likeCommentMutation = useMutation({
    mutationFn: (commentId: number) => likeComment(commentId.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
    },
    onError: (error: any) => {
      console.error('Error liking comment:', error);
    },
  });

  const unlikeCommentMutation = useMutation({
    mutationFn: (commentId: number) => unlikeComment(commentId.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
    },
    onError: (error: any) => {
      console.error('Error unliking comment:', error);
    },
  });

  const handleReply = (commentId: number, content: string) => {
    // Find the comment object to get username properly
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
      // Set replyingTo to show the "Replying to" banner
      setReplyingTo(targetComment);
      footerRef.current?.setText(''); // Don't pre-fill with @username
      footerRef.current?.addMention({
        type: 'user',
        id: targetComment.userId || targetComment.id,
        name: targetComment.username
      });
      // Focus the input after a short delay to ensure the bottom sheet is ready
      footerRef.current?.focus();
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

      // Support multiple possible response shapes: {replies: [...]}, {results: [...]}, or a bare array
      const repliesArray =
        repliesData?.replies ||
        repliesData?.results ||
        (Array.isArray(repliesData) ? repliesData : []);

      const transformedReplies: CommentData[] = repliesArray.map((reply: any) => ({
        id: reply.id,
        username: getDisplayName(reply.user),
        firstName: reply.user?.first_name,
        lastName: reply.user?.last_name,
        avatarUrl: reply.user?.profile_picture || '',
        color: reply.user?.color,
        content: reply.content,
        timestamp: new Date(reply.created_at),
        likes: reply.likes_count || 0,
        replies: [],
        repliesCount: reply.replies_count || 0,
        parentComment: reply.parent_comment || commentId,
        isLiked: reply.is_liked || false,
        userId: reply.user?.id,
        mentions: reply.mentions,
      }));

      setComments(prev => {
        return prev.map(comment =>
          comment.id === commentId
            ? { ...comment, replies: transformedReplies }
            : comment
        );
      });

      // Also add to expanded comments set after replies are loaded
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

  const handleSubmit = useCallback((text: string, mentions: any[]) => {
    if (!text.trim()) return;

    let finalMentions = [...mentions];

    // If it's a reply, ensure the person we are replying to is mentioned
    if (replyingTo) {
      const targetId = replyingTo.userId || replyingTo.id;
      if (!finalMentions.some(m => m.id === targetId)) {
        finalMentions.push({ type: 'user', id: targetId });
      }
      createReplyMutation.mutate({ commentId: replyingTo.id, data: { content: text.trim(), mentions: finalMentions } });
    } else if (!createCommentMutation.isPending) {
      createCommentMutation.mutate({ content: text.trim(), mentions: finalMentions });
    }
  }, [replyingTo, createCommentMutation.isPending, createReplyMutation.isPending]);

  const postDisplayName = post.firstName && post.lastName
    ? `${post.firstName} ${post.lastName}`
    : post.username;

  const postUserInitials = (post.firstName || post.username).charAt(0).toUpperCase();

  const avatarColors = [
    '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B',
    '#EF4444', '#06B6D4', '#F97316', '#84CC16', '#A855F7',
    '#14B8A6', '#F43F5E', '#6366F1', '#22C55E', '#EAB308',
  ];

  const getConsistentColor = (id: number | string, colors: string[]) => {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const postAvatarColor = post.color || getConsistentColor(post.id, avatarColors);

  const topLevelComments = comments.filter(c => !c.parentComment);

  console.log('BottomSheetModal render - isOpen:', isOpen);

  // Memoize footer rendering to prevent re-creation
  const renderFooter = useCallback(
    (footerProps: any) => (
      <CommentInputFooter
        ref={footerRef}
        footerProps={footerProps}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSubmit={handleSubmit}
        isPending={createCommentMutation.isPending || createReplyMutation.isPending}
      />
    ),
    [replyingTo, createCommentMutation.isPending, createReplyMutation.isPending, handleSubmit]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={handleClose}
      keyboardBehavior="extend"
      footerComponent={currentUser ? renderFooter : undefined}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
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
            <Text style={styles.originalPostText} numberOfLines={2}>
              {renderMentionText(post.text, post.mentions?.length ? post.mentions : post.reposted_from?.mentions)}
            </Text>
          </View>
        </View>

        {/* Comments List */}
        <BottomSheetScrollView
          contentContainerStyle={styles.commentsListContainer}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400;
            if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={16}
        >
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
                  onClose={handleClose}
                />
              ))}
              {isFetchingNextPage && (
                <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#1600ff" />
                </View>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </View>
      <DiscardBottomSheet
        ref={discardSheetRef}
        onDiscard={() => {
          discardSheetRef.current?.dismiss();
          setTimeout(() => {
            forceClose();
          }, 300);
        }}
        onCancel={() => {
          discardSheetRef.current?.dismiss();
          // If the sheet was swiped down, we need to re-present it
          setTimeout(() => {
            bottomSheetRef.current?.present();
          }, 300);
        }}
      />
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
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  headerTitle: {
    fontFamily: 'Outfit-SemiBold',
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
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#111827',
    marginBottom: 2,
  },
  originalPostText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Regular',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
    fontFamily: 'Outfit-Regular',
  },
  commentsCountText: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  inputBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: PrimaryBlue,
  },
  replyingToContent: {
    flex: 1,
    marginRight: 8,
  },
  replyingToLabel: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    color: PrimaryBlue,
    marginBottom: 2,
  },
  replyingToText: {
    fontSize: 13,
    color: PrimaryGrey,
    fontFamily: 'Outfit-Regular',
  },
  replyingToClose: {
    padding: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
    zIndex: 1000
  },
  blueAccentBar: {
    width: 4,
    backgroundColor: PrimaryBlue,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  replyPillButton: {
    backgroundColor: '#1600ff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  replyButtonText: {
    color: 'white',
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
  },
  replyButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
