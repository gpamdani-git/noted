/**
 * Formula Engine - Safe Expression Evaluator
 * No eval() or Function() constructor for security
 */

class FormulaEngine {
  constructor() {
    this.functions = {
      // Arithmetic
      add: (...args) => args.reduce((a, b) => Number(a) + Number(b), 0),
      subtract: (a, b) => Number(a) - Number(b),
      multiply: (...args) => args.reduce((a, b) => Number(a) * Number(b), 1),
      divide: (a, b) => Number(b) === 0 ? 0 : Number(a) / Number(b),
      mod: (a, b) => Number(a) % Number(b),
      abs: (a) => Math.abs(Number(a)),
      round: (a, decimals = 0) => Number(Number(a).toFixed(decimals)),
      min: Math.min,
      max: Math.max,
      
      // String
      concat: (...args) => args.map(a => String(a ?? '')).join(''),
      substring: (str, start, length) => String(str ?? '').substring(start, length),
      replace: (str, search, replacement) => String(str ?? '').replace(search, replacement),
      length: (str) => String(str ?? '').length,
      toLowerCase: (str) => String(str ?? '').toLowerCase(),
      toUpperCase: (str) => String(str ?? '').toUpperCase(),
      
      // Logical
      if: (condition, trueVal, falseVal) => this.isTruthy(condition) ? trueVal : falseVal,
      and: (...args) => args.every(a => this.isTruthy(a)),
      or: (...args) => args.some(a => this.isTruthy(a)),
      not: (a) => !this.isTruthy(a),
      
      // Date
      now: () => new Date().toISOString(),
      dateAdd: (date, amount, unit) => {
        const d = new Date(date);
        if (unit === 'days') d.setDate(d.getDate() + Number(amount));
        else if (unit === 'months') d.setMonth(d.getMonth() + Number(amount));
        else if (unit === 'years') d.setFullYear(d.getFullYear() + Number(amount));
        return d.toISOString();
      },
      dateBetween: (start, end, unit) => {
        const s = new Date(start);
        const e = new Date(end);
        const diff = e - s;
        if (unit === 'days') return Math.floor(diff / (1000 * 60 * 60 * 24));
        if (unit === 'hours') return Math.floor(diff / (1000 * 60 * 60));
        return Math.floor(diff / (1000 * 60));
      },
      formatDate: (date, format) => {
        const d = new Date(date);
        return d.toLocaleDateString();
      },
      
      // Utility
      empty: (val) => val === null || val === undefined || val === '',
      equal: (a, b) => a == b,
      unequal: (a, b) => a != b
    };
  }

  isTruthy(val) {
    if (val === null || val === undefined || val === false || val === '') return false;
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(val);
  }

  parseTokens(expr) {
    // Simple tokenizer
    const tokens = [];
    let i = 0;
    let current = '';
    
    while (i < expr.length) {
      const char = expr[i];
      
      if (/\s/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        i++;
        continue;
      }
      
      if (/[(){}[\],]/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
        i++;
        continue;
      }
      
      if (/[+\-*/%=<>!&|]/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        // Check for multi-char operators
        if ((char === '=' || char === '!' || char === '<' || char === '>') && expr[i+1] === '=') {
          tokens.push(char + '=');
          i += 2;
        } else if ((char === '&' && expr[i+1] === '&') || (char === '|' && expr[i+1] === '|')) {
          tokens.push(char + char);
          i += 2;
        } else {
          tokens.push(char);
          i++;
        }
        continue;
      }
      
      if (char === '"') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        i++; // skip quote
        let str = '';
        while (i < expr.length && expr[i] !== '"') {
          str += expr[i];
          i++;
        }
        tokens.push('"' + str + '"');
        i++; // skip closing quote
        continue;
      }
      
      current += char;
      i++;
    }
    
    if (current) {
      tokens.push(current);
    }
    
    return tokens;
  }

  evaluate(expr, rowData = {}, properties = []) {
    try {
      // Replace property references prop("Name") with values
      let processed = expr.replace(/prop\(["']([^"']+)["']\)/g, (match, propName) => {
        const prop = properties.find(p => p.name === propName);
        if (!prop) return 'null';
        const val = rowData[propName];
        if (typeof val === 'string') return '"' + val.replace(/"/g, '\\"') + '"';
        if (val === null || val === undefined) return 'null';
        if (Array.isArray(val)) return JSON.stringify(val);
        return val;
      });
      
      // Very simple evaluator for basic cases
      // For production, would use a proper parser
      const tokens = this.parseTokens(processed);
      const result = this.evaluateTokens(tokens, rowData);
      return result;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return null;
    }
  }

  evaluateTokens(tokens, rowData) {
    // Simplified - just evaluate function calls
    let i = 0;
    const evaluate = () => {
      if (i >= tokens.length) return null;
      let token = tokens[i++];
      
      if (token.startsWith('"') && token.endsWith('"')) {
        return token.slice(1, -1);
      }
      
      if (token === 'null' || token === 'undefined') return null;
      if (token === 'true') return true;
      if (token === 'false') return false;
      if (!isNaN(Number(token))) return Number(token);
      
      if (this.functions[token] && tokens[i] === '(') {
        i++; // skip '('
        const args = [];
        while (tokens[i] !== ')' && i < tokens.length) {
          if (tokens[i] === ',') {
            i++;
            continue;
          }
          args.push(evaluate());
        }
        i++; // skip ')'
        const fn = this.functions[token];
        if (typeof fn === 'function') {
          return fn(...args);
        }
      }
      
      return token;
    };
    
    return evaluate();
  }
}

export const formulaEngine = new FormulaEngine();
export default FormulaEngine;
