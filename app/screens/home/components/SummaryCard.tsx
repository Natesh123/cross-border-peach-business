import { View, StyleSheet, Alert } from "react-native";
import React from "react";
import SummaryItem from "./items/SummaryItem";
import Animated, { FadeInDown } from "react-native-reanimated";

interface IProps {
    currency: string;
    value: string;
    count: string;
    beneficiaries: string;
    reward?: string;
}

const SummaryCard = ({ currency, value, count, beneficiaries, reward }: IProps) => {
    const summaryData = [
        {
            id: 1,
            icon: "activity",
            title: "Total Volume",
            value: `${currency}${value || "0.00"}`,
            trend: "+12.4%",
            trendUp: true,
            variant: 'small' as const,
        },
        {
            id: 2,
            icon: "zap",
            title: "Activity Pulse",
            value: `${count || "0"}`,
            trend: "+5.1%",
            trendUp: true,
            variant: 'small' as const,
        },
        {
            id: 3,
            icon: "users",
            title: "User Reach",
            value: `${beneficiaries || "0"}`,
            variant: 'small' as const,
        },
        {
            id: 4,
            icon: "gift-outline",
            title: "Invite & Earn",
            value: `${currency}${reward || "10.00"}`,
            subtitle: "Per referral",
            variant: 'referral' as const,
            onPress: () => Alert.alert("Referral", "Invite friends and earn rewards!"),
        },
    ];

    return (
        <View style={localStyles.grid}>
            {/* ROW 1 */}
            <View style={localStyles.row}>
                <Animated.View entering={FadeInDown.delay(100).duration(800)} style={localStyles.tile}>
                    <SummaryItem {...summaryData[0]} isBento columnIndex={0} totalColumns={2} />
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={localStyles.tile}>
                    <SummaryItem {...summaryData[1]} isBento columnIndex={1} totalColumns={2} />
                </Animated.View>
            </View>

            {/* ROW 2 */}
            <View style={localStyles.row}>
                <Animated.View entering={FadeInDown.delay(300).duration(800)} style={localStyles.tile}>
                    <SummaryItem {...summaryData[2]} isBento columnIndex={0} totalColumns={2} />
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(400).duration(800)} style={localStyles.tile}>
                    <SummaryItem {...summaryData[3]} isBento columnIndex={1} totalColumns={2} />
                </Animated.View>
            </View>
        </View>
    );
};

const localStyles = StyleSheet.create({
    grid: {
        gap: 15,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        gap: 15,
    },
    tile: {
        flex: 1,
    }
});

export default SummaryCard;
