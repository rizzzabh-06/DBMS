"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, CalendarDays, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    totalTeams: 0,
    totalPerformances: 0,
  });
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all counts
      const [playersRes, matchesRes, teamsRes, perfRes, perfSummaryRes, matchesDetailRes] = await Promise.all([
        fetch("/api/players?limit=1000"),
        fetch("/api/matches?limit=1000"),
        fetch("/api/teams?limit=100"),
        fetch("/api/performance?limit=1000"),
        fetch("/api/match-performance-summary?limit=100"),
        fetch("/api/matches?limit=10"),
      ]);

      const players = await playersRes.json();
      const matches = await matchesRes.json();
      const teams = await teamsRes.json();
      const performances = await perfRes.json();
      const perfSummary = await perfSummaryRes.json();
      const matchesDetail = await matchesDetailRes.json();

      setStats({
        totalPlayers: players.length,
        totalMatches: matches.length,
        totalTeams: teams.length,
        totalPerformances: performances.length,
      });

      // Calculate top scorers
      const playerStats = new Map();
      perfSummary.forEach((item: any) => {
        const key = item.playerName;
        if (!playerStats.has(key)) {
          playerStats.set(key, {
            playerName: key,
            teamName: item.teamName,
            totalRuns: 0,
            matches: 0,
          });
        }
        const player = playerStats.get(key);
        player.totalRuns += item.runsScored;
        player.matches += 1;
      });

      const topScorersData = Array.from(playerStats.values())
        .sort((a, b) => b.totalRuns - a.totalRuns)
        .slice(0, 5);

      setTopScorers(topScorersData);
      setRecentMatches(matchesDetail.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: "Total Players",
      value: stats.totalPlayers,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Total Teams",
      value: stats.totalTeams,
      icon: Trophy,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Total Matches",
      value: stats.totalMatches,
      icon: CalendarDays,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Performance Records",
      value: stats.totalPerformances,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cricket Management Dashboard</h1>
          <p className="text-muted-foreground">
            SQL-backed cricket data management with advanced database features
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? "..." : kpi.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Scorers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top 5 Run Scorers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Runs</TableHead>
                    <TableHead>Matches</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topScorers.map((player, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold">#{idx + 1}</TableCell>
                      <TableCell className="font-medium">{player.playerName}</TableCell>
                      <TableCell>{player.teamName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{player.totalRuns}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{player.matches}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Recent Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">{match.venue}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(match.matchDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary">{match.matchType}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Database Features */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Database Features Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Normalization (1NF→3NF)</p>
                  <p className="text-xs text-muted-foreground">All tables properly normalized</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">4NF (Awards)</p>
                  <p className="text-xs text-muted-foreground">player_awards junction table</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Stored Procedures</p>
                  <p className="text-xs text-muted-foreground">insert_performance with validation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <Trophy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium">Functions</p>
                  <p className="text-xs text-muted-foreground">get_total_runs aggregation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                  <Trophy className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="font-medium">Views</p>
                  <p className="text-xs text-muted-foreground">match_performance_summary</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium">Triggers</p>
                  <p className="text-xs text-muted-foreground">Auto-populate match_result</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}