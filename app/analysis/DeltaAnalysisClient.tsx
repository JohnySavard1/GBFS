"use client";

import { useEffect, useState } from "react";

type Row = {
    station: string;
    hour: string;
    bikes_at_hour: string;
    stands_at_hour: string;
    observed_delta_bikes: string;
    expected_delta_from_trips: string;
    unexplained_delta: string;
    departures: string;
    arrivals: string;
    classification: string;
};

export default function DeltaAnalysisClient() {
    const [rows, setRows] = useState<Row[]>([]);
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const pageSize = 500;


    useEffect(() => {
        async function loadCsv() {
            const response = await fetch("/reports/delta_reconciliation.csv");
            const text = await response.text();

            const lines = text.trim().split("\n");
            const headers = lines[0].split(",");

            const data = lines.slice(1).map((line) => {
                const values = line.split(",");
                return Object.fromEntries(headers.map((h, i) => [h, values[i]])) as Row;
            });

            setRows(data);
        }

        loadCsv();
    }, []);

    const filteredRows =
        filter === "all"
            ? rows
            : rows.filter((row) => row.classification === filter);

    const totalPages = Math.ceil(filteredRows.length / pageSize);

    const paginatedRows = filteredRows.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <aside className="fixed left-0 top-0 h-screen w-56 border-r bg-slate-100 p-4">
                <div className="mb-8">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
                    <p className="mt-3 font-bold">GBFS Dashboard</p>
                    <p className="text-sm text-slate-500">Research Admin</p>
                </div>

                <nav className="space-y-2">
                    <a href="/" className="block rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white">
                        Dashboard
                    </a>
                    <a href="/reports" className="block rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white">
                        Rapports
                    </a>
                    <a href="/analysis" className="block rounded-lg bg-white px-3 py-2 font-medium shadow-sm">
                        Analyse
                    </a>
                </nav>
            </aside>

            <main className="ml-56 min-h-screen">
                <header className="border-b bg-white px-8 py-5">
                    <h1 className="text-2xl font-bold">Analyse des deltas</h1>
                </header>

                <section className="p-8">
                    <div className="mb-6 flex gap-3">
                        <button onClick={() => { setFilter("all"); setPage(1); }} className="rounded border px-4 py-2">
                            Tous
                        </button>
                        <button onClick={() => { setFilter("probable_deposit"); setPage(1); }} className="rounded border px-4 py-2">
                            Dépôts probables
                        </button>
                        <button onClick={() => { setFilter("probable_pickup"); setPage(1); }} className="rounded border px-4 py-2">
                            Ramassages probables
                        </button>
                    </div>

                    <div className="mb-4 rounded-xl border bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="font-semibold">Classification utilisée</p>
                        <p className="mt-2">Delta inexpliqué = delta observé - delta attendu selon les trajets.</p>
                        <p className="mt-1">Dépôt probable ≥ +5 | Ramassage probable ≤ -5 | Normal entre -5 et +5</p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                            <tr className="border-b bg-slate-100 text-left">
                                <th className="p-3">Station</th>
                                <th className="p-3">Heure</th>
                                <th className="p-3">Vélos</th>
                                <th className="p-3">Delta observé</th>
                                <th className="p-3">Delta trajets</th>
                                <th className="p-3">Delta inexpliqué</th>
                                <th className="p-3">Départs</th>
                                <th className="p-3">Arrivées</th>
                                <th className="p-3">Classification</th>
                            </tr>
                            </thead>

                            <tbody>
                            {paginatedRows.map((row, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-3">{row.station}</td>
                                    <td className="p-3">{row.hour}</td>
                                    <td className="p-3">{row.bikes_at_hour}</td>
                                    <td className="p-3">{row.observed_delta_bikes}</td>
                                    <td className="p-3">{row.expected_delta_from_trips}</td>
                                    <td className="p-3 font-semibold">{row.unexplained_delta}</td>
                                    <td className="p-3">{row.departures}</td>
                                    <td className="p-3">{row.arrivals}</td>
                                    <td className="p-3">{row.classification}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Page {page} / {totalPages || 1} — {filteredRows.length} lignes
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded border px-4 py-2 disabled:opacity-50"
                            >
                                Précédent
                            </button>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="rounded border px-4 py-2 disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}