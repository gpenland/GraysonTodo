import { NextRequest, NextResponse } from "next/server";
import { timedQuery } from "@/lib/db";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  image_url: string | null;
  created_at: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const fields: string[] = [];
  const values: unknown[] = [];

  if (typeof body?.completed === "boolean") {
    values.push(body.completed);
    fields.push(`completed = $${values.length}`);
  }
  if (typeof body?.text === "string" && body.text.trim().length > 0) {
    values.push(body.text);
    fields.push(`text = $${values.length}`);
  }

  if (fields.length === 0) {
    return NextResponse.json(
      { error: "no valid fields to update" },
      { status: 400 }
    );
  }

  values.push(id);
  const { rows, dbMs } = await timedQuery<Todo>(
    `update todos set ${fields.join(", ")} where id = $${values.length} returning *`,
    values
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ todo: rows[0], dbMs });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { rows, dbMs } = await timedQuery<Todo>(
    "delete from todos where id = $1 returning id",
    [id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, dbMs });
}
