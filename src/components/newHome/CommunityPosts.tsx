import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getPosts } from '../../services/api/social';
import PostResultCard from '../newsearch/PostResultCard';

interface CommunityPostsProps {
  limit?: number;
  startIndex?: number;
  showHeading?: boolean;
  onCommentPress?: (post: any) => void;
}

export default function CommunityPosts({
  limit = 3,
  startIndex = 0,
  showHeading = true,
  onCommentPress,
}: CommunityPostsProps) {
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', 'home'],
    queryFn: () => getPosts('', '', 1),
    enabled: true,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        {showHeading && (
          <View style={styles.heading}>
            <Text style={styles.title}>Community Updates</Text>
            <Text style={styles.subtitle}>
              Updates and discoveries from your community
            </Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1600ff" />
        </View>
      </View>
    );
  }

  const posts = postsData?.results || [];
  const limitedPosts = posts.slice(startIndex, startIndex + limit);

  if (limitedPosts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showHeading && (
        <View style={styles.heading}>
          <Text style={styles.title}>Community Updates</Text>
          <Text style={styles.subtitle}>
            Updates and discoveries from your community
          </Text>
        </View>
      )}

      <View style={styles.postsList}>
        {limitedPosts.map((post: any) => {
          // Transform post to match PostResultCard format
          const transformedPost = {
            id: post.id,
            content: post.content || '',
            media: post.media || undefined,
            preview_details: post.preview_details || null,
            created_at: post.created_at || post.timestamp || new Date().toISOString(),
            likes_count: post.likes_count || post.likes || 0,
            comments_count: post.comments_count || post.comments || 0,
            is_liked: post.is_liked || false,
            user: post.user ? {
              id: post.user.id,
              username: post.user.username || '',
              first_name: post.user.first_name || post.user.firstName,
              last_name: post.user.last_name || post.user.lastName,
              full_name: post.user.full_name || (post.user.first_name && post.user.last_name ? `${post.user.first_name} ${post.user.last_name}` : undefined),
              profile_picture: post.user.profile_picture || post.user.avatar || '',
              bio: post.user.bio,
              color: post.user.color || undefined,
            } : undefined,
            collective: post.collective ? {
              id: post.collective.id,
              name: post.collective.name,
              description: post.collective.description,
            } : undefined,
            fundraiser: post.fundraiser ? {
              id: post.fundraiser.id,
              name: post.fundraiser.name,
              description: post.fundraiser.description,
              image: post.fundraiser.image,
              color: post.fundraiser.color,
              target_amount: post.fundraiser.target_amount,
              current_amount: post.fundraiser.current_amount,
              progress_percentage: post.fundraiser.progress_percentage,
              is_active: post.fundraiser.is_active,
              total_donors: post.fundraiser.total_donors,
              end_date: post.fundraiser.end_date,
            } : undefined,
          };

          return (
            <PostResultCard
              key={post.id}
              post={transformedPost}
              onCommentPress={onCommentPress ? () => onCommentPress(post) : undefined}
              isHomeFeed={true}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  heading: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    fontFamily: 'Outfit-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'Outfit-Regular',
  },
  postsList: {
    gap: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

