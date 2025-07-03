import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Share, Dimensions, Modal, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { Heart, MessageCircle, ChevronRight, Trash2 } from 'lucide-react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { useToast } from '../contexts/ToastContext'

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

export default function PostDetail() {
  const navigation = useNavigation()
  const route = useRoute()
  const post = (route.params as RouteParams)?.post
  const { showToast } = useToast()
  const [comment, setComment] = useState('')
  const screenWidth = Dimensions.get('window').width
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)

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

  const handleComment = () => {
    if (!comment.trim()) return;
    showToast('Comment posted successfully!');
    setComment('');
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
              <Image 
                source={{ uri: post.avatarUrl }} 
                style={{width: 40, height: 40, borderRadius: 20}}
              />
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
                  <Text style={{fontSize: 12, color: PrimaryGrey}}>{post.comments}</Text>
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
            <Text style={{fontSize: 16, fontWeight: '600', marginBottom: 16}}>Comments</Text>
            {post.comments === 0 && (
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
                <TouchableOpacity 
                  style={{
                    backgroundColor: PrimaryBlue,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                  }}
                  onPress={() => {
                    // Focus the comment input
                    showToast('Start typing your comment below!');
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>Write a Comment</Text>
                </TouchableOpacity>
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
              onPress={handleComment}
              style={{
                opacity: comment.trim() ? 1 : 0.5,
                padding: 4
              }}
            >
              <ChevronRight size={16} color={PrimaryBlue} />
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
          <Pressable 
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20
            }}
            onPress={() => setShowExitConfirmation(false)}
          >
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 400,
              alignItems: 'center'
            }}>
              <MessageCircle size={40} color={PrimaryBlue} style={{ marginBottom: 16 }} />
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 8,
                textAlign: 'center'
              }}>Discard Comment?</Text>
              <Text style={{
                fontSize: 14,
                color: PrimaryGrey,
                textAlign: 'center',
                marginBottom: 20
              }}>You have an unposted comment. Are you sure you want to leave?</Text>
              <View style={{
                flexDirection: 'row',
                gap: 12,
                width: '100%'
              }}>
                <TouchableOpacity 
                  style={{
                    flex: 1,
                    backgroundColor: LightGrey,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={() => setShowExitConfirmation(false)}
                >
                  <Text style={{ color: PrimaryGrey, fontWeight: '500' }}>Keep Writing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{
                    flex: 1,
                    backgroundColor: PrimaryBlue,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={handleConfirmExit}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>Discard</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
} 