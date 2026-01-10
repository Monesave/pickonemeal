import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { tableName, mealTitles } = (await req.json()) as {
    tableName?: string;
    mealTitles?: string[];
  };

  if (!mealTitles || mealTitles.length === 0) {
    return NextResponse.json(
      { error: "No meal titles provided" },
      { status: 400 }
    );
  }

  const systemPrompt =
    "You are helping a small group choose a home-cooked meal. " +
    "You will receive a list of candidate meal titles and should pick ONE of them " +
    "that is likely to satisfy the group overall. Respond with only the exact title from the list.";

  const userPrompt =
    `Dining Table: ${tableName ?? "Group"}.\n` +
    "Here are the candidate meals:\n" +
    mealTitles.map((t, i) => `${i + 1}. ${t}`).join("\n") +
    "\nPick ONE meal from this list.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 32,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", text);
      return NextResponse.json(
        { error: "OpenAI request failed" },
        { status: 502 }
      );
    }

    const json = await response.json();
    const content: string | undefined =
      json.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({
      suggestedMeal: content ?? mealTitles[0]
    });
  } catch (error) {
    console.error("OpenAI request error:", error);
    return NextResponse.json(
      { error: "OpenAI request failed" },
      { status: 502 }
    );
  }
}


