import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface MentionSearchResultsProps {
    results: any[];
    onSelect: (user: any) => void;
    position?: 'above' | 'below' | 'inline';
    isLoading?: boolean;
}

function MentionSearchResultsComponent({ results, onSelect, position = 'above', isLoading }: MentionSearchResultsProps) {
    if (!isLoading && (!results || results.length === 0)) return null;

    let containerStyle: any = [styles.container];

    if (position === 'above') {
        containerStyle.push({ bottom: '100%', top: undefined, marginBottom: 8 });
    } else if (position === 'below') {
        containerStyle.push({ top: '100%', bottom: undefined, marginTop: 8 });
    } else if (position === 'inline') {
        containerStyle.push({ position: 'relative', top: 0, marginTop: 8, elevation: 0, shadowOpacity: 0, maxHeight: 200, minHeight: 50 });
    }

    return (
        <View style={containerStyle}>
            <ScrollView
                horizontal={false}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                style={styles.scrollView}
            >
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="small" color="#1600ff" />
                        <Text style={styles.loaderText}>Searching...</Text>
                    </View>
                ) : (
                    results.map((user: any) => (
                        <TouchableOpacity
                            key={`${user.type}-${user.id}`}
                            style={styles.item}
                            onPress={() => onSelect(user)}
                        >
                            <Avatar size={32} style={styles.avatar}>
                                <AvatarImage src={user.logo} alt={user.name} />
                                <AvatarFallback
                                    style={{ backgroundColor: user.color || '#3B82F6' }}
                                    textStyle={styles.avatarText}
                                >
                                    {user.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <View style={styles.content}>
                                <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
                                {user.type && (
                                    <Text style={styles.username} numberOfLines={1}>{user.type}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

export const MentionSearchResults = memo(MentionSearchResultsComponent);

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        maxHeight: 200,
        zIndex: 9999,
        elevation: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    scrollView: {
        width: '100%',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    avatar: {
        borderRadius: 16,
    },
    avatarText: {
        fontSize: 14,
        color: 'white',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        fontFamily: 'Outfit-SemiBold',
    },
    username: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Outfit-Regular',
    },
    loaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    loaderText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'Outfit-Regular',
    },
});
