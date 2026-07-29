import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  Dimensions,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SIZES } from "app/constants/Assets";
import COLORS from "app/constants/Colors";
import Vector from "app/assets/vectors";
import { RFValue } from "react-native-responsive-fontsize";

const { width } = Dimensions.get('window');

const Faq = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    setLoading(false);
  }, []);

  const faqData = [
    { id: 1, category: "General", question: "What is money remittance?", answer: "Money remittance is the process of sending money from one place to another, typically across borders.", icon: "earth" },
    { id: 2, category: "Process", question: "How do I send money using this platform?", answer: "You can send money by signing up, verifying your identity, and selecting your recipient and amount.", icon: "send" },
    { id: 3, category: "Coverage", question: "Which countries can I send money to?", answer: "We support over 50 countries. The list is available during the send money process.", icon: "map-marker" },
    { id: 4, category: "Security", question: "What documents are required for verification?", answer: "You’ll need to provide a valid government-issued ID and sometimes proof of address. Accepted formats: JPG, JPEG, PNG, or PDF, with a max file size of 2MB.", icon: "shield-check" },
    { id: 5, category: "Timing", question: "How long does the transfer take?", answer: "Transfers usually complete within minutes to 2 business days depending on the country and method.", icon: "clock-outline" },
    { id: 6, category: "Fees", question: "Are there any fees?", answer: "Fees depend on the country, currency, and transfer method. You’ll see the fee before confirming.", icon: "currency-usd" },
    { id: 7, category: "Security", question: "Is my money safe?", answer: "Yes. We use encrypted secure transactions and comply with financial regulations.", icon: "lock-outline" },
    { id: 8, category: "Tracking", question: "Can I track my transfer?", answer: "Yes. You can view real-time status from your dashboard after sending money.", icon: "radar" },
    { id: 9, category: "Coverage", question: "What currencies are supported?", answer: "We support major global currencies including USD, GBP, EUR, INR, and more.", icon: "cash-multiple" },
  ];

  const categories = ["All", ...new Set(faqData.map(item => item.category))];

  const filteredFaq = useMemo(() => {
    return faqData.filter(item => {
      const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ULTRA-PREMIUM CURVED HEADER */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#2C1810', '#4A2C1F']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Help Center</Text>
              <View style={{ width: 40 }} /> 
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.heroText}>How can we help you today?</Text>
              
              {/* Floating Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#A19188" />
                <TextInput
                  placeholder="Search for answers..."
                  placeholderTextColor="#A19188"
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  underlineColorAndroid="transparent"
                />
                {searchQuery !== "" && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#A19188" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.headerCurve} />
      </View>

      {/* CATEGORY NAV */}
      <View style={styles.catNavContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catNavContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.catPill,
                selectedCategory === cat && styles.activeCatPill
              ]}
            >
              <Text style={[
                styles.catText,
                selectedCategory === cat && styles.activeCatText
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={'#FF8E72'} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <View key={item.id} style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={[styles.card, isExpanded && styles.expandedCard]}
                    activeOpacity={0.7}
                    onPress={() => toggleExpand(index)}
                  >
                    <View style={styles.cardRow}>
                      <View style={[styles.iconBox, { backgroundColor: isExpanded ? '#FF8E72' : '#F7F1EE' }]}>
                        <MaterialCommunityIcons 
                          name={item.icon as any} 
                          size={20} 
                          color={isExpanded ? '#FFF' : '#2C1810'} 
                        />
                      </View>
                      <View style={styles.cardMain}>
                        <Text style={styles.cardCategory}>{item.category}</Text>
                        <Text style={styles.cardQuestion}>{item.question}</Text>
                      </View>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={18} 
                        color={isExpanded ? "#FF8E72" : "#DBCAC0"} 
                      />
                    </View>

                    {isExpanded && (
                      <View style={styles.answerBox}>
                        <View style={styles.divider} />
                        <Text style={styles.answerText}>{item.answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="text-search-variant" size={60} color="#DBCAC0" />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySub}>Try searching for something else</Text>
            </View>
          )}

          {/* PREMIUM SUPPORT HUB */}
          <LinearGradient
            colors={['#FFF', '#FDF8F5']}
            style={styles.supportHub}
          >
            <View style={styles.supportHeader}>
              <View style={styles.supportIconBg}>
                <Ionicons name="chatbubbles" size={24} color="#FF8E72" />
              </View>
              <View>
                <Text style={styles.supportTitle}>Still need help?</Text>
                <Text style={styles.supportSub}>Our team is here 24/7</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.chatBtn}>
              <LinearGradient
                colors={['#2C1810', '#3D261C']}
                style={styles.chatGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.chatBtnText}>Start Live Chat</Text>
                <Feather name="arrow-right" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      )}
    </View>
  );
};

export default Faq;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF5F1",
  },
  // Header
  headerContainer: {
    height: 280,
    position: 'relative',
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  safeArea: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'android' ? 40 : 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerContent: {
    marginTop: 30,
  },
  heroText: {
    fontSize: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#FFF',
    marginBottom: 20,
    lineHeight: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#2C1810',
    borderWidth: 0,
    // @ts-ignore
    outlineStyle: 'none',
  },
  headerCurve: {
    position: 'absolute',
    bottom: -1,
    width: '100%',
    height: 30,
    backgroundColor: '#FCF5F1',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  // Category Nav
  catNavContainer: {
    marginTop: -10,
    marginBottom: 10,
  },
  catNavContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  catPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.05)',
  },
  activeCatPill: {
    backgroundColor: '#2C1810',
    borderColor: '#2C1810',
  },
  catText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: '#A19188',
  },
  activeCatText: {
    color: '#FFF',
  },
  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.05)',
    ...Platform.select({
      ios: { shadowColor: '#2C1810', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  expandedCard: {
    borderColor: 'rgba(255, 142, 114, 0.3)',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
    marginLeft: 15,
  },
  cardCategory: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardQuestion: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: '#2C1810',
    lineHeight: 20,
  },
  answerBox: {
    marginTop: 15,
    paddingTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.05)',
    marginBottom: 15,
  },
  answerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#5C4A42',
    lineHeight: 22,
  },
  // Support Hub
  supportHub: {
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#2C1810', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 },
      android: { elevation: 5 },
    }),
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  supportIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 142, 114, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  supportTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#2C1810',
  },
  supportSub: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#A19188',
  },
  chatBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  chatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  chatBtnText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#2C1810',
    marginTop: 15,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#A19188',
    marginTop: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
});