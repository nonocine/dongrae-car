"use client";

import { useState } from "react";
import Image from "next/image";
import { VEHICLE } from "@/lib/vehicle";

type Source = "local" | "remote" | "none";

export default function VehicleImage() {
  const [source, setSource] = useState<Source>("local");

  if (source === "none") return null;

  const src =
    source === "local" ? VEHICLE.localImagePath : VEHICLE.remoteImageUrl;

  return (
    <div className="relative h-[50px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-slate-50">
      <Image
        src={src}
        alt={`${VEHICLE.model} 차량 이미지`}
        fill
        sizes="88px"
        className="object-cover"
        onError={() => {
          setSource((prev) => (prev === "local" ? "remote" : "none"));
        }}
        unoptimized={source === "remote"}
      />
    </div>
  );
}
