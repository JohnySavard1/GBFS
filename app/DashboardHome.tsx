"use client";

import { useEffect, useState } from "react";
import SystemsMapWrapper from "./systems/map/SystemsMapWrapper";
import { useAtomValue } from "jotai";
import { selectedSystemIdAtom } from "@/lib/atoms";

type DashboardSummary = {
    snapshotCount: number;
    systemCount: number;
};

export default function DashboardHome() {
    const [summary, setSummary] = useState<DashboardSummary>({
        snapshotCount: 0,
        systemCount: 0,
    });

    useEffect(() => {
        async function loadSummary() {
            const response = await fetch("/api/dashboard/summary", {
                cache: "no-store",
            });

            const data = await response.json();
            setSummary(data);
        }

        loadSummary();
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
                        className="block rounded-lg bg-white px-3 py-2 font-medium shadow-sm"
                    >
                        Dashboard
                    </a>

                    <a
                        href="/reports"
                        className="block rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white"
                    >
                        Rapports
                    </a>
                    <a
                        href="/analysis"
                        className="block rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white"
                    >
                        Analysis des deltas
                    </a>
                    <a
                        href="/hourly-averages"
                        className="block rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white"
                    >
                        Moyennes horaires
                    </a>
                </nav>
            </aside>

            <main className="ml-56 min-h-screen">
                <header className="border-b bg-white px-8 py-5">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                </header>

                <section className="grid grid-cols-4 border-b bg-white">
                    <StatCard
                        title="Nombre de snapshots"
                        value={summary.snapshotCount.toLocaleString()}
                        subtitle="Snapshots distincts enregistrés"
                    />

                    <StatCard
                        title="Nombre de systèmes"
                        value={summary.systemCount.toLocaleString()}
                        subtitle="Systèmes GBFS suivis"
                    />

                    <StatCard
                        title="Collecte"
                        value="1 min"
                        subtitle="Intervalle actuel"
                    />

                    <StatCard
                        title="Statut"
                        value="Actif"
                        subtitle="Collecteur en cours"
                    />
                </section>

                <section className="grid grid-cols-[2fr_1fr]">
                    <div className="border-r p-8">
                        <h2 className="mb-4 text-lg font-bold">Carte des stations</h2>
                        <SystemsMapWrapper />
                    </div>

                    <div className="p-8">
                        <h2 className="mb-4 text-lg font-bold">Disponibilité</h2>
                        <AvailabilityPanel />
                    </div>
                </section>
            </main>
        </div>
    );
}

function StatCard({
                      title,
                      value,
                      subtitle,
                  }: {
    title: string;
    value: string;
    subtitle: string;
}) {
    return (
        <div className="border-r p-6">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
    );
}

function AvailabilityPanel() {
    const systemId = useAtomValue(selectedSystemIdAtom);

    const [summary, setSummary] = useState({
        green: 0,
        orange: 0,
        red: 0,
    });

    const maxValue = Math.max(summary.green, summary.orange, summary.red, 1);

    useEffect(() => {
        async function loadAvailability() {
            const response = await fetch(
                `/api/systems/${systemId}/availability-summary`,
                { cache: "no-store" }
            );

            const data = await response.json();

            if (response.ok) {
                setSummary(data);
            }
        }

        loadAvailability();
    }, [systemId]);

    return (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
                Disponibilité du dernier snapshot pour :{" "}
                <span className="font-semibold">{systemId}</span>
            </p>

            <div className="mt-8 flex items-center justify-center gap-4">
                <Bubble
                    label="Vert"
                    value={summary.green}
                    color="bg-green-500"
                    maxValue={maxValue}
                />

                <div className="flex flex-col gap-4">
                    <Bubble
                        label="Orange"
                        value={summary.orange}
                        color="bg-orange-400"
                        maxValue={maxValue}
                    />

                    <Bubble
                        label="Rouge"
                        value={summary.red}
                        color="bg-red-500"
                        maxValue={maxValue}
                    />
                </div>
            </div>
        </div>
    );
}

function Bubble({
                    label,
                    value,
                    color,
                    maxValue,
                }: {
    label: string;
    value: number;
    color: string;
    maxValue: number;
}) {
    const minSize = 80;
    const maxSize = 180;

    const ratio = maxValue > 0 ? value / maxValue : 0;
    const size = minSize + ratio * (maxSize - minSize);

    return (
        <div
            className={`flex flex-col items-center justify-center rounded-full text-white shadow-lg ${color}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-sm">{label}</span>
        </div>
    );
}