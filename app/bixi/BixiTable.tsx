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

    async function fetchBixiData() {
        try {
            setLoading(true);

            const response = await fetch("/api/bixi", {
                cache: "no-store",
            });

            const data = await response.json();

            console.log("Réponse API BIXI:", data);

            if (!response.ok) {
                setError(data.error ?? "Erreur inconnue");
                return;
            }

            const stationList = data?.data?.stations ?? [];

            console.log("Nombre de stations:", stationList.length);

            setStations(stationList);
            setError(null);
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

    if (loading) return <p>Chargement...</p>;
    if (error) return <p>Erreur : {error}</p>;

    return (
        <>
            <p className="mb-4">Stations chargées : {stations.length}</p>

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
                {stations.slice(0, 20).map((station) => (
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