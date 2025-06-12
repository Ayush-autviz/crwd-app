import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { MoreHorizontal, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { PrimaryGrey } from '../../Constants/Colors';

const updates = [
  {
    id: 1,
    user: 'Chad',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    time: '17h',
    text: 'The quick, brown fox jumps over a lazy dog. DJs flock by when MTV ax quiz prog. Junk MTV quiz graced by fox whelps. Bawds jog, flick quartz, vex nymphs. Waltz, bad nymph, for quick jigs vex!',
    image: null,
    likes: 2,
    comments: 0,
    shares: 3,
  },
  {
    id: 2,
    user: 'Chad',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    time: '17h',
    text: 'The quick, brown fox jumps over a lazy dog. DJs flock by when MTV ax quiz prog. Junk',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    likes: 2,
    comments: 0,
    shares: 3,
  },
];

const GroupCRWDUpdates: React.FC = () => {
  const renderUpdate = ({ item }: { item: any }) => (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
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
        marginBottom: 12
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image 
            source={{ uri: item.avatar }} 
            style={{ width: 28, height: 28, borderRadius: 14 }} 
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
            @{item.user}
          </Text>
          <Text style={{ fontSize: 12, color: PrimaryGrey }}>
            • {item.time}
          </Text>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={18} color={PrimaryGrey} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={{ 
        fontSize: 14, 
        color: '#374151', 
        lineHeight: 20,
        marginBottom: item.image ? 12 : 16
      }}>
        {item.text}
      </Text>

      {/* Image */}
      {item.image && (
        <Image 
          source={{ uri: item.image }} 
          style={{ 
            width: '100%', 
            height: 200, 
            borderRadius: 8,
            marginBottom: 16
          }} 
          resizeMode="cover"
        />
      )}

      {/* Actions */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 24 
      }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Heart size={16} color={PrimaryGrey} />
          <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MessageCircle size={16} color={PrimaryGrey} />
          <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Share2 size={16} color={PrimaryGrey} />
          <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.shares}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
      <FlatList
        data={updates}
        renderItem={renderUpdate}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default GroupCRWDUpdates;
