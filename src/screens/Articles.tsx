import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BookOpen, Clock, TrendingUp, ArrowRight, Search, X } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';

const { width: screenWidth } = Dimensions.get('window');

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  category: string;
  publishedDate: string;
  featured: boolean;
}

const Articles = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  // Articles data
  const articles: Article[] = [
    {
      id: 1,
      title: 'How to Start Your First CRWD Collective',
      excerpt:
        'Everything you need to know about creating a collective and bringing together like-minded people to support causes you care about.',
      author: 'CRWD Team',
      readTime: '5 min read',
      category: 'Collectives',
      publishedDate: '2 days ago',
      featured: true,
    },
    {
      id: 2,
      title: 'Supporting Causes That Matter: A Beginner\'s Guide',
      excerpt:
        'Learn how to find, evaluate, and support causes that align with your values and create real impact in your community.',
      author: 'Alex Thompson',
      readTime: '7 min read',
      category: 'Causes',
      publishedDate: '1 week ago',
      featured: false,
    },
    {
      id: 3,
      title: 'Making the Most of Your Donation Box',
      excerpt:
        'Tips and strategies for organizing your giving and tracking your impact through CRWD\'s donation features.',
      author: 'Maria Garcia',
      readTime: '6 min read',
      category: 'Donations',
      publishedDate: '1 week ago',
      featured: false,
    },
    {
      id: 4,
      title: 'Building Community Through Collective Action',
      excerpt:
        'Discover how joining CRWD collectives helps you connect with others and amplify your social impact together.',
      author: 'James Chen',
      readTime: '8 min read',
      category: 'Community',
      publishedDate: '2 weeks ago',
      featured: false,
    },
    {
      id: 5,
      title: 'Finding Causes Near You: Local Impact Matters',
      excerpt:
        'How to discover and support causes in your area, and why local giving creates the most lasting change.',
      author: 'Sarah Williams',
      readTime: '4 min read',
      category: 'Local Impact',
      publishedDate: '3 weeks ago',
      featured: false,
    },
    {
      id: 6,
      title: 'The Future of Collective Giving with CRWD',
      excerpt:
        'Understanding how CRWD is revolutionizing the way people come together to support causes and create positive change.',
      author: 'CRWD Team',
      readTime: '9 min read',
      category: 'Platform',
      publishedDate: '1 month ago',
      featured: false,
    },
  ];

  const featuredArticles = articles.filter((article) => article.featured);
  const regularArticles = articles.filter((article) => !article.featured);

  const filteredArticles = searchQuery
    ? articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <MainHeaderNav title="Articles" show={true} menu={false} postButton={false} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CRWD Articles</Text>
          <Text style={styles.headerSubtitle}>
            Learn how to make a difference through collectives, causes, and community giving
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        {searchQuery ? (
          /* Search Results */
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Search Results ({filteredArticles.length})
              </Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredArticles.length > 0 ? (
              <View style={styles.articlesList}>
                {filteredArticles.map((article) => (
                  <TouchableOpacity
                    key={article.id}
                    style={styles.articleCard}
                    onPress={() => navigation.navigate('ArticleDetail' as never, { id: article.id } as never)}
                  >
                    <View style={styles.articleCardContent}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, styles.categoryBadge]}>
                          <Text style={styles.badgeText}>{article.category}</Text>
                        </View>
                        {article.featured && (
                          <View style={[styles.badge, styles.featuredBadge]}>
                            <TrendingUp size={12} color="#15803d" />
                            <Text style={[styles.badgeText, styles.featuredBadgeText]}>Featured</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      <Text style={styles.articleExcerpt}>{article.excerpt}</Text>
                      <View style={styles.articleFooter}>
                        <View style={styles.articleMeta}>
                          <Text style={styles.articleMetaText}>By {article.author}</Text>
                          <View style={styles.readTimeRow}>
                            <Clock size={14} color="#6b7280" />
                            <Text style={styles.articleMetaText}>{article.readTime}</Text>
                          </View>
                          <Text style={styles.articleMetaText}>{article.publishedDate}</Text>
                        </View>
                        <View style={styles.readMoreButton}>
                          <Text style={styles.readMoreText}>Read More</Text>
                          <ArrowRight size={16} color="#1600ff" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <BookOpen size={64} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No articles found matching your search</Text>
              </View>
            )}
          </View>
        ) : (
          /* Normal View */
          <View style={styles.content}>
            {/* Featured Article */}
            {featuredArticles.length > 0 && (
              <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={20} color="#111827" />
                  <Text style={styles.sectionTitle}>Featured Article</Text>
                </View>
                <TouchableOpacity
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate('ArticleDetail' as never, { id: featuredArticles[0].id } as never)}
                >
                  <View style={styles.featuredCardContent}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, styles.categoryBadge]}>
                        <Text style={styles.badgeText}>{featuredArticles[0].category}</Text>
                      </View>
                      <View style={[styles.badge, styles.featuredBadge]}>
                        <Text style={[styles.badgeText, styles.featuredBadgeText]}>Featured</Text>
                      </View>
                    </View>
                    <Text style={styles.featuredTitle}>{featuredArticles[0].title}</Text>
                    <Text style={styles.featuredExcerpt}>{featuredArticles[0].excerpt}</Text>
                    <View style={styles.featuredFooter}>
                      <View style={styles.articleMeta}>
                        <Text style={styles.articleMetaText}>By {featuredArticles[0].author}</Text>
                        <View style={styles.readTimeRow}>
                          <Clock size={14} color="#6b7280" />
                          <Text style={styles.articleMetaText}>{featuredArticles[0].readTime}</Text>
                        </View>
                        <Text style={styles.articleMetaText}>{featuredArticles[0].publishedDate}</Text>
                      </View>
                      <TouchableOpacity style={styles.readArticleButton}>
                        <Text style={styles.readArticleButtonText}>Read Article</Text>
                        <ArrowRight size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* All Articles */}
            <View style={styles.allArticlesSection}>
              <View style={styles.sectionHeader}>
                <BookOpen size={20} color="#111827" />
                <Text style={styles.sectionTitle}>All Articles</Text>
              </View>
              <View style={styles.articlesList}>
                {regularArticles.map((article) => (
                  <TouchableOpacity
                    key={article.id}
                    style={styles.articleCard}
                    onPress={() => navigation.navigate('ArticleDetail' as never, { id: article.id } as never)}
                  >
                    <View style={styles.articleCardContent}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, styles.categoryBadge]}>
                          <Text style={styles.badgeText}>{article.category}</Text>
                        </View>
                      </View>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      <Text style={styles.articleExcerpt}>{article.excerpt}</Text>
                      <View style={styles.articleFooter}>
                        <View style={styles.articleMeta}>
                          <Text style={styles.articleMetaText}>By {article.author}</Text>
                          <View style={styles.readTimeRow}>
                            <Clock size={14} color="#6b7280" />
                            <Text style={styles.articleMetaText}>{article.readTime}</Text>
                          </View>
                          <Text style={styles.articleMetaText}>{article.publishedDate}</Text>
                        </View>
                        <View style={styles.readMoreButton}>
                          <Text style={styles.readMoreText}>Read More</Text>
                          <ArrowRight size={16} color="#1600ff" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
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
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 600,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clearText: {
    fontSize: 14,
    color: '#1600ff',
  },
  featuredSection: {
    marginBottom: 32,
  },
  featuredCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredCardContent: {
    padding: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryBadge: {
    backgroundColor: '#dbeafe',
  },
  featuredBadge: {
    backgroundColor: '#dcfce7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563eb',
  },
  featuredBadgeText: {
    color: '#15803d',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  featuredExcerpt: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 24,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  allArticlesSection: {
    marginBottom: 24,
  },
  articlesList: {
    gap: 16,
  },
  articleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  articleCardContent: {
    padding: 20,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  articleMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 12,
    color: '#1600ff',
    fontWeight: '500',
  },
  readArticleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1600ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readArticleButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
  },
});

export default Articles;

