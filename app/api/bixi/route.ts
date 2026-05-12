import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch(
            "https://gbfs.velobixi.com/gbfs/en/station_status.json",
            { cache: "no-store" }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Erreur BIXI: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: "Impossible de joindre l'API BIXI" },
            { status: 500 }
        );
    }
}