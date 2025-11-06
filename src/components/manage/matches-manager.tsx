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

interface Match {
  id: number;
  venue: string;
  matchDate: string;
  matchType: string;
  createdAt: string;
}

const MATCH_TYPES = ["ODI", "Test", "T20", "T10"];

export function MatchesManager() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ venue: "", matchDate: "", matchType: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sql, setSQL] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "pending">();
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    setSQL("SELECT * FROM matches ORDER BY match_date DESC;");
    try {
      const res = await fetch("/api/matches?limit=100");
      const data = await res.json();
      setMatches(data);
      setStatus("success");
      setMessage(`Fetched ${data.length} matches successfully`);
    } catch (error) {
      setStatus("error");
      setMessage("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      setSQL(`UPDATE matches SET venue = '${formData.venue}', match_date = '${formData.matchDate}', match_type = '${formData.matchType}' WHERE id = ${editingId};`);
      try {
        const res = await fetch(`/api/matches?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Match updated successfully");
          await logSQL("UPDATE", "matches", sql, "success");
          fetchMatches();
          setFormData({ venue: "", matchDate: "", matchType: "" });
          setEditingId(null);
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to update match");
          await logSQL("UPDATE", "matches", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to update match");
      }
    } else {
      setSQL(`INSERT INTO matches (venue, match_date, match_type) VALUES ('${formData.venue}', '${formData.matchDate}', '${formData.matchType}');`);
      try {
        const res = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Match created successfully");
          await logSQL("INSERT", "matches", sql, "success");
          fetchMatches();
          setFormData({ venue: "", matchDate: "", matchType: "" });
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to create match");
          await logSQL("INSERT", "matches", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to create match");
      }
    }
    setLoading(false);
  };

  const handleEdit = (match: Match) => {
    setFormData({ venue: match.venue, matchDate: match.matchDate, matchType: match.matchType });
    setEditingId(match.id);
  };

  const handleDelete = async (id: number, venue: string) => {
    if (!confirm(`Are you sure you want to delete match at ${venue}?`)) return;
    
    setLoading(true);
    setSQL(`DELETE FROM matches WHERE id = ${id};`);
    try {
      const res = await fetch(`/api/matches?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatus("success");
        setMessage("Match deleted successfully");
        await logSQL("DELETE", "matches", sql, "success");
        fetchMatches();
      } else {
        const error = await res.json();
        setStatus("error");
        setMessage(error.error || "Failed to delete match");
        await logSQL("DELETE", "matches", sql, "error", error.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to delete match");
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Match" : "Create New Match"}</CardTitle>
          <CardDescription>Manage cricket matches with SQL-backed operations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Melbourne Cricket Ground"
                  required
                />
              </div>
              <div>
                <Label htmlFor="matchDate">Match Date *</Label>
                <Input
                  id="matchDate"
                  type="date"
                  value={formData.matchDate}
                  onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="matchType">Match Type *</Label>
                <Select value={formData.matchType} onValueChange={(v) => setFormData({ ...formData, matchType: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Update Match" : "Create Match"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ venue: "", matchDate: "", matchType: "" });
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
          <CardTitle>All Matches</CardTitle>
          <CardDescription>{matches.length} matches in database</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>{match.id}</TableCell>
                  <TableCell className="font-medium">{match.venue}</TableCell>
                  <TableCell>{new Date(match.matchDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                      {match.matchType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(match)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(match.id, match.venue)}>
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
