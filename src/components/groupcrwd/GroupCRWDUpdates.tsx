import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { PrimaryGrey } from '../../Constants/Colors';
import PopularPosts from '../PopularPosts';

interface GroupCRWDUpdatesProps {
  showEmpty?: boolean;
  joined?: boolean;
}

// Sample data generator for infinite posts
const generateMorePosts = (startId: number, count: number) => {
  return Array.from({ length: count }, (_, index) => ({
      id: String(startId + index),
      avatarUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 70)}.jpg`,
      username: `user${startId + index}`,
      time: `${Math.floor(Math.random() * 7)}d`,
      org: ["youth4change", "cleanwaternow", "treeplanters", "literacyforall"][Math.floor(Math.random() * 4)],
      text: [
          "Making a difference in our community one step at a time! 🌟",
          "Another successful volunteer event completed! Thank you to all participants! 🙏",
          "Working together for a better tomorrow. Join us in our mission! 💪",
          "Every small action counts. Let's create positive change together! ✨"
      ][Math.floor(Math.random() * 4)],
      imageUrl: Math.random() > 0.5 ? `https://picsum.photos/600/400?random=${startId + index}` : undefined,
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 10),
  }));
};

const GroupCRWDUpdates: React.FC<GroupCRWDUpdatesProps> = ({
  showEmpty = false,
  joined = false
}) => {
  // Show empty state if showEmpty is true
  if (showEmpty) {
    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          padding: 24,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 48, color: '#9ca3af' }}>💬</Text>
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
          <TouchableOpacity style={{
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
      </View>
    );
  }

  const [posts, setPosts] = useState(() => generateMorePosts(1, 4));

  

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
      <PopularPosts posts={posts} hasMore={false} title="Activity" postButton={joined} />  
      <View style={{ maxWidth: 600 }}>
        {/* Member Action Post */}
        <View style={{
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
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/31.jpg' }} 
              style={{ width: 40, height: 40, borderRadius: 20 }} 
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  @alex
                </Text>
                <Text style={{ fontSize: 14, color: '#3b82f6' }}>
                  cleanwaterfriends
                </Text>
                <Text style={{ fontSize: 14, color: '#9ca3af' }}>2d</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>
                @alex joined Clean Water Friends. 🌊
              </Text>
            </View>
            <TouchableOpacity style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, color: '#9ca3af' }}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Donation Activity Post */}
        <View style={{
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
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  CRWD Updates
                </Text>
                <Text style={{ fontSize: 14, color: '#9ca3af' }}>1d</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>
                "Save the Trees Atlanta" has collectively made 10 donations. 🌳
              </Text>
            </View>
            <TouchableOpacity style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, color: '#9ca3af' }}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Milestone Post */}
        <View style={{
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
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  CRWD Milestones
                </Text>
                <Text style={{ fontSize: 14, color: '#9ca3af' }}>3d</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#374151' }}>
                "Save the Trees Atlanta" reached 25 members! 🎉
              </Text>
            </View>
            <TouchableOpacity style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, color: '#9ca3af' }}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default GroupCRWDUpdates;
