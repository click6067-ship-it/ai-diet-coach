"use client";

import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MealHistoryEntry } from "@/lib/types";

interface HistoryListProps {
  items: MealHistoryEntry[];
}

const mealTypeLabel: Record<string, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export function HistoryList({ items }: HistoryListProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">오늘 분석한 식사</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-500">아직 분석 내역이 없습니다.</p>
        )}

        {items.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
            <div className="h-16 w-16 flex-none overflow-hidden rounded-2xl bg-slate-100">
              {entry.previewUrl ? (
                <Image
                  src={entry.previewUrl}
                  alt={entry.mainItem}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">🍱</div>
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <p className="text-sm font-semibold text-slate-900">{entry.mainItem}</p>
              <p className="text-xs text-slate-500">
                {mealTypeLabel[entry.mealType]} ·{" "}
                {new Date(entry.timestamp).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{Math.round(entry.calories).toLocaleString()} kcal</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

