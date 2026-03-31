import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/settings";
import { type CommissionTierConfig, buildTiers, TIER_COLORS, formatPHP, formatUSD, toPHP, getBasePay } from "@/lib/salary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_TIERS: CommissionTierConfig[] = [
  { min: 0, max: 499.99, rate: 0.03 },
  { min: 500, max: 999.99, rate: 0.04 },
  { min: 1000, max: null, rate: 0.05 },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, save } = useSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [hourlyRate, setHourlyRate] = useState(String(settings.hourlyRate));
  const [hoursPerDay, setHoursPerDay] = useState(String(settings.hoursPerDay));
  const [phpRate, setPhpRate] = useState(String(settings.phpUsdRate));
  const [tiers, setTiers] = useState<CommissionTierConfig[]>(settings.commissionTiers);

  useEffect(() => {
    if (open) {
      setHourlyRate(String(settings.hourlyRate));
      setHoursPerDay(String(settings.hoursPerDay));
      setPhpRate(String(settings.phpUsdRate));
      setTiers(settings.commissionTiers);
    }
  }, [open, settings]);

  const basePay = (parseFloat(hourlyRate) || 0) * (parseFloat(hoursPerDay) || 0);
  const php = parseFloat(phpRate) || 56;
  const previewTiers = buildTiers(tiers);

  function updateTier(index: number, field: keyof CommissionTierConfig, value: string) {
    setTiers((prev) => {
      const next = [...prev];
      if (field === "rate") {
        next[index] = { ...next[index], rate: parseFloat(value) / 100 || 0 };
      } else if (field === "max") {
        next[index] = { ...next[index], max: value === "" || value === "∞" ? null : parseFloat(value) || null };
      } else if (field === "min") {
        next[index] = { ...next[index], min: parseFloat(value) || 0 };
      }
      return next;
    });
  }

  function addTier() {
    setTiers((prev) => {
      const last = prev[prev.length - 1];
      const newMin = last?.max != null ? last.max + 0.01 : (last?.min ?? 0) + 500;
      return [...prev, { min: Math.round(newMin), max: null, rate: 0.06 }];
    });
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return;
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function resetToDefaults() {
    setHourlyRate("2");
    setHoursPerDay("8");
    setPhpRate("56");
    setTiers(DEFAULT_TIERS);
  }

  async function handleSave() {
    const rate = parseFloat(hourlyRate);
    const hours = parseFloat(hoursPerDay);
    const phpUsd = parseFloat(phpRate);

    if (!rate || rate <= 0 || !hours || hours <= 0 || !phpUsd || phpUsd <= 0) {
      toast({ title: "Invalid values", description: "Please enter valid positive numbers.", variant: "destructive" });
      return;
    }
    if (tiers.some((t) => !t.rate || t.rate <= 0)) {
      toast({ title: "Invalid tier", description: "All commission rates must be greater than 0.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await save({ hourlyRate: rate, hoursPerDay: hours, commissionTiers: tiers, phpUsdRate: phpUsd });
      toast({ title: "Settings saved!", description: "Your pay parameters have been updated." });
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Pay Settings</DialogTitle>
          <p className="text-sm text-muted-foreground">Customize your base pay, commission tiers, and currency rate. These settings are personal to your account.</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Base Pay */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Base Pay</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hourly-rate" className="text-xs">Hourly Rate (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="hourly-rate"
                    type="number"
                    min="0.01"
                    step="0.5"
                    className="pl-7"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    data-testid="input-hourly-rate"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hours-per-day" className="text-xs">Hours Per Day</Label>
                <Input
                  id="hours-per-day"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  data-testid="input-hours-per-day"
                />
              </div>
            </div>
            {basePay > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Daily base pay: <span className="font-semibold text-primary">{formatPHP(toPHP(basePay, php))}</span>
                <span className="ml-1 text-muted-foreground">({formatUSD(basePay)})</span>
              </p>
            )}
          </div>

          <Separator />

          {/* Commission Tiers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Commission Tiers</h3>
              <Button variant="outline" size="sm" onClick={addTier} className="gap-1.5 h-7 text-xs">
                <Plus className="h-3 w-3" />
                Add Tier
              </Button>
            </div>
            <div className="space-y-3">
              {tiers.map((tier, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Min Sales ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={tier.min}
                      onChange={(e) => updateTier(i, "min", e.target.value)}
                      className="h-8 text-sm"
                      data-testid={`input-tier-min-${i}`}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Max Sales ($)</Label>
                    <Input
                      type="text"
                      placeholder="∞"
                      value={tier.max == null ? "" : tier.max}
                      onChange={(e) => updateTier(i, "max", e.target.value)}
                      className="h-8 text-sm"
                      data-testid={`input-tier-max-${i}`}
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs text-muted-foreground">Rate (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={(tier.rate * 100).toFixed(1).replace(/\.0$/, "")}
                        onChange={(e) => updateTier(i, "rate", e.target.value)}
                        className="h-8 text-sm pr-6"
                        data-testid={`input-tier-rate-${i}`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                    </div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 mb-3 ${TIER_COLORS[i % TIER_COLORS.length].split(" ")[0].replace("text-", "bg-")}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTier(i)}
                    disabled={tiers.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            {previewTiers.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                {previewTiers.map((t, i) => (
                  <div key={i} className={`flex items-center gap-2 ${t.color}`}>
                    <span className="font-medium">${t.label}</span>
                    <span>→ {(t.rate * 100).toFixed(1).replace(/\.0$/, "")}% commission</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* PHP Rate */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Currency (PHP/USD)</h3>
            <div className="space-y-1.5">
              <Label htmlFor="php-rate" className="text-xs">PHP per 1 USD</Label>
              <div className="relative max-w-[160px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                <Input
                  id="php-rate"
                  type="number"
                  min="1"
                  step="0.5"
                  className="pl-7"
                  value={phpRate}
                  onChange={(e) => setPhpRate(e.target.value)}
                  data-testid="input-php-rate"
                />
              </div>
              {php > 0 && (
                <p className="text-xs text-muted-foreground">
                  $1.00 USD = ₱{php} · ₱1 = ${(1 / php).toFixed(4)} USD
                </p>
              )}
              <p className="text-xs text-muted-foreground italic">
                Check the current rate at Bangko Sentral ng Pilipinas or any currency app.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={resetToDefaults} className="gap-1.5 mr-auto text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset defaults
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2" data-testid="button-save-settings">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving…" : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
