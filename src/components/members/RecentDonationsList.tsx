import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Heart, Calendar } from 'lucide-react-native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { PrimaryBlue, PrimaryGrey, LightGrey } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';

interface RecentDonationsListProps {
  onBack?: () => void;
  donationHistory?: any[];
  isLoading?: boolean;
}

interface DonationItem {
  id: number;
  donor: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  donation_type: string;
  gross_amount: string;
  charged_at: string;
  causes?: Array<{
    id: number;
    name: string;
    amount: number;
  }>;
}

const RecentDonationsList: React.FC<RecentDonationsListProps> = ({ 
  donationHistory, 
  isLoading = false 
}) => {
  const navigation = useNavigation();

  // Format date helper function
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format as "Month Day" (e.g., "May 7th", "April 1st")
      const options: Intl.DateTimeFormatOptions = { 
        month: 'long', 
        day: 'numeric' 
      };
      const formatted = date.toLocaleDateString('en-US', options);
      const day = date.getDate();
      const suffix = day % 10 === 1 && day % 100 !== 11 ? 'st' :
                     day % 10 === 2 && day % 100 !== 12 ? 'nd' :
                     day % 10 === 3 && day % 100 !== 13 ? 'rd' : 'th';
      return formatted.replace(/\d+/, `${day}${suffix}`);
    } catch {
      return dateString;
    }
  };

  // Format time helper function
  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
      
      return `${displayHours}:${displayMinutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  // Transform donation history data
  const donations: DonationItem[] = useMemo(() => {
    if (!donationHistory || !Array.isArray(donationHistory)) return [];
    return donationHistory;
  }, [donationHistory]);

  const handleDonorPress = (donorId: number) => {
    (navigation as any).navigate('UserProfile', { userId: donorId.toString() });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <Text style={styles.loadingText}>Loading donations...</Text>
        </View>
      </View>
    );
  }

  if (!donations || donations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Heart size={32} color={PrimaryGrey} />
          </View>
          <Text style={styles.emptyTitle}>No donations found</Text>
          <Text style={styles.emptyText}>When members make donations, they'll appear here.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.listContainer}>
        {donations.map((donation) => {
          const donorName = `${donation.donor.first_name} ${donation.donor.last_name}`.trim() || donation.donor.username;
          const formattedDate = formatDate(donation.charged_at);
          const formattedTime = formatTime(donation.charged_at);
          const formattedAmount = `$${parseFloat(donation.gross_amount || '0').toFixed(2)}`;
          const isRecurring = donation.donation_type === 'recurring';
          
          return (
            <View key={donation.id} style={styles.donationCard}>
              <View style={styles.donationContent}>
                {/* Donor Avatar */}
                <TouchableOpacity 
                  onPress={() => handleDonorPress(donation.donor.id)}
                  style={styles.avatarContainer}
                >
                  <Avatar size={56}>
                    <AvatarImage src={donation.donor.profile_picture} />
                    <AvatarFallback>
                      {donorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TouchableOpacity>

                {/* Donation Details */}
                <View style={styles.detailsContainer}>
                  {/* Top Row: Donor Name and Amount */}
                  <View style={styles.topRow}>
                    <TouchableOpacity 
                      onPress={() => handleDonorPress(donation.donor.id)}
                      style={styles.donorInfo}
                    >
                      <Text style={styles.donorName}>{donorName}</Text>
                      <View style={styles.usernameBadge}>
                        <Text style={styles.usernameText}>@{donation.donor.username}</Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Amount */}
                    <Text style={styles.amount}>{formattedAmount}</Text>
                  </View>
                  
                  {/* Date and Type Row */}
                  <View style={styles.dateRow}>
                    <Calendar size={14} color={PrimaryGrey} />
                    <Text style={styles.dateText}>{formattedDate}</Text>
                    {formattedTime && (
                      <>
                        <Text style={styles.dateText}> • </Text>
                        <Text style={styles.dateText}>{formattedTime}</Text>
                      </>
                    )}
                  </View>
                  
                  {/* Donation Type Badge */}
                  <View style={styles.typeBadge}>
                    <View style={[styles.typeDot, isRecurring && styles.recurringDot]} />
                    <Text style={styles.typeText}>
                      {isRecurring ? 'Donation Box' : 'One-time donation'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  donationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  donationContent: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarContainer: {
    flexShrink: 0,
  },
  detailsContainer: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  donorInfo: {
    flex: 1,
    minWidth: 0,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  usernameBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  usernameText: {
    fontSize: 12,
    color: '#6b7280',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
    flexShrink: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: PrimaryGrey,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
  },
  recurringDot: {
    backgroundColor: '#3b82f6',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e40af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: PrimaryGrey,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default RecentDonationsList;

