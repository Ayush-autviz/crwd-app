import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import DiscardBottomSheet from '../components/ui/DiscardBottomSheet';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, usePreventRemove, CommonActions } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Info,
  Search,
  Building2,
  Eye,
  Share2,
  Sparkles,
  Loader2,
  Calendar,
  Check,
  X,
  Plus,
  Palette,
  Image as ImageIcon,
  Camera,
} from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { PrimaryBlue } from '../Constants/Colors';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getCollectiveById, getCausesBySearch, createFundraiser, getCategories, getCollectiveCauses } from '../services/api/crwd';
import { useToast } from '../contexts/ToastContext';
import CrwdAnimation from '../components/ui/CrwdAnimation';
import { encodePostId, truncateAtFirstPeriod } from '../utils/truncateFirstPeriod';
import SharePost from '../components/SharePost';
import { WEB_BASE_URL } from '../Constants/url';

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
  return (words[0].charAt(0)).toUpperCase();
};

// Filter categories for the fundraiser page - use all categories except "All"
// Now dynamically fetched from API

export default function CreateFundraiser() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;
  const collectiveId = params?.collectiveId || '';
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [coverType, setCoverType] = useState<'color' | 'image'>('color');
  const [coverColor, setCoverColor] = useState('#1600ff');
  const [uploadedCoverImage, setUploadedCoverImage] = useState<string | null>(null);
  const [uploadedCoverImageFile, setUploadedCoverImageFile] = useState<any>(null);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [fundraisingGoal, setFundraisingGoal] = useState('');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [campaignStory, setCampaignStory] = useState('');

  // Step 2 state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedNonprofits, setSelectedNonprofits] = useState<number[]>([]);
  const [selectedNonprofitsData, setSelectedNonprofitsData] = useState<any[]>([]);
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnimationComplete, setShowAnimationComplete] = useState(false);
  const [createdFundraiser, setCreatedFundraiser] = useState<any>(null);
  const discardSheetRef = React.useRef<BottomSheetModal>(null);
  // Use a ref so the flag is readable synchronously when the beforeRemove event fires
  const [isConfirmedDiscard, setIsConfirmedDiscard] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const confettiRef = React.useRef<ConfettiCannon>(null);
  const shareSheetRef = React.useRef<BottomSheetModal>(null);

  // Fetch collective data
  const { data: collectiveData, isLoading: isLoadingCollective } = useQuery({
    queryKey: ['crwd', collectiveId],
    queryFn: () => getCollectiveById(collectiveId || ''),
    enabled: !!collectiveId,
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

  // Fetch causes/nonprofits for step 2
  const { data: causesData, isLoading: isLoadingCauses } = useQuery({
    queryKey: ['causes-search', searchQuery, selectedCategory, searchTrigger],
    queryFn: () => getCausesBySearch(searchQuery || '', selectedCategory || '', 1),
    enabled: (step === 2 && (searchTrigger > 0 || searchQuery.trim().length > 0)),
  });

  // Fetch collective causes
  const { data: collectiveCausesData, isLoading: isLoadingCollectiveCauses } = useQuery({
    queryKey: ['collective-causes', collectiveId],
    queryFn: () => getCollectiveCauses(collectiveId || ''),
    enabled: !!collectiveId && step === 2,
  });

  const collectiveCauses = useMemo(() => {
    if (!collectiveCausesData) return [];
    const causes = collectiveCausesData.results || collectiveCausesData || [];
    return causes.map((item: any) => item.cause || item);
  }, [collectiveCausesData]);

  // Initial load for step 2
  useEffect(() => {
    if (step === 2 && searchTrigger === 0) {
      setSearchTrigger(1);
    }
  }, [step]);

  // Create fundraiser mutation
  const createFundraiserMutation = useMutation({
    mutationFn: createFundraiser,
    onSuccess: (response: any) => {
      console.log('Create fundraiser successful:', response);
      setCreatedFundraiser(response);
      // Wait for animation to complete (3 seconds for one full cycle) before showing success
      setTimeout(() => {
        setShowAnimationComplete(true);
        setShowSuccessModal(true);
        setShowConfetti(true);
        if (confettiRef.current) {
          confettiRef.current.start();
        }
        setTimeout(() => {
          setShowConfetti(false);
        }, 4000);
      }, 3000);
      queryClient.invalidateQueries({ queryKey: ['crwd', collectiveId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      console.log('Create fundraiser error:', error.response.data.error || error.response.data.message || error.message);
      let errorMessage = 'Failed to create fundraiser';
      if (error?.response?.data?.non_field_errors && Array.isArray(error.response.data.non_field_errors) && error.response.data.non_field_errors.length > 0) {
        errorMessage = error.response.data.non_field_errors[0];
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      console.log('Create fundraiser error:', errorMessage);
      showToast(errorMessage, 3000);
    },
  });

  const collectiveName = collectiveData?.name || params?.collectiveName || 'Collective';

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

  const hasUnsavedChanges = useMemo(() => {
    return (
      campaignTitle.trim() !== '' ||
      fundraisingGoal.trim() !== '' ||
      endDate !== null ||
      campaignStory.trim() !== '' ||
      uploadedCoverImage !== null ||
      selectedNonprofits.length > 0
    );
  }, [campaignTitle, fundraisingGoal, endDate, campaignStory, uploadedCoverImage, selectedNonprofits]);

  // Navigation guard - using usePreventRemove for better compatibility (e.g. iOS back button)
  usePreventRemove(
    hasUnsavedChanges && !showSuccessModal && !isConfirmedDiscard,
    (e) => {
      Keyboard.dismiss();
      setPendingAction(e.data.action);
      discardSheetRef.current?.present();
    }
  );

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (step > 1) {
        setStep((prev) => (prev - 1) as 1 | 2 | 3);
        return true;
      }
      if (hasUnsavedChanges && !showSuccessModal && !isConfirmedDiscard) {
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
  }, [hasUnsavedChanges, showSuccessModal, navigation, step]);

  const handleColorSelect = (color: string) => {
    setCoverColor(color);
    setCoverType('color');
  };

  const handleFileChange = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      cropping: true,
      width: 1200,
      height: 400,
      freeStyleCropEnabled: false,
      includeBase64: false,
      cropperToolbarTitle: 'Crop Cover Image',
    }).then(image => {
      setUploadedCoverImage(image.path);
      setUploadedCoverImageFile({
        uri: image.path,
        type: image.mime,
        fileName: image.filename || 'cover_image.jpg',
      });
      setCoverType('image');
    }).catch(error => {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.log('ImagePicker Error: ', error);
      }
    });
  };

  // Format date to YYYY-MM-DD string
  const formatDateToString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return '';
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      // Fallback formatting
      const year = date.getFullYear();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const day = date.getDate();
      return `${month} ${day}, ${year}`;
    }
  };

  // Handle date picker change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        // Set time to start of day to avoid timezone issues
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        setEndDate(date);
      }
    } else if (Platform.OS === 'ios') {
      // For iOS, update the date immediately as user scrolls
      if (selectedDate) {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        setEndDate(date);
      }
    }
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate step 1 fields
      if (!campaignTitle || !fundraisingGoal || !endDate || !campaignStory) {
        showToast('Please fill in all required campaign details.', 3000);
        return;
      }
      // Validate fundraising goal minimum
      if (parseFloat(fundraisingGoal) < 100) {
        showToast('Fundraising goal must be at least $100.', 3000);
        return;
      }
      // Validate date is today or later
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate < today) {
        showToast('Please select a date that is today or later.', 3000);
        return;
      }
      if (coverType === 'image' && !uploadedCoverImage) {
        showToast('Please upload an image for the campaign cover', 3000);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate step 2 - at least one nonprofit selected
      if (selectedNonprofits.length === 0) {
        showToast('Please select at least one nonprofit.', 3000);
        return;
      }
      setStep(3);
    }
  };

  const handleLaunch = () => {
    // Prepare request data
    const startDate = new Date().toISOString();
    const endDateISO = endDate ? endDate.toISOString() : '';

    if (coverType === 'image') {
      // If image tab is selected, validate that image exists
      if (!uploadedCoverImageFile) {
        showToast('Please upload an image for the campaign cover', 3000);
        return;
      }
      // Use FormData for image upload - send only image, no color
      const formData = new FormData();
      formData.append('name', campaignTitle);
      formData.append('description', campaignStory);
      formData.append('image_file', {
        uri: uploadedCoverImageFile.uri,
        type: uploadedCoverImageFile.type || 'image/jpeg',
        name: uploadedCoverImageFile.fileName || 'cover_image.jpg',
      } as any);
      
      if (collectiveId) {
        formData.append('collective_id', collectiveId.toString());
      }
      
      formData.append('target_amount', fundraisingGoal);
      formData.append('start_date', startDate);
      formData.append('end_date', endDateISO);
      formData.append('is_active', 'true');
      selectedNonprofits.forEach((causeId) => {
        formData.append('cause_ids', causeId.toString());
      });

      createFundraiserMutation.mutate(formData);
    } else if (coverType === 'color') {
      // Use JSON for color-based cover - send only color, no image
      const requestData: any = {
        name: campaignTitle,
        description: campaignStory,
        color: coverColor,
        target_amount: parseFloat(fundraisingGoal),
        start_date: startDate,
        end_date: endDateISO,
        is_active: true,
        cause_ids: selectedNonprofits,
      };
      
      if (collectiveId) {
        requestData.collective_id = parseInt(collectiveId.toString(), 10);
      }
      
      console.log('Create fundraiser request data:', requestData);

      createFundraiserMutation.mutate(requestData);
    }
  };

  const performBackNavigation = useCallback(() => {
    const params = route.params as any;
    const fromScreen = params?.from || params?.fromScreen;
    const specialFlows = ['NewNonprofitInterests', 'NewCompleteDonation', 'Login'];

    if (fromScreen && specialFlows.includes(fromScreen)) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'DrawerNav', state: { routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }] } }] } }],
        })
      );
    } else {
      navigation.goBack();
    }
  }, [navigation, route.params]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
      return;
    }

    if (hasUnsavedChanges && !showSuccessModal && !isConfirmedDiscard) {
      Keyboard.dismiss();
      setPendingAction(null);
      setTimeout(() => {
        discardSheetRef.current?.present();
      }, 250);
      return;
    }

    performBackNavigation();
  }, [step, hasUnsavedChanges, showSuccessModal, performBackNavigation]);

  const handleCancel = () => {
    handleBack();
  };

  // Step 2 handlers
  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchTrigger(prev => prev + 1);
  };

  // Get displayed nonprofits from API data
  const displayedNonprofits = causesData?.results || [];

  const handleNonprofitToggle = (nonprofitId: number, nonprofitData: any) => {
    setSelectedNonprofits(prev => {
      if (prev.includes(nonprofitId)) {
        return prev.filter(id => id !== nonprofitId);
      } else {
        return [...prev, nonprofitId];
      }
    });
    setSelectedNonprofitsData(prev => {
      if (prev.some(item => item.id === nonprofitId)) {
        return prev.filter(item => item.id !== nonprofitId);
      } else {
        return [...prev, nonprofitData];
      }
    });
  };

  const renderNonprofitItem = (nonprofit: any) => {
    const isSelected = selectedNonprofits.includes(nonprofit.id);
    const avatarBgColor = getConsistentColor(nonprofit.id, nonprofit.name);
    const initials = getInitials(nonprofit.name || 'N');
    const category = categoriesList.find((cat: any) => cat.id === nonprofit.category?.toString() || cat.id === nonprofit.cause_category?.toString());
    const categoryName = (nonprofit?.categories?.[0]?.name || nonprofit?.categories?.name || (typeof nonprofit?.categories === 'string' ? nonprofit?.categories : null) || category?.name || 'General');

    return (
      <TouchableOpacity
        key={nonprofit.id}
        onPress={() => handleNonprofitToggle(nonprofit.id, nonprofit)}
        style={styles.nonprofitItem}
      >
        <Avatar style={styles.nonprofitAvatar}>
          <AvatarImage src={nonprofit.image || undefined} />
          <AvatarFallback
            style={{ backgroundColor: avatarBgColor }}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </AvatarFallback>
        </Avatar>
        <View style={styles.nonprofitInfo}>
          <Text style={styles.nonprofitName}>{nonprofit.name}</Text>
          <Text style={styles.nonprofitMission}>
            {truncateAtFirstPeriod(nonprofit.mission || nonprofit.description || categoryName, 50)}
          </Text>
        </View>
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
            {isSelected && <Check size={16} color="#FFFFFF" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading Animation Step (during API call or while animation completes)
  if (createFundraiserMutation.isPending || (createdFundraiser && !showAnimationComplete)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <CrwdAnimation size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  // Loading state for collective
  if (isLoadingCollective) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // Success Step
  if (showSuccessModal && createdFundraiser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIcon}>
                <Sparkles size={40} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>

            {/* Heading */}
            <View style={styles.successHeading}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>Campaign is Live!</Text>
            </View>

            {/* Description */}
            <Text style={styles.successDescription}>
              Your <Text style={styles.successBold}>{campaignTitle}</Text> fundraiser is now live! Share it with friends to reach your ${parseFloat(fundraisingGoal || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} goal and support {selectedNonprofitsData.length} nonprofit{selectedNonprofitsData.length !== 1 ? 's' : ''}.
            </Text>

            {/* Action Buttons */}
            <View style={styles.successButtons}>
              <TouchableOpacity
                style={styles.viewCampaignButton}
                onPress={() => {
                  if (createdFundraiser?.id) {
                    setIsConfirmedDiscard(true);
                    (navigation as any).navigate('FundraiserDetail', { id: createdFundraiser.id, fromCreate: true });
                  }
                }}
              >
                <Eye size={20} color="#FFFFFF" />
                <Text style={styles.viewCampaignText}>View Campaign</Text>
              </TouchableOpacity>

              {!!collectiveId && (
                <TouchableOpacity
                  style={styles.backToCollectiveButton}
                  onPress={() => {
                    setIsConfirmedDiscard(true);
                    (navigation as any).navigate('GroupCRWD', { id: collectiveId, fromCreate: true });
                  }}
                >
                  <Text style={styles.backToCollectiveText}>Back to Giving Group</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  shareSheetRef.current?.present();
                }}

              >
                <Share2 size={20} color={PrimaryBlue} />
                <Text style={styles.shareText}>Share Campaign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Confetti */}
        {showConfetti && (
          <ConfettiCannon
            ref={confettiRef}
            count={300}
            origin={{ x: 0, y: 0 }}
            fadeOut={true}
          />
        )}
        <SharePost
          ref={shareSheetRef}
          url={`${WEB_BASE_URL}/fundraiser/${encodePostId(createdFundraiser?.id)}`}
          title={campaignTitle || ''}
          message={campaignStory || ''}
          entityType="fundraiser"
          entityId={createdFundraiser?.id}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {step === 3 ? 'Confirm & Launch' : 'Create Fundraiser'}
              </Text>
              {step !== 3 && !!collectiveId && (
                <Text style={styles.headerSubtitle}>
                  For {collectiveName}
                </Text>
              )}
            </View>
          </View>

          {/* Progress Indicator - Only show for steps 1 and 2 */}
          {step !== 3 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressStep}>
                <View style={[styles.progressCircle, step >= 1 && styles.progressCircleActive]}>
                  {step > 1 ? (
                    <Check size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.progressNumber, step >= 1 && styles.progressNumberActive]}>1</Text>
                  )}
                </View>
                <Text style={[styles.progressLabel, step >= 1 && styles.progressLabelActive]}>Details</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={[styles.progressCircle, step >= 2 && styles.progressCircleActive]}>
                  {step > 2 ? (
                    <Check size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.progressNumber, step >= 2 && styles.progressNumberActive]}>2</Text>
                  )}
                </View>
                <Text style={[styles.progressLabel, step >= 2 && styles.progressLabelActive]}>Nonprofits</Text>
              </View>
            </View>
          )}
        </View>

        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
          scrollEnabled={!showDatePicker}
        >
          {step === 1 ? (
            <>
              {/* Time-Limited Campaign Info Box */}
              <View style={styles.infoBox}>
                <Info size={24} color="#2563EB" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Time-Limited Campaign</Text>
                  <Text style={styles.infoText}>
                    Create urgency for your cause with a deadline. Perfect for emergencies, holidays, or special events.
                  </Text>
                </View>
              </View>

              {/* Campaign Cover */}
              <View style={styles.section}>
                <Text style={styles.label}>Campaign Cover</Text>

                {/* Type Selection Buttons */}
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[styles.typeButton, coverType === 'color' && styles.typeButtonActive]}
                    onPress={() => setCoverType('color')}
                  >
                    <Palette size={20} color={coverType === 'color' ? '#374151' : '#6B7280'} />
                    <Text style={[styles.typeButtonText, coverType === 'color' && styles.typeButtonTextActive]}>
                      Color
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, coverType === 'image' && styles.typeButtonActive]}
                    onPress={() => setCoverType('image')}
                  >
                    <ImageIcon size={20} color={coverType === 'image' ? '#374151' : '#6B7280'} />
                    <Text style={[styles.typeButtonText, coverType === 'image' && styles.typeButtonTextActive]}>
                      Image
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Color Picker */}
                {coverType === 'color' && (
                  <View>
                    <Text style={styles.subLabel}>Choose Background Color</Text>
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
                        <Image source={{ uri: uploadedCoverImage }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => {
                            setUploadedCoverImage(null);
                          }}
                        >
                          <X size={20} color="#374151" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadArea}
                        onPress={handleFileChange}
                      >
                        <Camera size={40} color="#9CA3AF" />
                        <Text style={styles.uploadText}>Click to upload image</Text>
                        <Text style={styles.uploadSubtext}>Choose from gallery</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Campaign Title */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  Campaign Title <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={campaignTitle}
                  onChangeText={setCampaignTitle}
                  placeholder="e.g., Kansas Tornado Relief Fund"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Fundraising Goal */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  Fundraising Goal <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.currencyInputField}
                    value={fundraisingGoal}
                    onChangeText={setFundraisingGoal}
                    placeholder="100"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Campaign End Date */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  Campaign End Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateInputText, !endDate && styles.dateInputPlaceholder]}>
                    {endDate ? formatDateForDisplay(endDate) : 'Select end date'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>Choose when your campaign ends</Text>
              </View>

              {/* Date Picker Modal for iOS */}
              {Platform.OS === 'ios' && (
                <Modal
                  visible={showDatePicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.datePickerModal}>
                    <TouchableOpacity
                      style={styles.datePickerModalBackdrop}
                      activeOpacity={1}
                      onPress={() => setShowDatePicker(false)}
                    />
                    <View style={styles.datePickerModalContent}>
                      <View style={styles.datePickerHeader}>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                          style={styles.datePickerCancelButton}
                        >
                          <Text style={styles.datePickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.datePickerTitle}>Select End Date</Text>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                          style={styles.datePickerDoneButton}
                        >
                          <Text style={styles.datePickerDoneText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.datePickerContainer}>
                        <DateTimePicker
                          value={endDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={handleDateChange}
                          minimumDate={new Date()}
                          textColor="#111827"
                          themeVariant="light"
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              )}

              {/* Date Picker for Android */}
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {/* Campaign Story */}
              <View style={styles.section}>
                <Text style={styles.label}>
                  Campaign Story <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.textArea}
                  value={campaignStory}
                  onChangeText={setCampaignStory}
                  placeholder="Tell people why you're raising money and how it will make an impact..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </>
          ) : step === 2 ? (
            <>
              {/* Informational Banner */}
              <View style={styles.infoBoxOrange}>
                <Building2 size={24} color="#EA580C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitleOrange}>Choose Any Nonprofits</Text>
                  <Text style={styles.infoTextOrange}>
                    Your fundraiser can support different nonprofits than your collective's core causes. Perfect for emergencies or special campaigns!
                  </Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.section}>
                <View style={styles.searchContainer}>
                  <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search nonprofits..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                </View>
              </View>

              {/* Filter Buttons */}
              <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {categoriesList.map((category: any) => {
                    const isSelected = selectedCategory === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => handleCategoryFilter(category.id)}
                        style={[
                          styles.filterButton,
                          isSelected && styles.filterButtonActive,
                        ]}
                      >
                        <Text style={[
                          styles.filterButtonText,
                          isSelected && styles.filterButtonTextActive,
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Selected Count */}
              <View style={[styles.section, { marginBottom: 10 }]}>
                <Text style={styles.selectedCount}>
                  {selectedNonprofits.length} nonprofit{selectedNonprofits.length !== 1 ? 's' : ''} selected
                </Text>
              </View>

              {/* Nonprofits List */}
              <View style={styles.nonprofitsList}>
                {isLoadingCauses || isLoadingCollectiveCauses ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                  </View>
                ) : (
                  <>
                    {/* Supported by Collective Section */}
                    {collectiveCauses.length > 0 && (
                      <View style={{ marginBottom: 0 }}>
                        <View style={[styles.sectionHeader, { paddingHorizontal: 0 }]}>
                          <Text style={styles.sectionTitle}>
                            SUPPORTED BY {collectiveName.toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ gap: 12 }}>
                          {collectiveCauses.map((nonprofit: any) => renderNonprofitItem(nonprofit))}
                        </View>

                        {/* Section Divider if there are more causes */}
                        {displayedNonprofits.length > 0 && (
                          <View style={styles.sectionDivider}>
                            <Text style={styles.sectionTitle}>OTHER NONPROFITS</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Regular List or Search Results */}
                    <View style={{ gap: 12 }}>
                      {(() => {
                        const regularCauses = searchQuery.trim().length > 0 || selectedCategory !== ''
                          ? displayedNonprofits
                          : displayedNonprofits.filter((c: any) => !collectiveCauses.some((cc: any) => cc.id === c.id));

                        if (regularCauses.length === 0) {
                          if (searchQuery.trim().length > 0 || selectedCategory !== '') {
                            return (
                              <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>No nonprofits found matching "{searchQuery}"</Text>
                              </View>
                            );
                          } else if (collectiveCauses.length === 0) {
                            return (
                              <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>No nonprofits found</Text>
                              </View>
                            );
                          }
                          return null;
                        }

                        return regularCauses.map((nonprofit: any) => renderNonprofitItem(nonprofit));
                      })()}
                    </View>
                  </>
                )}
              </View>
            </>
          ) : step === 3 ? (
            // Step 3: Confirm & Launch
            <View style={styles.previewCard}>
              {/* Cover Section - Color or Image */}
              <View style={styles.previewCover}>
                {coverType === 'color' ? (
                  <View style={[styles.previewCoverColor, { backgroundColor: coverColor }]} />
                ) : uploadedCoverImage ? (
                  <Image source={{ uri: uploadedCoverImage }} style={styles.previewCoverImage} />
                ) : (
                  <View style={[styles.previewCoverColor, { backgroundColor: '#1600ff' }]}>
                    <Text style={styles.previewCoverText}>
                      {campaignTitle || 'Campaign Cover'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Content Section */}
              <View style={styles.previewContent}>
                {/* Campaign Title */}
                <Text style={styles.previewTitle}>{campaignTitle}</Text>

                {/* Fundraising Goal and End Date */}
                <View style={styles.previewStats}>
                  <View style={styles.previewStatCard}>
                    <Text style={styles.previewStatLabel}>FUNDRAISING GOAL</Text>
                    <Text style={styles.previewStatValue}>
                      ${parseFloat(fundraisingGoal || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                  <View style={styles.previewStatCard}>
                    <Text style={styles.previewStatLabel}>ENDS ON</Text>
                    <Text style={styles.previewStatDate}>
                      {endDate ? formatDateForDisplay(endDate) : 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Campaign Story */}
                <View style={styles.previewStory}>
                  <Text style={styles.previewStoryLabel}>CAMPAIGN STORY</Text>
                  <Text style={styles.previewStoryText}>
                    {campaignStory || 'No story provided'}
                  </Text>
                </View>

                {/* Supporting Nonprofits */}
                <View style={styles.previewNonprofits}>
                  <Text style={styles.previewNonprofitsLabel}>
                    SUPPORTING {selectedNonprofitsData.length} NONPROFIT{selectedNonprofitsData.length !== 1 ? 'S' : ''}
                  </Text>
                  <View style={styles.previewNonprofitsList}>
                    {selectedNonprofitsData.map((nonprofit: any) => {
                      const avatarBgColor = getConsistentColor(nonprofit.id, nonprofit.name);
                      const initials = getInitials(nonprofit.name || 'N');
                      const category = categoriesList.find((cat: any) => cat.id === nonprofit.category?.toString() || cat.id === nonprofit.cause_category?.toString());
                      const categoryName = (nonprofit?.categories?.[0]?.name || nonprofit?.categories?.name || (typeof nonprofit?.categories === 'string' ? nonprofit?.categories : null) || category?.name || 'General');

                      return (
                        <View key={nonprofit.id} style={styles.previewNonprofitItem}>
                          <Avatar style={styles.previewNonprofitAvatar}>
                            <AvatarImage src={nonprofit.image || undefined} />
                            <AvatarFallback style={{ backgroundColor: avatarBgColor }}>
                              <Text style={styles.previewAvatarText}>{initials}</Text>
                            </AvatarFallback>
                          </Avatar>
                          <View style={styles.previewNonprofitInfo}>
                            <Text style={styles.previewNonprofitName}>{nonprofit.name}</Text>
                            <Text style={styles.previewNonprofitCategory}>{categoryName}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Donation Split Note */}
                <View style={styles.splitNote}>
                  <Text style={styles.splitNoteText}>
                    All donations will be split evenly across these nonprofits.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </KeyboardAwareScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step === 1 ? (
            <>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (!campaignTitle || !fundraisingGoal || !endDate || !campaignStory) && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!campaignTitle || !fundraisingGoal || !endDate || !campaignStory}
              >
                <Text style={styles.nextButtonText}>Next: Choose Nonprofits</Text>
              </TouchableOpacity>
            </>
          ) : step === 2 ? (
            <>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleBack}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  selectedNonprofits.length === 0 && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={selectedNonprofits.length === 0}
              >
                <Text style={styles.nextButtonText}>Next: Confirm & Launch</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Step 3: Launch Campaign button
            <TouchableOpacity
              style={[
                styles.launchButton,
                createFundraiserMutation.isPending && styles.launchButtonDisabled,
              ]}
              onPress={handleLaunch}
              disabled={createFundraiserMutation.isPending}
            >
              {createFundraiserMutation.isPending ? (
                <>
                  <Loader2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.launchButtonText}>Launching...</Text>
                </>
              ) : (
                <Text style={styles.launchButtonText}>Launch Campaign</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
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
              performBackNavigation();
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
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 6,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Outfit-Regular',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleActive: {
    backgroundColor: PrimaryBlue,
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Outfit-Bold',
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Outfit-SemiBold',
  },
  progressLabelActive: {
    color: PrimaryBlue,
  },
  progressLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoBoxOrange: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 2,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  infoTitleOrange: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    fontFamily: 'Outfit-Regular',
  },
  infoTextOrange: {
    fontSize: 13,
    color: '#C2410C',
    fontFamily: 'Outfit-Regular',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit-SemiBold',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  required: {
    color: '#EF4444',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  typeButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#9CA3AF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Outfit-Medium',
  },
  typeButtonTextActive: {
    color: '#111827',
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
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    // opacity: 0.5,
    fontFamily: 'Outfit-Bold',
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 6,
  },
  uploadArea: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  currencySymbol: {
    paddingLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Outfit-Medium',
  },
  currencyInputField: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  dateInputPlaceholder: {
    color: '#9CA3AF',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '50%',
    width: '100%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Outfit-Medium',
  },
  datePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: PrimaryBlue,
    fontFamily: 'Outfit-Bold',
  },
  datePickerContainer: {
    height: 200,
    width: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    fontFamily: 'Outfit-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: PrimaryBlue,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit-Medium',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  nonprofitsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  nonprofitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  nonprofitAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  nonprofitInfo: {
    flex: 1,
  },
  nonprofitName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  nonprofitMission: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  checkboxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: PrimaryBlue,
    borderColor: PrimaryBlue,
  },
  previewCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  previewCover: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewCoverColor: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCoverImage: {
    width: '100%',
    height: '100%',
  },
  previewCoverText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.5,
    fontFamily: 'Outfit-Bold',
  },
  previewContent: {
    paddingTop: 16,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PrimaryBlue,
    marginBottom: 24,
    fontFamily: 'Outfit-Bold',
  },
  previewStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  previewStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
  },
  previewStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Outfit-SemiBold',
  },
  previewStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: PrimaryBlue,
    fontFamily: 'Outfit-Bold',
  },
  previewStatDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  previewStory: {
    marginBottom: 24,
  },
  previewStoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Outfit-Medium',
  },
  previewStoryText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  previewNonprofits: {
    marginBottom: 16,
  },
  previewNonprofitsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: 'Outfit-Medium',
  },
  previewNonprofitsList: {
    gap: 12,
  },
  previewNonprofitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewNonprofitAvatar: {
    width: 48,
    height: 48,
    borderRadius: 10
  },
  previewAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  previewNonprofitInfo: {
    flex: 1,
  },
  previewNonprofitName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  previewNonprofitCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  splitNote: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 16,
  },
  splitNoteText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Outfit-Medium',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: '30%',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: PrimaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  launchButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: PrimaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  launchButtonDisabled: {
    opacity: 0.5,
  },
  launchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ADFF2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  successDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Outfit-Regular',
  },
  successBold: {
    fontWeight: '700',
    color: '#111827',
  },
  successButtons: {
    gap: 12,
  },
  viewCampaignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: PrimaryBlue,
  },
  viewCampaignText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit-SemiBold',
  },
  backToCollectiveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToCollectiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: PrimaryBlue,
    fontFamily: 'Outfit-SemiBold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Outfit-Bold',
  },
  sectionDivider: {
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
    marginBottom: 4,
  },
});

