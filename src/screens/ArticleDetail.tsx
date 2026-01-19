import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// Components for rich text content
const SectionTitle = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <Text style={[styles.sectionTitle, style]}>{children}</Text>
);

const Paragraph = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <Text style={[styles.paragraph, style]}>{children}</Text>
);

const HeaderOne = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <Text style={[styles.h1, style]}>{children}</Text>
);

const HeaderTwo = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <Text style={[styles.h2, style]}>{children}</Text>
);

const HeaderThree = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <Text style={[styles.h3, style]}>{children}</Text>
);

// Article Content Components
const ArticleOneContent = ({ navigate }: { navigate: any }) => (
  <View>
    <Paragraph style={styles.introText}>
      You care about clean water, education, climate action, animal welfare, and mental health support. <Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold' }}>But supporting all of them feels impossible.</Text>
    </Paragraph>
    <Paragraph style={styles.introText}>
      Here's the truth most people face: <Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold' }}>You care about everything, but you give to nothing.</Text>
    </Paragraph>
    <Paragraph>
      The problem isn't that you don't want to help. It's that managing multiple donations is complicated. Different websites, multiple charges, scattered tax receipts. The friction stops you before you start.
    </Paragraph>

    <HeaderTwo>5 Ways to Support Multiple Charities</HeaderTwo>

    {/* 1. Individual Recurring Donations */}
    <View style={styles.sectionDivider}>
      <HeaderThree>1. Individual Recurring Donations</HeaderThree>
      <Paragraph>Set up separate monthly donations on each nonprofit's website.</Paragraph>
      <Paragraph style={{ marginBottom: 4 }}>
        <Text style={styles.emeraldBold}>Good for:</Text> 2-3 charities maximum
      </Paragraph>
      <Paragraph>
        <Text style={styles.redBold}>Downside:</Text> Multiple charges and administrative work
      </Paragraph>
    </View>

    {/* 2. Donor-Advised Funds */}
    <View style={styles.sectionDivider}>
      <HeaderThree>2. Donor-Advised Funds (DAFs)</HeaderThree>
      <Paragraph>Contribute to a fund (like Fidelity Charitable), get a tax deduction, then grant to charities over time.</Paragraph>
      <Paragraph style={{ marginBottom: 4 }}>
        <Text style={styles.emeraldBold}>Good for:</Text> Donors giving $5,000+ annually
      </Paragraph>
      <Paragraph>
        <Text style={styles.redBold}>Downside:</Text> High minimums and complexity
      </Paragraph>
    </View>

    {/* 3. Workplace Giving Programs */}
    <View style={styles.sectionDivider}>
      <HeaderThree>3. Workplace Giving Programs</HeaderThree>
      <Paragraph>Many employers match donations and allow payroll deductions to multiple nonprofits.</Paragraph>
      <Paragraph style={{ marginBottom: 4 }}>
        <Text style={styles.emeraldBold}>Good for:</Text> Employees with matching programs
      </Paragraph>
      <Paragraph>
        <Text style={styles.redBold}>Downside:</Text> Limited to employer's approved charities
      </Paragraph>
    </View>

    {/* 4. Giving Collectives */}
    <View style={styles.sectionDivider}>
      <HeaderThree>4. Giving Collectives</HeaderThree>
      <Paragraph>Join a group of people pooling donations together for shared causes. Your contribution combines with others for greater impact.</Paragraph>
      <Paragraph style={{ marginBottom: 4 }}>
        <Text style={styles.emeraldBold}>Good for:</Text> People who want community and collective power
      </Paragraph>
      <Paragraph>
        <Text style={styles.redBold}>Downside:</Text> Less control over individual nonprofit selection
      </Paragraph>
    </View>

    {/* 5. Donation Box Platforms */}
    <View style={{ marginBottom: 32 }}>
      <HeaderThree>5. Donation Box Platforms (like CRWD)</HeaderThree>
      <Paragraph>Choose any nonprofits you want and manage them all in one place with a single monthly payment.</Paragraph>
      <Paragraph style={{ marginBottom: 4 }}>
        <Text style={styles.emeraldBold}>Good for:</Text> Anyone who wants flexibility and simplicity
      </Paragraph>
      <Paragraph>
        <Text style={styles.emeraldBold}>Benefit:</Text> Full control, easy management, transparent tracking
      </Paragraph>
    </View>

    <HeaderTwo>How to Get Started in 4 Steps</HeaderTwo>

    <View style={styles.grayCard}>
      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#1E40AF' }]}>
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>List Your Causes</HeaderThree>
          <Text style={styles.stepText}>Write down the causes you care about most (environment, education, health, etc.)</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#A855F7' }]}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Set Your Budget</HeaderThree>
          <Text style={styles.stepText}>Decide your monthly amount (even $10/month = $120/year of impact)</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#FF3366' }]}>
          <Text style={styles.stepNumber}>3</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Find Nonprofits</HeaderThree>
          <Text style={styles.stepText}>Browse verified nonprofits using tools like Charity Navigator or CRWD's curated directory</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#ADFF2F' }]}>
          <Text style={[styles.stepNumber, { color: '#000' }]}>4</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Automate Your Giving</HeaderThree>
          <Text style={styles.stepText}>Set up recurring donations so giving becomes effortless and consistent</Text>
        </View>
      </View>
    </View>

    <View style={styles.quoteBox}>
      <Paragraph style={{ color: '#1f2937' }}>
        <Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold' }}>The goal isn't perfection. It's consistency.</Text> Start smaller than you think. You can always adjust later.
      </Paragraph>
    </View>

    <HeaderTwo>Common Questions</HeaderTwo>

    <View style={styles.sectionDivider}>
      <HeaderThree>"Is my small donation actually making a difference?"</HeaderThree>
      <Paragraph>Yes. $5/month provides 60 meals per year at food banks. Small recurring donations are more valuable to nonprofits than sporadic large gifts.</Paragraph>
    </View>

    <View style={styles.sectionDivider}>
      <HeaderThree>"What about platform fees?"</HeaderThree>
      <Paragraph>All donations have fees (credit cards charge 2.2-2.9%). CRWD's fee is 10%, with 90% going directly to your nonprofits. The convenience often means you give more overall, increasing net impact.</Paragraph>
    </View>

    <View style={{ marginBottom: 32 }}>
      <HeaderThree>"Can I change which charities I support?"</HeaderThree>
      <Paragraph>Yes. With platforms like CRWD, you can add or remove nonprofits anytime. Your causes evolve, and your giving should too.</Paragraph>
    </View>

    <View style={styles.blueBanner}>
      <HeaderTwo style={{ color: 'white', textAlign: 'center' }}>Start Today</HeaderTwo>
      <Paragraph style={{ color: '#cbd5e1', textAlign: 'center', marginBottom: 24 }}>
        The tools now exist to make supporting multiple charities effortless. The question isn't "Can I afford to give?" but rather "Can I afford not to become someone who shows up?"
      </Paragraph>
      <TouchableOpacity
        style={styles.whiteButton}
        onPress={() => navigate('Search' as never)}
      >
        <Text style={styles.blueButtonText}>Start Your Donation Box</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ArticleTwoContent = ({ navigate }: { navigate: any }) => (
  <View>
    <Text style={styles.italicQuote}>"$5 won't make a difference."</Text>

    <Paragraph style={styles.introText}>
      That's what most <Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold' }}>people</Text> think when they consider donating. They imagine their small contribution disappearing into a void, too insignificant to matter.
    </Paragraph>
    <Paragraph style={styles.introText}>
      But here's what they don't realize: Small donations are the lifeblood of nonprofit work. They're not just helpful, they're essential.
    </Paragraph>

    <HeaderTwo>The Real Impact of Small Donations</HeaderTwo>
    <Paragraph>Let's put actual numbers to what small donations can do:</Paragraph>

    <View style={styles.borderedCard}>
      <View style={styles.sectionDivider}>
        <Text style={[styles.h3, { color: '#2563EB' }]}>$5/month</Text>
        <Paragraph>Provides clean water access for one person for an entire year</Paragraph>
      </View>
      <View style={styles.sectionDivider}>
        <Text style={[styles.h3, { color: '#9333EA' }]}>$10/month</Text>
        <Paragraph>Feeds a family of four for a week through food banks</Paragraph>
      </View>
      <View style={styles.sectionDivider}>
        <Text style={[styles.h3, { color: '#EC4899' }]}>$15/month</Text>
        <Paragraph>Supplies school materials for three children in need</Paragraph>
      </View>
      <View>
        <Text style={[styles.h3, { color: '#84CC16' }]}>$25/month</Text>
        <Paragraph>Covers basic medical care for two people in underserved communities</Paragraph>
      </View>
    </View>

    <Paragraph>
      These aren't theoretical numbers. They're real outcomes from organizations doing real work. Your small donation isn't a drop in the ocean, it's a ripple that creates waves.
    </Paragraph>

    <HeaderTwo>The Power of Collective Giving</HeaderTwo>
    <Paragraph>Small donations become transformative when combined with others:</Paragraph>

    <View style={styles.grayCard}>
      <HeaderThree>The Math of Collective Impact</HeaderThree>
      <View style={styles.bulletItem}>
        <Text style={styles.bulletText}>• 100 people × $10/month = <Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold' }}>$12,000/year</Text></Text>
      </View>
      <View style={styles.bulletItem}>
        <Text style={styles.bulletText}>• 1,000 people × $10/month = <Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold' }}>$120,000/year</Text></Text>
      </View>
      <View style={styles.bulletItem}>
        <Text style={styles.bulletText}>• 10,000 people × $10/month = <Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold' }}>$1.2 million/year</Text></Text>
      </View>
    </View>

    <Paragraph>Your $10 doesn't stand alone. It joins thousands of other donations to fund entire programs, build infrastructure, and create lasting change.</Paragraph>

    <HeaderTwo>Why Nonprofits Prefer Small Recurring Donors</HeaderTwo>
    <Paragraph>You might think nonprofits only care about big donors. The reality is different:</Paragraph>

    <View style={styles.grayCard}>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}><Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold', color: '#000' }}>Predictable revenue:</Text> Recurring donations let nonprofits plan programs months in advance</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}><Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold', color: '#000' }}>Lower risk:</Text> 1,000 small donors are more sustainable than 10 large donors</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}><Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold', color: '#000' }}>Community building:</Text> Small donors often become advocates and volunteers</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}><Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold', color: '#000' }}>Long-term value:</Text> A $10/month donor over 5 years contributes $600 in total impact</Text>
      </View>
    </View>

    <HeaderTwo>Start Small, Think Big</HeaderTwo>
    <Paragraph>Ready to become a small donor who makes a big impact?</Paragraph>

    <View style={{ marginBottom: 32 }}>
      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#1E40AF' }]}>
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Pick an amount that won't stress you</HeaderThree>
          <Text style={styles.stepText}>It's better to give $5 consistently than $50 once and never again.</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#A855F7' }]}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Choose causes that resonate with you</HeaderThree>
          <Text style={styles.stepText}>You'll stick with giving when it's connected to your values.</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#FF3366' }]}>
          <Text style={styles.stepNumber}>3</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Make it automatic</HeaderThree>
          <Text style={styles.stepText}>Set up recurring donations so you don't have to think about it each month.</Text>
        </View>
      </View>
    </View>

    <View style={styles.blueBanner}>
      <HeaderTwo style={{ color: 'white' }}>Your Small Donation Matters</HeaderTwo>
      <Paragraph style={{ color: '#cbd5e1' }}>
        Every movement starts with individuals making small choices. Climate action, civil rights, public health all began with people contributing what they could, when they could.
      </Paragraph>
      <Text style={[styles.h3, { color: 'white', marginBottom: 24 }]}>
        Your $5, $10, or $25 per month is a declaration that you show up for the world you want to see.
      </Text>
      <TouchableOpacity
        style={[styles.whiteButton, { width: '100%' }]}
        onPress={() => navigate('Search' as never)}
      >
        <Text style={styles.blueButtonText}>Start Giving Today</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ArticleThreeContent = ({ navigate }: { navigate: any }) => (
  <View>
    <Paragraph style={styles.introText}>
      Imagine having the giving power of 100 people without spending more than you already planned to donate.
    </Paragraph>
    <Paragraph style={styles.introText}>
      That's the magic of a CRWD Collective.
    </Paragraph>
    <Paragraph style={styles.introText}>
      A Collective is a group of people who pool their monthly donations together to support multiple nonprofits at once. Think of it as a giving circle, but automated, transparent, and built for modern donors.
    </Paragraph>

    <HeaderTwo>How Collectives Work</HeaderTwo>
    <Paragraph>
      Every Collective on CRWD is built around a shared purpose, whether that's protecting the ocean, advancing education, supporting mental health, or any cause that matters to you.
    </Paragraph>

    <View style={styles.grayCard}>
      <HeaderThree>Here's how it works in 3 simple steps:</HeaderThree>

      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#1E40AF' }]}>
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Join (or create) a Collective</HeaderThree>
          <Text style={styles.stepText}>Browse Collectives by cause, join one that aligns with your values, or create your own.</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#A855F7' }]}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Set your monthly amount</HeaderThree>
          <Text style={styles.stepText}>Choose what you can afford. Your donation gets split evenly among the Collective's nonprofits.</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, { backgroundColor: '#FF3366' }]}>
          <Text style={styles.stepNumber}>3</Text>
        </View>
        <View style={{ flex: 1 }}>
          <HeaderThree style={{ marginTop: 0 }}>Watch the impact grow</HeaderThree>
          <Text style={styles.stepText}>As more people join your Collective, you'll see the total monthly giving grow.</Text>
        </View>
      </View>
    </View>

    <HeaderTwo>A Real Example</HeaderTwo>
    <Paragraph>
      Let's say you care about ocean conservation. You join the <Text style={{ fontWeight: '700', fontFamily: 'Outfit-Bold' }}>"Team Ocean Cleanup"</Text> Collective.
    </Paragraph>

    <View style={styles.borderedCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.labelSmall}>YOUR MONTHLY DONATION:</Text>
          <Text style={[styles.h3, { color: '#2563EB', marginTop: 4 }]}>$10/month</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.labelSmall}>COLLECTIVE MEMBERS:</Text>
          <Text style={[styles.h3, { color: '#A855F7', marginTop: 4 }]}>150 people</Text>
        </View>
      </View>

      <View style={[styles.grayCard, { padding: 16, marginBottom: 16 }]}>
        <Text style={styles.labelSmall}>COLLECTIVE IMPACT:</Text>
        <Text style={[styles.h2, { marginTop: 4, marginBottom: 4 }]}>$1,500/month</Text>
        <Text style={styles.smallText}>$18,000 per year going to ocean conservation</Text>
      </View>

      <Text style={styles.paragraphSmall}>
        The Collective supports 5 verified ocean nonprofits, so each organization receives <Text style={{ fontWeight: 'bold', color: '#000' }}>$300/month</Text> from your group.
      </Text>
    </View>

    <Paragraph>
      Your $10 helped five nonprofits, and you donated as part of a movement of 150 people who care about the same cause.
    </Paragraph>

    <HeaderTwo>Why Join a Collective?</HeaderTwo>
    <Paragraph>You could donate on your own. But here's what you get when you join a Collective:</Paragraph>

    <View style={styles.borderedCard}>
      <HeaderThree>Curated nonprofits</HeaderThree>
      <Paragraph style={{ marginBottom: 0 }}>Every Collective selects high-impact nonprofits, so you don't have to do hours of research.</Paragraph>
    </View>
    <View style={[styles.borderedCard, { marginTop: 16 }]}>
      <HeaderThree>Community & belonging</HeaderThree>
      <Paragraph style={{ marginBottom: 0 }}>Connect with like-minded people who share your values and inspire each other.</Paragraph>
    </View>
    <View style={[styles.borderedCard, { marginTop: 16 }]}>
      <HeaderThree>Amplified impact</HeaderThree>
      <Paragraph style={{ marginBottom: 0 }}>Your donation becomes part of a larger pool, which means nonprofits receive more predictable funding.</Paragraph>
    </View>

    <HeaderTwo>Can I Create My Own Collective?</HeaderTwo>
    <Paragraph>Absolutely! Creating a Collective takes just a few minutes.</Paragraph>

    <View style={styles.grayCard}>
      <HeaderThree>When you create a Collective, you:</HeaderThree>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}>Choose the cause or theme</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}>Select nonprofits to support</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}>Share with friends to join</Text>
      </View>
    </View>

    <HeaderTwo>Complete Transparency</HeaderTwo>
    <Paragraph>One of the biggest concerns donors have is: "Where does my money actually go?"</Paragraph>

    <View style={styles.quoteBox}>
      <HeaderThree>With CRWD Collectives, you always know:</HeaderThree>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}>Exactly which nonprofits receive your donation</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}>How much each nonprofit receives</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.blueBullet}>•</Text>
        <Text style={styles.listText}>The total impact your Collective is making</Text>
      </View>
    </View>

    <View style={styles.blueBanner}>
      <HeaderTwo style={{ color: 'white' }}>Your Collective is Waiting</HeaderTwo>
      <Paragraph style={{ color: '#cbd5e1' }}>
        Browse Collectives by cause, see how many members each has, and find the community that aligns with your values. Or create your own and become the change you want to see.
      </Paragraph>
      <TouchableOpacity
        style={[styles.whiteButton, { width: '100%', marginBottom: 12 }]}
        onPress={() => navigate('Search' as never)}
      >
        <Text style={styles.blueButtonText}>Browse Collectives</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.outlineButton, { width: '100%' }]}
        onPress={() => navigate('CreateCRWD' as never)}
      >
        <Text style={styles.outlineButtonText}>Create a Collective</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ArticleDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id?: number };

  // Map IDs to specific content components
  const getArticleContent = (articleId: number | undefined) => {
    switch (String(articleId)) {
      case '1':
        return <ArticleOneContent navigate={navigation.navigate} />;
      case '2':
        return <ArticleTwoContent navigate={navigation.navigate} />;
      case '3':
        return <ArticleThreeContent navigate={navigation.navigate} />;
      default:
        return <ArticleOneContent navigate={navigation.navigate} />;
    }
  };

  const articleDetails: Record<string, any> = {
    '1': {
      title: 'How to Donate to Multiple Charities at Once',
      date: 'November 9, 2025',
      readTime: '6 min read',
      author: 'CRWD Team',
    },
    '2': {
      title: 'Why Small Donations Matter',
      date: 'November 10, 2025',
      readTime: '4 min read',
      author: 'CRWD Team',
    },
    '3': {
      title: 'What is a CRWD Collective?',
      date: 'November 11, 2025',
      readTime: '5 min read',
      author: 'CRWD Team',
    },
  };

  const currentArticle = articleDetails[String(id || '1')] || articleDetails['1'];

  const getRelatedArticles = (currentId: string) => {
    const allIds = ['1', '2', '3'];
    return allIds.filter(itemId => itemId !== currentId).map(itemId => ({
      id: itemId,
      ...articleDetails[itemId]
    }));
  };

  const relatedArticles = getRelatedArticles(String(id || '1'));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#f1f6ff', '#f9f6ff', '#fbf5fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <SafeAreaView edges={['top']}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeft size={20} color="#4B5563" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.mainTitle}>{currentArticle.title}</Text>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataText}>{currentArticle.date}</Text>
                <Text style={styles.metadataText}>•</Text>
                <Text style={styles.metadataText}>{currentArticle.readTime}</Text>
                <Text style={styles.metadataText}>•</Text>
                <Text style={styles.metadataText}>By {currentArticle.author}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Article Body */}
        <View style={styles.bodyContainer}>
          {getArticleContent(id)}
        </View>

        {/* Related Articles */}
        <View style={styles.relatedSection}>
          <HeaderTwo>Related Articles</HeaderTwo>
          <View style={styles.relatedGrid}>
            {relatedArticles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.relatedCard}
                onPress={() => (navigation as any).navigate('ArticleDetail', { id: article.id })}
              >
                <HeaderThree style={{ marginBottom: 4 }}>{article.title}</HeaderThree>
                <Text style={styles.smallText}>{article.readTime}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  gradientHeader: {
    width: '100%',
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  headerContent: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800', // ExtraBold
    color: '#000',
    marginBottom: 16,
    lineHeight: 38,
    fontFamily: 'Outfit-Bold',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  h1: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    fontFamily: 'Outfit-Bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 32,
    marginBottom: 20,
    fontFamily: 'Outfit-Bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-Bold',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    marginBottom: 20,
    fontFamily: 'Outfit-Regular',
  },
  paragraphSmall: {
    fontSize: 14,
    lineHeight: 24,
    color: '#4B5563',
    fontFamily: 'Outfit-Regular',
  },
  introText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 24,
    lineHeight: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 24,
    marginBottom: 24,
  },
  emeraldBold: {
    color: '#10B981', // emerald-500
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
  redBold: {
    color: '#EF4444', // red-500
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
  grayCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 32,
  },
  quoteBox: {
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: '#0F172A', // slate-900
    padding: 20,
    marginBottom: 32,
    marginTop: 12,
    borderRadius: 8,
  },
  blueBanner: {
    backgroundColor: '#0F172A', // slate-900
    borderRadius: 16,
    padding: 24,
    marginTop: 32,
    marginBottom: 48,
    alignItems: 'center',
  },
  whiteButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 100,
    alignItems: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 100,
    alignItems: 'center',
  },
  blueButtonText: {
    color: '#1600ff',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  outlineButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumber: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  stepText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  italicQuote: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 24,
    fontFamily: 'Outfit-Regular',
  },
  borderedCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  bulletItem: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 16,
    color: '#374151',
  },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  blueBullet: {
    color: '#2563EB',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 14,
    color: '#6B7280',
  },
  relatedSection: {
    paddingHorizontal: 16,
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  relatedGrid: {
    gap: 16,
  },
  relatedCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default ArticleDetail;