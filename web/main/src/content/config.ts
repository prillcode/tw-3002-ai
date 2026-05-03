import { defineCollection, z } from 'astro:content';

const guideCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(99),
  }),
});

const apiCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.enum(['overview', 'tutorial']).default('overview'),
    order: z.number().default(99),
  }),
});

export const collections = {
  guide: guideCollection,
  api: apiCollection,
};
