import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const partitionId = request.nextUrl.searchParams.get("partition_id");
  const supabase = await createClient();
  let query = supabase.from("lines").select("*").order("line_number");
  if (partitionId) query = query.eq("partition_id", partitionId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase.from("lines").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("lines").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
