export default function NumberField({ field, value, onChange, error }) {
  const { id, label, key, placeholder, help_text, required, min_value, max_value } = field;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={`field-${id}`} className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 font-bold" title="Required">*</span>}
      </label>
      <input
        type="number"
        id={`field-${id}`}
        name={key}
        min={min_value !== null ? parseFloat(min_value) : undefined}
        max={max_value !== null ? parseFloat(max_value) : undefined}
        step="any"
        value={value !== undefined && value !== null ? value : ''}
        placeholder={placeholder}
        onChange={(e) => {
          const val = e.target.value;
          onChange(key, val === '' ? null : parseFloat(val));
        }}
        className={`w-full rounded-lg border px-3.5 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-gray-400 ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
        }`}
      />
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      {!error && help_text && <p className="text-xs text-gray-500">{help_text}</p>}
    </div>
  );
}
