import BixiTable from "./BixiTable";

export default function BixiPage() {
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">BIXI Montréal</h1>
            <BixiTable />
        </main>
    );
}