import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sqlLogs } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(sqlLogs)
        .where(eq(sqlLogs.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'SQL log not found' 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const operationType = searchParams.get('operationType');
    const tableName = searchParams.get('tableName');
    const status = searchParams.get('status');

    let query = db.select().from(sqlLogs);

    // Build WHERE conditions
    const conditions = [];

    if (search) {
      conditions.push(like(sqlLogs.sqlStatement, `%${search}%`));
    }

    if (operationType) {
      conditions.push(eq(sqlLogs.operationType, operationType));
    }

    if (tableName) {
      conditions.push(eq(sqlLogs.tableName, tableName));
    }

    if (status) {
      conditions.push(eq(sqlLogs.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering (most recent first)
    query = query.orderBy(desc(sqlLogs.executedAt));

    // Apply pagination
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

    // Extract and validate fields
    const operationType = body.operationType ? body.operationType.trim() : null;
    const tableName = body.tableName ? body.tableName.trim() : null;
    const sqlStatement = body.sqlStatement || null;
    const status = body.status ? body.status.trim() : null;
    const errorMessage = body.errorMessage || null;
    const executedAt = body.executedAt || new Date().toISOString();

    // Prepare insert data
    const insertData = {
      operationType,
      tableName,
      sqlStatement,
      executedAt,
      status,
      errorMessage,
    };

    // Insert with returning
    const newRecord = await db.insert(sqlLogs)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(sqlLogs)
      .where(eq(sqlLogs.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'SQL log not found' 
      }, { status: 404 });
    }

    // Delete with returning
    const deleted = await db.delete(sqlLogs)
      .where(eq(sqlLogs.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'SQL log deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}