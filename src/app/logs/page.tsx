"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollText, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

interface SQLLog {
  id: number;
  operationType: string;
  tableName: string;
  sqlStatement: string;
  executedAt: string;
  status: string;
  errorMessage: string | null;
}

export default function LogsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<SQLLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=" + encodeURIComponent("/logs"));
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchLogs();
    }
  }, [session]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sql-logs?limit=50");
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return <Badge className="bg-green-500">Success</Badge>;
    } else if (status === "error") {
      return <Badge variant="destructive">Error</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getOperationBadge = (operation: string) => {
    const colors: Record<string, string> = {
      INSERT: "bg-blue-500",
      UPDATE: "bg-yellow-500",
      DELETE: "bg-red-500",
      SELECT: "bg-green-500",
      PROCEDURE: "bg-purple-500",
      FUNCTION: "bg-indigo-500",
      TRIGGER: "bg-pink-500",
    };
    
    return <Badge className={colors[operation] || "bg-gray-500"}>{operation}</Badge>;
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">SQL Execution Logs</h1>
            <p className="text-muted-foreground">
              Track all SQL operations executed in the system
            </p>
          </div>
          <Button onClick={fetchLogs} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ScrollText className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Recent SQL Operations</CardTitle>
                <CardDescription>Last {logs.length} operations (most recent first)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SQL Statement</TableHead>
                    <TableHead>Executed At</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell>{getOperationBadge(log.operationType)}</TableCell>
                      <TableCell className="font-medium">{log.tableName}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <ScrollArea className="h-20 w-96">
                          <code className="text-xs font-mono whitespace-pre-wrap">{log.sqlStatement}</code>
                        </ScrollArea>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(log.executedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-xs truncate">
                        {log.errorMessage || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}