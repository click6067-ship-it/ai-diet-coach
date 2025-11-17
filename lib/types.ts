export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealItem {
  name: string;
  portion_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  method?: string;
  dietFit?: string[];
  note?: string;
  tip?: string;
}

export interface MealTotals {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealAnalysisResponse {
  items: MealItem[];
  totals: MealTotals;
  summary: string;
  suggestion: string;
}

export interface MealHistoryEntry {
  id: string;
  timestamp: string;
  mealType: MealType;
  calories: number;
  mainItem: string;
  previewUrl?: string;
}
