import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Clock, Check } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';

const { width: screenWidth } = Dimensions.get('window');

// Get article data based on ID
const getArticleData = (articleId: string | number | undefined) => {
  const articles: Record<string, any> = {
    '1': {
      id: '1',
      title: 'How to Donate to Multiple Charities at Once',
      date: 'November 9, 2025',
      readTime: '8 min read',
      author: 'CRWD Team',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
      type: 'multiple-charities',
      content: {
        introduction:
          'You care about clean water, education, climate action, animal welfare, and mental health support. Here\'s the truth most people face: You care about everything, but you give to nothing.',
        introText:
          'Managing multiple donations is complicated. Different websites, multiple charges, scattered tax receipts.',
        introConclusion: 'There are five ways to support multiple charities with less hassle.',
        ways: [
          {
            title: 'Individual Recurring Donations',
            description: "Set up monthly donations on each nonprofit's website.",
            goodFor: '2-3 charities maximum',
            downside: 'Multiple charges and administrative work',
          },
          {
            title: 'Donor-Advised Funds (DAFs)',
            description: 'Contribute to a fund for tax deductions and grant over time.',
            goodFor: 'Donors giving $5,000+ annually',
            downside: 'High minimums and complexity',
          },
          {
            title: 'Giving Circles',
            description: 'Pool money with friends.',
            goodFor: 'People who enjoy group decision-making',
            downside: 'Requires meetings and coordination',
          },
          {
            title: 'Workplace Giving',
            description: 'Split donations through payroll.',
            goodFor: 'Employees at companies with matching programs',
            downside: 'Limited to approved charity lists',
          },
          {
            title: 'Multi-Charity Platforms',
            description:
              'Set one monthly donation that automatically splits across chosen nonprofits. Platforms like CRWD.',
            goodFor: 'Anyone supporting 3+ charities',
            downside: 'Small platform fees (usually 5-10%)',
            highlight: true,
            highlightText:
              'Why this works best for most people: One donation, unlimited causes, minimal hassle. Add or remove charities anytime.',
          },
        ],
        recurringSection: {
          title: 'Why Recurring Donations Work Better',
          statement: 'Small, consistent donations beat large, sporadic ones.',
          math: [
            '→ One-time $100 donation = $100 to one cause',
            '→ $20/month across 5 charities = $240/year supporting five causes',
          ],
        },
      },
    },
    '2': {
      id: '2',
      title: 'Why Small Donations Matter',
      date: 'November 10, 2025',
      readTime: '4 min read',
      author: 'CRWD Team',
      image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=400&fit=crop',
      type: 'small-donations',
      content: {
        quote: '"$5 won\'t make a difference."',
        introduction:
          'That\'s what most people think. But here\'s the truth: small donations aren\'t just nice gestures—they\'re the lifeblood of nonprofit work. Every dollar counts, and when you give consistently, even small amounts become essential to organizations making real change.',
      },
    },
    '3': {
      id: '3',
      title: 'What is a CRWD Collective?',
      date: 'November 11, 2025',
      readTime: '5 min read',
      author: 'CRWD Team',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
      type: 'collective',
      content: {
        intro: {
          text1:
            'Imagine having the giving power of 100 people—without spending more than you already planned to donate.',
          text2: 'That\'s the magic of a CRWD Collective.',
          text3:
            'A Collective is a group of people who pool their monthly donations together to support multiple nonprofits at once. Think of it as a giving circle, but automated, transparent, and built for the way modern donors want to make impact.',
        },
      },
    },
  };

  return articles[String(articleId || '1')] || articles['1'];
};

const ArticleDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id?: number };

  const article = getArticleData(id);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <MainHeaderNav
        title=""
        show={true}
        menu={false}
        postButton={false}
        customLeft={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="#374151" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>{article.date}</Text>
          <Text style={styles.metadataText}>•</Text>
          <View style={styles.readTimeRow}>
            <Clock size={14} color="#6b7280" />
            <Text style={styles.metadataText}>{article.readTime}</Text>
          </View>
          <Text style={styles.metadataText}>•</Text>
          <Text style={styles.metadataText}>By {article.author}</Text>
        </View>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: article.image }} style={styles.image} resizeMode="cover" />
        </View>

        {/* Article Content */}
        <View style={styles.content}>
          {article.type === 'multiple-charities' && (
            <>
              {/* Introduction */}
              <Text style={styles.introText}>{article.content.introduction}</Text>
              <Text style={styles.paragraph}>{article.content.introText}</Text>
              <Text style={styles.paragraph}>{article.content.introConclusion}</Text>

              {/* Ways Section */}
              <Text style={styles.sectionTitle}>5 Ways to Support Multiple Charities</Text>
              {article.content.ways.map((way: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.wayCard,
                    way.highlight && styles.wayCardHighlighted,
                  ]}
                >
                  <Text style={styles.wayTitle}>{way.title}</Text>
                  <Text style={styles.wayDescription}>{way.description}</Text>
                  <View style={styles.wayDetails}>
                    <Text style={styles.wayDetailText}>
                      <Text style={styles.wayDetailLabel}>Good for: </Text>
                      {way.goodFor}
                    </Text>
                    <Text style={styles.wayDetailText}>
                      <Text style={styles.wayDetailLabel}>Downside: </Text>
                      {way.downside}
                    </Text>
                  </View>
                  {way.highlight && (
                    <View style={styles.highlightBox}>
                      <Text style={styles.highlightText}>{way.highlightText}</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Recurring Section */}
              <View style={styles.recurringSection}>
                <Text style={styles.sectionTitle}>{article.content.recurringSection.title}</Text>
                <Text style={styles.statement}>{article.content.recurringSection.statement}</Text>
                {article.content.recurringSection.math.map((math: string, index: number) => (
                  <Text key={index} style={styles.mathText}>
                    {math}
                  </Text>
                ))}
              </View>
            </>
          )}

          {article.type === 'small-donations' && (
            <>
              <Text style={styles.quote}>{article.content.quote}</Text>
              <Text style={styles.introText}>{article.content.introduction}</Text>
            </>
          )}

          {article.type === 'collective' && (
            <>
              <Text style={styles.introText}>{article.content.intro.text1}</Text>
              <Text style={styles.introText}>{article.content.intro.text2}</Text>
              <Text style={styles.paragraph}>{article.content.intro.text3}</Text>
            </>
          )}

          {/* Start Today Banner */}
          <View style={styles.startTodayBanner}>
            <Text style={styles.startTodayTitle}>Start Today</Text>
            <Text style={styles.startTodayText}>
              Join thousands of people making a difference through CRWD
            </Text>
            <TouchableOpacity
              style={styles.startTodayButton}
              onPress={() => navigation.navigate('OnBoard' as never)}
            >
              <Text style={styles.startTodayButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 36,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  metadataText: {
    fontSize: 14,
    color: '#6b7280',
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  content: {
    paddingHorizontal: 16,
  },
  introText: {
    fontSize: 18,
    color: '#111827',
    lineHeight: 28,
    marginBottom: 16,
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 32,
    marginBottom: 16,
  },
  wayCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  wayCardHighlighted: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  wayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  wayDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 24,
  },
  wayDetails: {
    gap: 8,
  },
  wayDetailText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  wayDetailLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  highlightBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  highlightText: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
    lineHeight: 24,
  },
  recurringSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 24,
    marginTop: 24,
  },
  statement: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  mathText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 24,
  },
  quote: {
    fontSize: 24,
    fontStyle: 'italic',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  startTodayBanner: {
    backgroundColor: '#1600ff',
    borderRadius: 16,
    padding: 32,
    marginTop: 48,
    alignItems: 'center',
  },
  startTodayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  startTodayText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.9,
  },
  startTodayButton: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  startTodayButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1600ff',
  },
});

export default ArticleDetail;

