import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  return <>
    <section className="hero" id="krye">
      <Image src="/images/fabrika.jpg" alt="Kamioni i Llapi Fert duke transportuar produktet e kompanisë" fill priority className="hero-photo" />
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
        <div className="reference-title"><span className="eyebrow">NGA FABRIKA TEK JU</span><h2>Fotot</h2></div>
        <div className="field-gallery">
          <figure><Image src="/images/transporti-llapi-fert.jpg" alt="Kamioni i Llapi Fert me produktet e kompanisë" fill sizes="(max-width:700px) 100vw, 33vw" /><figcaption>Transporti i Llapi Fert</figcaption></figure>
          <figure><Image src="/images/ngarkimi-produkteve.jpg" alt="Ngarkimi i produkteve të betonit" fill sizes="(max-width:700px) 100vw, 33vw" /><figcaption>Ngarkimi i produkteve</figcaption></figure>
          <figure><Image src="/images/dergesa-llapi-fert.jpg" alt="Dërgesa e produkteve te klientët" fill sizes="(max-width:700px) 100vw, 33vw" /><figcaption>Gati për projektin tuaj</figcaption></figure>
        </div>
      </div>
    </section>

    <section className="reference-section contact-callout" id="contact">
      <div className="container"><span className="eyebrow">NA KONTAKTONI</span><h2>Flisni me ekipin e Llapi Fert</h2><p>Na tregoni për projektin tuaj dhe ne do t’ju ndihmojmë të gjeni produktet e duhura.</p><Link className="button button-lime" href="/contact">Dërgo kërkesë <span>↗</span></Link></div>
    </section>
  </>;
}
