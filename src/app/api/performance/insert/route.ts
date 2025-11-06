import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performance, matches, players } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, playerId, runsScored, wicketsTaken } = body;

    // Validate required fields
    if (!matchId) {
      return NextResponse.json(
        { 
          error: 'Match ID is required',
          code: 'MISSING_MATCH_ID' 
        },
        { status: 400 }
      );
    }

    if (!playerId) {
      return NextResponse.json(
        { 
          error: 'Player ID is required',
          code: 'MISSING_PLAYER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate matchId is a valid integer
    const parsedMatchId = parseInt(matchId);
    if (isNaN(parsedMatchId)) {
      return NextResponse.json(
        { 
          error: 'Match ID must be a valid integer',
          code: 'INVALID_MATCH_ID' 
        },
        { status: 400 }
      );
    }

    // Validate playerId is a valid integer
    const parsedPlayerId = parseInt(playerId);
    if (isNaN(parsedPlayerId)) {
      return NextResponse.json(
        { 
          error: 'Player ID must be a valid integer',
          code: 'INVALID_PLAYER_ID' 
        },
        { status: 400 }
      );
    }

    // Set defaults for optional fields
    const parsedRunsScored = runsScored !== undefined ? parseInt(runsScored) : 0;
    const parsedWicketsTaken = wicketsTaken !== undefined ? parseInt(wicketsTaken) : 0;

    // Validate runsScored is non-negative integer
    if (isNaN(parsedRunsScored) || parsedRunsScored < 0) {
      return NextResponse.json(
        { 
          error: 'Runs scored must be a non-negative integer',
          code: 'INVALID_RUNS_SCORED' 
        },
        { status: 400 }
      );
    }

    // Validate wicketsTaken is non-negative integer
    if (isNaN(parsedWicketsTaken) || parsedWicketsTaken < 0) {
      return NextResponse.json(
        { 
          error: 'Wickets taken must be a non-negative integer',
          code: 'INVALID_WICKETS_TAKEN' 
        },
        { status: 400 }
      );
    }

    // Validate matchId exists in matches table
    const matchExists = await db.select()
      .from(matches)
      .where(eq(matches.id, parsedMatchId))
      .limit(1);

    if (matchExists.length === 0) {
      return NextResponse.json(
        { 
          error: 'Match not found',
          code: 'MATCH_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Validate playerId exists in players table
    const playerExists = await db.select()
      .from(players)
      .where(eq(players.id, parsedPlayerId))
      .limit(1);

    if (playerExists.length === 0) {
      return NextResponse.json(
        { 
          error: 'Player not found',
          code: 'PLAYER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Check for duplicate performance record
    const duplicateCheck = await db.select()
      .from(performance)
      .where(
        and(
          eq(performance.matchId, parsedMatchId),
          eq(performance.playerId, parsedPlayerId)
        )
      )
      .limit(1);

    if (duplicateCheck.length > 0) {
      return NextResponse.json(
        { 
          error: 'Performance record already exists for this match and player',
          code: 'DUPLICATE_PERFORMANCE' 
        },
        { status: 409 }
      );
    }

    // Insert performance record
    const newPerformance = await db.insert(performance)
      .values({
        matchId: parsedMatchId,
        playerId: parsedPlayerId,
        runsScored: parsedRunsScored,
        wicketsTaken: parsedWicketsTaken
      })
      .returning();

    return NextResponse.json(newPerformance[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}