const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

async function collect() {
    const response = await fetch(`${API_BASE_URL}/api/collect-bixi`);
    const data = await response.json();
    console.log(new Date().toISOString(), data);
}

collect();
setInterval(collect, 2 * 60 * 1000);