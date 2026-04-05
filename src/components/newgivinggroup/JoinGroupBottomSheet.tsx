import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Dimensions } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { X, Check } from 'lucide-react-native';
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface Nonprofit {
    id: number;
    name?: string;
    logo?: string;
    image?: string;
    description?: string;
    mission?: string;
    cause?: {
        id: number;
        name: string;
        image?: string;
        logo?: string;
        mission?: string;
        description?: string;
    };
}

interface JoinGroupBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    collectiveName: string;
    nonprofits: Nonprofit[];
    collectiveId: string;
    onJoin: (selectedNonprofits: Nonprofit[], collectiveId: string, shouldSetupDonationBox: boolean) => void;
    isJoining?: boolean;
    donationBox?: any;
    founderName?: string;
}

export default function JoinGroupBottomSheet({
    isOpen,
    onClose,
    collectiveName,
    nonprofits,
    collectiveId,
    onJoin,
    isJoining = false,
    donationBox,
    founderName,
}: JoinGroupBottomSheetProps) {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [selectedNonprofitIds, setSelectedNonprofitIds] = useState<Set<number>>(new Set());
    const [hasInitialized, setHasInitialized] = useState(false);

    const snapPoints = useMemo(() => ['75%'], []);

    // Get existing cause IDs from donation box
    const existingCauseIds = useMemo(() => {
        const ids = new Set<number>();
        if (donationBox?.box_causes && Array.isArray(donationBox.box_causes)) {
            donationBox.box_causes.forEach((boxCause: any) => {
                if (boxCause.cause?.id) {
                    ids.add(boxCause.cause.id);
                }
            });
        }
        return ids;
    }, [donationBox?.box_causes]);

    // Check if donation box exists
    const hasDonationBox = !!(donationBox && donationBox.id);

    // Check capacity
    const currentCapacity = donationBox?.box_causes?.length || 0;
    const maxCapacity = donationBox?.capacity || 0;
    const isAtCapacity = hasDonationBox && currentCapacity >= maxCapacity;

    // Get available nonprofits (excluding those already in donation box)
    const availableNonprofits = useMemo(() => {
        return nonprofits.filter((np) => {
            const cause = np.cause || np;
            const causeId = cause.id || np.id;
            return !existingCauseIds.has(causeId);
        });
    }, [nonprofits, existingCauseIds]);

    // Initialize selection
    useEffect(() => {
        if (isOpen && !hasInitialized) {
            if (nonprofits.length > 0 && !isAtCapacity) {
                const availableIds = nonprofits
                    .map((np) => {
                        const causeId = np.cause?.id || np.id;
                        return existingCauseIds.has(causeId) ? null : causeId;
                    })
                    .filter((id): id is number => id !== null);

                setSelectedNonprofitIds(new Set(availableIds));
            } else if (isAtCapacity) {
                setSelectedNonprofitIds(new Set());
            }
            setHasInitialized(true);
        } else if (!isOpen && hasInitialized) {
            setHasInitialized(false);
            setSelectedNonprofitIds(new Set());
        }
    }, [isOpen, hasInitialized, nonprofits, existingCauseIds, isAtCapacity]);

    // Handle opening/closing the bottom sheet
    useEffect(() => {
        if (isOpen) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        bottomSheetRef.current?.dismiss();
        onClose();
    }, [onClose]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.5}
                onPress={handleClose}
            />
        ),
        [handleClose]
    );

    const handleToggleNonprofit = (id: number) => {
        if (isAtCapacity || existingCauseIds.has(id)) {
            return;
        }

        setSelectedNonprofitIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleJoin = () => {
        const selectedNonprofits = nonprofits.filter((np) => {
            const cause = np.cause || np;
            const nonprofitId = cause.id || np.id;
            return selectedNonprofitIds.has(nonprofitId);
        });
        onJoin(selectedNonprofits, collectiveId, !hasDonationBox);
    };

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            enableDynamicSizing={false}
            backdropComponent={renderBackdrop}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
            onDismiss={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Join {collectiveName}</Text>
                    <Text style={styles.subtitle}>
                        {founderName || 'The organizer'} chose these nonprofits. Add them to your Donation Box to give alongside the group.
                    </Text>
                </View>

                {/* Content - Scrollable */}
                <BottomSheetScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {isAtCapacity && (
                        <View style={styles.capacityAlert}>
                            <Text style={styles.capacityAlertText}>
                                Your donation box is at capacity. Increase your donation amount to add more nonprofits.
                            </Text>
                        </View>
                    )}

                    <View style={styles.nonprofitList}>
                        {nonprofits.map((nonprofit) => {
                            const cause = nonprofit.cause || nonprofit;
                            const nonprofitId = cause.id || nonprofit.id;
                            const nonprofitName = cause.name || nonprofit.name || 'Unknown Nonprofit';
                            const isSelected = selectedNonprofitIds.has(nonprofitId);
                            const isDisabled = existingCauseIds.has(nonprofitId);
                            const image = cause.logo || cause.image || nonprofit.logo || nonprofit.image;

                            return (
                                <TouchableOpacity
                                    key={nonprofit.id}
                                    onPress={() => handleToggleNonprofit(nonprofitId)}
                                    disabled={isDisabled || isAtCapacity}
                                    style={[styles.nonprofitItem, (isDisabled || isAtCapacity) && styles.nonprofitItemDisabled]}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.nonprofitLeft}>
                                        <Avatar size={40} style={{ borderRadius: 8 }}>
                                            <AvatarImage src={image} />
                                            <AvatarFallback textStyle={{ fontSize: 16 }}>{nonprofitName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Text style={styles.nonprofitName} numberOfLines={1}>{nonprofitName}</Text>
                                    </View>

                                    <View style={[
                                        styles.checkbox,
                                        (isSelected || isDisabled) && styles.checkboxActive
                                    ]}>
                                        {(isSelected || isDisabled) && <Check size={16} color="white" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            Your Donation Box holds nonprofits you want to give to. Set up recurring or one-time donations anytime.
                        </Text>
                    </View>
                </BottomSheetScrollView>

                {/* Footer */}
                <View style={[styles.footer, { paddingBottom: 34 }]}>
                    <TouchableOpacity
                        onPress={handleJoin}
                        disabled={isJoining || (selectedNonprofitIds.size === 0 && !isAtCapacity && hasDonationBox)}
                        style={[styles.joinButton, (isJoining || (selectedNonprofitIds.size === 0 && !isAtCapacity && hasDonationBox)) && styles.joinButtonDisabled]}
                        activeOpacity={0.8}
                    >
                        {isJoining ? (
                            <ActivityIndicator color={PrimaryGrey} />
                        ) : (
                            <Text style={styles.joinButtonText}>
                                {hasDonationBox ? 'Add to Donation Box' : 'Set up Donation Box'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    bottomSheetBackground: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    handleIndicator: {
        backgroundColor: '#E5E7EB',
        width: 40,
        height: 4,
    },
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 16,
    },
    title: {
        fontSize: 22,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'Outfit-Regular',
        color: '#6B7280',
        lineHeight: 22,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    capacityAlert: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    capacityAlertText: {
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
        color: '#991B1B',
        textAlign: 'center',
    },
    nonprofitList: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    nonprofitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    nonprofitItemDisabled: {
        opacity: 0.6,
    },
    nonprofitLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    nonprofitName: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    checkboxActive: {
        backgroundColor: '#1600ff',
        borderColor: '#1600ff',
    },
    infoCard: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#F9F9F4',
        borderRadius: 12,
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        color: '#4B5563',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    joinButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinButtonDisabled: {
        opacity: 0.5,
    },
    joinButtonText: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
    },
});
