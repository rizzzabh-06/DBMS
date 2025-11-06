import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { awards } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';

const VALID_CATEGORIES = ['Performance', 'Season', 'Leadership', 'Conduct'] as const;

function isValidCategory(category: string): category is typeof VALID_CATEGORIES[number] {
  return VALID_CATEGORIES.includes(category as any);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single award by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const award = await db.select()
        .from(awards)
        .where(eq(awards.id, parseInt(id)))
        .limit(1);

      if (award.length === 0) {
        return NextResponse.json({ 
          error: 'Award not found' 
        }, { status: 404 });
      }

      return NextResponse.json(award[0], { status: 200 });
    }

    // List all awards with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let query = db.select().from(awards);

    const conditions = [];

    if (search) {
      conditions.push(like(awards.awardName, `%${search}%`));
    }

    if (category) {
      if (!isValidCategory(category)) {
        return NextResponse.json({ 
          error: `Invalid award category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: "INVALID_CATEGORY" 
        }, { status: 400 });
      }
      conditions.push(eq(awards.awardCategory, category));
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
    const { awardName, awardCategory } = body;

    // Validate required fields
    if (!awardName || typeof awardName !== 'string' || awardName.trim() === '') {
      return NextResponse.json({ 
        error: "Award name is required and must be a non-empty string",
        code: "MISSING_AWARD_NAME" 
      }, { status: 400 });
    }

    if (!awardCategory || typeof awardCategory !== 'string') {
      return NextResponse.json({ 
        error: "Award category is required",
        code: "MISSING_AWARD_CATEGORY" 
      }, { status: 400 });
    }

    // Validate award category
    if (!isValidCategory(awardCategory)) {
      return NextResponse.json({ 
        error: `Invalid award category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        code: "INVALID_CATEGORY" 
      }, { status: 400 });
    }

    // Create new award
    const newAward = await db.insert(awards)
      .values({
        awardName: awardName.trim(),
        awardCategory: awardCategory
      })
      .returning();

    return NextResponse.json(newAward[0], { status: 201 });
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

    // Check if award exists
    const existingAward = await db.select()
      .from(awards)
      .where(eq(awards.id, parseInt(id)))
      .limit(1);

    if (existingAward.length === 0) {
      return NextResponse.json({ 
        error: 'Award not found' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { awardName, awardCategory } = body;

    const updates: Partial<typeof awards.$inferInsert> = {};

    // Validate and add awardName if provided
    if (awardName !== undefined) {
      if (typeof awardName !== 'string' || awardName.trim() === '') {
        return NextResponse.json({ 
          error: "Award name must be a non-empty string",
          code: "INVALID_AWARD_NAME" 
        }, { status: 400 });
      }
      updates.awardName = awardName.trim();
    }

    // Validate and add awardCategory if provided
    if (awardCategory !== undefined) {
      if (!isValidCategory(awardCategory)) {
        return NextResponse.json({ 
          error: `Invalid award category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: "INVALID_CATEGORY" 
        }, { status: 400 });
      }
      updates.awardCategory = awardCategory;
    }

    // If no updates provided, return current record
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingAward[0], { status: 200 });
    }

    // Update award
    const updated = await db.update(awards)
      .set(updates)
      .where(eq(awards.id, parseInt(id)))
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

    // Check if award exists
    const existingAward = await db.select()
      .from(awards)
      .where(eq(awards.id, parseInt(id)))
      .limit(1);

    if (existingAward.length === 0) {
      return NextResponse.json({ 
        error: 'Award not found' 
      }, { status: 404 });
    }

    // Delete award
    const deleted = await db.delete(awards)
      .where(eq(awards.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Award deleted successfully',
      award: deleted[0]
    }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}