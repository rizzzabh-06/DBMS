import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performance } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single performance by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const result = await db.select()
        .from(performance)
        .where(eq(performance.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const matchId = searchParams.get('matchId');
    const playerId = searchParams.get('playerId');

    let query = db.select().from(performance);

    // Apply filters
    const conditions = [];
    
    if (matchId) {
      if (isNaN(parseInt(matchId))) {
        return NextResponse.json({ 
          error: "Valid matchId is required",
          code: "INVALID_MATCH_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(performance.matchId, parseInt(matchId)));
    }

    if (playerId) {
      if (isNaN(parseInt(playerId))) {
        return NextResponse.json({ 
          error: "Valid playerId is required",
          code: "INVALID_PLAYER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(performance.playerId, parseInt(playerId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, playerId, runsScored, wicketsTaken } = body;

    // Validate required fields
    if (!matchId) {
      return NextResponse.json({ 
        error: "matchId is required",
        code: "MISSING_MATCH_ID" 
      }, { status: 400 });
    }

    if (!playerId) {
      return NextResponse.json({ 
        error: "playerId is required",
        code: "MISSING_PLAYER_ID" 
      }, { status: 400 });
    }

    // Validate matchId is valid integer
    if (isNaN(parseInt(matchId))) {
      return NextResponse.json({ 
        error: "matchId must be a valid integer",
        code: "INVALID_MATCH_ID" 
      }, { status: 400 });
    }

    // Validate playerId is valid integer
    if (isNaN(parseInt(playerId))) {
      return NextResponse.json({ 
        error: "playerId must be a valid integer",
        code: "INVALID_PLAYER_ID" 
      }, { status: 400 });
    }

    // Set defaults and validate numeric constraints
    const finalRunsScored = runsScored !== undefined ? parseInt(runsScored) : 0;
    const finalWicketsTaken = wicketsTaken !== undefined ? parseInt(wicketsTaken) : 0;

    // Validate runsScored is non-negative
    if (isNaN(finalRunsScored) || finalRunsScored < 0) {
      return NextResponse.json({ 
        error: "runsScored must be a non-negative integer",
        code: "INVALID_RUNS_SCORED" 
      }, { status: 400 });
    }

    // Validate wicketsTaken is non-negative
    if (isNaN(finalWicketsTaken) || finalWicketsTaken < 0) {
      return NextResponse.json({ 
        error: "wicketsTaken must be a non-negative integer",
        code: "INVALID_WICKETS_TAKEN" 
      }, { status: 400 });
    }

    const newPerformance = await db.insert(performance)
      .values({
        matchId: parseInt(matchId),
        playerId: parseInt(playerId),
        runsScored: finalRunsScored,
        wicketsTaken: finalWicketsTaken
      })
      .returning();

    return NextResponse.json(newPerformance[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if performance exists
    const existing = await db.select()
      .from(performance)
      .where(eq(performance.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
    }

    const body = await request.json();
    const { matchId, playerId, runsScored, wicketsTaken } = body;

    const updates: any = {};

    // Validate and add matchId if provided
    if (matchId !== undefined) {
      if (isNaN(parseInt(matchId))) {
        return NextResponse.json({ 
          error: "matchId must be a valid integer",
          code: "INVALID_MATCH_ID" 
        }, { status: 400 });
      }
      updates.matchId = parseInt(matchId);
    }

    // Validate and add playerId if provided
    if (playerId !== undefined) {
      if (isNaN(parseInt(playerId))) {
        return NextResponse.json({ 
          error: "playerId must be a valid integer",
          code: "INVALID_PLAYER_ID" 
        }, { status: 400 });
      }
      updates.playerId = parseInt(playerId);
    }

    // Validate and add runsScored if provided
    if (runsScored !== undefined) {
      const parsedRunsScored = parseInt(runsScored);
      if (isNaN(parsedRunsScored) || parsedRunsScored < 0) {
        return NextResponse.json({ 
          error: "runsScored must be a non-negative integer",
          code: "INVALID_RUNS_SCORED" 
        }, { status: 400 });
      }
      updates.runsScored = parsedRunsScored;
    }

    // Validate and add wicketsTaken if provided
    if (wicketsTaken !== undefined) {
      const parsedWicketsTaken = parseInt(wicketsTaken);
      if (isNaN(parsedWicketsTaken) || parsedWicketsTaken < 0) {
        return NextResponse.json({ 
          error: "wicketsTaken must be a non-negative integer",
          code: "INVALID_WICKETS_TAKEN" 
        }, { status: 400 });
      }
      updates.wicketsTaken = parsedWicketsTaken;
    }

    const updated = await db.update(performance)
      .set(updates)
      .where(eq(performance.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if performance exists
    const existing = await db.select()
      .from(performance)
      .where(eq(performance.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
    }

    const deleted = await db.delete(performance)
      .where(eq(performance.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Performance deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}