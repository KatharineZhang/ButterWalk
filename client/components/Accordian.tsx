/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from '@/assets/styles';
import { Link } from 'expo-router';
import * as Router from 'expo-router';

import { useState } from "react";
import {
  Animated,
  TouchableWithoutFeedback,
  View,
  Image,
  Text,
  ScrollView,
  ImageSourcePropType,
} from "react-native";

// The accordian component is a collapsible view that displays a title and content
// it also supports external links (and the text to click on to follow that link) and images
export interface AccordionProps {
  title: string;
  content: string;
  image?: ImageSourcePropType;
  link?: Router.ExternalPathString;
  linkText?: string;
}

export default function Accordion({
  title,
  content,
  image,
  link,
  linkText,
}: AccordionProps) {
  const [open, setOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const numLines = content.split(" ").length;

  const heightInterpolation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, image? (numLines / 2.6) * 10 + 300 : (numLines / 3) * 10],
  });

  const toggleOpen = () => {
    if (!open) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
    setOpen(!open);
  };

  return (
    <View style={styles.accordianPadding}>
      <View style={styles.accordianContainer}>
        <TouchableWithoutFeedback onPress={toggleOpen}>
          <View style={styles.accordianHeader}>
            <Text style={styles.accordianHeaderText}>{title}</Text>
            {open ? (
              <Image
                source={require("@/assets/images/faq-minus.png")}
                style={styles.accordianPlusMinus}
              />
            ) : (
              <Image
                source={require("@/assets/images/faq-plus.png")}
                style={styles.accordianPlusMinus}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.accordianContentContainer,
            { height: heightInterpolation },
          ]}
        >
          <ScrollView>
          <Text style={styles.accordianContentText}>{content}</Text>
          <View style={{ height: 10 }} />
          {image && <Image style={styles.accordianImage} source={image} />}
          <View style={{ height: 20 }} />
          {link && (
            <Link href={link}>
              <Text style={styles.accordianLink}>{linkText}</Text>
            </Link>
          )}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}