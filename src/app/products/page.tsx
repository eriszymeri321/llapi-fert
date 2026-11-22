import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Products() {
  const products = await getProducts();
  const fertrajIndex = products.findIndex(product => /fertraj/i.test(`${product.slug} ${product.category_name}`));
  if (fertrajIndex !== -1 && fertrajIndex !== 1 && products.length >= 3) {
    const [fertraj] = products.splice(fertrajIndex, 1);
    products.splice(1, 0, fertraj);
  }

  return (
    <div className="container page-pad">
      <div className="page-intro">
        <span className="eyebrow">KATALOGU</span>
        <h1>Produktet tona</h1>
        <p>Gypa betoni, fertraj dhe shtylla betoni për shitje me shumicë.</p>
      </div>
      {products.length ? (
        <div className="product-grid">
          {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="empty-state">Produktet do të shfaqen këtu së shpejti.</div>
      )}
    </div>
  );
}
