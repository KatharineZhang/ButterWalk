import { StyleSheet } from "react-native";

//This is absolutely a MESS and we need to fix it.
// naming conventions are all over the place
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  largeText: {
    fontSize: 25,
  },
  medText: {
    fontSize: 20,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
    alignSelf: "center",
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 16,
  },
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  viewOnboardingPager: {
    width: "100%",
    height: "90%",
  },
  onboardingFooterButtonContainer: {
    position: "absolute",
    bottom: 5,
    right: 20,
    elevation: 3,
    opacity: 0.9,
  },
  onboardingFooterButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
  },
  headerButtonContainer: {
    position: "absolute",
    right: 10,
    top: 65,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
  },
  header: {
    position: "absolute",
    top: 1,
    height: "15%",
    width: "100%",
    paddingTop: 40,
    backgroundColor: "#D1AE49",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  image: {
    flex: 0.7,
    justifyContent: "center",
    alignContent: "center",
  },
  paginatorDot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#333",
    marginHorizontal: 8,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },

  appNameText: {
    fontSize: 40,
    lineHeight: 50,
    fontWeight: "700",
    letterSpacing: 0,
    color: "black",
    textAlign: "center",
    fontFamily: "Encode Sans",

  },
  signInText: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: 700,
    letterSpacing: 0,
    color: "black",
    fontFamily: "Encode Sans",
    textAlign: "center",
    paddingTop: 20,
  },
  signinLogo: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    margin: 30,
  },
  signInGoogleContainer: {
    flexDirection: "row",
    margin: 10,
    padding: 10,
    borderRadius: 10,
    borderColor: "#C1C1C1",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  signInGoogleLogo: {
    marginRight: 10,
    width: 30,
    height: 30,
  },
  signInButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
  },

  signInbottomImageContainer: {
    resizeMode: "contain",
    width: "60%",
    position: "absolute",
    top: 0,
    alignItems: "flex-start",
  },

  input: {
    height: 50,
    width: 335,
    borderWidth: 1,
    marginVertical: 4,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    textAlign: "left",
    borderColor: "#ccc",
  },
  inputFocused: {
    borderColor: "#4B2E83",
  },
  heading: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "black",
    justifyContent: "flex-start",
    fontFamily: "Encode Sans",
    textAlign: "left",
    alignSelf: "flex-start",
    marginLeft: 23,
    marginBottom: 30,
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "black",
    textAlign: "left",
  },
  button_finishAcc: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: "#4B2E83",
    alignSelf: "center",
    width: 335,
    marginTop: 10,
    marginLeft: 5,
  },
  button_text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
    fontFamily: "DM Sans",
    textAlign: "center",
  },
  description: {
    fontFamily: "Open Sans",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 18,
    letterSpacing: 0.25,
    color: "black",
    textAlign: "left",
    marginTop: 10,
    marginLeft: 3,
  },
  fullModalView: {
    backgroundColor: "#E4E2F0",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "100%",
    height: "100%",
    position: "absolute",
    bottom: -100,
  },

  // Ride Request Form styles

  formContainer: {
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  requestFormContainer: {
    left:-14,
    width: "108%",
    borderRadius: 10,
    shadowRadius: 2,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 7 },
    shadowColor: "gray",
    paddingHorizontal: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  }, 
  infoText:{
    fontSize: 12,
    color: "#4B4C4F",
    fontWeight: 400,
    lineHeight: 16.34,
    fontFamily: "Open Sans",
    marginBottom: 40,
  },
  riderImage: {
    width: 32, 
    height: 32,
    resizeMode: "contain",
  },
  formHeader: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 30,
  },
  sendButton: {
    position: "relative",
    marginTop: "20%",
    backgroundColor: "#4B2E83",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    textAlign: "center",
    color: "white",
    fontSize: 16,
    padding: 10,
  },
  clearButton: {
    padding: 10,
  },
  animationContainer: {
    marginTop: 8,
    borderWidth: 2,
    borderRadius: 16,
    borderColor: "#4B2E83",
    paddingVertical: 3,
    paddingHorizontal: 40,
    width: "100%",
  },
  riderContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  riderCount: {
    fontSize: 18,
    marginTop: 0,
    marginBottom: 8,
    marginLeft: 5,
  },
  riderIconsContainer: {
    flexDirection: "row",
    position: "relative",
    justifyContent: "center",
    height: 50,
  },
  riderIcon: {
    opacity: 1,
  },
  riderControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Centers horizontally
    marginVertical: 10,
  },
  riderCountContainer: {
    minWidth: 50, // Ensures consistent spacing
    alignItems: "center",
  },
  modalCloseButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  faqHeader: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "left",
  },
  faqSubtitle: {
    paddingVertical: 5,
    fontSize: 20,
  },
  accordianPadding: {
    paddingVertical: 5,
  },
  accordianContainer: {
    paddingVertical: 15,
    borderRadius: 10,
    alignContent: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  accordianHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 5,
  },
  accordianHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
    color: "#4B2E83",
  },
  accordianContentContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
    width: "95%",
    overflow: "scroll",
  },
  accordianContentText: {
    color: "#4B2E83",
  },
  accordianPlusMinus: {
    width: 20,
    height: 20,
  },
  accordianImage: {
    width: 280,
    height: 280,
    borderWidth: 1,
    borderRadius: 16,
  },
  accordianLink: {
    color: "#8E632A",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  // bottom modal styles
  bottomModalView: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "100%",
    height: "50%",
    position: "absolute",
    bottom: -100,
  },
  bottomModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  waitTimeText: {
    fontSize: 16,
    marginBottom: 8,
    fontStyle: "italic",
  },
  locationContainer: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    width: "100%",
    backgroundColor: "#EEEEEE",
    alignContent: "center",
    flexDirection: "row",
  },
  locationImage: {
    position: "absolute",
    left: 25,
    bottom: 15,
    width: 20,
    height: 20,
  },
  locationTextContainer: {
    paddingLeft: 80,
  },
  bottomModalButtonContainer: {
    paddingVertical: 10,
    justifyContent: "center",
    width: "100%",
  },
  bottomModalButton: {
    padding: 20,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: "#4B2E83",
  },
  cancelButton: {
    backgroundColor: "red",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  // progressBar
  progressContainer: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "white",
    padding: 16,
    borderRadius:10
  },
  progressBarTop: {
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "#EEEEEE",
      padding: 15,
      marginBottom: 10,
  },
  mainTextContainer: {
      flexDirection: "row",
      marginBottom: 10,
  },
  mainText: {
      fontSize: 18,
      textAlign: "center",
      fontWeight: "bold",
      flex: 1,
  },
  subTextContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
  },
  subText: {
      fontSize: 16,
      marginLeft: 8,
      fontStyle: "italic",
  },
  progressBarBottom: {
      alignItems: "center",
      paddingBottom: 25,
  },
  rideTimeText: {
      fontSize: 12,
      fontWeight: "bold",
      marginVertical: 8,
  },
  progressBarWrapper: {
      flexDirection: "row",
      alignItems: "center",
      width: 320,
      position: "relative",
  },
  progressBar: {
      flex: 1,
      height: 15,
      borderRadius: 6,
      backgroundColor: "#E3E3E3",
      maxWidth: "100%",
      width: 370,
      zIndex: 1,
  },
  circleStart: {
      width: 22,
      height: 22,
      borderRadius: 13,
      backgroundColor: "#4B2E83",
      borderWidth: 2,
      borderColor: "#000000",
      position: "absolute",
      left: 0,
      zIndex: 2,
  },
  circleEnd: {
      width: 22,
      height: 22,
      borderRadius: 13,
      backgroundColor: "#E34B64",
      borderWidth: 2,
      borderColor: "#000000",
      position: "absolute",
      right: 0,
      zIndex: 2,
  },
  locationsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 15,
  },
  pickUpContainer: {
      alignItems: "flex-start",
      maxWidth: "50%"
  },
  dropOffContainer: {
      alignItems: "flex-end",
      maxWidth: "50%"
  },
  locationTitle: {
      fontWeight: "bold",
      fontSize: 12,
      marginBottom: 3,
  },
  locationText: {
      fontSize: 12,
  },
  homePageComponentContainer: {
    position: "absolute",
     width: "100%",
      height: "100%",
      shadowRadius: 5,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: -7 },
    shadowColor: "grey",
    pointerEvents: "box-none",
  },
  profileItemContainer: {
    padding: 10,
    borderWidth: 1,
    width: "100%",
    borderRadius: 10,
    marginVertical: 5,
    borderColor: "grey",
  },
  profileItem: {
    fontSize: 20,
    textTransform: "capitalize",
  },

  // notification component
  notificationContainer: {
    position: "absolute",
    top: 40,
    left: 10,
    right: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 6,
  },

  // segmented progress bar
  segmentedProgressContainer: {
    flexDirection: "row",
    width: "100%",
    height: 5,
    paddingHorizontal: 10,
  },
  segmentedProgressBar: {
    borderRadius: 4,  
    width: "33%",
  },

  // confirm ride
  confirmHeader:{
    marginLeft: 30,
    fontSize: 16,
    color: "#4b2e83",
    fontWeight: "bold",
    paddingBottom: 20,
  },
});


export const loadingPageCompStyles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#4B2E83",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    padding: 20,
  },
  locationMainTextTypography: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Open Sans",
    fontWeight: "700",
  },
  locationSubTextTypography: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Open Sans",
    fontWeight: "400",
  },
  middleDisplayContainer: {
    padding: 40,
    top: "15%",
    alignItems: "center",
    height: 150,
    justifyContent: "space-between"
  },
  mainTextTypography: {
    color: "#FFF",
    textAlign: "center",
    fontFamily: "Encode Sans",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 28,
  },
  subtextTypography: {
    color: "#FFF",
    textAlign: "center",
    fontFamily: "Open Sans",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 23,
  },
});
