/**
 * Utility functions for improving speech-to-text transcription accuracy
 */

// Common filler words to remove if enabled
const fillerWords = [
  "um",
  "uh",
  "er",
  "ah",
  "like",
  "you know",
  "I mean",
  "so",
  "basically",
  "actually",
  "literally",
  "sort of",
  "kind of",
  "just",
  "well",
  "right",
  "okay",
  "hmm",
  "mmm",
]

// Common word replacements to improve accuracy
const wordReplacements: Record<string, string> = {
  gonna: "going to",
  wanna: "want to",
  gotta: "got to",
  kinda: "kind of",
  sorta: "sort of",
  dunno: "don't know",
  yeah: "yes",
  nah: "no",
  cause: "because",
  cuz: "because",
  til: "until",
  bout: "about",
  imma: "I am going to",
  lemme: "let me",
  gimme: "give me",
  tryna: "trying to",
  shoulda: "should have",
  coulda: "could have",
  woulda: "would have",
  musta: "must have",
  hafta: "have to",
}

/**
 * Removes filler words from the transcription
 */
export function removeFillerWords(text: string): string {
  let result = text

  // Create a regex pattern for all filler words with word boundaries
  const fillerPattern = new RegExp(`\\b(${fillerWords.join("|")})\\b`, "gi")

  // Replace filler words with empty string
  result = result.replace(fillerPattern, "")

  // Clean up extra spaces
  result = result.replace(/\s+/g, " ").trim()

  return result
}

/**
 * Replaces commonly misheard words with their correct versions
 */
export function replaceCommonWords(text: string): string {
  let result = text

  // Replace each word
  Object.entries(wordReplacements).forEach(([incorrect, correct]) => {
    const wordPattern = new RegExp(`\\b${incorrect}\\b`, "gi")
    result = result.replace(wordPattern, correct)
  })

  return result
}

/**
 * Fixes capitalization in the transcription
 */
export function fixCapitalization(text: string): string {
  if (!text) return text

  let result = text

  // Capitalize first letter of each sentence
  result = result.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, p1, p2) => {
    return p1 + p2.toUpperCase()
  })

  // Capitalize "I" when it's a standalone word
  result = result.replace(/\b(i)\b/g, "I")

  // Capitalize common proper nouns (could be expanded)
  const properNouns = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ]

  properNouns.forEach((noun) => {
    const nounPattern = new RegExp(`\\b${noun}\\b`, "gi")
    result = result.replace(nounPattern, noun.charAt(0).toUpperCase() + noun.slice(1))
  })

  return result
}

/**
 * Adds missing punctuation to the transcription
 */
export function fixPunctuation(text: string): string {
  if (!text) return text

  let result = text

  // Add period at the end if missing
  if (!/[.!?]$/.test(result.trim())) {
    result = result.trim() + "."
  }

  // Fix spacing around punctuation
  result = result.replace(/\s+([.,;:!?])/g, "$1")

  // Add space after punctuation if missing
  result = result.replace(/([.,;:!?])([a-zA-Z])/g, "$1 $2")

  // Fix multiple punctuation
  result = result.replace(/([.!?]){2,}/g, "$1")

  return result
}

/**
 * Improves formatting of numbers, dates, times, etc.
 */
export function improveFormatting(text: string): string {
  let result = text

  // Convert number words to digits for small numbers
  const numberWords: Record<string, string> = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
    eleven: "11",
    twelve: "12",
    thirteen: "13",
    fourteen: "14",
    fifteen: "15",
    sixteen: "16",
    seventeen: "17",
    eighteen: "18",
    nineteen: "19",
    twenty: "20",
    thirty: "30",
    forty: "40",
    fifty: "50",
    sixty: "60",
    seventy: "70",
    eighty: "80",
    ninety: "90",
  }

  // Replace number words with digits
  Object.entries(numberWords).forEach(([word, digit]) => {
    const wordPattern = new RegExp(`\\b${word}\\b`, "gi")
    result = result.replace(wordPattern, digit)
  })

  // Format percentages
  result = result.replace(/(\d+)\s*percent/gi, "$1%")

  // Format times
  result = result.replace(/(\d+)\s*hours?\s+and\s+(\d+)\s*minutes?/gi, "$1:$2")

  // Format dates
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ]

  months.forEach((month, index) => {
    const monthNum = (index + 1).toString().padStart(2, "0")
    const monthPattern = new RegExp(`\\b${month}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "gi")
    result = result.replace(monthPattern, `${month.charAt(0).toUpperCase() + month.slice(1)} $1`)
  })

  return result
}

/**
 * Applies all transcription improvements
 */
export function improveTranscription(
  text: string,
  options: {
    removeFillers?: boolean
    improveFormatting?: boolean
  } = {},
): string {
  if (!text) return text

  let result = text

  // Apply word replacements
  result = replaceCommonWords(result)

  // Remove filler words if enabled
  if (options.removeFillers) {
    result = removeFillerWords(result)
  }

  // Fix capitalization
  result = fixCapitalization(result)

  // Fix punctuation
  result = fixPunctuation(result)

  // Improve formatting if enabled
  if (options.improveFormatting) {
    result = improveFormatting(result)
  }

  return result
}

/**
 * Processes transcription with configurable options
 */
export function processTranscription(
  text: string,
  options = {
    removeFillerWords: false,
    improveAccuracy: true,
  },
): string {
  if (!text) return text

  return improveTranscription(text, {
    removeFillers: options.removeFillerWords,
    improveFormatting: options.improveAccuracy,
  })
}
