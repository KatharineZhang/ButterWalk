/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import Accordion, { AccordionProps } from "@/components/Accordian";
import PopUpModal from "@/components/PopUpModal";
import { JSX } from "react";
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
  return (
    <PopUpModal
      isVisible={isVisible}
      onClose={onClose}
      type="full"
      content={qandA}
    />
  );
}

// FAQ data
const faqContent: AccordionProps[] = [
  {
    title: "What are the hours of service?",
    content:
      "The hours of operation are listed below:" +
      "6:30 p.m. — 2 a.m. daily EXCEPT University holidays or when the University suspends operations.",
    link: "https://police.uw.edu/safety-escort-services/?_gl=1*nynm91*_ga*MTc1NDAwNzM1OC4xNjg3MDEzNDQ0*_ga_3T65WK0BM8*MTczODE4NzY0OC43My4xLjE3MzgxODc2ODQuMC4wLjA.*_gcl_au*MTU4NjcxMjM0Mi4xNzM2Mjc0MTE3*_ga_JLHM9WH4JV*MTczODE4NzY0OC43My4xLjE3MzgxODc2ODQuMC4wLjA.",
    linkText: "UW Husky SafeTrip Website",
  },
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
    title: "Is there always a long wait-time?",
    content:
      "It depends on how long the queue is! Generally, the queue tends to vary based on time of night, amount of UW alerts, and how many drivers are staffed for the night.\n\n" +
      "If the wait is too long, check out the NightRide shuttle! Shuttles pick up passengers from 8 p.m. until 1:34 a.m. for the East zone and from 8 p.m. until 1:39 a.m. for the West zone, Monday through Friday (excluding University holidays) during the Autumn, Winter and Spring quarters with extended service running until 3:30 a.m. the week before and the week of finals.",
    link: "https://transportation.uw.edu/getting-around/shuttles/nightride",
    linkText: "UW Husky NightRide Shuttle",
  },
  {
    title: "Who drives what car?",
    content:
      "To uphold safety and security of our students, the UW Police Department sends a uniformed security guard to provide a safe vehicle escort.\n\nBelow is an image of the type of car you should be looking for.",
    image: require("@/assets/images/uwpd-driver.png"),
  },
  {
    title: "Is this service free for everybody?",
    content:
      "Our service is completely free for UW students and staff members! Please make sure you have your UW ID to confirm your identity at pickup.",
  },
  {
    title: "How can I change my profile name?",
    content:
      "You need to go to your UW google account then Profile Info and change your name in the nickname field",
  },
];

export default FAQ;
