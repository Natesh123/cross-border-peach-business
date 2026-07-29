import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, ScrollView } from "react-native";
import React from "react";
import { FONTS, SIZES } from "../../../constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import Vector from "app/assets/vectors";
import TransactionItem from "./items/TransactionItem";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";

interface IProps {
  item: any[];
  currency?: string;
}

const TransactionCard = ({ item, currency }: IProps) => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  if (!item || item.length === 0) {
    return (
      <View style={localStyles.container}>
        <View style={localStyles.emptyHero}>
          <LinearGradient
            colors={['rgba(255, 142, 114, 0.1)', 'rgba(255, 142, 114, 0.02)']}
            style={localStyles.emptyCircle}
          >
            <Vector as="ionicons" name="sparkles" size={32} color="#FF8E72" />
          </LinearGradient>
          <Text style={localStyles.emptyHeroTitle}>No Activity Yet</Text>
          <Text style={localStyles.emptyHeroSub}>Transfer money to see your transactions show up here.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      {/* MINIMALIST ARCHIVE HEADER */}
      <View style={localStyles.galleryHeader}>
        <View>
          <Text style={localStyles.gallerySub}>TRANSACTIONS</Text>
          <Text style={localStyles.galleryTitle}>History</Text>
        </View>

        <View style={localStyles.galleryActions}>
          <TouchableOpacity style={localStyles.iconCircleAtm}>
            <Vector as="feather" name="search" size={16} color="#3B2F2F" />
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.iconCircleAtm}>
            <Vector as="feather" name="sliders" size={16} color="#3B2F2F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* PANORAMIC DECK (Horizontal Scroll) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.panoramaRail}
        snapToInterval={width * 0.85}
        decelerationRate="fast"
      >
        {item.slice(0, 3).map((transaction, idx) => (
          <View key={transaction.TransactionID || idx} style={localStyles.panoramaItem}>
            <TransactionItem
              item={transaction}
              index={idx}
              variant="hero"
              currency={currency}
            />
          </View>
        ))}

      </ScrollView>

      {/* UTILITY ANALYTICS GRID */}
      <View style={localStyles.utilityGrid}>
        <View style={localStyles.gridColLeft}>
          <LinearGradient
            colors={['#FF8E72', '#FC6D41']}
            style={localStyles.analyticsBento}
          >
            <View style={localStyles.bentoTop}>
              <Text style={localStyles.bentoLabelPeach}>TOTAL OUTFLOW</Text>
              <Vector as="feather" name="arrow-up-right" size={12} color="#FFF" />
            </View>
            <Text style={localStyles.bentoValuePeach}>{currency}2,450.00</Text>
            <View style={localStyles.bentoGlowPeach} />
          </LinearGradient>
        </View>

        <View style={localStyles.gridColRight}>
          <View style={localStyles.statBento}>
            <View style={localStyles.statBentoHeader}>
              <View style={localStyles.statDotAtm} />
              <Text style={localStyles.statBentoTitle}>BENEFICIARIES</Text>
            </View>
            <Text style={localStyles.statBentoMain}>12</Text>
            <Text style={localStyles.statBentoSub}>Active users</Text>
          </View>

          <View style={localStyles.sparklineBento}>
            {/* Minimal Bars */}
            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
              <View key={i} style={[localStyles.sparkBarAtm, { height: `${h * 100}%` }]} />
            ))}
          </View>
        </View>
      </View>

      {/* EARLIER STREAM (Minimalist Typography) */}
      <View style={localStyles.typographyFeed}>
        <Text style={localStyles.feedLabelAtm}>Earlier Transactions</Text>
        <View style={localStyles.feedStackAtm}>
          {item.slice(3, 7).map((transaction, idx) => (
            <TransactionItem
              key={transaction.TransactionID || idx}
              item={transaction}
              index={idx + 3}
              variant="minimal"
              currency={currency}
            />
          ))}
        </View>
      </View>
    </View >
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingBottom: 60,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 10,
  },
  gallerySub: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    letterSpacing: 2.5,
  },
  galleryTitle: {
    fontSize: RFValue(30),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: -1,
  },
  galleryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircleAtm: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 114, 0.2)',
  },
  panoramaRail: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 30,
  },
  panoramaItem: {
    width: 320,
  },
  spatialEnd: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  endCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 6 },
    }),
  },
  endText: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
  },
  utilityGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  gridColLeft: {
    flex: 1.2,
    gap: 12,
  },
  gridColRight: {
    flex: 1,
    gap: 12,
  },
  analyticsBento: {
    borderRadius: 32,
    padding: 20,
    height: 172,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bentoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoLabelPeach: {
    fontSize: RFValue(8.5),
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  bentoValuePeach: {
    fontSize: RFValue(20),
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  bentoGlowPeach: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  quickActionBento: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.03)',
  },
  actionLabel: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  statBento: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 20,
    height: 110,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.03)',
  },
  statBentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDotAtm: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF8E72',
  },
  statBentoTitle: {
    fontSize: RFValue(8.5),
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 1,
  },
  statBentoMain: {
    fontSize: RFValue(24),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  statBentoSub: {
    fontSize: RFValue(9),
    fontFamily: FONTS.medium,
    color: '#A19188',
  },
  sparklineBento: {
    backgroundColor: 'rgba(255,142,114,0.05)',
    borderRadius: 20,
    height: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  sparkBarAtm: {
    width: 4,
    backgroundColor: '#FF8E72',
    borderRadius: 2,
    opacity: 0.3,
  },
  typographyFeed: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  feedLabelAtm: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: 'rgba(59, 47, 47, 0.2)',
    marginBottom: 16,
  },
  feedStackAtm: {
    gap: 12,
  },
  emptyHero: {
    padding: 60,
    alignItems: 'center',
    gap: 20,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHeroTitle: {
    fontSize: RFValue(20),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  emptyHeroSub: {
    fontSize: RFValue(12),
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    textAlign: 'center',
    lineHeight: 20,
  }
});

export default TransactionCard;
