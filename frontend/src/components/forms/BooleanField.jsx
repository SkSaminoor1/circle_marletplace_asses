export default function BooleanField({ field, value, onChange, error }) {
  const { id, label, key, help_text, required } = field;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 font-bold" title="Required">*</span>}
      </span>
      <div className="flex gap-3 mt-1">
        <button
          type="button"
          onClick={() => onChange(key, true)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border shadow-sm flex-1 sm:flex-initial text-center transition-all ${
            value === true
              ? 'bg-brand-600 border-brand-600 text-white shadow-brand-500/10'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(key, false)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border shadow-sm flex-1 sm:flex-initial text-center transition-all ${
            value === false
              ? 'bg-brand-600 border-brand-600 text-white shadow-brand-500/10'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          No
        </button>
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      {!error && help_text && <p className="text-xs text-gray-500">{help_text}</p>}
    </div>
  );
}
