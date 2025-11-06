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

interface Player {
  id: number;
  name: string;
  teamId: number;
  role: string;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
}

const ROLES = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];

export function PlayersManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", teamId: "", role: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sql, setSQL] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "pending">();
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    setSQL("SELECT * FROM players ORDER BY id;");
    try {
      const res = await fetch("/api/players?limit=100");
      const data = await res.json();
      setPlayers(data);
      setStatus("success");
      setMessage(`Fetched ${data.length} players successfully`);
    } catch (error) {
      setStatus("error");
      setMessage("Failed to fetch players");
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      setSQL(`UPDATE players SET name = '${formData.name}', team_id = ${formData.teamId}, role = '${formData.role}' WHERE id = ${editingId};`);
      try {
        const res = await fetch(`/api/players?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name, teamId: parseInt(formData.teamId), role: formData.role }),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Player updated successfully");
          await logSQL("UPDATE", "players", sql, "success");
          fetchPlayers();
          setFormData({ name: "", teamId: "", role: "" });
          setEditingId(null);
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to update player");
          await logSQL("UPDATE", "players", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to update player");
      }
    } else {
      setSQL(`INSERT INTO players (name, team_id, role) VALUES ('${formData.name}', ${formData.teamId}, '${formData.role}');`);
      try {
        const res = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name, teamId: parseInt(formData.teamId), role: formData.role }),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Player created successfully");
          await logSQL("INSERT", "players", sql, "success");
          fetchPlayers();
          setFormData({ name: "", teamId: "", role: "" });
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to create player");
          await logSQL("INSERT", "players", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to create player");
      }
    }
    setLoading(false);
  };

  const handleEdit = (player: Player) => {
    setFormData({ name: player.name, teamId: player.teamId.toString(), role: player.role });
    setEditingId(player.id);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    setLoading(true);
    setSQL(`DELETE FROM players WHERE id = ${id};`);
    try {
      const res = await fetch(`/api/players?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatus("success");
        setMessage("Player deleted successfully");
        await logSQL("DELETE", "players", sql, "success");
        fetchPlayers();
      } else {
        const error = await res.json();
        setStatus("error");
        setMessage(error.error || "Failed to delete player");
        await logSQL("DELETE", "players", sql, "error", error.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to delete player");
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

  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Player" : "Create New Player"}</CardTitle>
          <CardDescription>Manage cricket players with SQL-backed operations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Player Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Virat Kohli"
                  required
                />
              </div>
              <div>
                <Label htmlFor="teamId">Team *</Label>
                <Select value={formData.teamId} onValueChange={(v) => setFormData({ ...formData, teamId: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Update Player" : "Create Player"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: "", teamId: "", role: "" });
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
          <CardTitle>All Players</CardTitle>
          <CardDescription>{players.length} players in database</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>{player.id}</TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{getTeamName(player.teamId)}</TableCell>
                  <TableCell>{player.role}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(player)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(player.id, player.name)}>
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
