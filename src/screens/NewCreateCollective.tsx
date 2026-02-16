import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Heart,
  Eye,
  Share2,
  User,
  Search,
  X,
  Loader2,
  Edit2,
  Camera,
  Flag,
  Users
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCollective, getCausesBySearch } from '../services/api/crwd';
import { getFavoriteCauses } from '../services/api/social';
import { getDonationBox, addCausesToBox } from '../services/api/donation';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/store';
import JoinCollectiveBottomSheet from '../components/newgroupcrwd/JoinCollectiveBottomSheet';
import { categories } from '../Constants/categories';
import * as ImagePicker from 'react-native-image-picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import CrwdAnimation from '../components/ui/CrwdAnimation';
import { WEB_BASE_URL } from '../Constants/url';
import LinearGradient from 'react-native-linear-gradient';
import { truncateAtFirstPeriod } from '../utils/truncateFirstPeriod';

const getCategoryById = (categoryId: string | undefined) => {
  return categories.find(cat => cat.id === categoryId) || null;
};

// Get category names as an array for multi-letter categories (e.g., "MK" -> ["Relief", "Food"])
const getCategoryNames = (categoryId: string | undefined): string[] => {
  if (!categoryId) return ['Uncategorized'];

  // If category is multiple letters, split and get names for each
  if (categoryId.length > 1) {
    const categoryNames = categoryId
      .split('')
      .map(char => {
        const category = getCategoryById(char);
        return category?.name || char;
      })
      .filter(Boolean);

    return categoryNames.length > 0 ? categoryNames : ['Uncategorized'];
  }

  // Single letter category
  const category = getCategoryById(categoryId);
  return category?.name ? [category.name] : ['Uncategorized'];
};

// Get category IDs as an array (for getting individual colors)
const getCategoryIds = (categoryId: string | undefined): string[] => {
  if (!categoryId) return [];

  // If category is multiple letters, split into individual IDs
  if (categoryId.length > 1) {
    return categoryId.split('');
  }

  // Single letter category
  return [categoryId];
};

// Get category background color for display (use first category's background for multi-letter)
const getCategoryColor = (categoryId: string | undefined): string => {
  if (!categoryId) return '#10B981';

  // For multi-letter categories, use the first category's background color
  const firstChar = categoryId.charAt(0);
  const category = getCategoryById(firstChar);
  return category?.background || '#10B981';
};

// Get category text color for display
const getCategoryTextColor = (categoryId: string | undefined): string => {
  if (!categoryId) return '#FFFFFF';

  // For multi-letter categories, use the first category's text color
  const firstChar = categoryId.charAt(0);
  const category = getCategoryById(firstChar);
  return category?.text || '#FFFFFF';
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

export default function NewCreateCollective() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser, token } = useAuthStore();
  const { showToast } = useToast();
  const confettiRef = React.useRef<ConfettiCannon>(null);
  const route = useRoute();

  const handleBack = () => {
    const params = route.params as any;
    const fromScreen = params?.from || params?.fromScreen;
    // Check if we came from specific flows (NewNonprofitInterests, NewCompleteDonation)
    // Note: In React Native navigation, we might need to check how these screens are named in the stack.
    // Assuming the params are passed explicitly as 'from'.
    const specialFlows = ['NewNonprofitInterests', 'NewCompleteDonation', 'Login'];

    if (fromScreen && specialFlows.includes(fromScreen)) {
      // Reset to Home/Root
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'DrawerNav', state: { routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }] } }] } }],
        })
      );
    } else {
      navigation.goBack();
    }
  };

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCauses, setSelectedCauses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdCollective, setCreatedCollective] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [showAddToBoxModal, setShowAddToBoxModal] = useState(false);

  // Logo customization state
  const [logoType, setLogoType] = useState<'letter' | 'upload'>('letter');
  const [letterLogoColor, setLetterLogoColor] = useState('#1600ff');
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [uploadedLogoPreview, setUploadedLogoPreview] = useState<string | null>(null);
  const [showLogoCustomization, setShowLogoCustomization] = useState(false);

  // Dropdown state for sections
  const [isYourCausesOpen, setIsYourCausesOpen] = useState(true);
  const [isSuggestedCausesOpen, setIsSuggestedCausesOpen] = useState(true);

  // Loading dots state
  const [dotCount, setDotCount] = useState(0);
  const [showAnimationComplete, setShowAnimationComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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

  useFocusEffect(
    React.useCallback(() => {
      setHasStarted(false);
      setStep(1);
    }, [])
  );

  // Fetch favorite causes
  const { data: favoriteCausesData, isLoading: isLoadingFavoriteCauses } = useQuery({
    queryKey: ['favoriteCauses'],
    queryFn: () => getFavoriteCauses(),
    enabled: !!currentUser?.id,
  });

  const favoriteCauses = favoriteCausesData?.results || [];

  // Fetch default causes (no search query)
  const { data: defaultCausesData, isLoading: defaultCausesLoading } = useQuery({
    queryKey: ['defaultCauses'],
    queryFn: () => getCausesBySearch('', '', 1),
    enabled: true,
  });

  // Fetch causes with search
  const { data: causesData, isLoading: isCausesLoading } = useQuery({
    queryKey: ['causes-search', searchQuery, searchTrigger],
    queryFn: () => getCausesBySearch(searchQuery || '', '', 1),
    enabled: searchTrigger > 0 && searchQuery.trim().length > 0,
  });

  // Fetch donation box data (only on success step)
  const { data: donationBoxData } = useQuery({
    queryKey: ['donationBox', currentUser?.id],
    queryFn: getDonationBox,
    enabled: !!currentUser?.id && !!token?.access_token && step === 3 && !!createdCollective,
  });

  // Check which causes are already in donation box
  const boxCauseIds = useMemo(() => {
    if (!donationBoxData?.box_causes) return new Set<string>();
    return new Set(
      (donationBoxData.box_causes || []).map((boxCause: any) => {
        const cause = boxCause.cause || boxCause;
        return cause?.id?.toString() || boxCause.cause_id?.toString();
      }).filter(Boolean)
    );
  }, [donationBoxData]);

  // Causes from this collective that are NOT yet in the donation box
  const causesToAdd = useMemo(() => {
    return selectedCauses.filter((cause: any) => {
      const causeId = (cause.cause || cause)?.id?.toString();
      return causeId && !boxCauseIds.has(causeId);
    });
  }, [selectedCauses, boxCauseIds]);

  // Check if all causes are already added
  const allCausesAlreadyAdded = selectedCauses.length > 0 && causesToAdd.length === 0;

  // Create collective mutation
  const createCollectiveMutation = useMutation({
    mutationFn: createCollective,
    onSuccess: (response: any) => {
      console.log('Create collective successful:', response);
      setCreatedCollective(response);
      // Wait for animation to complete (3 seconds for one full cycle) before showing success
      setTimeout(() => {
        setShowAnimationComplete(true);
        setStep(3);
        setShowConfetti(true);
        confettiRef.current?.start();
        setTimeout(() => {
          setShowConfetti(false);
        }, 4000);
      }, 3000);
      queryClient.invalidateQueries({ queryKey: ['collectives'] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives'] });
    },
    onError: (error: any) => {
      console.error('Create collective error:', error);

      // Check for logo_file validation error
      if (error.response?.data?.logo_file && Array.isArray(error.response.data.logo_file) && error.response.data.logo_file.length > 0) {
        showToast(error.response.data.logo_file[0], 4000);
        return;
      }

      // Check for other field-specific errors
      const errorData = error.response?.data;
      if (errorData) {
        const fieldErrors = Object.keys(errorData).filter(key => Array.isArray(errorData[key]) && errorData[key].length > 0);
        if (fieldErrors.length > 0) {
          const firstFieldError = errorData[fieldErrors[0]];
          if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
            showToast(firstFieldError[0], 4000);
            return;
          }
        }
      }

      // Fallback to general error message
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create collective';
      showToast(errorMessage, 4000);
    },
  });

  // Handle adding collective to donation box
  const handleAddToDonationBox = async () => {
    if (!createdCollective?.id) {
      showToast('Collective ID is missing', 4000);
      return;
    }

    try {
      // Check if donation box exists
      const donationBox = await getDonationBox();

      // If donation box doesn't exist or has no ID, navigate to setup
      if (!donationBox || !donationBox.id) {
        // Prepare causes data for preselection
        const preselectedCauses = selectedCauses.map((cause: any) => {
          const causeData = cause.cause || cause;
          return {
            id: causeData.id || cause.id,
            name: causeData.name || cause.name || 'Unknown Nonprofit',
            description: causeData.mission || causeData.description || cause.mission || cause.description || '',
            mission: causeData.mission || cause.mission || '',
            logo: causeData.image || causeData.logo || cause.image || cause.logo || '',
          };
        });
        const preselectedCauseIds = preselectedCauses.map((cause: any) => cause.id);

        (navigation as any).reset({
          index: 0,
          routes: [
            {
              name: 'DrawerNav' as never,
              state: {
                routes: [
                  {
                    name: 'MainTabs' as never,
                    state: {
                      routes: [
                        { name: 'Home' as never },
                        { name: 'Search' as never },
                        {
                          name: 'Donate' as never,
                          params: {
                            initialTab: 'setup',
                            preselectedItem: {
                              id: createdCollective.id,
                              type: 'collective',
                              data: createdCollective,
                            },
                            activeTab: 'collectives',
                            preselectedCauses: preselectedCauseIds,
                            preselectedCausesData: preselectedCauses,
                            preselectedCollectiveId: createdCollective.id,
                          },
                        },
                        { name: 'Collectives' as never },
                        { name: 'Profile' as never },
                      ],
                      index: 2, // Donate tab index
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        });
      } else {
        // Donation box exists, show bottom sheet to let user select causes
        setShowAddToBoxModal(true);
      }
    } catch (error: any) {
      console.error('Error checking donation box:', error);
      // On error, navigate to setup tab with causes
      const preselectedCauses = selectedCauses.map((cause: any) => {
        const causeData = cause.cause || cause;
        return {
          id: causeData.id || cause.id,
          name: causeData.name || cause.name || 'Unknown Nonprofit',
          description: causeData.mission || causeData.description || cause.mission || cause.description || '',
          mission: causeData.mission || cause.mission || '',
          logo: causeData.image || causeData.logo || cause.image || cause.logo || '',
        };
      });
      const preselectedCauseIds = preselectedCauses.map((cause: any) => cause.id);

      (navigation as any).reset({
        index: 0,
        routes: [
          {
            name: 'DrawerNav' as never,
            state: {
              routes: [
                {
                  name: 'MainTabs' as never,
                  state: {
                    routes: [
                      { name: 'Home' as never },
                      { name: 'Search' as never },
                      {
                        name: 'Donate' as never,
                        params: {
                          initialTab: 'setup',
                          preselectedItem: {
                            id: createdCollective.id,
                            type: 'collective',
                            data: createdCollective,
                          },
                          activeTab: 'collectives',
                          preselectedCauses: preselectedCauseIds,
                          preselectedCausesData: preselectedCauses,
                          preselectedCollectiveId: createdCollective.id,
                        },
                      },
                      { name: 'Collectives' as never },
                      { name: 'Profile' as never },
                    ],
                    index: 2,
                  },
                },
              ],
              index: 0,
            },
          },
        ],
      });
    }
  };

  // Handle confirm from bottom sheet - add selected causes to donation box
  const handleAddToBoxConfirm = async (selectedNonprofits: any[], collectiveId: string, shouldSetupDonationBox: boolean) => {
    if (!createdCollective?.id) return;

    // If no donation box and user wants to set it up
    if (shouldSetupDonationBox) {
      const preselectedCauses = selectedNonprofits.map((np) => {
        const cause = np.cause || np;
        return {
          id: cause.id || np.id,
          name: cause.name || np.name || 'Unknown Nonprofit',
          description: cause.mission || cause.description || np.mission || np.description || '',
          mission: cause.mission || np.mission || '',
          logo: cause.image || cause.logo || np.image || np.logo || '',
        };
      });
      const preselectedCauseIds = preselectedCauses.map((cause) => cause.id);

      setShowAddToBoxModal(false);

      // Navigate to donation setup with preselected causes
      (navigation as any).reset({
        index: 0,
        routes: [
          {
            name: 'DrawerNav' as never,
            state: {
              routes: [
                {
                  name: 'MainTabs' as never,
                  state: {
                    routes: [
                      { name: 'Home' as never },
                      { name: 'Search' as never },
                      {
                        name: 'Donate' as never,
                        params: {
                          initialTab: 'setup',
                          preselectedCauses: preselectedCauseIds,
                          preselectedCausesData: preselectedCauses,
                          preselectedCollectiveId: parseInt(collectiveId),
                        },
                      },
                      { name: 'Collectives' as never },
                      { name: 'Profile' as never },
                    ],
                    index: 2,
                  },
                },
              ],
              index: 0,
            },
          },
        ],
      });
      return;
    }

    // If donation box exists and causes are selected, add them
    if (selectedNonprofits.length > 0) {
      const causes = selectedNonprofits.map((np: any) => {
        const causeData = np.cause || np;
        const causeId = causeData.id || np.id;
        return {
          cause_id: causeId,
          attributed_collective: parseInt(collectiveId),
        };
      });

      try {
        await addCausesToBox({ causes });
        showToast('Nonprofits added to your donation box!', 3000);

        await queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
        await queryClient.refetchQueries({ queryKey: ['donationBox', currentUser?.id] });

        // Navigate to donation setup with collective preselected
        (navigation as any).reset({
          index: 0,
          routes: [
            {
              name: 'DrawerNav' as never,
              state: {
                routes: [
                  {
                    name: 'MainTabs' as never,
                    state: {
                      routes: [
                        { name: 'Home' as never },
                        { name: 'Search' as never },
                        {
                          name: 'Donate' as never,
                          params: {
                            initialTab: 'setup',
                            preselectedItem: {
                              id: createdCollective.id,
                              type: 'collective',
                              data: createdCollective,
                            },
                            activeTab: 'collectives',
                          },
                        },
                        { name: 'Collectives' as never },
                        { name: 'Profile' as never },
                      ],
                      index: 2,
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        });
      } catch (error: any) {
        console.error('Error adding causes to donation box:', error);
        showToast(error?.response?.data?.message || 'Failed to add nonprofits to donation box', 4000);
        (navigation as any).reset({
          index: 0,
          routes: [
            {
              name: 'DrawerNav' as never,
              state: {
                routes: [
                  {
                    name: 'MainTabs' as never,
                    state: {
                      routes: [
                        { name: 'Home' as never },
                        { name: 'Search' as never },
                        {
                          name: 'Donate' as never,
                          params: {
                            initialTab: 'setup',
                            preselectedItem: {
                              id: createdCollective.id,
                              type: 'collective',
                              data: createdCollective,
                            },
                            activeTab: 'collectives',
                          },
                        },
                        { name: 'Collectives' as never },
                        { name: 'Profile' as never },
                      ],
                      index: 2,
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        });
      }
    }

    // Close the modal
    setShowAddToBoxModal(false);
  };

  // Animate dots during API call or while waiting for animation to complete
  useEffect(() => {
    if (createCollectiveMutation.isPending || (createdCollective && !showAnimationComplete)) {
      const interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDotCount(0);
    }
  }, [createCollectiveMutation.isPending, createdCollective, showAnimationComplete]);

  const handleSearchKeyPress = () => {
    if (searchQuery.trim()) {
      setSearchTrigger((prev) => prev + 1);
    }
  };

  const isCauseSelected = (causeId: number) => {
    return selectedCauses.some(cause => cause.id === causeId);
  };

  const handleToggleCause = (cause: any) => {
    if (isCauseSelected(cause.id)) {
      setSelectedCauses(prev => prev.filter(c => c.id !== cause.id));
    } else {
      setSelectedCauses(prev => [...prev, cause]);
    }
  };

  const handleRemoveCause = (causeId: number) => {
    setSelectedCauses(prev => prev.filter(c => c.id !== causeId));
  };

  const handleColorSelect = (color: string) => {
    setLetterLogoColor(color);
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
      if (response.errorMessage) {
        showToast(response.errorMessage, 4000);
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setUploadedLogo(asset.uri);
          setUploadedLogoPreview(asset.uri);
          setLogoType('upload');
        }
      }
    });
  };

  const handleContinueToReview = () => {
    // Validation
    if (name.trim() === '') {
      showToast('Please enter a name for your CRWD', 4000);
      return;
    }
    if (description.trim() === '') {
      showToast('Please enter a description for your CRWD', 4000);
      return;
    }
    if (selectedCauses.length === 0) {
      showToast('Please select at least one cause', 4000);
      return;
    }

    // Navigate to review step
    setStep(2);
  };

  const handleCreateCollective = () => {
    // Create collective via API
    // Use FormData if there's a file upload, otherwise use JSON
    if (logoType === 'upload' && uploadedLogo) {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      // Append each cause_id separately (backend should handle this as an array)
      selectedCauses.forEach(cause => {
        formData.append('cause_ids', cause.id.toString());
      });
      formData.append('logo_file', {
        uri: uploadedLogo,
        type: 'image/jpeg',
        name: 'logo.jpg',
      } as any);
      // Do not send color when upload tab is active
      createCollectiveMutation.mutate(formData);
    } else {
      // Use JSON for letter logo or no logo
      const requestData: any = {
        name: name.trim(),
        description: description.trim(),
        cause_ids: selectedCauses.map(c => c.id),
      };

      // Add color only if logo type is letter (do not send image)
      if (logoType === 'letter' && letterLogoColor) {
        requestData.color = letterLogoColor;
      }

      createCollectiveMutation.mutate(requestData);
    }
  };

  const logoLetter = name?.charAt(0).toUpperCase() || 'C';

  // Show prompt if user is not logged in
  if (!currentUser?.id || !token?.access_token) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Start a Collective</Text>
        </View>
        <View style={styles.promptContainer}>
          <View style={styles.promptIconContainer}>
            <Users size={32} color="#A855F7" />
          </View>
          <Text style={styles.promptTitle}>Lead a Giving Community</Text>
          <Text style={styles.promptDescription}>
            Pick your causes. Name your collective. Invite your people. CRWD handles the donations, you rally the movement.
          </Text>
          <View style={styles.promptButtons}>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('OnBoard', { redirectTo: 'CreateCRWD' })}
              style={styles.promptPrimaryButton}
            >
              <Text style={styles.promptPrimaryButtonText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Login', { redirectTo: 'CreateCRWD' })}
              style={styles.promptSecondaryButton}
            >
              <Text style={styles.promptSecondaryButtonText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show "Lead a Giving Community" view as first step for logged-in users (only if hasn't started)
  if (step === 1 && !hasStarted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Start a Collective</Text>
        </View>
        <View style={styles.promptContainer}>
          <View style={styles.promptIconContainer}>
            <Users size={32} color="#A855F7" />
          </View>
          <Text style={styles.promptTitle}>Bring people together around causes</Text>
          <Text style={styles.promptDescription}>
            You choose the causes. You invite the people.{'\n\n'}Start conversations and share why you support the nonprofits you care about.{'\n\n'}No money touches your hands.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setName('');
              setDescription('');
              setSelectedCauses([]);
              setHasStarted(true);
            }}
            style={{
              backgroundColor: '#1600ff',
              padding: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
            }}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAnimating = createCollectiveMutation.isPending || (!!createdCollective && !showAnimationComplete);

  // Review/Confirmation Step
  if (step === 2) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Animation Overlay */}
        <Modal
          visible={isAnimating}
          transparent
          animationType="fade"
        >
          <View style={styles.logoAnimationContainer}>
            <CrwdAnimation size="lg" />
          </View>
        </Modal>

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm & Create</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.reviewContent}>
          <View style={styles.reviewCard}>
            {/* Collective Info Section */}
            <View style={styles.reviewCollectiveInfo}>
              <Avatar size={80} style={styles.reviewAvatar}>
                {logoType === 'upload' ? (
                  uploadedLogoPreview ? (
                    <AvatarImage src={uploadedLogoPreview} alt={name} />
                  ) : (
                    <AvatarFallback
                      style={{ backgroundColor: '#f3f4f6' }}
                      textStyle={styles.reviewAvatarFallbackText}
                    >
                      <Camera size={32} color="#9CA3AF" />
                    </AvatarFallback>
                  )
                ) : (
                  <AvatarFallback
                    style={{ backgroundColor: letterLogoColor }}
                    textStyle={styles.reviewAvatarFallbackText}
                  >
                    {logoLetter}
                  </AvatarFallback>
                )}
              </Avatar>
              <View style={styles.reviewCollectiveDetails}>
                <Text style={styles.reviewCollectiveName}>{name}</Text>
                <Text style={styles.reviewLabel}>What Brings Us Together</Text>
                <Text style={styles.reviewDescription}>{description}</Text>
              </View>
            </View>

            {/* Supported Causes Section */}
            <View style={styles.reviewCausesSection}>
              <Text style={styles.reviewLabel}>
                Supporting {selectedCauses.length} {selectedCauses.length === 1 ? 'Cause' : 'Causes'}
              </Text>
              <View style={styles.reviewCausesList}>
                {selectedCauses.map((cause) => {
                  const causeData = cause.cause || cause;
                  const categoryId = causeData.category || causeData.cause_category;
                  const categoryNames = getCategoryNames(categoryId);
                  const categoryIds = getCategoryIds(categoryId);
                  const avatarBgColor = getConsistentColor(causeData.id, avatarColors);
                  const initials = getInitials(causeData.name || 'N');

                  return (
                    <View key={cause.id} style={styles.reviewCauseCard}>
                      <View style={styles.reviewCauseContent}>
                        <Avatar size={48} style={styles.reviewCauseAvatar}>
                          <AvatarImage src={causeData.image} alt={causeData.name} />
                          <AvatarFallback
                            style={{ backgroundColor: avatarBgColor }}
                            textStyle={styles.reviewCauseAvatarFallback}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <View style={styles.reviewCauseInfo}>
                          <Text style={styles.reviewCauseName}>{causeData.name}</Text>
                          <Text style={styles.reviewCauseDescription}>
                            {truncateAtFirstPeriod(causeData.mission || causeData.description)}
                          </Text>
                          <View style={styles.reviewCauseCategoriesContainer}>
                            {categoryNames.map((name, index) => {
                              const singleCategoryId = categoryIds[index];
                              const bgColor = getCategoryColor(singleCategoryId);
                              const textColor = getCategoryTextColor(singleCategoryId);
                              return (
                                <View
                                  key={index}
                                  style={[styles.reviewCauseCategory, { backgroundColor: bgColor }]}
                                >
                                  <Text style={[styles.reviewCauseCategoryText, { color: textColor }]}>
                                    {name}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Donation Splitting Note */}
            <View style={styles.reviewNote}>
              <Text style={styles.reviewNoteText}>
                All member donations will be split evenly across these causes.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.reviewFooter}>
          <TouchableOpacity
            onPress={handleCreateCollective}
            style={[
              styles.reviewCreateButton,
              createCollectiveMutation.isPending && styles.reviewCreateButtonDisabled
            ]}
            disabled={createCollectiveMutation.isPending}
          >
            {createCollectiveMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.reviewCreateButtonText}>Create Collective</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Success Step
  if (step === 3 && createdCollective) {
    return (
      <SafeAreaView style={styles.successContainer} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.successContent}>
          <View style={styles.successCard}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIcon}>
                <Heart size={40} color="white" />
              </View>
            </View>

            {/* Heading */}
            <View style={styles.successHeading}>
              <Text style={styles.successTitle}>
                {name} is <Text style={styles.successTitleBold}>Live!</Text>
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.successDescription}>
              {allCausesAlreadyAdded ? (
                <>
                  Your collective is ready to go! All causes are already in your donation box.{'\n'}
                  Start sharing to grow your community.
                </>
              ) : (
                <>
                  Your collective is ready to go! Set up your donation box to support your causes, or start sharing to grow your community.
                </>
              )}
            </Text>

            {/* Action Buttons */}
            <View style={styles.successButtons}>
              {!allCausesAlreadyAdded && (
                <TouchableOpacity
                  onPress={handleAddToDonationBox}
                  style={styles.successPrimaryButton}
                >
                  <Heart size={20} color="white" />
                  <Text style={styles.successPrimaryButtonText}>
                    {donationBoxData && donationBoxData.id ? 'Add to Donation Box' : 'Set Up Donation Box'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => (navigation as any).navigate('GroupCRWD', { id: createdCollective.id })}
                style={styles.successSecondaryButton}
              >
                <Eye size={20} color="#111827" />
                <Text style={styles.successSecondaryButtonText}>View My Collective</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    const url = `${WEB_BASE_URL}/groupcrwd/${createdCollective.id}`;
                    await Share.share({
                      message: `Join my new CRWD: ${name} - ${url}`,
                      url: url,
                      title: `Join my new CRWD: ${name}`,
                    });
                  } catch (error) {
                    console.error('Error sharing:', error);
                  }
                }}
                style={styles.successLinkButton}
              >
                <Share2 size={20} color="#1600ff" />
                <Text style={styles.successLinkButtonText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {showConfetti && (
          <View style={styles.confettiContainer}>
            <ConfettiCannon
              ref={confettiRef}
              count={300}
              origin={{ x: -10, y: 0 }}
              fadeOut={true}
            />
          </View>
        )}

        {/* Add to Donation Box Bottom Sheet */}
        <JoinCollectiveBottomSheet
          isOpen={showAddToBoxModal}
          onClose={() => setShowAddToBoxModal(false)}
          collectiveName={name}
          nonprofits={selectedCauses.map((cause: any) => {
            const causeData = cause.cause || cause;
            return {
              id: causeData.id || cause.id,
              name: causeData.name || cause.name,
              image: causeData.image || cause.image,
              logo: causeData.logo || cause.logo,
              description: causeData.description || cause.description,
              mission: causeData.mission || cause.mission,
              cause: causeData,
            };
          })}
          collectiveId={createdCollective?.id?.toString() || ''}
          onJoin={handleAddToBoxConfirm}
          isJoining={false}
          donationBox={donationBoxData}
        />
      </SafeAreaView>
    );
  }

  // Main Form Step
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start a Collective</Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        {/* Collective Name */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Name Your Collective <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert(
                'Name Your Collective',
                'Keep it short & memorable (<40 characters)',
                [{ text: 'OK' }]
              )}
            >
              <Flag size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder='"Atlanta Climate Action"'
            placeholderTextColor="#9CA3AF"
            style={[styles.input, name.length === 0 && styles.inputItalic]}
          />
        </View>

        {/* Description */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              What Brings This Group Together? <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert(
                'Description',
                'A quick one-liner works best (<160 characters)',
                [{ text: 'OK' }]
              )}
            >
              <Flag size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={`"We're classmates giving back to Atlanta."\n"Our office team supporting local families."\n"A community of friends passionate about clean water."`}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            style={[styles.textarea, description.length === 0 && styles.inputItalic]}
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

          {/* Customization Options - Shown when Customize is clicked */}
          {showLogoCustomization && (
            <View style={styles.customizationSection}>
              {/* Logo Type Selection */}
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
                  onPress={() => {
                    setLogoType('upload');
                    handleFileChange();
                  }}
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

              {/* Letter Logo Options */}
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

            </View>
          )}
        </View>

        {/* Causes Management Section */}
        <View style={styles.causesSection}>
          {/* Selected Causes - Only show if there are selected causes */}
          {selectedCauses.length > 0 && (
            <View style={styles.selectedCausesCard}>
              <View style={styles.selectedCausesHeader}>
                <Text style={styles.selectedCausesTitle}>
                  Selected Causes ({selectedCauses.length})
                </Text>
                <View style={styles.readyBadge}>
                  <Check size={16} color="white" />
                </View>
              </View>
              <View style={styles.selectedCausesList}>
                {selectedCauses.map((cause) => {
                  const causeData = cause.cause || cause;
                  const categoryId = causeData.category || causeData.cause_category;
                  const categoryNames = getCategoryNames(categoryId);
                  const categoryIds = getCategoryIds(categoryId);
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
                            <View style={styles.selectedCauseCategoriesContainer}>
                              {categoryNames.map((name, index) => {
                                const singleCategoryId = categoryIds[index];
                                const bgColor = getCategoryColor(singleCategoryId);
                                const textColor = getCategoryTextColor(singleCategoryId);
                                return (
                                  <View
                                    key={index}
                                    style={[styles.selectedCauseCategory, { backgroundColor: bgColor }]}
                                  >
                                    <Text style={[styles.selectedCauseCategoryText, { color: textColor }]}>
                                      {name}
                                    </Text>
                                  </View>
                                );
                              })}
                            </View>
                          </View>
                          <Text style={styles.selectedCauseDescription} >
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
            </View>
          )}

          {/* Add or Remove Causes */}
          <View style={styles.addCausesCard}>
            <Text style={styles.addCausesTitle}>
              Add or Remove Causes <Text style={styles.required}>*</Text>
            </Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                placeholder="Search causes or nonprofits"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchKeyPress}
                style={styles.searchInput}
              />
            </View>

            {/* Your Causes - Only show if there are favorite causes */}
            {favoriteCauses.length > 0 && (
              <View style={styles.yourCausesSection}>
                <TouchableOpacity
                  onPress={() => setIsYourCausesOpen(!isYourCausesOpen)}
                  style={styles.causesDropdownHeader}
                >
                  <View style={styles.causesDropdownHeaderLeft}>
                    <View style={styles.causesDropdownDot} />
                    <Text style={styles.causesDropdownTitle}>
                      Your Causes ({favoriteCauses.length})
                    </Text>
                  </View>
                  {isYourCausesOpen ? (
                    <Minus size={20} color="#2563EB" />
                  ) : (
                    <Plus size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
                {isYourCausesOpen && (
                  <View style={styles.causesList}>
                    {isLoadingFavoriteCauses ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#1600ff" />
                      </View>
                    ) : (
                      favoriteCauses.map((item: any) => {
                        const cause = item.cause || item;
                        const categoryId = cause.category || cause.cause_category;
                        const categoryNames = getCategoryNames(categoryId);
                        const categoryIds = getCategoryIds(categoryId);
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
                                <View style={styles.causeCategoriesContainer}>
                                  {categoryNames.map((name, index) => {
                                    const singleCategoryId = categoryIds[index];
                                    const bgColor = getCategoryColor(singleCategoryId);
                                    const textColor = getCategoryTextColor(singleCategoryId);
                                    return (
                                      <View
                                        key={index}
                                        style={[styles.causeCategory, { backgroundColor: bgColor }]}
                                      >
                                        <Text style={[styles.causeCategoryText, { color: textColor }]}>
                                          {name}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                </View>
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
                      })
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Suggested Causes List */}
            {(() => {
              const causes = searchTrigger > 0 && searchQuery.trim()
                ? (causesData?.results || [])
                : (defaultCausesData?.results || []);

              // Get favorite cause IDs to exclude from search results
              const favoriteCauseIds = new Set(
                favoriteCauses.map((item: any) => {
                  const cause = item.cause || item;
                  return cause.id;
                })
              );

              // Filter out favorite causes and already selected causes
              const filteredCauses = causes.filter((cause: any) => {
                const causeId = cause.id;
                return causeId && !favoriteCauseIds.has(causeId) && !selectedCauses.some(selected => selected.id === causeId);
              });

              if (filteredCauses.length === 0 && !(searchTrigger > 0 && searchQuery.trim()) && defaultCausesData?.results?.length === 0) {
                return null;
              }

              return (
                <TouchableOpacity
                  onPress={() => setIsSuggestedCausesOpen(!isSuggestedCausesOpen)}
                  style={styles.causesDropdownHeader}
                >
                  <View style={styles.causesDropdownHeaderLeft}>
                    <View style={[styles.causesDropdownDot, { backgroundColor: '#A855F7' }]} />
                    <Text style={[styles.causesDropdownTitle, { color: '#9333EA' }]}>
                      Suggested Causes ({filteredCauses.length})
                    </Text>
                  </View>
                  {isSuggestedCausesOpen ? (
                    <Minus size={20} color="#9333EA" />
                  ) : (
                    <Plus size={20} color="#9333EA" />
                  )}
                </TouchableOpacity>
              );
            })()}

            {/* Causes List */}
            {isSuggestedCausesOpen && (
              <ScrollView style={styles.causesListScroll} nestedScrollEnabled>
                {(isCausesLoading || defaultCausesLoading) ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1600ff" />
                  </View>
                ) : (
                  (() => {
                    const causes = searchTrigger > 0 && searchQuery.trim()
                      ? (causesData?.results || [])
                      : (defaultCausesData?.results || []);

                    // Get favorite cause IDs to exclude from search results
                    const favoriteCauseIds = new Set(
                      favoriteCauses.map((item: any) => {
                        const cause = item.cause || item;
                        return cause.id;
                      })
                    );

                    // Filter out favorite causes and already selected causes
                    const availableCauses = causes.filter((cause: any) => {
                      const causeId = cause.id;
                      return causeId && !favoriteCauseIds.has(causeId) && !selectedCauses.some(selected => selected.id === causeId);
                    });

                    if (availableCauses.length === 0) {
                      return (
                        <Text style={styles.noCausesText}>No causes found</Text>
                      );
                    }

                    return availableCauses.map((cause: any) => {
                      const categoryId = cause.category || cause.cause_category;
                      const categoryNames = getCategoryNames(categoryId);
                      const categoryIds = getCategoryIds(categoryId);
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
                              <View style={styles.causeCategoriesContainer}>
                                {categoryNames.map((name, index) => {
                                  const singleCategoryId = categoryIds[index];
                                  const bgColor = getCategoryColor(singleCategoryId);
                                  const textColor = getCategoryTextColor(singleCategoryId);
                                  return (
                                    <View
                                      key={index}
                                      style={[styles.causeCategory, { backgroundColor: bgColor }]}
                                    >
                                      <Text style={[styles.causeCategoryText, { color: textColor }]}>
                                        {name}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
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
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {(() => {
          const isFormComplete = name.trim() !== '' && description.trim() !== '' && selectedCauses.length > 0;

          if (!isFormComplete) {
            return (
              <TouchableOpacity
                disabled
                style={styles.footerButtonDisabled}
              >
                <Text style={styles.footerButtonTextDisabled}>Complete Required Fields</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              onPress={handleContinueToReview}
              style={styles.footerButton}
            >
              <Text style={styles.footerButtonText}>Continue to Review</Text>
            </TouchableOpacity>
          );
        })()}
      </View>
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
  promptContainer: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
  },
  promptIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  promptDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 28,
    textAlign: 'center',
    // lineHeight: 24,
    fontFamily: 'Outfit-Regular',
  },
  promptButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 320,
  },
  promptPrimaryButton: {
    backgroundColor: '#1600ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  promptPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Outfit-SemiBold',
  },
  promptSecondaryButton: {
    backgroundColor: '#1600ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  promptSecondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Outfit-SemiBold',
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
  inputItalic: {
    fontStyle: 'italic',
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
    marginTop: 24,
  },
  selectedCausesCard: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#EFF6FF',
  },
  selectedCausesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedCausesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  readyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1600ff',
    justifyContent: 'center',
    alignItems: 'center',
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
  selectedCauseCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
    marginBottom: 8,
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
  yourCausesSection: {
    marginBottom: 12,
  },
  causesDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    marginBottom: 12,
  },
  causesDropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  causesDropdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  causesDropdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Outfit-SemiBold',
  },
  causesList: {
    gap: 12,
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
  causeCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noCausesText: {
    fontSize: 14,
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
  },
  footerButton: {
    backgroundColor: '#1600ff',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  footerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
  footerButtonDisabled: {
    backgroundColor: '#D1D5DB',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  footerButtonTextDisabled: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
  // Review styles
  reviewContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  reviewCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewCollectiveInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  reviewAvatar: {
    borderRadius: 12,
  },
  reviewAvatarFallbackText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Outfit-Bold',
  },
  reviewCollectiveDetails: {
    flex: 1,
    minWidth: 0,
  },
  reviewCollectiveName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1600ff',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: 'Outfit-Medium',
  },
  reviewDescription: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Outfit-Regular',
  },
  reviewCausesSection: {
    marginBottom: 16,
  },
  reviewCausesList: {
    gap: 12,
    marginTop: 12,
  },
  reviewCauseCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  reviewCauseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewCauseAvatar: {
    borderRadius: 24,
  },
  reviewCauseAvatarFallback: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Outfit-Bold',
  },
  reviewCauseInfo: {
    flex: 1,
    minWidth: 0,
  },
  reviewCauseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  reviewCauseDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Outfit-Regular',
  },
  reviewCauseCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewCauseCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  reviewCauseCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  reviewNote: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  reviewNoteText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    fontFamily: 'Outfit-Medium',
  },
  reviewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  reviewCreateButton: {
    backgroundColor: '#1600ff',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  reviewCreateButtonDisabled: {
    opacity: 0.5,
  },
  reviewCreateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  // Animation styles
  logoAnimationContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Success styles
  successContainer: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 32,
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  successHeading: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  successTitleBold: {
    fontWeight: 'bold',
  },
  successDescription: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Outfit-Regular',
  },
  successButtons: {
    gap: 12,
  },
  successPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1600ff',
    borderRadius: 8,
    paddingVertical: 12,
  },
  successPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  successSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
  },
  successSecondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  successLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  successLinkButtonText: {
    color: '#1600ff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: 'none',
  },
});
