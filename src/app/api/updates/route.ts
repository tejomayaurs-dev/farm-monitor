import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const partitionId = request.nextUrl.searchParams.get("partitionId");
    const lineId = request.nextUrl.searchParams.get("lineId");

    const supabase = await createClient();

    let targetLineIds: string[] | null = null;

    if (lineId) {
      targetLineIds = [lineId];
    } else if (partitionId) {
      const { data: lines, error: linesErr } = await supabase
        .from("lines")
        .select("id")
        .eq("partition_id", partitionId);
      
      if (linesErr) throw new Error("Lines error: " + linesErr.message);
      targetLineIds = lines ? lines.map((l) => l.id) : [];
    }

    if (targetLineIds && targetLineIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    let statusQuery = supabase
      .from("plant_status_logs")
      .select(`
        id, plant_id, status, notes, timestamp, recorded_by, created_at,
        plants!inner(
          id, plant_name, position, line_id,
          lines!inner(
            id, line_number, label, partition_id,
            partitions!inner(id, name)
          )
        )
      `)
      .order("timestamp", { ascending: false })
      .limit(50);

    let activityQuery = supabase
      .from("plant_activities")
      .select(`
        id, plant_id, activity_type, notes, timestamp, recorded_by, created_at,
        plants!inner(
          id, plant_name, position, line_id,
          lines!inner(
            id, line_number, label, partition_id,
            partitions!inner(id, name)
          )
        )
      `)
      .order("timestamp", { ascending: false })
      .limit(50);

    if (targetLineIds && targetLineIds.length > 0) {
      statusQuery = statusQuery.in("plants.line_id", targetLineIds);
      activityQuery = activityQuery.in("plants.line_id", targetLineIds);
    }

    const [statusRes, activityRes] = await Promise.all([statusQuery, activityQuery]);

    if (statusRes.error) throw new Error("Status Query Error: " + statusRes.error.message);
    if (activityRes.error) throw new Error("Activity Query Error: " + activityRes.error.message);

    const merged = [
      ...(statusRes.data || []).map((s) => ({ ...s, _type: "status" as const })),
      ...(activityRes.data || []).map((a) => ({ ...a, _type: "activity" as const })),
    ];

    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ data: merged.slice(0, 50) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
