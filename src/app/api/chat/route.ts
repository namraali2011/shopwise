
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { matchQuestion, type FAQ } from "@/lib/matcher";

type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price_pkr: number;
  stock: number;
  warranty: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function productAnswer(
  message: string,
  products: Product[]
): string | null {
  const input = normalize(message);

  const mentioned = products.filter((product) =>
    input.includes(normalize(product.name))
  );

  // Never guess which product is intended.
  if (mentioned.length !== 1) return null;

  const product = mentioned[0];

  if (/\b(price|cost|how much|expensive)\b/.test(input)) {
    return `${product.name} costs PKR ${product.price_pkr.toLocaleString(
      "en-PK"
    )}. This is a fictional demonstration price.`;
  }

  if (/\b(stock|available|availability|in stock)\b/.test(input)) {
    return product.stock > 0
      ? `${product.name} is listed as available, with ${product.stock} units in the demo catalogue.`
      : `${product.name} is currently out of stock in the demo catalogue.`;
  }

  if (/\b(warranty|guarantee)\b/.test(input)) {
    return `${product.name} has a ${product.warranty}. This is a sample product warranty.`;
  }

  if (/\b(detail|details|describe|features|specification|about)\b/.test(input)) {
    return `${product.name}: ${product.description} The demo price is PKR ${product.price_pkr.toLocaleString(
      "en-PK"
    )}.`;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body?.message;
    const ruleId = body?.ruleId;

    const supabase = getSupabase();

    const { data: faqRows, error: faqError } = await supabase
      .from("faq_rules")
      .select("id,category,question,alternatives,answer")
      .eq("active", true)
      .order("id");

    if (faqError) throw faqError;

    const rules = (faqRows ?? []) as FAQ[];

    // Clicking a question always retrieves its own answer.
    if (typeof ruleId === "number") {
      const selected = rules.find((rule) => rule.id === ruleId);

      if (!selected) {
        return NextResponse.json({
          status: "unknown",
          reply: "That question is no longer available.",
          suggestions: [],
        });
      }

      return NextResponse.json({
        status: "matched",
        reply: selected.answer,
        suggestions: [],
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Messages must be 500 characters or shorter." },
        { status: 400 }
      );
    }

    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id,name,category,description,price_pkr,stock,warranty");

    if (productError) throw productError;

    const answer = productAnswer(
      message,
      (productRows ?? []) as Product[]
    );

    if (answer) {
      return NextResponse.json({
        status: "matched",
        reply: answer,
        suggestions: [],
      });
    }

    const result = matchQuestion(message, rules);

    return NextResponse.json(result);
  } catch (error) {
    console.error("ShopWise chat error:", error);

    return NextResponse.json(
      {
        error:
          "The chatbot could not reach its knowledge base. Please check the Supabase connection.",
      },
      { status: 500 }
    );
  }
}
