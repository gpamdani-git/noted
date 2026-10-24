import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { formulaEngine } from '../utils/database/formulaEngine';
import { rollupCalculator } from '../utils/database/rollupCalculator';
import { exportToCSV, importFromCSV } from '../utils/database/importExport';
import { DatabaseBlock } from '../components/Editor/DatabaseBlock';

describe('Database System Overhaul (PRD-02)', () => {
  describe('Formula Engine (formulaEngine.js)', () => {
    it('evaluates basic arithmetic and numbers', () => {
      const result = formulaEngine.evaluate('add( 10 , 20 )');
      expect(result).toBe(30);

      const mult = formulaEngine.evaluate('multiply( 4 , 5 )');
      expect(mult).toBe(20);
    });

    it('resolves property references with prop("Name")', () => {
      const rowData = { Price: 100, Tax: 10, Item: 'Book' };
      const properties = [{ name: 'Price' }, { name: 'Tax' }, { name: 'Item' }];

      const total = formulaEngine.evaluate('add(prop("Price"), prop("Tax"))', rowData, properties);
      expect(total).toBe(110);

      const label = formulaEngine.evaluate('concat(prop("Item"), " - On Sale")', rowData, properties);
      expect(label).toBe('Book - On Sale');
    });

    it('handles logical conditions with if()', () => {
      const rowData = { Quantity: 0 };
      const properties = [{ name: 'Quantity' }];

      const status = formulaEngine.evaluate(
        'if(prop("Quantity"), "In Stock", "Out of Stock")',
        rowData,
        properties
      );
      expect(status).toBe('Out of Stock');
    });
  });

  describe('Rollup Calculator (rollupCalculator.js)', () => {
    const relatedPages = [
      { properties: { Score: 80, Category: 'Frontend' } },
      { properties: { Score: 90, Category: 'Backend' } },
      { properties: { Score: 70, Category: 'Frontend' } }
    ];

    it('calculates sum, average, min, and max correctly', () => {
      expect(rollupCalculator.calculate(relatedPages, { name: 'Score' }, 'sum')).toBe(240);
      expect(rollupCalculator.calculate(relatedPages, { name: 'Score' }, 'average')).toBe(80);
      expect(rollupCalculator.calculate(relatedPages, { name: 'Score' }, 'min')).toBe(70);
      expect(rollupCalculator.calculate(relatedPages, { name: 'Score' }, 'max')).toBe(90);
    });

    it('counts values and calculates unique values', () => {
      expect(rollupCalculator.calculate(relatedPages, { name: 'Score' }, 'count_all')).toBe(3);
      expect(rollupCalculator.calculate(relatedPages, { name: 'Category' }, 'count_unique_values')).toBe(2);
    });
  });

  describe('Import / Export Utility (importExport.js)', () => {
    it('exports table headers and rows to CSV format', () => {
      const headers = ['Task', 'Points'];
      const rows = [
        ['Auth Setup', '5'],
        ['Bug fix, edge-case', '3']
      ];

      const blob = exportToCSV(headers, rows);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toContain('text/csv');
    });

    it('imports and parses CSV into headers and rows', () => {
      const csv = 'Name,Priority,Done\nDesign,High,true\nDeploy,Medium,false';
      const parsed = importFromCSV(csv);

      expect(parsed.headers).toEqual(['Name', 'Priority', 'Done']);
      expect(parsed.rows.length).toBe(2);
      expect(parsed.rows[0]).toEqual(['Design', 'High', 'true']);
      expect(parsed.rows[1]).toEqual(['Deploy', 'Medium', 'false']);
    });
  });

  describe('DatabaseBlock Component Integration', () => {
    const blockWithFormula = {
      id: 'db-formula',
      type: 'database',
      title: 'Invoice List',
      headers: ['Item', 'Amount', 'Tax', 'Total'],
      columnTypes: ['text', 'number', 'number', 'formula'],
      columnConfigs: {
        3: { formula: 'add(prop("Amount"), prop("Tax"))' }
      },
      rows: [
        ['Laptop', '1000', '100', '']
      ]
    };

    it('computes and displays evaluated formula cell value', () => {
      render(<DatabaseBlock block={blockWithFormula} onUpdateBlock={vi.fn()} isLocked={false} />);
      // 1000 + 100 = 1100
      expect(screen.getByText('1100')).toBeInTheDocument();
    });

    it('provides Timeline view tab switch and export/import actions', () => {
      const handleUpdate = vi.fn();
      render(<DatabaseBlock block={blockWithFormula} onUpdateBlock={handleUpdate} isLocked={false} />);

      // Timeline tab button exists
      const timelineTab = screen.getByTitle('Gantt and deadlines (Timeline view)');
      expect(timelineTab).toBeInTheDocument();

      fireEvent.click(timelineTab);
      expect(handleUpdate).toHaveBeenCalledWith('db-formula', { viewType: 'timeline' });

      // Export button exists
      const exportBtn = screen.getByTitle('Export as CSV');
      expect(exportBtn).toBeInTheDocument();

      // Import button exists
      const importBtn = screen.getByTitle('Import CSV into table');
      expect(importBtn).toBeInTheDocument();
    });
  });
});

