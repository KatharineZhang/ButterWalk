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
import { Link, router } from "expo-router";

//Onboarding Page
export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const pagesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const firstViewableItem = viewableItems[0];
      if (firstViewableItem.index !== null) {
        setCurrentIndex(firstViewableItem.index); //changes the current index to the index of the viewable item
      }
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current; //next slide must be 50% visible to change the current index

  return (
    <SafeAreaView
      style={[
        styles.viewOnboardingPager,
        { alignItems: "center" },
        { backgroundColor: pages[currentIndex].color },
      ]}
    >
      {currentIndex === pages.length - 1 ? (
        // Content for last page without overlay panel
        <View style={styles.lastPageContent}>
          <View style={{ marginBottom: 190 }}>
            <Text style={[styles.overlayText, { paddingHorizontal: 60 }]}>
              {pages[currentIndex].title}
            </Text>
            <Text style={[styles.overlayTextSmall]}>
              {pages[currentIndex].text}
            </Text>
          </View>

          <View style={styles.navigationContainer}>
            <Link href={"/driverOrstudent"} asChild>
              <Pressable style={styles.navigationButton}>
                <Text style={styles.navigationButtonText}>Skip</Text>
              </Pressable>
            </Link>
            <Paginator data={pages} scrollX={scrollX} />
            <Pressable
              style={styles.startedButton}
              onPress={() => router.push("/driverOrstudent")}
            >
              <Text style={styles.startedButtonText}>Get Started</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // Overlay panel for other pages
        <View style={styles.overlayPanel}>
          <Text style={styles.overlayText}>{pages[currentIndex].title}</Text>
          <Text style={styles.overlayTextSmall}>
            {pages[currentIndex].text}
          </Text>
          <View style={styles.navigationContainer}>
            <Link href={"/driverOrstudent"} asChild>
              <Pressable style={styles.navigationButton}>
                <Text style={styles.navigationButtonText}>Skip</Text>
              </Pressable>
            </Link>
            <Paginator data={pages} scrollX={scrollX} />
            <Pressable
              style={[styles.navigationButton, styles.nextButton]}
              onPress={() => {
                pagesRef.current?.scrollToIndex({
                  index: currentIndex + 1,
                  animated: true,
                });
              }}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View
        style={[{ flex: 3 }, { backgroundColor: pages[currentIndex].color }]}
      >
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
    </SafeAreaView>
  );
}

const pages: Array<{
  id: string;
  title: string;
  image: ImageSourcePropType;
  text: string;
  color: string;
}> = [
  {
    id: "1",
    title: "Seamless Login",
    image: require("@/assets/images/hbw-vectors-id 1.png"),
    text: "Swiftly create and login to your account using your UW NetID",
    color: "#C5B4E3",
  },
  {
    id: "2",
    title: "Navigate with Ease",
    image: require("@/assets/images/hbw-vectors-phone 1.png"),
    text: "Easily request free rides around the University of Washington campus",
    color: "#4B2E83",
  },
  {
    id: "3",
    title: "Enhance Your Safety",
    image: require("@/assets/images/hbw-vectors-shield 1.png"),
    text: "Track your driver's location, and safely get to your destination",
    color: "#D7C896",
  },
  {
    id: "4",
    image: require("@/assets/images/hbw-vectors-car 1.png"),
    title: "Ready for a Smooth Ride?",
    text: "Press Get Started to login or create an account to schedule a smooth and safe ride!",
    color: "white",
  },
];
