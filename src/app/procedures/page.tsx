"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SQLDisplay } from "@/components/sql-display";
import { Settings, TrendingUp, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/lib/auth-client";

interface Match {
  id: number;
  venue: string;
  matchDate: string;
}

interface Player {
  id: number;
  name: string;
}

export default function ProceduresPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Insert Performance Form
  const [insertForm, setInsertForm] = useState({
    matchId: "",
    playerId: "",
    runsScored: "0",
    wicketsTaken: "0"
  });
  const [insertSQL, setInsertSQL] = useState("");
  const [insertStatus, setInsertStatus] = useState<"success" | "error" | "pending">();
  const [insertMessage, setInsertMessage] = useState("");

  // Get Total Runs Form
  const [totalRunsPlayerId, setTotalRunsPlayerId] = useState("");
  const [totalRunsResult, setTotalRunsResult] = useState<any>(null);
  const [totalRunsSQL, setTotalRunsSQL] = useState("");
  const [totalRunsStatus, setTotalRunsStatus] = useState<"success" | "error" | "pending">();
  const [totalRunsMessage, setTotalRunsMessage] = useState("");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=" + encodeURIComponent("/procedures"));
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchMatches();
      fetchPlayers();
    }
  }, [session]);

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches?limit=100");
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error("Failed to fetch matches");
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players?limit=100");
      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error("Failed to fetch players");
    }
  };

  const handleInsertPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const sql = `CALL insert_performance(${insertForm.matchId}, ${insertForm.playerId}, ${insertForm.runsScored}, ${insertForm.wicketsTaken});`;
    setInsertSQL(sql);
    setInsertStatus("pending");
    setInsertMessage("Executing stored procedure...");

    try {
      const res = await fetch("/api/performance/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: parseInt(insertForm.matchId),
          playerId: parseInt(insertForm.playerId),
          runsScored: parseInt(insertForm.runsScored),
          wicketsTaken: parseInt(insertForm.wicketsTaken),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInsertStatus("success");
        setInsertMessage(`Performance record created successfully! ID: ${data.id}`);
        await logSQL("PROCEDURE", "performance", sql, "success");
        setInsertForm({ matchId: "", playerId: "", runsScored: "0", wicketsTaken: "0" });
      } else {
        const error = await res.json();
        setInsertStatus("error");
        setInsertMessage(error.error || "Failed to insert performance");
        await logSQL("PROCEDURE", "performance", sql, "error", error.error);
      }
    } catch (error) {
      setInsertStatus("error");
      setInsertMessage("Failed to execute stored procedure");
      await logSQL("PROCEDURE", "performance", sql, "error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTotalRuns = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const sql = `SELECT get_total_runs(${totalRunsPlayerId}) as total_runs;`;
    setTotalRunsSQL(sql);
    setTotalRunsStatus("pending");
    setTotalRunsMessage("Executing function...");

    try {
      const res = await fetch(`/api/players/total-runs?playerId=${totalRunsPlayerId}`);
      
      if (res.ok) {
        const data = await res.json();
        setTotalRunsResult(data);
        setTotalRunsStatus("success");
        setTotalRunsMessage(`Function executed successfully! ${data.playerName} has scored ${data.totalRuns} total runs.`);
        await logSQL("FUNCTION", "performance", sql, "success");
      } else {
        const error = await res.json();
        setTotalRunsStatus("error");
        setTotalRunsMessage(error.error || "Failed to get total runs");
        setTotalRunsResult(null);
        await logSQL("FUNCTION", "performance", sql, "error", error.error);
      }
    } catch (error) {
      setTotalRunsStatus("error");
      setTotalRunsMessage("Failed to execute function");
      setTotalRunsResult(null);
      await logSQL("FUNCTION", "performance", sql, "error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const logSQL = async (operation: string, table: string, sql: string, status: string, error?: string) => {
    try {
      await fetch("/api/sql-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationType: operation,
          tableName: table,
          sqlStatement: sql,
          status,
          errorMessage: error || null,
        }),
      });
    } catch (e) {
      console.error("Failed to log SQL:", e);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Stored Procedures & Functions</h1>
          <p className="text-muted-foreground">
            Execute stored procedures and functions with validation and SQL visualization
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Insert Performance Procedure */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>insert_performance()</CardTitle>
                  <CardDescription>Stored Procedure with Validation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInsertPerformance} className="space-y-4">
                <div>
                  <Label htmlFor="proc-match">Match *</Label>
                  <Select value={insertForm.matchId} onValueChange={(v) => setInsertForm({ ...insertForm, matchId: v })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select match" />
                    </SelectTrigger>
                    <SelectContent>
                      {matches.map((match) => (
                        <SelectItem key={match.id} value={match.id.toString()}>
                          {match.venue} - {new Date(match.matchDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="proc-player">Player *</Label>
                  <Select value={insertForm.playerId} onValueChange={(v) => setInsertForm({ ...insertForm, playerId: v })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="proc-runs">Runs Scored</Label>
                    <Input
                      id="proc-runs"
                      type="number"
                      min="0"
                      value={insertForm.runsScored}
                      onChange={(e) => setInsertForm({ ...insertForm, runsScored: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proc-wickets">Wickets Taken</Label>
                    <Input
                      id="proc-wickets"
                      type="number"
                      min="0"
                      value={insertForm.wicketsTaken}
                      onChange={(e) => setInsertForm({ ...insertForm, wicketsTaken: e.target.value })}
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-xs">
                    Validates: match exists, player exists, no duplicate performance, non-negative values
                  </AlertDescription>
                </Alert>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                  Execute Procedure
                </Button>
              </form>

              {insertSQL && <SQLDisplay sql={insertSQL} status={insertStatus} message={insertMessage} />}
            </CardContent>
          </Card>

          {/* Get Total Runs Function */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>get_total_runs()</CardTitle>
                  <CardDescription>SQL Function for Aggregation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGetTotalRuns} className="space-y-4">
                <div>
                  <Label htmlFor="func-player">Player *</Label>
                  <Select value={totalRunsPlayerId} onValueChange={setTotalRunsPlayerId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <AlertDescription className="text-xs">
                    Calculates total runs scored by a player across all matches using SQL aggregation
                  </AlertDescription>
                </Alert>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                  Execute Function
                </Button>
              </form>

              {totalRunsSQL && <SQLDisplay sql={totalRunsSQL} status={totalRunsStatus} message={totalRunsMessage} />}

              {totalRunsResult && (
                <Card className="mt-4 bg-muted">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total Runs</p>
                      <p className="text-4xl font-bold text-primary">{totalRunsResult.totalRuns}</p>
                      <p className="text-sm text-muted-foreground mt-2">{totalRunsResult.playerName}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}