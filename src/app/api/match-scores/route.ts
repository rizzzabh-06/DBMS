import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matchScores } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single match-score by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const matchScore = await db
        .select()
        .from(matchScores)
        .where(eq(matchScores.id, parseInt(id)))
        .limit(1);

      if (matchScore.length === 0) {
        return NextResponse.json(
          { error: 'Match-score not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(matchScore[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const matchTeamId = searchParams.get('matchTeamId');

    let query = db.select().from(matchScores);

    if (matchTeamId) {
      if (isNaN(parseInt(matchTeamId))) {
        return NextResponse.json(
          { error: 'Valid matchTeamId is required', code: 'INVALID_MATCH_TEAM_ID' },
          { status: 400 }
        );
      }
      query = query.where(eq(matchScores.matchTeamId, parseInt(matchTeamId)));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchTeamId, runs, wickets, overs } = body;

    // Validate required fields
    if (matchTeamId === undefined || matchTeamId === null) {
      return NextResponse.json(
        { error: 'matchTeamId is required', code: 'MISSING_MATCH_TEAM_ID' },
        { status: 400 }
      );
    }

    if (runs === undefined || runs === null) {
      return NextResponse.json(
        { error: 'runs is required', code: 'MISSING_RUNS' },
        { status: 400 }
      );
    }

    if (wickets === undefined || wickets === null) {
      return NextResponse.json(
        { error: 'wickets is required', code: 'MISSING_WICKETS' },
        { status: 400 }
      );
    }

    if (overs === undefined || overs === null) {
      return NextResponse.json(
        { error: 'overs is required', code: 'MISSING_OVERS' },
        { status: 400 }
      );
    }

    // Validate matchTeamId is valid integer
    if (!Number.isInteger(matchTeamId) || matchTeamId <= 0) {
      return NextResponse.json(
        { error: 'matchTeamId must be a valid positive integer', code: 'INVALID_MATCH_TEAM_ID' },
        { status: 400 }
      );
    }

    // Validate runs is non-negative integer
    if (!Number.isInteger(runs) || runs < 0) {
      return NextResponse.json(
        { error: 'runs must be a non-negative integer', code: 'INVALID_RUNS' },
        { status: 400 }
      );
    }

    // Validate wickets is non-negative integer
    if (!Number.isInteger(wickets) || wickets < 0) {
      return NextResponse.json(
        { error: 'wickets must be a non-negative integer', code: 'INVALID_WICKETS' },
        { status: 400 }
      );
    }

    // Validate overs is positive number
    if (typeof overs !== 'number' || overs <= 0) {
      return NextResponse.json(
        { error: 'overs must be a positive number', code: 'INVALID_OVERS' },
        { status: 400 }
      );
    }

    // Insert new match-score
    const newMatchScore = await db
      .insert(matchScores)
      .values({
        matchTeamId,
        runs,
        wickets,
        overs,
      })
      .returning();

    return NextResponse.json(newMatchScore[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A match-score for this match team already exists', code: 'DUPLICATE_MATCH_TEAM' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { matchTeamId, runs, wickets, overs } = body;

    // Check if match-score exists
    const existingMatchScore = await db
      .select()
      .from(matchScores)
      .where(eq(matchScores.id, parseInt(id)))
      .limit(1);

    if (existingMatchScore.length === 0) {
      return NextResponse.json(
        { error: 'Match-score not found' },
        { status: 404 }
      );
    }

    // Build update object with validation
    const updates: any = {};

    if (matchTeamId !== undefined) {
      if (!Number.isInteger(matchTeamId) || matchTeamId <= 0) {
        return NextResponse.json(
          { error: 'matchTeamId must be a valid positive integer', code: 'INVALID_MATCH_TEAM_ID' },
          { status: 400 }
        );
      }
      updates.matchTeamId = matchTeamId;
    }

    if (runs !== undefined) {
      if (!Number.isInteger(runs) || runs < 0) {
        return NextResponse.json(
          { error: 'runs must be a non-negative integer', code: 'INVALID_RUNS' },
          { status: 400 }
        );
      }
      updates.runs = runs;
    }

    if (wickets !== undefined) {
      if (!Number.isInteger(wickets) || wickets < 0) {
        return NextResponse.json(
          { error: 'wickets must be a non-negative integer', code: 'INVALID_WICKETS' },
          { status: 400 }
        );
      }
      updates.wickets = wickets;
    }

    if (overs !== undefined) {
      if (typeof overs !== 'number' || overs <= 0) {
        return NextResponse.json(
          { error: 'overs must be a positive number', code: 'INVALID_OVERS' },
          { status: 400 }
        );
      }
      updates.overs = overs;
    }

    // Update match-score
    const updatedMatchScore = await db
      .update(matchScores)
      .set(updates)
      .where(eq(matchScores.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMatchScore[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A match-score for this match team already exists', code: 'DUPLICATE_MATCH_TEAM' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if match-score exists
    const existingMatchScore = await db
      .select()
      .from(matchScores)
      .where(eq(matchScores.id, parseInt(id)))
      .limit(1);

    if (existingMatchScore.length === 0) {
      return NextResponse.json(
        { error: 'Match-score not found' },
        { status: 404 }
      );
    }

    // Delete match-score
    const deletedMatchScore = await db
      .delete(matchScores)
      .where(eq(matchScores.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Match-score deleted successfully',
        deletedMatchScore: deletedMatchScore[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}