export type MetricCardData = {
  id: string;
  title: string;
  rightLabel: string;
  value: string;
  denominator?: string;
  unit?: string;
  delta?: {
    text: string;
    direction: "up" | "down" | "flat";
    tone: "positive" | "negative" | "neutral";
  };
  helperText: string;
  visual: {
    type: "bars";
    data: { period: string; value: string }[];
    color?: string;
  };
  footer: {
    label: string;
    href: string;
  };
};
