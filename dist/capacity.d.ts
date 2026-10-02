import type { z } from 'zod';
import { articleCapacitySchema } from './schema.js';
export type ArticleCapacity = z.infer<typeof articleCapacitySchema>;
export declare function capacityMessage(capacity: ArticleCapacity): string;
export declare function checkArticleCapacity(capacity?: ArticleCapacity): void;
