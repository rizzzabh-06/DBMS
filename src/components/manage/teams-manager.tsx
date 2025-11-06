"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SQLDisplay } from "@/components/sql-display";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Team {
  id: number;
  name: string;
  country: string;
  createdAt: string;
}

export function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", country: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sql, setSQL] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "pending">();
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    setSQL("SELECT * FROM teams ORDER BY id;");
    try {
      const res = await fetch("/api/teams?limit=100");
      const data = await res.json();
      setTeams(data);
      setStatus("success");
      setMessage(`Fetched ${data.length} teams successfully`);
    } catch (error) {
      setStatus("error");
      setMessage("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      setSQL(`UPDATE teams SET name = '${formData.name}', country = '${formData.country}' WHERE id = ${editingId};`);
      try {
        const res = await fetch(`/api/teams?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Team updated successfully");
          await logSQL("UPDATE", "teams", `UPDATE teams SET name = '${formData.name}', country = '${formData.country}' WHERE id = ${editingId}`, "success");
          fetchTeams();
          setFormData({ name: "", country: "" });
          setEditingId(null);
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to update team");
          await logSQL("UPDATE", "teams", `UPDATE teams SET name = '${formData.name}', country = '${formData.country}' WHERE id = ${editingId}`, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to update team");
      }
    } else {
      setSQL(`INSERT INTO teams (name, country) VALUES ('${formData.name}', '${formData.country}');`);
      try {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setStatus("success");
          setMessage("Team created successfully");
          await logSQL("INSERT", "teams", `INSERT INTO teams (name, country) VALUES ('${formData.name}', '${formData.country}')`, "success");
          fetchTeams();
          setFormData({ name: "", country: "" });
        } else {
          const error = await res.json();
          setStatus("error");
          setMessage(error.error || "Failed to create team");
          await logSQL("INSERT", "teams", `INSERT INTO teams (name, country) VALUES ('${formData.name}', '${formData.country}')`, "error", error.error);
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to create team");
      }
    }
    setLoading(false);
  };

  const handleEdit = (team: Team) => {
    setFormData({ name: team.name, country: team.country });
    setEditingId(team.id);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    setLoading(true);
    setSQL(`DELETE FROM teams WHERE id = ${id};`);
    try {
      const res = await fetch(`/api/teams?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatus("success");
        setMessage("Team deleted successfully");
        await logSQL("DELETE", "teams", `DELETE FROM teams WHERE id = ${id}`, "success");
        fetchTeams();
      } else {
        const error = await res.json();
        setStatus("error");
        setMessage(error.error || "Failed to delete team");
        await logSQL("DELETE", "teams", `DELETE FROM teams WHERE id = ${id}`, "error", error.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to delete team");
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
          <CardTitle>{editingId ? "Edit Team" : "Create New Team"}</CardTitle>
          <CardDescription>Manage cricket teams with SQL-backed operations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="India"
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="India"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Update Team" : "Create Team"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: "", country: "" });
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
          <CardTitle>All Teams</CardTitle>
          <CardDescription>{teams.length} teams in database</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.id}</TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.country}</TableCell>
                  <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(team)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(team.id, team.name)}>
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
