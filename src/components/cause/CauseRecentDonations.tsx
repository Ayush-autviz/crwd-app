import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PrimaryGrey, PrimaryBlue, PrimaryGreen } from '../../Constants/Colors';
import { Heart, Sparkles } from 'lucide-react-native';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

interface RecentDonation {
  id: number;
  amount: number;
  donor: {
    id: number;
  username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  donation_type: string;
  charged_at: string;
}

interface CauseRecentDonationsProps {
  donations?: RecentDonation[];
  showEmpty?: boolean;
}

const CauseRecentDonations: React.FC<CauseRecentDonationsProps> = ({ 
  donations: donationsProp = [], 
  showEmpty = false 
}) => {
  const navigation = useNavigation();

  // Show empty state if showEmpty is true or if donations array is empty
  const shouldShowEmpty = showEmpty || !donationsProp || donationsProp.length === 0;

  // Helper function to format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDonorPress = (donorId: number) => {
    (navigation as any).navigate('UserProfile', { userId: donorId.toString() });
  };

  const handleDonateNow = () => {
    (navigation as any).navigate('DrawerNav', {
      screen: 'Donation',
      params: {
        initialTab: 'onetime'
      }
    });
  };

  return (
    <View style={{ 
      backgroundColor: 'white', 
      paddingVertical: 24
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, marginBottom: 16 }}>
        {/* <Sparkles size={20} color={PrimaryGreen} /> */}
      <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: '#111827'
      }}>
        Recent Donations
      </Text>
      </View>
      
      {shouldShowEmpty ? (
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ 
            alignItems: 'center', 
            paddingVertical: 32 
          }}>
            <View style={{ 
              padding: 12, 
              marginBottom: 16 
            }}>
              <Heart size={48} color={PrimaryGrey} />
            </View>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: 8,
              textAlign: 'center'
            }}>
              No donations yet
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#6b7280', 
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 16,
              paddingHorizontal: 16
            }}>
              Be the first to support this cause. Every donation makes a difference and helps us reach our goal.
            </Text>
            <TouchableOpacity 
              style={{
                backgroundColor: PrimaryBlue,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8
              }}
              onPress={handleDonateNow}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                Donate Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {donationsProp.map((donation) => {
            const donorName = `${donation.donor.first_name} ${donation.donor.last_name}`;
            const initials = `${donation.donor.first_name.charAt(0)}${donation.donor.last_name.charAt(0)}`;

            return (
              <TouchableOpacity 
                key={donation.id}
                onPress={() => handleDonorPress(donation.donor.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <Avatar size={48}>
                    <AvatarImage src={donation.donor.profile_picture} />
                    <AvatarFallback 
                      style={{ backgroundColor: '#dcfce7' }}
                      textStyle={{ color: '#16a34a', fontSize: 18, fontWeight: '600' }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <View style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }} numberOfLines={1}>
                      {donorName}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280' }} numberOfLines={1}>
                      @{donation.donor.username}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: PrimaryGreen, marginBottom: 4 }}>
                    {formatAmount(donation.amount)}
                  </Text>
                  <View style={{ 
                    backgroundColor: '#f3f4f6', 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 12 
                  }}>
                    <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>
                      {formatDate(donation.charged_at)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default CauseRecentDonations;
