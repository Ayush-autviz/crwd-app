import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, ActivityIndicator, Share, Clipboard } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { likePost, unlikePost, followUserById, unfollowUserById, getUserProfileById } from '../../services/api/social';
import { useAuthStore } from '../../store/store';
import { WEB_BASE_URL } from '../../Constants/url';
import { useToast } from '../../contexts/ToastContext';
import { LightGrey, PrimaryGrey } from '../../Constants/Colors';

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
      color?: string;
    };
    collective?: {
      id: number;
      name: string;
      description?: string;
    };
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
  };
  onCommentPress?: (post: PostResultCardProps['post']) => void;
  showSimplifiedHeader?: boolean; // When true, only show name and timestamp (for collective view)
  isHomeFeed?: boolean;
}

// Generate vibrant avatar colors
const avatarColors = [
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#A855F7', // Violet
  '#14B8A6', // Teal
  '#F43F5E', // Rose
  '#6366F1', // Indigo
  '#22C55E', // Emerald
  '#EAB308', // Yellow
];

// Use user ID to generate a consistent color for each user (same user = same color across all posts)
const getConsistentColor = (id: number | string | undefined, fallbackName?: string) => {
  if (id !== undefined && id !== null) {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  }
  if (fallbackName) {
    const hash = fallbackName.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  }
  return avatarColors[0];
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

export default function PostResultCard({ post, onCommentPress, showSimplifiedHeader = false, isHomeFeed = false }: PostResultCardProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser, token } = useAuthStore();
  const { showToast } = useToast();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const user = post.user;
  // Use user.color first if available, then fall back to consistent color based on ID or username
  const avatarBgColor = user
    ? (user.color || getConsistentColor(user.id, user.username || user.full_name || user.first_name || 'U'))
    : '#6B7280';

  // Get user initials
  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name.charAt(0)}`.toUpperCase()
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
    onError: (error: any) => {
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
    onError: (error: any) => {
      console.error('Error unliking post:', error);
    },
  });

  // Fetch user profile to check follow status
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile', String(user?.id)],
    queryFn: () => getUserProfileById(user?.id?.toString() || ''),
    enabled: !!user?.id && !!token?.access_token && isHomeFeed && user?.id.toString() !== currentUser?.id?.toString(),
    staleTime: 0,
  });

  const isFollowing = userProfile?.is_following || false;

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: (userId: string) => followUserById(userId),
    onSuccess: () => {
      showToast('Following user');
      queryClient.invalidateQueries({ queryKey: ['userProfile', String(user?.id)] });
    },
    onError: (error: any) => {
      console.error('Error following user:', error);
      showToast('Failed to follow user');
    },
  });

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => unfollowUserById(userId),
    onSuccess: () => {
      showToast('Unfollowed user');
      queryClient.invalidateQueries({ queryKey: ['userProfile', String(user?.id)] });
    },
    onError: (error: any) => {
      console.error('Error unfollowing user:', error);
      showToast('Failed to unfollow user');
    },
  });

  const handleFollowPress = () => {
    if (user?.id) {
      if (isFollowing) {
        unfollowMutation.mutate(user.id.toString());
      } else {
        followMutation.mutate(user.id.toString());
      }
    }
  };

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

  const handleShare = async () => {
    try {
      const webUrl = post.fundraiser
        ? `${WEB_BASE_URL}/fundraiser/${post.fundraiser.id}`
        : `${WEB_BASE_URL}/post/${post.id}`;

      const title = post.fundraiser?.name || 'Post';
      const shareMessage = `Check out this ${post.fundraiser ? 'fundraiser' : 'post'}: ${webUrl}`;

      const result = await Share.share({
        message: shareMessage,
        title: title,
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
    } catch (error) {
      console.error('Error sharing post:', error);
      showToast('Error sharing post');
    }
  };

  const handleCardPress = () => {
    if (post.fundraiser) {
      (navigation as any).navigate('FundraiserDetail', { id: post.fundraiser.id });
    } else {
      (navigation as any).navigate('PostDetail', { postId: post.id });
    }
  };

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* User Header */}
        <View style={styles.header}>
          {user && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (currentUser?.id && user?.id && currentUser.id.toString() === user.id.toString()) {
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
                                  routes: [
                                    { name: 'Home' as never },
                                    { name: 'Search' as never },
                                    { name: 'Donate' as never },
                                    { name: 'Collectives' as never },
                                    { name: 'Profile' as never },
                                  ],
                                  index: 4,
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
                  (navigation as any).navigate('UserProfile', { userId: user.id.toString() });
                }
              }}
              activeOpacity={0.7}
            >
              <Avatar size={40} style={styles.avatar}>
                <AvatarImage src={user.profile_picture} />
                <AvatarFallback
                  style={{ backgroundColor: avatarBgColor }}
                  textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TouchableOpacity>
          )}

          <View style={styles.userInfo}>
            {/* Top Row: Name and Follow Button */}
            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (currentUser?.id && user?.id && currentUser.id.toString() === user.id.toString()) {
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
                                    routes: [
                                      { name: 'Home' as never },
                                      { name: 'Search' as never },
                                      { name: 'Donate' as never },
                                      { name: 'Collectives' as never },
                                      { name: 'Profile' as never },
                                    ],
                                    index: 4,
                                  },
                                },
                              ],
                              index: 0,
                            },
                          },
                        ],
                      })
                    );
                  } else if (user?.id) {
                    (navigation as any).navigate('UserProfile', { userId: user.id.toString() });
                  }
                }}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
              </TouchableOpacity>

              {/* Follow Button */}
              {isHomeFeed && user?.id && user.id.toString() !== currentUser?.id?.toString() && (
                <TouchableOpacity
                  onPress={handleFollowPress}
                  disabled={followMutation.isPending || unfollowMutation.isPending || isLoadingProfile}
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton,
                  ]}
                  activeOpacity={0.7}
                >
                  {followMutation.isPending || unfollowMutation.isPending || isLoadingProfile ? (
                    <ActivityIndicator size="small" color={isFollowing ? "#FFFFFF" : "#1600ff"} />
                  ) : (
                    <Text style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Row: Collective Name and Time */}
            <View style={styles.metaRow}>
              {!showSimplifiedHeader && post.collective && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (post.collective?.id) {
                      (navigation as any).navigate('GroupCRWD', { id: post.collective.id.toString() });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.collectiveName}>{post.collective.name}</Text>
                </TouchableOpacity>
              )}
              {/* {!showSimplifiedHeader && post.collective && (
                <Text style={styles.separator}>•</Text>
              )}

              <Text style={styles.time}>{timeAgo}</Text> */}
            </View>
          </View>
        </View>
      </View>

      {/* Post Content - Only show if not fundraiser */}
      {post.content && !post.fundraiser ? (
        <Text style={styles.postContent} numberOfLines={3}>
          {post.content}
        </Text>
      ) : null}

      {/* Media Section - Only show if no fundraiser */}
      {!post.fundraiser && !post.preview_details?.image && post.media && (
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
      )}

      {/* Fundraiser UI */}
      {post.fundraiser ? (
        <TouchableOpacity
          onPress={handleCardPress}
          activeOpacity={0.9}
          style={styles.fundraiserCard}
        >
          {/* Fundraiser Cover Image/Color - rounded-t-lg only */}
          <View style={{ width: '100%', aspectRatio: 3, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' }}>
            {post.fundraiser.color ? (
              <View style={{
                width: '100%',
                height: '100%',
                backgroundColor: post.fundraiser.color,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                  {post.fundraiser.name}
                </Text>
              </View>
            ) : post.fundraiser.image ? (
              <Image
                source={{ uri: post.fundraiser.image }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1600ff',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                  {post.fundraiser.name}
                </Text>
              </View>
            )}
          </View>

          {/* Fundraiser Info - rounded-b-lg only, connected to cover */}
          <View style={{ marginBottom: 8, backgroundColor: 'white', padding: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', borderTopWidth: 0 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
              {post.fundraiser.name}
            </Text>

            {/* Amount and Progress */}
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1600ff' }}>
                  ${parseFloat(post.fundraiser.current_amount || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  raised of ${parseFloat(post.fundraiser.target_amount || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} goal
                </Text>
              </View>
              {/* Progress Bar */}
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
                  width: `${Math.min(post.fundraiser.progress_percentage || 0, 100)}%`
                }} />
              </View>
              {/* Donors and Days Left */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {post.fundraiser.total_donors !== undefined && (
                  <Text style={{ fontSize: 12, color: '#111827' }}>
                    <Text style={{ fontWeight: '600' }}>{post.fundraiser.total_donors}</Text> donor{post.fundraiser.total_donors !== 1 ? 's' : ''}
                  </Text>
                )}
                {post.fundraiser.end_date && post.fundraiser.is_active && (
                  <Text style={{ fontSize: 12, color: '#111827' }}>
                    <Text style={{ fontWeight: '600' }}>
                      {Math.max(0, Math.ceil((new Date(post.fundraiser.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                    </Text> days left
                  </Text>
                )}
                {!post.fundraiser.is_active && (
                  <Text style={{ fontSize: 12, color: '#666', fontWeight: '500' }}>
                    Fundraiser Ended
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        /* Preview Card */
        post.preview_details && (post.preview_details.url || post.preview_details.title || post.preview_details.image) ? (
          <TouchableOpacity
            onPress={() => {
              if (post.preview_details?.url) {
                Linking.openURL(post.preview_details.url);
              }
            }}
            style={styles.previewCardVertical}
            activeOpacity={0.8}
          >
            {post.preview_details.image && (
              <Image
                source={{ uri: post.preview_details.image }}
                style={{ width: '100%', aspectRatio: 3 }}
                resizeMode="cover"
              />
            )}
            <View style={{ padding: 12 }}>
              {post.preview_details.site_name && (
                <Text style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>
                  {post.preview_details.site_name.toUpperCase()}
                </Text>
              )}
              {post.preview_details.title && (
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }} numberOfLines={2}>
                  {post.preview_details.title}
                </Text>
              )}
              {post.preview_details.description && (
                <Text style={{ fontSize: 12, color: '#4B5563' }} numberOfLines={2}>
                  {post.preview_details.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ) : null
      )}

      {/* Like, Comment, and Share */}
      <View style={styles.engagement}>
        <View style={styles.engagementLeft}>
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
                {...(isLiked && { fill: '#EF4444' })}
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
                (navigation as any).navigate('PostDetail', { postId: post.id });
              }
            }}
            activeOpacity={0.7}
          >
            <MessageCircle size={14} color="#4B5563" />
            <Text style={styles.engagementText}>{post.comments_count}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          activeOpacity={0.7}
        >
          <Share2 size={14} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity >
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    // borderWidth: 1,
    // borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  content: {
    // padding: 12,
  },
  founderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#1600ff',
    borderRadius: 9999,
  },
  founderText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '500',
  },
  fundraiserCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    // borderWidth: 1,
    // borderColor: '#E5E7EB',
  },
  inactiveFundraiserCard: {
    backgroundColor: '#eff6ff', // blue-50 equivalent
    borderWidth: 0,
  },
  fundraiserImageContainer: {
    height: 180,
    width: '100%',
  },
  fundraiserPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fundraiserPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fundraiserInfo: {
    padding: 12,
  },
  startedFundraiserText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  fundraiserTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  fundingProgress: {
    gap: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  raisedAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1600ff',
  },
  goalText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1600ff',
  },
  fundraiserStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsText: {
    fontSize: 12,
    color: '#111827',
  },
  statsBold: {
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1600ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#1600ff',
    borderColor: '#1600ff',
  },
  followButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1600ff',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  separator: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  username: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectiveName: {
    fontSize: 12,
    color: PrimaryGrey, // Blue for collective name
    fontWeight: '500',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
  },
  postContent: {
    fontSize: 13,
    color: '#111827',
    marginBottom: 10,
    marginTop: 5,
    lineHeight: 18,
  },
  media: {
    width: '100%',
    aspectRatio: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  fundraiserImagePost: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  fundraiserImagePostStyle: {
    width: '100%',
    height: 200,
    backgroundColor: '#F9FAFB',
  },
  previewCardVertical: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    overflow: 'hidden',
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
  },
  engagementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareButton: {
    padding: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#4B5563',
  },
  likedText: {
    color: '#EF4444',
  },
});

