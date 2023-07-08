import { NextRequest, NextResponse } from "next/server";
import { db, todoTable } from "@/lib/drizzle"
import { sql } from "@vercel/postgres"
import { todo } from "node:test";
import { eq, exists, notExists } from "drizzle-orm";


export async function GET(request: NextRequest) {
  try {
    await sql`CREATE TABLE IF NOT EXISTS Todos(id serial, task varchar(255));`

    const res = await db.select().from(todoTable);

    return NextResponse.json({ data: res })
  } catch (err) {
    console.log((err as { message: string }).message)
    return NextResponse.json({ message: "Somthing went wrong" })
  }
}

export async function POST(request: NextRequest) {
  const req = await request.json();
  try {
    if (req.task) {
      const res = await db.insert(todoTable).values({
        task: req.task,
      }).returning()

      console.log(res)


      return NextResponse.json({ message: "Data added successfully", data: res })
    } else {
      throw new Error("Task field is required")
    }
  } catch (error) {
    return NextResponse.json({ message: (error as { message: string }).message })
  }
}


export async function DELETE(request: NextRequest) {
  const req = await request.json();
  try {

    if (req.task) {
      const existQuery = db.select().from(todoTable).where(eq(todoTable.task, req.task));
      const exist = await db.select().from(todoTable).where(exists(existQuery));

      if ((await exist).length === 0) {
        throw new Error("Task does not exist");
      }
      else {
        const deletedTask = await db.delete(todoTable).where(
          eq(todoTable.task, req.task)
        );
        await sql`ALTER SEQUENCE todos_id_seq RESTART WITH 1;`

        console.log(deletedTask);

        return NextResponse.json({
          message: "Data deleted successfully",
          data: deletedTask,
        });
      }
    }
    else {
      throw new Error("Task field is required");
    }
  } catch (error) {
    return NextResponse.json({ message: (error as { message: string }).message });
  }
}

export async function PUT(request: NextRequest) {
  const req = await request.json();
  try {
    if (req.id) {
      const updateResult = await db.update(todoTable).set({ task: req.task }).where(eq(todoTable.id, req.id)).returning({ task: todoTable.task });
      return NextResponse.json({ updateResult });
    } else {
      throw new Error("Task field is required");
    }
  } catch (err) {
    return NextResponse.json({ message: (err as { message: string }).message });
  }
}

