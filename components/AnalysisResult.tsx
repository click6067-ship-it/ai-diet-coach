"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { MealAnalysisResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AnalysisResultProps {
  result: MealAnalysisResponse | null;
  loading: boolean;
}

const nutrientLabels = [
  { key: "calories_kcal", label: "칼로리", unit: "kcal" },
  { key: "protein_g", label: "단백질", unit: "g" },
  { key: "carbs_g", label: "탄수화물", unit: "g" },
  { key: "fat_g", label: "지방", unit: "g" },
] as const;

export function AnalysisResult({ result, loading }: AnalysisResultProps) {
  // 1) 로딩 상태일 때 스켈레톤
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-2xl">AI 분석 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="space-y-4">
            {[...Array(2)].map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2) 결과가 없거나 totals 가 없는 경우 – 안전하게 빈 상태 카드
  if (!result || !result.totals) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-2xl">AI 분석 결과</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-500">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
            <span className="text-3xl">🍽️</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-700">
              분석 결과가 아직 없어요
            </p>
            <p className="text-sm text-slate-500">
              식사 사진을 업로드하면 영양 분석이 여기에 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totals: any = result.totals ?? {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">AI 분석 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 총 영양 요약 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nutrientLabels.map((nutrient) => {
              const raw = totals[nutrient.key];
              const value = typeof raw === "number" ? raw : 0;
              return (
                <div
                  key={nutrient.key}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <p className="text-sm text-slate-500">{nutrient.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {value.toLocaleString()} {nutrient.unit}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 개별 음식 아이템 목록 */}
          <div className="space-y-4">
            {(result.items ?? []).map((item, index) => {
              const calories =
                typeof item.calories_kcal === "number" ? item.calories_kcal : 0;
              const portion =
                typeof item.portion_g === "number" ? item.portion_g : null;
              const protein =
                typeof item.protein_g === "number" ? item.protein_g : 0;
              const carbs =
                typeof item.carbs_g === "number" ? item.carbs_g : 0;
              const fat = typeof item.fat_g === "number" ? item.fat_g : 0;

              return (
                <div
                  key={`${item.name}-${index}`}
                  className="rounded-2xl border border-slate-100 bg-white/80 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {item.name}
                      </p>
                      {item.method && (
                        <p className="text-sm text-slate-500">
                          조리 방식 · {item.method}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {calories.toLocaleString()} kcal
                      {portion !== null && <> / {portion} g</>}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-4">
                    <NutrientPill label="단백질" value={protein} unit="g" />
                    <NutrientPill label="탄수화물" value={carbs} unit="g" />
                    <NutrientPill label="지방" value={fat} unit="g" />
                    {item.dietFit && item.dietFit.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.dietFit.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="bg-white"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {(item.note || item.tip) && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {item.note && (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-800">노트</p>
                          <p className="mt-1 text-slate-600">{item.note}</p>
                        </div>
                      )}
                      {item.tip && (
                        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                          <p className="font-semibold text-emerald-800">
                            헬시 팁
                          </p>
                          <p className="mt-1">{item.tip}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 요약 & 다음 식사 제안 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <HighlightBlock
              title="한 줄 요약"
              tone="default"
              text={result.summary ?? "요약 정보가 제공되지 않았습니다."}
            />
            <HighlightBlock
              title="다음 식사 제안"
              tone="accent"
              text={result.suggestion ?? "다음 식사 제안이 제공되지 않았습니다."}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NutrientPill({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  const safeValue = typeof value === "number" ? value : 0;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-900">
        {safeValue.toLocaleString()} {unit}
      </p>
    </div>
  );
}

function HighlightBlock({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-5 text-sm",
        tone === "default" && "border-slate-100 bg-slate-50",
        tone === "accent" && "border-emerald-100 bg-emerald-50"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-base text-slate-800">{text}</p>
    </div>
  );
}
