type Mode = "light" | "dark";

export interface PrimitiveColor {
  figmaVariable: string;
  path: [string, string];
  family: string;
  step: string;
  cssVariable: string;
  values: Record<Mode, string>;
  description: string | null;
}

export interface SemanticColor {
  figmaVariable: string;
  path: [string, string, string];
  category: string;
  group: string;
  variant: string;
  cssVariable: string;
  aliases: Record<Mode, string | null>;
  values: Record<Mode, string>;
  description: string;
}

export declare function colorTokens(
  source: unknown,
  rules: unknown,
): { primitives: PrimitiveColor[]; semantic: SemanticColor[] };
