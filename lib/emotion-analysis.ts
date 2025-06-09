"use client"

// Simple emotion analysis utility
// This is a basic implementation - in a real app, you might use a more sophisticated NLP library

// Emotion keywords and their associated scores
const emotionKeywords = {
  joy: [
    "happy",
    "joy",
    "delighted",
    "pleased",
    "glad",
    "excited",
    "thrilled",
    "content",
    "satisfied",
    "cheerful",
    "elated",
    "jubilant",
    "ecstatic",
    "blissful",
    "wonderful",
    "great",
    "good",
    "positive",
    "awesome",
    "amazing",
    "love",
    "enjoy",
    "fun",
    "smile",
    "laugh",
  ],
  sadness: [
    "sad",
    "unhappy",
    "depressed",
    "down",
    "blue",
    "gloomy",
    "miserable",
    "melancholy",
    "sorrow",
    "grief",
    "heartbroken",
    "disappointed",
    "upset",
    "discouraged",
    "hopeless",
    "regret",
    "lonely",
    "alone",
    "abandoned",
    "rejected",
    "hurt",
    "pain",
    "cry",
    "tears",
    "weep",
  ],
  anger: [
    "angry",
    "mad",
    "furious",
    "outraged",
    "annoyed",
    "irritated",
    "frustrated",
    "enraged",
    "hostile",
    "bitter",
    "hate",
    "resent",
    "disgusted",
    "offended",
    "provoked",
    "infuriated",
    "exasperated",
    "indignant",
    "irate",
    "livid",
    "fuming",
    "seething",
    "rage",
    "temper",
    "yell",
  ],
  fear: [
    "afraid",
    "scared",
    "frightened",
    "terrified",
    "anxious",
    "worried",
    "nervous",
    "panicked",
    "alarmed",
    "concerned",
    "uneasy",
    "apprehensive",
    "dread",
    "horror",
    "terror",
    "panic",
    "phobia",
    "insecure",
    "threatened",
    "intimidated",
    "vulnerable",
    "helpless",
    "stress",
    "tense",
    "overwhelmed",
  ],
  surprise: [
    "surprised",
    "shocked",
    "astonished",
    "amazed",
    "stunned",
    "startled",
    "dumbfounded",
    "bewildered",
    "awestruck",
    "wonder",
    "unexpected",
    "sudden",
    "unpredictable",
    "unforeseen",
    "unanticipated",
    "remarkable",
    "extraordinary",
    "incredible",
    "unbelievable",
    "wow",
    "whoa",
    "gasp",
    "speechless",
    "disbelief",
    "revelation",
  ],
  disgust: [
    "disgusted",
    "repulsed",
    "revolted",
    "sickened",
    "nauseated",
    "appalled",
    "horrified",
    "aversion",
    "distaste",
    "dislike",
    "loathe",
    "detest",
    "abhor",
    "contempt",
    "scorn",
    "disdain",
    "despise",
    "gross",
    "nasty",
    "vile",
    "foul",
    "offensive",
    "repugnant",
    "repellent",
    "yuck",
  ],
  trust: [
    "trust",
    "believe",
    "faith",
    "confidence",
    "rely",
    "depend",
    "assured",
    "certain",
    "conviction",
    "credibility",
    "integrity",
    "honest",
    "loyal",
    "devoted",
    "dedicated",
    "reliable",
    "trustworthy",
    "truthful",
    "sincere",
    "genuine",
    "authentic",
    "respect",
    "admire",
    "value",
    "esteem",
  ],
  anticipation: [
    "anticipate",
    "expect",
    "await",
    "look forward",
    "hope",
    "eager",
    "excited",
    "enthusiastic",
    "optimistic",
    "hopeful",
    "promising",
    "potential",
    "prospect",
    "future",
    "upcoming",
    "soon",
    "imminent",
    "approaching",
    "coming",
    "pending",
    "prepare",
    "ready",
    "plan",
    "anticipation",
    "expectation",
  ],
}

// Intensity modifiers and their multipliers
const intensityModifiers = {
  very: 1.5,
  really: 1.5,
  extremely: 2,
  incredibly: 2,
  absolutely: 2,
  totally: 1.5,
  completely: 1.5,
  utterly: 2,
  deeply: 1.5,
  profoundly: 2,
  immensely: 2,
  terribly: 1.5,
  awfully: 1.5,
  exceptionally: 1.5,
  particularly: 1.2,
  quite: 1.2,
  somewhat: 0.7,
  slightly: 0.5,
  a_little: 0.5,
  a_bit: 0.5,
  rather: 1.2,
  fairly: 0.8,
  pretty: 1.2,
}

// Negation words that reverse the emotion
const negationWords = [
  "not",
  "no",
  "never",
  "neither",
  "nor",
  "none",
  "nothing",
  "nowhere",
  "hardly",
  "barely",
  "scarcely",
  "seldom",
  "rarely",
]

// Emojis for each emotion
const emotionEmojis = {
  joy: "😊",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
  trust: "🤝",
  anticipation: "🔮",
}

// Colors for each emotion
const emotionColors = {
  joy: "#FFD700", // Gold
  sadness: "#6495ED", // CornflowerBlue
  anger: "#FF4500", // OrangeRed
  fear: "#9370DB", // MediumPurple
  surprise: "#00FFFF", // Cyan
  disgust: "#32CD32", // LimeGreen
  trust: "#4169E1", // RoyalBlue
  anticipation: "#FF8C00", // DarkOrange
}

export function analyzeEmotion(text: string) {
  if (!text) {
    return {
      primaryEmotion: "neutral",
      secondaryEmotions: [],
      sentiment: 0,
      confidence: 0,
      emoji: "😐",
      color: "#808080",
      description: "No emotion detected",
    }
  }

  // Convert to lowercase and split into words
  const words = text.toLowerCase().split(/\s+/)

  // Initialize emotion scores
  const scores: Record<string, number> = {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    disgust: 0,
    trust: 0,
    anticipation: 0,
  }

  // Track negation state
  let negated = false
  let intensityMultiplier = 1

  // Analyze each word
  for (let i = 0; i < words.length; i++) {
    const word = words[i]

    // Check for negation
    if (negationWords.includes(word)) {
      negated = true
      continue
    }

    // Check for intensity modifiers
    const modifierKey = word.replace(/\s/g, "_") as keyof typeof intensityModifiers
    if (intensityModifiers[modifierKey]) {
      intensityMultiplier = intensityModifiers[modifierKey]
      continue
    }

    // Check each emotion category
    let emotionFound = false
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some((keyword) => word.includes(keyword))) {
        // Apply negation and intensity
        const scoreChange = negated ? -1 * intensityMultiplier : intensityMultiplier
        scores[emotion] += scoreChange
        emotionFound = true
      }
    }

    // Reset negation and intensity after applying to an emotion word
    if (emotionFound) {
      negated = false
      intensityMultiplier = 1
    }

    // Reset negation after 3 words if not used
    if (negated && i > 0 && i % 3 === 0) {
      negated = false
    }
  }

  // Find primary and secondary emotions
  const sortedEmotions = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)

  const primaryEmotion = sortedEmotions.length > 0 ? sortedEmotions[0][0] : "neutral"
  const secondaryEmotions = sortedEmotions.slice(1, 3).map(([emotion, _]) => emotion)

  // Calculate overall sentiment (positive vs negative)
  const positiveEmotions = ["joy", "trust", "anticipation", "surprise"]
  const negativeEmotions = ["sadness", "anger", "fear", "disgust"]

  let sentiment = 0
  for (const emotion of positiveEmotions) {
    sentiment += scores[emotion]
  }
  for (const emotion of negativeEmotions) {
    sentiment -= scores[emotion]
  }

  // Calculate confidence based on the strength of the primary emotion
  const primaryScore = sortedEmotions.length > 0 ? sortedEmotions[0][1] : 0
  const confidence = Math.min(primaryScore / 3, 1) // Normalize to 0-1

  // Generate a description
  let description = ""
  if (primaryEmotion === "neutral") {
    description = "No strong emotions detected"
  } else if (confidence < 0.3) {
    description = `Slight hints of ${primaryEmotion}`
  } else if (confidence < 0.6) {
    description = `Moderate ${primaryEmotion}`
  } else {
    description = `Strong ${primaryEmotion}`
  }

  if (secondaryEmotions.length > 0) {
    description += ` with elements of ${secondaryEmotions.join(" and ")}`
  }

  return {
    primaryEmotion,
    secondaryEmotions,
    sentiment,
    confidence,
    emoji: primaryEmotion !== "neutral" ? emotionEmojis[primaryEmotion as keyof typeof emotionEmojis] : "😐",
    color: primaryEmotion !== "neutral" ? emotionColors[primaryEmotion as keyof typeof emotionColors] : "#808080",
    description,
  }
}

export function getEmotionEmoji(emotion: string): string {
  return emotionEmojis[emotion as keyof typeof emotionEmojis] || "😐"
}

export function getEmotionColor(emotion: string): string {
  return emotionColors[emotion as keyof typeof emotionColors] || "#808080"
}
