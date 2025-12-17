import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Heart, MessageCircle } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, unlikePost } from '../../services/api/social';
import { useAuthStore } from '../../store/store';

interface PreviewDetails {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string;
  domain?: string | null;
  site_name?: string | null;
}

interface PostResultCardProps {
  post: {
    id: number;
    content: string;
    media?: string;
    preview_details?: PreviewDetails | null;
    created_at: string;
    likes_count: number;
    comments_count: number;
    is_liked?: boolean;
    user?: {
      id: number;
      username: string;
      first_name?: string;
      last_name?: string;
      full_name?: string;
      profile_picture?: string;
      bio?: string;
    };
    collective?: {
      id: number;
      name: string;
      description?: string;
    };
  };
  onCommentPress?: (post: PostResultCardProps['post']) => void;
}

// Get consistent color for avatar
const avatarColors = [
  '#3B82F6',
  '#EC4899',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#F97316',
  '#84CC16',
  '#A855F7',
  '#14B8A6',
  '#F43F5E',
  '#6366F1',
  '#22C55E',
  '#EAB308',
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash =
    typeof id === 'number'
      ? id
      : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Format date to relative time
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function PostResultCard({ post, onCommentPress }: PostResultCardProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  
  const user = post.user;
  const avatarBgColor = user ? getConsistentColor(user.id, avatarColors) : '#6B7280';

  // Get user initials
  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
      : user?.username?.charAt(0).toUpperCase() || 'U';

  // Get full name
  const fullName =
    user?.full_name ||
    (user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.username || 'Unknown User');

  // Format timestamp
  const timeAgo = formatTimeAgo(post.created_at);

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: () => likePost(post.id.toString()),
    onSuccess: () => {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
    },
    onError: (error) => {
      console.error('Error liking post:', error);
    },
  });

  // Unlike post mutation
  const unlikeMutation = useMutation({
    mutationFn: () => unlikePost(post.id.toString()),
    onSuccess: () => {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(prev - 1, 0));
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
    },
    onError: (error) => {
      console.error('Error unliking post:', error);
    },
  });

  const handleLikePress = () => {
    if (!currentUser?.id) {
      // Navigate to login if not authenticated
      navigation.navigate('Login' as never);
      return;
    }
    
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('PostDetail' as never, { postId: post.id } as never)}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* User Header */}
        <View style={styles.header}>
          {user && (
            <Avatar size={40} style={styles.avatar}>
              <AvatarImage src={user.profile_picture} />
              <AvatarFallback
                style={{ backgroundColor: avatarBgColor }}
                textStyle={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{fullName}</Text>
              {post.collective && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.collectiveName}>{post.collective.name}</Text>
                </>
              )}
            </View>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
        </View>

        {/* Post Content */}
        {post.content ? (
          <Text style={styles.postContent} numberOfLines={3}>
            {post.content}
          </Text>
        ) : null}

        {/* Preview Card or Media */}
        {post.preview_details && (post.preview_details.url || post.preview_details.title || post.preview_details.image) ? (
          <TouchableOpacity
            onPress={() => {
              if (post.preview_details?.url) {
                Linking.openURL(post.preview_details.url);
              }
            }}
            style={[
              styles.previewCard,
              !post.preview_details.image && styles.previewCardNoImage,
            ]}
            activeOpacity={0.8}
          >
            {post.preview_details.image && (
              <Image
                source={{ uri: post.preview_details.image }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.previewContent}>
              {post.preview_details.site_name && (
                <Text style={styles.previewSiteName} numberOfLines={1}>
                  {post.preview_details.site_name.toUpperCase()}
                </Text>
              )}
              {post.preview_details.title && (
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {post.preview_details.title}
                </Text>
              )}
              {post.preview_details.description && (
                <Text style={styles.previewDescription} numberOfLines={2}>
                  {post.preview_details.description}
                </Text>
              )}
              {post.preview_details.domain && (
                <Text style={styles.previewDomain} numberOfLines={1}>
                  {post.preview_details.domain}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ) : post.media ? (
          <TouchableOpacity
            onPress={() => {
              if (post.media) {
                Linking.openURL(post.media);
              }
            }}
            activeOpacity={0.9}
          >
            <Image source={{ uri: post.media }} style={styles.media} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}

        {/* Like and Comment Counts */}
        <View style={styles.engagement}>
          <TouchableOpacity
            style={styles.engagementItem}
            onPress={handleLikePress}
            activeOpacity={0.7}
            disabled={likeMutation.isPending || unlikeMutation.isPending}
          >
            {likeMutation.isPending || unlikeMutation.isPending ? (
              <ActivityIndicator size={14} color="#4B5563" />
            ) : (
              <Heart
                size={14}
                color={isLiked ? '#EF4444' : '#4B5563'}
                fill={isLiked ? '#EF4444' : 'none'}
              />
            )}
            <Text style={[styles.engagementText, isLiked && styles.likedText]}>
              {likesCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.engagementItem}
            onPress={() => {
              if (onCommentPress) {
                onCommentPress(post);
              } else {
                navigation.navigate('PostDetail' as never, { postId: post.id } as never);
              }
            }}
            activeOpacity={0.7}
          >
            <MessageCircle size={14} color="#4B5563" />
            <Text style={styles.engagementText}>{post.comments_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    borderRadius: 20,
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  separator: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  collectiveName: {
    fontSize: 12,
    color: '#1600ff',
    fontWeight: '500',
  },
  time: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  postContent: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 10,
    lineHeight: 18,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    overflow: 'hidden',
  },
  previewCardNoImage: {
    flexDirection: 'column',
  },
  previewImage: {
    width: 120,
    height: 120,
    flexShrink: 0,
  },
  previewContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  previewSiteName: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 16,
  },
  previewDescription: {
    fontSize: 10,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 14,
  },
  previewDomain: {
    fontSize: 10,
    color: '#6B7280',
  },
  engagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#4B5563',
  },
  likedText: {
    color: '#EF4444',
  },
});

