"use client";

import dynamic from "next/dynamic";

const SystemsMap = dynamic(() => import("./SystemsMap"), {
    ssr: false,
});

export default function SystemsMapWrapper() {
    return <SystemsMap />;
}