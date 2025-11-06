"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SQLDisplay } from "@/components/sql-display";
import { Play, Loader2, TrendingUp, Trophy, BarChart3 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function QueriesPage() {
  const [customQuery, setCustomQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sql, setSQL] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "pending">();
  const [message, setMessage] = useState("");

  const predefinedQueries = [
    {
      id: 1,
      title: "Top 5 Run Scorers",
      icon: TrendingUp,
      description: "Players with highest total runs across all matches",
      sql: `SELECT p.id, p.name, t.name as team, SUM(pf.runs_scored) as total_runs
FROM players p
JOIN teams t ON p.team_id = t.id
JOIN performance pf ON p.id = pf.player_id
GROUP BY p.id, p.name, t.name
ORDER BY total_runs DESC
LIMIT 5;`,
      endpoint: "/api/match-performance-summary?limit=100",
      transform: (data: any[]) => {
        const playerStats = new Map();
        data.forEach(item => {
          const key = item.playerName;
          if (!playerStats.has(key)) {
            playerStats.set(key, {
              playerName: key,
              teamName: item.teamName,
              totalRuns: 0
            });
          }
          playerStats.get(key).totalRuns += item.runsScored;
        });
        return Array.from(playerStats.values())
          .sort((a, b) => b.totalRuns - a.totalRuns)
          .slice(0, 5);
      }
    },
    {
      id: 2,
      title: "Match Performance Summary",
      icon: BarChart3,
      description: "Recent match performances with player stats (VIEW demonstration)",
      sql: `SELECT match_id, match_date, venue, player_name, team_name, runs_scored, wickets_taken
FROM match_performance_summary
ORDER BY match_date DESC
LIMIT 10;`,
      endpoint: "/api/match-performance-summary?limit=10",
      transform: (data: any[]) => data
    },
    {
      id: 3,
      title: "Players with Awards",
      icon: Trophy,
      description: "Join across player_awards, players, and awards tables",
      sql: `SELECT p.name as player_name, a.award_name, a.award_category, pa.year
FROM player_awards pa
JOIN players p ON pa.player_id = p.id
JOIN awards a ON pa.award_id = a.id
ORDER BY pa.year DESC, p.name;`,
      endpoint: "/api/player-awards?limit=100",
      transform: async (data: any[]) => {
        const players = await fetch("/api/players?limit=100").then(r => r.json());
        const awards = await fetch("/api/awards?limit=100").then(r => r.json());
        
        return data.map(pa => ({
          playerName: players.find((p: any) => p.id === pa.playerId)?.name || "Unknown",
          awardName: awards.find((a: any) => a.id === pa.awardId)?.awardName || "Unknown",
          awardCategory: awards.find((a: any) => a.id === pa.awardId)?.awardCategory || "Unknown",
          year: pa.year
        }));
      }
    }
  ];

  const executePredefinedQuery = async (query: any) => {
    setLoading(true);
    setSQL(query.sql);
    setStatus("pending");
    setMessage("Executing query...");

    try {
      const res = await fetch(query.endpoint);
      const data = await res.json();
      
      let transformed = data;
      if (query.transform) {
        transformed = await query.transform(data);
      }
      
      setQueryResult(transformed);
      setStatus("success");
      setMessage(`Query executed successfully. ${transformed.length} rows returned.`);
      
      await logSQL("SELECT", "multiple", query.sql, "success");
    } catch (error) {
      setStatus("error");
      setMessage("Failed to execute query");
      setQueryResult(null);
      await logSQL("SELECT", "multiple", query.sql, "error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      setMessage("Please enter a query");
      setStatus("error");
      return;
    }

    // Validate read-only
    const upperQuery = customQuery.trim().toUpperCase();
    if (!upperQuery.startsWith("SELECT")) {
      setMessage("Only SELECT queries are allowed");
      setStatus("error");
      return;
    }

    setLoading(true);
    setSQL(customQuery);
    setStatus("pending");
    setMessage("Custom queries are simulated in this demo. Use predefined queries to see real data.");
    
    setTimeout(() => {
      setStatus("success");
      setMessage("Custom query feature is read-only for safety. Please use the predefined queries above.");
      setQueryResult([]);
      setLoading(false);
    }, 1000);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">SQL Queries</h1>
          <p className="text-muted-foreground">
            Execute predefined queries to explore cricket data with SQL visualization
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          {predefinedQueries.map((query) => {
            const Icon = query.icon;
            return (
              <Card key={query.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{query.title}</CardTitle>
                        <CardDescription>{query.description}</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => executePredefinedQuery(query)} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Execute
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-24 w-full rounded-md border bg-muted p-3">
                    <code className="text-xs font-mono whitespace-pre">{query.sql}</code>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Custom Query (Read-Only)</CardTitle>
            <CardDescription>Enter your own SELECT query to explore the database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="SELECT * FROM players WHERE role = 'Batsman' LIMIT 10;"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="font-mono text-sm h-32"
            />
            <Button onClick={executeCustomQuery} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Execute Custom Query
            </Button>
          </CardContent>
        </Card>

        {sql && <SQLDisplay sql={sql} status={status} message={message} />}

        {queryResult && queryResult.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
              <CardDescription>{queryResult.length} rows returned</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(queryResult[0]).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResult.map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        {Object.values(row).map((value: any, i) => (
                          <TableCell key={i}>{String(value)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
