import React, { useState, useRef, useEffect, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { mentionSearch } from '../../services/api/social';
import { MentionSearchResults } from './MentionSearchResults';

interface MentionInputProps {
  placeholder?: string;
  replyingTo?: any;
  onCancelReply?: () => void;
  onSubmit: (text: string, mentions: any[]) => void;
  disabled?: boolean;
}

const MentionInputComponent = ({
  placeholder = "Share your thoughts...",
  replyingTo,
  onCancelReply,
  onSubmit,
  disabled
}: MentionInputProps) => {
  const [text, setText] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [mentionSearchQuery, setMentionSearchQuery] = useState<string | null>(null);
  const [selectedMentions, setSelectedMentions] = useState<any[]>([]);
  const inputRef = useRef<TextInput>(null);
  const selectionLockRef = useRef(false);

  const [debouncedQuery, setDebouncedQuery] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(mentionSearchQuery);
    }, 50); // Fix 2 - 50ms debounce
    return () => clearTimeout(timer);
  }, [mentionSearchQuery]);

  // Fix 6 & Fix 3 - Use React Query for mention search (auto-cancellation, caching, deduping)
  const { data: mentionData } = useQuery({
    queryKey: ['mentionSearch', debouncedQuery],
    queryFn: () => mentionSearch(debouncedQuery || ''),
    enabled: !!debouncedQuery && debouncedQuery.length > 0, // Fix 4 - Don't fetch for empty @
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
  });

  const mentionResults = mentionData?.results || (Array.isArray(mentionData) ? mentionData : []);

  const handleTextChange = (value: string) => {
    setText(value);

    if (selectionLockRef.current) return;

    const lastAtIndex = value.lastIndexOf('@');

    if (lastAtIndex === -1) {
      setMentionSearchQuery(null);
      return;
    }

    const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : null;
    const isStartOfWord = !charBeforeAt || charBeforeAt === ' ' || charBeforeAt === '\n';

    if (!isStartOfWord) {
      setMentionSearchQuery(null);
      return;
    }

    const query = value.substring(lastAtIndex + 1);

    if (query.includes(' ') || query.includes('\n') || query.length > 30) {
      setMentionSearchQuery(null);
      return;
    }

    setMentionSearchQuery(query);
  };

  const handleMentionSelect = (user: any) => {
    const cursorPosition = selection.start;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const textAfterCursor = text.substring(cursorPosition);

    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    const mentionText = `@${user.name} `;
    const newTextBeforeCursor = textBeforeCursor.substring(0, lastAtSymbolIndex) + mentionText;

    const newText = newTextBeforeCursor + textAfterCursor;

    selectionLockRef.current = true;
    const newPos = newTextBeforeCursor.length;
    setSelection({ start: newPos, end: newPos });
    setText(newText);

    setSelectedMentions(prev => [
      ...prev.filter(m => m.name !== user.name),
      { type: user.type, id: user.id, name: user.name }
    ]);

    setMentionSearchQuery(null);

    // Focus and unlock
    setTimeout(() => {
      inputRef.current?.focus();
      setTimeout(() => {
        selectionLockRef.current = false;
      }, 100);
    }, 50);
  };

  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@\w*(?:\s\w+)?)/g);
    return (
      <Text style={{
        fontSize: 15,
        color: '#111827',
        lineHeight: 20,
        fontFamily: 'Outfit-Regular'
      }}>
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return <Text key={i} style={{ color: PrimaryBlue, fontWeight: '500', fontFamily: 'Outfit-SemiBold' }}>{part}</Text>;
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  const handleSubmit = () => {
    if (text.trim()) {
      const finalMentions = selectedMentions
        .filter(m => text.includes(`@${m.name}`))
        .map(({ type, id }) => ({ type, id }));

      onSubmit(text.trim(), finalMentions);
      setText('');
      setSelectedMentions([]);
      setMentionSearchQuery(null);
    }
  };

  return (
    <View style={{
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      backgroundColor: 'white',
      // paddingBottom: Platform.OS === 'ios' ? 30 : 12
    }}>
      {replyingTo && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F3F4F6',
          padding: 12,
          marginBottom: 12,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: PrimaryBlue
        }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Outfit-SemiBold', color: PrimaryBlue, marginBottom: 2 }}>
              Replying to @{replyingTo.username}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 13, color: PrimaryGrey, fontFamily: 'Outfit-Regular' }}>
              {replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={{ padding: 4 }}>
            <X size={16} color={PrimaryGrey} />
          </TouchableOpacity>
        </View>
      )}

      <View style={{
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 8,
        position: 'relative',
        zIndex: 1000,
        minHeight: 45
      }}>
        <View style={{ width: 4, backgroundColor: PrimaryBlue, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }} />
        <MentionSearchResults
          results={mentionResults}
          onSelect={handleMentionSelect}
        />
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Highlighted text layer - placed behind the input */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === 'ios' ? 12 : 8,
              zIndex: 1
            }}
          >
            {renderHighlightedText(text)}
          </View>
          <TextInput
            ref={inputRef}
            placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : placeholder}
            placeholderTextColor={PrimaryGrey}
            value={text}
            onChangeText={handleTextChange}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            multiline
            selectionColor={PrimaryBlue}
            style={{
              flex: 1,
              fontSize: 15,
              lineHeight: 20,
              color: 'transparent', // Keep transparent so background shows through
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === 'ios' ? 12 : 8,
              minHeight: 45,
              maxHeight: 120,
              backgroundColor: 'transparent',
              zIndex: 2,
              fontFamily: 'Outfit-Regular'
            }}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!text.trim() || disabled}
          style={{
            backgroundColor: text.trim() ? '#1600ff' : '#F3F4F6',
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 8,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1
          }}
        >
          <Text style={{
            fontSize: 15,
            fontFamily: 'Outfit-SemiBold',
            color: text.trim() ? 'white' : '#9CA3AF'
          }}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const MentionInput = memo(MentionInputComponent);
