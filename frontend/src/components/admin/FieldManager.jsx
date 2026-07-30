import { useState, useEffect } from 'react';
import { categoriesApi } from '../../api/categories';

export default function FieldManager({ categoryId, onFieldsChanged }) {
  const [assignedFields, setAssignedFields] = useState([]);
  const [availableDefs, setAvailableDefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editing state for assign/update
  const [editingField, setEditingField] = useState(null); // categoryField or new template
  const [isAssigningNew, setIsAssigningNew] = useState(false);

  // Form State for assignment configuration
  const [selectedDefId, setSelectedDefId] = useState('');
  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [required, setRequired] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [defaultValue, setDefaultValue] = useState('');
  
  // Validation config
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minLength, setMinLength] = useState('');
  const [maxLength, setMaxLength] = useState('');

  // Options config (for select/radio/checkbox)
  const [options, setOptions] = useState([]); // Array of { label, value }
  const [newOptLabel, setNewOptLabel] = useState('');
  const [newOptValue, setNewOptValue] = useState('');

  // Conditions config
  const [conditions, setConditions] = useState([]); // Array of { depends_on, operator, value }
  const [condDependsOn, setCondDependsOn] = useState('');
  const [condOperator, setCondOperator] = useState('equals');
  const [condValue, setCondValue] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const assigned = await categoriesApi.getFields(categoryId);
      setAssignedFields(assigned);
      
      const allDefs = await categoriesApi.listFields();
      setAvailableDefs(allDefs.results || allDefs);
    } catch (err) {
      console.error(err);
      setError('Failed to load fields configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      loadData();
      resetForm();
      setIsAssigningNew(false);
      setEditingField(null);
    }
  }, [categoryId]);

  const resetForm = () => {
    setSelectedDefId('');
    setLabel('');
    setPlaceholder('');
    setHelpText('');
    setRequired(false);
    setDisplayOrder(assignedFields.length + 1);
    setDefaultValue('');
    setMinValue('');
    setMaxValue('');
    setMinLength('');
    setMaxLength('');
    setOptions([]);
    setNewOptLabel('');
    setNewOptValue('');
    setConditions([]);
    setCondDependsOn('');
    setCondOperator('equals');
    setCondValue('');
  };

  const handleEdit = (cf) => {
    setEditingField(cf);
    setIsAssigningNew(false);
    
    setSelectedDefId(cf.field_definition);
    setLabel(cf.label || '');
    setPlaceholder(cf.placeholder || '');
    setHelpText(cf.help_text || '');
    setRequired(!!cf.required);
    setDisplayOrder(cf.display_order || 0);
    setDefaultValue(cf.default_value || '');
    setMinValue(cf.min_value !== null && cf.min_value !== undefined ? String(cf.min_value) : '');
    setMaxValue(cf.max_value !== null && cf.max_value !== undefined ? String(cf.max_value) : '');
    setMinLength(cf.min_length !== null && cf.min_length !== undefined ? String(cf.min_length) : '');
    setMaxLength(cf.max_length !== null && cf.max_length !== undefined ? String(cf.max_length) : '');
    
    setOptions(cf.options || []);
    setConditions(cf.conditions || []);
  };

  const handleAddOption = () => {
    if (!newOptLabel.trim() || !newOptValue.trim()) return;
    setOptions([...options, { label: newOptLabel.trim(), value: newOptValue.trim(), display_order: options.length }]);
    setNewOptLabel('');
    setNewOptValue('');
  };

  const handleRemoveOption = (index) => {
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleAddCondition = () => {
    if (!condDependsOn || !condValue.trim()) return;
    setConditions([...conditions, { depends_on: parseInt(condDependsOn), operator: condOperator, value: condValue.trim() }]);
    setCondDependsOn('');
    setCondOperator('equals');
    setCondValue('');
  };

  const handleRemoveCondition = (index) => {
    setConditions(conditions.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        category: parseInt(categoryId),
        field_definition: parseInt(selectedDefId),
        label: label.trim(),
        placeholder: placeholder.trim(),
        help_text: helpText.trim(),
        required,
        display_order: parseInt(displayOrder) || 0,
        default_value: defaultValue.trim(),
        min_value: minValue !== '' ? parseFloat(minValue) : null,
        max_value: maxValue !== '' ? parseFloat(maxValue) : null,
        min_length: minLength !== '' ? parseInt(minLength) : null,
        max_length: maxLength !== '' ? parseInt(maxLength) : null,
        options,
        conditions,
      };

      if (editingField) {
        // Update CategoryField via PATCH on category-fields API
        await categoriesApi.updateCategoryField(editingField.id, payload);
      } else {
        // Create CategoryField assignment via POST
        await categoriesApi.assignField(payload);
      }

      await loadData();
      setIsAssigningNew(false);
      setEditingField(null);
      resetForm();
      if (onFieldsChanged) onFieldsChanged();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save field assignment config.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cfId) => {
    if (!window.confirm('Are you sure you want to remove this field assignment? All listing data for this field in this category will be lost!')) return;
    setLoading(true);
    try {
      await categoriesApi.unassignField(cfId);
      await loadData();
      if (onFieldsChanged) onFieldsChanged();
    } catch (err) {
      console.error(err);
      setError('Failed to remove field assignment.');
    } finally {
      setLoading(false);
    }
  };

  const getDefType = () => {
    const d = availableDefs.find(def => def.id === parseInt(selectedDefId));
    return d ? d.field_type : 'text';
  };

  const selectedType = getDefType();
  const showOptionsConfig = ['select', 'radio', 'checkbox'].includes(selectedType);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Existing Assigned Fields List */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-gray-950 text-base">Configured Fields</h3>
            <p className="text-xs text-gray-500">The schema defines the inputs required from the seller.</p>
          </div>
          {!isAssigningNew && !editingField && (
            <button
              onClick={() => {
                resetForm();
                setIsAssigningNew(true);
              }}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 hover:shadow active:scale-95 transition-all"
            >
              + Assign Existing Field
            </button>
          )}
        </div>

        {loading && assignedFields.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">Loading configurations...</div>
        ) : assignedFields.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 border border-dashed border-gray-250 rounded-xl">
            No fields assigned to this category yet. Click "Assign Existing Field" to configure the schema.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {assignedFields.map((cf) => (
              <div key={cf.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{cf.label}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                      {cf.field_type}
                    </span>
                    {cf.required && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-4">
                    <span>Key: <code className="bg-gray-50 px-1 rounded font-mono">{cf.key}</code></span>
                    <span>Order: {cf.display_order}</span>
                    {cf.options?.length > 0 && <span>Options: {cf.options.length}</span>}
                    {cf.conditions?.length > 0 && <span className="text-brand-600 font-medium">Conditional rules active</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(cf)}
                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                    title="Edit Field Configuration"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(cf.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove Assignment"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Panel (Assign New or Edit Existing) */}
      {(isAssigningNew || editingField) && (
        <form onSubmit={handleSave} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="font-bold text-gray-900 text-sm">
              {editingField ? `Configure Field: ${editingField.label}` : 'Assign Field to Category'}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field Definition Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Select Field Blueprint *</label>
              <select
                value={selectedDefId}
                onChange={(e) => {
                  setSelectedDefId(e.target.value);
                  const d = availableDefs.find(def => def.id === parseInt(e.target.value));
                  if (d && !label) setLabel(d.name);
                }}
                disabled={!!editingField}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
                required
              >
                <option value="">-- Choose Field Blueprint --</option>
                {availableDefs.map(def => {
                  // Hide already assigned blueprints unless editing
                  const isAssigned = assignedFields.some(cf => cf.field_definition === def.id);
                  if (isAssigned && (!editingField || editingField.field_definition !== def.id)) return null;
                  return (
                    <option key={def.id} value={def.id}>
                      {def.name} ({def.field_type})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Label Override */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Display Label (Frontend) *</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Model, RAM Capacity, Material Type"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
                required
              />
            </div>

            {/* Placeholder */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Input Placeholder</label>
              <input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="e.g. Enter RAM size in GB"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            {/* Help Text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Help / Subtext</label>
              <input
                type="text"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                placeholder="e.g. Max battery health as shown in Settings"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            {/* Required state */}
            <div className="flex items-center gap-2 mt-4 select-none">
              <input
                type="checkbox"
                id="field-required"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="field-required" className="text-xs font-semibold text-gray-700 cursor-pointer">
                Sellers must complete this field to submit
              </label>
            </div>

            {/* Display Order */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Display Order Index</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>

            {/* Default Value */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Default Value</label>
              <input
                type="text"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="e.g. Yes, Apple, 8"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
          </div>

          {/* Validation Constraints (Numbers/Text) */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Validation Rules</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Min Value</label>
                <input
                  type="number"
                  step="any"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="e.g. 0"
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Max Value</label>
                <input
                  type="number"
                  step="any"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="e.g. 100"
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Min Length (Chars)</label>
                <input
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                  placeholder="e.g. 2"
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Max Length (Chars)</label>
                <input
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                  placeholder="e.g. 50"
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Options Manager (Visible for select/radio/checkbox) */}
          {showOptionsConfig && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Options List Configuration</h5>
              
              {/* Option List Display */}
              {options.length > 0 ? (
                <div className="flex flex-wrap gap-2 py-1">
                  {options.map((opt, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-xs px-2.5 py-1 rounded-full font-medium text-gray-700">
                      <span>{opt.label} ({opt.value})</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveOption(idx)}
                        className="text-gray-400 hover:text-red-500 font-bold ml-1 text-sm focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No options configured yet. Add options below.</p>
              )}

              {/* Add New Option Input Block */}
              <div className="flex gap-2 items-end max-w-md">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Label (UI display)</label>
                  <input
                    type="text"
                    value={newOptLabel}
                    onChange={(e) => setNewOptLabel(e.target.value)}
                    placeholder="e.g. 128 GB"
                    className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Value (Stored key)</label>
                  <input
                    type="text"
                    value={newOptValue}
                    onChange={(e) => setNewOptValue(e.target.value)}
                    placeholder="e.g. 128"
                    className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="bg-gray-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-gray-800 focus:outline-none h-fit self-end"
                >
                  Add Option
                </button>
              </div>
            </div>
          )}

          {/* Conditional Visibility Rules */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Conditional Visibility (Rules Engine)</h5>
            
            {/* Condition List */}
            {conditions.length > 0 ? (
              <div className="space-y-1.5 py-1">
                {conditions.map((cond, idx) => {
                  const depField = assignedFields.find(f => f.id === cond.depends_on);
                  const depLabel = depField ? depField.label : `Field ID: ${cond.depends_on}`;
                  return (
                    <div key={idx} className="flex items-center justify-between bg-brand-50 border border-brand-100 text-brand-700 text-xs px-3 py-1.5 rounded-lg font-medium">
                      <span>Show this field when <strong>«{depLabel}»</strong> {cond.operator} <strong>«{cond.value}»</strong></span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCondition(idx)}
                        className="text-brand-400 hover:text-red-500 font-bold focus:outline-none text-sm"
                      >
                        Delete Rule
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Always visible. Add conditional dependencies below to dynamically control visibility.</p>
            )}

            {/* Configure Conditional Trigger */}
            <div className="flex flex-wrap gap-2 items-end max-w-2xl">
              <div className="flex-1 min-w-[150px] flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Depends On Field</label>
                <select
                  value={condDependsOn}
                  onChange={(e) => setCondDependsOn(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none bg-white"
                >
                  <option value="">-- Select Field --</option>
                  {assignedFields.map(f => {
                    // Prevent circular reference on self
                    if (editingField && f.id === editingField.id) return null;
                    return (
                      <option key={f.id} value={f.id}>
                        {f.label} ({f.key})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="w-[120px] flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Operator</label>
                <select
                  value={condOperator}
                  onChange={(e) => setCondOperator(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none bg-white"
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Does not equal</option>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Does not contain</option>
                  <option value="greater_than">Greater than</option>
                  <option value="less_than">Less than</option>
                </select>
              </div>
              <div className="flex-1 min-w-[100px] flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Trigger Value</label>
                <input
                  type="text"
                  value={condValue}
                  onChange={(e) => setCondValue(e.target.value)}
                  placeholder="e.g. true, 256, yes"
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCondition}
                className="bg-gray-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-gray-800 focus:outline-none h-fit self-end"
              >
                Add Rule
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsAssigningNew(false);
                setEditingField(null);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow active:scale-95 transition-all"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
