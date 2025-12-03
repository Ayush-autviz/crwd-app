import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getSuggestedCrwds } from '../../services/api/crwd';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { WhiteLabelConfig } from '../../Constants/WhiteLabelConfig';

interface GroupCRWDSuggestedProps {
  collectiveId?: string;
}

const GroupCRWDSuggested: React.FC<GroupCRWDSuggestedProps> = ({ collectiveId }) => {
  const navigation = useNavigation();

  // Fetch suggested CRWDs
  const { data: suggestedData, isLoading, error } = useQuery({
    queryKey: ['suggestedCrwds', collectiveId],
    queryFn: () => getSuggestedCrwds(collectiveId || ''),
    enabled: !!collectiveId,
  });

  // Transform API data to match UI requirements
  // Handle both array and object with results property
  const suggestedCRWDs = React.useMemo(() => {
    if (!suggestedData) return [];

    const dataArray = Array.isArray(suggestedData)
      ? suggestedData
      : (suggestedData?.results || suggestedData?.data || []);

    return dataArray.map((collective: any) => ({
      id: collective.id,
      name: collective.name || 'Unknown Collective',
      members: collective.member_count || 0,
      description: collective.description || '',
      image: collective.image || collective.avatar || '',
    }));
  }, [suggestedData]);

  const handleVisit = (crwd: any) => {
    if (crwd.id) {
      (navigation as any).navigate('GroupCRWD', { collectiveId: crwd.id.toString() });
    }
  };

  if (isLoading) {
    return (
      <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 16,
          color: '#111827'
        }}>
          Suggested {WhiteLabelConfig.AppName}
        </Text>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
          <ActivityIndicator size="small" color={PrimaryBlue} />
          <Text style={{ marginTop: 8, fontSize: 14, color: PrimaryGrey }}>
            Loading suggested collectives...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !suggestedCRWDs || suggestedCRWDs.length === 0) {
    return null; // Don't show the section if there's an error or no data
  }

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#111827'
      }}>
        Suggested {WhiteLabelConfig.AppName}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {suggestedCRWDs.map((crwd) => (
            <TouchableOpacity
              key={crwd.id || crwd.name}
              onPress={() => handleVisit(crwd)}
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 16,
                padding: 16,
                minWidth: 150,
                alignItems: 'center',
                gap: 6,
                // borderWidth: 1,
                // borderColor: '#e5e7eb',
              }}
            >
              {/* Image on top */}
              <Avatar size={64}>
                <AvatarImage src={crwd.image} />
                <AvatarFallback
                  style={{ backgroundColor: '#dcfce7' }}
                  textStyle={{ color: '#16a34a', fontSize: 24, fontWeight: '600' }}
                >
                  {crwd.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Text content below image */}
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: 4,
                  textAlign: 'center'
                }}>
                  {crwd.name}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  marginBottom: 4
                }}>
                  {crwd.members} {crwd.members === 1 ? 'Member' : 'Members'}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  width: 144,
                  lineHeight: 16,
                  textAlign: 'center'
                }}>
                  {crwd.description.length > 21
                    ? `${crwd.description.slice(0, 21)}..`
                    : crwd.description}
                </Text>
              </View>

              {/* Button at the bottom */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#16a34a',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 12,
                  fontWeight: '600'
                }}>
                  Learn More
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

    </View>
  );
};

export default GroupCRWDSuggested;
