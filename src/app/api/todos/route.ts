import { NextRequest, NextResponse } from "next/server";
import { timedQuery } from "@/lib/db";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  image_url: string | null;
  created_at: string;
}

export async function GET() {
  const { rows, dbMs } = await timedQuery<Todo>(
    "select * from todos order by created_at desc"
  );
  return NextResponse.json({ todos: rows, dbMs });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = body?.text;
  const imageUrl = body?.image_url ?? null;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 }
    );
  }

  const { rows, dbMs } = await timedQuery<Todo>(
    "insert into todos (text, image_url) values ($1, $2) returning *",
    [text, imageUrl]
  );
  return NextResponse.json({ todo: rows[0], dbMs }, { status: 201 });
}
