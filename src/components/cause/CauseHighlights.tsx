import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PrimaryBlue, LightGrey, PrimaryGrey } from '../../Constants/Colors';

interface Highlight {
  avatar: string;
  name: string;
  founder: string;
  founderAvatar: string;
  bio: string;
}

const highlights: Highlight[] = [
  {
    avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
    name: "Chad's CRWD",
    founder: 'chad',
    founderAvatar: 'https://randomuser.me/api/portraits/men/33.jpg',
    bio: "This is a CRWD bio that provides a preview of the group's mission and goals. The elements are clickable.",
  },
  {
    avatar: 'https://randomuser.me/api/portraits/women/46.jpg',
    name: 'Better Together',
    founder: 'carebear',
    founderAvatar: 'https://randomuser.me/api/portraits/women/46.jpg',
    bio: "Community outreach is my love language. This is the CRWD bio. We'd love to have you",
  },
  {
    avatar: 'https://randomuser.me/api/portraits/men/34.jpg',
    name: "Chad's CRWD",
    founder: 'chad',
    founderAvatar: 'https://randomuser.me/api/portraits/men/33.jpg',
    bio: "This is a CRWD bio that provides a preview of the group's mission and goals. The elements are clickable.",
  },
  {
    avatar: 'https://randomuser.me/api/portraits/women/47.jpg',
    name: 'Better Together',
    founder: 'carebear',
    founderAvatar: 'https://randomuser.me/api/portraits/women/46.jpg',
    bio: "Community outreach is my love language. This is the CRWD bio. We'd love to have you",
  },
];

// Group highlights into pairs for two-column layout
const highlightPairs = [] as Highlight[][];
for (let i = 0; i < highlights.length; i += 2) {
  highlightPairs.push(highlights.slice(i, i + 2));
}

const CauseHighlights: React.FC = () => {
  const navigation = useNavigation();

  const handleHighlightPress = (highlight: Highlight) => {
    navigation.navigate('GroupCRWD' as never);
  };

  const handleCreateCRWD = () => {
    navigation.navigate('CreateCRWD' as never);
  };

  const renderHighlightCard = (highlight: Highlight, index: number) => (
    <TouchableOpacity
      key={index}
      onPress={() => handleHighlightPress(highlight)}
      style={{
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
        <Image 
          source={{ uri: highlight.avatar }} 
          style={{ width: 44, height: 44, borderRadius: 12 }} 
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
            {highlight.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 14, color: PrimaryGrey }}>Founded by</Text>
            <Image 
              source={{ uri: highlight.founderAvatar }} 
              style={{ width: 16, height: 16, borderRadius: 8 }} 
            />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
              @{highlight.founder}
            </Text>
          </View>
        </View>
      </View>
      <Text style={{ fontSize: 16, color: '#374151', lineHeight: 22 }}>
        {highlight.bio}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
          Community Highlights{' '}
          <Text style={{ fontWeight: '400', color: PrimaryGrey }}>• In 6 CRWDS</Text>
        </Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {highlightPairs.map((pair, pairIndex) => (
          <View key={pairIndex} style={{ width: 320, marginRight: 16 }}>
            {pair.map((highlight, index) => renderHighlightCard(highlight, index))}
          </View>
        ))}
      </ScrollView>
      
      <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
        <TouchableOpacity onPress={handleCreateCRWD}>
          <Text style={{ color: PrimaryBlue, fontSize: 14, fontWeight: '500' }}>
            Create a CRWD
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CauseHighlights;
