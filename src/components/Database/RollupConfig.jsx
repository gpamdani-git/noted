import React from 'react';
import { ChevronDown, X, Database, Hash, Calendar, CheckSquare } from 'lucide-react';
import { ROLLUP_FUNCTIONS } from '../../utils/database/propertyTypes';
import './RollupConfig.css';

const getFunctionType = (targetProperty, columnTypes, headers) => {
  if (!targetProperty) return null;
  const colIdx = headers.findIndex(h => h === targetProperty);
  return colIdx >= 0 ? columnTypes[colIdx] : null;
};

const getCompatibleFunctions = (targetProperty, columnTypes, headers) => {
  const targetType = getFunctionType(targetProperty, columnTypes, headers);
  if (!targetType) return ROLLUP_FUNCTIONS;

  const numericTypes = ['number', 'formula', 'rollup'];
  const dateTypes = ['date', 'created_time', 'last_edited_time'];
  const selectTypes = ['select', 'status', 'multi_select'];

  if (numericTypes.includes(targetType)) {
    return ROLLUP_FUNCTIONS.filter(f => 
      !['earliest_date', 'latest_date', 'date_range'].includes(f.id)
    );
  }
  if (dateTypes.includes(targetType)) {
    return ROLLUP_FUNCTIONS.filter(f => 
      ['count_all', 'count_values', 'count_unique_values', 'count_empty', 'count_not_empty',
       'percent_empty', 'percent_not_empty', 'earliest_date', 'latest_date', 'date_range', 'show_original']
        .includes(f.id)
    );
  }
  if (selectTypes.includes(targetType)) {
    return ROLLUP_FUNCTIONS.filter(f => 
      ['count_all', 'count_values', 'count_unique_values', 'count_empty', 'count_not_empty',
       'percent_empty', 'percent_not_empty', 'show_original'].includes(f.id)
    );
  }
  return ROLLUP_FUNCTIONS.filter(f => 
    ['count_all', 'count_values', 'count_unique_values', 'count_empty', 'count_not_empty',
     'percent_empty', 'percent_not_empty', 'show_original'].includes(f.id)
  );
};

export const RollupConfig = ({
  columnConfig = {},
  headers = [],
  columnTypes = [],
  relatedProperties = null,
  onChange,
  relationConfig
}) => {
  const { relationId, targetProperty, functionType } = columnConfig;

  const availableRelations = headers
    .map((h, i) => ({ name: h, type: columnTypes[i], index: i }))
    .filter(c => c.type === 'relation');

  const availableProperties = (relatedProperties && relatedProperties.length > 0)
    ? relatedProperties
    : headers
        .map((h, i) => ({ name: h, type: columnTypes[i], index: i }))
        .filter(p => p.name !== headers.find((_, i) => columnConfig._selfIndex === i));

  const compatibleFunctions = getCompatibleFunctions(targetProperty, columnTypes, headers);
  const selectedFunction = compatibleFunctions.find(f => f.id === functionType) || compatibleFunctions[0];

  const handleRelationChange = (relationName) => {
    onChange({
      ...columnConfig,
      relationId: relationName,
      targetProperty: null,
      functionType: null
    });
  };

  const handlePropertyChange = (propertyName) => {
    const compat = getCompatibleFunctions(propertyName, columnTypes, headers);
    onChange({
      ...columnConfig,
      targetProperty: propertyName,
      functionType: compat[0]?.id || null
    });
  };

  const handleFunctionChange = (funcId) => {
    onChange({
      ...columnConfig,
      functionType: funcId
    });
  };

  return (
    <div className="db-rollup-config">
      <div className="db-rollup-step">
        <div className="db-rollup-step-label">1. Select Relation</div>
        <div className="db-rollup-select-wrap">
          <Database size={14} className="db-rollup-icon" />
          <select
            className="db-rollup-select"
            value={relationId || ''}
            onChange={(e) => handleRelationChange(e.target.value || null)}
            placeholder="Choose a relation column"
          >
            <option value="">— Select relation —</option>
            {availableRelations.map(r => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {availableRelations.length === 0 && (
          <p className="db-rollup-hint">Create a Relation column first to enable rollups</p>
        )}
      </div>

      {relationId && (
        <div className="db-rollup-step">
          <div className="db-rollup-step-label">2. Select Property to Roll Up</div>
          <div className="db-rollup-select-wrap">
            <Hash size={14} className="db-rollup-icon" />
            <select
              className="db-rollup-select"
              value={targetProperty || ''}
              onChange={(e) => handlePropertyChange(e.target.value || null)}
              placeholder="Choose property from related database"
              disabled={!relationId}
            >
              <option value="">— Select property —</option>
              {availableProperties.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.type ? `(${p.type})` : ''}
                </option>
              ))}
            </select>
          </div>
          {!targetProperty && relationId && (
            <p className="db-rollup-hint">Select a property from the related database</p>
          )}
        </div>
      )}

      {relationId && targetProperty && (
        <div className="db-rollup-step">
          <div className="db-rollup-step-label">3. Choose Calculation</div>
          <div className="db-rollup-functions-grid">
            {compatibleFunctions.map(func => (
              <button
                key={func.id}
                type="button"
                className={`db-rollup-func-btn ${selectedFunction.id === func.id ? 'selected' : ''}`}
                onClick={() => handleFunctionChange(func.id)}
              >
                <span className="db-rollup-func-icon">
                  {['sum', 'average', 'min', 'max', 'median'].includes(func.id) && <Hash size={14} />}
                  {['earliest_date', 'latest_date', 'date_range'].includes(func.id) && <Calendar size={14} />}
                  {['count_all', 'count_values', 'count_unique_values', 'count_empty', 'count_not_empty', 'percent_empty', 'percent_not_empty'].includes(func.id) && <CheckSquare size={14} />}
                  {func.id === 'show_original' && <Database size={14} />}
                </span>
                <span className="db-rollup-func-label">{func.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(relationId && targetProperty && functionType) && (
        <div className="db-rollup-preview">
          <span className="db-rollup-preview-label">Preview:</span>
          <span className="db-rollup-preview-value">
            {selectedFunction?.label} of <strong>{targetProperty}</strong> via <strong>{relationId}</strong>
          </span>
        </div>
      )}

      <div className="db-rollup-actions">
        <button
          type="button"
          className="db-rollup-btn-clear"
          onClick={() => onChange({ ...columnConfig, relationId: null, targetProperty: null, functionType: null })}
        >
          <X size={14} />
          Clear Configuration
        </button>
      </div>
    </div>
  );
};

export default RollupConfig;