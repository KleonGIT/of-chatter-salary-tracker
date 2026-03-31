import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  calculateWeekSummary,
  formatCurrency,
  BASE_PAY_DAILY,
} from "@/lib/salary";
import type { DayEntry } from "@/lib/salary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  Shield,
  ShieldOff,
  Search,
  Loader2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  createdAt: string;
  weekCount: number;
}

interface AdminWeek {
  id: string;
  label: string;
  chatterName: string;
  weekStart: string;
  days: DayEntry[];
  createdAt: string;
  userId: string;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [weeks, setWeeks] = useState<AdminWeek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [usersRes, weeksRes] = await Promise.all([
          fetch("/api/admin/users", { credentials: "include" }),
          fetch("/api/admin/weeks", { credentials: "include" }),
        ]);
        if (usersRes.ok) setUsers(await usersRes.json().then((d) => d.users));
        if (weeksRes.ok) setWeeks(await weeksRes.json().then((d) => d.weeks));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    setPromoting(userId);
    try {
      const endpoint = makeAdmin ? "promote" : "demote";
      const res = await fetch(`/api/admin/${endpoint}/${userId}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isAdmin: makeAdmin } : u))
        );
      }
    } finally {
      setPromoting(null);
    }
  }

  function toggleExpand(userId: string) {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-sm w-full text-center p-8">
          <ShieldOff className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have admin access.</p>
          <Button onClick={() => setLocation("/")}>Go back</Button>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    );
  });

  const totalEarnings = weeks.reduce((sum, w) => {
    const s = calculateWeekSummary(w.days);
    return sum + s.totalEarnings;
  }, 0);
  const totalSales = weeks.reduce((sum, w) => {
    const s = calculateWeekSummary(w.days);
    return sum + s.totalNetSales;
  }, 0);

  function getUserWeeks(userId: string) {
    return weeks.filter((w) => w.userId === userId);
  }

  function getUserDisplayName(u: AdminUser) {
    if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    return u.email ?? u.id.slice(0, 8);
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-page">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Superadmin Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold" data-testid="text-admin-user-count">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-chart-1/10 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-chart-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Weeks</p>
                  <p className="text-2xl font-bold">{weeks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Net Sales</p>
                  <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid Out</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(totalEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                All Chatters
              </CardTitle>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-admin-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                {search ? "No users match your search." : "No users registered yet."}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => {
                  const userWeeks = getUserWeeks(u.id);
                  const totalUserEarnings = userWeeks.reduce((sum, w) => {
                    return sum + calculateWeekSummary(w.days).totalEarnings;
                  }, 0);
                  const totalUserSales = userWeeks.reduce((sum, w) => {
                    return sum + calculateWeekSummary(w.days).totalNetSales;
                  }, 0);
                  const isExpanded = expandedUsers.has(u.id);

                  return (
                    <div key={u.id} className="border border-border rounded-xl overflow-hidden" data-testid={`admin-user-${u.id}`}>
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleExpand(u.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                          {(u.firstName?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{getUserDisplayName(u)}</p>
                            {u.isAdmin && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                <Shield className="h-3 w-3 mr-1" /> Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{u.email ?? "No email"}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">{u.weekCount} week{u.weekCount !== 1 ? "s" : ""}</p>
                          <p className="font-semibold text-primary">{formatCurrency(totalUserEarnings)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.id !== user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAdmin(u.id, !u.isAdmin);
                              }}
                              disabled={promoting === u.id}
                              data-testid={`button-toggle-admin-${u.id}`}
                              className={u.isAdmin ? "text-destructive hover:text-destructive border-destructive/30" : ""}
                            >
                              {promoting === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : u.isAdmin ? (
                                <><ShieldOff className="h-3.5 w-3.5 mr-1" />Revoke</>
                              ) : (
                                <><Shield className="h-3.5 w-3.5 mr-1" />Make Admin</>
                              )}
                            </Button>
                          )}
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/10 p-4">
                          {userWeeks.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-3">No weeks tracked yet.</p>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {u.weekCount} week{u.weekCount !== 1 ? "s" : ""} — {formatCurrency(totalUserSales)} net sales — {formatCurrency(totalUserEarnings)} earned
                                </p>
                              </div>
                              {userWeeks.map((w) => {
                                const s = calculateWeekSummary(w.days);
                                return (
                                  <div key={w.id} className="flex items-center justify-between gap-3 p-3 bg-card rounded-lg border border-border text-sm">
                                    <div>
                                      <p className="font-medium text-foreground">{w.label}</p>
                                      <p className="text-xs text-muted-foreground">{w.chatterName} · {s.workedDays} days</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Net Sales: {formatCurrency(s.totalNetSales)}</p>
                                      <p className="font-bold text-primary">{formatCurrency(s.totalEarnings)}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
