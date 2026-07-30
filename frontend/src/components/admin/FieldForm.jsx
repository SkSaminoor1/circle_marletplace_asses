import { useState, useEffect } from 'react';

export default function FieldForm({ initialData, onSubmit, onCancel, loading }) {
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setFieldType(initialData.field_type || 'text');
      setDescription(initialData.description || '');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Field name is required';
    if (!fieldType) newErrors.fieldType = 'Field type is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name,
      field_type: fieldType,
      description,
    });
  };

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Textarea (Long Text)' },
    { value: 'number', label: 'Numeric Value' },
    { value: 'select', label: 'Dropdown Selector (Select)' },
    { value: 'radio', label: 'Radio Button Group' },
    { value: 'checkbox', label: 'Checkbox Multiselect' },
    { value: 'boolean', label: 'Boolean (Yes/No Toggle)' },
    { value: 'date', label: 'Date Picker' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
        {initialData ? 'Edit Field Definition' : 'Create New Field Definition'}
      </h3>

      {/* Field Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">Field Name / Label blueprint *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          placeholder="e.g. RAM, Battery Health, Pet Friendly"
          className={`rounded-lg border px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none ${
            errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
          }`}
          disabled={!!initialData} // Field name template name usually fixed once created
        />
        {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name}</span>}
        <p className="text-xs text-gray-400">The generic name of the field (reusable across categories).</p>
      </div>

      {/* Field Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">Field Type *</label>
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
          disabled={!!initialData} // Changing field type of existing templates is dangerous
          className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
        >
          {fieldTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.fieldType && <span className="text-xs text-red-500 font-medium">{errors.fieldType}</span>}
        <p className="text-xs text-gray-400">Controls how this field is rendered on forms. Cannot be changed once created.</p>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">Internal Description / Notes</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this field used for?"
          className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow active:scale-95 transition-all"
        >
          {loading ? 'Saving...' : 'Save Field Definition'}
        </button>
      </div>
    </form>
  );
}
