import Link from "next/link";

export default function Home() {
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">
                GBFS Dashboard
            </h1>

            <p className="mb-6 text-gray-600">
                Choisis une ville pour consulter les données en temps réel.
            </p>

            <nav className="flex flex-col gap-4 max-w-sm">
                <Link
                    href="/bixi"
                    className="rounded-xl border p-4 hover:bg-gray-100 transition"
                >
                    <h2 className="text-xl font-semibold">BIXI Montréal</h2>
                    <p className="text-sm text-gray-500">
                        Voir les vélos disponibles par station
                    </p>
                </Link>
            </nav>
        </main>
    );
}