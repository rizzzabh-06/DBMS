import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playerAwards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single player-award by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const playerAward = await db
        .select()
        .from(playerAwards)
        .where(eq(playerAwards.id, parseInt(id)))
        .limit(1);

      if (playerAward.length === 0) {
        return NextResponse.json(
          { error: 'Player-award not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(playerAward[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const playerId = searchParams.get('playerId');
    const awardId = searchParams.get('awardId');
    const year = searchParams.get('year');

    let query = db.select().from(playerAwards);

    // Build filter conditions
    const conditions = [];
    if (playerId) {
      if (isNaN(parseInt(playerId))) {
        return NextResponse.json(
          { error: 'Valid playerId is required', code: 'INVALID_PLAYER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(playerAwards.playerId, parseInt(playerId)));
    }
    if (awardId) {
      if (isNaN(parseInt(awardId))) {
        return NextResponse.json(
          { error: 'Valid awardId is required', code: 'INVALID_AWARD_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(playerAwards.awardId, parseInt(awardId)));
    }
    if (year) {
      if (isNaN(parseInt(year))) {
        return NextResponse.json(
          { error: 'Valid year is required', code: 'INVALID_YEAR' },
          { status: 400 }
        );
      }
      conditions.push(eq(playerAwards.year, parseInt(year)));
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
    const { playerId, awardId, year } = body;

    // Validate required fields
    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required', code: 'MISSING_PLAYER_ID' },
        { status: 400 }
      );
    }

    if (!awardId) {
      return NextResponse.json(
        { error: 'awardId is required', code: 'MISSING_AWARD_ID' },
        { status: 400 }
      );
    }

    if (!year) {
      return NextResponse.json(
        { error: 'year is required', code: 'MISSING_YEAR' },
        { status: 400 }
      );
    }

    // Validate integer types
    if (isNaN(parseInt(playerId))) {
      return NextResponse.json(
        { error: 'playerId must be a valid integer', code: 'INVALID_PLAYER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(awardId))) {
      return NextResponse.json(
        { error: 'awardId must be a valid integer', code: 'INVALID_AWARD_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(year))) {
      return NextResponse.json(
        { error: 'year must be a valid integer', code: 'INVALID_YEAR' },
        { status: 400 }
      );
    }

    // Validate year range
    const currentYear = new Date().getFullYear();
    const yearInt = parseInt(year);
    if (yearInt < 1900 || yearInt > currentYear + 1) {
      return NextResponse.json(
        {
          error: `year must be between 1900 and ${currentYear + 1}`,
          code: 'INVALID_YEAR_RANGE',
        },
        { status: 400 }
      );
    }

    // Create player-award
    const newPlayerAward = await db
      .insert(playerAwards)
      .values({
        playerId: parseInt(playerId),
        awardId: parseInt(awardId),
        year: yearInt,
      })
      .returning();

    return NextResponse.json(newPlayerAward[0], { status: 201 });
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
    const { playerId, awardId, year } = body;

    // Check if player-award exists
    const existing = await db
      .select()
      .from(playerAwards)
      .where(eq(playerAwards.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Player-award not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};

    if (playerId !== undefined) {
      if (isNaN(parseInt(playerId))) {
        return NextResponse.json(
          { error: 'playerId must be a valid integer', code: 'INVALID_PLAYER_ID' },
          { status: 400 }
        );
      }
      updates.playerId = parseInt(playerId);
    }

    if (awardId !== undefined) {
      if (isNaN(parseInt(awardId))) {
        return NextResponse.json(
          { error: 'awardId must be a valid integer', code: 'INVALID_AWARD_ID' },
          { status: 400 }
        );
      }
      updates.awardId = parseInt(awardId);
    }

    if (year !== undefined) {
      if (isNaN(parseInt(year))) {
        return NextResponse.json(
          { error: 'year must be a valid integer', code: 'INVALID_YEAR' },
          { status: 400 }
        );
      }

      const currentYear = new Date().getFullYear();
      const yearInt = parseInt(year);
      if (yearInt < 1900 || yearInt > currentYear + 1) {
        return NextResponse.json(
          {
            error: `year must be between 1900 and ${currentYear + 1}`,
            code: 'INVALID_YEAR_RANGE',
          },
          { status: 400 }
        );
      }
      updates.year = yearInt;
    }

    // Update player-award
    const updated = await db
      .update(playerAwards)
      .set(updates)
      .where(eq(playerAwards.id, parseInt(id)))
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

    // Check if player-award exists
    const existing = await db
      .select()
      .from(playerAwards)
      .where(eq(playerAwards.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Player-award not found' },
        { status: 404 }
      );
    }

    // Delete player-award
    const deleted = await db
      .delete(playerAwards)
      .where(eq(playerAwards.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Player-award deleted successfully',
        deletedRecord: deleted[0],
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