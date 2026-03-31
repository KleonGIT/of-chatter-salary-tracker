import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useSettings } from "@/contexts/settings";
import {
  DAYS_OF_WEEK,
  DayEntry,
  calculateDailyEarnings,
  calculateWeekSummary,
  createEmptyWeek,
  formatUSD,
  formatPHP,
  toPHP,
  formatPercent,
  getCommissionTier,
  getBasePay,
  buildTiers,
} from "@/lib/salary";
import {
  useGetWeeks,
  useCreateWeek,
  useUpdateWeek,
  getGetWeeksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  TrendingUp,
  Calendar,
  User,
  Info,
  BedDouble,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrackerPageProps {
  editId?: string;
}

const DAY_ABBREV: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export default function TrackerPage({ editId }: TrackerPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user } = useAuth();

  const defaultName = user?.username || "";

  const [chatterName, setChatterName] = useState(defaultName);
  const [weekLabel, setWeekLabel] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [days, setDays] = useState<DayEntry[]>(createEmptyWeek());

  const basePay = getBasePay(settings);
  const tiers = buildTiers(settings.commissionTiers);
  const phpRate = settings.phpUsdRate;

  const { data: weeksData } = useGetWeeks({
    query: { enabled: !!editId, queryKey: getGetWeeksQueryKey() },
  });

  useEffect(() => {
    if (editId && weeksData?.weeks) {
      const found = weeksData.weeks.find((w) => w.id === editId);
      if (found) {
        setChatterName(found.chatterName);
        setWeekLabel(found.label);
        setWeekStart(found.weekStart);
        setDays((found.days as DayEntry[]) ?? createEmptyWeek());
      }
    }
  }, [editId, weeksData]);

  useEffect(() => {
    if (!editId && defaultName) {
      setChatterName((prev) => (prev ? prev : defaultName));
    }
  }, [defaultName, editId]);

  const createMutation = useCreateWeek({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWeeksQueryKey() });
        toast({ title: "Saved!", description: `${weekLabel} has been saved.` });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateWeek({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWeeksQueryKey() });
        toast({ title: "Updated!", description: `${weekLabel} has been updated.` });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update. Please try again.", variant: "destructive" });
      },
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function toggleRestDay(index: number) {
    setDays((prev) => {
      const updated = [...prev];
      const isNowRest = updated[index].worked;
      updated[index] = { ...updated[index], worked: !isNowRest, netSales: isNowRest ? 0 : updated[index].netSales };
      return updated;
    });
  }

  function handleSalesInput(index: number, raw: string) {
    const parsed = parseFloat(raw);
    setDays((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], netSales: isNaN(parsed) ? 0 : Math.max(0, parsed) };
      return updated;
    });
  }

  function saveWeek() {
    if (!chatterName.trim()) {
      toast({ title: "Missing name", description: "Please enter your chatter name.", variant: "destructive" });
      return;
    }
    if (!weekLabel.trim()) {
      toast({ title: "Missing label", description: "Please enter a week label (e.g. Week 1).", variant: "destructive" });
      return;
    }
    const payload = { label: weekLabel.trim(), chatterName: chatterName.trim(), weekStart, days };
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  }

  const summary = calculateWeekSummary(days, settings);
  const restDays = days.filter((d) => !d.worked);
  const workedDaysList = days.filter((d) => d.worked);

  return (
    <div className="min-h-screen bg-background" data-testid="tracker-page">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{editId ? "Edit Week" : "New Week Entry"}</h1>
            <p className="text-sm text-muted-foreground">Track your daily net sales and see your exact earnings</p>
          </div>
        </div>

        {/* Week Info */}
        <Card data-testid="card-week-info">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Week Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="chatter-name">Your Name / Handle</Label>
                <Input id="chatter-name" placeholder="e.g. Alex" value={chatterName}
                  onChange={(e) => setChatterName(e.target.value)} data-testid="input-chatter-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="week-label">Week Label</Label>
                <Input id="week-label" placeholder="e.g. Week 1, Jan W1" value={weekLabel}
                  onChange={(e) => setWeekLabel(e.target.value)} data-testid="input-week-label" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="week-start">Week Start Date</Label>
                <Input id="week-start" type="date" value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)} data-testid="input-week-start" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rest Days */}
        <Card className="border-muted" data-testid="card-rest-days">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              Rest Days
              {restDays.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {restDays.length} day{restDays.length > 1 ? "s" : ""} off
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Tap a day to mark it as a rest day</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {days.map((entry, i) => {
                const isRest = !entry.worked;
                return (
                  <button
                    key={entry.day}
                    onClick={() => toggleRestDay(i)}
                    data-testid={`toggle-rest-${entry.day.toLowerCase()}`}
                    className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 select-none ${
                      isRest
                        ? "bg-muted/60 border-border text-muted-foreground line-through opacity-70 hover:opacity-90"
                        : "bg-primary/8 border-primary text-primary hover:bg-primary/15"
                    }`}
                  >
                    <span>{DAY_ABBREV[entry.day]}</span>
                    {isRest && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-muted-foreground/50 flex items-center justify-center text-[9px] text-white font-bold">✕</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {restDays.length === 0
                ? "All 7 days are work days. Tap any day above to mark it as a rest day."
                : `Rest days: ${restDays.map((d) => d.day).join(", ")}`}
            </p>
          </CardContent>
        </Card>

        {/* Commission Reference */}
        <Card className="border-accent bg-accent/20" data-testid="card-commission-ref">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-2 mb-3">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-foreground">Commission Structure</p>
              <span className="text-xs text-muted-foreground ml-auto">$1 = ₱{phpRate}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {tiers.map((tier) => (
                <div key={tier.label} className="text-center rounded-lg bg-card border border-card-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Net Sales</p>
                  <p className="font-semibold text-sm text-foreground">${tier.label}</p>
                  <Separator className="my-2" />
                  <p className={`text-lg font-bold ${tier.color}`}>{formatPercent(tier.rate)}</p>
                  <p className="text-xs text-muted-foreground">commission</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Base pay: {formatPHP(toPHP(basePay, phpRate))} ({formatUSD(basePay)})/day
              · ${settings.hourlyRate}/hr × {settings.hoursPerDay}hrs
            </p>
          </CardContent>
        </Card>

        {/* Daily Entries */}
        <div className="space-y-3" data-testid="daily-entries">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Daily Sales Entry
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({workedDaysList.length} work day{workedDaysList.length !== 1 ? "s" : ""})
            </span>
          </h2>

          {workedDaysList.length === 0 ? (
            <Card className="text-center py-8 border-dashed">
              <CardContent>
                <BedDouble className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">All days are set as rest days.</p>
              </CardContent>
            </Card>
          ) : (
            days.map((entry, i) => {
              if (!entry.worked) return null;
              const calc = calculateDailyEarnings(entry.netSales, settings);
              const tier = getCommissionTier(entry.netSales, settings);
              return (
                <Card key={entry.day} data-testid={`card-day-${entry.day.toLowerCase()}`}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="min-w-[130px]">
                        <p className="font-bold text-foreground text-base">{entry.day}</p>
                        <Badge variant="outline" className={`text-xs mt-1 ${tier.color} border-current`}>
                          {formatPercent(tier.rate)} tier
                        </Badge>
                      </div>
                      <div className="max-w-[200px] w-full">
                        <Label className="text-xs text-muted-foreground mb-1 block">Net Sales (USD)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number" min="0" step="0.01" placeholder="0.00"
                            value={entry.netSales === 0 ? "" : entry.netSales}
                            onChange={(e) => handleSalesInput(i, e.target.value)}
                            className="pl-7"
                            data-testid={`input-sales-${entry.day.toLowerCase()}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-1 gap-4 flex-wrap">
                        <div className="text-center min-w-[80px]">
                          <p className="text-xs text-muted-foreground">Base Pay</p>
                          <p className="font-semibold text-sm text-primary">{formatPHP(toPHP(calc.basePay, phpRate))}</p>
                          <p className="text-xs text-muted-foreground">{formatUSD(calc.basePay)}</p>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <p className="text-xs text-muted-foreground">Commission</p>
                          <p className={`font-semibold text-sm ${tier.color}`}>{formatPHP(toPHP(calc.commission, phpRate))}</p>
                          <p className="text-xs text-muted-foreground">{formatUSD(calc.commission)}</p>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <p className="text-xs text-muted-foreground">Daily Total</p>
                          <p className="font-bold text-primary text-xl">{formatPHP(toPHP(calc.total, phpRate))}</p>
                          <p className="text-xs text-muted-foreground">{formatUSD(calc.total)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Weekly Summary */}
        <Card className="border-primary/30 bg-primary/5" data-testid="card-weekly-summary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
              <div className="bg-card rounded-xl border border-card-border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Days Worked</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-days-worked">{summary.workedDays}</p>
                <p className="text-xs text-muted-foreground">of 7 days</p>
              </div>
              <div className="bg-card rounded-xl border border-card-border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Net Sales</p>
                <p className="text-lg font-bold text-foreground">{formatPHP(toPHP(summary.totalNetSales, phpRate))}</p>
                <p className="text-xs text-muted-foreground">{formatUSD(summary.totalNetSales)}</p>
              </div>
              <div className="bg-card rounded-xl border border-card-border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Base Pay</p>
                <p className="text-lg font-bold text-foreground">{formatPHP(toPHP(summary.totalBasePay, phpRate))}</p>
                <p className="text-xs text-muted-foreground">{formatUSD(summary.totalBasePay)}</p>
              </div>
              <div className="bg-card rounded-xl border border-card-border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Commission</p>
                <p className="text-lg font-bold text-chart-1">{formatPHP(toPHP(summary.totalCommission, phpRate))}</p>
                <p className="text-xs text-muted-foreground">{formatUSD(summary.totalCommission)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-primary rounded-xl p-4 text-center text-primary-foreground">
                <p className="text-xs opacity-80 mb-1">Total Earnings</p>
                <p className="text-2xl font-extrabold" data-testid="text-total-earnings">{formatPHP(toPHP(summary.totalEarnings, phpRate))}</p>
                <p className="text-sm opacity-80">{formatUSD(summary.totalEarnings)}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm" data-testid="table-breakdown">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Day</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Net Sales</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Rate</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Commission</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Base Pay</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Daily Total</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((entry) => {
                    const calc = entry.worked ? calculateDailyEarnings(entry.netSales, settings) : null;
                    const tier = entry.worked ? getCommissionTier(entry.netSales, settings) : null;
                    return (
                      <tr key={entry.day} className={`border-b border-border last:border-0 ${entry.worked ? "hover:bg-muted/40" : "bg-muted/20"}`}>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {entry.day}
                          {!entry.worked && <span className="ml-2 text-xs text-muted-foreground italic">(rest)</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {entry.worked ? formatUSD(entry.netSales) : "—"}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${tier?.color ?? "text-muted-foreground"}`}>
                          {calc ? formatPercent(calc.commissionRate) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {calc ? (
                            <div>
                              <p className={`font-medium ${tier?.color}`}>{formatPHP(toPHP(calc.commission, phpRate))}</p>
                              <p className="text-xs text-muted-foreground">{formatUSD(calc.commission)}</p>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {calc ? (
                            <div>
                              <p>{formatPHP(toPHP(calc.basePay, phpRate))}</p>
                              <p className="text-xs text-muted-foreground">{formatUSD(calc.basePay)}</p>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          {calc ? (
                            <div>
                              <p>{formatPHP(toPHP(calc.total, phpRate))}</p>
                              <p className="text-xs text-muted-foreground font-normal">{formatUSD(calc.total)}</p>
                            </div>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5 border-t-2 border-primary/20">
                    <td className="px-4 py-3 font-bold text-foreground">TOTAL</td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-foreground">{formatPHP(toPHP(summary.totalNetSales, phpRate))}</p>
                      <p className="text-xs text-muted-foreground">{formatUSD(summary.totalNetSales)}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-chart-1">{formatPHP(toPHP(summary.totalCommission, phpRate))}</p>
                      <p className="text-xs text-muted-foreground">{formatUSD(summary.totalCommission)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-foreground">{formatPHP(toPHP(summary.totalBasePay, phpRate))}</p>
                      <p className="text-xs text-muted-foreground">{formatUSD(summary.totalBasePay)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-extrabold text-primary text-base">{formatPHP(toPHP(summary.totalEarnings, phpRate))}</p>
                      <p className="text-xs text-muted-foreground font-normal">{formatUSD(summary.totalEarnings)}</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-cancel">Cancel</Button>
          <Button onClick={saveWeek} className="gap-2" disabled={isSaving} data-testid="button-save">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Week"}
          </Button>
        </div>
      </div>
    </div>
  );
}
