import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Plus, ArrowRight, ShoppingBag } from 'lucide-react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../../store/store';

interface DonationBoxPromptProps {
  causeCount?: number;
  hasJoinedCollectives?: boolean; // Hide "Start Your Own Collective" if user has joined collectives
}

export default function DonationBoxPrompt({ causeCount, hasJoinedCollectives = false }: DonationBoxPromptProps) {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const firstName = user?.first_name || 'there';

  // If causeCount is provided, show the "You're Almost There!" card
  const showAlmostThereCard = causeCount !== undefined && causeCount > 0;

  return (
    <View style={styles.container}>
      {/* Greeting */}
      <Text style={styles.greeting}>
        Hi {firstName}, ready to make an impact?
      </Text>

      {/* Action Cards */}
      <View style={styles.cardsContainer}>
        {/* You're Almost There Card - Show when donation box exists but is not active */}
        {showAlmostThereCard ? (
          <TouchableOpacity
            style={[styles.card, styles.almostThereCard]}
            activeOpacity={0.7}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'DrawerNav',
                      state: {
                        routes: [
                          {
                            name: 'MainTabs',
                            state: {
                              routes: [
                                { name: 'Home' },
                                { name: 'Search' },
                                {
                                  name: 'Donate',
                                  params: {
                                    initialTab: 'setup',
                                  },
                                },
                                { name: 'Collectives' },
                                { name: 'Profile' },
                              ],
                              index: 2, // Donate tab index
                            },
                          },
                        ],
                        index: 0,
                      },
                    },
                  ],
                })
              );
            }}
          >
            <View style={styles.cardInner}>
              <View style={[styles.iconContainer, styles.orangeIcon]}>
                <Clock size={24} color="#FFFFFF" />
              </View>
              <View style={styles.content}>
              <Text style={styles.cardTitle}>You're Almost There!</Text>
              <Text style={styles.cardDescription}>
                You selected <Text style={styles.bold}>{causeCount} {causeCount === 1 ? 'cause' : 'causes'}</Text> but haven't started donating yet
              </Text>
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [
                        {
                          name: 'DrawerNav',
                          state: {
                            routes: [
                              {
                                name: 'MainTabs',
                                state: {
                                  routes: [
                                    { name: 'Home' },
                                    { name: 'Search' },
                                    {
                                      name: 'Donate',
                                      params: {
                                        initialTab: 'setup',
                                      },
                                    },
                                    { name: 'Collectives' },
                                    { name: 'Profile' },
                                  ],
                                  index: 2, // Donate tab index
                                },
                              },
                            ],
                            index: 0,
                          },
                        },
                      ],
                    })
                  );
                }}
              >
                <Text style={styles.orangeLink}>Complete Setup - Just 2 minutes!</Text>
                <ArrowRight size={16} color="#EA580C" />
              </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          /* Create Donation Box Card - Show when no donation box exists */
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'DrawerNav',
                      state: {
                        routes: [
                          {
                            name: 'MainTabs',
                            state: {
                              routes: [
                                { name: 'Home' },
                                { name: 'Search' },
                                {
                                  name: 'Donate',
                                  params: {
                                    initialTab: 'setup',
                                  },
                                },
                                { name: 'Collectives' },
                                { name: 'Profile' },
                              ],
                              index: 2, // Donate tab index
                            },
                          },
                        ],
                        index: 0,
                      },
                    },
                  ],
                })
              );
            }}
          >
            <View style={styles.cardInner}>
              <View style={[styles.iconContainer, styles.blueIcon]}>
                <ShoppingBag size={24} color="#FFFFFF" />
              </View>
              <View style={styles.content}>
              <Text style={styles.cardTitle}>Create a Donation Box</Text>
              <Text style={styles.cardSubtitle}>
                Support multiple causes with one donation
              </Text>
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [
                        {
                          name: 'DrawerNav',
                          state: {
                            routes: [
                              {
                                name: 'MainTabs',
                                state: {
                                  routes: [
                                    { name: 'Home' },
                                    { name: 'Search' },
                                    {
                                      name: 'Donate',
                                      params: {
                                        initialTab: 'setup',
                                      },
                                    },
                                    { name: 'Collectives' },
                                    { name: 'Profile' },
                                  ],
                                  index: 2, // Donate tab index
                                },
                              },
                            ],
                            index: 0,
                          },
                        },
                      ],
                    })
                  );
                }}
              >
                <Text style={styles.linkText}>Start donating →</Text>
              </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Start Collective Card - Only show if user hasn't joined any collectives */}
        {/* {!hasJoinedCollectives && (
          <TouchableOpacity
            style={[styles.card, styles.whiteCard]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CreateCRWD' as never)}
          >
            <View style={styles.cardInner}>
              <View style={[styles.iconContainer, styles.greenIcon]}>
                <Plus size={24} color="#000000" />
              </View>
              <View style={styles.content}>
              <Text style={styles.cardTitle}>Start Your Own Collective</Text>
              <Text style={styles.cardSubtitle}>
                Bring people together around causes you care about.
              </Text>
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => navigation.navigate('CreateCRWD' as never)}
              >
                <Text style={styles.blackLink}>Create collective</Text>
                <ArrowRight size={12} color="#111827" />
              </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )} */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  cardInner: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  almostThereCard: {
    borderColor: '#FED7AA',
    backgroundColor: '#FEF3C7',
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  blueIcon: {
    backgroundColor: '#1600ff',
  },
  orangeIcon: {
    backgroundColor: '#F97316',
  },
  greenIcon: {
    backgroundColor: '#AEFF30',
  },
  content: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'left',
  },
  cardDescription: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 18,
    textAlign: 'left',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 4,
    textAlign: 'left',
  },
  bold: {
    fontWeight: '700',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1600ff',
  },
  orangeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  blackLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});

