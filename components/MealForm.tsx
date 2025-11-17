"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import type { MealType } from "@/lib/types";

export type MealFormValues = {
  foodImage: File;
  labelImage?: File | null;
  mealType: MealType;
  notes: string;
};

interface MealFormProps {
  loading: boolean;
  onSubmit: (values: MealFormValues) => Promise<void>;
}

export function MealForm({ loading, onSubmit }: MealFormProps) {
  const [mealType, setMealType] = React.useState<MealType>("breakfast");
  const [notes, setNotes] = React.useState("");
  const [foodImage, setFoodImage] = React.useState<File | null>(null);
  const [foodPreview, setFoodPreview] = React.useState<string | null>(null);
  const [labelImage, setLabelImage] = React.useState<File | null>(null);
  const [labelPreview, setLabelPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (foodPreview) URL.revokeObjectURL(foodPreview);
      if (labelPreview) URL.revokeObjectURL(labelPreview);
    };
  }, [foodPreview, labelPreview]);

  const handleFiles = (
    file: File | null,
    setter: (file: File | null) => void,
    previewSetter: (url: string | null) => void
  ) => {
    if (file) {
      setter(file);
      previewSetter(URL.createObjectURL(file));
    } else {
      setter(null);
      previewSetter(null);
    }
  };

  const onFoodInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFiles(file, setFoodImage, setFoodPreview);
  };

  const onLabelInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFiles(file, setLabelImage, setLabelPreview);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>, type: "food" | "label") => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "이미지 파일만 업로드할 수 있어요.",
        variant: "destructive",
      });
      return;
    }
    if (type === "food") {
      handleFiles(file, setFoodImage, setFoodPreview);
    } else {
      handleFiles(file, setLabelImage, setLabelPreview);
    }
  };

  const handleAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!foodImage) {
      toast({
        title: "음식 사진을 먼저 업로드해 주세요.",
        variant: "destructive",
      });
      return;
    }

    await onSubmit({
      foodImage,
      labelImage,
      mealType,
      notes,
    });
  };

  const renderDropZone = (params: {
    id: string;
    label: string;
    required?: boolean;
    optionalHint?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    previewUrl: string | null;
    fileName: string | undefined;
    onDropType: "food" | "label";
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-slate-600">
        <span>
          {params.label} {params.required && <span className="text-rose-500">*</span>}
        </span>
        {params.optionalHint && <span className="text-slate-400">{params.optionalHint}</span>}
      </div>
      <Label
        htmlFor={params.id}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(event, params.onDropType)}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center transition hover:border-slate-400"
      >
        {params.previewUrl ? (
          <Image
            src={params.previewUrl}
            alt="preview"
            width={112}
            height={112}
            unoptimized
            className="h-28 w-28 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-inner">
            <Camera className="h-8 w-8 text-slate-400" />
          </div>
        )}
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-800">
            {params.previewUrl ? params.fileName : "이미지를 끌어놓거나 선택"}
          </p>
          <p className="text-sm text-slate-500">JPEG, PNG, HEIC 등을 지원합니다.</p>
        </div>
        <input id={params.id} type="file" className="sr-only" accept="image/*" onChange={params.onChange} />
        <Button
          variant="secondary"
          type="button"
          className="mt-2"
          onClick={(event) => {
            event.preventDefault();
            (document.getElementById(params.id) as HTMLInputElement | null)?.click();
          }}
        >
          <UploadCloud className="mr-2 h-4 w-4" /> 파일 선택
        </Button>
      </Label>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-2xl">식사 업로드</CardTitle>
        <p className="text-sm text-slate-500">사진과 간단한 정보를 업로드하면 AI가 식사를 분석합니다.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-8" onSubmit={handleAnalyze}>
          {renderDropZone({
            id: "foodImage",
            label: "식사 사진",
            required: true,
            onChange: onFoodInputChange,
            previewUrl: foodPreview,
            fileName: foodImage?.name,
            onDropType: "food",
          })}

          {renderDropZone({
            id: "labelImage",
            label: "영양 성분표 사진",
            optionalHint: "선택 사항",
            onChange: onLabelInputChange,
            previewUrl: labelPreview,
            fileName: labelImage?.name,
            onDropType: "label",
          })}

          <div className="space-y-2">
            <Label htmlFor="mealType">식사 구분</Label>
            <Select value={mealType} onValueChange={(value) => setMealType(value as MealType)}>
              <SelectTrigger>
                <SelectValue placeholder="식사 구분을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">아침</SelectItem>
                <SelectItem value="lunch">점심</SelectItem>
                <SelectItem value="dinner">저녁</SelectItem>
                <SelectItem value="snack">간식</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">추가 메모</Label>
            <Textarea
              id="notes"
              placeholder="예: 단백질 위주로 먹고 싶어요."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <Button type="submit" disabled={!foodImage || loading} className="h-12 w-full text-base font-semibold">
            {loading ? "분석 중..." : "식사 분석하기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

