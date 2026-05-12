"use client";

import { useEffect, useState } from "react";

type StationStatus = {
    station_id: string;
    num_bikes_available: number;
    num_docks_available: number;
    last_reported: number;
};

export default function BixiTable() {
    const [stations, setStations] = useState<StationStatus[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [snapshotCount, setSnapshotCount] = useState<number>(0);
    const [page, setPage] = useState(0);

    const pageSize = 20;

    async function fetchBixiData() {
        try {
            setLoading(true);

            const response = await fetch("/api/bixi", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Erreur inconnue");
                return;
            }

            const stationList = data?.data?.stations ?? [];
            setStations(stationList);
            setError(null);

            try {
                const countResponse = await fetch("/api/bixi/snapshot-count", {
                    cache: "no-store",
                });

                const countData = await countResponse.json();

                if (countResponse.ok) {
                    setSnapshotCount(countData.snapshotCount);
                }
            } catch (countError) {
                console.error("Erreur snapshot-count:", countError);
            }
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les données BIXI.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBixiData();

        const intervalId = setInterval(fetchBixiData, 2 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, []);

    const startIndex = page * pageSize;
    const visibleStations = stations.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.max(1, Math.ceil(stations.length / pageSize));

    if (loading) return <p>Chargement...</p>;
    if (error) return <p>Erreur : {error}</p>;

    return (
        <>
            <p className="mb-4">Stations chargées : {stations.length}</p>

            <p className="mb-4">
                Nombre de snapshots sauvegardés : {snapshotCount}
            </p>

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

            <table className="border-collapse border w-full">
                <thead>
                <tr>
                    <th className="border p-2">Station ID</th>
                    <th className="border p-2">Vélos</th>
                    <th className="border p-2">Bornes libres</th>
                    <th className="border p-2">Dernier rapport</th>
                </tr>
                </thead>

                <tbody>
                {visibleStations.map((station) => (
                    <tr key={station.station_id}>
                        <td className="border p-2">{station.station_id}</td>
                        <td className="border p-2">{station.num_bikes_available}</td>
                        <td className="border p-2">{station.num_docks_available}</td>
                        <td className="border p-2">
                            {new Date(station.last_reported * 1000).toLocaleString()}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </>
    );
}