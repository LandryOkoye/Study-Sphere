"use client";

import { useEffect } from "react";
import { useWallet } from "@/context/WalletContext";

export function StudyTracker() {
  const { address } = useWallet();

  useEffect(() => {
    // Only track time if a wallet is connected (user is "signed in")
    if (!address) return;

    let totalSeconds = 0;
    
    const interval = setInterval(() => {
      // Get current date string in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `study_time_${today}`;
      
      // Read current seconds for today, or default to 0
      const currentSecondsStr = localStorage.getItem(storageKey);
      let currentSeconds = currentSecondsStr ? parseInt(currentSecondsStr, 10) : 0;
      
      // Add 60 seconds (1 minute) per interval tick
      currentSeconds += 60;
      
      // Save back to local storage
      localStorage.setItem(storageKey, currentSeconds.toString());
      
      // Also update the heatmap data format used by the profile page
      // Format: { "YYYY-MM-DD": true/false (if >= 1200) }
      try {
        const historyStr = localStorage.getItem("study_history");
        const history = historyStr ? JSON.parse(historyStr) : {};
        
        // If they hit 20 minutes (1200 seconds), mark today as active in history!
        if (currentSeconds >= 1200) {
          history[today] = true;
          localStorage.setItem("study_history", JSON.stringify(history));
        }
      } catch (err) {
        console.error("Failed to parse study history", err);
      }
    }, 60000); // Run every 60 seconds

    return () => clearInterval(interval);
  }, [address]);

  return null;
}
