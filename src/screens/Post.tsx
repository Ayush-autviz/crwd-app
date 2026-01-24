import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { Image as ImageIcon, X, ArrowLeft, Paperclip, Lightbulb } from 'lucide-react-native'
import ImagePicker from 'react-native-image-crop-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createPost, getLinkPreview } from '../services/api/social'
import { useAuthStore } from '../store/store'
import { Toast } from '../components/Toast'

export default function Post() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  // Get collectiveData from route params (similar to location.state in Vite)
  const collectiveData = route.params?.collectiveData || (route.params?.collectiveId ? { id: route.params.collectiveId } : null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [postType, setPostType] = useState<'link' | 'image' | 'event' | null>(null)
  const [form, setForm] = useState({
    content: '',
    url: '',
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  // Track link preview
  const [showPreview, setShowPreview] = useState(false)

  // Validate URL format - defined before useQuery
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Fetch link preview automatically when URL is valid
  const { data: previewData, isLoading: isLoadingPreview, refetch: fetchPreview } = useQuery({
    queryKey: ['link-preview', form.url],
    queryFn: () => getLinkPreview(form.url),
    enabled: form.url.trim().length > 0 && validateUrl(form.url) && !urlError,
  })

  // Show preview when data is available
  useEffect(() => {
    if (previewData && form.url && validateUrl(form.url) && !urlError) {
      setShowPreview(true)
    } else if (!form.url || !validateUrl(form.url) || urlError) {
      setShowPreview(false)
    }
  }, [previewData, form.url, urlError])

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (response) => {
      console.log('Post created successfully:', response);
      setToastMessage("Post created successfully!");
      setShowToast(true);

      // Invalidate posts queries to refresh the list
      if (collectiveData?.id) {
        // Invalidate posts for the specific collective
        queryClient.invalidateQueries({ queryKey: ['posts', collectiveData.id.toString()] });
      }
      // Also invalidate all posts query to refresh home page and other places
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      // Navigate back to the collective page or home
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    },
    onError: (error: any) => {
      console.error('Error creating post:', error);
      setToastMessage("Failed to create post. Please try again.");
      setShowToast(true);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear URL error when user starts typing
    if (field === 'url' && urlError) {
      setUrlError(null);
    }
  }

  // Handle URL validation
  const handleUrlBlur = () => {
    if (form.url && !validateUrl(form.url)) {
      setUrlError("Oops, this link isn't valid. Double-check, and try again.");
    } else {
      setUrlError(null);
    }
  }

  // Handle image selection
  const handleImageSelect = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      cropping: true,
      width: 1200,
      height: 400,
      freeStyleCropEnabled: false,
      includeBase64: false,
      cropperToolbarTitle: 'Edit Image',
    }).then(image => {
      setSelectedImage(image.path);
      setImagePreview(image.path);
    }).catch(error => {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.log('ImagePicker Error: ', error);
      }
    });
  }

  // Handle post type selection
  const handlePostTypeSelect = (type: 'link' | 'image' | 'event') => {
    setPostType(type);

    // Reset form fields when switching post types
    setForm(prev => ({
      ...prev,
      url: "",
    }));

    // Reset image selection
    setSelectedImage(null);
    setImagePreview(null);
    setUrlError(null);

    // Trigger image picker for image posts
    if (type === 'image') {
      handleImageSelect();
    }
  }

  // Check if post can be submitted
  const canSubmitPost = () => {
    // Post can be submitted with just content (text-only post)
    if (!form.content.trim()) return false;

    // If URL is provided, it must be valid
    if (form.url.trim() && (!validateUrl(form.url) || urlError)) {
      return false;
    }

    // Allow text-only posts, posts with image, posts with link, or any combination
    // Image and link are optional
    return true;
  }

  // Handle form submission
  const handleSubmitPost = () => {
    if (!canSubmitPost() || createPostMutation.isPending) return;

    const formData = new FormData();
    formData.append('collective_id', collectiveData.id.toString());
    formData.append('content', form.content);

    // Add media file if it's an image post
    if (postType === 'image' && selectedImage) {
      formData.append('media_file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
    }

    // Add media_url if URL is provided (for link posts or when URL is filled)
    if (form.url.trim() && validateUrl(form.url)) {
      formData.append('media_url', form.url);
    }

    createPostMutation.mutate(formData);
  }

  if (!currentUser?.id) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
        </View>
        <View style={styles.centeredContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>👤</Text>
          </View>
          <Text style={styles.centeredTitle}>
            Sign in to create a post
          </Text>
          <Text style={styles.centeredDescription}>
            Sign in to create a post, manage your causes, and connect with your community.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login' as never)}
            style={styles.signInButton}
          >
            <Text style={styles.signInButtonText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check if collectiveData is provided
  if (!collectiveData) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
        </View>
        <View style={styles.centeredContent}>
          <Text style={styles.centeredTitle}>
            No Collective Selected
          </Text>
          <Text style={styles.centeredDescription}>
            Please select a collective to create a post.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.signInButton}
          >
            <Text style={styles.signInButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main create post form
  const characterCount = form.content.length;
  const maxCharacters = 500;

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Create Post</Text>
            <Text style={styles.headerSubtitle}>{collectiveData?.name || "Your Collective"}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSubmitPost}
          disabled={!canSubmitPost() || createPostMutation.isPending}
          style={[
            styles.postButton,
            (!canSubmitPost() || createPostMutation.isPending) && styles.postButtonDisabled
          ]}
        >
          {createPostMutation.isPending ? (
            <>
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              <Text style={styles.postButtonText}>Posting...</Text>
            </>
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Main Content Input */}
        <View style={styles.contentSection}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="What's on your mind?"
              placeholderTextColor={PrimaryGrey}
              value={form.content}
              onChangeText={(value) => handleInputChange('content', value)}
              maxLength={maxCharacters}
            />
          </View>
          {/* Character Count */}
          <View style={styles.characterCountContainer}>
            <Text style={styles.characterCount}>
              {characterCount}/{maxCharacters}
            </Text>
          </View>
        </View>

        {/* Add Image and Add Link Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={() => handlePostTypeSelect('image')}
            style={styles.actionButton}
          >
            <ImageIcon size={20} color="#374151" />
            <Text style={styles.actionButtonText}>Add Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePostTypeSelect('link')}
            style={styles.actionButton}
          >
            <Paperclip size={20} color="#374151" />
            <Text style={styles.actionButtonText}>Add Link</Text>
          </TouchableOpacity>
        </View>

        {/* Link Input Field - Show when link is selected or URL is entered */}
        {(postType === 'link' || form.url) && (
          <View style={styles.linkInputSection}>
            <View style={styles.linkInputContainer}>
              <TextInput
                style={styles.linkInput}
                placeholder="https://example.com/article"
                placeholderTextColor={PrimaryGrey}
                value={form.url}
                onChangeText={(value) => handleInputChange('url', value)}
                onBlur={handleUrlBlur}
              />
              {form.url && (
                <TouchableOpacity
                  onPress={() => {
                    setForm(prev => ({ ...prev, url: "" }));
                    if (postType === 'link') setPostType(null);
                    setShowPreview(false);
                  }}
                  style={styles.clearButton}
                >
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            {urlError && (
              <Text style={styles.errorText}>{urlError}</Text>
            )}
            {/* Preview Button - Manual refresh */}
            {form.url && validateUrl(form.url) && !urlError && (
              <TouchableOpacity
                onPress={() => {
                  fetchPreview();
                }}
                disabled={isLoadingPreview}
                style={[styles.previewButton, isLoadingPreview && styles.previewButtonDisabled]}
                activeOpacity={0.7}
              >
                {isLoadingPreview ? (
                  <>
                    <ActivityIndicator size="small" color="#374151" style={{ marginRight: 8 }} />
                    <Text style={styles.previewButtonText}>Loading Preview...</Text>
                  </>
                ) : (
                  <Text style={styles.previewButtonText}>Refresh Preview</Text>
                )}
              </TouchableOpacity>
            )}
            {/* Link Preview Card */}
            {showPreview && previewData && !isLoadingPreview && (
              <View style={styles.previewCard}>
                <View style={styles.previewCardContent}>
                  {/* Preview Image */}
                  {previewData.image && (
                    <View style={styles.previewImageContainer}>
                      <Image
                        source={{ uri: previewData.image }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  {/* Preview Content */}
                  <View style={styles.previewContent}>
                    {previewData.site_name && (
                      <Text style={styles.previewSiteName} numberOfLines={1}>
                        {previewData.site_name.toUpperCase()}
                      </Text>
                    )}
                    {previewData.title && (
                      <Text style={styles.previewTitle} numberOfLines={2}>
                        {previewData.title}
                      </Text>
                    )}
                    {previewData.description && (
                      <Text style={styles.previewDescription} numberOfLines={2}>
                        {previewData.description}
                      </Text>
                    )}
                    {previewData.domain && (
                      <Text style={styles.previewDomain} numberOfLines={1}>
                        {previewData.domain}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Image Preview */}
        {selectedImage && imagePreview && (
          <View style={styles.imagePreviewSection}>
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imagePreview }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  if (postType === 'image') setPostType(null);
                }}
                style={styles.removeImageButton}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Posting Tips Box */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Lightbulb size={20} color="#2563EB" />
            <Text style={styles.tipsTitle}>Posting Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Share inspiring stories about the causes you support</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Post updates about your collective's impact</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Include relevant articles or resources to engage members</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Text-only posts are perfect for quick updates!</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Toast notification */}
      <Toast
        message={toastMessage}
        show={showToast}
        onHide={() => setShowToast(false)}
        duration={2000}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  postButton: {
    backgroundColor: '#1600ff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    maxWidth: 672, // max-w-2xl equivalent
    alignSelf: 'center',
    width: '100%',
  },
  contentSection: {
    marginBottom: 24,
  },
  textInputContainer: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  textInput: {
    minHeight: 200,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  characterCountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  linkInputSection: {
    marginBottom: 16,
  },
  linkInputContainer: {
    position: 'relative',
  },
  linkInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingRight: 40, // Add extra padding on right to prevent text from overlapping X button
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '45%',
    transform: [{ translateY: -8 }],
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  previewButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    width: 150,

  },
  previewButtonDisabled: {
    opacity: 0.5,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  previewCard: {
    marginTop: 16,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  previewCardContent: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  previewImageContainer: {
    width: 120,
    height: 120,
    flexShrink: 0,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  previewSiteName: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 16,
  },
  previewDescription: {
    fontSize: 10,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 14,
  },
  previewDomain: {
    fontSize: 10,
    color: '#6B7280',
  },
  imagePreviewSection: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 3,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsContainer: {
    marginTop: 'auto',
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'white',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#DBEAFE',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 40,
  },
  centeredTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  centeredDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
