import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MoreHorizontal, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { PrimaryGrey } from '../../Constants/Colors';

const GroupCRWDEvent: React.FC = () => {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 }}>
      <View style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
              style={{ width: 28, height: 28, borderRadius: 14 }} 
            />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
              @Chad
            </Text>
            <Text style={{ fontSize: 12, color: PrimaryGrey }}>
              • 17h
            </Text>
          </View>
          <TouchableOpacity>
            <MoreHorizontal size={18} color={PrimaryGrey} />
          </TouchableOpacity>
        </View>

        {/* Event Title */}
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: 12
        }}>
          Grocery Spot Cleanup
        </Text>

        {/* Event Details */}
        <View style={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          gap: 16,
          marginBottom: 8
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#374151' }}>
              <Text style={{ fontWeight: '600' }}>Date</Text> 3/8/2025
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#374151' }}>
              <Text style={{ fontWeight: '600' }}>Time</Text> 7:00 am
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#374151' }}>
              <Text style={{ fontWeight: '600' }}>RSVP</Text> 8
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#374151' }}>
              <Text style={{ fontWeight: '600' }}>Maybe</Text> 17
            </Text>
          </View>
        </View>

        {/* Location */}
        <Text style={{ 
          fontSize: 12, 
          color: '#374151',
          marginBottom: 12
        }}>
          <Text style={{ fontWeight: '600' }}>Place</Text> 123 Main St. Somewhere, USA
        </Text>

        {/* Description */}
        <Text style={{ 
          fontSize: 14, 
          color: '#374151',
          marginBottom: 16,
          lineHeight: 20
        }}>
          Join us this saturday! We'll carpool
        </Text>

        {/* Actions */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 24,
          paddingTop: 4
        }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Heart size={16} color={PrimaryGrey} />
            <Text style={{ fontSize: 12, color: PrimaryGrey }}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MessageCircle size={16} color={PrimaryGrey} />
            <Text style={{ fontSize: 12, color: PrimaryGrey }}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Share2 size={16} color={PrimaryGrey} />
            <Text style={{ fontSize: 12, color: PrimaryGrey }}>3</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default GroupCRWDEvent;
