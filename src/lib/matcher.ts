
export type FAQ = {
  id: number;
  category: string;
  question: string;
  alternatives: string[];
  answer: string;
};

export type MatchResult = {
  status: "matched" | "clarification" | "unknown";
  reply: string;
  suggestions: {
    id: number;
    question: string;
  }[];
};

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const stopWords = new Set([
  "a", "an", "the", "is", "are", "do", "does", "did",
  "what", "which", "who", "where", "when", "why", "how",
  "i", "you", "your", "my", "me", "we", "our", "it",
  "to", "for", "of", "in", "on", "and", "with", "about",
  "can", "could", "would", "should", "please", "tell",
]);

const wordForms: Record<string, string> = {
  products: "product",
  items: "item",
  orders: "order",
  payments: "payment",
  charges: "charge",
  fees: "fee",
  days: "day",
  laptops: "laptop",
  phones: "phone",
  smartphones: "smartphone",
  chargers: "charger",
  earbuds: "earbud",
  watches: "watch",
  discounts: "discount",
  returns: "return",
  refunds: "refund",
  warranties: "warranty",
  deliveries: "delivery",
  shipped: "shipping",
  ships: "shipping",
  costs: "cost",
};

function tokens(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((word) => word && !stopWords.has(word))
      .map((word) => wordForms[word] || word)
  );
}

function similarity(first: string, second: string): number {
  const a = tokens(first);
  const b = tokens(second);

  const common = [...a].filter((word) => b.has(word)).length;
  const union = new Set([...a, ...b]).size;

  return union === 0 ? 0 : common / union;
}

// Prevent a high token score from confusing distinct tasks.
// These actions deliberately remain different.
const actionGroups = [
  ["price", "cost", "much", "expensive"],
  ["stock", "available", "availability"],
  ["cancel", "cancellation"],
  ["track", "tracking", "where"],
  ["return", "returning"],
  ["refund", "refunding"],
  ["warranty", "guarantee"],
];

function actionConflict(a: string, b: string): boolean {
  const aTokens = tokens(a);
  const bTokens = tokens(b);

  const detected = (set: Set<string>) =>
    actionGroups
      .map((group, index) =>
        group.some((word) => set.has(word)) ? index : -1
      )
      .filter((index) => index >= 0);

  const actionsA = detected(aTokens);
  const actionsB = detected(bTokens);

  return (
    actionsA.length > 0 &&
    actionsB.length > 0 &&
    !actionsA.some((action) => actionsB.includes(action))
  );
}

export function matchQuestion(
  message: string,
  rules: FAQ[]
): MatchResult {
  const input = normalize(message);

  if (!input) {
    return {
      status: "unknown",
      reply: "Please enter a question.",
      suggestions: [],
    };
  }

  // 1. Exact question / approved alternative match.
  const exact = rules.filter((rule) =>
    [rule.question, ...rule.alternatives].some(
      (phrase) => normalize(phrase) === input
    )
  );

  if (exact.length === 1) {
    return {
      status: "matched",
      reply: exact[0].answer,
      suggestions: [],
    };
  }

  if (exact.length > 1) {
    return {
      status: "clarification",
      reply: "I found multiple matching questions. Please choose one.",
      suggestions: exact.map((rule) => ({
        id: rule.id,
        question: rule.question,
      })),
    };
  }

  // 2. Score similarity to every approved phrase.
  const ranked = rules
    .map((rule) => {
      const phrases = [rule.question, ...rule.alternatives];

      const score = Math.max(
        ...phrases.map((phrase) =>
          actionConflict(message, phrase)
            ? 0
            : similarity(message, phrase)
        )
      );

      return { rule, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.rule.id - b.rule.id
    );

  const best = ranked[0];
  const second = ranked[1];

  // Conservative automatic matching.
  const confident =
    best &&
    tokens(message).size >= 2 &&
    best.score >= 0.9 &&
    (!second || best.score - second.score >= 0.2);

  if (confident) {
    return {
      status: "matched",
      reply: best.rule.answer,
      suggestions: [],
    };
  }

  const suggestions = ranked
    .filter((item) => item.score >= 0.3)
    .slice(0, 4)
    .map(({ rule }) => ({
      id: rule.id,
      question: rule.question,
    }));

  if (suggestions.length > 0) {
    return {
      status: "clarification",
      reply:
        "I found some related questions. Which one would you like me to answer?",
      suggestions,
    };
  }

  return {
    status: "unknown",
    reply:
      "I don't have a reliable answer for that specific question yet. Try selecting a question from the knowledge base.",
    suggestions: [],
  };
}
