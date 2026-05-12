import SystemsMapWrapper from "./SystemsMapWrapper";

export default function SystemsMapPage() {
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Carte des stations</h1>
            <SystemsMapWrapper />
        </main>
    );
}