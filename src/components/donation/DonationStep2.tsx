import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { CROWDS, RECENTS, SUGGESTED, Organization } from '../../Constants/organizations';
import { ChevronRight } from 'lucide-react-native';

interface DonationStep2Props {
  selectedOrganizations: string[];
  setSelectedOrganizations: (orgs: string[]) => void;
  setStep: (step: number) => void;
}

export default function DonationStep2({
  selectedOrganizations,
  setSelectedOrganizations,
  setStep,
}: DonationStep2Props) {
  const [activeCategory, setActiveCategory] = useState<'crowds' | 'recents' | 'suggested'>('crowds');

  const toggleOrganization = (orgId: string) => {
    if (selectedOrganizations.includes(orgId)) {
      setSelectedOrganizations(selectedOrganizations.filter(id => id !== orgId));
    } else {
      setSelectedOrganizations([...selectedOrganizations, orgId]);
    }
  };

  const getCurrentOrganizations = () => {
    switch (activeCategory) {
      case 'crowds':
        return CROWDS;
      case 'recents':
        return RECENTS;
      case 'suggested':
        return SUGGESTED;
      default:
        return CROWDS;
    }
  };

  const renderOrganizationCard = (org: Organization) => {
    const isSelected = selectedOrganizations.includes(org.id);

    return (
      <TouchableOpacity
        key={org.id}
        style={[styles.orgCard, isSelected && styles.selectedOrgCard]}
        onPress={() => toggleOrganization(org.id)}
      >
        <View style={styles.orgHeader}>
          <Image source={{ uri: org.imageUrl }} style={styles.orgImage} />
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{org.name}</Text>
            <Text style={styles.orgDesc}>{org.shortDesc}</Text>
          </View>
          <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.orgSection}>
        <Text style={styles.sectionTitle}>Choose Organizations</Text>

        <Text style={styles.subsectionTitle}>CRWDS</Text>
        {CROWDS.map(renderOrganizationCard)}

        <Text style={styles.subsectionTitle}>RECENT</Text>
        {RECENTS.map(renderOrganizationCard)}

        <Text style={styles.subsectionTitle}>SUGGESTED</Text>
        {SUGGESTED.map(renderOrganizationCard)}
      </View>

      <View style={{flexDirection:"row",alignItems:"center",justifyContent:'flex-end',gap:4}}>
        <Text style={styles.DiscoverMore}>Discover More</Text>
        <ChevronRight size={16} strokeWidth={2.5} color="#2563eb" />
      </View>

      {/* Next Button */}
      {/* {selectedOrganizations.length > 0 && (
        <View style={styles.nextSection}>
          <Text style={styles.selectedCount}>
            {selectedOrganizations.length} organization{selectedOrganizations.length !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            onPress={() => setStep(3)}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  categoryTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeCategoryTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeCategoryTabText: {
    color: '#1f2937',
  },
  orgList: {
    flex: 1,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  orgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  selectedOrgCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  orgDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  orgSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  selectedCount: {
    fontSize: 16,
    color: '#6b7280',
  },
  nextButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  DiscoverMore: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: 'bold',
  },
});
