import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    short: z.string(),
    type: z.string(),
    role: z.string(),
    funding: z.string().optional(),
    partners: z.array(z.string()).default([]),
    summary: z.string(),
    image: z.string().optional(),
    order: z.number().default(99),
    legacySlug: z.string().optional(),
  }),
});

export const collections = { projects };
