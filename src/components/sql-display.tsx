"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code } from "lucide-react";

interface SQLDisplayProps {
  sql: string;
  status?: "success" | "error" | "pending";
  message?: string;
}

export function SQLDisplay({ sql, status, message }: SQLDisplayProps) {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Code className="h-4 w-4" />
          SQL Execution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-24 w-full rounded-md border bg-muted p-3">
          <code className="text-xs font-mono">{sql}</code>
        </ScrollArea>
        {status && (
          <div
            className={`text-sm font-medium ${
              status === "success"
                ? "text-green-600 dark:text-green-400"
                : status === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
