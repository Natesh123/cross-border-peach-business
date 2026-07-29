import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CountryFlag from "react-native-country-flag";
import { FONTS, SIZES } from "../../../../constants/Assets";

const getCountryISO2 = require("country-iso-3-to-2");

const TransactionalPreferencesItems = ({ amount, count, country, countryName, reason, status, onPress }: any) => {
    return (
        <View style={localStyles.itemCard}>
            <View style={localStyles.headerRow}>
                <View style={localStyles.flagWrapper}>
                    <CountryFlag isoCode={getCountryISO2(country) || "GB"} size={16} />
                </View>
                <Text numberOfLines={1} style={localStyles.countryText}>{countryName}</Text>
                {status !== 'P' && (
                    <TouchableOpacity onPress={() => onPress({ amount, count, country, countryName, reason })} style={localStyles.editBtn}>
                        <Ionicons name="pencil" size={14} color="#3B2F2F" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={localStyles.detailsBox}>
                <View style={localStyles.infoRow}>
                    <MaterialCommunityIcons name="help-circle-outline" size={12} color="#5D4F4F" />
                    <Text numberOfLines={1} style={localStyles.infoText}>{reason}</Text>
                </View>
                <View style={localStyles.infoRow}>
                    <MaterialCommunityIcons name="currency-usd" size={12} color="#3B2F2F" />
                    <Text style={localStyles.amountText}>£{amount}</Text>
                </View>
            </View>

            <View style={localStyles.footer}>
                <Text style={localStyles.countText}>{count} TX / MONTH</Text>
            </View>
        </View>
    );
};

const localStyles = StyleSheet.create({
    itemCard: {
        backgroundColor: '#FCF5F1',
        borderRadius: 20,
        padding: 16,
        width: 180,
        height: 160,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        justifyContent: 'space-between',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    flagWrapper: {
        width: 28,
        height: 20,
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    countryText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '800',
        color: '#3B2F2F',
    },
    editBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#FCF5F1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    detailsBox: {
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#5D4F4F',
        marginLeft: 6,
    },
    amountText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#3B2F2F',
        marginLeft: 6,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 8,
    },
    countText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#D2C5BD',
        letterSpacing: 0.5,
    },
});

export default TransactionalPreferencesItems;
