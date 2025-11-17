// app/api/analyze-meal/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

    console.log("[analyze-meal] N8N_WEBHOOK_URL =", N8N_WEBHOOK_URL);

    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL is not set on the server." },
        { status: 500 }
      );
    }

    const incomingForm = await request.formData();
    const mealType = (incomingForm.get("mealType") as string | null) ?? "";
    const notes = (incomingForm.get("notes") as string | null) ?? "";
    const foodImage = incomingForm.get("foodImage");
    const labelImage = incomingForm.get("labelImage");

    if (!(foodImage instanceof File)) {
      return NextResponse.json(
        { error: "foodImage is required." },
        { status: 400 }
      );
    }

    // n8n 으로 넘길 폼데이터 다시 구성
    const relayForm = new FormData();
    relayForm.append("mealType", mealType);
    relayForm.append("notes", notes);
    relayForm.append("foodImage", foodImage, foodImage.name || "food.jpg");

    if (labelImage instanceof File) {
      relayForm.append("labelImage", labelImage, labelImage.name || "label.jpg");
    }

    let n8nResponse: Response;
    try {
      n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        body: relayForm,
      });
    } catch (err) {
      console.error("[analyze-meal] fetch to n8n failed:", err);
      return NextResponse.json(
        { error: "Failed to call n8n webhook." },
        { status: 502 }
      );
    }

    const rawText = await n8nResponse.text();
    console.log("[analyze-meal] n8n raw response:", n8nResponse.status, rawText);

    if (!n8nResponse.ok) {
      // n8n 쪽에서 에러일 때
      return NextResponse.json(
        {
          error: "n8n returned error.",
          status: n8nResponse.status,
          body: rawText,
        },
        { status: 502 }
      );
    }

    // n8n 이 JSON 을 주면 파싱, 아니면 그냥 문자열로 전달
    let data: any = rawText;
    try {
      data = JSON.parse(rawText);
    } catch {
      // JSON 이 아니면 그대로 둔다
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[analyze-meal] outer error:", error);
    return NextResponse.json(
      { error: "Internal server error in analyze-meal." },
      { status: 500 }
    );
  }
}
