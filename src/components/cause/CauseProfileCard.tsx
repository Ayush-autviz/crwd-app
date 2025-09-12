import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { CheckCircle, Bookmark, ShieldCheck, Heart } from 'lucide-react-native';
import { PrimaryBlue, LightGrey, PrimaryGrey } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';

interface CauseProfileCardProps {
  onLearnMoreClick?: () => void;
}

const interests = ['Animal Welfare', 'Environment', 'Food Insecurity'];

const CauseProfileCard: React.FC<CauseProfileCardProps> = ({ onLearnMoreClick }) => {
  const navigation = useNavigation();
  const [isLiked, setIsLiked] = useState(false);


  return (
    <View style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 16, marginHorizontal: 12, marginBottom: 8 }}>
      {/* Profile */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={{ width: 56, height: 56, borderRadius: 12 }} 
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
            Helping Humanity
          </Text>
          <Text style={{ fontSize: 12, color: PrimaryGrey }}>
            in 6 CRWDS · 162 donations
          </Text>
        </View>
        <TouchableOpacity 
        onPress={() => setIsLiked(!isLiked)}
        style={{ 
          borderWidth: 1, 
          borderColor: '#d1d5db', 
          paddingHorizontal: 12, 
          paddingVertical: 6, 
          borderRadius: 8 
        }}>
          <Heart size={16} color={isLiked ? 'red' : PrimaryGrey} fill={isLiked ? 'red' : 'none'} />
        </TouchableOpacity>
      </View>

      {/* Bio */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 8 }}>
          This is a bio about Non Profit and how they give back to their community so that users can learn about how their money is supporting others…
        </Text>
        <TouchableOpacity onPress={onLearnMoreClick}>
          <Text style={{ color: PrimaryBlue, fontSize: 14, fontWeight: '500' }}>
            Learn More
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interest Tags */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {interests.map((interest, index) => (
          <TouchableOpacity onPress={() => navigation.navigate('Interests' as never)} key={index} style={{ 
            backgroundColor: LightGrey, 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 20 
          }}>
            <Text style={{ fontSize: 12, color: '#374151' }}>{interest}</Text>
            </TouchableOpacity>
        ))}
      </View>

      {/* Verified Box */}
      <View style={{ 
        backgroundColor: '#eff6ff', 
        borderRadius: 12, 
        padding: 24,
        marginBottom: 16
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <CheckCircle size={16} color={PrimaryBlue} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
            Verified US Non Profit
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: '#111827', marginBottom: 2 }}>
          Tax ID Number: 10125-3129
        </Text>
        <Text style={{ fontSize: 14, color: '#111827', marginBottom: 8 }}>
          Address: 123 Main Street. USA 10010
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
          <ShieldCheck size={16} color={PrimaryGrey} />
        </View>
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          Your donation is protected by our guarantee
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: PrimaryBlue, textDecorationLine: 'underline', marginTop: 8 }}>Learn More</Text>
    </View>
  );
};

export default CauseProfileCard;
