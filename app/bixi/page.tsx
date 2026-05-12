import BixiTable from "./BixiTable";

export default function BixiPage() {
    return (
        <main className="min-h-screen p-8">
            <a
                href="/bixi/hourly-average"
                className="underline block mb-4"
            >
                Voir la moyenne horaire par station
            </a>
            <h1 className="text-3xl font-bold mb-6">BIXI Montréal</h1>
            <BixiTable />
        </main>
    );
}