import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  BackHandler,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, usePreventRemove } from '@react-navigation/native';
import DiscardBottomSheet from '../components/ui/DiscardBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  ArrowLeft,
  Edit2,
  CircleHelp as HelpCircle,
  Loader2,
  Camera,
  Search,
  X,
  Check
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollectiveById, patchCollective, getCollectiveCauses } from '../services/api/crwd';
import { getCausesBySearch } from '../services/api/crwd';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/store';
import { categories } from '../Constants/categories';
import * as ImagePicker from 'react-native-image-picker';
import { truncateAtFirstPeriod } from '../utils/truncateFirstPeriod';

const getCategoryById = (categoryId: string | undefined) => {
  if (!categoryId) return null;
  return categories.find(cat => cat.id === categoryId) || null;
};

// Avatar colors for consistent fallback styling
const avatarColors = [
  '#FF6B6B', '#4CAF50', '#FF9800', '#9C27B0', '#2196F3',
  '#FFC107', '#E91E63', '#00BCD4', '#8BC34A', '#FF5722',
  '#673AB7', '#009688', '#FFEB3B', '#795548', '#607D8B',
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash = typeof id === 'number' ? id : id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name: string) => {
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return 'N';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default function NewEditCollective() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();
  const crwdId = (route.params as any)?.collectiveId?.toString() || '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoType, setLogoType] = useState<'letter' | 'upload'>('letter');
  const [letterLogoColor, setLetterLogoColor] = useState('#1600ff');
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [uploadedLogoPreview, setUploadedLogoPreview] = useState<string | null>(null);
  const [showLogoCustomization, setShowLogoCustomization] = useState(false);

  // Store default values from API
  const [defaultColor, setDefaultColor] = useState<string>('');
  const [defaultLogo, setDefaultLogo] = useState<string | null>(null);
  const [initialName, setInitialName] = useState<string>('');
  const [initialDescription, setInitialDescription] = useState<string>('');
  const [initialCauseIds, setInitialCauseIds] = useState<number[]>([]);
  const [initialCauseCount, setInitialCauseCount] = useState(0);
  const [isConfirmedDiscard, setIsConfirmedDiscard] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const discardSheetRef = React.useRef<BottomSheetModal>(null);


  // Causes management state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCauses, setSelectedCauses] = useState<any[]>([]);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const colorSwatches = [
    '#0000FF', '#FF3366', '#ADFF2F', '#A855F7', '#10B981', '#FF6B35', '#EF4444', '#6366F1',
  ];

  // Fetch collective data
  const { data: crwdData, isLoading } = useQuery({
    queryKey: ['crwd', crwdId],
    queryFn: () => getCollectiveById(crwdId),
    enabled: !!crwdId,
  });

  // Fetch collective causes
  const { data: collectiveCausesData } = useQuery({
    queryKey: ['collective-causes', crwdId],
    queryFn: () => getCollectiveCauses(crwdId),
    enabled: !!crwdId,
  });

  // Fetch causes for search
  const { data: causesData, isLoading: isCausesLoading } = useQuery({
    queryKey: ['causes-search', searchQuery, searchTrigger],
    queryFn: () => getCausesBySearch(searchQuery || '', '', 1),
    enabled: searchTrigger > 0 && searchQuery.trim().length > 0,
  });

  // Fetch default causes when no search
  const { data: defaultCausesData } = useQuery({
    queryKey: ['default-causes'],
    queryFn: () => getCausesBySearch('', '', 1),
    enabled: searchTrigger === 0 || searchQuery.trim().length === 0,
  });

  const hasUnsavedChanges = React.useMemo(() => {
    if (!crwdData) return false;
    const nameChanged = name.trim() !== initialName;
    const descriptionChanged = description.trim() !== initialDescription;
    const causeIds = selectedCauses.map(cause => cause.id);
    const causeIdsChanged = JSON.stringify(causeIds.sort()) !== JSON.stringify(initialCauseIds.sort());
    const hasNewLogo = logoType === 'upload' && uploadedLogo !== null;
    const colorChanged = logoType === 'letter' && letterLogoColor !== defaultColor;

    return nameChanged || descriptionChanged || causeIdsChanged || hasNewLogo || colorChanged;
  }, [name, initialName, description, initialDescription, selectedCauses, initialCauseIds, logoType, uploadedLogo, letterLogoColor, defaultColor, crwdData]);

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
        Keyboard.dismiss();
        navigation.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [hasUnsavedChanges, isConfirmedDiscard, navigation]);


  // Initialize form data when collective data loads
  useEffect(() => {
    if (crwdData) {
      const apiName = crwdData.name || '';
      const apiDescription = crwdData.description || '';

      setName(apiName);
      setDescription(apiDescription);

      // Store initial values
      setInitialName(apiName);
      setInitialDescription(apiDescription);

      // Store default values from API
      setDefaultColor(crwdData.color || '');
      setDefaultLogo(crwdData.logo || null);

      // Determine logo type - prioritize logo (image) over color
      if (crwdData.logo) {
        setLogoType('upload');
        setUploadedLogoPreview(crwdData.logo);
        if (crwdData.color) {
          setLetterLogoColor(crwdData.color);
        }
      } else if (crwdData.color) {
        setLogoType('letter');
        setLetterLogoColor(crwdData.color);
      }
    }
  }, [crwdData]);

  // Initialize selected causes from collective causes
  useEffect(() => {
    if (collectiveCausesData) {
      const causes = collectiveCausesData.results || collectiveCausesData || [];
      const mappedCauses = causes.map((item: any) => item.cause || item);
      setSelectedCauses(mappedCauses);
      setInitialCauseCount(mappedCauses.length);
      // Store initial cause IDs
      const initialIds = mappedCauses.map((cause: any) => cause.id);
      setInitialCauseIds(initialIds);
    }
  }, [collectiveCausesData]);

  // Update collective mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => patchCollective(crwdId, data),
    onSuccess: async () => {
      // Invalidate and refetch queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['crwd', crwdId] });
      await queryClient.invalidateQueries({ queryKey: ['collective-causes', crwdId] });
      await queryClient.refetchQueries({ queryKey: ['crwd', crwdId] });
      await queryClient.refetchQueries({ queryKey: ['collective-causes', crwdId] });
      showToast('Collective updated successfully!', 3000);
      navigation.goBack();
    },
    onError: (error: any) => {
      console.error('Update collective error:', error);
      showToast(error.response?.data?.message || 'Failed to update collective', 4000);
    },
  });

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Please enter a name for your collective', 4000);
      return;
    }

    // Validate upload tab - must have image
    if (logoType === 'upload' && !uploadedLogo && !defaultLogo) {
      showToast('Please upload an image for the logo', 4000);
      return;
    }

    // Prepare cause_ids array
    const causeIds = selectedCauses.map(cause => cause.id);

    // Check what has changed
    const nameChanged = name.trim() !== initialName;
    const descriptionChanged = description.trim() !== initialDescription;
    const causeIdsChanged = JSON.stringify(causeIds.sort()) !== JSON.stringify(initialCauseIds.sort());
    const hasNewLogo = logoType === 'upload' && uploadedLogo !== null;
    const colorChanged = logoType === 'letter' && letterLogoColor !== defaultColor;

    // Use FormData if there's a file upload, otherwise use JSON
    if (hasNewLogo) {
      // New file uploaded - use FormData
      const formData = new FormData();

      // Only add changed fields
      if (nameChanged) {
        formData.append('name', name.trim());
      }
      if (descriptionChanged) {
        formData.append('description', description.trim());
      }
      if (causeIdsChanged) {
        // Append each cause_id separately (backend should handle this as an array)
        causeIds.forEach(causeId => {
          formData.append('cause_ids', causeId.toString());
        });
      }
      formData.append('logo_file', {
        uri: uploadedLogo,
        type: 'image/jpeg',
        name: 'logo.jpg',
      } as any);
      // Only send color if it changed
      if (colorChanged) {
        formData.append('color', letterLogoColor);
      }

      updateMutation.mutate(formData);
    } else {
      // Use JSON - no file upload
      const updateData: any = {};

      // Only add changed fields
      if (nameChanged) {
        updateData.name = name.trim();
      }
      if (descriptionChanged) {
        updateData.description = description.trim();
      }
      if (causeIdsChanged) {
        updateData.cause_ids = causeIds;
      }
      if (colorChanged) {
        updateData.color = letterLogoColor;
      }

      updateMutation.mutate(updateData);
    }
  };

  const handleFileChange = () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        showToast(response.errorMessage, 4000);
        return;
      }
      if (response.assets && response.assets[0]?.uri) {
        setUploadedLogo(response.assets[0].uri);
        setUploadedLogoPreview(response.assets[0].uri);
        setLogoType('upload');
      }
    });
  };

  const handleColorSelect = (color: string) => {
    setLetterLogoColor(color);
  };

  const handleSearchKeyPress = () => {
    if (searchQuery.trim()) {
      setSearchTrigger(prev => prev + 1);
    }
  };

  const isCauseSelected = (causeId: number) => {
    return selectedCauses.some(cause => cause.id === causeId);
  };

  const handleToggleCause = (cause: any) => {
    if (isCauseSelected(cause.id)) {
      setSelectedCauses(prev => prev.filter(c => c.id !== cause.id));
    } else {
      // Check if adding would exceed the limit of 10 (like in Vite)
      if (selectedCauses.length >= 10) {
        showToast('You cannot select more than 10 causes.', 4000);
        return;
      }
      setSelectedCauses(prev => [...prev, cause]);
    }
  };

  const handleRemoveCause = (causeId: number) => {
    setSelectedCauses(prev => prev.filter(c => c.id !== causeId));
  };

  // Check if user is admin
  const isAdmin = currentUser?.id === crwdData?.created_by?.id;

  // Redirect if not admin
  useEffect(() => {
    if (crwdData && !isAdmin) {
      navigation.goBack();
    }
  }, [crwdData, isAdmin, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1600ff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!crwdData || !isAdmin) {
    return null;
  }

  const logoLetter = crwdData.name?.charAt(0).toUpperCase() || 'C';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Collective</Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Edit2 size={24} color="white" />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Update Your Collective</Text>
            <Text style={styles.bannerDescription}>
              Make changes to your collective name, mission, or the causes you support.
            </Text>
          </View>
        </View>

        {/* Collective Name */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Collective Name <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Collective Name', 'Enter the name of your collective')}
            >
              <HelpCircle size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter collective name"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>

        {/* Description */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              What Brings This Group Together? <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Description', 'Describe what brings this group together')}
            >
              <HelpCircle size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what brings this group together"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
        </View>

        {/* Collective Logo */}
        <View style={styles.formSection}>
          <View style={styles.logoSection}>
            <Avatar size={64} style={styles.logoAvatar}>
              {logoType === 'upload' ? (
                uploadedLogoPreview ? (
                  <AvatarImage src={uploadedLogoPreview} alt={name} />
                ) : (
                  <AvatarFallback
                    style={{ backgroundColor: '#f3f4f6' }}
                    textStyle={styles.logoAvatarFallback}
                  >
                    <Camera size={32} color="#9CA3AF" />
                  </AvatarFallback>
                )
              ) : (
                <View style={[styles.logoLetterContainer, { backgroundColor: letterLogoColor }]}>
                  <Text style={styles.logoLetter}>{logoLetter}</Text>
                </View>
              )}
            </Avatar>
            <View style={styles.logoInfo}>
              <Text style={styles.logoLabel}>Collective Logo</Text>
              <Text style={styles.logoSubtext}>
                {logoType === 'letter' ? 'Letter logo' : 'Custom image'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowLogoCustomization(!showLogoCustomization)}
              style={styles.customizeButton}
            >
              <Edit2 size={16} color="#111827" />
              <Text style={styles.customizeButtonText}>
                {showLogoCustomization ? 'Done' : 'Customize'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Customization Options */}
          {showLogoCustomization && (
            <View style={styles.customizationSection}>
              <View style={styles.logoTypeButtons}>
                <TouchableOpacity
                  onPress={() => setLogoType('letter')}
                  style={[
                    styles.logoTypeButton,
                    logoType === 'letter' && styles.logoTypeButtonActive
                  ]}
                >
                  <Edit2 size={16} color={logoType === 'letter' ? 'white' : '#111827'} />
                  <Text style={[
                    styles.logoTypeButtonText,
                    logoType === 'letter' && styles.logoTypeButtonTextActive
                  ]}>
                    Letter
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLogoType('upload')}
                  style={[
                    styles.logoTypeButton,
                    logoType === 'upload' && styles.logoTypeButtonActive
                  ]}
                >
                  <Camera size={16} color={logoType === 'upload' ? 'white' : '#111827'} />
                  <Text style={[
                    styles.logoTypeButtonText,
                    logoType === 'upload' && styles.logoTypeButtonTextActive
                  ]}>
                    Upload
                  </Text>
                </TouchableOpacity>
              </View>

              {logoType === 'letter' && (
                <View style={styles.colorSection}>
                  <Text style={styles.colorSectionTitle}>Background Color</Text>
                  <View style={styles.colorSwatchesContainer}>
                    {colorSwatches.map((color) => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => handleColorSelect(color)}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: color },
                          letterLogoColor === color && styles.colorSwatchSelected
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}

              {logoType === 'upload' && (
                <TouchableOpacity
                  onPress={handleFileChange}
                  style={styles.uploadButton}
                >
                  <Camera size={16} color="#111827" />
                  <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Causes Management Section */}
        <View style={styles.causesSection}>
          {/* Selected Causes */}
          <View style={styles.selectedCausesCard}>
            <Text style={styles.selectedCausesTitle}>
              Selected Causes ({selectedCauses.length}/10)
            </Text>
            {selectedCauses.length > 0 ? (
              <View style={styles.selectedCausesList}>
                {selectedCauses.map((cause) => {
                  const causeData = cause.cause || cause;
                  const categoryId = causeData.category || causeData.cause_category;
                  const category = getCategoryById(categoryId);
                  const categoryName = category?.name || 'Uncategorized';
                  const categoryColor = category?.text || '#10B981';
                  const avatarBgColor = getConsistentColor(causeData.id, avatarColors);
                  const initials = getInitials(causeData.name || 'N');

                  return (
                    <View key={cause.id} style={styles.selectedCauseCard}>
                      <View style={styles.selectedCauseContent}>
                        <Avatar size={48} style={styles.selectedCauseAvatar}>
                          <AvatarImage src={causeData.image} alt={causeData.name} />
                          <AvatarFallback
                            style={{ backgroundColor: avatarBgColor }}
                            textStyle={styles.selectedCauseAvatarFallback}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <View style={styles.selectedCauseInfo}>
                          <View style={styles.selectedCauseHeader}>
                            <Text style={styles.selectedCauseName}>{causeData.name}</Text>
                            {/* <View style={[styles.selectedCauseCategory, { backgroundColor: `${categoryColor}20` }]}>
                                <Text style={[styles.selectedCauseCategoryText, { color: categoryColor }]}>
                                  {categoryName}
                                </Text>
                              </View> */}
                          </View>
                          <Text style={styles.selectedCauseDescription}>
                            {truncateAtFirstPeriod(causeData.mission || causeData.description)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveCause(cause.id)}
                          style={styles.removeCauseButton}
                        >
                          <X size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noCausesText}>No causes selected</Text>
            )}
          </View>

          {/* Add or Remove Causes */}
          <View style={styles.addCausesCard}>
            <Text style={styles.addCausesTitle}>
              Add or Remove Causes <Text style={styles.required}>*</Text>
            </Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                placeholder="Search nonprofits..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchKeyPress}
                style={styles.searchInput}
              />
            </View>

            {/* Causes List */}
            <ScrollView style={styles.causesListScroll} nestedScrollEnabled>
              {(isCausesLoading) ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1600ff" />
                </View>
              ) : (
                (() => {
                  const causes = searchTrigger > 0 && searchQuery.trim()
                    ? (causesData?.results || [])
                    : (defaultCausesData?.results || []);

                  // Filter out already selected causes
                  const availableCauses = causes.filter((cause: any) =>
                    !selectedCauses.some(selected => selected.id === cause.id)
                  );

                  if (availableCauses.length === 0) {
                    return (
                      <Text style={styles.noCausesText}>No causes found</Text>
                    );
                  }

                  return availableCauses.map((cause: any) => {
                    const categoryId = cause.category || cause.cause_category;
                    const category = getCategoryById(categoryId);
                    const categoryName = category?.name || 'Uncategorized';
                    const categoryColor = category?.text || '#10B981';
                    const isSelected = isCauseSelected(cause.id);
                    const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                    const initials = getInitials(cause.name || 'N');

                    return (
                      <TouchableOpacity
                        key={cause.id}
                        onPress={() => handleToggleCause(cause)}
                        style={[
                          styles.causeCard,
                          isSelected && styles.causeCardSelected
                        ]}
                      >
                        <Avatar size={48} style={styles.causeAvatar}>
                          <AvatarImage src={cause.image} alt={cause.name} />
                          <AvatarFallback
                            style={{ backgroundColor: avatarBgColor }}
                            textStyle={styles.causeAvatarFallback}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <View style={styles.causeInfo}>
                          <View style={styles.causeHeader}>
                            <Text style={styles.causeName}>{cause.name}</Text>
                            {/* <View style={[styles.causeCategory, { backgroundColor: `${categoryColor}20` }]}>
                                <Text style={[styles.causeCategoryText, { color: categoryColor }]}>
                                  {categoryName}
                                </Text>
                              </View> */}
                          </View>
                          <Text style={styles.causeDescription}>
                            {truncateAtFirstPeriod(cause.mission || cause.description)}
                          </Text>
                        </View>
                        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                          {isSelected && <View style={styles.radioButtonInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  });
                })()
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveButton,
            updateMutation.isPending && styles.saveButtonDisabled
          ]}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Check size={16} color="white" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <DiscardBottomSheet
        ref={discardSheetRef}
        onDiscard={() => {
          setIsConfirmedDiscard(true);
          discardSheetRef.current?.dismiss();
          setTimeout(() => {
            if (pendingAction) {
              navigation.dispatch(pendingAction);
            } else {
              navigation.goBack();
            }
          }, 300);
        }}
        onCancel={() => discardSheetRef.current?.dismiss()}
      />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    // flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginRight: 40,
    fontFamily: 'Outfit-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1600ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  bannerDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  formSection: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit-Medium',
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    fontFamily: 'Outfit-Medium',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoAvatar: {
    borderRadius: 12,
  },
  logoLetterContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
  },
  logoAvatarFallback: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9CA3AF',
    fontFamily: 'Outfit-Bold',
  },
  logoInfo: {
    flex: 1,
  },
  logoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  logoSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  customizeButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  customizationSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoTypeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  logoTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  logoTypeButtonActive: {
    backgroundColor: '#1600ff',
    borderColor: '#1600ff',
  },
  logoTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  logoTypeButtonTextActive: {
    color: 'white',
  },
  colorSection: {
    marginTop: 16,
  },
  colorSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  colorSwatchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: '#111827',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  causesSection: {
    marginTop: 8,
  },
  selectedCausesCard: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#EFF6FF',
  },
  selectedCausesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-Bold',
  },
  selectedCausesList: {
    gap: 12,
  },
  selectedCauseCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCauseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedCauseAvatar: {
    borderRadius: 24,
  },
  selectedCauseAvatarFallback: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Outfit-Bold',
  },
  selectedCauseInfo: {
    flex: 1,
    minWidth: 0,
  },
  selectedCauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  selectedCauseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  selectedCauseCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  selectedCauseCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  selectedCauseDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  removeCauseButton: {
    padding: 8,
  },
  addCausesCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 12,
  },
  addCausesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-Bold',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  causesListScroll: {
    maxHeight: 400,
  },
  causeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  causeCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  causeAvatar: {
    borderRadius: 24,
  },
  causeAvatarFallback: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Outfit-Bold',
  },
  causeInfo: {
    flex: 1,
    minWidth: 0,
  },
  causeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  causeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  causeCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  causeCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  causeDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1600ff',
    backgroundColor: '#1600ff',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  noCausesText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 24,
    fontFamily: 'Outfit-Regular',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1600ff',
    borderRadius: 9999,
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Outfit-Bold',
  },
});

