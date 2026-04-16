import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, ActivityIndicator, Keyboard, BackHandler, Platform, Dimensions, LayoutAnimation } from 'react-native'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import { ImageIcon, X, ArrowLeft, Paperclip, Lightbulb, Globe, ChevronDown, Check, Heart } from 'lucide-react-native'
import * as ImagePicker from 'react-native-image-picker'
import { useNavigation, useRoute, usePreventRemove } from '@react-navigation/native'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createPost, getLinkPreview, mentionSearch } from '../services/api/social'
import { getJoinCollective } from '../services/api/crwd'
import { useAuthStore } from '../store/store'
import { Toast } from '../components/Toast'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import DiscardBottomSheet from '../components/ui/DiscardBottomSheet'
import { MentionSearchResults } from '../components/post/MentionSearchResults'
import { Modal, FlatList, Pressable } from 'react-native'

export default function Post() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const screenWidth = Dimensions.get('window').width;

  // Get collectiveData from route params
  const initialCollective = route.params?.collectiveData || (route.params?.collectiveId ? { id: route.params.collectiveId } : null);
  const isFromSpecificCollective = !!initialCollective;

  const [selectedCollective, setSelectedCollective] = useState<any>(initialCollective);
  const [showCollectiveModal, setShowCollectiveModal] = useState(false);

  // Fetch joined collectives
  const { data: joinedCollectivesData } = useQuery({
    queryKey: ['joined-collectives', currentUser?.id],
    queryFn: () => getJoinCollective(currentUser?.id?.toString() || ''),
    enabled: !!currentUser?.id,
  });

  const userCollectives = joinedCollectivesData?.data || [];

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [postType, setPostType] = useState<'link' | 'image' | 'event' | null>(null)
  const [form, setForm] = useState({
    content: '',
    url: '',
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [previewWidth, setPreviewWidth] = useState<number | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  const [isConfirmedDiscard, setIsConfirmedDiscard] = useState(false);
  const discardSheetRef = React.useRef<BottomSheetModal>(null);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [mentionSearchQuery, setMentionSearchQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<{ type: string; id: number | string; name: string }[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const selectionLockRef = useRef(false);
  const textareaRef = useRef<TextInput>(null);

  // Track link preview
  const [showPreview, setShowPreview] = useState(false)

  const hasUnsavedChanges = useMemo(() => {
    return form.content.trim() !== '' || form.url.trim() !== '' || selectedImage !== null;
  }, [form.content, form.url, selectedImage]);

  const performBackNavigation = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges && !isConfirmedDiscard) {
      Keyboard.dismiss();
      setPendingAction(null);
      setTimeout(() => {
        discardSheetRef.current?.present();
      }, 250);
      return;
    }
    performBackNavigation();
  }, [hasUnsavedChanges, isConfirmedDiscard, performBackNavigation]);

  // Navigation guard
  usePreventRemove(
    hasUnsavedChanges && !isConfirmedDiscard,
    (e) => {
      Keyboard.dismiss();
      setPendingAction(e.data.action);
      discardSheetRef.current?.present();
    }
  );

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (hasUnsavedChanges && !isConfirmedDiscard) {
        handleBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [hasUnsavedChanges, isConfirmedDiscard, handleBack]);

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

  // Calculate image preview size
  useEffect(() => {
    if (imagePreview) {
      Image.getSize(
        imagePreview,
        (width, height) => {
          const calculatedWidth = (200 * width) / height;
          setPreviewWidth(Math.min(calculatedWidth, screenWidth - 32));
        },
        (error) => console.log('Image size error for preview', error)
      );
    } else {
      setPreviewWidth(null);
    }
  }, [imagePreview, screenWidth]);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (response: any) => {
      console.log('Post created successfully:', response);
      // setToastMessage("Post created successfully!");
      // setShowToast(true);

      // Clear form data on success to prevent discard sheet
      setForm({ content: '', url: '' });
      setSelectedImage(null);
      setImagePreview(null);
      setPostType(null);
      setShowPreview(false);

      // Invalidate posts queries to refresh the list
      const collectiveIdValue = selectedCollective?.collective?.id || selectedCollective?.id;
      if (collectiveIdValue) {
        // Invalidate posts for the specific collective
        queryClient.invalidateQueries({ queryKey: ['posts', collectiveIdValue.toString()] });
      }
      // Also invalidate all posts query to refresh home page and other places
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['communityUpdatesPosts'] });

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

  useEffect(() => {
    if (selectionLockRef.current) return;
    const cursorPosition = selection.start;
    const textBeforeCursor = form.content.substring(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbolIndex !== -1) {
      const charBeforeAt = lastAtSymbolIndex > 0 ? textBeforeCursor[lastAtSymbolIndex - 1] : null;
      const isStartOfWord = !charBeforeAt || charBeforeAt === ' ' || charBeforeAt === '\n';

      if (isStartOfWord) {
        const query = textBeforeCursor.substring(lastAtSymbolIndex + 1);
        if (query.trim().split(/\s+/).length <= 3 && !query.includes('\n') && query.length <= 30) {
          setMentionSearchQuery(query);
          return;
        }
      }
    }
    setMentionSearchQuery(null);
  }, [form.content, selection]);

  useEffect(() => {
    const fetchMentions = async () => {
      if (mentionSearchQuery !== null) {
        try {
          const data = await mentionSearch(mentionSearchQuery);
          setMentionResults(data.results || (Array.isArray(data) ? data : []));
        } catch (error) {
          console.error('Mention search error:', error);
          setMentionResults([]);
        }
      } else {
        setMentionResults([]);
      }
    };

    const timer = setTimeout(fetchMentions, 300);
    return () => clearTimeout(timer);
  }, [mentionSearchQuery]);

  const handleMentionSelect = (user: any) => {
    const cursorPosition = selection.start;
    const textBeforeCursor = form.content.substring(0, cursorPosition);
    const textAfterCursor = form.content.substring(cursorPosition);

    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    const newTextBeforeCursor = textBeforeCursor.substring(0, lastAtSymbolIndex) + `@${user.name} `;

    selectionLockRef.current = true;
    const newPos = newTextBeforeCursor.length;
    setSelection({ start: newPos, end: newPos });
    setForm(prev => ({ ...prev, content: newTextBeforeCursor + textAfterCursor }));
    setSelectedMentions(prev => [
      ...prev.filter(m => m.name !== user.name),
      { type: user.type, id: user.id, name: user.name }
    ]);

    setMentionSearchQuery(null);
    setMentionResults([]);

    setTimeout(() => {
      textareaRef.current?.focus();
      setTimeout(() => {
        selectionLockRef.current = false;
      }, 100);
    }, 100);
  };

  const renderHighlightedText = (text: string) => {
    if (!text) return null;

    const mentionNames = selectedMentions.map(m => `@${m.name}`);
    const mentionNamesLower = mentionNames.map(n => n.toLowerCase());
    mentionNames.sort((a, b) => b.length - a.length);

    const highlightStyle = {
      fontSize: 16,
      color: '#111827',
      lineHeight: 22,
      fontFamily: 'Outfit-Regular'
    };

    const renderPart = (part: string, key: string | number) => {
      if (part.startsWith('@')) {
        return <Text key={key} style={{ color: PrimaryBlue, fontWeight: '500', fontFamily: 'Outfit-SemiBold' }}>{part}</Text>;
      }
      return <Text key={key}>{part}</Text>;
    };

    // Fallback: simple highlighter if no selected mentions
    if (mentionNames.length === 0) {
      const parts = text.split(/(@[\w\s]{1,30}(?=\s|$)|@\w+)/g);
      return (
        <Text style={highlightStyle}>
          {parts.map((part, i) => renderPart(part, i))}
        </Text>
      );
    }

    const pattern = mentionNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');

    const mainParts = text.split(regex);
    return (
      <Text style={highlightStyle}>
        {mainParts.map((part, i) => {
          if (!part) return null;
          if (mentionNamesLower.includes(part.toLowerCase())) {
            return renderPart(part, i);
          }
          const subParts = part.split(/(@[\w\s]{1,30}(?=\s|$)|@\w+)/g);
          return subParts.map((subPart, j) => {
            if (!subPart) return null;
            return renderPart(subPart, `${i}-${j}`);
          });
        })}
      </Text>
    );
  };

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
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setSelectedImage(asset.uri);
          setImagePreview(asset.uri);
        }
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
    const collectiveId = selectedCollective?.collective?.id || selectedCollective?.id;
    if (collectiveId) {
      formData.append('collective_id', collectiveId.toString());
    }
    formData.append('content', form.content);
    formData.append('post_type', selectedCollective ? 'collective' : 'feed');

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

    const finalMentions = selectedMentions
      .filter(m => form.content.includes(`@${m.name}`))
      .map(({ type, id }) => ({ type, id }));

    if (finalMentions.length > 0) {
      formData.append('mentions', JSON.stringify(finalMentions));
    }

    createPostMutation.mutate(formData);
  }

  if (!currentUser?.id) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => handleBack()}
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

  const getIconColor = (index: number): string => {
    const colors = [
      "#1600ff", // Blue
      "#10B981", // Green
      "#EC4899", // Pink
      "#F59E0B", // Amber
      "#8B5CF6", // Purple
      "#EF4444", // Red
    ];
    return colors[index % colors.length];
  };

  const getIconLetter = (name: string): string => {
    return name?.charAt(0).toUpperCase() || "C";
  };

  // Main create post form
  const characterCount = form.content.length;
  const maxCharacters = 500;

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => handleBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Create Post</Text>
            {/* <Text style={styles.headerSubtitle}>{selectedCollective ? (selectedCollective.collective || selectedCollective).name : "Your Feed"}</Text> */}
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
              <Text style={[styles.postButtonText, !canSubmitPost() && { color: PrimaryGrey }]}>Posting...</Text>
            </>
          ) : (
            <Text style={[styles.postButtonText, !canSubmitPost() && { color: PrimaryGrey }]}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} enableOnAndroid={true} extraScrollHeight={100}>
        {/* Collective Selector */}
        <View style={{ marginBottom: 24, zIndex: 1000, elevation: 10 }}>
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowCollectiveModal(!showCollectiveModal);
            }}
            activeOpacity={0.7}
            // disabled={isFromSpecificCollective}
            disabled={true}
            style={[
              {
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: '#f0f7ff',
                borderWidth: 1,
                borderColor: '#cce3ff',
                borderRadius: 12,
              },
              isFromSpecificCollective && { opacity: 0.8 }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selectedCollective
                    ? ((selectedCollective.collective || selectedCollective).color || getIconColor(0))
                    : '#f0f7ff'
                }}
              >
                {selectedCollective ? (
                  (() => {
                    const circle = selectedCollective.collective || selectedCollective;
                    const hasColor = circle.color;
                    const hasLogo = circle.logo && (circle.logo.indexOf("http") === 0 || circle.logo.indexOf("/") === 0 || circle.logo.indexOf("data:") === 0);
                    const showImage = !hasColor && hasLogo;

                    if (showImage) {
                      return <Image source={{ uri: circle.logo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
                    }
                    return <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{getIconLetter(circle.name)}</Text>;
                  })()
                ) : (
                  <Globe size={20} color="#0066ff" />
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0066ff' }}>
                Posting to <Text style={{ fontWeight: 'bold' }}>{selectedCollective ? (selectedCollective.collective || selectedCollective).name : "Your Feed"}</Text>
              </Text>
            </View>
            {/* {!isFromSpecificCollective && (
              <ChevronDown size={16} color="#0066ff" />
            )} */}
          </TouchableOpacity>

          {/* Inline Dropdown - Absolute Positioned */}
          {showCollectiveModal && !isFromSpecificCollective && (
            <View style={{
              position: 'absolute',
              top: 56, // Adjust based on toggle button height + space
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              maxHeight: 250,
              overflow: 'hidden',
              zIndex: 2000,
              elevation: 15,
            }}>
              <ScrollView bounces={false} nestedScrollEnabled={true}>
                {[null, ...userCollectives].map((item, index) => {
                  const isFeed = item === null;
                  const circle = isFeed ? null : (item.collective || item);
                  const isSelected = isFeed ? !selectedCollective : (selectedCollective?.collective?.id || selectedCollective?.id) === circle.id;

                  return (
                    <TouchableOpacity
                      key={isFeed ? 'feed' : circle.id.toString()}
                      onPress={() => {
                        setSelectedCollective(item);
                        setShowCollectiveModal(false);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        backgroundColor: isSelected ? '#f0f7ff' : 'white',
                        borderBottomWidth: index === userCollectives.length ? 0 : 1,
                        borderBottomColor: '#F3F4F6',
                        gap: 12
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isFeed ? '#EBF5FF' : (circle.color || getIconColor(index - 1))
                        }}
                      >
                        {isFeed ? (
                          <Globe size={18} color="#2563EB" />
                        ) : (
                          (() => {
                            const hasColor = circle.color;
                            const hasLogo = circle.logo && (circle.logo.indexOf("http") === 0 || circle.logo.indexOf("/") === 0 || circle.logo.indexOf("data:") === 0);
                            if (!hasColor && hasLogo) {
                              return <Image source={{ uri: circle.logo }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />;
                            }
                            return <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{getIconLetter(circle.name)}</Text>;
                          })()
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: isSelected ? '#2563EB' : '#111827' }}>
                          {isFeed ? "Your Feed" : circle.name}
                        </Text>
                      </View>
                      {isSelected && <Check size={16} color="#2563EB" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Main Content Input */}
        <View style={styles.contentSection}>
          <View style={styles.textInputContainer}>
            <View
              pointerEvents="none"
              style={styles.highlightOverlay}
            >
              {renderHighlightedText(form.content)}
            </View>
            <TextInput
              ref={textareaRef}
              style={[styles.textInput, { zIndex: 2 }]}
              multiline
              placeholder="What's on your mind?"
              placeholderTextColor="#6B7280"
              value={form.content}
              onChangeText={(value) => handleInputChange('content', value)}
              selection={selection}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              maxLength={maxCharacters}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              selectionColor={PrimaryBlue}
            />
            <View style={styles.characterCountContainer}>
              <Text style={styles.characterCount}>
                {characterCount}/{maxCharacters}
              </Text>
            </View>
          </View>
          <MentionSearchResults
            results={mentionResults}
            onSelect={handleMentionSelect}
            position="inline"
          />

          <View style={[styles.actionButtonsContainer, { marginTop: 16 }]}>
            <TouchableOpacity
              onPress={() => handlePostTypeSelect('image')}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <ImageIcon size={20} color="#374151" />
              <Text style={styles.actionButtonText}>Add Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handlePostTypeSelect('link')}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Paperclip size={20} color="#374151" />
              <Text style={styles.actionButtonText}>Add Link</Text>
            </TouchableOpacity>

            {(!selectedCollective || (selectedCollective.created_by?.id === currentUser?.id)) && (
              <TouchableOpacity
                onPress={() => {
                  const id = selectedCollective ? (selectedCollective.collective?.id || selectedCollective.id) : undefined;
                  navigation.navigate('CreateFundraiser', { collectiveId: id } as any);
                }}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Heart size={20} color="#374151" />
                <Text style={styles.actionButtonText}>Create Fundraiser</Text>
              </TouchableOpacity>
            )}
          </View>
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
            <View style={[styles.imagePreviewContainer, { flexDirection: 'row' }]}>
              <Image
                source={{ uri: imagePreview }}
                style={[styles.imagePreview, {
                  width: previewWidth || 0,
                  borderRadius: 8,
                  opacity: previewWidth ? 1 : 0
                }]}
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
        {/* <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Text style={{ fontSize: 18 }}>💡</Text>
            <Text style={styles.tipsTitle}>Posting Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipBulletCircle} />
              <Text style={styles.tipText}>Share inspiring stories about the causes you support</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBulletCircle} />
              <Text style={styles.tipText}>Post updates about your collective's impact</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBulletCircle} />
              <Text style={styles.tipText}>Include relevant articles or resources to engage members</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBulletCircle} />
              <Text style={styles.tipText}>Use "Create Event" or "Create Fundraiser" to organize your community</Text>
            </View>
          </View>
        </View> */}
      </KeyboardAwareScrollView>



      <Toast
        message={toastMessage}
        show={showToast}
        onHide={() => setShowToast(false)}
        duration={2000}
      />

      <DiscardBottomSheet
        ref={discardSheetRef}
        onDiscard={() => {
          setIsConfirmedDiscard(true);
          discardSheetRef.current?.dismiss();
          setTimeout(() => {
            if (pendingAction) {
              navigation.dispatch(pendingAction);
            } else {
              performBackNavigation();
            }
          }, 300);
        }}
        onCancel={() => discardSheetRef.current?.dismiss()}
      />
    </SafeAreaView >
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
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PrimaryGrey
  },
  postButtonDisabled: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: PrimaryGrey,
  },
  postButtonText: {
    color: 'black',
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
    backgroundColor: '#F6F5ED',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    minHeight: 200,
    zIndex: 1,
  },
  textInput: {
    minHeight: 200,
    fontSize: 16,
    color: 'transparent',
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    lineHeight: 22,
    fontFamily: 'Outfit-Regular',
    textAlignVertical: 'top',
  },
  highlightOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 672,
    alignSelf: 'center',
  },
  characterCountContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    zIndex: 10,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 99,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    fontFamily: 'Outfit-Bold',
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
    alignSelf: 'flex-start',
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
    height: 200,
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
    marginTop: 20,
    backgroundColor: '#f0f7ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0efff',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0047cc',
    fontFamily: 'Outfit-Bold',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipBulletCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066ff',
    marginTop: 7,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#0047cc',
    fontWeight: '500',
    lineHeight: 18,
    fontFamily: 'Outfit-Medium',
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
