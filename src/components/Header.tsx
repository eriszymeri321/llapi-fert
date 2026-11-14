"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
const links = [
  { href: "/#krye", label: "Kryefaqja" },
  { href: "/#rreth", label: "Rreth nesh" },
  { href: "/products", label: "Produktet" },
  { href: "/#fotot", label: "Fotot" },
  { href: "/contact", label: "Kontakt" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/#krye" className="brand" aria-label="Llapi Fert, kryefaqja">
          <Image src="/images/logo.png" alt="Llapi Fert" width={116} height={74} priority />
        </Link>
        <nav className="desktop-nav" aria-label="Navigimi kryesor">
          {links.map((link) => <Link href={link.href} key={link.label}>{link.label}</Link>)}
          <Link className="nav-cta" href="/contact">Na kontaktoni <span>↗</span></Link>
        </nav>
        <div className="mobile-menu">
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Mbyll menynë" : "Hap menynë"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-icon" />
          </button>
          {menuOpen && (
          <nav aria-label="Navigimi për telefon">
            {links.map((link) => <Link href={link.href} key={link.label} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
            <Link className="nav-cta" href="/contact" onClick={() => setMenuOpen(false)}>Na kontaktoni <span>↗</span></Link>
          </nav>
          )}
        </div>
      </div>
    </header>
  );
}
