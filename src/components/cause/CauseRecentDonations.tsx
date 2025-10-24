import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PrimaryGrey, PrimaryBlue } from '../../Constants/Colors';
import { Heart } from 'lucide-react-native';

interface Donation {
  avatar: string;
  name: string;
  username: string;
}

const donations: Donation[] = [
  { avatar: 'https://randomuser.me/api/portraits/men/33.jpg', name: 'Chad F.', username: 'chad' },
  { avatar: 'https://randomuser.me/api/portraits/women/44.jpg', name: 'Mia Cares', username: 'miacares1' },
  { avatar: 'https://randomuser.me/api/portraits/men/34.jpg', name: 'Conrad M.', username: 'conradm1' },
  { avatar: 'https://randomuser.me/api/portraits/women/45.jpg', name: 'Morgan Wallace', username: 'moremorgan' },
  { avatar: 'https://randomuser.me/api/portraits/men/35.jpg', name: 'Ashton Thomas', username: 'ash_t2001' },
  { avatar: 'https://randomuser.me/api/portraits/men/36.jpg', name: 'Marc Paul', username: 'makinmymarc' },
  { avatar: 'https://randomuser.me/api/portraits/women/46.jpg', name: 'Cara Cara', username: 'carebear' },
  { avatar: 'https://randomuser.me/api/portraits/women/47.jpg', name: 'Raquel Wells', username: 'rarawells' },
];

interface CauseRecentDonationsProps {
  donations?: Donation[];
  showEmpty?: boolean;
}

const CauseRecentDonations: React.FC<CauseRecentDonationsProps> = ({ 
  donations: donationsProp = donations, 
  showEmpty = false 
}) => {
  const navigation = useNavigation();

  const handleDonorPress = (donor: Donation) => {
    navigation.navigate('Profile' as never);
  };

  const handleDonateNow = () => {
    navigation.navigate('Donation' as never);
  };

  // Show empty state if showEmpty is true or if donations array is empty
  const shouldShowEmpty = showEmpty || donationsProp.length === 0;

  const renderDonation = ({ item }: { item: Donation }) => (
    <TouchableOpacity 
      onPress={() => handleDonorPress(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      }}
    >
      <Image 
        source={{ uri: item.avatar }} 
        style={{ width: 44, height: 44, borderRadius: 22 }} 
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 14, color: PrimaryGrey }}>
          {item.username}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ 
      backgroundColor: 'white', 
      paddingVertical: 16, 
      borderTopWidth: 1, 
      borderBottomWidth: 1, 
      borderColor: '#e5e7eb' 
    }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#111827', 
        paddingHorizontal: 24, 
        marginBottom: 8 
      }}>
        Recent Donations
      </Text>
      
      {shouldShowEmpty ? (
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ 
            alignItems: 'center', 
            paddingVertical: 32 
          }}>
            <View style={{ 
              // backgroundColor: '#f3f4f6', 
              // borderRadius: 24, 
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
              marginBottom: 16
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
        <FlatList
          data={donationsProp}
          renderItem={renderDonation}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default CauseRecentDonations;
