import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { CheckCircle, Upload, Bookmark, Award, ShieldCheck } from 'lucide-react-native';
import { PrimaryBlue, LightGrey, PrimaryGrey } from '../../Constants/Colors';

interface CauseProfileCardProps {
  onLearnMoreClick?: () => void;
}

const interests = ['Animal Welfare', 'Environment', 'Food Insecurity'];

const CauseProfileCard: React.FC<CauseProfileCardProps> = ({ onLearnMoreClick }) => {
  return (
    <View style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 16, marginHorizontal: 12, marginBottom: 8 }}>
      {/* CRWD Verified and Action Buttons */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Award size={20} color={PrimaryBlue} />
        <Text style={{ fontSize: 12, color: PrimaryGrey }}>CRWD Verified</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ 
          backgroundColor: LightGrey, 
          padding: 8, 
          borderRadius: 8 
        }}>
          <Upload size={16} color={PrimaryGrey} />
        </TouchableOpacity>
        <TouchableOpacity style={{ 
          backgroundColor: LightGrey, 
          padding: 8, 
          borderRadius: 8 
        }}>
          <Bookmark size={16} color={PrimaryGrey} />
        </TouchableOpacity>
        <TouchableOpacity style={{ 
          borderWidth: 1, 
          borderColor: PrimaryBlue, 
          paddingHorizontal: 16, 
          paddingVertical: 8, 
          borderRadius: 8 
        }}>
          <Text style={{ color: PrimaryBlue, fontSize: 12, fontWeight: '600' }}>Follow</Text>
        </TouchableOpacity>
      </View>

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
          <View key={index} style={{ 
            backgroundColor: LightGrey, 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 20 
          }}>
            <Text style={{ fontSize: 12, color: '#374151' }}>{interest}</Text>
          </View>
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
            Verified US Non Profit
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 2 }}>
          Tax ID Number: 10125-3129
        </Text>
        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
          Address: 123 Main Street. USA 10010
        </Text>
      </View>

      {/* Guarantee Note */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ 
          backgroundColor: '#d1d5db', 
          borderRadius: 12, 
          padding: 4 
        }}>
          <ShieldCheck size={16} color="#374151" />
        </View>
        <Text style={{ fontSize: 12, color: '#374151', flex: 1 }}>
          Your donation is protected and guaranteed.{' '}
          <Text style={{ color: PrimaryBlue, textDecorationLine: 'underline' }}>
            Learn More
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default CauseProfileCard;
