import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '../ui/Skeleton';

export const DonationBoxSkeleton = () => (
    <View style={styles.section}>
        <Skeleton width={150} height={24} style={{ marginBottom: 16, marginTop: 10 }} />
        <Skeleton width="100%" height={150} borderRadius={16} />
    </View>
);

export const CollectiveCarouselSkeleton = () => (
    <View style={styles.section}>
        <Skeleton width="100%" height={150} borderRadius={16} />
    </View>
);

export const CommunityPostsSkeleton = ({ showTitle = true }: { showTitle?: boolean }) => (
    <View style={styles.section}>
        {showTitle && <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ marginLeft: 12 }}>
                    <Skeleton width={100} height={16} style={{ marginBottom: 4 }} />
                    <Skeleton width={60} height={12} />
                </View>
            </View>
            <Skeleton width="100%" height={120} borderRadius={8} style={{ marginTop: 12 }} />
        </View>
    </View>
);

export const FeaturedNonprofitsSkeleton = () => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Skeleton width={150} height={20} />
            <Skeleton width={60} height={20} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {[1, 2].map((i) => (
                <View key={i} style={{ marginRight: 16 }}>
                    <Skeleton width={280} height={160} borderRadius={12} />
                </View>
            ))}
        </ScrollView>
    </View>
);

export const SuggestedCollectivesSkeleton = () => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Skeleton width={150} height={20} />
            <Skeleton width={60} height={20} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {[1, 2].map((i) => (
                <View key={i} style={{ marginRight: 16 }}>
                    <Skeleton width={200} height={260} borderRadius={12} />
                </View>
            ))}
        </ScrollView>
    </View>
);

export const NewHomeSkeleton = () => {
    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <DonationBoxSkeleton />
                <CollectiveCarouselSkeleton />
                <CommunityPostsSkeleton />
                <FeaturedNonprofitsSkeleton />
                <SuggestedCollectivesSkeleton />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        paddingBottom: 40,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    card: {
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
