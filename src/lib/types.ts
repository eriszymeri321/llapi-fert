export type Product = { id: string; name: string; slug: string; description: string; category_name: string; image_url: string; price: string | null; price_label: string; featured: boolean };
export type Order = { id: string; customer_name: string; phone: string; email: string; message: string | null; status: string; created_at: string; items: { product_name: string; quantity: number }[] };
