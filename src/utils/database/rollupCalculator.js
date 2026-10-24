/**
 * Rollup Calculator
 * Aggregate values from related pages
 */

import { ROLLUP_FUNCTIONS } from './propertyTypes';

export class RollupCalculator {
  calculate(relatedPages = [], targetProperty, functionType) {
    if (!Array.isArray(relatedPages) || relatedPages.length === 0) {
      return this.getEmptyResult(functionType);
    }

    const values = relatedPages
      .map(page => this.getPropertyValue(page, targetProperty))
      .filter(v => v !== null && v !== undefined && v !== '');

    if (values.length === 0 && !functionType.includes('count_all')) {
      return this.getEmptyResult(functionType);
    }

    switch (functionType) {
      case 'count_all':
        return relatedPages.length;
      case 'count_values':
        return values.length;
      case 'count_unique_values':
        return new Set(values.map(v => JSON.stringify(v))).size;
      case 'count_empty':
        return relatedPages.length - values.length;
      case 'count_not_empty':
        return values.length;
      case 'percent_empty':
        return relatedPages.length === 0 ? 0 : Math.round(((relatedPages.length - values.length) / relatedPages.length) * 100);
      case 'percent_not_empty':
        return relatedPages.length === 0 ? 0 : Math.round((values.length / relatedPages.length) * 100);
      case 'sum':
        const sum = values.reduce((acc, v) => acc + Number(v || 0), 0);
        return isNaN(sum) ? 0 : sum;
      case 'average':
        if (values.length === 0) return 0;
        const avg = values.reduce((acc, v) => acc + Number(v || 0), 0) / values.length;
        return isNaN(avg) ? 0 : Math.round(avg * 100) / 100;
      case 'median':
        if (values.length === 0) return 0;
        const sorted = [...values].map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
        if (sorted.length === 0) return 0;
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      case 'min':
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.length === 0 ? null : Math.min(...nums);
      case 'max':
        const numsMax = values.map(Number).filter(n => !isNaN(n));
        return numsMax.length === 0 ? null : Math.max(...numsMax);
      case 'range':
        const numsRange = values.map(Number).filter(n => !isNaN(n));
        if (numsRange.length === 0) return null;
        return Math.max(...numsRange) - Math.min(...numsRange);
      case 'earliest_date':
        const dates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (dates.length === 0) return null;
        return new Date(Math.min(...dates)).toISOString();
      case 'latest_date':
        const datesMax = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (datesMax.length === 0) return null;
        return new Date(Math.max(...datesMax)).toISOString();
      case 'date_range':
        const datesRange = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (datesRange.length < 2) return null;
        const diff = Math.max(...datesRange) - Math.min(...datesRange);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      case 'show_original':
        return values.length === 1 ? values[0] : values;
      default:
        return values.length;
    }
  }

  getPropertyValue(page, property) {
    if (!page || !property) return null;
    if (page.properties && property.name) {
      return page.properties[property.name];
    }
    if (page[property.name]) {
      return page[property.name];
    }
    return null;
  }

  getEmptyResult(functionType) {
    if (functionType.includes('count') || functionType.includes('percent')) return 0;
    if (functionType === 'show_original') return [];
    return null;
  }
}

export const rollupCalculator = new RollupCalculator();
export default RollupCalculator;
