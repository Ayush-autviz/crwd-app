import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Heart, MessageCircle } from 'lucide-react-native';
import { getPosts } from '../../services/api/social';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { useNavigation } from '@react-navigation/native';

interface CommunityTestimonialsProps {
  limit?: number;
}

export default function CommunityTestimonials({ limit = 3 }: CommunityTestimonialsProps) {
  const navigation = useNavigation();
  // Fetch posts data using React Query
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['community-testimonials'],
    queryFn: () => getPosts('', ''),
    enabled: true,
    retry: false,
  });

  // Get user initials
  const getInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get user display name
  const getUserName = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name.charAt(0)}.`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.username) {
      return user.username;
    }
    return 'User';
  };

  // Get avatar color based on user/collective - variety of colors
  const getAvatarColor = (index: number, userId?: number) => {
    const colors = [
      { bg: '#0000FF', name: 'blue' },
      { bg: '#FF3366', name: 'pink' },
      { bg: '#A855F7', name: 'purple' },
      { bg: '#10B981', name: 'green' },
      { bg: '#F59E0B', name: 'amber' },
      { bg: '#EC4899', name: 'rose' },
      { bg: '#3B82F6', name: 'light-blue' },
      { bg: '#8B5CF6', name: 'violet' },
      { bg: '#14B8A6', name: 'teal' },
      { bg: '#F97316', name: 'orange' },
      { bg: '#EF4444', name: 'red' },
      { bg: '#6366F1', name: 'indigo' },
    ];
    // Use index or userId to determine color
    const colorIndex = userId ? userId % colors.length : index % colors.length;
    return colors[colorIndex];
  };

  // Limit posts to the specified number
  const posts = postsData?.results?.slice(0, limit) || [];

  // Don't render anything if no posts are available (after loading)
  if (!isLoading && posts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>See What's Happening in the Community</Text>
        <Text style={styles.subtitle}>Real posts from people showing up for causes they care about.</Text>

        {/* Posts List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9ca3af" />
          </View>
        ) : posts.length > 0 ? (
          <View style={styles.postsList}>
            {posts.map((post: any, index: number) => {
              const avatarColor = getAvatarColor(index, post.user?.id);
              return (
                <View key={post.id} style={styles.postCard}>
                  {/* User Info */}
                  <View style={styles.userInfo}>
                    <Avatar size={40}>
                      <AvatarImage src={post.user?.profile_picture} />
                      <AvatarFallback
                        textStyle={{ fontSize: 14, color: 'white', fontWeight: '600' }}
                        style={{ backgroundColor: post.user.color || avatarColor.bg }}
                      >
                        {getInitials(post.user)}
                      </AvatarFallback>
                    </Avatar>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{getUserName(post.user)}</Text>
                      {post.collective?.name && (
                        <Text style={styles.collectiveName}>{post.collective.name}</Text>
                      )}
                    </View>
                  </View>

                  {/* Post Content */}
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('PostDetail', { postId: post.id })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.postContent}>{post.content}</Text>
                  </TouchableOpacity>

                  {/* Engagement Metrics */}
                  <View style={styles.engagementRow}>
                    <View style={styles.metricItem}>
                      <Heart size={16} color="#374151" />
                      <Text style={styles.metricText}>{post.likes_count || 0}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <MessageCircle size={16} color="#374151" />
                      <Text style={styles.metricText}>{post.comments_count || 0}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  content: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postsList: {
    gap: 16,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  collectiveName: {
    fontSize: 14,
    color: '#1600ff',
    fontWeight: '500',
  },
  postContent: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
    lineHeight: 20,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});

