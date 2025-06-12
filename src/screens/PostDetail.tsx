import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { PrimaryGrey, PrimaryBlue } from '../Constants/Colors'
import { Heart, MessageCircle } from 'lucide-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'

export default function PostDetail() {
  const navigation = useNavigation()
  const route = useRoute()
  const post = route.params?.post

  if (!post) {
    return (
      <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
        <MainHeaderNav show />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>Post not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
      <MainHeaderNav show />
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
              <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
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
            {/* Add your comments list here */}
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
            paddingVertical: 8
          }}>
            <Image 
              source={{ uri: post.avatarUrl }} 
              style={{width: 24, height: 24, borderRadius: 12, marginRight: 8}}
            />
            <TextInput
              placeholder="Join the conversation"
              style={{
                flex: 1,
                fontSize: 14,
                color: PrimaryGrey
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
} 