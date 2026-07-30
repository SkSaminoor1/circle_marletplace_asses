export default function CheckboxField({ field, value, onChange, error }) {
  const { id, label, key, help_text, required, options = [] } = field;
  const selectedValues = Array.isArray(value) ? value : [];

  const handleToggle = (optValue) => {
    let nextValues;
    if (selectedValues.includes(optValue)) {
      nextValues = selectedValues.filter((v) => v !== optValue);
    } else {
      nextValues = [...selectedValues, optValue];
    }
    onChange(key, nextValues);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 font-bold" title="Required">*</span>}
      </span>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
        {options.map((opt, idx) => (
          <label key={opt.id || idx} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900 select-none">
            <input
              type="checkbox"
              name={`${key}[]`}
              value={opt.value}
              checked={selectedValues.includes(opt.value)}
              onChange={() => handleToggle(opt.value)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      {!error && help_text && <p className="text-xs text-gray-500">{help_text}</p>}
    </div>
  );
}
