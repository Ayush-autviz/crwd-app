import React, { forwardRef, useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Clipboard,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Instagram,
  Linkedin,
  MessageSquare,
  Search,
  Check,
  X,
  Repeat,
} from 'lucide-react-native';
import { useToast } from '../contexts/ToastContext';
import { useQuery } from '@tanstack/react-query';
import {
  getConversations,
  searchConversations,
  sendChatMessage,
  ConversationResponse,
} from '../services/api/chat';
import { useAuthStore } from '../store/store';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import { PrimaryBlue } from '../Constants/Colors';
import { repostPost } from '../services/api/social';
import { decodePostId } from '../utils/truncateFirstPeriod';

interface SharePostProps {
  url: string;
  title: string;
  message: string;
  entityId?: string | number;
  entityType?: string;
  onClose?: () => void;
}

const SharePost = forwardRef<BottomSheetModal, SharePostProps>(
  ({ url, title, message, entityId, entityType, onClose }, ref) => {
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [sentIds, setSentIds] = useState<Set<number>>(new Set());
    const [isSending, setIsSending] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    const snapPoints = useMemo(() => ['75%'], []);

    const { data: convData, isLoading: isConversationsLoading } = useQuery({
      queryKey: ['share-conversations', searchQuery],
      queryFn: () => (searchQuery ? searchConversations(searchQuery) : getConversations()),
      enabled: true,
    });

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      []
    );

    const handleClose = () => {
      onClose?.();
      (ref as any).current?.dismiss();
      setSearchQuery('');
      setSentIds(new Set());
    };

    const handleCopyLink = () => {
      Clipboard.setString(url);
      setCopied(true);
      showToast('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
      handleClose();
    };

    const handleSendToChat = async (convId: number, userName: string) => {
      try {
        setIsSending(convId);
        const formData = new FormData();
        formData.append('conversation_id', convId.toString());

        let extractedId: string | null = entityId ? entityId.toString() : null;
        let entityTypeToSend: string | null = entityType || null;

        // URL parsing logic if explicit ID/Type not provided
        if (!extractedId || !entityTypeToSend) {
          if (url.includes('/post/')) {
            const parts = url.split('/post/');
            if (parts.length > 1) {
              extractedId = parts[1].split(/[/?#]/)[0];
              entityTypeToSend = 'post';
            }
          } else if (url.includes('/fundraiser/')) {
            const parts = url.split('/fundraiser/');
            if (parts.length > 1) {
              extractedId = parts[1].split(/[/?#]/)[0];
              entityTypeToSend = 'fundraiser';
            }
          } else if (url.includes('/c/') || url.includes('/cause/')) {
            const parts = url.includes('/c/') ? url.split('/c/') : url.split('/cause/');
            if (parts.length > 1) {
              extractedId = parts[1].split(/[/?#]/)[0];
              entityTypeToSend = 'cause';
            }
          } else if (url.includes('/g/') || url.includes('/groupcrwd/')) {
            const parts = url.includes('/g/') ? url.split('/g/') : url.split('/groupcrwd/');
            if (parts.length > 1) {
              extractedId = parts[1].split(/[/?#]/)[0];
              entityTypeToSend = 'collective';
            }
          } else if (url.includes('/u/')) {
            const parts = url.split('/u/');
            if (parts.length > 1) {
              extractedId = parts[1].split(/[/?#]/)[0];
              entityTypeToSend = 'profile';
            }
          }
        }

        if (entityTypeToSend && extractedId) {
          formData.append('entity_type', entityTypeToSend);
          formData.append('entity_id', extractedId);
        } else {
          const textContent = message ? `${message}\n${url}` : url;
          formData.append('content', textContent);
        }

        await sendChatMessage(formData);
        setSentIds((prev) => new Set(prev).add(convId));
        showToast(`Shared to ${userName}`);

        setTimeout(() => {
          handleClose();
        }, 1000);
      } catch (err) {
        showToast('Failed to share');
      } finally {
        setIsSending(null);
      }
    };

    const handleEmailShare = async () => {
      const subject = title || 'Check this out';
      const body = message ? `${message}\n\n${url}` : url;
      Linking.openURL(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      handleClose();
    };

    const handleMessengerShare = () => {
      Linking.openURL(`fb-messenger://share?link=${encodeURIComponent(url)}`).catch(() => {
        Linking.openURL(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}`);
      });
      handleClose();
    };

    const handleLinkedInShare = () => {
      Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
      handleClose();
    };

    const handleInstagramShare = () => {
      const shareText = title ? `${title}\n\n${url}` : message ? `${message}\n\n${url}` : url;
      Clipboard.setString(shareText);
      showToast('Copied text! Paste in Instagram.');
      Linking.openURL('instagram://app').catch(() => Linking.openURL('https://www.instagram.com/'));
      handleClose();
    };

    const handleTextShare = () => {
      const textBody = title ? `${title}\n${url}` : message ? `${message}\n${url}` : url;
      Linking.openURL(`sms:?&body=${encodeURIComponent(textBody)}`);
      handleClose();
    };

    const handleRepost = async () => {
      try {
        let postIdToRepost: string | number | null = entityId || null;

        // Extract from URL if not provided
        if (!postIdToRepost && url.includes('/post/')) {
          const parts = url.split('/post/');
          if (parts.length > 1) {
            const encoded = parts[1].split(/[/?#]/)[0];
            if (encoded) {
              postIdToRepost = decodePostId(encoded);
            }
          }
        }

        if (!postIdToRepost) {
          showToast('Could not find post to repost');
          return;
        }

        await repostPost(postIdToRepost);
        showToast('Successfully reposted!');
        handleClose();
      } catch (err) {
        showToast('Failed to repost');
      }
    };

    const isPostOnly = entityType === 'post' || (!entityType && url.includes('/post/') && !url.includes('/fundraiser/'));

    const conversations = (convData?.results || []).slice(0, 8);

    const shareOptions = [
      { id: 'copy', label: 'Copy Link', icon: LinkIcon, bgColor: '#EFF6FF', iconColor: '#2563EB', onPress: handleCopyLink },
      { id: 'messenger', label: 'Messenger', icon: MessageCircle, bgColor: '#EFF6FF', iconColor: '#2563EB', onPress: handleMessengerShare },
      { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, bgColor: '#F3F4F6', iconColor: '#111827', onPress: handleLinkedInShare },
      { id: 'email', label: 'Email', icon: Mail, bgColor: '#FEF2F2', iconColor: '#DC2626', onPress: handleEmailShare },
      { id: 'instagram', label: 'Instagram', icon: Instagram, bgColor: '#FDF2F8', iconColor: '#DB2777', onPress: handleInstagramShare },
      { id: 'text', label: 'Text', icon: MessageSquare, bgColor: '#F0FDF4', iconColor: '#16A34A', onPress: handleTextShare },
    ];

    if (isPostOnly) {
      shareOptions.unshift({ id: 'repost', label: 'Repost on crwd', icon: Repeat, bgColor: '#EFF6FF', iconColor: '#2563EB', onPress: handleRepost });
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        index={0}
        onDismiss={onClose}
        keyboardBehavior="extend"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={styles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Recent</Text>
          </View>

          <ScrollView style={styles.chatsList} showsVerticalScrollIndicator={false}>
            {conversations.map((conv: ConversationResponse) => {
              const otherUser = conv.participants.find((p) => p.id !== user?.id) || conv.participants[0];
              if (!otherUser) return null;

              const isSent = sentIds.has(conv.id);
              const isCurrentSending = isSending === conv.id;

              return (
                <TouchableOpacity
                  key={conv.id}
                  onPress={() => !isSent && !isCurrentSending && handleSendToChat(conv.id, otherUser.full_name)}
                  style={[styles.chatItem, (isSent || isCurrentSending) && styles.chatItemDisabled]}
                >
                  <View style={styles.chatLeft}>
                    <Avatar size={40}>
                      <AvatarImage src={otherUser.profile_picture} />
                      <AvatarFallback style={{ backgroundColor: otherUser.color || '#ccc' }}>
                        {otherUser.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <View style={styles.chatInfo}>
                      <Text style={styles.chatName}>{otherUser.full_name}</Text>
                      <Text style={styles.chatUsername}>@{otherUser.username}</Text>
                    </View>
                  </View>

                  {isSent && (
                    <View style={styles.sentBadge}>
                      <Check size={12} color="#9CA3AF" strokeWidth={3} />
                      <Text style={styles.sentText}>Sent</Text>
                    </View>
                  )}
                  {isCurrentSending && (
                    <Text style={styles.sendingText}>Sending...</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {conversations.length === 0 && !isConversationsLoading && (
              <Text style={styles.emptyText}>No conversations found</Text>
            )}
            {isConversationsLoading && (
              <ActivityIndicator style={{ marginTop: 20 }} color={PrimaryBlue} />
            )}
          </ScrollView>

          <View style={styles.externalSection}>
            <View style={styles.externalGrid}>
              {shareOptions.map((option) => (
                <TouchableOpacity key={option.id} style={styles.optionItem} onPress={option.onPress}>
                  <View style={[styles.iconBox, { backgroundColor: option.bgColor }]}>
                    <option.icon size={22} color={option.iconColor} />
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#111827',
  },
  sectionTitleRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  chatsList: {
    height: 280,
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  chatItemDisabled: {
    opacity: 0.6,
  },
  chatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatInfo: {
    marginLeft: 12,
  },
  chatName: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  chatUsername: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#9CA3AF',
  },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sentText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#9CA3AF',
  },
  sendingText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: PrimaryBlue,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#9CA3AF',
  },
  externalSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 'auto',
    paddingTop: 16,
  },
  externalGrid: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 20,
  },
  optionItem: {
    alignItems: 'center',
    width: '33.33%',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#374151',
    textAlign: 'center',
  },
});

export default SharePost;
