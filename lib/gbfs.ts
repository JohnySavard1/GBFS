import type { BikeSystem } from "./systems";

type GbfsDiscovery = {
    data: {
        en?: {
            feeds: { name: string; url: string }[];
        };
        feeds?: { name: string; url: string }[];
    };
};

export async function getGbfsFeedUrl(system: BikeSystem, feedName: string) {
    const response = await fetch(system.gbfsUrl, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Impossible de charger gbfs.json pour ${system.id}`);
    }

    const data: GbfsDiscovery = await response.json();

    const feeds = data.data.en?.feeds ?? data.data.feeds ?? [];
    const feed = feeds.find((f) => f.name === feedName);

    if (!feed) {
        throw new Error(`Feed ${feedName} introuvable pour ${system.id}`);
    }

    return feed.url;
}