"use client";

const COLORS = [
    "#2563eb", // bleu
    "#dc2626", // rouge
    "#16a34a", // vert
    "#9333ea", // mauve
    "#ea580c", // orange
    "#0891b2", // cyan
    "#be123c", // rose/rouge
    "#4f46e5", // indigo
    "#65a30d", // lime
    "#ca8a04", // jaune foncé
    "#0f766e", // teal
    "#7c2d12", // brun
    "#6d28d9", // violet
    "#db2777", // pink
    "#475569", // gris bleuté
    "#15803d", // vert foncé
    "#b91c1c", // rouge foncé
    "#0369a1", // bleu foncé
    "#a16207", // ambre
    "#52525b", // zinc
];

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type HourlyAverageRow = {
    station_id: string;
    hour: string;
    avg_bikes: string;
};

type ChartRow = {
    hour: string;
    [stationId: string]: string | number;
};

export default function HourlyAverageChart() {
    const [allRows, setAllRows] = useState<HourlyAverageRow[]>([]);
    const [chartData, setChartData] = useState<ChartRow[]>([]);
    const [stationIds, setStationIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [snapshotCount, setSnapshotCount] = useState<number>(0);

    const pageSize = 20;

    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch("/api/bixi/hourly-average", {
                    cache: "no-store",
                });

                const data: HourlyAverageRow[] | { error: string } =
                    await response.json();

                const countResponse = await fetch("/api/bixi/snapshot-count", {
                    cache: "no-store",
                });

                const countData = await countResponse.json();

                if (countResponse.ok) {
                    setSnapshotCount(countData.snapshotCount);
                }

                if (!response.ok) {
                    setError((data as { error: string }).error);
                    return;
                }

                setAllRows(data as HourlyAverageRow[]);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger les moyennes horaires.");
            }
        }

        loadData();
    }, []);

    useEffect(() => {
        const allStationIds = Array.from(
            new Set(allRows.map((row) => row.station_id))
        );

        const startIndex = page * pageSize;
        const visibleStationIds = allStationIds.slice(
            startIndex,
            startIndex + pageSize
        );

        const filteredRows = allRows.filter((row) =>
            visibleStationIds.includes(row.station_id)
        );

        const groupedByHour: Record<string, ChartRow> = {};

        for (const row of filteredRows) {
            const hourLabel = new Date(row.hour).toLocaleString([], {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });

            if (!groupedByHour[hourLabel]) {
                groupedByHour[hourLabel] = { hour: hourLabel };
            }

            groupedByHour[hourLabel][row.station_id] = Number(row.avg_bikes);
        }

        setStationIds(visibleStationIds);
        setChartData(Object.values(groupedByHour));
    }, [allRows, page]);

    const totalStations = Array.from(
        new Set(allRows.map((row) => row.station_id))
    ).length;

    const totalPages = Math.max(1, Math.ceil(totalStations / pageSize));

    if (error) {
        return <p>Erreur : {error}</p>;
    }

    if (allRows.length === 0) {
        return <p>Chargement du graphique...</p>;
    }

    return (
        <>
            <p className="mb-4">
                Nombre de snapshots sauvegardés : {snapshotCount}
            </p>

            <p className="mb-4">Stations dans le graphique : {stationIds.length}</p>

            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    disabled={page === 0}
                    className="border px-4 py-2 rounded disabled:opacity-50"
                >
                    20 précédentes
                </button>

                <span>
          Page {page + 1} / {totalPages}
        </span>

                <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                    disabled={page >= totalPages - 1}
                    className="border px-4 py-2 rounded disabled:opacity-50"
                >
                    20 suivantes
                </button>
            </div>

            <div className="h-[600px] w-full border rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />

                        {stationIds.map((stationId, index) => (

                            <Line
                                key={stationId}
                                type="monotone"
                                dataKey={stationId}
                                dot={false}
                                strokeWidth={2}
                                stroke={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </>
    );
}