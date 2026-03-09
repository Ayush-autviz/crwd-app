import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  BackHandler,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, usePreventRemove } from '@react-navigation/native';
import DiscardBottomSheet from '../components/ui/DiscardBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Info,
  Camera,
  X,
  Search,
  Trash2,
  Plus,
  Calendar,
  Loader2,
  Edit2,
} from 'lucide-react-native';
import * as ImagePicker from 'react-native-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { PrimaryBlue } from '../Constants/Colors';
import { getFundraiserById, getCollectiveById, getCausesBySearch, patchFundraiser, getCategories } from '../services/api/crwd';
import { useToast } from '../contexts/ToastContext';
import { differenceInDays } from 'date-fns';
import { truncateAtFirstPeriod } from '../utils/truncateFirstPeriod';

// Avatar colors for consistent fallback styling
const avatarColors = [
  '#FF6B6B', '#4CAF50', '#FF9800', '#9C27B0', '#2196F3',
  '#FFC107', '#E91E63', '#00BCD4', '#8BC34A', '#FF5722',
  '#673AB7', '#009688', '#FFEB3B', '#795548', '#607D8B',
];

const getConsistentColor = (id: number | string | undefined, fallbackName?: string) => {
  if (id !== undefined && id !== null) {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  }
  if (fallbackName) {
    const hash = fallbackName.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  }
  return avatarColors[0];
};

const getInitials = (name: string) => {
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return 'N';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Filter categories for the fundraiser page
// Now dynamically fetched from API

export default function EditFundraiser() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;
  const fundraiserId = String(params?.id || params?.fundraiserId || '');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // State
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignStory, setCampaignStory] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [coverType, setCoverType] = useState<'none' | 'color' | 'image'>('none');
  const [coverColor, setCoverColor] = useState('#1600ff');
  const [uploadedCoverImage, setUploadedCoverImage] = useState<string | null>(null);
  const [uploadedCoverImageFile, setUploadedCoverImageFile] = useState<any>(null);
  const [selectedNonprofits, setSelectedNonprofits] = useState<number[]>([]);
  const [selectedNonprofitsData, setSelectedNonprofitsData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Store initial values to track changes
  const [initialTitle, setInitialTitle] = useState('');
  const [initialStory, setInitialStory] = useState('');
  const [initialGoalAmount, setInitialGoalAmount] = useState('');
  const [initialEndDate, setInitialEndDate] = useState<Date | null>(null);
  const [initialCoverType, setInitialCoverType] = useState<'none' | 'color' | 'image'>('none');
  const [initialCoverColor, setInitialCoverColor] = useState('#1600ff');
  const [initialNonprofits, setInitialNonprofits] = useState<number[]>([]);



  const colorSwatches = [
    '#0000FF', // Blue
    '#FF3366', // Pink/Red
    '#ADFF2F', // Lime Green
    '#A855F7', // Purple
    '#10B981', // Teal
    '#FF6B35', // Orange
    '#EF4444', // Red
    '#6366F1', // Indigo
  ];

  // Fetch fundraiser data
  const { data: fundraiserData, isLoading, error } = useQuery({
    queryKey: ['fundraiser', fundraiserId],
    queryFn: () => getFundraiserById(fundraiserId),
    enabled: !!fundraiserId,
  });

  // Fetch collective data
  const { data: collectiveData } = useQuery({
    queryKey: ['crwd', fundraiserData?.collective],
    queryFn: () => getCollectiveById(fundraiserData?.collective?.toString() || ''),
    enabled: !!fundraiserData?.collective && typeof fundraiserData.collective === 'number',
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const categoriesList = useMemo(() => {
    if (!categoriesData?.data) return [{ id: '', name: 'All' }];
    // Ensure "All" is at the start if not returned by API or handle ID consistency
    const results = categoriesData.data.map((cat: any) => ({
      id: cat.id.toString(),
      name: cat.name,
      background_color: cat.background_color || cat.background,
      text_color: cat.text_color || cat.text
    }));

    // Check if "All" is already there
    if (results.some((cat: any) => cat.name.toLowerCase() === 'all')) {
      return results;
    }

    return [{ id: '', name: 'All' }, ...results];
  }, [categoriesData]);

  // Fetch causes/nonprofits for adding more
  const { data: causesData, isLoading: isLoadingCauses } = useQuery({
    queryKey: ['causes-search-edit', searchQuery, selectedCategory, searchTrigger],
    queryFn: () => getCausesBySearch(searchQuery || '', selectedCategory || '', 1),
    enabled: true,
  });

  // Initial load for nonprofits - trigger search on mount
  useEffect(() => {
    if (searchTrigger === 0) {
      setSearchTrigger(1);
    }
  }, [searchTrigger]);

  // Initialize form data when fundraiser data loads
  useEffect(() => {
    if (fundraiserData) {
      const apiTitle = fundraiserData.name || '';
      const apiStory = fundraiserData.description || '';
      const apiGoalAmount = fundraiserData.target_amount || '';
      const apiEndDate = fundraiserData.end_date ? new Date(fundraiserData.end_date) : null;

      setCampaignTitle(apiTitle);
      setCampaignStory(apiStory);
      setGoalAmount(apiGoalAmount);
      setEndDate(apiEndDate);

      // Store initial values
      setInitialTitle(apiTitle);
      setInitialStory(apiStory);
      setInitialGoalAmount(apiGoalAmount);
      setInitialEndDate(apiEndDate);

      // Set cover type - prioritize color over image
      if (fundraiserData.color) {
        setCoverType('color');
        setCoverColor(fundraiserData.color);
        setInitialCoverType('color');
        setInitialCoverColor(fundraiserData.color);
      } else if (fundraiserData.image) {
        setCoverType('image');
        setUploadedCoverImage(fundraiserData.image);
        setInitialCoverType('image');
      } else {
        setCoverType('none');
        setInitialCoverType('none');
      }

      // Set selected nonprofits
      const initialCauses = fundraiserData.causes && fundraiserData.causes.length > 0
        ? fundraiserData.causes
        : [];
      const initialCauseIds = initialCauses.map((cause: any) => cause.id);
      setSelectedNonprofits(initialCauseIds);
      setSelectedNonprofitsData(initialCauses);
      setInitialNonprofits(initialCauseIds);
    }
  }, [fundraiserData]);

  // Check if fundraiser has received donations
  const hasDonations = fundraiserData && parseFloat(fundraiserData.current_amount || '0') > 0;

  const [isConfirmedDiscard, setIsConfirmedDiscard] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const discardSheetRef = React.useRef<BottomSheetModal>(null);

  const hasUnsavedChanges = React.useMemo(() => {
    if (!fundraiserData) return false;
    const titleChanged = campaignTitle.trim() !== initialTitle;
    const storyChanged = campaignStory.trim() !== initialStory;
    const goalAmountChanged = goalAmount !== initialGoalAmount && !hasDonations;
    const endDateChanged = endDate ? endDate.getTime() !== initialEndDate?.getTime() : false;
    const nonprofitsChanged = JSON.stringify(selectedNonprofits.sort()) !== JSON.stringify(initialNonprofits.sort());
    const hasNewImage = coverType === 'image' && uploadedCoverImageFile !== null;
    const colorChanged = coverType === 'color' && coverColor !== initialCoverColor;
    const coverTypeChanged = coverType !== initialCoverType;

    return titleChanged || storyChanged || goalAmountChanged || endDateChanged || nonprofitsChanged || hasNewImage || colorChanged || coverTypeChanged;
  }, [campaignTitle, initialTitle, campaignStory, initialStory, goalAmount, initialGoalAmount, hasDonations, endDate, initialEndDate, selectedNonprofits, initialNonprofits, coverType, initialCoverType, uploadedCoverImageFile, coverColor, initialCoverColor, fundraiserData]);

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


  // Calculate days left
  const daysLeft = endDate
    ? Math.max(0, differenceInDays(endDate, new Date()))
    : fundraiserData?.end_date
      ? Math.max(0, differenceInDays(new Date(fundraiserData.end_date), new Date()))
      : 0;

  // Update fundraiser mutation
  const updateFundraiserMutation = useMutation({
    mutationFn: (data: any) => patchFundraiser(fundraiserId, data),
    onSuccess: () => {
      showToast('Fundraiser updated successfully!', 3000);
      queryClient.invalidateQueries({ queryKey: ['fundraiser', fundraiserId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    },
    onError: (error: any) => {
      console.error('Update fundraiser error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update fundraiser';
      showToast(errorMessage, 3000);
    },
  });

  const handleColorSelect = (color: string) => {
    setCoverColor(color);
    setCoverType('color');
    setUploadedCoverImage(null);
    setUploadedCoverImageFile(null);
  };

  const handleFileChange = () => {
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
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      if (response.assets && response.assets[0]?.uri) {
        setUploadedCoverImage(response.assets[0].uri);
        setUploadedCoverImageFile(response.assets[0]);
        setCoverType('image');
      }
    });
  };

  const handleRemoveImage = () => {
    setUploadedCoverImage(null);
    setUploadedCoverImageFile(null);
    setCoverType('none');
  };

  const handleExtendDate = () => {
    setShowExtendModal(true);
  };

  const handleExtendByWeek = (weeks: number) => {
    const currentDate = endDate || new Date();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setEndDate(newDate);
    setShowExtendModal(false);
  };

  const handleExtendByMonth = () => {
    const currentDate = endDate || new Date();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setEndDate(newDate);
    setShowExtendModal(false);
  };

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      const year = date.getFullYear();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const day = date.getDate();
      return `${month} ${day}, ${year}`;
    }
  };

  // Format date for input (DD/MM/YYYY)
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSave = () => {
    if (!campaignTitle.trim() || !campaignStory.trim() || !endDate) {
      showToast('Please fill in all required fields.', 3000);
      return;
    }

    // Check what has changed
    const titleChanged = campaignTitle.trim() !== initialTitle;
    const storyChanged = campaignStory.trim() !== initialStory;
    const goalAmountChanged = goalAmount !== initialGoalAmount && !hasDonations;
    const endDateChanged = endDate ? endDate.getTime() !== initialEndDate?.getTime() : false;
    const nonprofitsChanged = JSON.stringify(selectedNonprofits.sort()) !== JSON.stringify(initialNonprofits.sort());
    const hasNewImage = coverType === 'image' && uploadedCoverImageFile !== null;
    const colorChanged = coverType === 'color' && coverColor !== initialCoverColor;
    const coverTypeChanged = coverType !== initialCoverType;

    const coverRemoved = (initialCoverType === 'image' || initialCoverType === 'color') && coverType === 'none';
    const coverSwitched = (initialCoverType === 'image' && coverType === 'color') ||
      (initialCoverType === 'color' && coverType === 'image');

    const endDateISO = endDate ? endDate.toISOString() : '';

    // Use FormData if there's a new image upload, otherwise use JSON
    if (hasNewImage) {
      const formData = new FormData();

      if (titleChanged) {
        formData.append('name', campaignTitle.trim());
      }
      if (storyChanged) {
        formData.append('description', campaignStory.trim());
      }
      if (goalAmountChanged) {
        formData.append('target_amount', goalAmount);
      }
      if (endDateChanged) {
        formData.append('end_date', endDateISO);
      }
      if (nonprofitsChanged) {
        selectedNonprofits.forEach((causeId) => {
          formData.append('cause_ids', causeId.toString());
        });
      }

      formData.append('image_file', {
        uri: uploadedCoverImageFile.uri,
        type: uploadedCoverImageFile.type || 'image/jpeg',
        name: uploadedCoverImageFile.fileName || 'image.jpg',
      } as any);

      if (coverTypeChanged || coverSwitched) {
        formData.append('color', '');
      }

      updateFundraiserMutation.mutate(formData);
    } else {
      const updateData: any = {};

      if (titleChanged) {
        updateData.name = campaignTitle.trim();
      }
      if (storyChanged) {
        updateData.description = campaignStory.trim();
      }
      if (goalAmountChanged) {
        updateData.target_amount = parseFloat(goalAmount);
      }
      if (endDateChanged) {
        updateData.end_date = endDateISO;
      }
      if (nonprofitsChanged) {
        updateData.cause_ids = selectedNonprofits;
      }

      if (coverType === 'image' && coverTypeChanged) {
        updateData.color = '';
      } else if (coverType === 'color' && (colorChanged || coverTypeChanged)) {
        updateData.color = coverColor;
        if (coverSwitched || (initialCoverType === 'image' && coverType === 'color')) {
          updateData.image = null;
        }
      } else if (coverRemoved) {
        updateData.image = null;
        updateData.color = null;
      }

      if (Object.keys(updateData).length > 0) {
        updateFundraiserMutation.mutate(updateData);
      } else {
        showToast('No changes to save.', 3000);
      }
    }
  };

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchTrigger(prev => prev + 1);
  };

  const handleAddNonprofit = (nonprofitId: number, nonprofitData: any) => {
    if (!selectedNonprofits.includes(nonprofitId)) {
      setSelectedNonprofits(prev => [...prev, nonprofitId]);
      setSelectedNonprofitsData(prev => [...prev, nonprofitData]);
    }
  };

  const handleRemoveNonprofit = (nonprofitId: number) => {
    setSelectedNonprofits(prev => prev.filter(id => id !== nonprofitId));
    setSelectedNonprofitsData(prev => prev.filter(item => item.id !== nonprofitId));
    showToast('Nonprofit removed from supported nonprofits.', 3000);
  };

  // Handle date picker change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        setEndDate(date);
      }
    } else if (Platform.OS === 'ios') {
      if (selectedDate) {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        setEndDate(date);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !fundraiserData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Fundraiser not found</Text>
          <Text style={styles.errorText}>
            The fundraiser you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get available nonprofits to add (exclude already selected ones)
  const availableNonprofits = causesData?.results?.filter((cause: any) =>
    !selectedNonprofits.includes(cause.id)
  ) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Campaign</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
          scrollEnabled={!showDatePicker}
        >
          {/* Campaign Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.amountRaised}>
                  ${parseFloat(fundraiserData.current_amount || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.amountGoal}>
                  raised of ${parseFloat(fundraiserData.target_amount || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} goal
                </Text>
              </View>
              <View style={styles.donorsColumn}>
                <Text style={styles.donorsCount}>{fundraiserData.total_donors || 0}</Text>
                <Text style={styles.donorsLabel}>donors</Text>
              </View>
            </View>
            {hasDonations && (
              <View style={styles.infoBox}>
                <Info size={16} color={PrimaryBlue} />
                <Text style={styles.infoText}>
                  Campaign has received donations. Some fields cannot be changed.
                </Text>
              </View>
            )}
          </View>

          {/* Campaign Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campaign Details</Text>

            {/* Campaign Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Campaign Title</Text>
              <TextInput
                style={styles.input}
                value={campaignTitle}
                onChangeText={setCampaignTitle}
                placeholder="e.g., Holiday Giving Campaign"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={campaignStory}
                onChangeText={setCampaignStory}
                placeholder="Tell people why you're raising money and how it will make an impact..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Goal Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Amount</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={[styles.input, styles.amountInput, hasDonations && styles.disabledInput]}
                  value={goalAmount}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setGoalAmount(numericValue);
                  }}
                  placeholder="1000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  editable={!hasDonations}
                />
                {hasDonations && (
                  <View style={styles.disabledIndicator}>
                    <Info size={14} color="#6B7280" />
                    <Text style={styles.disabledText}>Cannot change</Text>
                  </View>
                )}
              </View>
              {hasDonations && (
                <Text style={styles.helperText}>
                  Goal cannot be changed after donations are received.
                </Text>
              )}
            </View>

            {/* End Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={formatDateForInput(endDate)}
                    editable={false}
                    placeholderTextColor="#9CA3AF"
                  />
                  {daysLeft > 0 && (
                    <Text style={styles.daysLeft}>
                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleExtendDate}
                  style={styles.extendButton}
                  activeOpacity={0.7}
                >
                  <Calendar size={16} color="#FFFFFF" />
                  <Text style={styles.extendButtonText}>Extend</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Cover Design */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover Design</Text>

            {/* Type Selection Buttons */}
            <View style={styles.coverTypeRow}>
              <TouchableOpacity
                onPress={() => setCoverType('color')}
                style={[styles.coverTypeButton, coverType === 'color' && styles.coverTypeButtonActive]}
                activeOpacity={0.7}
              >
                <Edit2 size={20} color={coverType === 'color' ? '#FFFFFF' : '#374151'} />
                <Text style={[styles.coverTypeText, coverType === 'color' && styles.coverTypeTextActive]}>
                  Color
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCoverType('image')}
                style={[styles.coverTypeButton, coverType === 'image' && styles.coverTypeButtonActive]}
                activeOpacity={0.7}
              >
                <Camera size={20} color={coverType === 'image' ? '#FFFFFF' : '#374151'} />
                <Text style={[styles.coverTypeText, coverType === 'image' && styles.coverTypeTextActive]}>
                  Image
                </Text>
              </TouchableOpacity>
            </View>

            {/* Color Picker */}
            {coverType === 'color' && (
              <View>
                <Text style={styles.subsectionTitle}>Choose Background Color</Text>
                <View style={styles.colorSwatches}>
                  {colorSwatches.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => handleColorSelect(color)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        coverColor === color && styles.colorSwatchSelected,
                      ]}
                      activeOpacity={0.7}
                    />
                  ))}
                </View>

                {/* Color Preview Box */}
                <View style={[styles.previewBox, { backgroundColor: coverColor }]}>
                  <Text style={styles.previewText}>
                    {campaignTitle || 'Campaign Cover'}
                  </Text>
                </View>
              </View>
            )}

            {/* Image Upload */}
            {coverType === 'image' && (
              <View>
                {uploadedCoverImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: uploadedCoverImage }} style={styles.previewImage} />
                    <TouchableOpacity
                      onPress={handleRemoveImage}
                      style={styles.removeImageButton}
                      activeOpacity={0.7}
                    >
                      <X size={16} color="#374151" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleFileChange}
                    style={styles.uploadArea}
                    activeOpacity={0.7}
                  >
                    <Camera size={40} color="#9CA3AF" />
                    <Text style={styles.uploadText}>Click to upload image</Text>
                    <Text style={styles.uploadSubtext}>Choose from gallery</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Supported Nonprofits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supported Nonprofits</Text>
            <Text style={styles.sectionSubtitle}>
              Add or remove nonprofits. Donations will be split evenly among selected organizations.
            </Text>

            {/* Selected Nonprofits */}
            {selectedNonprofitsData.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.subsectionTitle}>
                  Selected ({selectedNonprofitsData.length})
                </Text>
                <View style={styles.nonprofitsList}>
                  {selectedNonprofitsData.map((cause: any) => {
                    const avatarBgColor = getConsistentColor(cause.id, cause.name);
                    const initials = getInitials(cause.name || 'Nonprofit');
                    const category = categoriesList.find((cat: any) => cat.id === cause.category?.toString() || cat.id === cause.cause_category?.toString());
                    const categoryName = cause?.categories?.[0]?.name || cause?.categories?.name || (typeof cause?.categories === 'string' ? cause?.categories : null) || category?.name || 'General';

                    return (
                      <View key={cause.id} style={styles.selectedNonprofitCard}>
                        <Avatar size={48}>
                          <AvatarImage src={cause.image} />
                          <AvatarFallback
                            style={{ backgroundColor: avatarBgColor }}
                            textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <View style={styles.nonprofitInfo}>
                          <View style={styles.nonprofitNameContainer}>
                            <Text style={styles.nonprofitName}>{cause.name}</Text>
                            <View style={[styles.categoryBadgeTiny, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}>
                              <Text style={[styles.categoryBadgeTextTiny, { color: '#1E40AF' }]}>{categoryName}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.nonprofitActions}>
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Current</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveNonprofit(cause.id)}
                            style={styles.removeButton}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Add More Nonprofits */}
            <View>
              <Text style={styles.subsectionTitle}>Add More Nonprofits</Text>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search nonprofits..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>

              {/* Filter Buttons */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContainer}
              >
                {categoriesList.map((category: any) => {
                  const isSelected = selectedCategory === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => handleCategoryFilter(category.id)}
                      style={[styles.filterButton, isSelected && styles.filterButtonActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Available Nonprofits List */}
              {isLoadingCauses ? (
                <View style={styles.loadingCenter}>
                  <ActivityIndicator size="small" color={PrimaryBlue} />
                </View>
              ) : availableNonprofits.length > 0 ? (
                <View style={styles.nonprofitsList}>
                  {availableNonprofits.map((nonprofit: any) => {
                    const avatarBgColor = getConsistentColor(nonprofit.id, nonprofit.name);
                    const initials = getInitials(nonprofit.name);
                    const category = categoriesList.find((cat: any) => cat.id === nonprofit.category?.toString() || cat.id === nonprofit.cause_category?.toString());
                    const categoryName = nonprofit?.categories?.[0]?.name || nonprofit?.categories?.name || (typeof nonprofit?.categories === 'string' ? nonprofit?.categories : null) || category?.name || 'General';

                    return (
                      <View key={nonprofit.id} style={styles.availableNonprofitCard}>
                        <Avatar size={48}>
                          <AvatarImage src={nonprofit.image} />
                          <AvatarFallback
                            style={{ backgroundColor: avatarBgColor }}
                            textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <View style={styles.nonprofitInfo}>
                          <View style={styles.nonprofitNameContainer}>
                            <Text style={styles.nonprofitName}>{nonprofit.name}</Text>
                            <View style={styles.categoryBadgeTiny}>
                              <Text style={styles.categoryBadgeTextTiny}>{categoryName}</Text>
                            </View>
                          </View>
                          <Text style={styles.nonprofitDescription} >
                            {truncateAtFirstPeriod(nonprofit.mission || nonprofit.description || 'Nonprofit organization')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleAddNonprofit(nonprofit.id, nonprofit)}
                          style={styles.addButton}
                          activeOpacity={0.7}
                        >
                          <Plus size={18} color="#EC4899" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ) : searchQuery || selectedCategory ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No nonprofits found.</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Spacer for fixed footer */}
          <View style={styles.footerSpacer} />
        </KeyboardAwareScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateFundraiserMutation.isPending}
            style={[styles.saveButton, updateFundraiserMutation.isPending && styles.saveButtonDisabled]}
            activeOpacity={0.7}
          >
            {updateFundraiserMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Extend Campaign Deadline Modal */}
        <Modal
          visible={showExtendModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowExtendModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Extend Campaign Deadline</Text>
              <Text style={styles.modalDescription}>
                Choose how much time to add to your campaign. Current end date: {formatDate(endDate)}
              </Text>

              <View style={styles.extendOptions}>
                <TouchableOpacity
                  onPress={() => handleExtendByWeek(1)}
                  style={styles.extendOption}
                  activeOpacity={0.7}
                >
                  <Text style={styles.extendOptionTitle}>+1 Week</Text>
                  <Text style={styles.extendOptionDate}>
                    New end date: {endDate ? formatDate(new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 7))) : 'N/A'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleExtendByWeek(2)}
                  style={styles.extendOption}
                  activeOpacity={0.7}
                >
                  <Text style={styles.extendOptionTitle}>+2 Weeks</Text>
                  <Text style={styles.extendOptionDate}>
                    New end date: {endDate ? formatDate(new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 14))) : 'N/A'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExtendByMonth}
                  style={styles.extendOption}
                  activeOpacity={0.7}
                >
                  <Text style={styles.extendOptionTitle}>+1 Month</Text>
                  <Text style={styles.extendOptionDate}>
                    New end date: {endDate ? formatDate(new Date(new Date(endDate).setMonth(new Date(endDate).getMonth() + 1))) : 'N/A'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setShowExtendModal(false)}
                style={styles.cancelButton}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit-SemiBold',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Outfit-Regular',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  amountRaised: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PrimaryBlue,
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  amountGoal: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Outfit-Regular',
  },
  donorsColumn: {
    alignItems: 'flex-end',
  },
  donorsCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  donorsLabel: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Outfit-Regular',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    fontFamily: 'Outfit-Regular',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Outfit-Bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontFamily: 'Outfit-Regular',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit-SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Outfit-Regular',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  dollarSign: {
    position: 'absolute',
    left: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    zIndex: 1,
    fontFamily: 'Outfit-Medium',
  },
  amountInput: {
    paddingLeft: 32,
    flex: 1,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  disabledIndicator: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disabledText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInput: {
    backgroundColor: '#F3F4F6',
    color: '#111827',
  },
  daysLeft: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  extendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  coverTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coverTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  coverTypeButtonActive: {
    backgroundColor: PrimaryBlue,
    borderColor: PrimaryBlue,
  },
  coverTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit-Medium',
  },
  coverTypeTextActive: {
    color: '#FFFFFF',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  colorSwatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#111827',
  },
  previewBox: {
    height: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    opacity: 0.5,
    fontFamily: 'Outfit-Bold',
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadArea: {
    height: 300,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Outfit-Medium',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Outfit-Regular',
  },
  selectedSection: {
    marginBottom: 24,
  },
  nonprofitsList: {
    gap: 12,
  },
  selectedNonprofitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 12,
  },
  availableNonprofitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  nonprofitInfo: {
    flex: 1,
  },
  nonprofitName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Outfit-Bold',
  },
  nonprofitDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  nonprofitNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadgeTiny: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryBadgeTextTiny: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Outfit-Bold',
  },
  nonprofitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#BFDBFE',
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1E40AF',
    fontFamily: 'Outfit-Medium',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 12,
    fontFamily: 'Outfit-Regular',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: PrimaryBlue,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit-Medium',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingCenter: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  footerSpacer: {
    height: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  saveButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit-Bold',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    fontFamily: 'Outfit-Regular',
  },
  extendOptions: {
    gap: 12,
    marginBottom: 24,
  },
  extendOption: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  extendOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-SemiBold',
  },
  extendOptionDate: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PrimaryBlue,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: PrimaryBlue,
    fontFamily: 'Outfit-Bold',
  },
});


