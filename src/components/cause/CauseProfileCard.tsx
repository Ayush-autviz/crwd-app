import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Bookmark, Heart, Check } from 'lucide-react-native';
import { PrimaryBlue, LightGrey, PrimaryGrey } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoriteCause, unfavoriteCause } from '../../services/api/social';
import { useToast } from '../../contexts/ToastContext';
import { categories } from '../../Constants/categories';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

interface CauseProfileCardProps {
  onLearnMoreClick?: () => void;
  causeData?: any;
}

const CauseProfileCard: React.FC<CauseProfileCardProps> = ({ onLearnMoreClick, causeData }) => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isFavorited, setIsFavorited] = useState(causeData?.is_favorite || false);

  // Favorite cause mutation
  const favoriteMutation = useMutation({
    mutationFn: (causeId: string) => favoriteCause(causeId),
    onSuccess: () => {
      setIsFavorited(true);
      showToast('Added to favorites', 3000);
      // Invalidate favorite causes query to refresh the saved page
      queryClient.invalidateQueries({ queryKey: ['favoriteCauses'] });
    },
    onError: (error) => {
      console.error('Error favoriting cause:', error);
      showToast('Failed to add to favorites', 3000);
    },
  });

  // Unfavorite cause mutation
  const unfavoriteMutation = useMutation({
    mutationFn: (causeId: string) => unfavoriteCause(causeId),
    onSuccess: () => {
      setIsFavorited(false);
      showToast('Removed from favorites', 3000);
      // Invalidate favorite causes query to refresh the saved page
      queryClient.invalidateQueries({ queryKey: ['favoriteCauses'] });
    },
    onError: (error) => {
      console.error('Error unfavoriting cause:', error);
      showToast('Failed to remove from favorites', 3000);
    },
  });

  const handleFavoriteClick = () => {
    if (isFavorited) {
      unfavoriteMutation.mutate(causeData?.id?.toString());
    } else {
      favoriteMutation.mutate(causeData?.id?.toString());
    }
  };

  // Update favorite state when causeData changes
  useEffect(() => {
    setIsFavorited(causeData?.is_favorite || false);
  }, [causeData?.is_favorite]);

  // Find the category based on causeData.category
  const category = categories.find((cat) => cat.id === causeData?.category);


  return (
    <View style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 16, marginHorizontal: 12, marginBottom: 8 }}>
      {/* Profile */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {/* <Image 
          source={{ uri: causeData?.logo || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={{ width: 56, height: 56, borderRadius: 12 }} 
        /> */}
        <Avatar style={{borderWidth: 1, borderColor: '#e5e7eb'}} size={48}>
          <AvatarImage src={causeData?.image} />
          <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
            {causeData?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
            {causeData?.name || 'Helping Humanity'}
          </Text>
          <Text style={{ fontSize: 12, color: PrimaryGrey }}>
            in {causeData?.collective_count} Collectives · {causeData?.donation_count} donations
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleFavoriteClick}
          disabled={favoriteMutation.isPending || unfavoriteMutation.isPending}
         >
          {favoriteMutation.isPending || unfavoriteMutation.isPending ? (
            <ActivityIndicator size="small" color={PrimaryBlue} />
          ) : (
            <Heart 
              size={16} 
               color={isFavorited ? 'red' : PrimaryGrey} 
              fill={isFavorited ? 'red' : 'none'} 
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Bio */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 8 }}>
          {causeData?.mission || 'This is a bio about Non Profit and how they give back to their community so that users can learn about how their money is supporting others…'}
        </Text>
        <TouchableOpacity onPress={onLearnMoreClick}>
          <Text style={{ color: PrimaryBlue, fontSize: 14, fontWeight: '500' }}>
            Learn More
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interest Tags */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {category && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Interests' as never)} 
            style={{ 
              backgroundColor: category.background, 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 8
            }}
          >
            <Text style={{ fontSize: 12, color: category.text }}>{category.name}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Verified Box */}
      <View style={{ 
        backgroundColor: '#eff6ff', 
        borderRadius: 12, 
        padding: 24,
        marginBottom: 16
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Check size={16} color={PrimaryBlue} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
            Verified US Non Profit
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: '#111827', marginBottom: 2 }}>
          Tax ID Number: {causeData?.tax_id_number || '10125-3129'}
        </Text>
        <Text style={{ fontSize: 14, color: '#111827', marginBottom: 8 }}>
          Address: {causeData?.street || '123 Main Street'}, {causeData?.city || 'USA'}, {causeData?.state || '10010'}
        </Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 14, color: PrimaryBlue, textDecorationLine: 'underline' }}>
            Claim this non-profit?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Guarantee Note */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ 
          backgroundColor: '#d1d5db', 
          borderRadius: 12, 
          padding: 4 
        }}>
          <Check size={16} color={PrimaryGrey} />
        </View>
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          Your donation is protected by our guarantee
        </Text>
      </View>
      {/* <Text style={{ fontSize: 14, color: PrimaryBlue, textDecorationLine: 'underline', marginTop: 8 }}>Learn More</Text> */}
    </View>
  );
};

export default CauseProfileCard;
