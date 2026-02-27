import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSurpriseMe } from '../services/api/crwd';
import { addCausesToBox, getDonationBox } from '../services/api/donation';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/store';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { truncateAtFirstPeriod } from '../utils/truncateFirstPeriod';

// Get consistent color for avatar
const avatarColors = [
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#10B981', // Green
  '#EC4899', // Pink/Red
  '#F97316', // Orange
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#A855F7', // Violet
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash =
    typeof id === 'number'
      ? id
      : id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name: string) => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function SurpriseMePage() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, token } = useAuthStore();
  const [surpriseCauses, setSurpriseCauses] = useState<any[]>([]);

  // Get categories from route params
  const categories = (route.params as any)?.categories;

  // Fetch random causes using the surprise me API
  const { data: surpriseData, isLoading, refetch } = useQuery({
    queryKey: ['surprise-me', categories],
    queryFn: () => getSurpriseMe(categories),
    enabled: true,
  });

  // Fetch donation box data to check if it's set up
  const { data: donationBoxData } = useQuery({
    queryKey: ['donationBox', user?.id],
    queryFn: getDonationBox,
    enabled: !!user?.id && !!token?.access_token,
  });

  // Set causes when data is loaded
  useEffect(() => {
    if (surpriseData) {
      // Handle different response structures
      if (Array.isArray(surpriseData)) {
        setSurpriseCauses(surpriseData);
      } else if (surpriseData.data && Array.isArray(surpriseData.data)) {
        setSurpriseCauses(surpriseData.data);
      } else if (surpriseData.results && Array.isArray(surpriseData.results)) {
        setSurpriseCauses(surpriseData.results);
      }
    }
  }, [surpriseData]);

  // Add all causes to donation box mutation (only used when donation box is already set up)
  const addToBoxMutation = useMutation({
    mutationFn: async (causes: Array<{ cause_id: number }>) => {
      return await addCausesToBox({ causes });
    },
    onSuccess: () => {
      showToast('All nonprofits added to donation box!');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
    },
    onError: (error: any) => {
      showToast(
        error?.response?.data?.message || 'Failed to add nonprofits to donation box'
      );
    },
  });

  const handleSurpriseAgain = () => {
    refetch();
  };

  const handleAddAllToBox = () => {
    if (surpriseCauses.length === 0) return;

    // Check if donation box exists
    const isDonationBoxNotFound = donationBoxData?.message === 'Donation box not found';
    const hasDonationBox = donationBoxData && !isDonationBoxNotFound && donationBoxData.id;

    if (!hasDonationBox) {
      // Donation box not set up - navigate to donation box setup with preselected causes
      const causeIds = surpriseCauses.map((cause) => cause.id);
      // Navigate to bottom tab "Donate" with preselected causes
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
                          preselectedCauses: causeIds, // IDs
                          preselectedCausesData: surpriseCauses, // Full cause objects
                        },
                      },
                      { name: 'Collectives' as never },
                      { name: 'Profile' as never },
                    ],
                    index: 2, // Donate tab index
                  },
                },
              ],
            },
          },
        ],
      });
    } else {
      // Donation box is set up - check capacity before adding causes
      // Calculate fees and capacity
      const calculateFees = (grossAmount: number) => {
        const gross = grossAmount;
        let crwdFee: number;
        let net: number;

        if (gross < 10.00) {
          crwdFee = 1.00;
          net = gross - crwdFee;
        } else {
          crwdFee = gross * 0.10;
          net = gross - crwdFee;
        }

        return {
          crwdFee: Math.round(crwdFee * 100) / 100,
          net: Math.round(net * 100) / 100,
        };
      };

      const monthlyAmount = parseFloat(donationBoxData.monthly_amount || '0');
      const fees = calculateFees(monthlyAmount);
      const net = fees.net;
      const maxCapacity = Math.floor(net / 0.20);

      // Count current causes in the box
      const boxCauses = donationBoxData.box_causes || [];
      const currentCapacity = boxCauses.length;

      // Check if adding all surprise causes would exceed capacity
      const newCausesCount = surpriseCauses.length;
      const totalAfterAdding = currentCapacity + newCausesCount;

      if (totalAfterAdding > maxCapacity) {
        const availableSlots = maxCapacity - currentCapacity;
        if (availableSlots <= 0) {
          showToast(
            `Your donation box is full. You can only support up to ${maxCapacity} cause${maxCapacity !== 1 ? 's' : ''} for $${monthlyAmount} per month. Please increase your donation amount or remove some causes to add these.`,
            5000
          );
        } else {
          showToast(
            `You can only add ${availableSlots} more cause${availableSlots !== 1 ? 's' : ''} to your donation box. You're trying to add ${newCausesCount} cause${newCausesCount !== 1 ? 's' : ''}. Please increase your donation amount or remove some causes first.`,
            5000
          );
        }
        return;
      }

      // If capacity check passes, proceed with adding
      const causes = surpriseCauses.map((cause) => ({
        cause_id: cause.id,
      }));
      addToBoxMutation.mutate(causes);
    }
  };

  const handleCausePress = (causeId: number) => {
    (navigation as any).navigate('CauseScreen', { id: causeId });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSurpriseAgain}
          style={styles.surpriseAgainButton}
          activeOpacity={0.7}
        >
          {/* <Text style={styles.sparkleEmoji}>✨</Text> */}
          <Text style={styles.surpriseAgainText}>Surprise Me Again</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Sparkle Icons */}
          {/* <View style={styles.sparkleContainer}>
            <Text style={styles.sparkleEmojiLarge}>✨</Text>
            <View style={styles.sparkleGap} />
            <Text style={styles.sparkleEmojiLarge}>✨</Text>
          </View> */}

          {/* Title */}
          <Text style={styles.title}>Your Surprise Nonprofits!</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            We picked these 5 amazing organizations for you
          </Text>

          {/* Nonprofit Cards */}
          <View style={styles.cardsContainer}>
            {surpriseCauses.map((cause) => {
              const avatarBgColor = getConsistentColor(cause.id, avatarColors);
              const initials = getInitials(cause.name || 'N');

              return (
                <TouchableOpacity
                  key={cause.id}
                  onPress={() => handleCausePress(cause.id)}
                  style={styles.card}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <Avatar style={styles.avatar}>
                      <AvatarImage src={cause.image || cause.logo} />
                      <AvatarFallback
                        style={StyleSheet.flatten([styles.avatarFallback, { backgroundColor: avatarBgColor }])}
                        textStyle={styles.avatarText}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <View style={styles.cardText}>
                      <Text style={styles.causeName}>{cause.name}</Text>
                      {(cause.city || cause.state) && (
                        <Text style={styles.causeLocation}>
                          {[cause.city, cause.state].filter(Boolean).join(', ')}
                        </Text>
                      )}
                      <Text style={styles.causeDescription}>
                        {truncateAtFirstPeriod(cause.mission || cause.description || 'No description available')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Add All Button */}
        <TouchableOpacity
          onPress={handleAddAllToBox}
          disabled={addToBoxMutation.isPending || surpriseCauses.length === 0}
          style={[
            styles.addAllButton,
            (addToBoxMutation.isPending || surpriseCauses.length === 0) &&
            styles.addAllButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          {addToBoxMutation.isPending ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.addAllButtonText}>Adding...</Text>
            </View>
          ) : (
            <Text style={styles.addAllButtonText}>
              Add All {surpriseCauses.length} to Donation Box
            </Text>
          )}
        </TouchableOpacity>

        {/* Surprise Me Again */}
        <TouchableOpacity
          onPress={handleSurpriseAgain}
          style={styles.surpriseAgainFooter}
          activeOpacity={0.7}
        >
          {/* <Text style={styles.sparkleEmoji}>✨</Text> */}
          <Text style={styles.surpriseAgainFooterText}>Surprise Me Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  surpriseAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  sparkleEmoji: {
    fontSize: 16,
  },
  sparkleEmojiLarge: {
    fontSize: 24,
  },
  surpriseAgainText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9333EA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for fixed footer
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  sparkleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sparkleGap: {
    width: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  causeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  causeLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  causeDescription: {
    fontSize: 12,
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  addAllButton: {
    backgroundColor: '#1600ff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAllButtonDisabled: {
    opacity: 0.5,
  },
  buttonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  surpriseAgainFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 6,
  },
  surpriseAgainFooterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9333EA',
    marginBottom: 10,
  },
});

