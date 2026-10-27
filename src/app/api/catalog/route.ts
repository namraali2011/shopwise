
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();

    const [productsResult, faqResult] = await Promise.all([
      supabase
        .from("products")
        .select("id,name,category,description,price_pkr,stock,warranty")
        .order("id"),

      supabase
        .from("faq_rules")
        .select("id,category,question")
        .eq("active", true)
        .order("id"),
    ]);

    if (productsResult.error) throw productsResult.error;
    if (faqResult.error) throw faqResult.error;

    return NextResponse.json({
      products: productsResult.data ?? [],
      questions: faqResult.data ?? [],
    });
  } catch (error) {
    console.error("ShopWise catalogue error:", error);

    return NextResponse.json(
      { error: "Unable to load data from Supabase." },
      { status: 500 }
    );
  }
}
