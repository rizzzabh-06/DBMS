import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single team by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const team = await db
        .select()
        .from(teams)
        .where(eq(teams.id, parseInt(id)))
        .limit(1);

      if (team.length === 0) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      return NextResponse.json(team[0], { status: 200 });
    }

    // List all teams with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(teams);

    if (search) {
      query = query.where(
        or(
          like(teams.name, `%${search}%`),
          like(teams.country, `%${search}%`)
        )
      );
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
    const { name, country } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!country || typeof country !== 'string' || country.trim() === '') {
      return NextResponse.json(
        { error: 'Country is required and must be a non-empty string', code: 'MISSING_COUNTRY' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedCountry = country.trim();

    // Insert new team
    const newTeam = await db
      .insert(teams)
      .values({
        name: sanitizedName,
        country: sanitizedCountry,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newTeam[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A team with this name already exists', code: 'DUPLICATE_NAME' },
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const teamId = parseInt(id);

    // Check if team exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (existingTeam.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, country } = body;

    // Build update object with only provided fields
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

    if (country !== undefined) {
      if (typeof country !== 'string' || country.trim() === '') {
        return NextResponse.json(
          { error: 'Country must be a non-empty string', code: 'INVALID_COUNTRY' },
          { status: 400 }
        );
      }
      updates.country = country.trim();
    }

    // Check if there are any fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    // Update team
    const updatedTeam = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, teamId))
      .returning();

    return NextResponse.json(updatedTeam[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);

    // Handle unique constraint violation
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A team with this name already exists', code: 'DUPLICATE_NAME' },
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const teamId = parseInt(id);

    // Check if team exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (existingTeam.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Delete team
    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .returning();

    return NextResponse.json(
      {
        message: 'Team deleted successfully',
        team: deletedTeam[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);

    // Handle foreign key constraint violations
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        { 
          error: 'Cannot delete team: it is referenced by other records (players, matches, etc.)', 
          code: 'FOREIGN_KEY_CONSTRAINT' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}