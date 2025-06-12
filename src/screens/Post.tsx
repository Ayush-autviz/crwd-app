import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform, Modal, FlatList } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { PrimaryGrey, PrimaryBlue } from '../Constants/Colors'
import { Link, Image as ImageIcon, Calendar, X, ChevronDown } from 'lucide-react-native'
import * as ImagePicker from 'react-native-image-picker'

// Mock data for CRWDs
const CRWDS = [
  { id: "1", name: "Feed the Hungry", avatar: "/mclaren.jpg", subtitle: "Food Insecurity" },
  { id: "2", name: "Animal Rescue", avatar: "/animal.jpg", subtitle: "Animal Welfare" },
  { id: "3", name: "Green Earth", avatar: "/earth.jpg", subtitle: "Environment" },
];

export default function Post() {
  const [postType, setPostType] = useState<'link' | 'image' | 'event' | null>(null)
  const [form, setForm] = useState({
    content: '',
    url: '',
    title: '',
    day: '',
    time: '',
    place: '',
    caption: ''
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [selectedCRWD, setSelectedCRWD] = useState<typeof CRWDS[0] | null>(null)
  const [showCRWDDropdown, setShowCRWDDropdown] = useState(false)

  const handlePostTypeSelect = (type: 'link' | 'image' | 'event') => {
    setPostType(type)
    // Reset form fields
    setForm({
      content: '',
      url: '',
      title: '',
      day: '',
      time: '',
      place: '',
      caption: ''
    })
    setSelectedImage(null)
    setUrlError(null)

    // Handle image picker for image posts
    if (type === 'image') {
      pickImage()
    }
  }

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    }

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker')
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage)
      } else if (response.assets && response.assets[0].uri) {
        setSelectedImage(response.assets[0].uri)
      }
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleUrlBlur = () => {
    if (form.url && !validateUrl(form.url)) {
      setUrlError('Please enter a valid URL')
    } else {
      setUrlError(null)
    }
  }

  const canSubmitPost = () => {
    if (!form.content.trim()) return false

    switch (postType) {
      case 'link':
        return form.url.trim() && validateUrl(form.url) && !urlError
      case 'image':
        return selectedImage !== null
      case 'event':
        return form.title.trim()
      default:
        return false
    }
  }

  const renderCRWDDropdown = () => (
    <Modal
      visible={showCRWDDropdown}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCRWDDropdown(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
      }}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          maxHeight: '80%'
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Select a CRWD</Text>
            <TouchableOpacity onPress={() => setShowCRWDDropdown(false)}>
              <X size={24} color={PrimaryGrey} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={CRWDS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E5E5'
                }}
                onPress={() => {
                  setSelectedCRWD(item)
                  setShowCRWDDropdown(false)
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: PrimaryBlue,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                    {item.name.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.name}</Text>
                  <Text style={{ fontSize: 14, color: PrimaryGrey }}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
      <MainHeaderNav />
      <ScrollView style={{paddingHorizontal: 20}}>
        {!postType ? (
          <View style={{marginTop: 20}}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                marginBottom: 20
              }}
              onPress={() => setShowCRWDDropdown(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {selectedCRWD ? (
                  <>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: PrimaryBlue,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                        {selectedCRWD.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: PrimaryGrey }}>
                      Posting to {selectedCRWD.name}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 14, color: PrimaryGrey }}>
                    Select a CRWD to post to
                  </Text>
                )}
              </View>
              <ChevronDown size={20} color={PrimaryGrey} />
            </TouchableOpacity>

            <TextInput
              style={{
                minHeight: 100,
                borderWidth: 1,
                borderColor: '#E5E5E5',
                borderRadius: 8,
                padding: 10,
                fontSize: 16
              }}
              multiline
              placeholder="What's on your mind?"
              value={form.content}
              onChangeText={(value) => handleInputChange('content', value)}
            />
            <Text style={{fontSize: 12, color: PrimaryGrey, fontStyle: 'italic', marginTop: 8}}>
              You can share an announcement, picture, event, link, etc.
            </Text>
          </View>
        ) : (
          <View style={{marginTop: 20}}>
            <TextInput
              style={{
                minHeight: 100,
                fontSize: 16,
                marginBottom: 20
              }}
              multiline
              placeholder={
                postType === 'link' ? "What's on your mind?" :
                postType === 'image' ? "What's on your mind?" :
                "What's the name of your event?"
              }
              value={form.content}
              onChangeText={(value) => handleInputChange('content', value)}
            />

            {postType === 'link' && (
              <View style={{marginBottom: 20}}>
                <TextInput
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E5E5',
                    paddingVertical: 10,
                    fontSize: 16,
                    color: PrimaryBlue
                  }}
                  placeholder="URL"
                  value={form.url}
                  onChangeText={(value) => handleInputChange('url', value)}
                  onBlur={handleUrlBlur}
                />
                {urlError && (
                  <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>{urlError}</Text>
                )}
              </View>
            )}

            {postType === 'image' && selectedImage && (
              <View style={{marginBottom: 20}}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 8
                  }}
                />
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 15,
                    width: 30,
                    height: 30,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onPress={() => setSelectedImage(null)}
                >
                  <X size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {postType === 'event' && (
              <View style={{gap: 15}}>
                <TextInput
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E5E5',
                    paddingVertical: 10,
                    fontSize: 16
                  }}
                  placeholder="Day"
                  value={form.day}
                  onChangeText={(value) => handleInputChange('day', value)}
                />
                <TextInput
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E5E5',
                    paddingVertical: 10,
                    fontSize: 16
                  }}
                  placeholder="Time"
                  value={form.time}
                  onChangeText={(value) => handleInputChange('time', value)}
                />
                <TextInput
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E5E5',
                    paddingVertical: 10,
                    fontSize: 16
                  }}
                  placeholder="Place"
                  value={form.place}
                  onChangeText={(value) => handleInputChange('place', value)}
                />
                <TextInput
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E5E5',
                    paddingVertical: 10,
                    fontSize: 16
                  }}
                  placeholder="Caption"
                  value={form.caption}
                  onChangeText={(value) => handleInputChange('caption', value)}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        padding: 16,
        backgroundColor: 'white'
      }}>
        <View style={{
          flexDirection: 'row',
          gap: 32,
          marginBottom: 8
        }}>
          <TouchableOpacity onPress={() => handlePostTypeSelect('link')}>
            <Link size={24} color={postType === 'link' ? PrimaryBlue : PrimaryGrey} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePostTypeSelect('image')}>
            <ImageIcon size={24} color={postType === 'image' ? PrimaryBlue : PrimaryGrey} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePostTypeSelect('event')}>
            <Calendar size={24} color={postType === 'event' ? PrimaryBlue : PrimaryGrey} />
          </TouchableOpacity>
        </View>
        <Text style={{
          fontSize: 12,
          color: PrimaryGrey,
          fontStyle: 'italic'
        }}>
          {postType ?
            `Create a ${postType === 'link' ? 'link' : postType === 'image' ? 'photo' : 'event'} post` :
            'Select a post type to get started'
          }
        </Text>
      </View>

      {renderCRWDDropdown()}
    </SafeAreaView>
  )
}