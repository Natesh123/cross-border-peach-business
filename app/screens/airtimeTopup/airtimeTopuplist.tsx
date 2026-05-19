import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Dimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { GetReceiverInfoLists } from "app/http-services";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from "app/constants/Assets";
import COLORS from "app/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width } = Dimensions.get('window');

const AirtimeTopupList: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(false);
  const [recipientList, setRecipientList] = useState<any[]>([]);
  const [filteredRecipientList, setFilteredRecipientList] = useState<any[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchReceiverList = async (tokenId: string) => {
    try {
      setLoading(true);
      const response = await GetReceiverInfoLists(tokenId);
      if (response.status === 200) {
        const _data = response?.data?.ReceiverDetails;
        if (Array.isArray(_data) && _data.length > 0) {
          const grouped: Record<string, any[]> = _data.reduce((acc, curr) => {
            const groupKey = curr.Country || curr.CountryCode || "Others";
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(curr);
            return acc;
          }, {} as Record<string, any[]>);

          Object.keys(grouped).forEach((key) => {
            grouped[key].sort((a, b) => {
              const nameA = `${a.FirstName || ""} ${a.LastName || ""}`.toLowerCase();
              const nameB = `${b.FirstName || ""} ${b.LastName || ""}`.toLowerCase();
              return nameA.localeCompare(nameB);
            });
          });

          const sortedList = Object.keys(grouped)
            .sort((a, b) => a.localeCompare(b))
            .map((country) => ({
              country,
              recipients: grouped[country],
            }));

          setRecipientList(sortedList);
          setFilteredRecipientList(sortedList);
        } else {
          setRecipientList([]);
          setFilteredRecipientList([]);
        }
      }
    } catch (err) {
      setRecipientList([]);
      setFilteredRecipientList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiverList(currentToken.tokenId);
  }, [isFocused]);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredRecipientList(recipientList);
      return;
    }
    const lower = searchText.toLowerCase();
    const filtered = recipientList
      .map((group) => {
        const filteredRecipients = group.recipients.filter((item: any) => {
          const fullName = `${item.FirstName || ""} ${item.LastName || ""}`.toLowerCase();
          const mobile = (item.MobileNumber || "").toLowerCase();
          const country = (group.country || "").toLowerCase();
          return (
            fullName.includes(lower) ||
            mobile.includes(lower) ||
            country.includes(lower)
          );
        });
        return { ...group, recipients: filteredRecipients };
      })
      .filter((group) => group.recipients.length > 0);
    setFilteredRecipientList(filtered);
  }, [searchText, recipientList]);

  const handleProceed = async () => {
    if (!selectedRecipientId) return;
    let selectedRecipient: any = null;
    for (const group of recipientList) {
      const match = group.recipients.find((r: { ReceiverID: string }) => r.ReceiverID === selectedRecipientId);
      if (match) {
        selectedRecipient = match;
        break;
      }
    }
    if (!selectedRecipient) return;
    try {
      const storedPackage = await AsyncStorage.getItem("selectedPackage");
      const selectedPackage = storedPackage ? JSON.parse(storedPackage) : null;
      await AsyncStorage.setItem("selectedRecipient", JSON.stringify({ ...selectedRecipient, selectedPackage }));
      navigation.navigate("AirtimeTopupPay");
    } catch (err) {
      console.error("Error navigating:", err);
    }
  };

  return (
    <View style={localStyles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* PREMIUM SCREEN-ROUNDED HEADER */}
      <View style={localStyles.headerArea}>
        <SafeAreaView>
          <View style={localStyles.headerContent}>
            <View style={localStyles.headerTopRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backCircle}>
                <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
              </TouchableOpacity>
              
              <View style={localStyles.titleBox}>
                <Text style={localStyles.headerTitle}>My Recipients</Text>
                <View style={localStyles.statusRow}>
                  <View style={localStyles.greenDot} />
                  <Text style={localStyles.statusText}>SAFELY PROTECTED</Text>
                </View>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate("AirtimeTopupForm")}
                style={localStyles.addFloatingBtn}
              >
                <LinearGradient
                  colors={['#FF8A7A', '#FF6B6B']}
                  style={localStyles.addFloatingBtnGradient}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* INTEGRATED SEARCH BAR */}
            <View style={localStyles.searchBox}>
              <Feather name="search" size={20} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={localStyles.searchInput}
                placeholder="Search name or country..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={localStyles.body}>
        {loading ? (
          <View style={localStyles.loader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={localStyles.scrollContent}
          >
            {filteredRecipientList.map((group, gIdx) => (
              <View key={group.country} style={localStyles.group}>
                <Text style={localStyles.groupTitle}>{group.country.toUpperCase()}</Text>
                {group.recipients.map((item: any, rIdx: number) => {
                  const isSelected = selectedRecipientId === item.ReceiverID;
                  return (
                    <Animated.View key={item.ReceiverID} entering={FadeInDown.delay(rIdx * 50)}>
                      <TouchableOpacity
                        style={[localStyles.card, isSelected && localStyles.cardActive]}
                        onPress={() => setSelectedRecipientId(item.ReceiverID)}
                        activeOpacity={0.8}
                      >
                        <View style={localStyles.cardFlag}>
                          <Image source={{ uri: item.CountryFlag }} style={localStyles.flagImg} />
                        </View>
                        <View style={localStyles.cardInfo}>
                          <Text style={localStyles.cardName}>{`${item.FirstName || ""} ${item.LastName || ""}`}</Text>
                          <Text style={localStyles.cardPhone}>{item.MobileNumber || "N/A"}</Text>
                        </View>
                        <View style={[localStyles.check, isSelected && localStyles.checkActive]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* PROCEED FOOTER */}
      {selectedRecipientId && (
        <View style={localStyles.footer}>
          <TouchableOpacity style={localStyles.proceedBtn} onPress={handleProceed}>
            <LinearGradient colors={["#FF8E72", "#FC6D41"]} style={localStyles.proceedGradient}>
              <Text style={localStyles.proceedText}>PROCEED TO PAY</Text>
              <View style={localStyles.iconBox}>
                <Ionicons name="arrow-forward" size={18} color="#FC6D41" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerArea: {
    backgroundColor: '#1C0D06',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 30,
    overflow: 'hidden',
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    marginBottom: 20,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  titleBox: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FCF5F1',
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: 'rgba(252, 245, 241, 0.6)',
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  addFloatingBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addFloatingBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#FFF',
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 120,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  cardActive: {
    borderColor: '#FF8E72',
    backgroundColor: '#FFF9F7',
  },
  cardFlag: {
    width: 44,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  flagImg: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cardName: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#1A1515',
  },
  cardPhone: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkActive: {
    borderColor: '#FF8E72',
    backgroundColor: '#FF8E72',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  proceedBtn: {
    borderRadius: 24,
    shadowColor: "#FF8E72",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  proceedGradient: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    gap: 16,
  },
  proceedText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AirtimeTopupList;
