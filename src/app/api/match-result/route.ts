import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matchResult } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const result = await db
        .select()
        .from(matchResult)
        .where(eq(matchResult.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Match-result not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const matchId = searchParams.get('matchId');
    const winningTeamId = searchParams.get('winningTeamId');

    let query = db.select().from(matchResult);

    const conditions = [];

    if (matchId) {
      if (isNaN(parseInt(matchId))) {
        return NextResponse.json(
          { error: 'Valid matchId is required', code: 'INVALID_MATCH_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(matchResult.matchId, parseInt(matchId)));
    }

    if (winningTeamId) {
      if (isNaN(parseInt(winningTeamId))) {
        return NextResponse.json(
          { error: 'Valid winningTeamId is required', code: 'INVALID_WINNING_TEAM_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(matchResult.winningTeamId, parseInt(winningTeamId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, winningTeamId, resultSummary } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required', code: 'MISSING_MATCH_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(matchId))) {
      return NextResponse.json(
        { error: 'matchId must be a valid integer', code: 'INVALID_MATCH_ID' },
        { status: 400 }
      );
    }

    if (winningTeamId !== undefined && winningTeamId !== null && isNaN(parseInt(winningTeamId))) {
      return NextResponse.json(
        { error: 'winningTeamId must be a valid integer', code: 'INVALID_WINNING_TEAM_ID' },
        { status: 400 }
      );
    }

    const existingResult = await db
      .select()
      .from(matchResult)
      .where(eq(matchResult.matchId, parseInt(matchId)))
      .limit(1);

    if (existingResult.length > 0) {
      return NextResponse.json(
        { error: 'Match result already exists for this matchId', code: 'DUPLICATE_MATCH_ID' },
        { status: 400 }
      );
    }

    const insertData: any = {
      matchId: parseInt(matchId),
      createdAt: new Date().toISOString(),
    };

    if (winningTeamId !== undefined && winningTeamId !== null) {
      insertData.winningTeamId = parseInt(winningTeamId);
    }

    if (resultSummary !== undefined && resultSummary !== null) {
      insertData.resultSummary = resultSummary.trim();
    }

    const newResult = await db
      .insert(matchResult)
      .values(insertData)
      .returning();

    return NextResponse.json(newResult[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { matchId, winningTeamId, resultSummary } = body;

    const existing = await db
      .select()
      .from(matchResult)
      .where(eq(matchResult.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Match-result not found' },
        { status: 404 }
      );
    }

    const updates: any = {};

    if (matchId !== undefined) {
      if (isNaN(parseInt(matchId))) {
        return NextResponse.json(
          { error: 'matchId must be a valid integer', code: 'INVALID_MATCH_ID' },
          { status: 400 }
        );
      }

      if (parseInt(matchId) !== existing[0].matchId) {
        const existingResult = await db
          .select()
          .from(matchResult)
          .where(eq(matchResult.matchId, parseInt(matchId)))
          .limit(1);

        if (existingResult.length > 0) {
          return NextResponse.json(
            { error: 'Match result already exists for this matchId', code: 'DUPLICATE_MATCH_ID' },
            { status: 400 }
          );
        }
      }

      updates.matchId = parseInt(matchId);
    }

    if (winningTeamId !== undefined) {
      if (winningTeamId === null) {
        updates.winningTeamId = null;
      } else if (isNaN(parseInt(winningTeamId))) {
        return NextResponse.json(
          { error: 'winningTeamId must be a valid integer', code: 'INVALID_WINNING_TEAM_ID' },
          { status: 400 }
        );
      } else {
        updates.winningTeamId = parseInt(winningTeamId);
      }
    }

    if (resultSummary !== undefined) {
      updates.resultSummary = resultSummary === null ? null : resultSummary.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existing[0], { status: 200 });
    }

    const updated = await db
      .update(matchResult)
      .set(updates)
      .where(eq(matchResult.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(matchResult)
      .where(eq(matchResult.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Match-result not found' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(matchResult)
      .where(eq(matchResult.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Match-result deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}