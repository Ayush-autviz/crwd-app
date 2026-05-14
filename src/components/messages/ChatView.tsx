import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Send } from 'lucide-react-native';
import { ChatMessage } from './types';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { PrimaryBlue } from '../../Constants/Colors';
import { Skeleton } from '../ui/Skeleton';

interface ChatViewProps {
  conversation: any | null;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: (images?: any[]) => void;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function ChatView({
  conversation,
  messages,
  inputValue,
  onInputChange,
  onSend,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
}: ChatViewProps) {
  if (!conversation && !isLoading) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Send size={44} color={PrimaryBlue} style={styles.sendRotate} />
          </View>
        </View>
        <Text style={styles.placeholderTitle}>Select a Chat</Text>
        <Text style={styles.placeholderDesc}>
          Choose a conversation from your list to start messaging live.
        </Text>
      </View>
    );
  }

  // Render individual chat row
  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    // Determine date dividers
    const showDate = index === messages.length - 1 || item.date !== messages[index + 1]?.date;

    return (
      <View key={item.id || `msg-${index}`}>
        {showDate && item.date ? (
          <View style={styles.datePillContainer}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{item.date}</Text>
            </View>
          </View>
        ) : null}
        <ChatBubble message={item} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 105 : 0}
    >
      <View style={styles.feedContainer}>
        {isLoading ? (
          <View style={styles.skeletonChatWrapper}>
            {[
              { id: 1, isMe: false, width: '60%' },
              { id: 2, isMe: true, width: '45%' },
              { id: 3, isMe: false, width: '75%' },
              { id: 4, isMe: true, width: '55%' },
              { id: 5, isMe: false, width: '40%' },
            ].map(item => (
              <View
                key={item.id}
                style={[
                  styles.skeletonBubbleRow,
                  item.isMe ? styles.skeletonRight : styles.skeletonLeft,
                ]}
              >
                <Skeleton width={item.width as any} height={42} borderRadius={18} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item, index) => item.id || `feed-${index}`}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            inverted={true}
            onEndReached={() => {
              if (onLoadMore && !isFetchingNextPage) {
                onLoadMore();
              }
            }}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={PrimaryBlue} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.noMessagesContainer}>
                <Text style={styles.noMessagesTitle}>No messages yet</Text>
                <Text style={styles.noMessagesDesc}>
                  Send a message below to start the conversation!
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Persistent Chat Input Box */}
      <ChatInput value={inputValue} onChange={onInputChange} onSend={onSend} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(22, 0, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sendRotate: {
    transform: [{ rotate: '-12deg' }],
    marginLeft: -2,
  },
  placeholderTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  placeholderDesc: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  feedContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  datePillContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  datePillText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#6B7280',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noMessagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 140,
    transform: [{ scaleY: -1 }], // flips the empty component rightside up in an inverted list
  },
  noMessagesTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  noMessagesDesc: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#9CA3AF',
  },
  skeletonChatWrapper: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
    flex: 1,
  },
  skeletonBubbleRow: {
    marginVertical: 4,
  },
  skeletonRight: {
    alignSelf: 'flex-end',
  },
  skeletonLeft: {
    alignSelf: 'flex-start',
  },
});
