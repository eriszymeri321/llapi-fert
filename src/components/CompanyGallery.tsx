"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Photo = { src: string; alt: string };

export default function CompanyGallery({ photos }: { photos: Photo[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(index, photos.length - 1));
    const slide = track.current?.children[next] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setActive(next);
  }

  function updateActive() {
    const element = track.current;
    if (!element) return;
    const first = element.children[0] as HTMLElement | undefined;
    if (!first) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    setActive(Math.min(photos.length - 1, Math.max(0, Math.round(element.scrollLeft / (first.offsetWidth + gap)))));
  }

  return (
    <div className="company-gallery-shell">
      <div className="company-gallery-track" ref={track} onScroll={updateActive} aria-label="Galeria e fotove të Llapi Fert">
        {photos.map((photo, index) => (
          <figure className="company-gallery-slide" key={photo.src} aria-label={`Foto ${index + 1} nga ${photos.length}`}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 760px) 100vw, 1100px" />
            <figcaption><span>LLAPI FERT</span><b>{photo.alt}</b></figcaption>
          </figure>
        ))}
      </div>
      <div className="company-gallery-controls">
        <span className="gallery-count"><strong>{String(active + 1).padStart(2, "0")}</strong><i />{String(photos.length).padStart(2, "0")}</span>
        <div className="gallery-progress" aria-hidden="true"><span style={{ transform: `scaleX(${(active + 1) / photos.length})` }} /></div>
        <div className="gallery-arrows">
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Fotoja e mëparshme">←</button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active === photos.length - 1} aria-label="Fotoja tjetër">→</button>
        </div>
      </div>
    </div>
  );
}
