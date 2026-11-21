"use client";
import { useMemo, useState } from "react";
import { calculateQuote, type QuoteSpecifications } from "@/lib/pricing";

type QuoteProduct = { id: string; name: string; slug: string };
type FertrajDimension = { key: number; length: string; quantity: string };
type OrderRow = { key: number; productId: string; quantity: string; fertrajDimensions: FertrajDimension[]; gypDiameter: string; gypLength: string; stubaLength: string };
type QuoteEntry = { row: OrderRow; dimension: FertrajDimension | null; product?: QuoteProduct; quantity: number; specifications: QuoteSpecifications; quote: ReturnType<typeof calculateQuote> };
const fertrajLengths = Array.from({ length: 27 }, (_, index) => ((16 + index * 2) / 10).toFixed(2));
const money = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;
const nextKey = () => Date.now() + Math.random();
const rowFor = (key: number, productId: string): OrderRow => ({ key, productId, quantity: "1", fertrajDimensions: [{ key: nextKey(), length: "1.60", quantity: "1" }], gypDiameter: "1000", gypLength: "1", stubaLength: "2" });

export default function QuoteForm({ products, selectedProduct }: { products: QuoteProduct[]; selectedProduct?: string }) {
  const firstProduct = selectedProduct || products[0]?.id || "";
  const [rows, setRows] = useState<OrderRow[]>([rowFor(0, firstProduct)]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const quotes = useMemo<QuoteEntry[]>(() => rows.flatMap((row): QuoteEntry[] => {
    const product = products.find(item => item.id === row.productId);
    if (product?.slug === "fertraj-per-shtepi") return row.fertrajDimensions.map(dimension => {
      const quantity = Number(dimension.quantity);
      const specifications: QuoteSpecifications = { length_m: dimension.length };
      const quote = Number.isInteger(quantity) && quantity > 0 ? calculateQuote(product.slug, quantity, specifications) : null;
      return { row, dimension, product, quantity, specifications, quote };
    });
    let specifications: QuoteSpecifications = {};
    if (product?.slug === "gypa-betoni") specifications = { diameter_mm: row.gypDiameter, length_m: row.gypLength };
    if (product?.slug === "shtylla-betoni") specifications = { length_m: row.stubaLength };
    const quantity = Number(row.quantity);
    const quote = product && Number.isInteger(quantity) && quantity > 0 ? calculateQuote(product.slug, quantity, specifications) : null;
    return [{ row, dimension: null, product, quantity, specifications, quote }];
  }), [rows, products]);
  const total = quotes.every(item => item.quote?.lineTotal !== null && item.quote !== null)
    ? quotes.reduce((sum, item) => sum + (item.quote?.lineTotal || 0), 0) : null;
  function updateRow(key: number, values: Partial<OrderRow>) { setRows(current => current.map(row => row.key === key ? { ...row, ...values } : row)); }
  function updateDimension(rowKey: number, dimensionKey: number, values: Partial<FertrajDimension>) {
    setRows(current => current.map(row => row.key === rowKey ? { ...row, fertrajDimensions: row.fertrajDimensions.map(d => d.key === dimensionKey ? { ...d, ...values } : d) } : row));
  }
  function addDimension(row: OrderRow) {
    const lastLength = Number(row.fertrajDimensions[row.fertrajDimensions.length - 1]?.length || "1.60");
    const nextLength = fertrajLengths.find(length => Number(length) > lastLength) || "1.60";
    setRows(current => current.map(item => item.key === row.key ? { ...item, fertrajDimensions: [...item.fertrajDimensions, { key: nextKey(), length: nextLength, quantity: "1" }] } : item));
  }
  function addProduct() { setRows(current => [...current, rowFor(nextKey(), products.find(product => product.slug !== "fertraj-per-shtepi")?.id || products[0]?.id || "")]); }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; setBusy(true); setMessage("");
    const values = new FormData(form);
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        companyName: values.get("companyName"), businessNumber: values.get("businessNumber"), phone: values.get("phone"), location: values.get("location"), whatsappOptIn: values.get("whatsappOptIn") === "on", message: values.get("message"),
        items: quotes.map(({ product, quantity, specifications }) => ({ product: product?.id, quantity, specifications }))
      }) });
      const result = await response.json(); setMessage(result.message);
      if (response.ok) { form.reset(); setRows([rowFor(nextKey(), firstProduct)]); }
    } catch { setMessage("Nuk u lidhëm dot me serverin. Ju lutemi provoni përsëri."); }
    finally { setBusy(false); }
  }

  return <form className="quote-form" onSubmit={submit}>
    <div className="form-row">
      <label>Emri i kompanisë<input required name="companyName" minLength={2} maxLength={120} placeholder="Emri i kompanisë" /></label>
      <label>Numri i biznesit<input required name="businessNumber" minLength={3} maxLength={40} placeholder="Numri i biznesit" /></label>
    </div>
    <div className="form-row">
      <label>Telefoni kontaktues<input required name="phone" type="tel" minLength={6} maxLength={40} placeholder="+383 ..." /></label>
      <label>Lokacioni i dërgesës<input required name="location" minLength={2} maxLength={200} placeholder="Qyteti, adresa" /></label>
    </div>
    <div className="order-lines-head"><h3>Produktet për porosi</h3><span>Dimensionet e fertrajt shtohen brenda produktit</span></div>
    {rows.map((row, index) => {
      const product = products.find(item => item.id === row.productId);
      const rowQuotes = quotes.filter(item => item.row.key === row.key);
      return <section className="order-line" key={row.key}>
        <div className="order-line-title"><b>{product?.name || `Produkti ${index + 1}`}</b>{rows.length > 1 && <button type="button" className="remove-line" onClick={() => setRows(current => current.filter(item => item.key !== row.key))}>Hiqe produktin</button>}</div>
        <label>Produkti<select required value={row.productId} onChange={e => updateRow(row.key, rowFor(row.key, e.target.value))}>{products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        {product?.slug === "fertraj-per-shtepi" && <div className="dimension-list"><h4>Dimensionet e fertrajt</h4>{row.fertrajDimensions.map((dimension, dimensionIndex) => {
          const quote = rowQuotes[dimensionIndex]?.quote;
          return <div className="dimension-row" key={dimension.key}>
            <label>Dimensioni<select required value={dimension.length} onChange={e => updateDimension(row.key, dimension.key, { length: e.target.value })}>{fertrajLengths.map(length => <option key={length} value={length}>{length.replace(".", ",")} m</option>)}</select></label>
            <label>Sasia (copë)<input required type="number" min="1" max="100000" step="1" value={dimension.quantity} onChange={e => updateDimension(row.key, dimension.key, { quantity: e.target.value })} /></label>
            <strong className="line-price">{quote?.lineTotal === null ? quote?.label || "Kontrolloni dimensionet" : quote ? money(quote.lineTotal) : "Plotësoni dimensionet"}</strong>
            {quote?.note && <small className="field-hint dimension-note">{quote.note}</small>}
            {row.fertrajDimensions.length > 1 && <button type="button" className="remove-line dimension-remove" onClick={() => updateRow(row.key, { fertrajDimensions: row.fertrajDimensions.filter(item => item.key !== dimension.key) })}>Hiqe dimensionin</button>}
          </div>;
        })}<button type="button" className="button button-outline add-line" onClick={() => addDimension(row)}>＋ Shto dimension tjetër</button></div>}
        {product?.slug === "gypa-betoni" && <div className="form-row"><label>Diametri (mm)<select value={row.gypDiameter} onChange={e => updateRow(row.key, { gypDiameter: e.target.value })}><option value="1000">Gyp 1000</option><option value="800">Gyp 800</option><option value="600">Gyp 600</option><option value="400">Gyp 400</option></select></label><label>Gjatësia<select value={row.gypLength} onChange={e => updateRow(row.key, { gypLength: e.target.value })}><option value="1">1 m</option><option value="0.5">0.50 m</option></select></label></div>}
        {product?.slug === "shtylla-betoni" && <label>Gjatësia e shtyllës<select value={row.stubaLength} onChange={e => updateRow(row.key, { stubaLength: e.target.value })}><option value="2">2 m</option><option value="2.5">2,5 m</option></select></label>}
        {product?.slug !== "fertraj-per-shtepi" && <label>Sasia (copë)<input required type="number" min="1" max="100000" step="1" value={row.quantity} onChange={e => updateRow(row.key, { quantity: e.target.value })} /></label>}
        {product?.slug !== "fertraj-per-shtepi" && <div className="line-price">{rowQuotes[0]?.quote?.lineTotal === null ? rowQuotes[0]?.quote?.label || "Kontrolloni dimensionet" : rowQuotes[0]?.quote ? money(rowQuotes[0].quote.lineTotal!) : "Plotësoni dimensionet"}</div>}
      </section>;
    })}
    <button type="button" className="button button-outline add-line" onClick={addProduct}>＋ Shto produkt tjetër (gypa ose shtylla)</button>
    <div className="price-summary"><div className="price-summary-head"><span>ÇMIMI I KOMPLET POROSISË</span><strong>{total === null ? "Konfirmohet nga ekipi" : money(total)}</strong></div><p>Çmimi llogaritet sipas dimensioneve dhe sasive të zgjedhura.</p></div>
    <label className="whatsapp-consent"><input required type="checkbox" name="whatsappOptIn" /> Pajtohem të marr njoftim në WhatsApp për përfundimin e kësaj porosie.</label>
    <label>Detaje shtesë<textarea name="message" rows={3} maxLength={2000} placeholder="Shënime për porosinë (opsionale)" /></label>
    <button className="button button-dark" disabled={busy}>{busy ? "Duke dërguar..." : "Dërgo porosinë"}<span>↗</span></button>
    {message && <p className="form-message" role="status">{message}</p>}
  </form>;
}
