"use client";

import { useEffect, useState } from "react";
import { bikeSystems } from "@/lib/systems";

type ExportJob = {
    id: string;
    system_id: string | null;
    status: string;
    report_type: "full" | "short" | "hourly-average";
    file_path: string | null;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
    error_message: string | null;
};

export default function ReportsPageClient() {
    const [systemId, setSystemId] = useState<string>("all");
    const [jobs, setJobs] = useState<ExportJob[]>([]);
    const [loading, setLoading] = useState(false);

    async function loadJobs() {
        const response = await fetch("/api/export/jobs", {
            cache: "no-store",
        });

        const data = await response.json();
        setJobs(data.jobs ?? []);
    }

    async function createJob(reportType: "full" | "short" | "hourly-average") {
        setLoading(true);

        const response = await fetch("/api/export/jobs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                systemId: systemId === "all" ? null : systemId,
                reportType,
            }),
        });

        if (response.ok) {
            await loadJobs();
        }

        setLoading(false);
    }

    useEffect(() => {
        loadJobs();

        const interval = setInterval(loadJobs, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <aside className="fixed left-0 top-0 h-screen w-56 border-r bg-slate-100 p-4">
                <div className="mb-8">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
                    <p className="mt-3 font-bold">GBFS Dashboard</p>
                    <p className="text-sm text-slate-500">Research Admin</p>
                </div>

                <nav className="space-y-2">
                    <a
                        href="/"
                        className="block rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white"
                    >
                        Dashboard
                    </a>

                    <a
                        href="/reports"
                        className="block rounded-lg bg-white px-3 py-2 font-medium shadow-sm"
                    >
                        Rapports
                    </a>
                </nav>
            </aside>

            <main className="ml-56 min-h-screen">
                <header className="border-b bg-white px-8 py-5">
                    <h1 className="text-2xl font-bold">Rapports</h1>
                </header>

                <section className="p-8">
                    <div className="rounded-2xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold">Générer un rapport CSV</h2>

                        <div className="flex flex-wrap items-center gap-4">
                            <select
                                value={systemId}
                                onChange={(e) => setSystemId(e.target.value)}
                                className="rounded-lg border px-4 py-3"
                            >
                                <option value="all">Tous les systèmes</option>

                                {bikeSystems.map((system) => (
                                    <option key={system.id} value={system.id}>
                                        {system.city} - {system.provider}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => createJob("short")}
                                disabled={loading}
                                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {loading ? "Création..." : "Rapport court"}
                            </button>

                            <button
                                onClick={() => createJob("full")}
                                disabled={loading}
                                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
                            >
                                {loading ? "Création..." : "Rapport complet"}
                            </button>

                            <button
                                onClick={() => createJob("hourly-average")}
                                disabled={loading}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50"
                            >
                                {loading ? "Création..." : "Rapport horaire"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold">Derniers rapports</h2>

                        <table className="w-full border-collapse text-sm">
                            <thead>
                            <tr className="border-b text-left">
                                <th className="p-3">Système</th>
                                <th className="p-3">Statut</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Créé</th>
                                <th className="p-3">Téléchargement</th>
                            </tr>
                            </thead>

                            <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id} className="border-b">
                                    <td className="p-3">
                                        {job.system_id ?? "Tous les systèmes"}
                                    </td>

                                    <td className="p-3">{job.status}</td>

                                    <td className="p-3">{job.report_type}</td>

                                    <td className="p-3">
                                        {new Date(job.created_at).toLocaleString()}
                                    </td>

                                    <td className="p-3">
                                        {job.status === "done" ? (
                                            <a
                                                href={`/api/export/download/${job.id}`}
                                                className="font-semibold text-blue-600 underline"
                                            >
                                                Télécharger
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">Pas prêt</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}