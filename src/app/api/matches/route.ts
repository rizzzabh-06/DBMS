import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';

const VALID_MATCH_TYPES = ['ODI', 'Test', 'T20', 'T10'];

function validateMatchType(matchType: string): boolean {
  return VALID_MATCH_TYPES.includes(matchType);
}

function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const match = await db
        .select()
        .from(matches)
        .where(eq(matches.id, parseInt(id)))
        .limit(1);

      if (match.length === 0) {
        return NextResponse.json(
          { error: 'Match not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(match[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const matchType = searchParams.get('matchType');

    let query = db.select().from(matches);

    const conditions = [];

    if (search) {
      conditions.push(like(matches.venue, `%${search}%`));
    }

    if (matchType) {
      if (!validateMatchType(matchType)) {
        return NextResponse.json(
          { 
            error: `Invalid match type. Must be one of: ${VALID_MATCH_TYPES.join(', ')}`,
            code: 'INVALID_MATCH_TYPE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(matches.matchType, matchType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
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
    const { venue, matchDate, matchType } = body;

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue is required', code: 'MISSING_VENUE' },
        { status: 400 }
      );
    }

    if (!matchDate) {
      return NextResponse.json(
        { error: 'Match date is required', code: 'MISSING_MATCH_DATE' },
        { status: 400 }
      );
    }

    if (!matchType) {
      return NextResponse.json(
        { error: 'Match type is required', code: 'MISSING_MATCH_TYPE' },
        { status: 400 }
      );
    }

    const trimmedVenue = venue.trim();
    if (!trimmedVenue) {
      return NextResponse.json(
        { error: 'Venue cannot be empty', code: 'EMPTY_VENUE' },
        { status: 400 }
      );
    }

    if (!validateDateFormat(matchDate)) {
      return NextResponse.json(
        { 
          error: 'Match date must be in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT' 
        },
        { status: 400 }
      );
    }

    if (!validateMatchType(matchType)) {
      return NextResponse.json(
        { 
          error: `Invalid match type. Must be one of: ${VALID_MATCH_TYPES.join(', ')}`,
          code: 'INVALID_MATCH_TYPE' 
        },
        { status: 400 }
      );
    }

    const newMatch = await db
      .insert(matches)
      .values({
        venue: trimmedVenue,
        matchDate,
        matchType,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newMatch[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingMatch = await db
      .select()
      .from(matches)
      .where(eq(matches.id, parseInt(id)))
      .limit(1);

    if (existingMatch.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { venue, matchDate, matchType } = body;

    const updates: any = {};

    if (venue !== undefined) {
      const trimmedVenue = venue.trim();
      if (!trimmedVenue) {
        return NextResponse.json(
          { error: 'Venue cannot be empty', code: 'EMPTY_VENUE' },
          { status: 400 }
        );
      }
      updates.venue = trimmedVenue;
    }

    if (matchDate !== undefined) {
      if (!validateDateFormat(matchDate)) {
        return NextResponse.json(
          { 
            error: 'Match date must be in YYYY-MM-DD format',
            code: 'INVALID_DATE_FORMAT' 
          },
          { status: 400 }
        );
      }
      updates.matchDate = matchDate;
    }

    if (matchType !== undefined) {
      if (!validateMatchType(matchType)) {
        return NextResponse.json(
          { 
            error: `Invalid match type. Must be one of: ${VALID_MATCH_TYPES.join(', ')}`,
            code: 'INVALID_MATCH_TYPE' 
          },
          { status: 400 }
        );
      }
      updates.matchType = matchType;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingMatch[0], { status: 200 });
    }

    const updatedMatch = await db
      .update(matches)
      .set(updates)
      .where(eq(matches.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMatch[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingMatch = await db
      .select()
      .from(matches)
      .where(eq(matches.id, parseInt(id)))
      .limit(1);

    if (existingMatch.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    const deletedMatch = await db
      .delete(matches)
      .where(eq(matches.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Match deleted successfully',
        match: deletedMatch[0] 
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