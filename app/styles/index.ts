import { FONTS, SHADOWS, SIZES } from "../constants/Assets";
import { Dimensions, StyleSheet, Platform } from "react-native";
import { theme } from '../core/theme';
import { scale, verticalScale, moderateScale } from '../helpers/responsive';
const styles = StyleSheet.create({



  homeHeader: {
    backgroundColor: "#FCF5F1",
    padding: scale(10),
    flexDirection: "row",
    alignItems: "center",
    alignContent: "center",
    ...SHADOWS.shadow,
  },


  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCF5F1",
    borderRadius: scale(25),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    marginRight: scale(10),
    borderWidth: scale(1),
    borderColor: "#ddd",
    height: verticalScale(45),
  },

  searchInput: {
    flex: 1,
    fontSize: SIZES.h3,
    fontFamily: FONTS.regular,
    color: "#333",
  },

  addButtonRound: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B2F2F",
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
  },
  addButtonText: {
    color: "#FCF5F1",
    fontSize: SIZES.h3,
    fontFamily: FONTS.semibold,
    fontWeight: "600",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    backgroundColor: "#FCF5F1",
    borderBottomWidth: scale(1),
    borderBottomColor: "#ddd",
  },
  backButton: {
    padding: scale(4),
    marginRight: scale(10),
  },
  headerTitle: {
    fontSize: SIZES.h3,
    fontFamily: FONTS.regular,
    fontWeight: "600",
    color: "#000",
  },
  header: {
    fontSize: SIZES.h2,
    fontFamily: FONTS.semibold,
    color: theme.colors.color,
    paddingVertical: scale(5),
    marginBottom: scale(5),
    fontWeight: '600'
  },


  menuText: {
    fontSize: SIZES.h3,
    fontFamily: FONTS.regular,
    color: theme.colors.black50,
  },
  headers: {
    fontSize: SIZES.font,
    fontFamily: FONTS.bold,
    color: theme.colors.darkgray,
    marginBottom: scale(5),
    fontWeight: 'bold',
    marginLeft: "30%"
  },
  recipient: {
    marginLeft: scale(20),
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: theme.colors.darkgray,
    fontFamily: FONTS.regular,
    paddingVertical: scale(5),
    marginBottom: scale(5)
  },
  recipients: {
    marginLeft: scale(5),
    fontSize: SIZES.h3,
    color: theme.colors.darkgray,
    fontFamily: FONTS.regular,
    paddingVertical: scale(5),
    marginTop: scale(-25),
    flexWrap: 'wrap',
    width: '100%',
  },
  headerDescription: {
    fontSize: SIZES.p16,
    color: theme.colors.black50,
    fontFamily: FONTS.medium,
    paddingVertical: scale(14),
  },
  container: {

    flex: 1,
    // backgroundColor:'#fbfdff'
  },

  scrollview: {
    width: "100%", paddingBottom: scale(60)
  },
  inputContainer: {
    marginBottom: scale(15),
    flexDirection: 'column',
  },
  inputLabel: {
    color: theme.colors.color,
    fontSize: SIZES.h3,
    marginVertical: scale(5),
    fontFamily: FONTS.medium
  },
  inputControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCF5F1',
    borderColor: '#ddd',
    borderWidth: scale(1),
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
  },
  error: {
    fontSize: SIZES.font,
    fontFamily: FONTS.regular,
    color: theme.colors.error,
    paddingHorizontal: scale(4),
    paddingTop: scale(4),
  },
  startButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: theme.colors.secondary,
    borderRadius: scale(30),
    width: "100%",
    padding: scale(10),
    paddingHorizontal: scale(25),
  },
  startIcon: {
    height: verticalScale(35),
    width: scale(35),
    borderRadius: scale(40),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.tertiary,
  },
  primaryColor: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
  },
  secondaryColor: {
    backgroundColor: theme.colors.secondary,
    color: theme.colors.primary,
  },
  tertiaryColor: {
    backgroundColor: theme.colors.tertiary,
    color: theme.colors.primary,
  },
  cardWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(20),
  },
  profileIcon: {
    width: scale(50),
    height: verticalScale(50),
    borderRadius: scale(50),
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.elevation0,
  },
  largeButton: { width: "100%", height: verticalScale(55), paddingVertical: scale(8), borderRadius: 10 },
  bottomButton: { width: "100%", padding: scale(10), position: "absolute", bottom: scale(0), left: 10 },
  leadingIcon: {
    width: scale(40),
    height: verticalScale(40),
    borderRadius: scale(40),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -SIZES.p20,
    ...SHADOWS.elevation0,
  },
  cardMainWrapper: Platform.select({
    ios: {
      backgroundColor: theme.colors.secondary,
      borderRadius: SIZES.p20,
      shadowColor: theme.colors.color,
      shadowOffset: { width: scale(0), height: 0 },
      shadowOpacity: 0.05,
      shadowRadius: 24,
      padding: scale(20),
    },
    android: {
      backgroundColor: theme.colors.secondary,
      borderRadius: SIZES.p20,
      padding: scale(20),
      elevation: 1,
    },
    web: {
      backgroundColor: theme.colors.secondary,
      borderRadius: SIZES.p20,
      padding: scale(20),
      boxShadow: `0px 0px 24px ${theme.colors.color}0D`, // 0D is ~0.05 opacity
    }
  }) as any,
  gray10ButtonView: {
    backgroundColor: theme.colors.gray10,
    marginVertical: SIZES.p20,
    marginHorizontal: SIZES.p20,
    padding: SIZES.p6,
    borderRadius: SIZES.small,
  },
  whiteButtonView: {
    backgroundColor: theme.colors.white,
    marginVertical: SIZES.p20,
    marginHorizontal: SIZES.p20,
    padding: SIZES.p6,
    borderRadius: SIZES.small,
  },
  primaryButtonView: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: SIZES.p20,
    padding: SIZES.p15,
    borderRadius: SIZES.small,
  },
  primaryButtonText: {
    textAlign: "center",
    color: theme.colors.white,
    fontFamily: FONTS.semibold,
    fontSize: SIZES.h2,
  },
  primaryLinkTextView: {
    backgroundColor: theme.colors.primary,
  },
  primaryLinkText: {
    color: theme.colors.link,
    fontFamily: FONTS.regular,
    fontSize: SIZES.h3,
    paddingRight: SIZES.p6,
  },
  headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  selectorStyle: { borderColor: theme.colors.gray10 },
  dropdownContainerStyle: {
    width: '100%',
    marginTop: scale(5),
    borderColor: theme.colors.gray10,
  },
  spacing: {
    margin: scale(10)
  },
  spacing_big: {
    margin: scale(30)
  },
  label: {
    fontWeight: '300',
    fontFamily: FONTS.regular,
    paddingLeft: scale(5),
    fontSize: SIZES.p18,
    color: theme.colors.black50,
  },
  input: {
    height: verticalScale(50),
    width: '100%',
    padding: scale(12),
    fontSize: SIZES.h3,
    fontFamily: FONTS.regular,
    outlineStyle: 'none'
  } as any,
  imagecontainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image_logo: {
    width: scale(200),
    height: verticalScale(200),
    resizeMode: 'contain',

  },
  card: {
    backgroundColor: '#FCF5F1',
    padding: scale(10),
    margin: scale(10),
    borderRadius: scale(7),
    elevation: 5,
    marginTop: scale(100),
  },
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: scale(24),
  },
  rightSide: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: scale(24),
  },
  row: {
    flexDirection: 'row',
    marginTop: scale(4),
  },

  link: {
    fontWeight: 'bold',
    fontFamily: FONTS.regular,
    color: theme.colors.primary,
  },
  sideMenuProfileIcon: {
    width: scale(50),
    height: verticalScale(50),
    borderRadius: 50 / 2,
    alignSelf: 'center',
    resizeMode: 'contain'
  },
  iconStyle: {
    width: scale(15),
    height: verticalScale(15),
    marginHorizontal: scale(5),
  },
  customItem: {
    padding: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBar: {
    width: '100%',
    height: verticalScale(70),
    backgroundColor: '#0D0D0D',
    alignContent: 'center',
    justifyContent: 'center'
  },
  navBarTitle: {
    color: 'white',
    fontSize: SIZES.h2,
    fontFamily: FONTS.bold,
    fontWeight: "bold",
    alignSelf: 'center'
  },
  scrollViewContainerStyle: {
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletBalanceAmount: {
    color: theme.colors.white,
    fontSize: SIZES.h3,
    fontWeight: "bold",
    paddingHorizontal: SIZES.p15,
    textAlign: "center",
    fontFamily: FONTS.monoBold,
    borderRadius: scale(50),
    backgroundColor: theme.colors.primary,
  },
  walletBalance: {
    color: theme.colors.primary,
    fontSize: SIZES.h3,
    fontWeight: "bold",
    paddingHorizontal: SIZES.p15,
    textAlign: "center",
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: FONTS.monoBold,
  },
  walletBalanceBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(10),
    backgroundColor: theme.colors.white,
    padding: scale(10),
    borderRadius: scale(10)
  },
  pickerItemsContainer: {
    position: 'absolute',
    top: scale(100),
    left: scale(50),
    right: scale(50),
  },
  picker: {
    height: verticalScale(50),
    width: scale(200),
    marginVertical: scale(12),
  },
});

export default styles;
