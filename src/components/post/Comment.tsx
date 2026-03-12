import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { MessageCircle, Ellipsis, Trash2, Loader2, Heart } from 'lucide-react-native';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteComment, likeComment, unlikeComment } from '../../services/api/social';
import { useAuthStore } from '../../store/store';
import { useNavigation, CommonActions } from '@react-navigation/native';

export interface CommentData {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string;
  color?: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: CommentData[];
  repliesCount?: number;
  parentComment?: any;
  isLiked?: boolean;
  userId?: string | number;
  mentions?: any[];
}

interface CommentProps extends CommentData {
  onReply: (commentId: number, content: string) => void;
  onLike: (commentId: number, isLiked: boolean) => void;
  onToggleReplies?: (commentId: number) => void;
  isExpanded?: boolean;
  isLoadingReplies?: boolean;
  showReplyButton?: boolean;
  onDelete?: (commentId: number) => void;
  onClose?: () => void;
}

export const Comment: React.FC<CommentProps> = ({
  id,
  username,
  firstName,
  lastName,
  avatarUrl,
  color,
  content,
  timestamp,
  likes,
  replies,
  repliesCount = 0,
  onReply,
  onLike,
  onToggleReplies,
  isExpanded = false,
  isLoadingReplies = false,
  showReplyButton = true,
  isLiked = false,
  userId,
  onDelete,
  mentions = [],
  onClose,
}) => {
  const navigation = useNavigation<any>();
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || username;

  const getInitials = () => {
    const name = firstName || username;
    return name.charAt(0).toUpperCase();
  };

  const initials = getInitials();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<View>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isOwnComment = user?.id && userId && (user.id.toString() === userId.toString());

  const deleteCommentMutation = useMutation({
    mutationFn: () => deleteComment(id.toString()),
    onSuccess: () => {
      if (onDelete) {
        onDelete(id);
      }
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment.');
    },
  });

  const handleReplyClick = () => {
    // Call onReply with the comment ID to trigger the bottom input box in CommentsBottomSheet
    // The content parameter is not used anymore, but kept for compatibility
    onReply(id, '');
  };

  const handleLikePress = () => {
    onLike(id, isLiked);
  };

  const handleDeleteConfirm = () => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setShowMenu(false),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCommentMutation.mutate(),
        },
      ],
      { cancelable: true }
    );
  };

  const avatarColors = [
    '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B',
    '#EF4444', '#06B6D4', '#F97316', '#84CC16', '#A855F7',
    '#14B8A6', '#F43F5E', '#6366F1', '#22C55E', '#EAB308',
  ];

  const getConsistentColor = (id: number | string, colors: string[]) => {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarColor = color || getConsistentColor(userId || id || username || 'U', avatarColors);

  const renderContent = (content: string) => {
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
      if (part.startsWith('@')) {
        const mention = mentionMap.get(part.toLowerCase());
        const handlePress = () => {
          console.log('mention', mention);
          if (onClose) {
            onClose();
          }
          if (mention) {
            const mDetails = mention.mention_details || mention;
            const type = (mention.mention_type || mDetails?.mention_type || mDetails?.type || '').toLowerCase();
            const targetId = mDetails?.target_id || mDetails?.id || mention.target_id || mention.id || part.substring(1);

            if (type === 'collective' || type === 'group') {
              navigation.navigate('GroupCRWD', { id: targetId.toString() });
            } else if (type === 'cause' || type === 'nonprofit' || type === 'organization') {
              console.log('targetId', targetId);
              navigation.navigate('CauseScreen', { id: targetId.toString() });
            } else {
              // User
              if (user?.id && targetId && user.id.toString() === targetId.toString()) {
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
            style={{ color: '#1600ff', fontFamily: 'Outfit-Medium' }}
            onPress={handlePress}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.commentContent}>
        <Avatar size={32} style={styles.avatar}>
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback style={{ backgroundColor: avatarColor }} textStyle={styles.avatarFallbackText}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <View style={styles.textContainer}>
          <View style={styles.bubble}>
            <View style={styles.bubbleHeader}>
              <Text style={styles.displayName}>{displayName}</Text>
              {isOwnComment && (
                <View ref={menuRef}>
                  <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuButton}>
                    <Ellipsis size={16} color="#6B7280" />
                  </TouchableOpacity>
                  {showMenu && (
                    <View style={styles.menu}>
                      <TouchableOpacity onPress={handleDeleteConfirm} style={styles.menuItem}>
                        <Trash2 size={16} color="#EF4444" />
                        <Text style={styles.menuItemText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
            <Text style={styles.content}>{renderContent(content)}</Text>
          </View>
          <View style={styles.actions}>
            <Text style={styles.timestamp}>
              {formatDistanceToNow(timestamp, { addSuffix: true })
                .replace(/^less than a minute ago$/, 'Just now')}
            </Text>
            {/* <TouchableOpacity onPress={handleLikePress} style={styles.actionButton}>
              <Heart size={14} color={isLiked ? '#EF4444' : '#6B7280'} fill={isLiked ? '#EF4444' : 'none'} />
              <Text style={styles.actionText}>{likes}</Text>
            </TouchableOpacity> */}
            {showReplyButton && (
              <TouchableOpacity onPress={handleReplyClick} style={styles.actionButton}>
                <MessageCircle size={14} color="#6B7280" />
                <Text style={styles.actionText}>Reply</Text>
              </TouchableOpacity>
            )}
            {repliesCount > 0 && onToggleReplies && (
              <TouchableOpacity
                onPress={() => onToggleReplies(id)}
                disabled={isLoadingReplies}
                style={styles.actionButton}
              >
                {isLoadingReplies ? (
                  <Loader2 size={14} color="#6B7280" />
                ) : (
                  <MessageCircle size={14} color="#6B7280" />
                )}
                <Text style={styles.actionText}>
                  {isExpanded ? 'Hide' : 'View'} {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {isExpanded && replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              {...reply}
              onReply={onReply}
              onLike={onLike}
              showReplyButton={false}
              onDelete={onDelete}
              onClose={onClose}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  commentContent: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    borderRadius: 16,
    flexShrink: 0,
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
    fontSize: 12,
  },
  textContainer: {
    flex: 1,
  },
  bubble: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#111827',
  },
  menuButton: {
    padding: 4,
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
    width: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  menuItemText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Outfit-Regular',
  },
  content: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Medium',
  },
  repliesContainer: {
    marginLeft: 40,
    marginTop: 16,
  },
});



