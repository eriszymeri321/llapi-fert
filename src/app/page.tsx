import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

const companyPhotos = [
  { src: "/images/gallery/01-historia.jpg", alt: "Pamje historike e punës së Llapi Fert" },
  { src: "/images/gallery/02-historia.jpg", alt: "Prodhimi i produkteve në vitet e para" },
  { src: "/images/gallery/03-historia.jpg", alt: "Ekipi i Llapi Fert gjatë punës" },
  { src: "/images/gallery/04-historia.jpg", alt: "Punëtorët dhe prodhimi i kompanisë" },
  { src: "/images/gallery/05-fabrika.jpg", alt: "Oborri dhe hapësirat e Llapi Fert" },
  { src: "/images/gallery/06-prodhimi.jpg", alt: "Puna në hapësirën prodhuese" },
  { src: "/images/gallery/07-ngarkimi.jpg", alt: "Ngarkimi i produkteve për dërgesë" },
  { src: "/images/gallery/08-transporti.jpg", alt: "Kamioni i Llapi Fert në oborrin e kompanisë" },
  { src: "/images/gallery/09-transporti.jpg", alt: "Flota e transportit të Llapi Fert" },
  { src: "/images/gallery/10-dergesa.jpg", alt: "Kamion i ngarkuar me produkte betoni" },
  { src: "/images/gallery/11-dergesa.jpg", alt: "Dërgesa e produkteve të Llapi Fert" },
  { src: "/images/gallery/12-sot.jpg", alt: "Transporti i produkteve sot" },
  { src: "/images/gallery/13-sot.jpg", alt: "Pamje e kompanisë Llapi Fert sot" },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  return <>
    <section className="hero" id="krye">
      <div className="hero-picture">
        <picture>
          <source media="(max-width: 760px)" srcSet="/images/fotojahomepagepermobile.webp" />
          <Image
            src="/images/fotojahomepageperdesktop.jpg"
            alt="Kamioni dhe hapësira e Llapi Fert"
            fill
            priority
            sizes="100vw"
            className="hero-photo"
          />
        </picture>
      </div>
      <div className="hero-shade" />
      <div className="container hero-content">
        <span className="eyebrow light">QË NGA VITI 1995</span>
        <h1>Besim dhe cilësi<br />në çdo ndërtim</h1>
        <p>Prodhues të gypave të betonit dhe fertrajve për shtëpi në Kosovë.</p>
        <div className="hero-actions">
          <Link href="/products" className="button button-lime">Shiko produktet</Link>
          <Link href="/contact" className="text-link light">Na kontaktoni <span>↗</span></Link>
        </div>
      </div>
    </section>

    <section className="reference-section about-band" id="rreth">
      <div className="container">
        <div className="reference-title"><span className="eyebrow">RRETH NESH</span><h2>Kompania Jonë</h2></div>
        <div className="reference-about-grid">
          <article className="reference-panel">
            <h3>Kompania Jonë</h3>
            <p>Llapi Fert u themelua në vitin 1995 dhe është kompani lider në prodhimin e gypave të betonit dhe fertrajve për shtëpi. Me përvojë të gjatë në treg, ne ofrojmë produkte me cilësi të lartë për projekte të ndryshme ndërtimi.</p>
            <p>Fokusi ynë kryesor është kënaqësia e klientit dhe ofrimi i zgjidhjeve të qëndrueshme për çdo nevojë ndërtimi.</p>
          </article>
          <article className="reference-panel">
            <h3>Pse të na zgjidhni ne?</h3>
            <ul><li>Cilësi e garantuar</li><li>Çmime konkurruese</li><li>Përvojë e gjatë</li><li>Shërbim i shpejtë</li><li>Produkte të qëndrueshme</li></ul>
          </article>
        </div>
      </div>
    </section>

    <section className="reference-section products reference-products" id="products">
      <div className="container">
        <div className="reference-title"><span className="eyebrow">PRODHIM BETONI</span><h2>Produktet tona</h2></div>
        <div className="product-grid">{products.slice(0, 3).map(product => <ProductCard key={product.id} product={product} />)}</div>
        <div className="reference-more"><Link className="button button-outline" href="/products">Shiko të gjitha produktet <span>↗</span></Link></div>
      </div>
    </section>

    <section className="reference-section field-section" id="fotot">
      <div className="container">
        <div className="reference-title gallery-heading"><span className="eyebrow">NGA FABRIKA TEK JU</span><h2>Fotot</h2><p>Disa nga pamjet e kompanisë sonë, që nga themelimi në vitin 1995 e deri më sot.</p></div>
        <div className="field-gallery company-gallery">
          {companyPhotos.map((photo, index) => <figure className={`gallery-item gallery-item-${index % 8}`} style={{ animationDelay: `${index * 55}ms` }} key={photo.src}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width:700px) 50vw, (max-width:1100px) 33vw, 25vw" />
          </figure>)}
        </div>
      </div>
    </section>

    <section className="reference-section contact-callout" id="contact">
      <div className="container"><span className="eyebrow">NA KONTAKTONI</span><h2>Flisni me ekipin e Llapi Fert</h2><p>Na tregoni për projektin tuaj dhe ne do t’ju ndihmojmë të gjeni produktet e duhura.</p><Link className="button button-lime" href="/contact">Dërgo kërkesë <span>↗</span></Link></div>
    </section>
  </>;
}
