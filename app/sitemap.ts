import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://crex.co.kr'
  const now = new Date()
  return [
    { url: base,               lastModified: now, changeFrequency: 'daily',   priority: 1 },
    { url: `${base}/quote`,    lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/deal`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/diagnose`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
