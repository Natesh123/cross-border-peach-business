import React from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
    Platform,
    Dimensions
} from 'react-native';
import { CurvedBottomBarExpo } from 'react-native-curved-bottom-bar';
import Recipients from 'app/screens/recipients/Recipients';
import Vector from 'app/assets/vectors';
import Transactions from 'app/screens/transactions/Transactions';
import Profile from "../screens/profile/Profile";
import { theme } from '../core/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Home from 'app/screens/home/Home';
import { SIZES, FONTS, SHADOWS } from 'app/constants/Assets';

const { width } = Dimensions.get('window');

// Route display names
const TAB_LABELS: Record<string, string> = {
    Dashboard: 'HOME',
    Recipients: 'RECIPIENTS',
    Transactions: 'HISTORY',
    Profile: 'PROFILE',
};

export default function BottomTabNavigator() {
    const _renderIcon = (routeName: string, selectedTab: string) => {
        let icon = '';
        type TVector = "feather" | "fontawesome" | "ionicons" | "materialCI" | "materialicons" | "materialcommunityicons";

        let asIcon: TVector = 'ionicons';
        switch (routeName) {
            case 'Dashboard':
                icon = 'grid-outline';
                asIcon = 'ionicons';
                break;
            case 'Recipients':
                icon = 'person-add-outline';
                asIcon = 'ionicons';
                break;
            case 'Transactions':
                icon = 'swap-vertical-bold';
                asIcon = 'materialcommunityicons';
                break;
            case 'Profile':
                icon = 'person-circle-outline';
                asIcon = 'ionicons';
                break;
            default:
                break;
        }

        const isActive = routeName === selectedTab;

        return (
            <View style={[
                styles.iconWrapper,
                isActive && styles.activeIconWrapper
            ]}>
                <Vector
                    as={asIcon}
                    name={icon}
                    size={20}
                    color={isActive ? '#fff' : '#94a3b8'}
                />
            </View>
        );
    };

    const renderTabBar = ({ routeName, selectedTab, navigate }: { routeName: string, selectedTab: string, navigate: any }) => {
        const isActive = routeName === selectedTab;
        const label = TAB_LABELS[routeName] || routeName.toUpperCase();

        return (
            <TouchableOpacity
                onPress={() => navigate(routeName)}
                style={styles.tabbarItem}
                activeOpacity={0.7}
            >
                {_renderIcon(routeName, selectedTab)}
                <Text style={[
                    styles.tabLabel,
                    {
                        color: isActive ? '#3B2F2F' : '#94a3b8',
                        fontFamily: isActive ? FONTS.bold : FONTS.medium,
                        marginTop: isActive ? 4 : 6,
                    }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <CurvedBottomBarExpo.Navigator
            type="DOWN"
            shadowStyle={styles.shadow}
            height={78}
            circleWidth={64}
            bgColor="#ffffff"
            initialRouteName="Dashboard"
            borderTopLeftRight
            screenOptions={{ headerShown: false }}
            renderCircle={({ selectedTab, navigate }) => (
                <View style={[styles.btnCircleUp]}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigate('SendMoney')}
                        activeOpacity={0.9}
                    >
                        {/* Dark peach circle with paper plane — matches screenshot */}
                        <View style={styles.darkCircle}>
                            <Vector as="ionicons" name="paper-plane" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
            tabBar={renderTabBar}
        >
            <CurvedBottomBarExpo.Screen
                name="Dashboard"
                position="LEFT"
                component={() => <Home />}
            />
            <CurvedBottomBarExpo.Screen
                name="Recipients"
                position="LEFT"
                component={() => <Recipients />}
            />
            <CurvedBottomBarExpo.Screen
                name="Transactions"
                position="RIGHT"
                component={() => <Transactions />}
            />
            <CurvedBottomBarExpo.Screen
                name="Profile"
                position="RIGHT"
                component={() => <Profile navigation={{
                    replace: (nextRoute: string) => { },
                    navigate: (scene: string) => { }
                }} />}
            />
        </CurvedBottomBarExpo.Navigator>
    );
}

const styles = StyleSheet.create({
    shadow: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
        },
        android: {
            elevation: 20,
        },
        web: {
            boxShadow: '0px -8px 20px rgba(0,0,0,0.08)',
        }
    }) as any,
    button: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnCircleUp: Platform.select({
        ios: {
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            bottom: 38,
            shadowColor: '#3B2F2F',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
        },
        android: {
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            bottom: 38,
            elevation: 10,
        },
        web: {
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            bottom: 38,
            boxShadow: '0px 8px 12px rgba(59, 47, 47, 0.25)',
        }
    }) as any,
    // Dark Peach pill — exact match to screenshot
    darkCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#3B2F2F',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
            android: { elevation: 8 },
        }) as any,
    },
    tabbarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    activeIconWrapper: Platform.select({
        ios: {
            backgroundColor: '#3B2F2F',
            shadowColor: '#3B2F2F',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
        },
        android: {
            backgroundColor: '#3B2F2F',
            elevation: 4,
        },
        web: {
            backgroundColor: '#3B2F2F',
            boxShadow: '0px 4px 6px rgba(59,47,47,0.3)',
        }
    }) as any,
    tabLabel: {
        fontSize: 8,
        letterSpacing: 0.5,
    },
});