import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { FONTS } from "../../../constants/Assets";
import Colors from "app/constants/Colors";
import Vector from "app/assets/vectors";
import TransactionItem from "./items/TransactionItem";

interface IProps {
  item: any[];
  currency?: string;
}

const TransactionCard = ({ item, currency }: IProps) => {
  if (!item || item.length === 0) {
    return (
      <View style={localStyles.container}>
        <View style={localStyles.emptyHero}>
          <Text style={localStyles.emptyHeroTitle}>No Activity Yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      {/* Header removed as requested */}

      {/* List of redesigned items */}
      <View style={localStyles.listWrapper}>
        {item.map((transaction, idx) => (
          <TransactionItem
            key={transaction.TransID || transaction.TransactionID || idx}
            item={transaction}
            index={idx}
            currency={currency}
          />
        ))}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: Colors.background, // Peach color combination background
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  titleText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: Colors.secondary, // Dark elegant walnut color
  },
  listWrapper: {
    backgroundColor: 'transparent',
  },
  emptyHero: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHeroTitle: {
    fontFamily: FONTS.semibold,
    color: '#64748b',
    fontSize: 14,
  }
});

export default TransactionCard;
