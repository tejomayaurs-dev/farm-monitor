import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const lineId = request.nextUrl.searchParams.get("line_id");
  const supabase = await createClient();
  let query = supabase.from("plants_with_latest_status").select("*").order("position");
  if (lineId) query = query.eq("line_id", lineId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase.from("plants").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
