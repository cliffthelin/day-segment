import { db } from "./db"

export const resetWelcomeModal = async () => {
  try {
    // Reset the welcome modal flag
    await db.settings.put({ key: "welcomeModalShown", value: false })
    console.log("Welcome modal reset successfully")
    return true
  } catch (error) {
    console.error("Error resetting welcome modal:", error)
    return false
  }
}
