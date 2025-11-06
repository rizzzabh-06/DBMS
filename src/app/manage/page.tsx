"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamsManager } from "@/components/manage/teams-manager";
import { PlayersManager } from "@/components/manage/players-manager";
import { MatchesManager } from "@/components/manage/matches-manager";
import { PerformanceManager } from "@/components/manage/performance-manager";
import { AwardsManager } from "@/components/manage/awards-manager";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function ManagePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=" + encodeURIComponent("/manage"));
    }
  }, [session, isPending, router]);

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
          <h1 className="text-4xl font-bold mb-2">Manage Cricket Data</h1>
          <p className="text-muted-foreground">
            Create, Read, Update, and Delete cricket data with SQL visualization
          </p>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="awards">Awards</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsManager />
          </TabsContent>

          <TabsContent value="players">
            <PlayersManager />
          </TabsContent>

          <TabsContent value="matches">
            <MatchesManager />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceManager />
          </TabsContent>

          <TabsContent value="awards">
            <AwardsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}