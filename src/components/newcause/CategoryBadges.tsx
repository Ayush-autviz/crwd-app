import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface Category {
    id: number | string;
    name: string;
    text_color?: string;
    text?: string;
    background_color?: string;
    background?: string;
}

interface CategoryBadgesProps {
    categories: Category[];
    onCategoryClick?: (category: Category) => void;
    containerStyle?: any;
}

const CategoryBadges = ({ categories, onCategoryClick, containerStyle }: CategoryBadgesProps) => {
    if (!categories || categories.length === 0) return null;

    return (
        <View style={[styles.container, containerStyle]}>
            {categories.map((cat) => (
                <TouchableOpacity
                    key={cat.id}
                    onPress={() => onCategoryClick?.(cat)}
                    activeOpacity={0.7}
                    style={[
                        styles.badge,
                        {
                            backgroundColor: cat.background_color || cat.background || '#6B7280',
                        }
                    ]}
                >
                    <Text
                        style={[
                            styles.badgeText,
                            {
                                color: cat.text_color || cat.text || '#FFFFFF',
                            }
                        ]}
                    >
                        {cat.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'Outfit-Medium',
    },
});

export default CategoryBadges;
