/**
 * Utility functions for haptic feedback using the Vibration API
 */

// Check if vibration is supported
export function isVibrationSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator
}

// Vibrate with a pattern if supported and enabled
export function vibrate(pattern: number | number[], enabled = true): boolean {
  if (!enabled || !isVibrationSupported()) {
    return false
  }

  try {
    navigator.vibrate(pattern)
    return true
  } catch (error) {
    console.error("Error triggering vibration:", error)
    return false
  }
}

// Predefined vibration patterns
export const VibrationPatterns = {
  // Short tap vibration (100ms)
  TAP: 100,

  // Double tap vibration (two short pulses)
  DOUBLE_TAP: [80, 50, 80],

  // Success vibration (medium then short)
  SUCCESS: [100, 30, 50],

  // Error vibration (three short pulses)
  ERROR: [60, 50, 60, 50, 60],

  // Warning vibration (long pulse)
  WARNING: 250,

  // Timer start vibration (short pulse)
  TIMER_START: 80,

  // Timer stop vibration (medium pulse)
  TIMER_STOP: 150,

  // Timer complete vibration (success pattern followed by medium pulse)
  TIMER_COMPLETE: [100, 30, 50, 30, 150],

  // Button press vibration (very short pulse)
  BUTTON_PRESS: 40,

  // Slider change vibration (very short pulse)
  SLIDER_CHANGE: 20,

  // Cancel vibration (medium-short pulse)
  CANCEL: 120,
}

// Intensity levels for haptic feedback
export type HapticIntensity = "light" | "medium" | "strong" | "success" | "error" | "warning"

/**
 * Trigger haptic feedback with the specified intensity
 * @param intensity The intensity of the haptic feedback
 * @param enabled Whether haptic feedback is enabled
 * @returns Whether the haptic feedback was triggered successfully
 */
export function triggerHapticFeedback(intensity: HapticIntensity = "medium", enabled = true): boolean {
  if (!enabled || !isVibrationSupported()) {
    return false
  }

  try {
    switch (intensity) {
      case "light":
        return vibrate(VibrationPatterns.BUTTON_PRESS, enabled)
      case "medium":
        return vibrate(VibrationPatterns.TAP, enabled)
      case "strong":
        return vibrate(VibrationPatterns.WARNING, enabled)
      case "success":
        return vibrate(VibrationPatterns.SUCCESS, enabled)
      case "error":
        return vibrate(VibrationPatterns.ERROR, enabled)
      case "warning":
        return vibrate(VibrationPatterns.WARNING, enabled)
      default:
        return vibrate(VibrationPatterns.TAP, enabled)
    }
  } catch (error) {
    console.error("Error triggering haptic feedback:", error)
    return false
  }
}
