// Both_ProgressBar.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ProgressBar as PaperProgressBar } from "react-native-paper";
import { styles } from "../assets/styles";

interface ProgressBarProps {
  progress: number;          // 0..1
  toPickupDuration: number;  // minutes (top label)
  toDropoffDuration: number; // minutes (top label)
  pickupAddress?: string;     // bottom label
  dropoffAddress?: string;    // bottom label
}

export default function ProgressBar({
  progress,
  toPickupDuration,
  toDropoffDuration,
  pickupAddress,
  dropoffAddress,
}: ProgressBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.progressContainer}>
      {/* Top labels and button to expand */}
      <View style={styles.progressBarTop}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Left: to-pickup */}
          <View style={{ marginRight: 24 }}>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>
              {toPickupDuration} min to pickup
            </Text>
          </View>

          {/* Center: to-dropoff (ride) */}
          <View style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>
              {toDropoffDuration} min to dropoff
            </Text>
          </View>

          {/* Expand / collapse */}
          <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
            <Text
              style={[
                { textDecorationLine: "underline", fontSize: 12 },
              ]}
            >
              {expanded ? "(Less Details)" : "(More Details)"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* The circles on the progress bar + the bar itself */}
      <View style={styles.progressBarWrapper}>
        {/* left circle (start) */}
        <View style={[styles.circleStart, { backgroundColor: "white" }]} />
        {/* middle circle (pickup) — position matches your existing UI */}
        <View style={[styles.circleStart, { left: 130 }]} />

        {/* Progress bar */}
        <PaperProgressBar
          progress={progress}
          color="#C5B4E3"
          style={styles.progressBar}
        />

        {/* right circle (dropoff) */}
        <View style={styles.circleEnd} />
      </View>

      {/* Bottom labels (start, pickup, dropoff) + addresses */}
      <View style={styles.locationsContainer}>
        {/* Start + Pickup block */}
        <View style={{ flexDirection: "row", maxWidth: "50%" }}>
          <View style={{ alignSelf: "flex-start" }}>
            <Text style={styles.locationTitle}>Start</Text>
          </View>

          <View
            style={{
              left: 60,
              width: 100,
              alignItems: "center",
            }}
          >
            <Text style={styles.locationTitle}>Pickup</Text>
            {expanded && pickupAddress && (
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 10, textAlign: "center" }}>
                  {pickupAddress}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Dropoff block */}
        <View style={[styles.dropOffContainer, { maxWidth: "30%" }]}>
          <Text style={styles.locationTitle}>Dropoff</Text>
          {expanded && dropoffAddress &&(
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, textAlign: "right" }}>
                {dropoffAddress}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
