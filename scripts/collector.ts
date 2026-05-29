import { bikeSystems } from "../lib/systems";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

async function collectSystem(systemId: string) {
    const response = await fetch(`${API_BASE_URL}/api/systems/${systemId}/collect`);

    const data = await response.json();

    console.log(new Date().toISOString(), systemId, data);
}

async function collectAllSystems() {
    for (const system of bikeSystems) {
        try {
            await collectSystem(system.id);
        } catch (error) {
            console.error(`Erreur avec ${system.id}:`, error);
        }
    }
}

collectAllSystems();

setInterval(collectAllSystems, 60 * 1000);