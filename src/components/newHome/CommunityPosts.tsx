import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getPosts } from '../../services/api/social';
import PostResultCard from '../newsearch/PostResultCard';

interface CommunityPostsProps {
  limit?: number;
  startIndex?: number;
  showHeading?: boolean;
}

export default function CommunityPosts({
  limit = 3,
  startIndex = 0,
  showHeading = true,
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
              Activity, updates, and discoveries from your community
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
            Activity, updates, and discoveries from your community
          </Text>
        </View>
      )}

      <View style={styles.postsList}>
        {limitedPosts.map((post: any) => (
          <PostResultCard key={post.id} post={post} />
        ))}
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#4B5563',
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

