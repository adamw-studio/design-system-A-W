export interface TypographyStyle {
  figmaStyle: string;
  style: string;
  variant: "regular" | "strong" | null;
  label: string;
  usage: string;
  sample: string | null;
  className: string;
  values: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    fontWeight: number;
    letterSpacing: string;
    letterSpacingPercent: number;
  };
  cssVariables: Record<"fontFamily" | "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing", string>;
}

export declare function kebab(figmaName: string): string;
export declare function typographyStyles(source: unknown, rules: unknown): TypographyStyle[];
