"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SQLDisplay } from "@/components/sql-display";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";

interface Performance {
  id: number;
  matchId: number;
  playerId: number;
  runsScored: number;
  wicketsTaken: number;
}

interface Match {
  id: number;
  venue: string;
  matchDate: string;
}

interface Player {
  id: number;
  name: string;
}

export function PerformanceManager() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ matchId: "", playerId: "", runsScored: "0", wicketsTaken: "0" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sql, setSQL] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "pending">();
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPerformances();
    fetchMatches();
    fetchPlayers();
  }, []);

  const fetchPerformances = async () => {
    setLoading(true);
    setSQL("SELECT * FROM performance ORDER BY id DESC LIMIT 50;");
    try {
      const res = await fetch("/api/performance?limit=50");
      const data = await res.json();
      setPerformances(data);
      setStatus("success");
      setMessage(`Fetched ${data.length} performance records successfully`);
    } catch (error) {
      setStatus("error");
      setMessage("Failed to fetch performance records");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      matchId: parseInt(formData.matchId),
      playerId: parseInt(formData.playerId),
      runsScored: parseInt(formData.runsScored),
      wicketsTaken: parseInt(formData.wicketsTaken),
    };

    if (editingId) {
      setSQL(`UPDATE performance SET match_id = ${payload.matchId}, player_id = ${payload.playerId}, runs_scored = ${payload.runsScored}, wickets_taken = ${payload.wicketsTaken} WHERE id = ${editingId};`);
      try {
        const res = await fetch(`/api/performance?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Performance updated successfully");
          await logSQL("UPDATE", "performance", sql, "success");
          fetchPerformances();
          setFormData({ matchId: "", playerId: "", runsScored: "0", wicketsTaken: "0" });
          setEditingId(null);
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to update performance");
          await logSQL("UPDATE", "performance", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to update performance");
      }
    } else {
      setSQL(`INSERT INTO performance (match_id, player_id, runs_scored, wickets_taken) VALUES (${payload.matchId}, ${payload.playerId}, ${payload.runsScored}, ${payload.wicketsTaken});`);
      try {
        const res = await fetch("/api/performance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Performance created successfully");
          await logSQL("INSERT", "performance", sql, "success");
          fetchPerformances();
          setFormData({ matchId: "", playerId: "", runsScored: "0", wicketsTaken: "0" });
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to create performance");
          await logSQL("INSERT", "performance", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to create performance");
      }
    }
    setLoading(false);
  };

  const handleEdit = (perf: Performance) => {
    setFormData({
      matchId: perf.matchId.toString(),
      playerId: perf.playerId.toString(),
      runsScored: perf.runsScored.toString(),
      wicketsTaken: perf.wicketsTaken.toString(),
    });
    setEditingId(perf.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this performance record?")) return;
    
    setLoading(true);
    setSQL(`DELETE FROM performance WHERE id = ${id};`);
    try {
      const res = await fetch(`/api/performance?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatus("success");
        setMessage("Performance deleted successfully");
        await logSQL("DELETE", "performance", sql, "success");
        fetchPerformances();
      } else {
        const error = await res.json();
        setStatus("error");
        setMessage(error.error || "Failed to delete performance");
        await logSQL("DELETE", "performance", sql, "error", error.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to delete performance");
    }
    setLoading(false);
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

  const getMatchVenue = (matchId: number) => {
    return matches.find(m => m.id === matchId)?.venue || "Unknown";
  };

  const getPlayerName = (playerId: number) => {
    return players.find(p => p.id === playerId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Performance" : "Create New Performance"}</CardTitle>
          <CardDescription>Manage player performance data with SQL-backed operations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="matchId">Match *</Label>
                <Select value={formData.matchId} onValueChange={(v) => setFormData({ ...formData, matchId: v })} required>
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
                <Label htmlFor="playerId">Player *</Label>
                <Select value={formData.playerId} onValueChange={(v) => setFormData({ ...formData, playerId: v })} required>
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
              <div>
                <Label htmlFor="runsScored">Runs Scored</Label>
                <Input
                  id="runsScored"
                  type="number"
                  min="0"
                  value={formData.runsScored}
                  onChange={(e) => setFormData({ ...formData, runsScored: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="wicketsTaken">Wickets Taken</Label>
                <Input
                  id="wicketsTaken"
                  type="number"
                  min="0"
                  value={formData.wicketsTaken}
                  onChange={(e) => setFormData({ ...formData, wicketsTaken: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Update Performance" : "Create Performance"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ matchId: "", playerId: "", runsScored: "0", wicketsTaken: "0" });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
          {sql && <SQLDisplay sql={sql} status={status} message={message} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Performance Records</CardTitle>
          <CardDescription>{performances.length} records in database (showing last 50)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Wickets</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performances.map((perf) => (
                <TableRow key={perf.id}>
                  <TableCell>{perf.id}</TableCell>
                  <TableCell>{getMatchVenue(perf.matchId)}</TableCell>
                  <TableCell className="font-medium">{getPlayerName(perf.playerId)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {perf.runsScored}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      {perf.wicketsTaken}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(perf)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(perf.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
