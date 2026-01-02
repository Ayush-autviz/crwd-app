import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { MessageCircle, Ellipsis, Trash2, Loader2, Heart } from 'lucide-react-native';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteComment, likeComment, unlikeComment } from '../../services/api/social';
import { useAuthStore } from '../../store/store';

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
}

interface CommentProps extends CommentData {
  onReply: (commentId: number, content: string) => void;
  onLike: (commentId: number, isLiked: boolean) => void;
  onToggleReplies?: (commentId: number) => void;
  isExpanded?: boolean;
  isLoadingReplies?: boolean;
  showReplyButton?: boolean;
  onDelete?: (commentId: number) => void;
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
}) => {
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || username;

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return username.charAt(0).toUpperCase();
  };

  const initials = getInitials();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
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

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
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
            <Text style={styles.content}>{content}</Text>
          </View>
          <View style={styles.actions}>
            <Text style={styles.timestamp}>{formatDistanceToNow(timestamp, { addSuffix: true })}</Text>
            <TouchableOpacity onPress={handleLikePress} style={styles.actionButton}>
              <Heart size={14} color={isLiked ? '#EF4444' : '#6B7280'} fill={isLiked ? '#EF4444' : 'none'} />
              <Text style={styles.actionText}>{likes}</Text>
            </TouchableOpacity>
            {showReplyButton && (
              <TouchableOpacity onPress={() => setIsReplying(!isReplying)} style={styles.actionButton}>
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
          {isReplying && (
            <View style={styles.replyInputContainer}>
              <TextInput
                value={replyContent}
                onChangeText={setReplyContent}
                placeholder="Write a reply..."
                style={styles.replyInput}
                onSubmitEditing={handleReplySubmit}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={handleReplySubmit} style={styles.replyButton}>
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
            </View>
          )}
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
    fontWeight: 'bold',
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
    fontWeight: '600',
    fontSize: 14,
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
  },
  content: {
    fontSize: 14,
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  replyButton: {
    backgroundColor: '#1600ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  repliesContainer: {
    marginLeft: 40,
    marginTop: 16,
  },
});



