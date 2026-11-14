import { db } from "@/lib/db";
import { Product } from "@/lib/types";

// Read-only preview catalog used before a Neon database is configured.
const previewProducts: Product[] = [
  {id:"00000000-0000-4000-8000-000000000001",name:"Fertraj për Shtëpi",slug:"fertraj-per-shtepi",description:"Fertraj të betonit për shtëpi me cilësi të garantuar. Të përdorur për mbështetje strukturore dhe mbyllje të ndërtesave me siguri maksimale.",category_name:"Fertraj për shtëpi",image_url:"/images/fertraj.jpg",price:null,price_label:"Kërko ofertë",featured:true},
  {id:"00000000-0000-4000-8000-000000000002",name:"Gypa Betoni",slug:"gypa-betoni",description:"Gypat betoni të cilësisë së lartë për projekte ndërtimi të ndryshme dhe hapje të bunarve. Të prodhuar me materiale cilësore për qëndrueshmëri maksimale.",category_name:"Gypa betoni",image_url:"/images/gypa-betoni.jpg",price:null,price_label:"Kërko ofertë",featured:true},
  {id:"00000000-0000-4000-8000-000000000003",name:"Shtylla Betoni",slug:"shtylla-betoni",description:"Shtylla betoni të cilësisë së lartë për projekte ndërtimi të ndryshme. Të prodhuar me materiale cilësore për qëndrueshmëri maksimale dhe rezistencë afatgjatë.",category_name:"Shtylla betoni",image_url:"/images/stuba-betoni.jpg",price:null,price_label:"Kërko ofertë",featured:true}
];

export async function getProducts(category?: string, q?: string): Promise<Product[]> {
  if (!process.env.DATABASE_URL) return previewProducts.filter(p=>(!category||p.slug===category||p.category_name.toLowerCase().replaceAll(" ","-")===category)&&(!q||`${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase())));
  const values: string[] = [];
  const filters: string[] = ["p.active = true"];
  if (category) { values.push(category); filters.push(`c.slug = $${values.length}`); }
  if (q) { values.push(`%${q}%`); filters.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`); }
  const { rows } = await db.query(`SELECT p.id,p.name,p.slug,p.description,c.name AS category_name,p.image_url,p.price,p.price_label,p.featured FROM products p JOIN categories c ON c.id=p.category_id WHERE ${filters.join(" AND ")} ORDER BY p.featured DESC,p.name`, values);
  return rows;
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!process.env.DATABASE_URL) return previewProducts.find(p=>p.slug===slug)??null;
  const { rows } = await db.query("SELECT p.id,p.name,p.slug,p.description,c.name AS category_name,p.image_url,p.price,p.price_label,p.featured FROM products p JOIN categories c ON c.id=p.category_id WHERE p.slug=$1 AND p.active=true", [slug]);
  return rows[0] ?? null;
}

export async function getCategories(): Promise<{name:string;slug:string}[]> {
  if (!process.env.DATABASE_URL) return [{name:"Fertraj për shtëpi",slug:"fertraj"},{name:"Gypa betoni",slug:"gypa-betoni"},{name:"Shtylla betoni",slug:"shtylla-betoni"}];
  const { rows } = await db.query("SELECT name,slug FROM categories ORDER BY name"); return rows;
}
