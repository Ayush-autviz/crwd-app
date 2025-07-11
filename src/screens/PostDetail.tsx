import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Share, Dimensions, Modal, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { Heart, MessageCircle, ChevronRight, Trash2 } from 'lucide-react-native'
import { useNavigation, useRoute, useFocusEffect, NavigationProp } from '@react-navigation/native'
import { useToast } from '../contexts/ToastContext'
import { formatDistanceToNow } from 'date-fns'

interface CommentData {
  id: number;
  username: string;
  avatarUrl: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: CommentData[];
}

interface Post {
  id: string;
  text: string;
  username: string;
  avatarUrl: string;
  imageUrl?: string;
  time: string;
  org: string;
  likes: number;
  comments: number;
  shares: number;
}

interface RouteParams {
  post: Post;
}

// Default comments for specific posts
const defaultComments: Record<string, CommentData[]> = {
  "2": [
    {
      id: 1,
      username: "volunteer_123",
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      content: "This is so inspiring! I'd love to join next time. When do you usually volunteer?",
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      likes: 5,
      replies: [
        {
          id: 2,
          username: "mynameismya",
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          content: "We're there every Saturday morning from 9 AM! Would love to have you join us 😊",
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          likes: 2,
          replies: []
        }
      ]
    }
  ],
  "4": [
    {
      id: 3,
      username: "pet_lover",
      avatarUrl: "https://randomuser.me/api/portraits/women/32.jpg",
      content: "Those puppies are absolutely adorable! 😍 Are they all available for adoption?",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      likes: 8,
      replies: [
        {
          id: 4,
          username: "mynameismya",
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          content: "Yes, they are! The shelter is open daily from 10 AM to 4 PM for visits.",
          timestamp: new Date(Date.now() - 82800000), // 23 hours ago
          likes: 3,
          replies: []
        }
      ]
    }
  ]
};

const Comment = ({ comment, onReply, onLike, level = 0 }: { 
  comment: CommentData; 
  onReply: (commentId: number, content: string) => void;
  onLike: (commentId: number) => void;
  level?: number;
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(comment.id);
  };

  return (
    <View style={{ marginLeft: level * 20 }}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <Image 
          source={{ uri: comment.avatarUrl }} 
          style={{ width: 32, height: 32, borderRadius: 16 }} 
        />
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: LightGrey, padding: 12, borderRadius: 12 }}>
            <Text style={{ fontWeight: '500', fontSize: 14, marginBottom: 4 }}>@{comment.username}</Text>
            <Text style={{ fontSize: 14 }}>{comment.content}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <Text style={{ fontSize: 12, color: PrimaryGrey }}>
              {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
            </Text>
            <TouchableOpacity 
              onPress={handleLike}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Heart size={16} color={isLiked ? PrimaryBlue : PrimaryGrey} />
              <Text style={{ fontSize: 12, color: PrimaryGrey }}>{comment.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setIsReplying(!isReplying)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <MessageCircle size={16} color={PrimaryGrey} />
              <Text style={{ fontSize: 12, color: PrimaryGrey }}>Reply</Text>
            </TouchableOpacity>
          </View>

          {isReplying && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Image 
                source={{ uri: comment.avatarUrl }} 
                style={{ width: 24, height: 24, borderRadius: 12 }} 
              />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={replyContent}
                  onChangeText={setReplyContent}
                  placeholder="Write a reply..."
                  style={{
                    flex: 1,
                    backgroundColor: LightGrey,
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    fontSize: 14
                  }}
                />
                <TouchableOpacity
                  onPress={handleReply}
                  style={{
                    backgroundColor: PrimaryBlue,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 14 }}>Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Render replies */}
      {comment.replies.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onLike={onLike}
          level={level + 1}
        />
      ))}
    </View>
  );
};

type RootStackParamList = {
  UserProfile: { imageUrl: string; username: string };
  PostDetail: { post: Post };
};

export default function PostDetail() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute()
  const post = (route.params as RouteParams)?.post
  const { showToast } = useToast()
  const [comment, setComment] = useState('')
  const screenWidth = Dimensions.get('window').width
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [comments, setComments] = useState<CommentData[]>(
    defaultComments[post?.id] || []
  );

  // Handle back button and navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!comment.trim()) {
        // If no comment, allow navigation
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Show confirmation modal
      setShowExitConfirmation(true);
    });

    return unsubscribe;
  }, [navigation, comment]);

  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
    setComment('');
    navigation.goBack();
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: post.text,
        title: `Post by ${post.username}`,
      });

      if (result.action === Share.sharedAction) {
        showToast('Post shared successfully!');
      }
    } catch (error) {
      showToast('Failed to share post');
      console.error('Error sharing:', error);
    }
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    const newComment: CommentData = {
      id: Date.now(),
      username: "current_user",
      avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
      content: comment,
      timestamp: new Date(),
      likes: 0,
      replies: []
    };

    setComments(prevComments => [newComment, ...prevComments]);
    showToast('Comment posted successfully!');
    setComment('');
  };

  const handleReply = (commentId: number, content: string) => {
    const newReply: CommentData = {
      id: Date.now(),
      username: "current_user",
      avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
      content: content,
      timestamp: new Date(),
      likes: 0,
      replies: []
    };

    setComments(prevComments => {
      const addReplyToComment = (comments: CommentData[]): CommentData[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...comment.replies, newReply]
            };
          }
          if (comment.replies.length > 0) {
            return {
              ...comment,
              replies: addReplyToComment(comment.replies)
            };
          }
          return comment;
        });
      };

      return addReplyToComment(prevComments);
    });
  };

  const handleLike = (commentId: number) => {
    setComments(prevComments => {
      const updateCommentLikes = (comments: CommentData[]): CommentData[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: comment.likes + 1
            };
          }
          if (comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentLikes(comment.replies)
            };
          }
          return comment;
        });
      };

      return updateCommentLikes(prevComments);
    });
  };

  if (!post) {
    return (
      <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
        <MainHeaderNav show menu={false} post={false} />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>Post not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
       <MainHeaderNav show menu={false} post={false} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
        <ScrollView style={{flex: 1}}>
          {/* Post Content */}
          <View style={{padding: 20}}>
            <View style={{flexDirection: 'row', gap: 12}}>
              <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { imageUrl: post.avatarUrl, username: post.username })}>
                <Image 
                  source={{ uri: post.avatarUrl }} 
                  style={{width: 40, height: 40, borderRadius: 20}}
                />
              </TouchableOpacity>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                  <Text style={{fontSize: 14, fontWeight: '500'}}>{post.username}</Text>
                  <Text style={{fontSize: 14, color: PrimaryGrey}}>•</Text>
                  <Text style={{fontSize: 12, color: PrimaryGrey}}>{post.time}</Text>
                </View>
                <Text style={{fontSize: 12, color: PrimaryBlue, marginTop: 5}}>{post.org}</Text>
              </View>
            </View>

            <Text style={{fontSize: 14, marginTop: 12, lineHeight: 20}}>{post.text}</Text>

            {post.imageUrl && (
              <Image 
                source={{ uri: post.imageUrl }} 
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 8,
                  marginTop: 12
                }}
              />
            )}

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#E5E5E5'
            }}>
              <View style={{flexDirection: 'row', gap: 24}}>
                <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <Heart size={18} color={PrimaryGrey} />
                  <Text style={{fontSize: 12, color: PrimaryGrey}}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <MessageCircle size={18} color={PrimaryGrey} />
                  <Text style={{fontSize: 12, color: PrimaryGrey}}>{comments.length}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={{flexDirection: 'row', alignItems: 'center', gap: 4}}
                onPress={handleShare}
              >
                <Image 
                  source={require('../assets/icons/forward.png')} 
                  style={{ width: 18, height: 18 }} 
                />
                <Text style={{fontSize: 12, color: PrimaryGrey}}>{post.shares}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={{padding: 20, borderTopWidth: 1, borderTopColor: '#E5E5E5'}}>
            <Text style={{fontSize: 16, fontWeight: '600', marginBottom: 16}}>
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </Text>
            
            {comments.length === 0 ? (
              <View style={{
                alignItems: 'center',
                padding: 20,
                backgroundColor: LightGrey,
                borderRadius: 12,
                marginBottom: 20
              }}>
                <MessageCircle size={40} color={PrimaryGrey} style={{ marginBottom: 12 }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: PrimaryGrey,
                  marginBottom: 8
                }}>No comments yet</Text>
                <Text style={{
                  fontSize: 14,
                  color: PrimaryGrey,
                  textAlign: 'center',
                  marginBottom: 12
                }}>Be the first one to share your thoughts!</Text>
              </View>
            ) : (
              <View style={{ marginBottom: 20 }}>
                {comments.map((comment) => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onLike={handleLike}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Join Conversation Input */}
        <View style={{
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          padding: 16,
          backgroundColor: 'white'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            gap: 8
          }}>
            <Image 
              source={{ uri: post.avatarUrl }} 
              style={{width: 24, height: 24, borderRadius: 12}}
            />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                placeholder="Share your thoughts..."
                value={comment}
                onChangeText={setComment}
                multiline
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: PrimaryGrey,
                  maxHeight: 100,
                  paddingTop: Platform.OS === 'ios' ? 0 : 0
                }}
              />
              {comment.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setComment('')}
                  style={{
                    padding: 4,
                    marginRight: 4
                  }}
                >
                  <Trash2 size={16} color={PrimaryGrey} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              onPress={handleAddComment}
              style={{
                opacity: comment.trim() ? 1 : 0.5,
                padding: 4,
                borderColor: PrimaryBlue,
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{fontSize: 14}}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exit Confirmation Modal */}
        <Modal
          transparent={true}
          visible={showExitConfirmation}
          onRequestClose={() => setShowExitConfirmation(false)}
          animationType="fade"
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              width: '100%',
              maxWidth: 400
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 8
              }}>Leave this page?</Text>
              <Text style={{
                fontSize: 14,
                color: PrimaryGrey,
                marginBottom: 20
              }}>You have typed a comment. If you leave now, your comment will be lost.</Text>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 12
              }}>
                <TouchableOpacity
                  onPress={() => setShowExitConfirmation(false)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#E5E5E5'
                  }}
                >
                  <Text>Stay on this page</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmExit}
                  style={{
                    backgroundColor: '#EF4444',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6
                  }}
                >
                  <Text style={{ color: 'white' }}>Leave anyway</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 