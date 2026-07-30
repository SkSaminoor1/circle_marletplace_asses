import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/categories';
import CategoryForm from '../components/admin/CategoryForm';
import FieldManager from '../components/admin/FieldManager';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Form toggles
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.list();
      // Handle potential pagination wrapper
      setCategories(data.results || data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    setFormLoading(true);
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, formData);
      } else {
        await categoriesApi.create(formData);
      }
      await loadCategories();
      setShowForm(false);
      setEditingCategory(null);
    } catch (err) {
      console.error(err);
      alert('Error saving category. Name must be unique.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (cat, activeState) => {
    try {
      await categoriesApi.update(cat.id, { is_active: activeState });
      await loadCategories();
      // Keep selection in sync
      if (selectedCategory && selectedCategory.id === cat.id) {
        setSelectedCategory({ ...selectedCategory, is_active: activeState });
      }
    } catch (err) {
      console.error(err);
      alert('Error modifying active status.');
    }
  };

  const handleDelete = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will delete all listing relationships!')) return;
    try {
      await categoriesApi.delete(catId);
      if (selectedCategory && selectedCategory.id === catId) {
        setSelectedCategory(null);
      }
      await loadCategories();
    } catch (err) {
      console.error(err);
      alert('Error deleting category. It may have listing dependencies.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb / Back Link */}
      <div className="mb-4">
        <Link to="/admin" className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Category Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Configure categories and attach custom dynamic form fields schema configuration.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowForm(true);
            }}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow hover:scale-102 active:scale-98 transition-all self-start sm:self-center"
          >
            + Create Category
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 1/3 - Category List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-950 text-sm border-b border-gray-100 pb-3 mb-3">Categories</h3>
            {loading ? (
              <div className="text-center py-6 text-xs text-gray-400">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">No categories found. Create one to start!</div>
            ) : (
              <div className="space-y-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategory && selectedCategory.id === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex flex-col p-3 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-brand-50/50 border-brand-200 ring-1 ring-brand-100'
                          : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.icon || '📁'}</span>
                          <span className="font-semibold text-sm text-gray-900">{cat.name}</span>
                        </div>
                        <span className={`h-2 w-2 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} title={cat.is_active ? 'Active' : 'Inactive'}></span>
                      </div>
                      
                      <div className="text-[11px] text-gray-500 mt-1 flex justify-between items-center">
                        <span>{cat.field_count} configured fields</span>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setShowForm(true);
                            }}
                            className="text-brand-500 hover:text-brand-600 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeactivate(cat, !cat.is_active)}
                            className="text-gray-500 hover:text-gray-600 font-medium"
                          >
                            {cat.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="text-red-500 hover:text-red-600 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 2/3 - Details & Field Configuration Manager */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Form (Create/Edit) */}
          {showForm && (
            <div className="animate-fade-in">
              <CategoryForm
                initialData={editingCategory}
                onSubmit={handleCreateOrUpdate}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                }}
                loading={formLoading}
              />
            </div>
          )}

          {/* Selected Category Field Manager */}
          {selectedCategory ? (
            <div className="bg-gray-50/50 border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="border-b border-gray-200 pb-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>{selectedCategory.icon || '📁'}</span>
                    <span>{selectedCategory.name} Schema Configuration</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedCategory.description || 'No description provided.'}</p>
                </div>
              </div>

              {/* Render Field Manager */}
              <FieldManager
                categoryId={selectedCategory.id}
                onFieldsChanged={loadCategories} // Refresh list stats when assignments change
              />
            </div>
          ) : (
            !showForm && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 p-12 text-center bg-white shadow-sm min-h-[300px]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold text-gray-900">No Category Selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a category from the left panel to configure its dynamic fields, validation schema, and conditional trigger visibility rules.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
