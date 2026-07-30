import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/categories';
import FieldForm from '../components/admin/FieldForm';

export default function FieldManagementPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Form toggles
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.listFields();
      setFields(data.results || data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch field definitions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    setFormLoading(true);
    try {
      if (editingField) {
        await categoriesApi.updateField(editingField.id, formData);
      } else {
        await categoriesApi.createField(formData);
      }
      await loadFields();
      setShowForm(false);
      setEditingField(null);
    } catch (err) {
      console.error(err);
      alert('Error saving field definition. Name must be unique.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field definition template? This will delete all category-field assignments and listing values!')) return;
    try {
      await categoriesApi.deleteField(fieldId);
      await loadFields();
    } catch (err) {
      console.error(err);
      alert('Error deleting field. It may have active category schema assignments.');
    }
  };

  const getFieldTypeLabel = (type) => {
    const labels = {
      text: 'Text Input',
      textarea: 'Textarea (Long Text)',
      number: 'Numeric Value',
      select: 'Dropdown Select',
      radio: 'Radio Choice',
      checkbox: 'Checkbox Multiselect',
      boolean: 'Yes/No Toggle',
      date: 'Date Picker',
    };
    return labels[type] || type;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/admin" className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Field Templates Library</h1>
          <p className="text-gray-500 text-sm mt-1">Manage global reusable field definitions that define column types in categories.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingField(null);
              setShowForm(true);
            }}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow active:scale-98 transition-all self-start sm:self-center"
          >
            + Create Field Definition
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2/3 - List of Fields */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-950 text-sm border-b border-gray-100 pb-3 mb-4">Available Definitions</h3>
            
            {loading ? (
              <div className="text-center py-6 text-xs text-gray-400">Loading definitions...</div>
            ) : fields.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">No definitions found. Create one to begin!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
                  <thead>
                    <tr className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                      <th className="py-3 px-4">Field Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fields.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{f.name}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            {getFieldTypeLabel(f.field_type)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate" title={f.description}>
                          {f.description || '—'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingField(f);
                              setShowForm(true);
                            }}
                            className="text-xs font-bold text-brand-600 hover:text-brand-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-500"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1/3 - Edit Form container */}
        <div className="lg:col-span-1">
          {showForm ? (
            <div className="animate-fade-in">
              <FieldForm
                initialData={editingField}
                onSubmit={handleCreateOrUpdate}
                onCancel={() => {
                  setShowForm(false);
                  setEditingField(null);
                }}
                loading={formLoading}
              />
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-150 p-6 rounded-2xl text-center text-xs text-gray-500 flex flex-col items-center justify-center min-h-[200px] shadow-sm">
              <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click "Create Field Definition" to add a new reusable type blueprint.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
