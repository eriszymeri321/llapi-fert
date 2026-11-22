export type QuoteSpecifications = Record<string, string>;
export type CalculatedQuote = { unitPrice: number | null; lineTotal: number | null; label: string; formula: string | null; note?: string };

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateQuote(slug: string, quantity: number, spec: QuoteSpecifications): CalculatedQuote | null {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) return null;
  if (slug === "fertraj-per-shtepi") {
    const length = Number(spec.length_m);
    if (!Number.isFinite(length) || length < 1.6 || length > 6.8) return null;
    let rate: number;
    let reinforcement: string;
    if (length < 3.8) { rate = 2; reinforcement = "pa shufër metalike"; }
    else if (length < 4.8) { rate = 2.5; reinforcement = "me 1 shufër metalike"; }
    else if (length < 5.8) { rate = 2.7; reinforcement = "me 2 shufra metalike"; }
    else return { unitPrice: null, lineTotal: null, label: "Çmimi konfirmohet nga ekipi", formula: null, note: "Çmimi për dimensionin 5.80–6.80 m konfirmohet nga ekipi." };
    const unitPrice = money(length * rate);
    return { unitPrice, lineTotal: money(unitPrice * quantity), label: `${length.toFixed(2).replace(".", ",")} m · ${reinforcement} · ${rate.toFixed(2).replace(".", ",")} €/m`, formula: `${quantity} copë × ${length.toFixed(2)} m × ${rate.toFixed(2)} €/m` };
  }
  if (slug === "gypa-betoni") {
    const diameter = spec.diameter_mm;
    const length = spec.length_m;
    const prices: Record<string, Record<string, number>> = { "1000": { "1": 50, "0.5": 30 }, "800": { "1": 35, "0.5": 25 }, "600": { "1": 30, "0.5": 20 }, "400": { "1": 20 } };
    if (!diameter || !["1000", "800", "600", "400"].includes(diameter) || !length || !["1", "0.5"].includes(length)) return null;
    const unitPrice = prices[diameter]?.[length];
    if (unitPrice === undefined) return { unitPrice: null, lineTotal: null, label: "Çmimi konfirmohet nga ekipi", formula: null, note: "Çmimi për gypin 400 me gjatësi 0.50 m duhet konfirmuar." };
    return { unitPrice, lineTotal: money(unitPrice * quantity), label: `Gyp ${diameter} · ${length.replace(".", ",")} m`, formula: `${quantity} copë × ${unitPrice.toFixed(2)} € / copë` };
  }
  if (slug === "shtylla-betoni") {
    const length = spec.length_m;
    const prices: Record<string, number> = { "2": 4, "2.5": 5 };
    if (!length || prices[length] === undefined) return null;
    const unitPrice = prices[length];
    return { unitPrice, lineTotal: money(unitPrice * quantity), label: `Shtyllë ${length.replace(".", ",")} m`, formula: `${quantity} copë × ${unitPrice.toFixed(2)} € / copë` };
  }
  return { unitPrice: null, lineTotal: null, label: "Çmimi konfirmohet nga ekipi", formula: null };
}
