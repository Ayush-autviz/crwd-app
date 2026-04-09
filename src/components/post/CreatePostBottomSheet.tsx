import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {
  X,
  Plus,
  ImageIcon,
  Paperclip,
  Heart,
  Users,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'react-native-image-picker';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createPost, getLinkPreview, mentionSearch } from '../../services/api/social';
import { getJoinCollective } from '../../services/api/crwd';
import { useAuthStore } from '../../store/store';
import { MentionSearchResults } from './MentionSearchResults';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';

interface CreatePostBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  collectiveData?: any;
}

const CreatePostBottomSheet = React.forwardRef<BottomSheetModal, CreatePostBottomSheetProps>(
  ({ isOpen, onClose, collectiveData }, ref) => {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const screenWidth = Dimensions.get('window').width;
    const navigation = useNavigation();
    const isFromSpecificCollective = !!collectiveData;
    const [selectedCollective, setSelectedCollective] = useState<any>(collectiveData || null);
    const [showCollectiveModal, setShowCollectiveModal] = useState(false);

    // Fetch joined collectives
    const { data: joinedCollectivesData } = useQuery({
      queryKey: ['joined-collectives', currentUser?.id],
      queryFn: () => getJoinCollective(currentUser?.id?.toString() || ''),
      enabled: !!currentUser?.id && isOpen,
    });

    const userCollectives = joinedCollectivesData?.data || [];

    const [postType, setPostType] = useState<'link' | 'image' | 'event' | null>(null);
    const [form, setForm] = useState({
      content: '',
      url: '',
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [previewWidth, setPreviewWidth] = useState<number | null>(null);
    const [urlError, setUrlError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [mentionSearchQuery, setMentionSearchQuery] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<any[]>([]);
    const [selectedMentions, setSelectedMentions] = useState<{ type: string; id: number | string; name: string }[]>([]);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const selectionLockRef = useRef(false);
    const textareaRef = useRef<TextInput>(null);

    const snapPoints = useMemo(() => ['90%'], []);

    // Sync selectedCollective when collectiveData prop changes
    useEffect(() => {
      if (collectiveData) {
        setSelectedCollective(collectiveData);
      }
    }, [collectiveData]);

    const handleInputChange = (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field === 'url' && urlError) setUrlError(null);
    };

    const validateUrl = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const { data: previewData, isLoading: isLoadingPreview, refetch: fetchPreview } = useQuery({
      queryKey: ['link-preview', form.url],
      queryFn: () => getLinkPreview(form.url),
      enabled: form.url.trim().length > 0 && validateUrl(form.url) && !urlError && isOpen,
    });

    useEffect(() => {
      if (previewData && form.url && validateUrl(form.url) && !urlError) {
        setShowPreview(true);
      } else {
        setShowPreview(false);
      }
    }, [previewData, form.url, urlError]);

    // Mention search - debounced API call (from CommentsBottomSheet)
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

      const timer = setTimeout(fetchMentions, 150);
      return () => clearTimeout(timer);
    }, [mentionSearchQuery]);

    // Mention detection - detect @ at cursor position (from CommentsBottomSheet)
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
          if (query.length === 0 || (query.trim().split(/\s+/).length <= 3 && !query.includes('\n') && query.length <= 30)) {
            setMentionSearchQuery(query);
            return;
          }
        }
      }
      setMentionSearchQuery(null);
    }, [form.content, selection]);

    const createPostMutation = useMutation({
      mutationFn: createPost,
      onSuccess: () => {
        const collectiveId = selectedCollective?.collective?.id || selectedCollective?.id;
        if (collectiveId) {
          queryClient.invalidateQueries({ queryKey: ['posts', collectiveId.toString()] });
        }
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['communityUpdatesPosts'] });

        handleClose();
      },
      onError: (error: any) => {
        console.error('Error creating post:', error);
      },
    });

    const handleMentionSelect = (user: any) => {
      const cursorPosition = selection.start;
      const textBeforeCursor = form.content.substring(0, cursorPosition);
      const textAfterCursor = form.content.substring(cursorPosition);
      const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
      const newTextBeforeCursor = textBeforeCursor.substring(0, lastAtSymbolIndex) + `@${user.name} `;

      selectionLockRef.current = true;
      const newPos = newTextBeforeCursor.length;
      setSelection({ start: newPos, end: newPos });
      setForm((prev) => ({ ...prev, content: newTextBeforeCursor + textAfterCursor }));
      setSelectedMentions((prev) => [...prev.filter((m) => m.name !== user.name), { type: user.type, id: user.id, name: user.name }]);
      setMentionSearchQuery(null);
      setMentionResults([]);

      setTimeout(() => {
        textareaRef.current?.focus();
        setTimeout(() => (selectionLockRef.current = false), 100);
      }, 100);
    };

    const handleImageSelect = () => {
      const options: ImagePicker.ImageLibraryOptions = {
        mediaType: 'photo',
        includeBase64: false,
      };
      ImagePicker.launchImageLibrary(options, (response) => {
        if (response.assets && response.assets[0]?.uri) {
          setSelectedImage(response.assets[0].uri);
          setImagePreview(response.assets[0].uri);
        }
      });
    };

    const canSubmitPost = () => {
      if (!form.content.trim()) return false;
      if (form.url.trim() && (!validateUrl(form.url) || urlError)) return false;
      return true;
    };

    const handleSubmitPost = () => {
      if (!canSubmitPost() || createPostMutation.isPending) return;
      const formData = new FormData();
      const collectiveId = selectedCollective?.collective?.id || selectedCollective?.id;
      if (collectiveId) formData.append('collective_id', collectiveId.toString());
      formData.append('content', form.content);
      formData.append('post_type', selectedCollective ? 'collective' : 'feed');
      if (selectedImage) formData.append('media_file', { uri: selectedImage, type: 'image/jpeg', name: 'image.jpg' } as any);
      if (form.url.trim()) formData.append('media_url', form.url);

      const finalMentions = selectedMentions
        .filter(m => form.content.includes(`@${m.name}`))
        .map(({ type, id }) => ({ type, id }));
      if (finalMentions.length > 0) formData.append('mentions', JSON.stringify(finalMentions));

      createPostMutation.mutate(formData);
    };

    const handleClose = () => {
      setForm({ content: '', url: '' });
      setPostType(null);
      setSelectedImage(null);
      setImagePreview(null);
      onClose();
      (ref as any)?.current?.dismiss();
    };

    const handleCreateFundraiser = () => {
      handleClose();
      (navigation as any).navigate('CreateFundraiser', { collectiveId: selectedCollective?.id })
    }


    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const characterCount = form.content.length;
    const maxCharacters = 500;

    const getIconColor = (index: number): string => {
      const colors = ["#1600ff", "#10B981", "#EC4899", "#F59E0B", "#8B5CF6", "#EF4444"];
      return colors[index % colors.length];
    };

    const getIconLetter = (name: string): string => name?.charAt(0).toUpperCase() || "C";

    const renderHighlightedText = (text: string) => {
      if (!text) return null;

      const mentionNames = selectedMentions.map(m => `@${m.name}`);
      const mentionNamesLower = mentionNames.map(n => n.toLowerCase());
      mentionNames.sort((a, b) => b.length - a.length);

      const highlightStyle = { color: '#111827', fontSize: 16, lineHeight: 22, fontFamily: 'Outfit-Regular' };
      const mentionStyle = { color: PrimaryBlue, fontWeight: '500' as const, fontFamily: 'Outfit-SemiBold' };

      const renderPart = (part: string, key: string | number) => {
        if (part.startsWith('@')) {
          return <Text key={key} style={mentionStyle}>{part}</Text>;
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

      return (
        <Text style={highlightStyle}>
          {text.split(regex).map((part, i) => {
            if (mentionNamesLower.includes(part.toLowerCase())) {
              return renderPart(part, i);
            }
            return part.split(/(@[\w\s]{1,30}(?=\s|$)|@\w+)/g).map((subPart, j) => {
              return renderPart(subPart, `${i}-${j}`);
            });
          })}
        </Text>
      );
    };

    const renderFooter = useCallback(
      (props: any) => null,
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        onDismiss={handleClose}
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        enableDynamicSizing={false}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Post</Text>
            </View>
            <TouchableOpacity
              onPress={handleSubmitPost}
              disabled={!canSubmitPost() || createPostMutation.isPending}
              style={[
                styles.postButton,
                !canSubmitPost() && styles.postButtonDisabled,
                createPostMutation.isPending && { opacity: 0.7 }
              ]}
            >
              {createPostMutation.isPending ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Text style={[styles.postButtonText, !canSubmitPost() && styles.postButtonTextDisabled]}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView style={styles.content}>
            {/* Collective Selector */}
            <View style={styles.selectorContainer}>
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowCollectiveModal(!showCollectiveModal);
                }}
                disabled={isFromSpecificCollective}
                style={[styles.selector, isFromSpecificCollective && { opacity: 0.8 }]}
              >
                <View style={styles.selectorLeft}>
                  <View style={[styles.avatarBox, { backgroundColor: selectedCollective ? (selectedCollective.collective || selectedCollective).color || getIconColor(0) : '#f0f7ff' }]}>
                    {selectedCollective ? (
                      <Text style={styles.avatarText}>{getIconLetter((selectedCollective.collective || selectedCollective).name)}</Text>
                    ) : (
                      <Users size={20} color="#0066ff" />
                    )}
                  </View>
                  <Text style={styles.selectorText}>
                    Posting to <Text style={styles.selectorBold}>{selectedCollective ? (selectedCollective.collective || selectedCollective).name : "Your Feed"}</Text>
                  </Text>
                </View>
                {!isFromSpecificCollective && <ChevronDown size={16} color="#0066ff" />}
              </TouchableOpacity>

              {showCollectiveModal && (
                <View style={styles.dropdown}>
                  <ScrollView nestedScrollEnabled bounces={false}>
                    {[null, ...userCollectives].map((item, index) => {
                      const isFeed = item === null;
                      const circle = isFeed ? null : (item.collective || item);
                      const isSelected = isFeed ? !selectedCollective : (selectedCollective?.id === circle.id);
                      return (
                        <TouchableOpacity
                          key={isFeed ? 'feed' : circle.id}
                          onPress={() => { setSelectedCollective(item); setShowCollectiveModal(false); }}
                          style={[styles.dropdownItem, isSelected && { backgroundColor: '#f0f7ff' }]}
                        >
                          <View style={[styles.avatarBox, { backgroundColor: isFeed ? '#EBF5FF' : (circle.color || getIconColor(index)) }]}>
                            {isFeed ? <Users size={18} color="#2563EB" /> : <Text style={styles.avatarText}>{getIconLetter(circle.name)}</Text>}
                          </View>
                          <Text style={[styles.dropdownItemText, isSelected && { color: '#2563EB' }]}>{isFeed ? "Your Feed" : circle.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Input Area */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <BottomSheetTextInput
                  ref={textareaRef as any}
                  style={styles.textInput}
                  multiline
                  placeholder="What's on your mind?"
                  placeholderTextColor="#6B7280"
                  onChangeText={(v) => handleInputChange('content', v)}
                  onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                  maxLength={maxCharacters}
                  autoCapitalize="none"
                  selectionColor={PrimaryBlue}
                >
                  {renderHighlightedText(form.content)}
                </BottomSheetTextInput>
                <View style={styles.charCountContainer}>
                  <Text style={styles.charCount}>{characterCount}/{maxCharacters}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={handleImageSelect} style={styles.actionPill}>
                  <ImageIcon size={20} color="#374151" />
                  <Text style={styles.actionText}>Add Image</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPostType('link')} style={styles.actionPill}>
                  <Paperclip size={20} color="#374151" />
                  <Text style={styles.actionText}>Add Link</Text>
                </TouchableOpacity>
                {selectedCollective?.created_by.id === currentUser?.id && (
                  <TouchableOpacity onPress={() => handleCreateFundraiser()}
                    style={styles.actionPill}>
                    <Heart size={20} color="#374151" />
                    <Text style={styles.actionText}>Create Fundraiser</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <MentionSearchResults
              results={mentionResults}
              onSelect={handleMentionSelect}
              position="inline"
            />

            {/* Previews */}
            {showPreview && previewData && (
              <View style={styles.previewCard}>
                {previewData.image && <Image source={{ uri: previewData.image }} style={styles.previewImage} />}
                <View style={styles.previewText}>
                  <Text style={styles.previewSite}>{previewData.site_name}</Text>
                  <Text style={styles.previewTitle} numberOfLines={2}>{previewData.title}</Text>
                  <Text style={styles.previewDesc} numberOfLines={2}>{previewData.description}</Text>
                </View>
              </View>
            )}

            {selectedImage && imagePreview && (
              <View style={styles.imagePreviewWrapper}>
                <Image source={{ uri: imagePreview }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImage}>
                  <X size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {/* Link Input Section */}
            {(postType === 'link' || form.url) && (
              <View style={styles.linkInputSection}>
                <TextInput
                  style={styles.linkInput}
                  placeholder="https://example.com/article"
                  value={form.url}
                  onChangeText={(v) => handleInputChange('url', v)}
                  onBlur={() => { if (form.url && !validateUrl(form.url)) setUrlError("Invalid URL"); }}
                />
                {urlError && <Text style={styles.errorText}>{urlError}</Text>}
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default CreatePostBottomSheet;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', fontWeight: '700' },
  postButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PrimaryGrey,
  },
  postButtonDisabled: { backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' },
  postButtonText: { color: '#000000', fontFamily: 'Outfit-Medium', fontSize: 16 },
  postButtonTextDisabled: { color: PrimaryGrey },
  content: { flex: 1, padding: 16 },
  selectorContainer: { marginBottom: 10, zIndex: 10 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCE3FF',
  },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 12 },
  selectorText: { color: '#0066ff', fontSize: 14 },
  selectorBold: { fontWeight: '700' },
  dropdown: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontWeight: '600', color: '#111827' },
  inputWrapper: { marginBottom: 16 },
  inputContainer: { backgroundColor: '#F6F5ED', borderRadius: 16, padding: 16, minHeight: 180 },
  textInput: { fontSize: 16, color: '#111827', fontFamily: 'Outfit-Regular', textAlignVertical: 'top', lineHeight: 22, minHeight: 150 },
  previewCard: { borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', marginBottom: 16 },
  previewImage: { width: '100%', height: 150 },
  previewText: { padding: 12 },
  previewSite: { fontSize: 10, color: '#6B7280', textTransform: 'uppercase' },
  previewTitle: { fontSize: 14, fontWeight: '700', marginVertical: 4 },
  previewDesc: { fontSize: 12, color: '#6B7280' },
  imagePreviewWrapper: { borderRadius: 12, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  imagePreview: { width: '100%', height: 200 },
  removeImage: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, padding: 5 },
  linkInputSection: { marginBottom: 16 },
  linkInput: { borderBottomWidth: 1, borderBottomColor: '#D1D5DB', paddingVertical: 8, fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, backgroundColor: 'white' },
  charCountContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    zIndex: 10,
  },
  charCount: { fontSize: 12, color: '#9CA3AF' },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  actionPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', gap: 6 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
});
