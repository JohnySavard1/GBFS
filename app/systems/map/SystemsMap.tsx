"use client";

import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import StationHistoryChart from "./StationHistoryChart";
import { useAtom } from "jotai";
import { selectedSystemIdAtom } from "@/lib/atoms";


type Station = {
    station_id: string;
    station_name: string | null;
    lat: number;
    lon: number;
    bikes_available: number;
    docks_available: number;
    recorded_at: string;
    capacity: number | null;
    bikes_disabled: number;
    docks_disabled: number;
};

const SYSTEMS = [
    { id: "montreal-bixi", name: "Montréal - BIXI", center: [45.5017, -73.5673] },
    { id: "quebec-avelo", name: "Québec - àVélo", center: [46.8139, -71.208] },
    { id: "toronto-bike-share", name: "Toronto - Bike Share", center: [43.6532, -79.3832] },
    { id: "vancouver-mobi", name: "Vancouver - Mobi", center: [49.2827, -123.1207] },
    { id: "new-york-citibike", name: "New York - Citi Bike", center: [40.7128, -74.006] },
    { id: "mexico-city-ecobici", name: "Mexico City - Ecobici", center: [19.4326, -99.1332] },
    { id: "paris-velib", name: "Paris - Vélib", center: [48.8566, 2.3522] },
    { id: "brighton-beryl", name: "Brighton - Beryl", center: [50.8225, -0.1372] },
] as const;

function getColor(bikes: number) {
    if (bikes === 0) return "red";
    if (bikes <= 3) return "orange";
    return "green";
}

function ChangeMapView({ center, zoom, }: {
    center: [number, number];
    zoom: number;
}) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function SystemsMap() {
    const [systemId, setSystemId] = useAtom(selectedSystemIdAtom);
    const [stations, setStations] = useState<Station[]>([]);
    const [error, setError] = useState<string | null>(null);

    const selectedSystem = SYSTEMS.find((s) => s.id === systemId)!;

    useEffect(() => {
        async function loadStations() {
            try {
                const response = await fetch(`/api/systems/${systemId}/latest-stations`, {
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error ?? "Erreur inconnue");
                    return;
                }

                setStations(data.stations);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger les stations.");
            }
        }

        loadStations();
    }, [systemId]);

    return (
        <>
            <div className="mb-4">
                <label className="mr-2 font-semibold">Système :</label>

                <select
                    value={systemId}
                    onChange={(e) => setSystemId(e.target.value)}
                    className="border rounded px-3 py-2"
                >
                    {SYSTEMS.map((system) => (
                        <option key={system.id} value={system.id}>
                            {system.name}
                        </option>
                    ))}
                </select>
            </div>

            {error && <p className="mb-4 text-red-600">Erreur : {error}</p>}

            <p className="mb-4">Stations affichées : {stations.length}</p>

            <div className="h-[700px] w-full rounded-xl overflow-hidden border">
                <MapContainer
                    center={selectedSystem.center as [number, number]}
                    zoom={12}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ChangeMapView
                        center={selectedSystem.center as [number, number]}
                        zoom={12}
                    />

                    {stations.map((station) => (
                        <CircleMarker
                            key={station.station_id}
                            center={[station.lat, station.lon]}
                            radius={6}
                            pathOptions={{
                                color: getColor(station.bikes_available),
                                fillColor: getColor(station.bikes_available),
                                fillOpacity: 0.7,
                            }}
                        >
                            <Popup>
                                <div className="min-w-[220px]">
                                    <h2 className="font-bold text-base mb-2">
                                        {station.station_name ?? station.station_id}
                                    </h2>
                                    <p>
                                        <strong>Station ID :</strong> {station.station_id}
                                    </p>
                                    <p>
                                        <strong>Capacité :</strong> {station.capacity ?? "N/D"}
                                    </p>
                                    <p>
                                        <strong>Vélos disponibles :</strong> {station.bikes_available}
                                    </p>
                                    <p>
                                        <strong>Vélos désactivés :</strong> {station.bikes_disabled}
                                    </p>
                                    <p>
                                        <strong>Bornes libres :</strong> {station.docks_available}
                                    </p>
                                    <p>
                                        <strong>Bornes désactivées :</strong> {station.docks_disabled}
                                    </p>
                                    <p>
                                        <strong>Dernier snapshot :</strong>{" "}
                                        {new Date(station.recorded_at).toLocaleString()}
                                    </p>
                                    <p className="mt-2 text-sm opacity-70">
                                        Lat: {station.lat.toFixed(5)}, Lon: {station.lon.toFixed(5)}
                                    </p>
                                </div>
                                <StationHistoryChart
                                    systemId={systemId}
                                    stationId={station.station_id}
                                />
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>
        </>
    );
}