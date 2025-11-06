"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SQLDisplay } from "@/components/sql-display";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Loader2, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AwardType {
  id: number;
  awardName: string;
  awardCategory: string;
}

interface PlayerAward {
  id: number;
  playerId: number;
  awardId: number;
  year: number;
}

interface Player {
  id: number;
  name: string;
}

const AWARD_CATEGORIES = ["Performance", "Season", "Leadership", "Conduct"];

export function AwardsManager() {
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [playerAwards, setPlayerAwards] = useState<PlayerAward[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [awardFormData, setAwardFormData] = useState({ awardName: "", awardCategory: "" });
  const [playerAwardFormData, setPlayerAwardFormData] = useState({ playerId: "", awardId: "", year: new Date().getFullYear().toString() });
  const [editingAwardId, setEditingAwardId] = useState<number | null>(null);
  const [editingPlayerAwardId, setEditingPlayerAwardId] = useState<number | null>(null);
  const [sql, setSQL] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "pending">();
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAwards();
    fetchPlayerAwards();
    fetchPlayers();
  }, []);

  const fetchAwards = async () => {
    setLoading(true);
    setSQL("SELECT * FROM awards ORDER BY award_category, award_name;");
    try {
      const res = await fetch("/api/awards?limit=100");
      const data = await res.json();
      setAwards(data);
      setStatus("success");
      setMessage(`Fetched ${data.length} awards successfully`);
    } catch (error) {
      setStatus("error");
      setMessage("Failed to fetch awards");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerAwards = async () => {
    try {
      const res = await fetch("/api/player-awards?limit=100");
      const data = await res.json();
      setPlayerAwards(data);
    } catch (error) {
      console.error("Failed to fetch player awards");
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

  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingAwardId) {
      setSQL(`UPDATE awards SET award_name = '${awardFormData.awardName}', award_category = '${awardFormData.awardCategory}' WHERE id = ${editingAwardId};`);
      try {
        const res = await fetch(`/api/awards?id=${editingAwardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(awardFormData),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Award updated successfully");
          await logSQL("UPDATE", "awards", sql, "success");
          fetchAwards();
          setAwardFormData({ awardName: "", awardCategory: "" });
          setEditingAwardId(null);
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to update award");
          await logSQL("UPDATE", "awards", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to update award");
      }
    } else {
      setSQL(`INSERT INTO awards (award_name, award_category) VALUES ('${awardFormData.awardName}', '${awardFormData.awardCategory}');`);
      try {
        const res = await fetch("/api/awards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(awardFormData),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Award created successfully");
          await logSQL("INSERT", "awards", sql, "success");
          fetchAwards();
          setAwardFormData({ awardName: "", awardCategory: "" });
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to create award");
          await logSQL("INSERT", "awards", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to create award");
      }
    }
    setLoading(false);
  };

  const handlePlayerAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      playerId: parseInt(playerAwardFormData.playerId),
      awardId: parseInt(playerAwardFormData.awardId),
      year: parseInt(playerAwardFormData.year),
    };

    if (editingPlayerAwardId) {
      setSQL(`UPDATE player_awards SET player_id = ${payload.playerId}, award_id = ${payload.awardId}, year = ${payload.year} WHERE id = ${editingPlayerAwardId};`);
      try {
        const res = await fetch(`/api/player-awards?id=${editingPlayerAwardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Player award updated successfully");
          await logSQL("UPDATE", "player_awards", sql, "success");
          fetchPlayerAwards();
          setPlayerAwardFormData({ playerId: "", awardId: "", year: new Date().getFullYear().toString() });
          setEditingPlayerAwardId(null);
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to update player award");
          await logSQL("UPDATE", "player_awards", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to update player award");
      }
    } else {
      setSQL(`INSERT INTO player_awards (player_id, award_id, year) VALUES (${payload.playerId}, ${payload.awardId}, ${payload.year});`);
      try {
        const res = await fetch("/api/player-awards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Player award created successfully");
          await logSQL("INSERT", "player_awards", sql, "success");
          fetchPlayerAwards();
          setPlayerAwardFormData({ playerId: "", awardId: "", year: new Date().getFullYear().toString() });
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to create player award");
          await logSQL("INSERT", "player_awards", sql, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to create player award");
      }
    }
    setLoading(false);
  };

  const handleDeleteAward = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    setLoading(true);
    setSQL(`DELETE FROM awards WHERE id = ${id};`);
    try {
      const res = await fetch(`/api/awards?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatus("success");
        setMessage("Award deleted successfully");
        await logSQL("DELETE", "awards", sql, "success");
        fetchAwards();
      } else {
        const error = await res.json();
        setStatus("error");
        setMessage(error.error || "Failed to delete award");
        await logSQL("DELETE", "awards", sql, "error", error.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to delete award");
    }
    setLoading(false);
  };

  const handleDeletePlayerAward = async (id: number) => {
    if (!confirm("Are you sure you want to delete this player award?")) return;
    
    setLoading(true);
    setSQL(`DELETE FROM player_awards WHERE id = ${id};`);
    try {
      const res = await fetch(`/api/player-awards?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatus("success");
        setMessage("Player award deleted successfully");
        await logSQL("DELETE", "player_awards", sql, "success");
        fetchPlayerAwards();
      } else {
        const error = await res.json();
        setStatus("error");
        setMessage(error.error || "Failed to delete player award");
        await logSQL("DELETE", "player_awards", sql, "error", error.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to delete player award");
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

  const getAwardName = (awardId: number) => {
    return awards.find(a => a.id === awardId)?.awardName || "Unknown";
  };

  const getPlayerName = (playerId: number) => {
    return players.find(p => p.id === playerId)?.name || "Unknown";
  };

  return (
    <Tabs defaultValue="awards" className="space-y-6">
      <TabsList>
        <TabsTrigger value="awards">Award Types</TabsTrigger>
        <TabsTrigger value="player-awards">Player Awards (4NF)</TabsTrigger>
      </TabsList>

      <TabsContent value="awards" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingAwardId ? "Edit Award Type" : "Create New Award Type"}</CardTitle>
            <CardDescription>Manage award types with SQL-backed operations</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAwardSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="awardName">Award Name *</Label>
                  <Input
                    id="awardName"
                    value={awardFormData.awardName}
                    onChange={(e) => setAwardFormData({ ...awardFormData, awardName: e.target.value })}
                    placeholder="Player of the Match"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="awardCategory">Category *</Label>
                  <Select value={awardFormData.awardCategory} onValueChange={(v) => setAwardFormData({ ...awardFormData, awardCategory: v })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {AWARD_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editingAwardId ? "Update Award" : "Create Award"}
                </Button>
                {editingAwardId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingAwardId(null);
                      setAwardFormData({ awardName: "", awardCategory: "" });
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
            <CardTitle>All Award Types</CardTitle>
            <CardDescription>{awards.length} award types in database</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Award Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awards.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell>{award.id}</TableCell>
                    <TableCell className="font-medium">{award.awardName}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                        {award.awardCategory}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setAwardFormData({ awardName: award.awardName, awardCategory: award.awardCategory });
                          setEditingAwardId(award.id);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteAward(award.id, award.awardName)}>
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
      </TabsContent>

      <TabsContent value="player-awards" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingPlayerAwardId ? "Edit Player Award" : "Assign Award to Player"}</CardTitle>
            <CardDescription>4NF normalization - separate player-award relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePlayerAwardSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="playerId">Player *</Label>
                  <Select value={playerAwardFormData.playerId} onValueChange={(v) => setPlayerAwardFormData({ ...playerAwardFormData, playerId: v })} required>
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
                  <Label htmlFor="awardId">Award *</Label>
                  <Select value={playerAwardFormData.awardId} onValueChange={(v) => setPlayerAwardFormData({ ...playerAwardFormData, awardId: v })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select award" />
                    </SelectTrigger>
                    <SelectContent>
                      {awards.map((award) => (
                        <SelectItem key={award.id} value={award.id.toString()}>
                          {award.awardName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={playerAwardFormData.year}
                    onChange={(e) => setPlayerAwardFormData({ ...playerAwardFormData, year: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                  {editingPlayerAwardId ? "Update" : "Assign Award"}
                </Button>
                {editingPlayerAwardId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingPlayerAwardId(null);
                      setPlayerAwardFormData({ playerId: "", awardId: "", year: new Date().getFullYear().toString() });
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
            <CardTitle>All Player Awards</CardTitle>
            <CardDescription>{playerAwards.length} player awards in database</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Award</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playerAwards.map((pa) => (
                  <TableRow key={pa.id}>
                    <TableCell>{pa.id}</TableCell>
                    <TableCell className="font-medium">{getPlayerName(pa.playerId)}</TableCell>
                    <TableCell>{getAwardName(pa.awardId)}</TableCell>
                    <TableCell>{pa.year}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setPlayerAwardFormData({ 
                            playerId: pa.playerId.toString(), 
                            awardId: pa.awardId.toString(), 
                            year: pa.year.toString() 
                          });
                          setEditingPlayerAwardId(pa.id);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePlayerAward(pa.id)}>
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
      </TabsContent>
    </Tabs>
  );
}
