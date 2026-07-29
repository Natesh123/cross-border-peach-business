import React, { useEffect, useState } from "react";
import { Image, Platform, ScrollView, RefreshControl, Text, TextInput, useWindowDimensions, TouchableOpacity, View, StatusBar, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "app/styles";
import HomeHeader from "app/components/HomeHeader";
import Container from "app/theme/Container";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import Vector from "app/assets/vectors";
import { theme } from "app/core/theme";
import Button from "app/components/controls/Button";
import { FONTS, SIZES } from "app/constants/Assets";
import { GetPurposeOfTransaction, GetReceiverInfoList, GetReferDetails } from "app/http-services";
import RecipientItem from "app/screens/recipients/components/items/RecipientItem";
import SendMoneyHeader from "app/components/SendMoneyHeader";
import RecipientHeader from "app/components/RecipientHeader";
import { Ionicons } from "@expo/vector-icons";
import ModalPicker from "app/components/customComponents/ModalPicker";
import { LinearGradient } from "expo-linear-gradient";

const Recipients = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const currentToken = useRecoilValue(ProfileState);

  const [currency, setCurrency] = useState("£");
  const [search, setSearch] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("");
  const [recipientList, setRecipientList] = useState<any>({});
  const [filteredRecipients, setFilteredRecipients] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [purposeList, setPurposeList] = useState<any[]>([]);

  useEffect(() => {
    const _currency = (typeof process !== 'undefined' && process.env && process.env.CURRENCY_SYMBOL) || "£";
    setCurrency(_currency);
    fetchPurposeOfTransaction(currentToken.tokenId, currentToken.remitterId);
    fetchReceiverList(currentToken.tokenId, currentToken.remitterId);
    fetchReferDetails(currentToken.tokenId, currentToken.remitterId);
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceiverList(currentToken.tokenId, currentToken.remitterId).finally(() =>
      setRefreshing(false)
    );
  };

  const fetchPurposeOfTransaction = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetPurposeOfTransaction(tokenId);
      console.log("Response :", response);

      if (response.status === 200 && response.data.POT) {
        const formattedList = response.data.POT
          .filter((item: any) => item.Value_POT !== "0")
          .map((item: any) => ({
            dataValue: item.Value_POT,
            displayvalue: item.Text_POT,
          }));

        setPurposeList(formattedList);
      }
    } catch (err) {
      console.error("Error fetching Purposeoftransaction list:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiverList = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReceiverInfoList(tokenId);
      if (response.status === 200) {
        const _data = response?.data?.ReceiverDetails;

        // ✅ Ensure _data is an array
        if (Array.isArray(_data) && _data.length > 0) {
          const _recipients = _data.reduce((acc: any, curr: any) => {
            if (curr.Country) {
              const { Country } = curr;
              const currentItems = acc[Country];
              return {
                ...acc,
                [Country]: currentItems ? [...currentItems, curr] : [curr],
              };
            }
            return acc;
          }, {});

          setRecipientList(_recipients);
          setFilteredRecipients(_recipients);
        } else {
          // No data or invalid data
          setRecipientList({});
          setFilteredRecipients({});
        }
      }
    } catch (err) {
      console.error("Fetch recipients details:", err);
      setRecipientList({});
      setFilteredRecipients({});
    } finally {
      setLoading(false);
    }
  };


  const fetchReferDetails = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReferDetails(tokenId);
      if (response.status === 200) {
        setReward(response?.data?.Refer?.PotentialEarning);
      }
    } catch (err) {
      console.error("Error refer details:", err);
    } finally {
      setLoading(false);
    }
  };

  const flattenRecipients = (list: any) => {
    return Object.values(list).flat();
  };

  const onSearchRecipients = (text: string) => {
    setSearch({ value: text, error: "" });
    if (!text.trim()) {
      setFilteredRecipients(recipientList);
      return;
    }
    const searchTerm = text.toLowerCase();
    const filtered = Object.keys(recipientList).reduce((acc: any, country) => {
      const filteredCountryRecipients = recipientList[country]?.filter((recipient: any) =>
        `${recipient.FirstName || ""} ${recipient.LastName || ""} ${recipient.ReceiverName || ""}`.toLowerCase().includes(searchTerm)
      );
      if (filteredCountryRecipients.length > 0) {
        acc[country] = filteredCountryRecipients;
      }
      return acc;
    }, {});
    setFilteredRecipients(filtered);
  };

  const onAddRecipient = () => {
    navigation.navigate("AddRecipient");
  };

  const dropdownStyles = {
    label: {
      fontSize: 12,
      color: "#6b6b6b",
      marginBottom: 6,
      marginLeft: 4,
      flex: 0.4
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "#e2e6eb",
      borderRadius: 10,
      backgroundColor: "#FCF5F1",
      paddingHorizontal: 10,
      height: 50,
      justifyContent: "center",
      marginHorizontal: 20,
      marginTop: 10,
    },
    picker: {
      width: "100%",
      color: "#000",
    },
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FCF5F1', flex: 1 }]}>
      <StatusBar barStyle="light-content" />

      {/* Elite Header */}
      <LinearGradient
        colors={['#2C1810', '#3B2F2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={localStyles.headerWrapper}
      >
        <View style={localStyles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={localStyles.backButtonCircle}
          >
            <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
          </TouchableOpacity>
          <View style={localStyles.headerTextContent}>
            <Text style={localStyles.headerTitle}>Select Recipient</Text>
            <Text style={localStyles.headerSubtitle}>Transfer funds securely worldwide</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={localStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={localStyles.mainWrapper}>
          {/* Hero Section */}
          <View style={localStyles.heroSection}>
            <Text style={localStyles.heroTitle}>Who are you sending money to?</Text>
            <Text style={localStyles.heroSubtitle}>
              Select an existing recipient from your list below or add a new one to get started.
            </Text>
          </View>

          {/* Transfer Purpose Card */}
          <View style={localStyles.purposeCard}>
            <View style={localStyles.cardHeader}>
              <View style={localStyles.iconCircle}>
                <Ionicons name="document-text" size={18} color="#FCF5F1" />
              </View>
              <Text style={localStyles.cardLabel}>Purpose of Transaction</Text>
            </View>
            <ModalPicker
              required={true}
              dataList={purposeList}
              selectedValue={selectedPurpose}
              onValueChange={(value) => setSelectedPurpose(value)}
              placeholder="Select Purpose"
            />
          </View>

          {/* Search Row (Full Width) */}
          <View style={localStyles.actionRow}>
            <View style={localStyles.searchBar}>
              <Ionicons name="search" size={20} color="#8E7F77" style={{ marginRight: 10 }} />
              <TextInput
                style={[localStyles.searchInput, { outlineStyle: "none" } as any]}
                placeholder="Search Recipients..."
                placeholderTextColor="#8E7F77"
                value={search.value}
                onChangeText={(text) => onSearchRecipients(text)}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>

          {/* Recipients List Component */}
          <View style={localStyles.listSection}>
            <RecipientItem
              title="India"
              items={flattenRecipients(filteredRecipients)}
              selectedPurpose={selectedPurpose}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button for New Recipient */}
      <TouchableOpacity
        style={localStyles.fabButton}
        onPress={onAddRecipient}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4A3C3C', '#2C1810']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={localStyles.fabGradient}
        >
          <Ionicons name="person-add" size={24} color="#FCF5F1" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTextContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: RFValue(20),
    color: '#FCF5F1',
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: RFValue(11),
    color: 'rgba(252, 245, 241, 0.75)',
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FCF5F1',
  },
  mainWrapper: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: RFValue(16),
    color: '#2C1810',
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: RFValue(11),
    color: '#8E7F77',
    fontFamily: FONTS.regular,
    lineHeight: RFValue(18),
  },
  purposeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C1810',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: RFValue(12),
    color: '#2C1810',
    fontFamily: FONTS.bold,
  },
  pickerSurface: {
    backgroundColor: '#FCF5F1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.08)',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.03)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: '#2C1810',
    fontWeight: '500',
    borderWidth: 0,
  },
  listSection: {
    flex: 1,
  },
  fabButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 28,
    width: 56,
    height: 56,
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 999,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Recipients;

