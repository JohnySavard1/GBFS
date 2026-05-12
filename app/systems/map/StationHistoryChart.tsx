"use client";

import { useEffect, useState } from "react";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type HistoryRow = {
    recorded_at: string;
    bikes_available: number;
    docks_available: number;
};

type Props = {
    systemId: string;
    stationId: string;
};

export default function StationHistoryChart({
                                                systemId,
                                                stationId,
                                            }: Props) {
    const [history, setHistory] = useState<HistoryRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            try {
                setLoading(true);

                const response = await fetch(
                    `/api/systems/${systemId}/stations/${stationId}/history`,
                    {
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                setHistory(data.history ?? []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, [systemId, stationId]);

    if (loading) {
        return <p className="mt-2">Chargement historique...</p>;
    }

    if (history.length === 0) {
        return <p className="mt-2">Aucun historique.</p>;
    }

    const chartData = history.map((row) => ({
        time: new Date(row.recorded_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        }),
        bikes_available: row.bikes_available,
        docks_available: row.docks_available,
    }));

    return (
        <div className="mt-4 h-[200px] w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="bikes_available"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                    />

                    <Line
                        type="monotone"
                        dataKey="docks_available"
                        stroke="#b91c1c"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}