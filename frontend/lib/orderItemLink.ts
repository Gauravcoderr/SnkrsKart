export interface OrderItemLink {
  href: string;
  label: string;
}

export function orderItemLink(item: { slug?: string; name: string }, orderStatus: string): OrderItemLink {
  if (!item.slug) return { href: `/products?search=${encodeURIComponent(item.name)}`, label: 'View' };
  if (orderStatus === 'delivered') return { href: `/products/${item.slug}#reviews`, label: 'Write a review' };
  return { href: `/products/${item.slug}`, label: 'View' };
}
