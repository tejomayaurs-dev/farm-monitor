import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/partitions — list all */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("partitions").select("*").order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST /api/partitions — create */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data, error } = await supabase.from("partitions").insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE /api/partitions?id=xxx */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("partitions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
