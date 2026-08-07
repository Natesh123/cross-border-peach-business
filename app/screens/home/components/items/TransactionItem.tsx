import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import CountryFlag from "react-native-country-flag";
import { FONTS } from "app/constants/Assets";
import Colors from "app/constants/Colors";
import Vector from "app/assets/vectors";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";

interface IProps {
  item: any;
  index: number;
  currency?: string;
  variant?: string;
}

const TransactionItem = ({ item, index, currency: sysCurrency }: IProps) => {
  const getCountryISO2 = require("country-iso-3-to-2");
  const isoCode = getCountryISO2(item.DestinationCountry) || "";

  const isWalletTxn = 
    item.TransactionType === "WALLET" ||
    item.TransactionMode === "E-Wallet Debit" ||
    (item.TransID && String(item.TransID).startsWith("EE")) ||
    (item.TransactionID && String(item.TransactionID).startsWith("EE"));

  const displayName = (item.ReceiverFirstName || item.ReceiverLastName)
    ? `${item.ReceiverFirstName} ${item.ReceiverLastName}`.trim()
    : item.TransactionPurpose || (isWalletTxn ? "Wallet Transfer" : "Money Transfer");

  const displayCurrency = item.Currency || sysCurrency || "£";

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'ew_ew_success':
        return { bg: '#ECFDF5', text: Colors.success };
      case 'pending':
      case 'processing':
        return { bg: '#FFFBEB', text: '#D97706' };
      case 'failed':
      case 'rejected':
        return { bg: '#FEF2F2', text: Colors.error };
      default:
        return { bg: Colors.grayLight, text: Colors.gray };
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'EW_EW_SUCCESS') return 'Success';
    return status || 'Failed';
  };

  const statusStyle = getStatusStyle(item.TranStatus);
  const statusText = getStatusText(item.TranStatus);

  const getLondonOffset = (date: Date): number => {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      });
      const parts = dtf.formatToParts(date);
      const getVal = (type: string) => {
        const part = parts.find(p => p.type === type);
        return part ? parseInt(part.value, 10) : 0;
      };
      const year = getVal('year');
      const month = getVal('month') - 1;
      const day = getVal('day');
      let hour = getVal('hour');
      if (hour === 24) hour = 0;
      const minute = getVal('minute');
      const second = getVal('second');
      const londonUTCDate = Date.UTC(year, month, day, hour, minute, second);
      const inputUTCDate = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
      );
      return (londonUTCDate - inputUTCDate) / 60000;
    } catch (e) {
      return 0; // Fallback if Intl is not supported
    }
  };

  const parseDate = (d: string) => {
    if (!d) return moment(0);
    const formats = [
      "YYYY-MM-DDTHH:mm:ss[Z]",
      "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
      "YYYY-MM-DD HH:mm:ss",
      "M/D/YYYY h:mm:ss A",
      "MM/DD/YYYY hh:mm:ss A",
      "DD/MM/YYYY hh:mm:ss A",
      "DD/MM/YYYY HH:mm:ss",
      "DD-MM-YYYY hh:mm:ss A",
      "DD-MM-YYYY HH:mm:ss",
      "YYYY-MM-DD hh:mm:ss A",
      "YYYY/MM/DD hh:mm:ss A",
      "DD-MM-YYYY",
      "DD/MM/YYYY",
      "DD-MMM-YYYY",
      "DD MMM, YYYY",
      "YYYY/MM/DD",
      "DD MMM YYYY hh:mm:ss A",
      "DD MMM YYYY"
    ];

    if (!isWalletTxn) {
      // Standard transfer date is in UK local time (Europe/London)
      let m = moment.utc(d, formats);
      if (m.isValid()) {
        const utcDate = new Date(m.format("YYYY-MM-DDTHH:mm:ss[Z]"));
        const offset = getLondonOffset(utcDate);
        m.subtract(offset, "minutes");
        return m.local();
      }
    }

    // Wallet transfers parsed directly as UTC
    let m = moment.utc(d, formats, true);
    if (m.isValid()) return m.local();
    
    return moment(new Date(d));
  };

  const formattedDate = parseDate(item.TransactionDate).format("DD MMM, YYYY hh:mm A");

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.card}>
      <View style={styles.topSection}>
        <View style={styles.dateWrapper}>
          <Vector as="materialcommunityicons" name="calendar-clock" size={14} color={Colors.gray} />
          <Text style={styles.dateTxt}>{formattedDate}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusTxt, { color: statusStyle.text }]}>{statusText}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />

      <View style={styles.bottomSection}>
        <View style={styles.iconWrapper}>
          {isWalletTxn ? (
            <LinearGradient
              colors={Colors.darkGradient}
              style={styles.iconSquare}
            >
              <Vector as="materialcommunityicons" name="wallet" size={24} color="#FFF" />
            </LinearGradient>
          ) : isoCode ? (
            <View style={styles.flagWrapper}>
              <CountryFlag isoCode={isoCode} size={28} />
            </View>
          ) : (
            <LinearGradient
              colors={Colors.peachGradient}
              style={styles.iconSquare}
            >
              <Vector as="materialcommunityicons" name="bank-transfer" size={26} color="#FFF" />
            </LinearGradient>
          )}
        </View>

        <View style={styles.contentCol}>
          <Text style={styles.nameTxt} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.idTxt}>
            ID: {item.TransID || item.TransactionID}
          </Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountTxt}>{displayCurrency} {item.Amount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TransactionItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTxt: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: Colors.gray,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTxt: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grayLight,
    marginBottom: 12,
    opacity: 0.6,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 16,
  },
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  contentCol: {
    flex: 1,
    marginRight: 8,
  },
  nameTxt: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: Colors.secondary,
    marginBottom: 4,
  },
  idTxt: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: Colors.gray,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: Colors.gray,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  amountTxt: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: Colors.primary,
  },
});
