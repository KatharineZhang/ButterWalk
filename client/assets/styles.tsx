import { StyleSheet } from "react-native";

//More random styling things that I think i copied from chatgpt....
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
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
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
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
    right : 20,
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
    zIndex:1
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
    flex: 1
  },
  faqCenteredView: {
    flex: 1,
    //  backgroundColor: 'rgba(0, 0, 0, 0.5)', // looks kind or weird when the background is dark
    justifyContent: "center",
    alignItems: "center",
  },
  faqModalView: {
    margin: 20,
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
  faqButton: {
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
    fontSize: 17,
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
  }
});
