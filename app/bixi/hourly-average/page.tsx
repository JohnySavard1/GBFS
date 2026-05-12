import HourlyAverageChart from "./HourlyAverageChart";

export default function HourlyAveragePage() {
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">
                Moyenne de vélos par station / heure
            </h1>

            <HourlyAverageChart />
        </main>
    );
}