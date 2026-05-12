export type BikeSystem = {
    id: string;
    city: string;
    country: string;
    provider: string;
    gbfsUrl: string;
    stationStatusUrl?: string;
    stationInformationUrl?: string;
};

export const bikeSystems: BikeSystem[] = [
    {
        id: "montreal-bixi",
        city: "Montréal",
        country: "Canada",
        provider: "BIXI",
        gbfsUrl: "https://gbfs.velobixi.com/gbfs/gbfs.json",
    },
    {
        id: "quebec-avelo",
        city: "Québec City",
        country: "Canada",
        provider: "àVélo",
        gbfsUrl: "https://quebec.publicbikesystem.net/customer/gbfs/v3.0/gbfs.json",
    },
    {
        id: "vancouver-mobi",
        city: "Vancouver",
        country: "Canada",
        provider: "Mobi Bike Share",
        gbfsUrl: "https://gbfs.kappa.fifteen.eu/gbfs/2.2/mobi/en/gbfs.json",
    },
    {
        id: "new-york-citibike",
        city: "New York City",
        country: "United States",
        provider: "Citi Bike",
        gbfsUrl: "https://gbfs.citibikenyc.com/gbfs/en/gbfs.json",
        stationStatusUrl: "https://gbfs.citibikenyc.com/gbfs/en/station_status.json",
        stationInformationUrl: "https://gbfs.citibikenyc.com/gbfs/en/station_information.json",
    },
    {
        id: "mexico-city-ecobici",
        city: "Mexico City",
        country: "Mexico",
        provider: "Ecobici",
        gbfsUrl: "https://gbfs.mex.lyftbikes.com/gbfs/gbfs.json",
    },
    {
        id: "paris-velib",
        city: "Paris",
        country: "France",
        provider: "Vélib' / Smovengo",
        gbfsUrl:
            "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/gbfs.json",
    },
    {
        id: "toronto-bike-share",
        city: "Toronto",
        country: "Canada",
        provider: "Bike Share Toronto",
        gbfsUrl: "https://toronto.publicbikesystem.net/customer/gbfs/v2/gbfs.json",
    },
    {
        id: "brighton-beryl",
        city: "Brighton",
        country: "United Kingdom",
        provider: "Beryl",
        gbfsUrl: "https://gbfs.beryl.cc/v2_2/Brighton/gbfs.json",
    },
];