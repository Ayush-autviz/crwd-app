import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PrimaryGrey } from '../../Constants/Colors';
import PopularPosts from '../PopularPosts';
import { MessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface GroupCRWDUpdatesProps {
  showEmpty?: boolean;
  joined?: boolean;
  collectiveData?: any;
  posts?: any[];
  isLoading?: boolean;
  recentActivities?: any[];
}

// Sample data generator for infinite posts
// const generateMorePosts = (startId: number, count: number) => {
//   return Array.from({ length: count }, (_, index) => ({
//       id: String(startId + index),
//       avatarUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 70)}.jpg`,
//       username: `user${startId + index}`,
//       time: `${Math.floor(Math.random() * 7)}d`,
//       org: ["youth4change", "cleanwaternow", "treeplanters", "literacyforall"][Math.floor(Math.random() * 4)],
//       text: [
//           "Making a difference in our community one step at a time! 🌟",
//           "Another successful volunteer event completed! Thank you to all participants! 🙏",
//           "Working together for a better tomorrow. Join us in our mission! 💪",
//           "Every small action counts. Let's create positive change together! ✨"
//       ][Math.floor(Math.random() * 4)],
//       imageUrl: Math.random() > 0.5 ? `https://picsum.photos/600/400?random=${startId + index}` : undefined,
//       likes: Math.floor(Math.random() * 100),
//       comments: Math.floor(Math.random() * 20),
//       shares: Math.floor(Math.random() * 10),
//   }));
// };

const GroupCRWDUpdates: React.FC<GroupCRWDUpdatesProps> = ({
  showEmpty = false,
  joined = false,
  collectiveData,
  posts = [],
  isLoading = false,
  recentActivities = [],
}) => {
  const navigation = useNavigation<any>();
  // Transform API posts to match PopularPosts format
  const transformedPosts = posts.map((post: any) => ({
    id: post.id,
    userId: post.user?.id,
    avatarUrl: post.user?.profile_picture || 'https://randomuser.me/api/portraits/men/1.jpg',
    username: post.user?.username || post.user?.full_name || 'Unknown User',
    time: new Date(post.created_at).toLocaleDateString(),
    org: post.collective?.name || 'Unknown Collective',
    orgUrl: post.collective?.id,
    text: post.content || '',
    imageUrl: post.media || undefined,
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    shares: 0, // API doesn't provide shares count
    isLiked: post.is_liked || false,
  }));

  // Show empty state if showEmpty is true or if posts array is empty
  const shouldShowEmpty = showEmpty || transformedPosts.length === 0;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
      {isLoading ? (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center', 
          paddingVertical: 32 
        }}>
          <ActivityIndicator size="small" color="#6b7280" />
          <Text style={{ 
            marginLeft: 8, 
            fontSize: 14, 
            color: '#6b7280' 
          }}>
            Loading posts...
          </Text>
        </View>
      ) : shouldShowEmpty ? (
        <>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            padding: 24,
            alignItems: 'center',
          }}>
            {/* <Text style={{ fontSize: 48, color: '#9ca3af' }}>💬</Text> */}
            <MessageSquare size={48} color="#9ca3af" />
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: '#111827',
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center'
            }}>
              Be the first one to share
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 16
            }}>
              Start the conversation by sharing an update with your group. Your post will help keep everyone engaged and informed.
            </Text>
            <TouchableOpacity
            onPress={() => navigation.navigate('Post', { collectiveId: collectiveData?.id })}
            style={{
              backgroundColor: '#3b82f6',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
            }}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                Create Post
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Recent Activities - Show even when posts are empty */}
          {recentActivities && recentActivities.length > 0 && (
            <View style={{ maxWidth: 600, marginTop: 16 }}>
              {recentActivities.map((activity: any) => {
                const isCommunityType = activity.type === "community";
                const isDonationType = activity.type === "donation" || activity.type === "donation_activity";
                const isMilestoneType = activity.type === "milestone";
                
                // Extract username from activity body (e.g., "@jake_long" -> "jake_long")
                const usernameMatch = activity.body?.match(/@(\w+)/);
                const username = usernameMatch ? usernameMatch[1] : null;
                
                // Try to get user ID from various possible fields in activity.data
                const userId = 
                  activity.data?.new_member_id || 
                  activity.data?.user_id || 
                  activity.data?.donor_id || 
                  activity.data?.member_id ||
                  activity.data?.creator_id ||
                  null;
                
                // Get initials for fallback
                const getInitials = () => {
                  if (username) {
                    return username.charAt(0).toUpperCase();
                  }
                  // Try to extract first letter from activity body if no username
                  const firstChar = activity.body?.charAt(0);
                  return firstChar ? firstChar.toUpperCase() : '?';
                };
                
                // Determine if we should show avatar (show for all activities with user info)
                const shouldShowAvatar = !!userId || !!username;
                
                // Get profile link - use userId if available, otherwise use username
                const handleProfilePress = () => {
                  if (userId) {
                    navigation.navigate('UserProfile' as never, { userId: userId.toString() } as never);
                  } else if (username) {
                    navigation.navigate('UserProfile' as never, { userId: username } as never);
                  }
                };
                
                // Check if we should make username clickable (has userId or username)
                const canNavigateToProfile = !!userId || !!username;
                
                return (
                  <View
                    key={activity.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      padding: 16,
                      marginBottom: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      {/* Show avatar for all activity types when we have user info */}
                      {shouldShowAvatar ? (
                        canNavigateToProfile ? (
                          <TouchableOpacity onPress={handleProfilePress}>
                            <Avatar size={40}>
                              <AvatarImage src={activity.data?.profile_picture} />
                              <AvatarFallback style={{ backgroundColor: '#f3f4f6' }} textStyle={{ color: '#374151', fontWeight: '600' }}>
                                {getInitials()}
                              </AvatarFallback>
                            </Avatar>
                          </TouchableOpacity>
                        ) : (
                          <Avatar size={40}>
                            <AvatarImage src={activity.data?.profile_picture} />
                            <AvatarFallback style={{ backgroundColor: '#f3f4f6' }} textStyle={{ color: '#374151', fontWeight: '600' }}>
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                        )
                      ) : null}
                      
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {isCommunityType && (
                            <>
                              {username ? (
                                <TouchableOpacity onPress={handleProfilePress}>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                    @{username}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                  @member
                                </Text>
                              )}
                              <Text style={{ fontSize: 14, color: PrimaryGrey }}>
                                {collectiveData?.name?.toLowerCase().replace(/\s+/g, '') || 'collective'}
                              </Text>
                            </>
                          )}
                          {isDonationType && (
                            <>
                              {username ? (
                                <TouchableOpacity onPress={handleProfilePress}>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                    @{username}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                  CRWD Updates
                                </Text>
                              )}
                            </>
                          )}
                          {isMilestoneType && (
                            <>
                              {username ? (
                                <>
                                  <TouchableOpacity onPress={handleProfilePress}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                      @{username}
                                    </Text>
                                  </TouchableOpacity>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                    {' '}· CRWD Milestones
                                  </Text>
                                </>
                              ) : (
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                  CRWD Milestones
                                </Text>
                              )}
                            </>
                          )}
                          {/* Show username for other activity types if present */}
                          {!isCommunityType && !isDonationType && !isMilestoneType && username && (
                            <TouchableOpacity onPress={handleProfilePress}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                @{username}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <Text style={{ fontSize: 14, color: '#9ca3af' }}>
                            {activity.timestamp || 'Recently'}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 14, color: '#374151' }}>
                          {activity.body || activity.title}
                        </Text>
                      </View>
                      <TouchableOpacity style={{ padding: 4 }}>
                        <Text style={{ fontSize: 18, color: '#9ca3af' }}>⋯</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      ) : (
        <View style={{ paddingTop: 8 }}>
          <PopularPosts 
            posts={transformedPosts} 
            hasMore={false} 
            title="Conversations" 
            postButton={joined} 
            subheading
            collectiveId={collectiveData?.id}
          />  
          {/* Recent Activities - Always shown under posts */}
          {recentActivities && recentActivities.length > 0 && (
            <View style={{ maxWidth: 600, marginTop: 16 }}>
              {recentActivities.map((activity: any) => {
                const isCommunityType = activity.type === "community";
                const isDonationType = activity.type === "donation" || activity.type === "donation_activity";
                const isMilestoneType = activity.type === "milestone";
                
                // Extract username from activity body (e.g., "@jake_long" -> "jake_long")
                const usernameMatch = activity.body?.match(/@(\w+)/);
                const username = usernameMatch ? usernameMatch[1] : null;
                
                // Try to get user ID from various possible fields in activity.data
                const userId = 
                  activity.data?.new_member_id || 
                  activity.data?.user_id || 
                  activity.data?.donor_id || 
                  activity.data?.member_id ||
                  activity.data?.creator_id ||
                  null;
                
                // Get initials for fallback
                const getInitials = () => {
                  if (username) {
                    return username.charAt(0).toUpperCase();
                  }
                  // Try to extract first letter from activity body if no username
                  const firstChar = activity.body?.charAt(0);
                  return firstChar ? firstChar.toUpperCase() : '?';
                };
                
                // Determine if we should show avatar (show for all activities with user info)
                const shouldShowAvatar = !!userId || !!username;
                
                // Get profile link - use userId if available, otherwise use username
                const handleProfilePress = () => {
                  if (userId) {
                    navigation.navigate('UserProfile' as never, { userId: userId.toString() } as never);
                  } else if (username) {
                    navigation.navigate('UserProfile' as never, { userId: username } as never);
                  }
                };
                
                // Check if we should make username clickable (has userId or username)
                const canNavigateToProfile = !!userId || !!username;
                
                return (
                  <View
                    key={activity.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      padding: 16,
                      marginBottom: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      {/* Show avatar for all activity types when we have user info */}
                      {shouldShowAvatar ? (
                        canNavigateToProfile ? (
                          <TouchableOpacity onPress={handleProfilePress}>
                            <Avatar size={40}>
                              <AvatarImage src={activity.data?.profile_picture} />
                              <AvatarFallback style={{ backgroundColor: '#f3f4f6' }} textStyle={{ color: '#374151', fontWeight: '600' }}>
                                {getInitials()}
                              </AvatarFallback>
                            </Avatar>
                          </TouchableOpacity>
                        ) : (
                          <Avatar size={40}>
                            <AvatarImage src={activity.data?.profile_picture} />
                            <AvatarFallback style={{ backgroundColor: '#f3f4f6' }} textStyle={{ color: '#374151', fontWeight: '600' }}>
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                        )
                      ) : null}
                      
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {isCommunityType && (
                            <>
                              {username ? (
                                <TouchableOpacity onPress={handleProfilePress}>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                    @{username}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                  @member
                                </Text>
                              )}
                              <Text style={{ fontSize: 14, color: PrimaryGrey }}>
                                {collectiveData?.name?.toLowerCase().replace(/\s+/g, '') || 'collective'}
                              </Text>
                            </>
                          )}
                          {isDonationType && (
                            <>
                              {username ? (
                                <TouchableOpacity onPress={handleProfilePress}>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                    @{username}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                  CRWD Updates
                                </Text>
                              )}
                            </>
                          )}
                          {isMilestoneType && (
                            <>
                              {username ? (
                                <>
                                  <TouchableOpacity onPress={handleProfilePress}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                      @{username}
                                    </Text>
                                  </TouchableOpacity>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                    {' '}· CRWD Milestones
                                  </Text>
                                </>
                              ) : (
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                  CRWD Milestones
                                </Text>
                              )}
                            </>
                          )}
                          {/* Show username for other activity types if present */}
                          {!isCommunityType && !isDonationType && !isMilestoneType && username && (
                            <TouchableOpacity onPress={handleProfilePress}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                @{username}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <Text style={{ fontSize: 14, color: '#9ca3af' }}>
                            {activity.timestamp || 'Recently'}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 14, color: '#374151' }}>
                          {activity.body || activity.title}
                        </Text>
                      </View>
                      <TouchableOpacity style={{ padding: 4 }}>
                        <Text style={{ fontSize: 18, color: '#9ca3af' }}>⋯</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default GroupCRWDUpdates;
