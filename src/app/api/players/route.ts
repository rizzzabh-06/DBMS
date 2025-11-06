import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { players } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';

const VALID_ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single player by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const player = await db
        .select()
        .from(players)
        .where(eq(players.id, parseInt(id)))
        .limit(1);

      if (player.length === 0) {
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(player[0], { status: 200 });
    }

    // List players with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const teamId = searchParams.get('teamId');
    const role = searchParams.get('role');

    let query = db.select().from(players);

    const conditions = [];

    if (search) {
      conditions.push(like(players.name, `%${search}%`));
    }

    if (teamId) {
      if (isNaN(parseInt(teamId))) {
        return NextResponse.json(
          { error: 'Valid team ID is required', code: 'INVALID_TEAM_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(players.teamId, parseInt(teamId)));
    }

    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { 
            error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 
            code: 'INVALID_ROLE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(players.role, role));
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
    const { name, teamId, role } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!teamId || isNaN(parseInt(teamId))) {
      return NextResponse.json(
        { error: 'Valid team ID is required', code: 'MISSING_TEAM_ID' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { 
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 
          code: 'INVALID_ROLE' 
        },
        { status: 400 }
      );
    }

    // Create player
    const newPlayer = await db
      .insert(players)
      .values({
        name: name.trim(),
        teamId: parseInt(teamId),
        role,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newPlayer[0], { status: 201 });
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

    // Check if player exists
    const existingPlayer = await db
      .select()
      .from(players)
      .where(eq(players.id, parseInt(id)))
      .limit(1);

    if (existingPlayer.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, teamId, role } = body;

    const updates: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (teamId !== undefined) {
      if (isNaN(parseInt(teamId))) {
        return NextResponse.json(
          { error: 'Valid team ID is required', code: 'INVALID_TEAM_ID' },
          { status: 400 }
        );
      }
      updates.teamId = parseInt(teamId);
    }

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { 
            error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 
            code: 'INVALID_ROLE' 
          },
          { status: 400 }
        );
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingPlayer[0], { status: 200 });
    }

    const updatedPlayer = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedPlayer[0], { status: 200 });
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

    // Check if player exists
    const existingPlayer = await db
      .select()
      .from(players)
      .where(eq(players.id, parseInt(id)))
      .limit(1);

    if (existingPlayer.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(players)
      .where(eq(players.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Player deleted successfully',
        player: deleted[0],
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