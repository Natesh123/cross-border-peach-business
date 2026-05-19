import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  StyleSheet
} from "react-native";
import { useRecoilValue } from "recoil";
import { useNavigation } from "@react-navigation/native";
import CountryFlag from "react-native-country-flag";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ Import
import { ProfileState } from "app/atoms";
import { FONTS, SIZES } from "app/constants/Assets";
import styles from "app/styles";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface IProps {
  items: any[];
  title: string;
  onSelect?: (selectedItem: any) => void;
  selectedPurpose?: string;
}

const RecipientItem = ({ items, title, onSelect, selectedPurpose }: IProps) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const getCountryISO2 = require("country-iso-3-to-2");
  const currentToken = useRecoilValue(ProfileState);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [filteredItems, setFilteredItems] = useState<any[]>([]); // ✅ store filtered recipients
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const [transferReason, setTransferReason] = useState("");


  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const value = await AsyncStorage.getItem("selectedRecipientCurrency");
        if (value) {
          setCurrencyCode(value);
        }
      } catch (error) {
        console.error("Error fetching currency from storage:", error);
      }
    };
    fetchCurrency();
  }, []);

  useEffect(() => {
    if (currencyCode && items.length > 0) {
      // ✅ filter recipients only for matching country code
      const filtered = items.filter(
        (item) => item.CountryCode?.toUpperCase() === currencyCode.toUpperCase()
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [currencyCode, items]);

  const handleSelect = (item: any) => {
    const newSelectedId =
      item.ReceiverID === selectedId ? null : item.ReceiverID;

    setSelectedId(newSelectedId);
    setSelectedRecipient(item.ReceiverID === selectedId ? null : item);

    if (onSelect) onSelect(item);
  };

  const handleEditRecipient = (recipientData: any) => {

    if (!selectedPurpose) {
      Alert.alert("Required", "Please select a transfer reason");
      return;
    }

    if (!recipientData) {
      Alert.alert("Selection Required", "Please select a recipient first");
      console.warn("⚠️ No recipient selected");
      return;
    }

    (navigation as any).navigate("AddRecipient", { editData: recipientData });

  };

  const isProceedEnabled =
    selectedRecipient !== null && selectedPurpose !== "";


  return (
    <View style={localStyles.container}>
      {/* Header */}
      <View style={localStyles.listHeader}>
        <Text style={localStyles.headerText}>My Recipients List</Text>
      </View>

      {/* Recipients List (2-Column Grid) */}
      <View style={localStyles.listContent}>
        {filteredItems.map((item) => {
          const isSelected = item.ReceiverID === selectedId;

          return (
            <TouchableOpacity
              key={item.ReceiverID?.toString()}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
              style={[
                localStyles.recipientCard,
                { width: (width - 40 - 12) / 2 },
                isSelected && localStyles.recipientCardSelected,
              ]}
            >
              {/* Selection Badge (Absolute) */}
              {isSelected && (
                <View style={localStyles.selectionBadge}>
                  <Ionicons name="checkmark-circle" size={22} color="#2C1810" />
                </View>
              )}

              <View style={localStyles.cardInner}>
                {/* Flag Section */}
                <View style={localStyles.flagWrapper}>
                  <CountryFlag
                    style={localStyles.flagIcon}
                    isoCode={getCountryISO2(item.CountryCode) || ""}
                    size={32}
                  />
                </View>

                {/* Info Section */}
                <View style={localStyles.infoWrapper}>
                  <Text style={localStyles.recipientName} numberOfLines={2}>
                    {item.FirstName} {item.LastName}
                  </Text>
                  <Text style={localStyles.recipientCountry}>
                    {item.Country || (item.CountryCode === 'IND' ? 'India' : item.CountryCode)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Section */}
      <View style={localStyles.actionWrapper}>
        <TouchableOpacity
          style={[
            localStyles.proceedButton,
            !isProceedEnabled && { opacity: 0.5 }
          ]}
          disabled={!isProceedEnabled}
          onPress={() => handleEditRecipient(selectedRecipient)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isProceedEnabled ? ["#4A3C3C", "#2C1810"] : ["#cbd5e1", "#e2e8f0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={localStyles.gradientButton}
          >
            <Text style={localStyles.proceedText}>Proceed</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 8,
  },
  listHeader: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
    fontFamily: FONTS.bold,
  },
  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.03)',
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  recipientCardSelected: {
    borderColor: '#2C1810',
    backgroundColor: '#FCF5F1',
    borderWidth: 1.5,
  },
  selectionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  cardInner: {
    alignItems: 'center',
    gap: 12,
  },
  flagWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCF5F1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(44, 24, 16, 0.08)',
  },
  flagIcon: {
    width: 60,
    height: 60,
  },
  infoWrapper: {
    alignItems: 'center',
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1810',
    fontFamily: FONTS.bold,
    textTransform: 'capitalize',
    textAlign: 'center',
    marginBottom: 4,
  },
  recipientCountry: {
    fontSize: 12,
    color: '#8E7F77',
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  actionWrapper: {
    marginTop: 32,
    marginBottom: 20,
  },
  proceedButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedText: {
    color: '#FCF5F1',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});

export default RecipientItem;
