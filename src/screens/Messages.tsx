import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import { ChevronLeft, RefreshCw, Search } from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/store';
import { PrimaryBlue } from '../Constants/Colors';
import {
  getConversations,
  searchConversations,
  getOrCreateConversation,
  getMessages,
  sendChatMessage,
  ConversationResponse,
  MessageResponse,
} from '../services/api/chat';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { ChatView } from '../components/messages/ChatView';
import { ChatMessage } from '../components/messages/types';
import { useChatSocket } from '../hooks/useChatSocket';
import { Skeleton } from '../components/ui/Skeleton';

interface ConversationItem {
  id: string;
  participantId?: string;
  user: {
    name: string;
    avatar: string;
    color: string;
  };
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export default function Messages() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Extract targeted paths or direct IDs if deep linked
  const params: any = route.params || {};
  const [selectedId, setSelectedId] = useState<string | null>(
    params.userId || params.conversationId || null
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Sync state if parameters change dynamically or resolve userId to explicit conversation ID
  useEffect(() => {
    const resolveTarget = async () => {
      if (params.conversationId) {
        setSelectedId(params.conversationId);
      } else if (params.userId) {
        try {
          const res = await getOrCreateConversation(params.userId);
          if (res?.id) {
            setSelectedId(res.id.toString());
          } else {
            setSelectedId(params.userId);
          }
        } catch (e) {
          console.error('Failed to resolve conversation for userId:', e);
          setSelectedId(params.userId);
        }
      }
    };
    resolveTarget();
  }, [params.userId, params.conversationId]);

  // 1. Fetch Conversation list layer
  const { data: conversationData, isLoading: isConversationsLoading, refetch } = useQuery({
    queryKey: ['conversations', searchQuery],
    queryFn: () => (searchQuery.trim() ? searchConversations(searchQuery.trim()) : getConversations()),
    staleTime: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Map API response to rich display format
  const conversations: ConversationItem[] = useMemo(() => {
    const results = conversationData?.results || [];
    return results.map((conv: ConversationResponse) => {
      const otherUser = conv.participants?.find(p => p.id !== user?.id) || conv.participants?.[0];

      let lastMsgText = conv.last_message?.content || '';
      const entityType = conv.last_message?.entity_type;

      if (entityType === 'image') {
        lastMsgText = 'Sent an image';
      } else if (entityType === 'video') {
        lastMsgText = 'Sent a video';
      } else if (entityType === 'post') {
        lastMsgText = 'Shared a post';
      } else if (entityType === 'cause') {
        lastMsgText = 'Shared a cause';
      } else if (entityType === 'collective') {
        lastMsgText = 'Shared a collective';
      } else if (entityType === 'profile') {
        lastMsgText = 'Shared a profile';
      } else if (entityType === 'fundraiser') {
        lastMsgText = 'Shared a fundraiser';
      } else if (lastMsgText.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
        lastMsgText = 'Sent an image';
      } else if (lastMsgText.match(/\.(mp4|mov|webm)($|\?)/i)) {
        lastMsgText = 'Sent a video';
      } else if (lastMsgText.startsWith('http://') || lastMsgText.startsWith('https://')) {
        lastMsgText = 'Sent a link';
      }

      const randomFallbackColor = '#' + Math.floor(Math.random() * 16777215).toString(16);

      return {
        id: conv.id?.toString(),
        participantId: otherUser?.id?.toString(),
        user: {
          name: otherUser?.full_name || 'User',
          avatar: otherUser?.profile_picture || '',
          color: otherUser?.color || randomFallbackColor,
        },
        lastMessage: lastMsgText,
        timestamp: conv.last_message?.created_at
          ? new Date(conv.last_message.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })
          : '',
        unread: conv.unread_count > 0,
      };
    });
  }, [conversationData?.results, user?.id]);

  // Look up selected conversation entity metadata
  const currentConversation = conversations.find(
    c => c.id === selectedId || c.participantId === selectedId
  );

  // 2. Fetch specific Message History pages via TanStack Infinite Queries
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['messages', selectedId],
    queryFn: ({ pageParam = 1 }) => getMessages(selectedId!, pageParam),
    enabled: !!selectedId,
    staleTime: 0,
    gcTime: 0,
    getNextPageParam: lastPage => {
      if (lastPage?.next) {
        const match = lastPage.next.match(/[?&]page=(\d+)/);
        return match ? parseInt(match[1], 10) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // Flatten messages arrays ordered newest-first matching API descending sorts
  const allMessages = useMemo(() => {
    if (!historyData?.pages) return [];
    return historyData.pages.flatMap(page => page.results || []);
  }, [historyData?.pages]);

  // Synchronize component messages cache array
  useEffect(() => {
    if (historyData?.pages && selectedId) {
      const mappedMessages: ChatMessage[] = allMessages
        .filter((msg: any) => msg && msg.id != null)
        .map((msg: MessageResponse) => ({
          id: msg.id.toString(),
          senderId: msg.sender?.id === user?.id ? 'me' : 'other',
          text: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          date: new Date(msg.created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          }),
          type:
            msg.entity_type === 'post' ||
            msg.entity_type === 'cause' ||
            msg.entity_type === 'collective' ||
            msg.entity_type === 'profile' ||
            msg.entity_type === 'fundraiser'
              ? 'card'
              : msg.entity_type === 'video'
              ? 'video'
              : msg.entity_type === 'image'
              ? 'image'
              : 'text',
          mediaUrl:
            msg.entity_type === 'image' || msg.entity_type === 'video'
              ? msg.entity_data?.url || msg.content
              : undefined,
          cardData:
            msg.entity_type === 'post' ||
            msg.entity_type === 'cause' ||
            msg.entity_type === 'collective' ||
            msg.entity_type === 'profile' ||
            msg.entity_type === 'fundraiser'
              ? {
                  type: msg.entity_type,
                  id: msg.entity_id || msg.entity_data?.id,
                  title:
                    msg.entity_type === 'profile'
                      ? msg.entity_data?.full_name ||
                        `${msg.entity_data?.first_name || ''} ${msg.entity_data?.last_name || ''}`.trim() ||
                        msg.entity_data?.username ||
                        'Shared Profile'
                      : msg.entity_type === 'post'
                      ? msg.entity_data?.user?.full_name || msg.entity_data?.user?.username || 'Shared Post'
                      : msg.entity_type === 'fundraiser'
                      ? msg.entity_data?.name || 'Shared Fundraiser'
                      : msg.entity_data?.collective?.name ||
                        msg.entity_data?.fundraiser?.name ||
                        msg.entity_data?.name ||
                        (msg.entity_type === 'cause'
                          ? 'Shared Nonprofit'
                          : msg.entity_type === 'collective'
                          ? 'Shared Group'
                          : 'Shared Post'),
                  description:
                    msg.entity_type === 'profile'
                      ? msg.entity_data?.bio || ''
                      : msg.entity_data?.content ||
                        msg.entity_data?.mission ||
                        msg.entity_data?.description ||
                        '',
                  image:
                    msg.entity_type === 'profile'
                      ? msg.entity_data?.profile_picture || msg.entity_data?.avatar || ''
                      : msg.entity_data?.media ||
                        msg.entity_data?.image ||
                        msg.entity_data?.logo ||
                        msg.entity_data?.avatar ||
                        '',
                  icon: '🔗',
                  avatar: msg.entity_type === 'post' ? msg.entity_data?.user?.profile_picture : undefined,
                  likesCount: msg.entity_data?.likes_count || 0,
                  commentsCount: msg.entity_data?.comments_count || 0,
                  color:
                    msg.entity_data?.color && msg.entity_data.color !== 'string'
                      ? msg.entity_data.color
                      : msg.entity_data?.collective?.color && msg.entity_data.collective.color !== 'string'
                      ? msg.entity_data.collective.color
                      : undefined,
                  sortName:
                    msg.entity_type === 'fundraiser'
                      ? undefined
                      : msg.entity_data?.sort_name || msg.entity_data?.collective?.sort_name || undefined,
                  username: msg.entity_data?.username,
                }
              : undefined,
          isRead: msg.is_read,
        }));
      // Keep mapped messages in newest-first sorting orientation matching the inverted FlatList container view
      setMessages(mappedMessages);
    } else if (!selectedId) {
      setMessages([]);
    }
  }, [historyData?.pages, allMessages, selectedId, user?.id]);

  // 3. Real-time WebSocket Handler engine
  const handleNewSocketMessage = useCallback(
    (data: MessageResponse) => {
      const newMessage: ChatMessage = {
        id: data.id?.toString(),
        senderId: data.sender?.id === user?.id ? 'me' : 'other',
        text: data.content,
        timestamp: new Date(data.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        date: new Date(data.created_at).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        }),
        type:
          data.entity_type === 'post' ||
          data.entity_type === 'cause' ||
          data.entity_type === 'collective' ||
          data.entity_type === 'profile' ||
          data.entity_type === 'fundraiser'
            ? 'card'
            : data.entity_type === 'video'
            ? 'video'
            : data.entity_type === 'image'
            ? 'image'
            : 'text',
        mediaUrl:
          data.entity_type === 'image' || data.entity_type === 'video'
            ? data.entity_data?.url || data.content
            : undefined,
        cardData:
          data.entity_type === 'post' ||
          data.entity_type === 'cause' ||
          data.entity_type === 'collective' ||
          data.entity_type === 'profile' ||
          data.entity_type === 'fundraiser'
            ? {
                type: data.entity_type,
                id: data.entity_id || data.entity_data?.id,
                title:
                  data.entity_type === 'profile'
                    ? data.entity_data?.full_name ||
                      `${data.entity_data?.first_name || ''} ${data.entity_data?.last_name || ''}`.trim() ||
                      data.entity_data?.username ||
                      'Shared Profile'
                    : data.entity_type === 'post'
                    ? data.entity_data?.user?.full_name || data.entity_data?.user?.username || 'Shared Post'
                    : data.entity_type === 'fundraiser'
                    ? data.entity_data?.name || 'Shared Fundraiser'
                    : data.entity_data?.collective?.name ||
                      data.entity_data?.fundraiser?.name ||
                      data.entity_data?.name ||
                      (data.entity_type === 'cause'
                        ? 'Shared Nonprofit'
                        : data.entity_type === 'collective'
                        ? 'Shared Group'
                        : 'Shared Post'),
                description:
                  data.entity_type === 'profile'
                    ? data.entity_data?.bio || ''
                    : data.entity_data?.content ||
                      data.entity_data?.mission ||
                      data.entity_data?.description ||
                      '',
                image:
                  data.entity_type === 'profile'
                    ? data.entity_data?.profile_picture || data.entity_data?.avatar || ''
                    : data.entity_data?.media ||
                      data.entity_data?.image ||
                      data.entity_data?.logo ||
                      data.entity_data?.avatar ||
                      '',
                icon: '🔗',
                avatar: data.entity_type === 'post' ? data.entity_data?.user?.profile_picture : undefined,
                likesCount: data.entity_data?.likes_count || 0,
                commentsCount: data.entity_data?.comments_count || 0,
                color:
                  data.entity_data?.color && data.entity_data.color !== 'string'
                    ? data.entity_data.color
                    : data.entity_data?.collective?.color && data.entity_data.collective.color !== 'string'
                    ? data.entity_data.collective.color
                    : undefined,
                sortName:
                  data.entity_type === 'fundraiser'
                    ? undefined
                    : data.entity_data?.sort_name || data.entity_data?.collective?.sort_name || undefined,
                username: data.entity_data?.username,
              }
            : undefined,
        isRead: data.is_read || false,
      };

      setMessages(prev => {
        const exists = prev.some(m => m.id === newMessage.id);
        if (exists) return prev;
        // Prepend to top of array so it shows instantly at bottom of inverted feed view
        return [newMessage, ...prev];
      });
      // Invalidate queries to refresh the list of conversations and unread counts
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
    [user?.id, queryClient]
  );

  useChatSocket(selectedId, handleNewSocketMessage);

  // 4. Send handler dispatch
  const handleSendMessage = async (images?: any[]) => {
    if (!inputValue.trim() && (!images || images.length === 0)) return;

    try {
      const actualConvId = selectedId || '';

      const processResponseObj = (rawRes: any) => {
        if (!rawRes) return;
        const resObj = rawRes.id != null ? rawRes : rawRes.message || rawRes.data || rawRes.result;
        if (!resObj || resObj.id == null) return;

        // Instant inline optimistic sync layer
        const newMsgItem: ChatMessage = {
          id: resObj.id.toString(),
          senderId: 'me',
          text: resObj.content,
          timestamp: new Date(resObj.created_at || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          date: new Date(resObj.created_at || Date.now()).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          }),
          type: resObj.entity_type === 'image' ? 'image' : resObj.entity_type === 'video' ? 'video' : 'text',
          mediaUrl:
            resObj.entity_type === 'image' || resObj.entity_type === 'video'
              ? resObj.entity_data?.url || resObj.content
              : undefined,
          isRead: true,
        };

        setMessages(prev => {
          if (prev.some(m => m.id === newMsgItem.id)) return prev;
          return [newMsgItem, ...prev];
        });

        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      if (images && images.length > 0) {
        for (const fObj of images) {
          const formData = new FormData();
          formData.append('conversation_id', actualConvId);
          formData.append('content', inputValue.trim() || '');
          formData.append('file', {
            uri: fObj.uri,
            type: fObj.type || 'image/jpeg',
            name: fObj.name || 'upload.jpg',
          } as any);
          formData.append('entity_type', fObj.type?.startsWith('video/') ? 'video' : 'image');

          const res = await sendChatMessage(formData);
          processResponseObj(res);
        }
      } else if (inputValue.trim()) {
        const formData = new FormData();
        formData.append('conversation_id', actualConvId);
        formData.append('content', inputValue.trim());

        const res = await sendChatMessage(formData);
        processResponseObj(res);
      }

      setInputValue('');
    } catch (err) {
      console.error('Submission messaging exception error:', err);
    }
  };

  // Back stack button resolver
  const handleBackPress = () => {
    Keyboard.dismiss();
    if (selectedId && !params.userId && !params.conversationId) {
      setSelectedId(null);
    } else {
      navigation.goBack();
    }
  };

  // List View individual card template
  const renderConversationItem = ({ item }: { item: ConversationItem }) => (
    <TouchableOpacity
      style={[styles.conversationCard, item.unread && styles.unreadCardBg]}
      activeOpacity={0.7}
      onPress={() => {
        Keyboard.dismiss();
        setSelectedId(item.id);
      }}
    >
      <View style={styles.avatarContainer}>
        <Avatar size={50}>
          <AvatarImage src={item.user.avatar} />
          <AvatarFallback
            style={{ backgroundColor: item.user.color || PrimaryBlue }}
            textStyle={{ color: '#FFFFFF', fontSize: 18, fontFamily: 'Outfit-Bold' }}
          >
            {item.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {item.unread && <View style={styles.unreadBadgeDot} />}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.userNameText, item.unread && styles.boldText]} numberOfLines={1}>
            {item.user.name}
          </Text>
          <Text style={styles.timestampText}>{item.timestamp}</Text>
        </View>
        <Text style={[styles.lastMessageText, item.unread && styles.unreadMsgText]} numberOfLines={2}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Top Navigation Toolbar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerIconButton} activeOpacity={0.8}>
          <ChevronLeft size={26} color="#111827" />
        </TouchableOpacity>

        {selectedId && currentConversation ? (
          <View style={styles.headerProfileRow}>
            <Avatar size={34}>
              <AvatarImage src={currentConversation.user.avatar} />
              <AvatarFallback
                style={{ backgroundColor: currentConversation.user.color }}
                textStyle={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Outfit-Bold' }}
              >
                {currentConversation.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Text style={styles.headerTitleProfile} numberOfLines={1}>
              {currentConversation.user.name}
            </Text>
          </View>
        ) : (
          <Text style={styles.headerTitleMain}>Messages</Text>
        )}

        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            if (selectedId) {
              queryClient.invalidateQueries({ queryKey: ['messages', selectedId] });
            } else {
              refetch();
            }
          }}
          style={styles.headerIconButton}
          activeOpacity={0.8}
        >
          <RefreshCw size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Primary Split Viewport Container */}
      <View style={styles.body}>
        {!selectedId ? (
          // NATIVE LIST CONTAINER
          <View style={styles.listViewWrapper}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search conversations..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {isConversationsLoading ? (
              <View style={styles.skeletonListWrapper}>
                {[1, 2, 3, 4, 5, 6].map(key => (
                  <View key={key} style={styles.skeletonRow}>
                    <Skeleton width={50} height={50} borderRadius={25} />
                    <View style={styles.skeletonContent}>
                      <View style={styles.skeletonHeaderRow}>
                        <Skeleton width="45%" height={16} borderRadius={4} />
                        <Skeleton width={35} height={12} borderRadius={4} />
                      </View>
                      <Skeleton width="75%" height={14} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={item => item.id}
                renderItem={renderConversationItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateTitle}>No conversations found</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      {searchQuery.trim()
                        ? 'Try searching with a different term'
                        : 'Start chatting with other members to see threads here'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        ) : (
          // FULL NATIVE CHAT VIEWPORT FEED ENGINE
          <ChatView
            conversation={currentConversation || { id: selectedId }}
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSendMessage}
            isLoading={isHistoryLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  headerIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleMain: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flex: 1,
    paddingHorizontal: 10,
  },
  headerTitleProfile: {
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    flexShrink: 1,
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listViewWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#111827',
    height: '100%',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    gap: 14,
  },
  unreadCardBg: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    backgroundColor: PrimaryBlue,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  boldText: {
    fontFamily: 'Outfit-Bold',
  },
  timestampText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#9CA3AF',
  },
  lastMessageText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadMsgText: {
    color: '#111827',
    fontFamily: 'Outfit-Medium',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingInfoText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#6B7280',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 30,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonListWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
