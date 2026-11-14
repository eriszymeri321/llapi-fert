"use client";
import { useState } from "react";
import { calculateQuote, type QuoteSpecifications } from "@/lib/pricing";

type QuoteProduct = { id: string; name: string; slug: string };

export default function QuoteForm({ products, selectedProduct }: { products: QuoteProduct[]; selectedProduct?: string }) {
  const [productId, setProductId] = useState(selectedProduct || products[0]?.id || "");
  const [quantity, setQuantity] = useState("1");
  const [fertrajLength, setFertrajLength] = useState("1.60");
  const [gypDiameter, setGypDiameter] = useState("1000");
  const [gypLength, setGypLength] = useState("1");
  const [stubaLength, setStubaLength] = useState("2");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const product = products.find(item => item.id === productId);
  const quantityNumber = Number(quantity);
  let specifications: QuoteSpecifications = {};
  if (product?.slug === "fertraj-per-shtepi") specifications = { length_m: fertrajLength };
  if (product?.slug === "gypa-betoni") specifications = { diameter_mm: gypDiameter, length_m: gypLength };
  if (product?.slug === "shtylla-betoni") specifications = { length_m: stubaLength };
  const quote = product && Number.isInteger(quantityNumber) && quantityNumber > 0
    ? calculateQuote(product.slug, quantityNumber, specifications)
    : null;
  const formatMoney = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setMessage("");
    const values = new FormData(form);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"), phone: values.get("phone"), email: values.get("email"),
          product: productId, quantity: quantityNumber, specifications,
          message: values.get("message")
        })
      });
      const result = await response.json();
      setMessage(result.message);
      if (response.ok) {
        form.reset();
        setQuantity("1");
      }
    } catch {
      setMessage("Nuk u lidhëm dot me serverin. Ju lutemi provoni përsëri.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="quote-form" onSubmit={submit}>
    <div className="form-row">
      <label>Emri i plotë<input required name="name" minLength={2} placeholder="Emri dhe mbiemri" /></label>
      <label>Telefoni<input required name="phone" minLength={6} placeholder="+383 ..." /></label>
    </div>
    <label>Email<input required type="email" name="email" placeholder="ju@shembull.com" /></label>
    <label>Produkti<select name="product" required value={productId} onChange={e => setProductId(e.target.value)}>
      {products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select></label>

    {product?.slug === "fertraj-per-shtepi" && <label>Gjatësia e fertrajt (metra)
      <input required type="number" name="length_m" min="1.60" max="6.60" step="0.10" value={fertrajLength} onChange={e => setFertrajLength(e.target.value)} />
      <small className="field-hint">1.60–3.79 m pa shufër · 3.80–4.79 m me 1 shufër · 4.80–5.79 m me 2 shufra</small>
    </label>}

    {product?.slug === "gypa-betoni" && <div className="form-row">
      <label>Diametri i gypit (mm)<select name="diameter_mm" value={gypDiameter} onChange={e => setGypDiameter(e.target.value)}>
        <option value="1000">Gyp 1000</option><option value="800">Gyp 800</option><option value="600">Gyp 600</option><option value="400">Gyp 400</option>
      </select></label>
      <label>Gjatësia<select name="length_m" value={gypLength} onChange={e => setGypLength(e.target.value)}>
        <option value="1">1 m</option><option value="0.5">0.50 m</option>
      </select></label>
    </div>}

    {product?.slug === "shtylla-betoni" && <label>Gjatësia e shtyllës<select name="length_m" value={stubaLength} onChange={e => setStubaLength(e.target.value)}>
      <option value="2">2 m · 4,00 € / copë</option><option value="2.5">2.5 m · 5,00 € / copë</option>
    </select></label>}

    <label>Sasia (copë)<input required name="quantity" type="number" min="1" max="100000" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
    {quote && <div className="price-summary" aria-live="polite">
      <div className="price-summary-head"><span>VLERËSIMI I ÇMIMIT</span><strong>{quote.lineTotal === null ? quote.label : formatMoney(quote.lineTotal)}</strong></div>
      <p>{quote.formula ? `${quote.formula} = ${formatMoney(quote.lineTotal!)}` : quote.note || "Çmimi konfirmohet nga ekipi ynë."}</p>
      {quote.label && <small>{quote.label}</small>}
      <small className="estimate-note">Vlerësim sipas dimensionit dhe çmimeve të dhëna.</small>
    </div>}
    <label>Detaje shtesë<textarea name="message" rows={3} placeholder="Na tregoni për projektin tuaj (opsionale)" /></label>
    <button className="button button-dark" disabled={busy}>{busy ? "Duke dërguar..." : "Dërgo kërkesën"}<span>↗</span></button>
    {message && <p className="form-message" role="status">{message}</p>}
  </form>;
}
