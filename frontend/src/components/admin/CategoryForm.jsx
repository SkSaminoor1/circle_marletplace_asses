import { useState, useEffect } from 'react';

export default function CategoryForm({ initialData, onSubmit, onCancel, loading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setIcon(initialData.icon || '');
      setIsActive(initialData.is_active !== false);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Category name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name,
      description,
      icon,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
        {initialData ? 'Edit Category' : 'Create New Category'}
      </h3>

      {/* Category Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">Category Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          placeholder="e.g. Camera, Smart Home"
          className={`rounded-lg border px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none ${
            errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name}</span>}
      </div>

      {/* Category Icon */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">Icon / Emoji</label>
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="e.g. 📷, 🏠"
          className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
        />
        <p className="text-xs text-gray-500">Provide an emoji or string identifier representing the category.</p>
      </div>

      {/* Category Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What kind of products belong in this category?"
          className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-y"
        />
      </div>

      {/* Is Active Checkbox */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="category-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4.5 w-4.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="category-active" className="text-sm font-semibold text-gray-700 select-none cursor-pointer">
          Active (Visible to Sellers and Buyers)
        </label>
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
          {loading ? 'Saving...' : 'Save Category'}
        </button>
      </div>
    </form>
  );
}
