import { View, Text } from "react-native";
import { styles } from "@/assets/styles";
import Button from "@/components/button";
import PagerView from "react-native-pager-view";

//Page for request (wanted to rename it but when i did it had an error bc i think expo treats index.tsx as the home page)
export default function Tab() {
  return (
    <View style={styles.container}>
      <Text style={styles.largeText}> Home Page </Text>
      <Text style={styles.medText}> Incomming requests</Text>
      {/* Should probably be a component... but i'll leave it here for now
      Also can't figure out how to like move it up slightly */}
      {/* Should also figure out how to add like a scroll progress bar or something */}
      <View style={styles.viewPager}>
        <PagerView style={styles.container} initialPage={0}>
          <View style={styles.page} key="1">
            <Text style={styles.medText}>First page</Text>
            <Button
              label="Accept Request"
              link={"/pages-driver/(tabs)/confirm"}
            />
            <Text>Swipe ➡️</Text>
          </View>
          <View style={styles.page} key="2">
            <Text style={styles.medText}>Second page</Text>
            <Button
              label="Accept Request"
              link={"/pages-driver/(tabs)/confirm"}
            />
          </View>
          <View style={styles.page} key="3">
            <Text style={styles.medText}>Third page</Text>
            <Button
              label="Accept Request"
              link={"/pages-driver/(tabs)/confirm"}
            />
          </View>
        </PagerView>
      </View>
    </View>
  );
}
