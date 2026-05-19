import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  StatusBar,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { GetQuickWatchList, AddWatchList, UpdateWatchList } from "app/http-services";
import { MetaService } from "app/services/meta.service";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "app/constants/Colors";
import { FONTS, SIZES, SHADOWS } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";

const { width } = Dimensions.get("window");

const QuickAddWatchlistForm = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const currentToken = useRecoilValue(ProfileState);
  const editItem = route.params?.editItem;

  const [searchText, setSearchText] = useState("");
  const [rateAlertEnabled, setRateAlertEnabled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("1 GBP goes Above");
  const [alertAmount, setAlertAmount] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countryList, setCountryList] = useState<any[]>([]);
  const [countryLists, setCountryLists] = useState<any[]>([]);
  const [topRates, setTopRates] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const quickResponse = await GetQuickWatchList({ RemitterID: currentToken?.remitterId });
        const quickData = quickResponse?.data?.Quickwatchdetail || [];
        setTopRates(quickData.length ? quickData.slice(0, 4) : [
          { CountryFlag: "https://service.kashremit.com/CountryFlags/IND.png", ToCountryName: "India", ToCurrency: "INR", ExchangeCheckRate: 99.87 }
        ]);

        MetaService.fetchCountryMetas(
          false,
          true,
          false,
          (countries: any[]) => {
            let list = countries.map((c: any) => ({
              CountryFlag: `https://flagcdn.com/w40/${c.Alpha_2_Code.toLowerCase()}.png`,
              ToCountryName: c.CountryName,
              ToCurrency: c.CurrencyCode,
              ToCountryCode: c.Alpha_3_Code,
              ExchangeCheckRate: 0,
              ISDCode: c.ISDCode,
            }));

            let filteredList = list.filter(
              (c) => !quickData.some((top: { ToCountryCode: any; }) => top.ToCountryCode === c.ToCountryCode)
            );

            if (editItem) {
              const match = list.find(c => c.ToCountryCode === editItem.ToCountryCode);
              if (match && !filteredList.some(c => c.ToCountryCode === match.ToCountryCode)) {
                filteredList = [match, ...filteredList];
                setSelectedCountry(match);
              }
            }

            setCountryList(list);
            setCountryLists(filteredList);

            if (editItem) {
              setRateAlertEnabled(editItem.AlertFlag === "1");
              if (editItem.ExchangeCheckRate && Number(editItem.AmountAbove) > 0) {
                setSelectedOption("1 GBP goes Above");
                setAlertAmount(editItem.AmountAbove.toString());
              } else if (editItem.ExchangeCheckRate && Number(editItem.AmountBelow) > 0) {
                setSelectedOption("1 GBP goes Below");
                setAlertAmount(editItem.AmountBelow.toString());
              } else {
                setAlertAmount(editItem.ExchangeCheckRate?.toString() || "");
              }
              setSearchText(editItem.ToCountryName || "");
            }

            setLoading(false);
          },
          () => { },
          () => setLoading(false)
        );
      } catch (error) {
        console.error("Error fetching QuickWatchlist or countries:", error);
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleAddWatchlist = async () => {
    if (!selectedCountry) {
      Alert.alert("Select Country", "Please select a country first.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        AlertFlag: rateAlertEnabled ? "1" : "0",
        AmountAbove: selectedOption === "1 GBP goes Above" ? alertAmount : "0",
        AmountBelow: selectedOption === "1 GBP goes Below" ? alertAmount : "0",
        ToCountryCode: selectedCountry.ToCountryCode,
        ToCountryName: selectedCountry.ToCountryName,
        ToCurrency: selectedCountry.ToCurrency,
        RemitterID: currentToken?.remitterId || "",
        QuickWatchID: editItem?.QuickWatchID || "",
      };

      let response;
      if (editItem) {
        response = await UpdateWatchList(payload);
      } else {
        response = await AddWatchList(payload);
      }

      if (response?.data?.StatusMsg === "Success") {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response?.data?.StatusMsg,
          position: 'top',
        });
        navigation.goBack();
      } else {
        Alert.alert("Failed", response?.data?.StatusDesc || "Something went wrong.");
      }
    } catch (error) {
      console.log("Watchlist API Error:", error);
      Alert.alert("Error", "Unable to add/update Quick Watchlist.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countryLists.filter(item =>
    item.ToCountryName.toLowerCase().includes(searchText.toLowerCase()) ||
    item.ToCurrency.toLowerCase().includes(searchText.toLowerCase())
  ).slice(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 🚀 ELITE WALNUT HEADER */}
      <View style={styles.eliteHeader}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonGlass}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
            </TouchableOpacity>

            <View style={styles.headerTitles}>
              <Text style={styles.headerMainTitle}>
                {editItem ? "Edit Watchlist" : "Quick Add"}
              </Text>
              <View style={styles.subtitleRowElite}>
                 <View style={styles.greenPulseDot} />
                 <Text style={styles.headerSubtitleText}>GLOBAL MARKET SYNC</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setCountryDropdownOpen(true)}
              style={styles.currencyPickerBtn}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 14 }}>🇬🇧</Text>
              <Text style={styles.currencyBtnText}>GBP</Text>
              <Feather name="chevron-down" size={14} color="#FCF5F1" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* 📊 LIVE MARKET PULSE */}
        <View style={styles.sectionContainer}>
          <View style={styles.eliteSectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitleText}>LIVE MARKET PULSE</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tickerContainer}>
            {loading && topRates.length === 0 ? (
              <ActivityIndicator size="small" color="#FF8E72" />
            ) : (
              topRates.map((item, index) => (
                <View key={index} style={styles.tickerCardElite}>
                  <View style={styles.tickerFlagBox}>
                    <Image source={{ uri: item.CountryFlag }} style={styles.tickerFlagImg} />
                  </View>
                  <View style={styles.tickerInfoBox}>
                    <Text style={styles.tickerCurrencyText}>{item.ToCurrency}</Text>
                    <Text style={styles.tickerRateText}>{item.ExchangeCheckRate}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* 🎯 TARGET CURRENCY SELECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.eliteSectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitleText}>TARGET CURRENCY</Text>
          </View>

          <View style={[
            styles.searchWrapperElite,
            isSearchFocused && styles.searchWrapperFocused
          ]}>
            <Feather name="search" size={18} color={isSearchFocused ? "#FF8E72" : "rgba(59, 47, 47, 0.4)"} />
            <TextInput
              style={[styles.searchTextInputElite, { outlineStyle: "none" } as any]}
              placeholder="Search country or currency code..."
              placeholderTextColor="rgba(59, 47, 47, 0.3)"
              value={searchText}
              onChangeText={setSearchText}
              editable={!editItem}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Small delay to allow onPress on results to fire
                setTimeout(() => setIsSearchFocused(false), 200);
              }}
              underlineColorAndroid="transparent"
            />
            {searchText.length > 0 && !editItem && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color="rgba(59, 47, 47, 0.2)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Results Popover */}
          {!editItem && isSearchFocused && filteredCountries.length > 0 && (
            <View style={styles.resultsPopoverElite}>
              {filteredCountries.map((item, index) => {
                const isSelected = selectedCountry?.ToCountryCode === item.ToCountryCode;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedCountry(item);
                      setIsSearchFocused(false);
                      setSearchText(item.ToCountryName);
                    }}
                    style={[
                      styles.resultItemElite,
                      isSelected && styles.resultItemActive
                    ]}
                  >
                    <Image source={{ uri: item.CountryFlag }} style={styles.resultFlagElite} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultNameText}>{item.ToCountryName}</Text>
                      <Text style={styles.resultCurrencyText}>{item.ToCurrency}</Text>
                    </View>
                    <View style={[
                      styles.resultIconBox,
                      isSelected && { backgroundColor: '#FF8E72' }
                    ]}>
                      <Feather name={isSelected ? "check" : "plus"} size={14} color={isSelected ? "#FFF" : "#DBCAC0"} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 💎 SELECTION PREVIEW */}
        {selectedCountry && (
          <View style={styles.sectionContainer}>
            <View style={styles.previewCardElite}>
              <View style={styles.previewHeaderElite}>
                <Text style={styles.previewLabelElite}>CONVERSION PREVIEW</Text>
                <View style={styles.liveBadgeElite}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </View>

              <View style={styles.previewFlowRow}>
                <View style={styles.currencyNodeElite}>
                  <View style={styles.nodeCircleElite}>
                    <Text style={{ fontSize: RFValue(16) }}>🇬🇧</Text>
                  </View>
                  <Text style={styles.nodeCurrencyText}>GBP</Text>
                </View>

                <View style={styles.nodeConnectorElite}>
                  <View style={styles.connectorPulseBtn}>
                    <Feather name="repeat" size={12} color="#FFF" />
                  </View>
                  <View style={styles.connectorLineElite} />
                </View>

                <View style={styles.currencyNodeElite}>
                  <View style={[styles.nodeCircleElite, { overflow: 'hidden' }]}>
                    <Image source={{ uri: selectedCountry.CountryFlag }} style={styles.nodeFlagImg} />
                  </View>
                  <Text style={styles.nodeCurrencyText}>{selectedCountry.ToCurrency}</Text>
                </View>
              </View>

              <View style={styles.previewRateBox}>
                <Text style={styles.previewRateLabel}>Current Market Rate</Text>
                <Text style={styles.previewRateValue}>1 : {selectedCountry.ExchangeCheckRate || "---"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 🔔 RATE NOTIFICATIONS */}
        <View style={styles.sectionContainer}>
          <View style={styles.eliteSectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitleText}>RATE NOTIFICATIONS</Text>
          </View>

          <View style={styles.alertCardElite}>
            <View style={styles.alertToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertMainTitle}>Automated Alerts</Text>
                <Text style={styles.alertSubDesc}>Notify me when the rate crosses a threshold</Text>
              </View>
              <Switch
                value={rateAlertEnabled}
                onValueChange={setRateAlertEnabled}
                thumbColor={rateAlertEnabled ? "#FFF" : "#F4F4F5"}
                trackColor={{ false: "#E2E8F0", true: "#FF8E72" }}
                ios_backgroundColor="#E2E8F0"
              />
            </View>

            <View style={[styles.alertConfigBody, !rateAlertEnabled && { opacity: 0.4 }]}>
              <View style={styles.configRowElite}>
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.configLabelElite}>CONDITION</Text>
                  <View style={styles.conditionSwitchBox}>
                    {["Above", "Below"].map((opt) => {
                      const isSelected = (opt === "Above" && selectedOption.includes("Above")) ||
                        (opt === "Below" && selectedOption.includes("Below"));
                      return (
                        <TouchableOpacity
                          key={opt}
                          disabled={!rateAlertEnabled}
                          onPress={() => setSelectedOption(`1 GBP goes ${opt}`)}
                          style={[
                            styles.conditionOptionBtn,
                            isSelected && styles.conditionOptionActive
                          ]}
                        >
                          <Feather
                            name={opt === "Above" ? "trending-up" : "trending-down"}
                            size={14}
                            color={isSelected ? "#FF8E72" : "#8E7F77"}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[
                            styles.conditionOptionText,
                            isSelected && styles.conditionOptionTextActive
                          ]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.configLabelElite}>TARGET RATE</Text>
                  <View style={styles.alertInputBox}>
                    <TextInput
                      value={alertAmount}
                      onChangeText={setAlertAmount}
                      editable={rateAlertEnabled}
                      placeholder={selectedCountry?.ExchangeCheckRate?.toString() || "0.00"}
                      placeholderTextColor="rgba(59, 47, 47, 0.2)"
                      style={[styles.alertAmountInput, { outlineStyle: "none" } as any]}
                      keyboardType="numeric"
                      underlineColorAndroid="transparent"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 🏁 FLOATING ACTION FOOTER */}
      <View style={styles.footerElite}>
        <TouchableOpacity
          onPress={handleAddWatchlist}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFB09C', '#FF8E72']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={styles.btnIconBoxElite}>
                  <Feather name={editItem ? "check" : "plus"} size={20} color="#FF8E72" />
                </View>
                <Text style={styles.actionBtnTextElite}>
                  {editItem ? "UPDATE WATCHLIST" : "ADD TO WATCHLIST"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* SRC Country Switch Modal */}
      <Modal
        visible={countryDropdownOpen}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlayElite}>
          <View style={styles.modalSheetElite}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleElite}>Source Currency</Text>
              <TouchableOpacity onPress={() => setCountryDropdownOpen(false)}>
                <Ionicons name="close" size={24} color="#3B2F2F" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={countryList}
              keyExtractor={(item) => item.ToCountryCode}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.ToCountryCode === "GBR"; // Mock logic
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalCountryItem,
                      isSelected && styles.modalCountryItemActive
                    ]}
                    onPress={() => {
                      setCountryDropdownOpen(false);
                    }}
                  >
                    <View style={styles.modalFlagBox}>
                      <Image source={{ uri: item.CountryFlag }} style={styles.modalFlagImg} />
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={styles.modalCountryName}>{item.ToCountryName}</Text>
                      <Text style={styles.modalCurrencyText}>{item.ToCurrency}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#FF8E72" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF5F1",
  },
  eliteHeader: {
    backgroundColor: '#1C0D06',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 35,
    ...SHADOWS.shadow,
  },
  safeHeader: {
    paddingHorizontal: 25,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
  },
  backButtonGlass: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitles: {
    flex: 1,
    marginLeft: 20,
  },
  headerMainTitle: {
    fontSize: RFValue(20),
    fontFamily: FONTS.bold,
    color: '#FCF5F1',
    letterSpacing: 1.2,
  },
  subtitleRowElite: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  headerSubtitleText: {
    fontSize: 10,
    color: 'rgba(252, 245, 241, 0.6)',
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  currencyPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  currencyBtnText: {
    marginLeft: 8,
    fontFamily: FONTS.bold,
    color: "#FCF5F1",
    fontSize: 12,
    marginRight: 6,
  },
  scrollContent: {
    paddingBottom: 130,
    paddingTop: 25,
    paddingHorizontal: 25,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  eliteSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  accentBar: {
    width: 4,
    height: 16,
    backgroundColor: '#FF8E72',
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitleText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 1.2,
  },
  tickerContainer: {
    marginTop: 5,
  },
  tickerCardElite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 15,
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.02)',
    ...SHADOWS.shadow,
    minWidth: 140,
  },
  tickerFlagBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F8F4F1',
  },
  tickerFlagImg: {
    width: '100%',
    height: '100%',
  },
  tickerInfoBox: {
    marginLeft: 12,
  },
  tickerCurrencyText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#A3968F',
  },
  tickerRateText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    marginTop: 2,
  },
  searchWrapperElite: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 60,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...SHADOWS.shadow,
  },
  searchWrapperFocused: {
    borderColor: 'rgba(255, 142, 114, 0.2)',
  },
  searchTextInputElite: {
    flex: 1,
    marginLeft: 15,
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: "#3B2F2F",
    height: '100%',
    borderWidth: 0,
  },
  resultsPopoverElite: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 10,
    ...SHADOWS.shadow,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.03)',
  },
  resultItemElite: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 18,
    marginBottom: 5,
  },
  resultItemActive: {
    backgroundColor: 'rgba(255, 142, 114, 0.08)',
  },
  resultFlagElite: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 15,
  },
  resultNameText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
  },
  resultCurrencyText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: "#8E7F77",
  },
  resultIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8F4F1',
    justifyContent: "center",
    alignItems: "center",
  },
  previewCardElite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 114, 0.1)',
    ...SHADOWS.shadow,
  },
  previewHeaderElite: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewLabelElite: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#A3968F',
    letterSpacing: 1,
  },
  liveBadgeElite: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  liveBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#10B981',
  },
  previewFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  currencyNodeElite: {
    alignItems: 'center',
  },
  nodeCircleElite: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    ...SHADOWS.shadow,
  },
  nodeFlagImg: {
    width: '100%',
    height: '100%',
  },
  nodeCurrencyText: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    marginTop: 10,
  },
  nodeConnectorElite: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  connectorPulseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF8E72',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...SHADOWS.shadow,
  },
  connectorLineElite: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 142, 114, 0.2)',
    position: 'absolute',
  },
  previewRateBox: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#FBF8F6',
    borderRadius: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#FF8E72',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewRateLabel: {
    fontSize: RFValue(12),
    fontFamily: FONTS.medium,
    color: "#8E7F77",
  },
  previewRateValue: {
    fontSize: RFValue(18),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
  },
  alertCardElite: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.02)',
    ...SHADOWS.shadow,
  },
  alertToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  alertMainTitle: {
    fontSize: RFValue(16),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
  },
  alertSubDesc: {
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    color: "#8E7F77",
    marginTop: 4,
  },
  alertConfigBody: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F8F4F1',
  },
  configRowElite: {
    flexDirection: "row",
    gap: 15,
  },
  configLabelElite: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: "#A3968F",
    marginBottom: 12,
    letterSpacing: 1,
  },
  conditionSwitchBox: {
    flexDirection: 'row',
    backgroundColor: "#F8F4F1",
    borderRadius: 18,
    padding: 5,
    height: 58,
  },
  conditionOptionBtn: {
    flex: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  conditionOptionActive: {
    backgroundColor: "#FFFFFF",
    ...SHADOWS.shadow,
  },
  conditionOptionText: {
    fontSize: RFValue(13),
    fontFamily: FONTS.medium,
    color: "#8E7F77",
  },
  conditionOptionTextActive: {
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
  },
  alertInputBox: {
    borderWidth: 1.5,
    borderColor: "#F8F4F1",
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 58,
    backgroundColor: "#FFF",
  },
  alertAmountInput: {
    flex: 1,
    fontSize: RFValue(16),
    fontFamily: FONTS.bold,
    color: "#FF8E72",
    borderWidth: 0,
  },
  footerElite: {
    padding: 25,
    backgroundColor: "rgba(252, 245, 241, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(59, 47, 47, 0.03)",
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
  },
  actionBtnGradient: {
    height: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'row',
    ...SHADOWS.shadow,
  },
  btnIconBoxElite: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionBtnTextElite: {
    color: "#FFFFFF",
    fontFamily: FONTS.bold,
    fontSize: RFValue(14),
    letterSpacing: 1.5,
  },
  modalOverlayElite: {
    flex: 1,
    backgroundColor: "rgba(28, 13, 6, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheetElite: {
    backgroundColor: "#FCF5F1",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: "85%",
    paddingBottom: 40,
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(59, 47, 47, 0.1)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 15,
  },
  modalHeaderRow: {
    padding: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleElite: {
    fontSize: RFValue(20),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
  },
  modalListContent: {
    paddingHorizontal: 25,
  },
  modalCountryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 22,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.03)',
  },
  modalCountryItemActive: {
    borderColor: '#FF8E72',
    backgroundColor: 'rgba(255, 142, 114, 0.05)',
  },
  modalFlagBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F8F4F1',
  },
  modalFlagImg: {
    width: '100%',
    height: '100%',
  },
  modalCountryName: {
    fontSize: RFValue(16),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
  },
  modalCurrencyText: {
    fontSize: RFValue(13),
    fontFamily: FONTS.medium,
    color: "#8E7F77",
    marginTop: 2,
  },
});

export default QuickAddWatchlistForm;
