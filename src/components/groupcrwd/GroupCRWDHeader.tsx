import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Bookmark, Heart } from 'lucide-react-native';
import { PrimaryBlue, LightGrey, PrimaryGrey, SecondaryGreen, PrimaryGreen } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';
// import { Link } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoriteCollective, unfavoriteCollective } from '../../services/api/social';
import { useToast } from '../../contexts/ToastContext';
import { categories } from '../../Constants/categories';

// const orgAvatars = [
//   {
//     name: "ASPCA",
//     image: require('../../assets/images/grocery.jpg'),
//   },
//   {
//     name: "CRI",
//     image: require('../../assets/images/redcross.png'),
//   },
//   {
//     name: "CureSearch",
//     image: require('../../assets/images/grocery.jpg'),
//   },
//   {
//     name: "Paws",
//     image: require('../../assets/images/redcross.png'),
//   },
// ];

// const interests = ['Animal Welfare', 'Environment', 'Food Insecurity'];

// const interests = [
//   {
//     name: "Animals",
//     text: "#E36414", // Orange-Red
//     background: "#FFE1CC", // Soft warm orange tint
//   },
//   {
//     name: "Environment",
//     text: "#6A994E", // Olive Green
//     background: "#DFF0D6", // Fresh leafy green tint
//   },
//   {
//     name: "Food",
//     text: "#FF9F1C", // Carrot Orange
//     background: "#FFE6CC", // Gentle light orange tint
//   },
// ];

interface GroupCRWDHeaderProps {
  hasJoined?: boolean;
  onJoin?: () => void;
  id?: string;
  crwdData?: any;
}

const GroupCRWDHeader: React.FC<GroupCRWDHeaderProps> = ({
  hasJoined = false,
  onJoin,
  id = "",
  crwdData,
}) => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [localCategories, setLocalCategories] = useState<any[]>([]);

  // Favorite/Unfavorite mutations
  const favoriteMutation = useMutation({
    mutationFn: favoriteCollective,
    onSuccess: () => {
      console.log('Favorite successful');
      setIsLiked(true);
      showToast('Added to favorites', 3000);
      queryClient.invalidateQueries({ queryKey: ['collective', id] });
    },
    onError: (error: any) => {
      console.error('Favorite error:', error);
      showToast('Failed to add to favorites', 3000);
    },
  });

  const unfavoriteMutation = useMutation({
    mutationFn: unfavoriteCollective,
    onSuccess: () => {
      console.log('Unfavorite successful');
      setIsLiked(false);
      showToast('Removed from favorites', 3000);
      queryClient.invalidateQueries({ queryKey: ['collective', id] });
    },
    onError: (error: any) => {
      console.error('Unfavorite error:', error);
      showToast('Failed to remove from favorites', 3000);
    },
  });

  // Update isLiked state when crwdData changes
  useEffect(() => {
    if (crwdData?.is_favorite !== undefined) {
      setIsLiked(crwdData.is_favorite);
    }
  }, [crwdData?.is_favorite]);

  // Process categories from API data
  useEffect(() => {
    if (crwdData?.causes) {
      const uniqueCategories = crwdData.causes
        .map((cause: any) => cause.cause?.category)
        .filter((category: any) => category)
        .filter((value: any, index: number, self: any[]) => self.indexOf(value) === index);
      setLocalCategories(uniqueCategories);
    }
  }, [crwdData?.causes]);

  const handleLikePress = () => {
    if (isLiked) {
      unfavoriteMutation.mutate(id);
    } else {
      favoriteMutation.mutate(id);
    }
  };

  const handleStatsPress = (type: string) => {
    if (type === 'causes') {
      navigation.navigate('Members' as never, { tab: 'Causes', collectiveData: crwdData });
    } else if (type === 'members') {
      navigation.navigate('Members' as never, { tab: 'Members', collectiveData: crwdData });
    } else if (type === 'donations') {
      navigation.navigate('Members' as never, { tab: 'Collective Donations', collectiveData: crwdData });
    }
  };

  const handleOrgPress = () => {
    navigation.navigate('CauseScreen' as never);
  };

  const handleSeeAllPress = () => {
    navigation.navigate('Members' as never, { collectiveData: crwdData });
  };

  return (
    <View style={{ backgroundColor: 'white', padding: 8, margin: 8, borderRadius: 12 }}>
      {/* Top Row - Group Title */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '600', color: '#374151', marginTop: 8 }}>
              {crwdData?.name || 'Feed the hungry'}
            </Text>
          </View>
        </View>
      </View>

      {/* Founder */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        <Image 
          source={{ uri: crwdData?.created_by?.profile_picture || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={{ width: 56, height: 56, borderRadius: 28 }} 
        />
        <Text style={{ fontSize: 14, color: '#6b7280' }}>Founded by</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
          @{crwdData?.created_by?.username || 'ChadFofana1'}
        </Text>
        <TouchableOpacity 
          onPress={handleLikePress}
          disabled={favoriteMutation.isPending || unfavoriteMutation.isPending}
          style={{ 
            borderWidth: 1, 
            borderColor: LightGrey, 
            padding: 8, 
            borderRadius: 6,
            backgroundColor: 'white'
          }}>
          <Heart 
            size={20} 
            color={isLiked ? 'red' : PrimaryGrey} 
            fill={isLiked ? 'red' : 'none'} 
          />
        </TouchableOpacity>
      </View>

      {/* Bio */}
      <Text style={{ fontSize: 20, color: '#374151', marginBottom: 16, lineHeight: 28, textAlign: 'center' }}>
        {crwdData?.description }
      </Text>

      {/* Stats */}
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: '#f9fafb', 
        borderRadius: 12, 
        paddingVertical: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
      }}>
        <TouchableOpacity 
          onPress={() => handleStatsPress('causes')}
          style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
            {crwdData?.causes?.length || 10}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', width: '70%' }}>Causes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleStatsPress('members')}
          style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
            {crwdData?.member_count || 58}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>Members</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleStatsPress('donations')}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
            {crwdData?.total_donation_count}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', width: '70%' }}>Contributions</Text>
        </TouchableOpacity>
      </View>

           {/* Interest Tags */}
           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {localCategories.length > 0 && localCategories.map((category, index) => {
          const interest = categories.find(i => i.id === category) 
          return (
            <TouchableOpacity onPress={() => navigation.navigate('Interests' as never)} key={index} style={{ 
              backgroundColor: interest?.background, 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 8
            }}>
              <Text style={{ fontSize: 12, color: interest?.text }}>{interest?.name}</Text>
            </TouchableOpacity>
          );
        }) 
        // : interests.map((interest, index) => (
        //   <TouchableOpacity onPress={() => navigation.navigate('Interests' as never)} key={index} style={{ 
        //     backgroundColor: interest.background, 
        //     paddingHorizontal: 12, 
        //     paddingVertical: 6, 
        //     borderRadius: 8
        //   }}>
        //     <Text style={{ fontSize: 12, color: interest.text }}>{interest.name}</Text>
        //     </TouchableOpacity>
        // ))
        }
      </View>

      {/* Recently Supported Nonprofits */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151'}}>
        Recently Supported Nonprofits
      </Text>
      {/* <Text 
          style={{ color: PrimaryBlue, textDecorationLine: 'underline' }}
          onPress={handleSeeAllPress}
        >
          See All
        </Text> */}
      </View>
      <Text style={{fontSize: 12, fontStyle: 'italic', color: 'grey', marginBottom: 12}}>Your donations here are split evenly across these nonprofits</Text>

      {/* Organization Avatars */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {crwdData?.causes?.length > 0 && crwdData.causes.slice(0, 4).map((cause: any, index: number) => (
          <TouchableOpacity key={index} onPress={handleOrgPress} style={{ alignItems: 'center', marginRight: 20 }}>
            <Image 
              source={{ uri: cause.cause?.image || 'https://via.placeholder.com/48' }} 
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 8,
                marginBottom: 4
              }} 
            />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280' }}>
              {cause.cause?.name || 'Unknown'}
            </Text>
          </TouchableOpacity>
        )) 
        // : orgAvatars.map((org, index) => (
        //   <TouchableOpacity key={index} onPress={handleOrgPress} style={{ alignItems: 'center', marginRight: 20 }}>
        //     <Image 
        //       source={org.image} 
        //       style={{ 
        //         width: 48, 
        //         height: 48, 
        //         borderRadius: 8,
        //         marginBottom: 4
        //       }} 
        //     />
        //     <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280' }}>
        //       {org.name}
        //     </Text>
        //   </TouchableOpacity>
        // ))
        }
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 }}>
        {/* <Link size={16} /> */}
      <Text 
          style={{ color: PrimaryBlue, textDecorationLine: 'underline' }}
          onPress={handleSeeAllPress}
        >
          See All
        </Text>
      </View>

      {/* Supporting Text */}
      {/* <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 16 }}>
        Currently supporting{' '}
        <Text style={{ fontWeight: '600' }}>10 Non Profits</Text>: Grocery Spot, Food for Thought, Meals on Wheels, American Red Cross, & Pizza Hut…{' '}
        <Text 
          style={{ color: PrimaryBlue, textDecorationLine: 'underline' }}
          onPress={handleSeeAllPress}
        >
          See All
        </Text>
      </Text> */}
    </View>
  );
};

export default GroupCRWDHeader;
