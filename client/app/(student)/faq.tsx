/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import Accordion, { AccordionProps } from "@/components/Accordian";
import PopUpModal from "@/components/PopUpModal";
import { Text, ScrollView, View } from "react-native";

// FAQ component that displays a list of frequently asked questions
// takes in props on if the faq modal should be shown and a function to close the modal
// this allows the modal to be controlled in an extrnal component
interface FAQProps {
  isVisible: boolean;
  onClose: () => void;
}

function FAQ({ isVisible, onClose }: FAQProps) {
  // the stuff that goes in the modal
  const qandA: JSX.Element = (
    <ScrollView>
      <View style={{ height: 60 }} />
      <Text style={styles.faqHeader}>Husky ButterWalk FAQ</Text>
      <Text style={styles.faqSubtitle}>University of Washington</Text>
      <View style={{ height: 10 }} />

      {faqContent.map((faq, index) => (
        <Accordion
          key={index}
          title={faq.title}
          content={faq.content}
          image={faq.image}
          link={faq.link}
          linkText={faq.linkText}
        />
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
  return <PopUpModal isVisible={isVisible} onClose={onClose} content={qandA} />;
}

// Sample FAQ data
const faqContent: AccordionProps[] = [
  {
    title: "Where is the zone of operation?",
    content:
      "As stated by the UW Police Department, at least one location (either the pickup or drop-off point)" +
      "must be affiliated with the campus (e.g., campus buildings or dorm halls). " +
      "Additionally, both locations must fall within the boundaries outlined below. " +
      "\n\nFor detailed boundary information, please refer to this page:",
    link: "https://www.google.com/maps/d/u/0/viewer?mid=1vw5w2MFNwZ9YZak1vCWRTEMaUGI-EBQ&ll=47.65994679136626%2C-122.30518874999999&z=14",
    linkText: "UW Husky ButterWalk Boundary Map",
    image: require("@/assets/images/faq-boundary.png"),
  },
  {
    title: "What are the hours of operation?",
    content:
      "Husky ButterWalk operates from 8:00 PM to 2:00 AM on weekdays and 8:00 PM to 3:00 AM on weekends.",
  },
  {
    title: "How do I request a ride?",
    content:
      "To request a ride, you must download the Husky ButterWalk app and sign in with your UW NetID. " +
      "Once you have signed in, you will be able to request a ride by entering your pickup and drop-off locations.",
  },
  {
    title: "How long will I have to wait for a ride?",
    content:
      "The average wait time for a ride is 10-15 minutes. However, wait times may vary depending on the time of day and demand.",
  },
];

export default FAQ;
