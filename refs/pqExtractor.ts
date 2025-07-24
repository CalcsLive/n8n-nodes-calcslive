// utils/pqExtractor.ts - Utility functions for extracting PQs from article content

import type { Article } from '@/types/article'
import type { PQ } from '@/types/pq'
import { usePQStore } from '@/stores/pqStore'
import { useCalculator } from '@/composables/useCalculator'
import { DEFAULT_CALC_ID } from '@/utils/namespaceUtils'

/**
 * Extract PQs from article content
 * 
 * @param article The article from which to extract PQs
 * @returns Array of PQs found in the article
 */
export function extractPQsFromArticle(article: Article): PQ[] {
  const pqs: PQ[] = [];
  
  if (!article || !article.content) {
    return pqs;
  }
  
  // Function to recursively traverse the document and extract PQ nodes
  function traverse(node: any) {
    // Check if this is a PQ node
    if (node.type === 'pqNode') {
      // Convert node attributes to PQ object
      const pq: PQ = {
        id: node.attrs.id,
        sym: node.attrs.sym,
        description: node.attrs.description || node.attrs.sym,
        categoryId: node.attrs.categoryId || '900',
        baseValue: typeof node.attrs.baseValue === 'number' ? node.attrs.baseValue : 0,
        baseUnit: node.attrs.baseUnit || 'ul',
        faceValue: typeof node.attrs.faceValue === 'number' ? node.attrs.faceValue : 0,
        faceUnit: node.attrs.faceUnit || '',
        expression: node.attrs.expression,
        decimalPlaces: node.attrs.decimalPlaces || 3,
        symHidden: Boolean(node.attrs.symHidden),
        expressionHidden: Boolean(node.attrs.expressionHidden),
        readOnly: Boolean(node.attrs.readOnly),
        calcId: node.attrs.calcId,
      };
      
      pqs.push(pq);
    }
    
    // Recursively process child nodes
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }
  
  // Start traversal with the document node
  if (article.content) {
    traverse(article.content);
  }
  
  console.log(`Extracted ${pqs.length} PQs from article content`);
  return pqs;
}

/**
 * Extract PQs from article content and return as a record keyed by ID
 * 
 * @param article The article from which to extract PQs
 * @returns Record mapping PQ IDs to PQ objects
 */
export function extractPQsFromArticleAsRecord(article: Article): Record<string, PQ> {
  const pqsArray = extractPQsFromArticle(article);
  const pqsRecord: Record<string, PQ> = {};
  
  for (const pq of pqsArray) {
    pqsRecord[pq.id] = pq;
  }
  
  return pqsRecord;
}

/**
 * Register extracted PQs with the calculator
 * 
 * @param pqs Array of PQs to register
 */
export function registerPQsWithCalculator(pqs: PQ[]): void {
  const pqStore = usePQStore();
  const calculator = useCalculator();
  
  // Clear existing PQs
  pqStore.clearPQs();
  
  // Register all PQs
  for (const pq of pqs) {
    pqStore.registerPQ(pq);
  }
  
  // Rebuild the dependency graph and recalculate
  calculator.rebuildDependencyGraph();
  calculator.recalculateAll();
  
  console.log(`Registered ${pqs.length} PQs with calculator`);
}

/**
 * Verify article PQs and log any issues
 * 
 * @param article The article to verify
 * @returns Array of issue descriptions
 */
export function verifyArticlePQs(article: Article): string[] {
  const issues: string[] = [];
  
  if (!article || !article.content) {
    return ['Article has no content to verify'];
  }
  
  // Extract PQs from article
  const pqs = extractPQsFromArticle(article);
  
  if (pqs.length === 0) {
    return ['No physical quantities found in article'];
  }
  
  // Check for duplicate symbols within the same calculator
  const symbolsByCalcId: Record<string, Set<string>> = {};
  
  for (const pq of pqs) {
    const calcId = pq.calcId || DEFAULT_CALC_ID;
    
    if (!symbolsByCalcId[calcId]) {
      symbolsByCalcId[calcId] = new Set();
    }
    
    if (symbolsByCalcId[calcId].has(pq.sym)) {
      issues.push(`Duplicate symbol "${pq.sym}" in calculator "${calcId}"`);
    }
    
    symbolsByCalcId[calcId].add(pq.sym);
  }
  
  // Check for references to undefined symbols (broken dependencies)
  for (const pq of pqs) {
    if (!pq.expression) continue;
    
    const calcId = pq.calcId || DEFAULT_CALC_ID;
    
    // Extract potential symbol references
    const symbolRefs = pq.expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    
    for (const ref of symbolRefs) {
      // Skip recognized math functions and constants
      if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'pi', 'e'].includes(ref)) {
        continue;
      }
      
      // Check if this is a cross-calculator reference (e.g., calc1.x)
      if (ref.includes('.')) {
        const [refCalcId, refSym] = ref.split('.');
        
        // Check if the referenced calculator and symbol exist
        if (!symbolsByCalcId[refCalcId] || !symbolsByCalcId[refCalcId].has(refSym)) {
          issues.push(`Expression in "${pq.sym}" references undefined symbol "${ref}"`);
        }
      } else {
        // Check if the symbol exists in the same calculator
        if (!symbolsByCalcId[calcId].has(ref)) {
          issues.push(`Expression in "${pq.sym}" references undefined symbol "${ref}"`);
        }
      }
    }
  }
  
  return issues;
}

/**
 * Find all PQs in the article with a specific property
 * 
 * @param article The article to search
 * @param predicate Function that returns true for matching PQs
 * @returns Array of matching PQs
 */
export function findPQsInArticle(article: Article, predicate: (pq: PQ) => boolean): PQ[] {
  const allPQs = extractPQsFromArticle(article);
  return allPQs.filter(predicate);
}

/**
 * Count PQs in the article by category (input vs calculated)
 * 
 * @param article The article to analyze
 * @returns Object with counts of input and calculated PQs
 */
export function countPQsByType(article: Article): { inputs: number, calculated: number, total: number } {
  const pqs = extractPQsFromArticle(article);
  
  const inputs = pqs.filter(pq => !pq.expression).length;
  const calculated = pqs.filter(pq => !!pq.expression).length;
  
  return {
    inputs,
    calculated,
    total: pqs.length
  };
}