import type { Metadata } from "next";
import { AlertCircle, Check, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("styleguide");
  return { title: t("title") };
}

const SWATCHES = [
  ["bg-background", "background"],
  ["bg-card", "card"],
  ["bg-muted", "muted"],
  ["bg-border", "border"],
  ["bg-input", "input"],
  ["bg-foreground", "foreground"],
  ["bg-muted-foreground", "muted-foreground"],
  ["bg-subtle", "subtle"],
  ["bg-primary", "primary"],
  ["bg-accent", "accent"],
  ["bg-ink", "ink"],
  ["bg-success", "success"],
  ["bg-warning", "warning"],
  ["bg-destructive", "destructive"],
  ["bg-chart-1", "chart-1"],
  ["bg-chart-2", "chart-2"],
  ["bg-chart-3", "chart-3"],
] as const;

/** Tokens, type and components rendered from the real theme. A review page, not a product screen. */
export default async function StyleguidePage() {
  const t = await getTranslations("styleguide");
  return (
    <div className="grid gap-10">
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      </div>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{t("colors")}</h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {SWATCHES.map(([cls, name]) => (
            <li key={name} className="grid gap-1.5">
              <div className={`h-14 rounded-lg border border-border ${cls}`} />
              <code className="font-mono text-xs text-muted-foreground">{name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{t("type")}</h2>
        <div className="grid gap-3">
          <p className="text-4xl font-semibold tracking-tight">{t("sample")}</p>
          <p className="text-2xl font-semibold tracking-tight">{t("sample")}</p>
          <p className="text-lg font-medium">{t("sample")}</p>
          <p className="text-base">{t("sample")}</p>
          <p className="text-sm text-muted-foreground">{t("sample")}</p>
          <p className="text-xs text-subtle">{t("sample")}</p>
          <p className="text-2xl font-semibold tracking-tight" dir="auto">
            {t("sampleAr")}
          </p>
          <p className="text-base" dir="auto">
            {t("sampleAr")}
          </p>
          <p className="num font-mono text-5xl font-medium">17:42</p>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{t("components")}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="xl">{t("primary")}</Button>
                <Button variant="outline" size="lg">
                  {t("secondary")}
                </Button>
                <Button variant="ghost" size="lg">
                  {t("ghost")}
                </Button>
                <Button variant="destructive" size="lg">
                  {t("destructive")}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ink" size="xl">
                  {t("struggle")}
                </Button>
                <Button size="lg" disabled>
                  {t("primary")}
                </Button>
                <Button variant="link">{t("ghost")}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="sg-input">Label</Label>
                <Input id="sg-input" placeholder="Placeholder" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sg-textarea">Textarea</Label>
                <Textarea id="sg-textarea" placeholder="In your own words" dir="auto" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="sg-check" defaultChecked />
                <Label htmlFor="sg-check">Checkbox</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>States</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">To do</Badge>
                <Badge className="bg-accent text-accent-foreground">In progress</Badge>
                <Badge className="bg-muted text-success-ink">
                  <Check aria-hidden /> Done
                </Badge>
              </div>
              <Alert>
                <TriangleAlert className="text-warning" aria-hidden />
                <AlertTitle>Review owed</AlertTitle>
                <AlertDescription>Yesterday&apos;s session is waiting for a quick review.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle aria-hidden />
                <AlertDescription>That email and password don&apos;t match.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress and loading</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Progress value={40} aria-label="2 of 5 steps" />
              <Progress value={100} aria-label="4 of 4 steps" className="[&_[data-slot=progress-indicator]]:bg-success" />
              <div className="grid gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
