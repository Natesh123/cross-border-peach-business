import { View, Text, FlatList, Image, TextProps, SafeAreaView, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { FONTS, SIZES } from "../../../constants/Assets";
import COLORS from "../../../constants/Colors";
import { ITransaction } from "types";
import TransactionItem from "./items/TransactionItem";
import Vector from "app/assets/vectors";
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from "react-native-popup-menu";

interface IProps {
  item: any[];
}

const TransactionCard = ({ item }: IProps) => {
  if (!item || item.length === 0) return null;

  return (
    <View style={localStyles.container}>
      {/* 💳 Individual Activity Cards */}
      {item.map((txn, idx) => (
        <TransactionItem
          key={txn.TransID || idx}
          item={txn}
          variant="standard"
          index={idx}
        />
      ))}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 40,
  },
});

export default TransactionCard;
