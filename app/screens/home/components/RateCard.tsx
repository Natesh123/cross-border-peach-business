import { View, FlatList, TouchableOpacity, Text, useWindowDimensions, StyleSheet, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { FONTS } from "../../../constants/Assets";
import { GetQuickWatchList } from "app/http-services";
import { ProfileState } from "app/atoms";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RateItem from "./items/RateItem";
import Vector from "app/assets/vectors";
import { RFValue } from "react-native-responsive-fontsize";

const RateCard = () => {
  const currentToken = useRecoilValue(ProfileState);
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [watchList, setWatchList] = useState<any[]>([]);

  const fallbackList = [
    {
      id: 1,
      fromRate: "1",
      fromCurrency: "GBP",
      toRate: "110.99",
      toCurrency: "INR",
      countryCode: "IND",
      countryflag: "IN",
    },
    {
      id: 2,
      fromRate: "1",
      fromCurrency: "GBP",
      toRate: "433.32",
      toCurrency: "LKR",
      countryCode: "LKA",
      countryflag: "LK",
    },
  ];

  useEffect(() => {
    if (isFocused) fetchQuickWatchList();
  }, [isFocused]);

  const fetchQuickWatchList = async () => {
    try {
      const req = { RemitterID: currentToken?.remitterId };
      const response = await GetQuickWatchList(req);

      if (
        response.data.StatusCode === "ER0000" &&
        Array.isArray(response.data.Quickwatchdetail)
      ) {
        const mapped = response.data.Quickwatchdetail.map((x: any, index: number) => ({
          id: index + 1,
          fromRate: "1",
          fromCurrency: "GBP",
          toRate: x.ExchangeCheckRate?.toString() ?? "0",
          toCurrency: x.ToCurrency,
          countryCode: x.ToCountryCode,
          countryflag: x.ToCountryCode === 'IND' ? 'IN' : x.ToCountryCode === 'LKA' ? 'LK' : x.ToCountryCode,
        }));

        setWatchList(mapped);
      } else {
        setWatchList([]);
      }
    } catch (error) {
      console.log("Error:", error);
      setWatchList([]);
    }
  };

  const finalData = watchList.length > 0 ? watchList : fallbackList;

  const onSelectCountry = async (code: string) => {
    try {
      await AsyncStorage.setItem("selectedRecipientCurrency", code);
      navigation.navigate("SendMoney");
    } catch (error) {
      console.log("AsyncStorage Error:", error);
    }
  };

  return (
    <View style={localStyles.container}>
      <View style={localStyles.header}>
        <View style={localStyles.titleSection}>
          <View style={localStyles.badgeContainer}>
            <View style={localStyles.badgePulse} />
            <Text style={localStyles.preTitle}>LIVE RATES</Text>
          </View>
          <Text style={localStyles.title}>Exchange Rates</Text>
        </View>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={finalData}
        keyExtractor={(item) => `${item.id}`}
        contentContainerStyle={localStyles.listContent}
        snapToInterval={width * 0.72 + 15}
        decelerationRate="fast"
        snapToAlignment="start"
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => onSelectCountry(item.countryCode)}
            activeOpacity={0.9}
          >
            <RateItem
              {...item}
              columnIndex={index}
              totalColumns={finalData.length}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    gap: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF8E72',
  },
  preTitle: {
    fontSize: RFValue(10),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: RFValue(22),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    letterSpacing: -0.5,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  viewAllTxt: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  arrowIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FCF5F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 25,
    paddingBottom: 10,
  }
});

export default RateCard;
