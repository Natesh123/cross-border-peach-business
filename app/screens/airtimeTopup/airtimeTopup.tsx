import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileState } from "app/atoms";
import { TDropDown } from "types";
import { MetaService } from "app/services/meta.service";
import { GetOperators, GetProducts } from "app/http-services";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "app/constants/Colors";
import { RFValue } from "react-native-responsive-fontsize";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AirtimeTopup: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  // Country states
  const [countryList, setCountryList] = useState<TDropDown[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<TDropDown[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<TDropDown | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState("");

  // Operator states
  const [operatorList, setOperatorList] = useState<TDropDown[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<TDropDown[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<TDropDown | null>(null);
  const [operatorDropdownOpen, setOperatorDropdownOpen] = useState(false);
  const [operatorSearchText, setOperatorSearchText] = useState("");

  // Package states
  const [packages, setPackages] = useState<TDropDown[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<TDropDown[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TDropDown | null>(null);
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [packageSearchText, setPackageSearchText] = useState("");

  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const valid = selectedCountry !== null && selectedOperator !== null && selectedPackage !== null;
    setIsFormValid(valid);
  }, [selectedCountry, selectedOperator, selectedPackage]);

  const saveToLocalStorage = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("AsyncStorage error:", error);
    }
  };

  useEffect(() => {
    if (countrySearchText.trim() === "") setFilteredCountries(countryList);
    else
      setFilteredCountries(
        countryList.filter((c) =>
          c.displayvalue.toLowerCase().includes(countrySearchText.toLowerCase())
        )
      );
  }, [countrySearchText, countryList]);

  useEffect(() => {
    if (operatorSearchText.trim() === "") setFilteredOperators(operatorList);
    else
      setFilteredOperators(
        operatorList.filter((o) =>
          o.displayvalue.toLowerCase().includes(operatorSearchText.toLowerCase())
        )
      );
  }, [operatorSearchText, operatorList]);

  useEffect(() => {
    if (packageSearchText.trim() === "") setFilteredPackages(packages);
    else
      setFilteredPackages(
        packages.filter((p) =>
          p.displayvalue.toLowerCase().includes(packageSearchText.toLowerCase())
        )
      );
  }, [packageSearchText, packages]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      MetaService.fetchCountryMetas(
        false,
        true,
        false,
        async (countries: any[]) => {
          const list: TDropDown[] = countries.map((c: any) => ({
            dataValue: c.Alpha_3_Code,
            displayvalue: c.CountryName,
            flag: `https://flagcdn.com/w40/${c.Alpha_2_Code.toLowerCase()}.png`,
            ISDCode: c.ISDCode,
            name: c.CountryName,
            Alpha_2_Code: c.Alpha_2_Code,
            price: "",
            description: "",
          }));
          setCountryList(list);
          setFilteredCountries(list);
        },
        () => { },
        () => setLoading(false)
      );
    } catch (error) {
      console.error("fetchCountries error:", error);
      setLoading(false);
    }
  };

  const fetchOperators = async (countryCode: string) => {
    try {
      setLoading(true);
      const response: any = await GetOperators({ country_iso_code: countryCode });
      const list: TDropDown[] = (response?.data?.Operators || []).map((op: any) => ({
        dataValue: op.id,
        displayvalue: op.name,
        flag: "",
        ISDCode: "",
      }));
      setOperatorList(list);
      setFilteredOperators(list);
    } catch (error) {
      console.error("fetchOperators error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (countryCode: string, operatorId: string) => {
    try {
      setLoading(true);
      const response: any = await GetProducts({
        country_iso_code: countryCode,
        operator_id: operatorId,
      });

      const list: TDropDown[] = (response?.data?.Products || []).map((p: any) => {
        let price = "";
        if (p.prices?.retail?.amount) {
          price = `${p.prices.retail.amount} ${p.prices.retail.unit}`;
        } else if (p.topupamount?.amount) {
          price = `${p.topupamount.amount} ${p.topupamount.currency}`;
        } else if (p.destination?.amount) {
          price = `${p.destination.amount} ${p.destination.unit}`;
        }

        return {
          dataValue: p.id,
          displayvalue: p.name,
          description: p.description || "",
          price: price,
          flag: "",
          ISDCode: "",
        };
      });

      setPackages(list);
      setFilteredPackages(list);
    } catch (error) {
      console.error("fetchProducts error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, [isFocused]);

  const renderDropdownTile = (
    label: string,
    placeholder: string,
    selectedValue: string | null,
    isOpen: boolean,
    onToggle: () => void,
    icon: string,
    flag?: string
  ) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={[localStyles.tileBox, isOpen && localStyles.tileBoxActive]}
    >
      <View style={localStyles.tileLeftContent}>
        {flag ? (
          <Image source={{ uri: flag }} style={localStyles.tileFlag} />
        ) : (
          <View style={[localStyles.tileIconCircle, isOpen && localStyles.tileIconCircleActive]}>
            <Feather name={icon as any} size={18} color={isOpen ? "#FFFFFF" : "#3B2F2F"} />
          </View>
        )}
        <View style={localStyles.tileTextCont}>
          <Text style={localStyles.tileLabel}>{label}</Text>
          <Text style={[localStyles.tileValue, !selectedValue && localStyles.tilePlaceholder]}>
            {selectedValue || placeholder}
          </Text>
        </View>
      </View>
      <View style={localStyles.tileRightAction}>
        <View style={[localStyles.chevronCircle, isOpen && localStyles.chevronCircleActive]}>
          <Feather name={isOpen ? "chevron-up" : "chevron-right"} size={16} color={isOpen ? "#FFFFFF" : "#94A3B8"} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        >
          {/* HEADER SECTION */}
          <View style={localStyles.headerArea}>
            <SafeAreaView>
              <View style={localStyles.headerContent}>
                <View style={localStyles.headerTopRow}>
                  <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
                  </TouchableOpacity>
                  <View style={localStyles.headerStatusBadge}>
                    <View style={localStyles.statusPulse} />
                    <Text style={localStyles.headerStatusText}>GLOBAL CONNECT ACTIVE</Text>
                  </View>
                </View>

                <View style={localStyles.titleSection}>
                  <Text style={localStyles.mainTitleText}>Airtime Topup</Text>
                  <Text style={localStyles.subTitleText}>Recharge mobile credit instantly across 150+ countries</Text>
                </View>
              </View>
            </SafeAreaView>
          </View>

          <View style={localStyles.formContainer}>
            {/* Country Selector */}
            {renderDropdownTile(
              "Destination Country",
              "Choose where to send",
              selectedCountry?.displayvalue || null,
              countryDropdownOpen,
              () => setCountryDropdownOpen(!countryDropdownOpen),
              "globe",
              selectedCountry?.flag
            )}

            {countryDropdownOpen && (
              <Animated.View entering={FadeInDown} style={localStyles.dropdownPanel}>
                <View style={localStyles.dropdownSearchCont}>
                  <Feather name="search" size={16} color="#94A3B8" />
                  <TextInput
                    placeholder="Search countries..."
                    placeholderTextColor="#94A3B8"
                    value={countrySearchText}
                    onChangeText={setCountrySearchText}
                    style={localStyles.dropdownSearchInput}
                  />
                </View>
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.dataValue}
                  style={{ maxHeight: 220 }}
                  nestedScrollEnabled={true}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={localStyles.listRowItem}
                      onPress={() => {
                        setSelectedCountry(item);
                        saveToLocalStorage("selectedCountry", item);
                        setCountryDropdownOpen(false);
                        setCountrySearchText("");
                        fetchOperators(item.dataValue);
                        setSelectedOperator(null);
                        setSelectedPackage(null);
                      }}
                    >
                      <Image source={{ uri: item.flag }} style={localStyles.listRowFlag} />
                      <Text style={localStyles.listRowText}>{item.displayvalue}</Text>
                      {selectedCountry?.dataValue === item.dataValue && (
                        <Ionicons name="checkmark-circle" size={18} color="#FF8E72" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </Animated.View>
            )}

            {/* Operator Selector */}
            {renderDropdownTile(
              "Network Provider",
              "Select carrier network",
              selectedOperator?.displayvalue || null,
              operatorDropdownOpen,
              () => setOperatorDropdownOpen(!operatorDropdownOpen),
              "wifi"
            )}

            {operatorDropdownOpen && (
              <Animated.View entering={FadeInDown} style={localStyles.dropdownPanel}>
                <View style={localStyles.dropdownSearchCont}>
                  <Feather name="search" size={16} color="#94A3B8" />
                  <TextInput
                    placeholder="Search operators..."
                    placeholderTextColor="#94A3B8"
                    value={operatorSearchText}
                    onChangeText={setOperatorSearchText}
                    style={localStyles.dropdownSearchInput}
                  />
                </View>
                <FlatList
                  data={filteredOperators}
                  keyExtractor={(item) => item.dataValue.toString()}
                  style={{ maxHeight: 220 }}
                  nestedScrollEnabled={true}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={localStyles.listRowItem}
                      onPress={() => {
                        setSelectedOperator(item);
                        saveToLocalStorage("selectedOperator", item);
                        setOperatorDropdownOpen(false);
                        setOperatorSearchText("");
                        fetchProducts(selectedCountry?.dataValue || "", item.dataValue);
                        setSelectedPackage(null);
                      }}
                    >
                      <View style={localStyles.operatorIconCont}>
                        <Feather name="activity" size={14} color="#FF8E72" />
                      </View>
                      <Text style={localStyles.listRowText}>{item.displayvalue}</Text>
                      {selectedOperator?.dataValue === item.dataValue && (
                        <Ionicons name="checkmark-circle" size={18} color="#FF8E72" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </Animated.View>
            )}

            {/* Package Selector */}
            {renderDropdownTile(
              "Available Plans",
              "Select your package",
              selectedPackage?.displayvalue || null,
              packageDropdownOpen,
              () => setPackageDropdownOpen(!packageDropdownOpen),
              "layers"
            )}

            {packageDropdownOpen && (
              <Animated.View entering={FadeInDown} style={localStyles.dropdownPanel}>
                <View style={localStyles.dropdownSearchCont}>
                  <Feather name="search" size={16} color="#94A3B8" />
                  <TextInput
                    placeholder="Search packages..."
                    placeholderTextColor="#94A3B8"
                    value={packageSearchText}
                    onChangeText={setPackageSearchText}
                    style={localStyles.dropdownSearchInput}
                  />
                </View>
                <FlatList
                  data={filteredPackages}
                  keyExtractor={(item) => item.dataValue.toString()}
                  style={{ maxHeight: 300 }}
                  nestedScrollEnabled={true}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={localStyles.packagePlanItem}
                      onPress={() => {
                        setSelectedPackage(item);
                        saveToLocalStorage("selectedPackage", item);
                        setPackageDropdownOpen(false);
                        setPackageSearchText("");
                      }}
                    >
                      <View style={localStyles.packageTopLine}>
                        <Text style={localStyles.packagePlanTitle} numberOfLines={1}>{item.displayvalue}</Text>
                        <View style={localStyles.packagePriceBadge}>
                          <Text style={localStyles.packagePriceText}>{item.price}</Text>
                        </View>
                      </View>
                      {item.description ? <Text style={localStyles.packagePlanDesc}>{item.description}</Text> : null}
                    </TouchableOpacity>
                  )}
                />
              </Animated.View>
            )}

            {/* TRANSACTION SUMMARY */}
            {selectedPackage && (
              <Animated.View entering={FadeInUp} style={localStyles.receiptContainer}>
                <LinearGradient colors={["rgba(255,142,114,0.1)", "rgba(255,142,114,0.02)"]} style={localStyles.receiptInner}>
                  <View style={localStyles.receiptHeader}>
                    <View style={localStyles.receiptIconCont}>
                      <MaterialCommunityIcons name="file-document-outline" size={18} color="#FF8E72" />
                    </View>
                    <Text style={localStyles.receiptHeaderText}>Order Summary</Text>
                  </View>
                  
                  <View style={localStyles.receiptContent}>
                    <View style={localStyles.receiptRow}>
                      <Text style={localStyles.receiptLabel}>Carrier</Text>
                      <Text style={localStyles.receiptValue}>{selectedOperator?.displayvalue}</Text>
                    </View>
                    <View style={localStyles.receiptRow}>
                      <Text style={localStyles.receiptLabel}>Region</Text>
                      <Text style={localStyles.receiptValue}>{selectedCountry?.displayvalue}</Text>
                    </View>
                    <View style={localStyles.receiptDivider} />
                    <View style={localStyles.receiptTotalRow}>
                      <View>
                        <Text style={localStyles.receiptTotalLabel}>Total Amount</Text>
                        <Text style={localStyles.receiptPlanSub}>{selectedPackage.displayvalue}</Text>
                      </View>
                      <Text style={localStyles.receiptTotalValue}>{selectedPackage.price}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* FOOTER ACTION */}
      <View style={localStyles.stickyFooter}>
        <TouchableOpacity 
          disabled={!isFormValid || loading}
          style={[localStyles.actionButton, (!isFormValid || loading) && { opacity: 0.5 }]} 
          onPress={() => navigation.navigate("AirtimeTopupList")}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={["#FF8E72", "#FC6D41"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={localStyles.actionButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={localStyles.actionButtonText}>PROCEED TO PAYMENT</Text>
                <View style={localStyles.actionIconBox}>
                  <Ionicons name="arrow-forward" size={18} color="#FC6D41" />
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  headerArea: {
    backgroundColor: '#1C0D06',
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 142, 114, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8E72',
  },
  headerStatusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF8E72',
    letterSpacing: 1.2,
  },
  titleSection: {
    marginBottom: 20,
  },
  mainTitleText: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: -1,
  },
  subTitleText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    marginTop: 6,
    lineHeight: 20,
  },
  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  instantText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "700",
  },
  formContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 40,
    flex: 1,
  },
  tileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: "#3B2F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  tileBoxActive: {
    borderColor: '#FF8E72',
    backgroundColor: '#FFF9F7',
  },
  tileLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tileIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tileIconCircleActive: {
    backgroundColor: '#3B2F2F',
  },
  tileFlag: {
    width: 48,
    height: 36,
    borderRadius: 10,
    marginRight: 16,
  },
  tileTextCont: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1515',
  },
  tilePlaceholder: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronCircleActive: {
    backgroundColor: '#FF8E72',
  },
  dropdownPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginTop: -8,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  dropdownSearchCont: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  dropdownSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }) as any,
  },
  listRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listRowFlag: {
    width: 32,
    height: 22,
    borderRadius: 4,
    marginRight: 16,
  },
  listRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
  },
  operatorIconCont: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,142,114,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  packagePlanItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  packageTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  packagePlanTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1515',
    flex: 1,
    marginRight: 12,
  },
  packagePriceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  packagePriceText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
  },
  packagePlanDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 16,
  },
  receiptContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,142,114,0.2)',
  },
  receiptInner: {
    padding: 24,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  receiptIconCont: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF8E72",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  receiptHeaderText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A1515',
    letterSpacing: 0.5,
  },
  receiptContent: {
    gap: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  receiptValue: {
    fontSize: 12,
    color: '#3B2F2F',
    fontWeight: '800',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: 'rgba(59,47,47,0.05)',
    marginVertical: 6,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  receiptTotalLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '800',
  },
  receiptPlanSub: {
    fontSize: 10,
    color: '#FF8E72',
    fontWeight: '700',
    marginTop: 2,
  },
  receiptTotalValue: {
    fontSize: 22,
    color: '#FC6D41',
    fontWeight: '900',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  actionButton: {
    width: "100%",
    borderRadius: 24,
    shadowColor: "#FF8E72",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 24,
    height: 64,
    gap: 16,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AirtimeTopup;
