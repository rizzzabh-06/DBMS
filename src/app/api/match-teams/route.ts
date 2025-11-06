import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matchTeams } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const matchId = searchParams.get('matchId');
    const teamId = searchParams.get('teamId');

    // Single match-team by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const matchTeam = await db.select()
        .from(matchTeams)
        .where(eq(matchTeams.id, parseInt(id)))
        .limit(1);

      if (matchTeam.length === 0) {
        return NextResponse.json({ 
          error: 'Match-team not found' 
        }, { status: 404 });
      }

      return NextResponse.json(matchTeam[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(matchTeams);

    // Build filter conditions
    const conditions = [];
    if (matchId) {
      if (isNaN(parseInt(matchId))) {
        return NextResponse.json({ 
          error: 'Valid matchId is required',
          code: 'INVALID_MATCH_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(matchTeams.matchId, parseInt(matchId)));
    }
    if (teamId) {
      if (isNaN(parseInt(teamId))) {
        return NextResponse.json({ 
          error: 'Valid teamId is required',
          code: 'INVALID_TEAM_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(matchTeams.teamId, parseInt(teamId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, teamId } = body;

    // Validate required fields
    if (!matchId) {
      return NextResponse.json({ 
        error: 'matchId is required',
        code: 'MISSING_MATCH_ID' 
      }, { status: 400 });
    }

    if (!teamId) {
      return NextResponse.json({ 
        error: 'teamId is required',
        code: 'MISSING_TEAM_ID' 
      }, { status: 400 });
    }

    // Validate field types
    if (isNaN(parseInt(matchId))) {
      return NextResponse.json({ 
        error: 'matchId must be a valid integer',
        code: 'INVALID_MATCH_ID' 
      }, { status: 400 });
    }

    if (isNaN(parseInt(teamId))) {
      return NextResponse.json({ 
        error: 'teamId must be a valid integer',
        code: 'INVALID_TEAM_ID' 
      }, { status: 400 });
    }

    // Insert new match-team
    const newMatchTeam = await db.insert(matchTeams)
      .values({
        matchId: parseInt(matchId),
        teamId: parseInt(teamId)
      })
      .returning();

    return NextResponse.json(newMatchTeam[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { matchId, teamId } = body;

    // Check if match-team exists
    const existingMatchTeam = await db.select()
      .from(matchTeams)
      .where(eq(matchTeams.id, parseInt(id)))
      .limit(1);

    if (existingMatchTeam.length === 0) {
      return NextResponse.json({ 
        error: 'Match-team not found' 
      }, { status: 404 });
    }

    // Build update object
    const updates: { matchId?: number; teamId?: number } = {};

    if (matchId !== undefined) {
      if (isNaN(parseInt(matchId))) {
        return NextResponse.json({ 
          error: 'matchId must be a valid integer',
          code: 'INVALID_MATCH_ID' 
        }, { status: 400 });
      }
      updates.matchId = parseInt(matchId);
    }

    if (teamId !== undefined) {
      if (isNaN(parseInt(teamId))) {
        return NextResponse.json({ 
          error: 'teamId must be a valid integer',
          code: 'INVALID_TEAM_ID' 
        }, { status: 400 });
      }
      updates.teamId = parseInt(teamId);
    }

    // Update match-team
    const updatedMatchTeam = await db.update(matchTeams)
      .set(updates)
      .where(eq(matchTeams.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMatchTeam[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if match-team exists
    const existingMatchTeam = await db.select()
      .from(matchTeams)
      .where(eq(matchTeams.id, parseInt(id)))
      .limit(1);

    if (existingMatchTeam.length === 0) {
      return NextResponse.json({ 
        error: 'Match-team not found' 
      }, { status: 404 });
    }

    // Delete match-team
    const deletedMatchTeam = await db.delete(matchTeams)
      .where(eq(matchTeams.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Match-team deleted successfully',
      matchTeam: deletedMatchTeam[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}