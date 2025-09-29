import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform, Modal, FlatList } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { Link, Image as ImageIcon, Calendar, X, ChevronDown } from 'lucide-react-native'
import * as ImagePicker from 'react-native-image-picker'
import { useNavigation } from '@react-navigation/native'

// Mock data for CRWDs
const CRWDS = [
  { id: "1", name: "Feed the Hungry", avatar: "/mclaren.jpg", subtitle: "Food Insecurity" },
  { id: "2", name: "Animal Rescue", avatar: "/animal.jpg", subtitle: "Animal Welfare" },
  { id: "3", name: "Green Earth", avatar: "/earth.jpg", subtitle: "Environment" },
];

export default function Post() {
  const navigation = useNavigation();
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
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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

  const handleCRWDSelect = (crwd: typeof CRWDS[0]) => {
    setSelectedCRWD(crwd);
    setShowCRWDDropdown(false);
    // Show success modal after CRWD selection
    // setShowSuccessModal(true);
  };

  const handleGoToHome = () => {
    setShowSuccessModal(false);
    navigation.navigate('DrawerNav' as never, { 
      screen: 'MainTabs',
      params: { screen: 'Home' }
    } as never);
  };

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
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Select a CRWD Collective</Text>
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
                onPress={() => handleCRWDSelect(item)}
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
      <MainHeaderNav show title={'Create a Post'} menu={false}/>
      <ScrollView style={{paddingHorizontal: 20}}>
      <View style={{marginTop: 20}}>
          <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>Post to a CRWD Collective</Text>
          
          {/* CRWD Selection */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              backgroundColor: LightGrey,
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
                  Select a CRWD Collective (required)
                </Text>
              )}
            </View>
            <ChevronDown size={20} color={PrimaryGrey} />
          </TouchableOpacity>

          {/* Main Text Input */}
          <TextInput
            style={{
              minHeight: 100,
              borderWidth: 1,
              borderColor: '#E5E5E5',
              borderRadius: 8,
              padding: 10,
              fontSize: 16,
              marginBottom: 20
            }}
            multiline
            placeholderTextColor={PrimaryGrey}
            placeholder="What's on your mind?"
            value={form.content}
            onChangeText={(value) => handleInputChange('content', value)}
          />
          
          {/* Post Type Icons */}
          <View style={{
            flexDirection: 'row',
            gap: 32,
            marginBottom: 20
          }}>
            <TouchableOpacity onPress={() => handlePostTypeSelect('link')}>
              <Link size={24} color={postType === 'link' ? PrimaryBlue : PrimaryGrey} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePostTypeSelect('image')}>
              <ImageIcon size={24} color={postType === 'image' ? PrimaryBlue : PrimaryGrey} />
            </TouchableOpacity>
          </View>
          
          {/* Helper Text */}
          <Text style={{
            fontSize: 12,
            color: PrimaryGrey,
            fontStyle: 'italic',
            marginBottom: 20
          }}>
            {postType ? 
              'Add a link or image' : 
              'Select a post type to get started'
            }
          </Text>

          {/* Link Form Fields - Shows inline when link icon is clicked */}
          {postType === 'link' && (
            <View style={{marginBottom: 20}}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E5E5',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 8
                }}
                placeholder="URL"
                placeholderTextColor={PrimaryGrey}
                value={form.url}
                onChangeText={(value) => handleInputChange('url', value)}
                onBlur={handleUrlBlur}
              />
              {urlError && (
                <Text style={{color: 'red', fontSize: 12, marginBottom: 8}}>{urlError}</Text>
              )}
            </View>
          )}

          {/* Image Form Fields - Shows inline when image icon is clicked */}
          {postType === 'image' && (
            <View style={{marginBottom: 20}}>
              {!selectedImage ? (
                <TouchableOpacity
                  style={{
                    borderWidth: 2,
                    borderColor: '#E5E5E5',
                    borderStyle: 'dashed',
                    borderRadius: 8,
                    padding: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FAFAFA'
                  }}
                  onPress={pickImage}
                >
                  <ImageIcon size={32} color={PrimaryGrey} />
                  <Text style={{ color: PrimaryGrey, marginTop: 8, fontSize: 14 }}>
                    Tap to add a photo
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <Image
                    source={{ uri: selectedImage }}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 8,
                      marginBottom: 8
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#EF4444',
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      alignSelf: 'flex-start'
                    }}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                      Remove Photo
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
        {/* } */}
      {/* </ScrollView> */}

      {/* Post Button */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        padding: 16,
        backgroundColor: 'white'
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: canSubmitPost() ? PrimaryBlue : '#E5E5E5',
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: 'center',
            opacity: canSubmitPost() ? 1 : 0.6
          }}
          disabled={!canSubmitPost()}
          onPress={() => {
            // TODO: Implement post submission logic
            console.log('Post submitted:', { postType, form, selectedImage, selectedCRWD });
            setShowSuccessModal(true);
          }}
        >
          <Text style={{
            color: canSubmitPost() ? 'white' : '#9CA3AF',
            fontSize: 16,
            fontWeight: '600'
          }}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      {renderCRWDDropdown()}

      {/* Success Modal - Same as crwd-vite */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
            gap: 16,
            maxWidth: 300,
            width: '100%'
          }}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              textAlign: 'center',
              lineHeight: 28
            }}>
              Your post has been created for{' '}
              <Text style={{ color: PrimaryBlue, fontWeight: 'bold' }}>
                {selectedCRWD?.name}
              </Text>
              !
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: PrimaryBlue,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                width: '100%',
                alignItems: 'center'
              }}
              onPress={handleGoToHome}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '500'
              }}>
                Go to Home
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}