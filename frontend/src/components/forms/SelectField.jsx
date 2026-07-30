export default function SelectField({ field, value, onChange, error }) {
  const { id, label, key, placeholder, help_text, required, options = [] } = field;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={`field-${id}`} className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 font-bold" title="Required">*</span>}
      </label>
      <select
        id={`field-${id}`}
        name={key}
        value={value || ''}
        onChange={(e) => onChange(key, e.target.value)}
        className={`w-full rounded-lg border px-3.5 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
        }`}
      >
        <option value="">{placeholder || 'Select an option'}</option>
        {options.map((opt) => (
          <option key={opt.id || opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      {!error && help_text && <p className="text-xs text-gray-500">{help_text}</p>}
    </div>
  );
}
