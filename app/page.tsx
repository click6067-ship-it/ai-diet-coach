"use client";

import * as React from "react";

import { MealForm, type MealFormValues } from "@/components/MealForm";
import { AnalysisResult } from "@/components/AnalysisResult";
import { HistoryList } from "@/components/HistoryList";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import type { MealAnalysisResponse, MealHistoryEntry } from "@/lib/types";

export default function HomePage() {
  const [currentResult, setCurrentResult] =
    React.useState<MealAnalysisResponse | null>(null);
  const [history, setHistory] = React.useState<MealHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const previewUrls = React.useRef<string[]>([]);

  // 썸네일용 blob URL 정리
  React.useEffect(() => {
    const storedUrls = previewUrls.current;
    return () => {
      storedUrls.forEach((url) => URL.revokeObjectURL(url));
      storedUrls.length = 0;
    };
  }, []);

  const handleAnalyze = async ({
    foodImage,
    labelImage,
    mealType,
    notes,
  }: MealFormValues) => {
    const payload = new FormData();
    payload.append("foodImage", foodImage);
    if (labelImage) payload.append("labelImage", labelImage);
    payload.append("mealType", mealType);
    payload.append("notes", notes);

    setLoading(true);
    try {
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("분석 요청이 실패했습니다.");
      }

      // 1) Next API에서 넘어온 원본 응답
      const raw = await response.json();
      console.log("[client] raw from /api/analyze-meal:", raw);

      // 2) 형식에 따라 평탄화
      let data: MealAnalysisResponse | null = null;

      if (raw && typeof raw === "object" && "output" in raw) {
        const output = (raw as any).output;
        if (typeof output === "string") {
          try {
            data = JSON.parse(output) as MealAnalysisResponse;
          } catch (e) {
            console.error("output JSON 파싱 실패:", e, output);
          }
        }
      } else if (raw && typeof raw === "object" && "data" in raw) {
        data = (raw as any).data as MealAnalysisResponse;
      } else {
        data = raw as MealAnalysisResponse;
      }

      // 3) 방어 코드 – totals 없으면 화면을 깨우지 말고 토스트만 띄우기
      if (!data || !(data as any).totals) {
        console.error("예상과 다른 응답 형식:", data);
        toast({
          title: "응답 형식 오류",
          description: "AI 응답 형식이 예상과 달라서 결과를 표시할 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      setCurrentResult(data);

      const mainItem = data.items?.[0]?.name ?? "식사";
      const previewUrl = URL.createObjectURL(foodImage);
      previewUrls.current.push(previewUrl);

      setHistory((prev) =>
        [
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            mealType,
            calories: data.totals?.calories_kcal ?? 0,
            mainItem,
            previewUrl,
          },
          ...prev,
        ].slice(0, 5)
      );

      toast({
        title: "분석이 완료되었습니다.",
        description: `${mainItem} 식사에 대한 AI 분석을 확인해 보세요.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "분석 중 오류가 발생했습니다.",
        description: "잠시 후 다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* 양옆 여백 + 가운데 정렬용 래퍼 */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl py-12">
          <header className="space-y-3 text-center md:text-left">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              AI Coach
            </p>
            <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
              AI Diet Coach
            </h1>
            <p className="text-sm text-slate-500">
              Pusan National University × Upstage AI Agent Hackathon
            </p>
          </header>

          <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <MealForm loading={loading} onSubmit={handleAnalyze} />
            <div className="space-y-6">
              <AnalysisResult result={currentResult} loading={loading} />
              <HistoryList items={history} />
            </div>
          </section>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
