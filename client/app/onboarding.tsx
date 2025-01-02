/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import { useState, useRef } from "react";
import {
  Text,
  View,
  SafeAreaView,
  FlatList,
  Animated,
  Pressable,
  ImageSourcePropType,
} from "react-native";
import OnboardingItem from "../components/OnboardingItem";
import Paginator from "@/components/Paginator";
import { Link } from "expo-router";

//Onboarding Page
export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  // const [buttonTitle, setButtonTitle] = useState("Skip");
  const scrollX = useRef(new Animated.Value(0)).current;
  const pagesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    const firstViewableItem = viewableItems[0];
    if (firstViewableItem.index !== null) {
      setCurrentIndex(firstViewableItem.index); //changes the current index to the index of the viewable item
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current; //next slide must be 50% visible to change the current index

  return (
    <SafeAreaView style={[styles.viewPager, { alignItems: "center" }]}>
      <View style={{ flex: 3 }}>
        <FlatList
          data={pages}
          renderItem={({ item }) => <OnboardingItem item={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={pagesRef}
        />
      </View>
      <Paginator data={pages} scrollX={scrollX}></Paginator>
      <View style={styles.footerButtonContainer}>
        <Link href={"/driverOrstudent"} asChild>
          <Pressable style={styles.footerButton}>
            <Text style={{ color: "#fff", fontSize: 16 }}>
              {currentIndex === pages.length - 1 ? "Sign In" : "Skip"}
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const pages: Array<{
  id: string;
  title: string;
  image: ImageSourcePropType;
}> = [
  {
    id: "1",
    title: "Sign in with your UW Net ID or UWPD Driver Net ID",
    image: require("@/assets/images/husky-card.png"),
  },
  {
    id: "2",
    title: "Easily request and accept free rides around the UW campus",
    image: require("@/assets/images/request-ride.png"),
  },
  {
    id: "3",
    title:
      "Track your driver's location, and share your ride details with others to ensure safety",
    image: require("@/assets/images/location.png"),
  },
  {
    id: "4",
    image: require("@/assets/images/husky.png"),
    title: "Ready to begin?",
  },
];
