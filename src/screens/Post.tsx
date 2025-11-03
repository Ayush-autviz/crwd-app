import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform, Modal, FlatList, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { Link, Image as ImageIcon, Calendar, X, ChevronDown, User } from 'lucide-react-native'
import * as ImagePicker from 'react-native-image-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPost } from '../services/api/social'
import { getCollectives } from '../services/api/crwd'
import { useToast } from '../contexts/ToastContext'
import { useAuthStore } from '../store/store'

export default function Post() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user: currentUser } = useAuthStore();

  // Get collective ID from route params
  const collectiveId = route.params?.collectiveId;
  console.log('Collective ID from params:', collectiveId);
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
  const [selectedCRWD, setSelectedCRWD] = useState<any>(null)
  const [showCRWDDropdown, setShowCRWDDropdown] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Fetch collectives for CRWD selection
  const { data: collectivesData, isLoading: isLoadingCollectives } = useQuery({
    queryKey: ['collectives'],
    queryFn: () => getCollectives(),
  });

  // If collectiveId is provided via params, find and set the collective
  React.useEffect(() => {
    if (collectiveId && collectivesData?.results) {
      const foundCollective = collectivesData.results.find((collective: any) => collective.id.toString() === collectiveId.toString());
      if (foundCollective) {
        console.log('Found collective from params:', foundCollective);
        setSelectedCRWD(foundCollective);
      }
    }
  }, [collectiveId, collectivesData]);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (response) => {
      console.log('Post created successfully:', response);
      showToast('Post created successfully!', 3000);
      setShowSuccessModal(true);
      // Invalidate posts queries to refresh the feed
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      console.error('Error creating post:', error);
      showToast('Failed to create post. Please try again.', 3000);
    },
  });

  const handlePostTypeSelect = (type: 'link' | 'image' | 'event') => {
    setPostType(type)
    // Reset form fields
    // setForm({
    //   content: '',
    //   url: '',
    //   title: '',
    //   day: '',
    //   time: '',
    //   place: '',
    //   caption: ''
    // })
    setSelectedImage(null)
    setUrlError(null)

    // Handle image picker for image posts
    if (type === 'image') {
      pickImage()
    }
  }

  const pickImage = () => {
    const options: ImagePicker.ImageLibraryOptions = {
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

  const handleCRWDSelect = (crwd: any) => {
    console.log('CRWD selected:', crwd);
    console.log('CRWD ID:', crwd.id);
    setSelectedCRWD(crwd);
    setShowCRWDDropdown(false);
  };

  // Handle form submission
  const handleSubmitPost = () => {
    if (!canSubmitPost() || createPostMutation.isPending) return;

    console.log('Submitting post with collective ID:', selectedCRWD.id);
    console.log('Post content:', form.content);
    console.log('Post type:', postType);
    console.log('Selected image:', selectedImage);

    const formData = new FormData();
    formData.append('collective_id', selectedCRWD.id.toString());
    formData.append('content', form.content);

    // Add media file if it's an image post
    if (postType === 'image' && selectedImage) {
      formData.append('media_file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
    }

    console.log('FormData being sent:', formData);
    createPostMutation.mutate(formData);
  };

  const handleGoToHome = () => {
    setShowSuccessModal(false);
    // navigation.navigate('DrawerNav', { 
    //   screen: 'MainTabs',
    //   params: { screen: 'Home' }
    // });
    navigation.goBack()
  };

  if (!currentUser?.id) {
            return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav title={'Create a Post'} show={true} />
                <View style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    paddingHorizontal: 32,
                    backgroundColor: 'white'
                }}>
                    {/* Icon */}
                    <View style={{
                        width: 80,
                        height: 80,
                        backgroundColor: '#dbeafe',
                        borderRadius: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 24
                    }}>
                        <User size={40} color={PrimaryBlue} />
                    </View>
                    
                    {/* Title */}
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: 12,
                        textAlign: 'center'
                    }}>
                        Sign in to create a post
                    </Text>
                    
                    {/* Description */}
                    <Text style={{
                        fontSize: 16,
                        color: '#6b7280',
                        marginBottom: 32,
                        textAlign: 'center',
                        lineHeight: 24
                    }}>
                        Sign in to create a post, manage your causes, and connect with your community.
                    </Text>
                    
                    {/* CTA Button */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login' as never)}
                        style={{
                            backgroundColor: '#2563eb',
                            paddingHorizontal: 32,
                            paddingVertical: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                            Sign In to Continue
                        </Text>
                    </TouchableOpacity>
                    
                    {/* Additional Info */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ClaimProfile' as never)}
                      >
                    <Text style={{
                        fontSize: 14,
                        color: '#6b7280',
                        marginTop: 24,
                        textAlign: 'center'
                    }}>
                        Don't have an account? 
                        <Text style={{ color: '#2563eb', fontWeight: '500' }}> Create one here</Text>
                    </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
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
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Select a CRWD Collective</Text>
            <TouchableOpacity onPress={() => setShowCRWDDropdown(false)}>
              <X size={24} color={PrimaryGrey} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={collectivesData?.results || []}
            keyExtractor={(item) => item.id.toString()}
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
                  <Text style={{ fontSize: 14, color: PrimaryGrey }}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  )

  // Check if user is logged in
  if (!currentUser?.id) {
    return (
      <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
        <MainHeaderNav show title={'Create a Post'} menu={false}/>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          paddingHorizontal: 32 
        }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: 8,
            textAlign: 'center'
          }}>
            Sign in to create posts
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 24
          }}>
            You need to be signed in to create and share posts with your community.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: PrimaryBlue,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '500'
            }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
      <MainHeaderNav show title={'Create a Post'} menu={false}/>
      <ScrollView style={{paddingHorizontal: 20}}>
      <View style={{marginTop: 20}}>
          <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>Post to a CRWD Collective</Text>
          
          {/* CRWD Selection */}
          {/* <TouchableOpacity
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
          </TouchableOpacity> */}

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
            opacity: canSubmitPost() ? 1 : 0.6,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
          disabled={!canSubmitPost() || createPostMutation.isPending}
          onPress={handleSubmitPost}
        >
          {createPostMutation.isPending ? (
            <>
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Creating...
              </Text>
            </>
          ) : (
            <Text style={{
              color: canSubmitPost() ? 'white' : '#9CA3AF',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Post
            </Text>
          )}
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
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}