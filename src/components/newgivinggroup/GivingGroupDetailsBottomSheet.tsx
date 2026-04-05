import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { Bell, UserPlus, Settings, Star, X, Pencil } from 'lucide-react-native';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { SquarePen } from 'lucide-react-native';

interface Nonprofit {
  id: number;
  name?: string;
  logo?: string;
  image?: string;
  mission?: string;
  description?: string;
  cause?: {
    id: number;
    name: string;
    logo?: string;
    image?: string;
    mission?: string;
    description?: string;
  };
}

interface GivingGroupDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  groupData: {
    id: string;
    name: string;
    founderName: string;
    memberCount: number;
    donationCount: number;
    nonprofitCount: number;
    description: string;
    avatar?: string;
    color?: string;
  };
  nonprofits: Nonprofit[];
  isAdmin?: boolean;
  isJoined?: boolean;
  onInvite?: () => void;
  onNotifications?: () => void;
  onManage?: () => void;
  onDelete?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  onToggleCause?: (causeId: number, isAdding: boolean) => void;
  onStatClick?: (tab: 'Nonprofits' | 'Members' | 'Donations') => void;
  donationBox?: any;
  loadingCauseId?: number | null;
  isFavorited?: boolean;
  onFavorite?: () => void;
}

const getInitials = (name: string) => {
  if (!name) return 'G';
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map((word) => word[0])
    .join('')
    .substring(0, 1)
    .toUpperCase();
};

const GivingGroupDetailsBottomSheet = React.forwardRef<BottomSheetModal, GivingGroupDetailsProps>(({
  isOpen,
  onClose,
  groupData,
  nonprofits,
  isAdmin = false,
  isJoined = false,
  onInvite,
  onNotifications,
  onManage,
  onDelete,
  onJoin,
  onLeave,
  onToggleCause,
  onStatClick,
  donationBox,
  loadingCauseId = null,
  isFavorited = false,
  onFavorite,
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const snapPoints = useMemo(() => ['90%'], []);

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

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  );

  const wordLimit = 20;
  const words = (groupData.description || '').split(/\s+/);
  const isOverLimit = words.length > wordLimit;
  const canExpand = isOverLimit;

  const renderFooter = React.useCallback(
    (props: any) => (
      <BottomSheetFooter {...props}>
        <View style={styles.footerContainer}>
          {isAdmin ? (
            <TouchableOpacity style={[styles.bottomButton, styles.deleteButton]} onPress={onDelete}>
              <Text style={styles.deleteButtonText}>Delete group</Text>
            </TouchableOpacity>
          ) : (
            isJoined ? (
              <TouchableOpacity style={[styles.bottomButton, styles.leaveButton]} onPress={onLeave}>
                <Text style={styles.leaveButtonText}>Leave group</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.bottomButton} onPress={onJoin}>
                <Text style={styles.joinButtonText}>Join group</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </BottomSheetFooter>
    ),
    [isAdmin, isJoined, onDelete, onLeave, onJoin]
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      enableOverDrag={false}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.modalHandle}
    >
      <View style={{ flex: 1 }}>
        <BottomSheetScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <Avatar size={64} style={styles.avatar}>
              <AvatarImage src={groupData.avatar} />
              <AvatarFallback
                style={[styles.avatarFallback, { backgroundColor: groupData.color || '#1600ff' }]}
                textStyle={styles.avatarFallbackText}
              >
                {getInitials(groupData.name)}
              </AvatarFallback>
            </Avatar>

            <Text style={styles.groupName}>{groupData.name}</Text>
            <Text style={styles.founderInfo}>
              Founded by {groupData.founderName} · {groupData.memberCount.toLocaleString()} members
            </Text>

            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                {!isExpanded && canExpand ? (
                  <>
                    {words.slice(0, wordLimit).join(' ')}
                    <Text onPress={() => setIsExpanded(true)} style={styles.expandText}> ... more</Text>
                  </>
                ) : (
                  <>
                    {groupData.description}
                    {isExpanded && canExpand && (
                      <Text onPress={() => setIsExpanded(false)} style={styles.expandText}> Read Less</Text>
                    )}
                  </>
                )}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statBox} onPress={() => onStatClick?.('Members')}>
              <Text style={styles.statValue}>{groupData.memberCount}</Text>
              <Text style={styles.statLabel}>members</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statBox, styles.statDivider]} onPress={() => onStatClick?.('Donations')}>
              <Text style={styles.statValue}>{groupData.donationCount}</Text>
              <Text style={styles.statLabel}>donations</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statBox, styles.statDivider]} onPress={() => onStatClick?.('Nonprofits')}>
              <Text style={styles.statValue}>{groupData.nonprofitCount}</Text>
              <Text style={styles.statLabel}>nonprofits</Text>
            </TouchableOpacity>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <ActionButton
              icon={<UserPlus size={24} color="#374151" />}
              label="Invite"
              onClick={onInvite}
            />
            <ActionButton
              icon={<Star size={24} color={isFavorited ? "#FBBF24" : "#374151"} fill={isFavorited ? "#FBBF24" : "none"} />}
              label={isFavorited ? "Saved" : "Save"}
              onClick={onFavorite}
            />
            {isAdmin && (
              <ActionButton
                icon={<SquarePen size={24} color="#374151" />}
                label="Manage"
                onClick={onManage}
              />
            )}
          </View>

          {/* Nonprofits Section */}
          <View style={styles.nonprofitsSection}>
            <Text style={styles.sectionHeader}>NONPROFITS IN THIS GROUP</Text>
            {nonprofits.map((np) => {
              const cause = np.cause || np;
              const name = cause.name || np.name || 'Unknown Nonprofit';
              const logo = cause.logo || cause.image || np.logo || np.image;
              const causeId = cause.id || np.id;
              const isInBox = existingCauseIds.has(causeId);

              return (
                <View key={np.id} style={styles.nonprofitItem}>
                  <View style={styles.nonprofitInfo}>
                    <Avatar size={40} style={styles.nonprofitAvatar}>
                      <AvatarImage src={logo} />
                      <AvatarFallback style={{ backgroundColor: '#f3f4f6' }} textStyle={{ color: '#6b7280', fontSize: 14 }}>
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Text style={styles.nonprofitName} numberOfLines={1}>{name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onToggleCause?.(causeId, !isInBox)}
                    disabled={loadingCauseId === causeId}
                  >
                    {loadingCauseId === causeId ? (
                      <ActivityIndicator size="small" color={isInBox ? '#ef4444' : '#1600ff'} />
                    ) : (
                      <Text style={[styles.addButton, isInBox && styles.removeButton]}>
                        {isInBox ? 'Remove' : '+Add'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
});

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <TouchableOpacity onPress={onClick} style={styles.actionButtonContainer}>
      <View style={styles.actionIconContainer}>
        {icon}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 8,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Increased to account for footer
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 8,
    padding: 8,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatar: {
    borderRadius: 12,
  },
  avatarFallback: {
    borderRadius: 12,
  },
  avatarFallbackText: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff',
  },
  groupName: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginTop: 10,
    textAlign: 'center',
  },
  founderInfo: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginTop: 4,
    width: '100%',
  },
  description: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#374151',
    textAlign: 'center',
    // lineHeight: 22,
  },
  expandText: {
    fontFamily: 'Outfit-Bold',
    color: '#4b5563',
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#6b7280',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  actionButtonContainer: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f6f5ed',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    color: '#4b5563',
  },
  nonprofitsSection: {
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  nonprofitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  nonprofitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  nonprofitAvatar: {
    borderRadius: 8,
  },
  nonprofitName: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
    flex: 1,
  },
  addButton: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#1600ff',
  },
  removeButton: {
    color: '#ef4444',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    backgroundColor: '#ffffff',
  },
  bottomButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    borderColor: '#e5e7eb',
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#ef4444',
  },
  leaveButton: {
    borderColor: '#e5e7eb',
  },
  leaveButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#ef4444',
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
  },
});

export default GivingGroupDetailsBottomSheet;
