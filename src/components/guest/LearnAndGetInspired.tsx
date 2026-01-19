import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Article {
  id: string | number;
  title: string;
  description: string;
  readTime: string;
  image: any;
  slug?: string;
}

interface LearnAndGetInspiredProps {
  articles?: Article[];
}

export default function LearnAndGetInspired({ articles }: LearnAndGetInspiredProps) {
  const navigation = useNavigation();

  // Default articles data if none provided
  const defaultArticles: Article[] = [
    {
      id: 1,
      title: 'How to donate to multiple charities at once',
      description: "Learn how CRWD's donation box makes it easy to support all your favorite causes",
      readTime: '5 min read',
      image: require('../../assets/learn/learn4.jpeg'),
      slug: 'how-to-donate-to-multiple-charities-at-once',
    },
    {
      id: 2,
      title: 'Why Small Donations Matter',
      description: 'Every contribution counts toward lasting change',
      readTime: '4 min read',
      image: require('../../assets/learn/learn1.jpeg'),
      slug: 'why-small-donations-matter',
    },
    {
      id: 3,
      title: 'What is a CRWD Collective?',
      description: 'Learn how collectives amplify your giving power',
      readTime: '5 min read',
      image: require('../../assets/learn/learn3.jpeg'),
      slug: 'what-is-a-crwd-collective',
    },
  ];

  const displayArticles = articles && articles.length > 0 ? articles : defaultArticles;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header with Title and Link */}
        <View style={styles.header}>
          <Text style={styles.title}>Learn & Get Inspired</Text>

        </View>

        {/* Article Cards Grid */}
        <View style={styles.grid}>
          {displayArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => navigation.navigate('ArticleDetail' as never, { id: article.id } as never)}
            >
              {/* Article Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={typeof article.image === 'string' ? { uri: article.image } : article.image}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>

              {/* Article Content */}
              <View style={styles.articleContent}>
                {/* Read Time */}
                <View style={styles.readTimeRow}>
                  <Clock size={16} color="#6b7280" />
                  <Text style={styles.readTime}>{article.readTime}</Text>
                </View>

                {/* Title */}
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </Text>

                {/* Description */}
                <Text style={styles.articleDescription} numberOfLines={2}>
                  {article.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  seeAllLink: {
    color: '#1600ff',
    fontWeight: '600',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  articleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    width: screenWidth > 768 ? (screenWidth - 64) / 3 : screenWidth - 32,
    maxWidth: 400,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  articleContent: {
    padding: 16,
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  readTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  articleTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

