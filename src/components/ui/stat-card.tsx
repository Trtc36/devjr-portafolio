import { Card, CardContent, CardHeader } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
};

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <Card className="h-full bg-[hsl(var(--surface-elevated))]">
      <CardHeader className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
          {label}
        </p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardHeader>
      {description ? (
        <CardContent className="pt-0 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          {description}
        </CardContent>
      ) : null}
    </Card>
  );
}
