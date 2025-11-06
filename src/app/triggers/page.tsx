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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/lib/auth-client";

interface Match {
  id: number;
  venue: string;
  matchDate: string;
}

interface Team {
  id: number;
  name: string;
}

interface MatchTeam {
  id: number;
  matchId: number;
  teamId: number;
}

interface MatchScore {
  id?: number;
  matchTeamId: number;
  runs: number;
  wickets: number;
  overs: number;
}

export default function TriggersPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchTeams, setMatchTeams] = useState<MatchTeam[]>([]);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedMatch, setSelectedMatch] = useState("");
  const [team1Score, setTeam1Score] = useState({ runs: "0", wickets: "0", overs: "0" });
  const [team2Score, setTeam2Score] = useState({ runs: "0", wickets: "0", overs: "0" });
  
  const [sql, setSQL] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "pending">();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=" + encodeURIComponent("/triggers"));
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchMatches();
      fetchTeams();
      fetchMatchTeams();
      fetchMatchResults();
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

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams?limit=100");
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error("Failed to fetch teams");
    }
  };

  const fetchMatchTeams = async () => {
    try {
      const res = await fetch("/api/match-teams?limit=200");
      const data = await res.json();
      setMatchTeams(data);
    } catch (error) {
      console.error("Failed to fetch match teams");
    }
  };

  const fetchMatchResults = async () => {
    try {
      const res = await fetch("/api/match-result?limit=100");
      const data = await res.json();
      setMatchResults(data);
    } catch (error) {
      console.error("Failed to fetch match results");
    }
  };

  const handleSimulateTrigger = async () => {
    if (!selectedMatch) {
      setMessage("Please select a match");
      setStatus("error");
      return;
    }

    setLoading(true);
    setSQL(`-- Step 1: Insert team scores
INSERT INTO match_scores (match_team_id, runs, wickets, overs) VALUES (...);

-- Step 2: Trigger fires automatically
CREATE TRIGGER update_match_result_trigger 
AFTER INSERT ON match_scores
FOR EACH ROW
BEGIN
  -- Calculate winner and update match_result table
  UPDATE match_result SET winning_team_id = ..., result_summary = ...;
END;`);
    setStatus("pending");
    setMessage("Simulating trigger execution...");

    try {
      // Get match teams for this match
      const teamsForMatch = matchTeams.filter(mt => mt.matchId === parseInt(selectedMatch));
      
      if (teamsForMatch.length !== 2) {
        setStatus("error");
        setMessage("Match must have exactly 2 teams");
        setLoading(false);
        return;
      }

      // Insert scores for both teams
      const score1 = await fetch("/api/match-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchTeamId: teamsForMatch[0].id,
          runs: parseInt(team1Score.runs),
          wickets: parseInt(team1Score.wickets),
          overs: parseFloat(team1Score.overs),
        }),
      });

      const score2 = await fetch("/api/match-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchTeamId: teamsForMatch[1].id,
          runs: parseInt(team2Score.runs),
          wickets: parseInt(team2Score.wickets),
          overs: parseFloat(team2Score.overs),
        }),
      });

      if (!score1.ok || !score2.ok) {
        setStatus("error");
        setMessage("Failed to insert scores");
        setLoading(false);
        return;
      }

      // Manually create match result (simulating trigger)
      const team1Runs = parseInt(team1Score.runs);
      const team2Runs = parseInt(team2Score.runs);
      const winningTeamId = team1Runs > team2Runs ? teamsForMatch[0].teamId : teamsForMatch[1].teamId;
      const team1Name = teams.find(t => t.id === teamsForMatch[0].teamId)?.name || "Team 1";
      const team2Name = teams.find(t => t.id === teamsForMatch[1].teamId)?.name || "Team 2";
      const resultSummary = `${team1Name} ${team1Runs}/${team1Score.wickets} vs ${team2Name} ${team2Runs}/${team2Score.wickets} - ${teams.find(t => t.id === winningTeamId)?.name} won by ${Math.abs(team1Runs - team2Runs)} runs`;

      const resultRes = await fetch("/api/match-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: parseInt(selectedMatch),
          winningTeamId,
          resultSummary,
        }),
      });

      if (resultRes.ok) {
        setStatus("success");
        setMessage("Trigger simulated successfully! Match result auto-populated.");
        await logSQL("TRIGGER", "match_result", sql, "success");
        fetchMatchResults();
        setSelectedMatch("");
        setTeam1Score({ runs: "0", wickets: "0", overs: "0" });
        setTeam2Score({ runs: "0", wickets: "0", overs: "0" });
      } else {
        const error = await resultRes.json();
        setStatus("error");
        setMessage(error.error || "Failed to create match result");
        await logSQL("TRIGGER", "match_result", sql, "error", error.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to simulate trigger");
      await logSQL("TRIGGER", "match_result", sql, "error", (error as Error).message);
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

  const getMatchTeamsForMatch = (matchId: number) => {
    return matchTeams.filter(mt => mt.matchId === matchId);
  };

  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || "Unknown";
  };

  const getMatchVenue = (matchId: number) => {
    return matches.find(m => m.id === matchId)?.venue || "Unknown";
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
          <h1 className="text-4xl font-bold mb-2">Database Triggers</h1>
          <p className="text-muted-foreground">
            Demonstrate automatic match_result population when team scores are inserted
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Trigger Simulation</CardTitle>
                  <CardDescription>Add scores to auto-populate match_result</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="match">Select Match *</Label>
                <Select value={selectedMatch} onValueChange={setSelectedMatch} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select match" />
                  </SelectTrigger>
                  <SelectContent>
                    {matches.map((match) => {
                      const teamsForMatch = getMatchTeamsForMatch(match.id);
                      if (teamsForMatch.length === 2) {
                        return (
                          <SelectItem key={match.id} value={match.id.toString()}>
                            {match.venue} - {getTeamName(teamsForMatch[0].teamId)} vs {getTeamName(teamsForMatch[1].teamId)}
                          </SelectItem>
                        );
                      }
                      return null;
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedMatch && (
                <>
                  <div className="space-y-2">
                    <Label>Team 1: {getTeamName(getMatchTeamsForMatch(parseInt(selectedMatch))[0]?.teamId)}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Runs"
                        value={team1Score.runs}
                        onChange={(e) => setTeam1Score({ ...team1Score, runs: e.target.value })}
                      />
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="Wickets"
                        value={team1Score.wickets}
                        onChange={(e) => setTeam1Score({ ...team1Score, wickets: e.target.value })}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Overs"
                        value={team1Score.overs}
                        onChange={(e) => setTeam1Score({ ...team1Score, overs: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Team 2: {getTeamName(getMatchTeamsForMatch(parseInt(selectedMatch))[1]?.teamId)}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Runs"
                        value={team2Score.runs}
                        onChange={(e) => setTeam2Score({ ...team2Score, runs: e.target.value })}
                      />
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="Wickets"
                        value={team2Score.wickets}
                        onChange={(e) => setTeam2Score({ ...team2Score, wickets: e.target.value })}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Overs"
                        value={team2Score.overs}
                        onChange={(e) => setTeam2Score({ ...team2Score, overs: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  When both team scores are inserted, the trigger automatically calculates the winner and populates the match_result table
                </AlertDescription>
              </Alert>

              <Button onClick={handleSimulateTrigger} disabled={loading || !selectedMatch} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Simulate Trigger
              </Button>

              {sql && <SQLDisplay sql={sql} status={status} message={message} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Match Results (Trigger Output)</CardTitle>
              <CardDescription>{matchResults.length} results auto-generated by triggers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchResults.slice(0, 10).map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="text-xs">{getMatchVenue(result.matchId)}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {result.winningTeamId ? getTeamName(result.winningTeamId) : "TBD"}
                      </TableCell>
                      <TableCell className="text-xs">{result.resultSummary || "Pending"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}