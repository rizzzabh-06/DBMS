import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performance, matches, players, teams } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate pagination parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const matchIdParam = searchParams.get('matchId');
    const playerIdParam = searchParams.get('playerId');
    
    // Validate limit
    let limit = 20; // default
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json({ 
          error: 'Invalid limit parameter. Must be a positive integer.',
          code: 'INVALID_LIMIT' 
        }, { status: 400 });
      }
      limit = Math.min(parsedLimit, 100); // max 100
    }
    
    // Validate offset
    let offset = 0; // default
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json({ 
          error: 'Invalid offset parameter. Must be a non-negative integer.',
          code: 'INVALID_OFFSET' 
        }, { status: 400 });
      }
      offset = parsedOffset;
    }
    
    // Validate matchId if provided
    let matchId: number | null = null;
    if (matchIdParam) {
      const parsedMatchId = parseInt(matchIdParam);
      if (isNaN(parsedMatchId) || parsedMatchId < 1) {
        return NextResponse.json({ 
          error: 'Invalid matchId parameter. Must be a positive integer.',
          code: 'INVALID_MATCH_ID' 
        }, { status: 400 });
      }
      matchId = parsedMatchId;
    }
    
    // Validate playerId if provided
    let playerId: number | null = null;
    if (playerIdParam) {
      const parsedPlayerId = parseInt(playerIdParam);
      if (isNaN(parsedPlayerId) || parsedPlayerId < 1) {
        return NextResponse.json({ 
          error: 'Invalid playerId parameter. Must be a positive integer.',
          code: 'INVALID_PLAYER_ID' 
        }, { status: 400 });
      }
      playerId = parsedPlayerId;
    }
    
    // Build query with joins
    let query = db
      .select({
        matchId: matches.id,
        matchDate: matches.matchDate,
        venue: matches.venue,
        playerName: players.name,
        teamName: teams.name,
        runsScored: performance.runsScored,
        wicketsTaken: performance.wicketsTaken,
      })
      .from(performance)
      .innerJoin(matches, eq(performance.matchId, matches.id))
      .innerJoin(players, eq(performance.playerId, players.id))
      .innerJoin(teams, eq(players.teamId, teams.id));
    
    // Apply filters
    const filters = [];
    if (matchId !== null) {
      filters.push(eq(performance.matchId, matchId));
    }
    if (playerId !== null) {
      filters.push(eq(performance.playerId, playerId));
    }
    
    if (filters.length > 0) {
      query = query.where(and(...filters));
    }
    
    // Apply ordering and pagination
    const results = await query
      .orderBy(desc(matches.matchDate), desc(performance.runsScored))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}