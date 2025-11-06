import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  country: text('country').notNull(),
  createdAt: text('created_at').notNull(),
});

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  teamId: integer('team_id').references(() => teams.id),
  role: text('role').notNull(),
  createdAt: text('created_at').notNull(),
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  venue: text('venue').notNull(),
  matchDate: text('match_date').notNull(),
  matchType: text('match_type').notNull(),
  createdAt: text('created_at').notNull(),
});

export const matchTeams = sqliteTable('match_teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchId: integer('match_id').references(() => matches.id),
  teamId: integer('team_id').references(() => teams.id),
});

export const matchScores = sqliteTable('match_scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchTeamId: integer('match_team_id').references(() => matchTeams.id).unique(),
  runs: integer('runs').notNull(),
  wickets: integer('wickets').notNull(),
  overs: real('overs').notNull(),
});

export const performance = sqliteTable('performance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchId: integer('match_id').references(() => matches.id),
  playerId: integer('player_id').references(() => players.id),
  runsScored: integer('runs_scored').notNull().default(0),
  wicketsTaken: integer('wickets_taken').notNull().default(0),
});

export const awards = sqliteTable('awards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  awardName: text('award_name').notNull(),
  awardCategory: text('award_category').notNull(),
});

export const playerAwards = sqliteTable('player_awards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerId: integer('player_id').references(() => players.id),
  awardId: integer('award_id').references(() => awards.id),
  year: integer('year').notNull(),
});

export const matchResult = sqliteTable('match_result', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchId: integer('match_id').references(() => matches.id).unique(),
  winningTeamId: integer('winning_team_id').references(() => teams.id),
  resultSummary: text('result_summary'),
  createdAt: text('created_at').notNull(),
});

export const sqlLogs = sqliteTable('sql_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  operationType: text('operation_type'),
  tableName: text('table_name'),
  sqlStatement: text('sql_statement'),
  executedAt: text('executed_at').notNull(),
  status: text('status'),
  errorMessage: text('error_message'),
});


// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});