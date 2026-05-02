import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/sync/status
 * Bulk upsert plant status logs from offline sync queue.
 * Body: { records: PlantStatusLog[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { records } = await request.json();
    if (!records?.length) return NextResponse.json({ success: true, count: 0 });

    const supabase = await createClient();
    const { error } = await supabase
      .from("plant_status_logs")
      .upsert(records, { onConflict: "id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, count: records.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
