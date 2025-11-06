import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performance, players } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    // Validate playerId is provided
    if (!playerId) {
      return NextResponse.json(
        { 
          error: 'Player ID is required',
          code: 'MISSING_PLAYER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate playerId is valid integer
    const playerIdInt = parseInt(playerId);
    if (isNaN(playerIdInt)) {
      return NextResponse.json(
        { 
          error: 'Valid player ID is required',
          code: 'INVALID_PLAYER_ID' 
        },
        { status: 400 }
      );
    }

    // Check if player exists
    const player = await db.select()
      .from(players)
      .where(eq(players.id, playerIdInt))
      .limit(1);

    if (player.length === 0) {
      return NextResponse.json(
        { 
          error: 'Player not found',
          code: 'PLAYER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Calculate total runs for the player
    const result = await db.select({
      playerId: players.id,
      playerName: players.name,
      totalRuns: sql<number>`COALESCE(SUM(${performance.runsScored}), 0)`.as('total_runs')
    })
      .from(players)
      .leftJoin(performance, eq(players.id, performance.playerId))
      .where(eq(players.id, playerIdInt))
      .groupBy(players.id, players.name);

    if (result.length === 0) {
      return NextResponse.json(
        { 
          error: 'Player not found',
          code: 'PLAYER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      playerId: result[0].playerId,
      totalRuns: result[0].totalRuns,
      playerName: result[0].playerName
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}