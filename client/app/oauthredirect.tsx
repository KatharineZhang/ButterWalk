import { View, Text } from "react-native";
import { Stack } from "expo-router";

const Loading = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center', 
        alignItems: 'center',
      }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={{ fontFamily: 'lucida grande', fontSize: 30, fontStyle: 'normal', textAlign: 'center', color:'#4B2E83' }}>
        Loading!
      </Text>
      <Text style={{ fontFamily: 'lucida grande', fontSize: 15, fontStyle: 'normal', textAlign: 'center'}}>
        Please wait as we redirect you to the next page...
      </Text>
    </View>
  );
};

export default Loading;
