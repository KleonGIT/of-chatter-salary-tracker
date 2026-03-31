import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useSettings } from "@/contexts/settings";
import { SettingsDialog } from "@/components/settings-dialog";
import { useGetWeeks, useDeleteWeek, getGetWeeksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  calculateWeekSummary,
  calculateDailyEarnings,
  formatUSD,
  formatPHP,
  toPHP,
  getBasePay,
  buildTiers,
  formatPercent,
} from "@/lib/salary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  TrendingUp,
  DollarSign,
  History,
  Trash2,
  Pencil,
  CalendarDays,
  User,
  BarChart3,
  Info,
  LogOut,
  Loader2,
  Shield,
  Settings,
} from "lucide-react";
import type { DayEntry } from "@/lib/salary";

function PhpAmount({ usd, phpRate, size = "md" }: { usd: number; phpRate: number; size?: "sm" | "md" | "lg" }) {
  const php = toPHP(usd, phpRate);
  return (
    <div>
      <p className={`font-bold text-foreground ${size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm"}`}>
        {formatPHP(php)}
      </p>
      <p className="text-xs text-muted-foreground">{formatUSD(usd)}</p>
    </div>
  );
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetWeeks();
  const weeks = data?.weeks ?? [];

  const deleteMutation = useDeleteWeek({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWeeksQueryKey() });
      },
    },
  });

  const phpRate = settings.phpUsdRate;
  const basePay = getBasePay(settings);
  const tiers = buildTiers(settings.commissionTiers);

  const totalEarningsAllTime = weeks.reduce((sum, w) => {
    return sum + calculateWeekSummary(w.days as DayEntry[], settings).totalEarnings;
  }, 0);
  const totalSalesAllTime = weeks.reduce((sum, w) => {
    return sum + calculateWeekSummary(w.days as DayEntry[], settings).totalNetSales;
  }, 0);

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Chatter Pay Tracker</h1>
              {user && (
                <p className="text-xs text-muted-foreground leading-tight">
                  {user.firstName ?? user.email ?? "Your account"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/admin")}
                data-testid="button-admin"
                className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              data-testid="button-settings"
              title="Pay settings"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button onClick={() => setLocation("/new")} className="gap-2" data-testid="button-new-week">
              <Plus className="h-4 w-4" />
              New Week
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout" title="Log out">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Bar */}
        {weeks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" data-testid="stats-bar">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weeks Tracked</p>
                    <p className="text-xl font-bold text-foreground" data-testid="text-weeks-count">{weeks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-chart-1/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Net Sales</p>
                    <PhpAmount usd={totalSalesAllTime} phpRate={phpRate} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                    <p className="text-xl font-bold text-primary" data-testid="text-total-earned">
                      {formatPHP(toPHP(totalEarningsAllTime, phpRate))}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatUSD(totalEarningsAllTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pay Structure Info */}
        <Card className="border-accent bg-accent/20" data-testid="card-commission-info">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold text-foreground">Pay structure</p>
              <span className="text-xs text-muted-foreground ml-auto">
                ₱1 = ${(1 / phpRate).toFixed(4)} · $1 = ₱{phpRate}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-foreground">
                  <span className="font-medium">Base Pay:</span>{" "}
                  ${settings.hourlyRate}/hr × {settings.hoursPerDay}hrs ={" "}
                  <span className="font-bold text-primary">{formatPHP(toPHP(basePay, phpRate))}</span>
                  <span className="text-muted-foreground text-xs ml-1">({formatUSD(basePay)})</span>
                  <span className="text-muted-foreground">/day</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {tiers.map((tier) => (
                  <div key={tier.label} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full opacity-60 shrink-0" />
                    <span className="text-muted-foreground">
                      Net Sales <span className="font-medium text-foreground">${tier.label}</span>
                    </span>
                    <span className={`ml-auto font-bold ${tier.color}`}>{formatPercent(tier.rate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week History */}
        <div data-testid="week-history">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {weeks.length > 0 ? "Week History" : "Get Started"}
            </h2>
          </div>

          {isLoading ? (
            <Card className="text-center py-12" data-testid="loading-state">
              <CardContent>
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Loading your weeks...</p>
              </CardContent>
            </Card>
          ) : weeks.length === 0 ? (
            <Card className="text-center py-16" data-testid="empty-state">
              <CardContent>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No weeks tracked yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Start by adding your first week's sales data. Your earnings will be calculated automatically.
                </p>
                <Button onClick={() => setLocation("/new")} className="gap-2" data-testid="button-start-tracking">
                  <Plus className="h-4 w-4" />
                  Track First Week
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {weeks.map((week) => {
                const days = (week.days as DayEntry[]) ?? [];
                const summary = calculateWeekSummary(days, settings);
                return (
                  <Card key={week.id} className="hover:shadow-md transition-shadow" data-testid={`card-week-${week.id}`}>
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Week Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-foreground text-base">{week.label}</h3>
                            {week.weekStart && (
                              <Badge variant="outline" className="text-xs">
                                {new Date(week.weekStart + "T00:00:00").toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", year: "numeric",
                                })}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                            <User className="h-3.5 w-3.5" />
                            <span>{week.chatterName}</span>
                            <span className="text-border">•</span>
                            <span>{summary.workedDays} days worked</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {days.map((day) => {
                              const calc = day.worked ? calculateDailyEarnings(day.netSales, settings) : null;
                              return (
                                <div
                                  key={day.day}
                                  className={`text-xs rounded-md px-2 py-1 border ${
                                    day.worked ? "bg-card border-border text-foreground" : "bg-muted border-transparent text-muted-foreground"
                                  }`}
                                >
                                  <span className="font-medium">{day.day.slice(0, 3)}</span>
                                  {calc !== null && (
                                    <span className="ml-1 text-primary font-semibold">
                                      {formatPHP(toPHP(calc.total, phpRate))}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <Separator orientation="vertical" className="hidden sm:block h-auto self-stretch" />

                        {/* Earnings Summary */}
                        <div className="sm:text-right sm:min-w-[220px]">
                          <div className="grid grid-cols-3 sm:grid-cols-1 gap-2 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Net Sales</p>
                              <p className="font-semibold text-foreground text-sm">{formatPHP(toPHP(summary.totalNetSales, phpRate))}</p>
                              <p className="text-xs text-muted-foreground">{formatUSD(summary.totalNetSales)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Commission</p>
                              <p className="font-semibold text-chart-1 text-sm">{formatPHP(toPHP(summary.totalCommission, phpRate))}</p>
                              <p className="text-xs text-muted-foreground">{formatUSD(summary.totalCommission)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Pay</p>
                              <p className="text-xl font-extrabold text-primary" data-testid={`text-total-${week.id}`}>
                                {formatPHP(toPHP(summary.totalEarnings, phpRate))}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatUSD(summary.totalEarnings)}</p>
                            </div>
                          </div>
                          <div className="flex sm:justify-end gap-2">
                            <Button
                              variant="outline" size="sm"
                              onClick={() => setLocation(`/edit/${week.id}`)}
                              data-testid={`button-edit-${week.id}`}
                              className="gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline" size="sm"
                              onClick={() => deleteMutation.mutate({ id: week.id })}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${week.id}`}
                              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
