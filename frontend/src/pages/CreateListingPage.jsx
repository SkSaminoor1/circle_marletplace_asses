import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi } from '../api/categories';
import { listingsApi } from '../api/listings';
import DynamicField from '../components/forms/DynamicField';
import { checkConditionSatisfied } from '../components/forms/ConditionalField';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Step state: 1: Category, 2: Basic, 3: Specs, 4: Images, 5: Preview
  const [step, setStep] = useState(1);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Basic info state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('good');
  const [location, setLocation] = useState('');

  // Dynamic field values state: { [field_id]: value }
  const [dynamicValues, setDynamicValues] = useState({});
  const [categoryFields, setCategoryFields] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Image files state
  const [imageFiles, setImageFiles] = useState([]); // List of actual File objects
  const [imagePreviews, setImagePreviews] = useState([]); // List of preview object URLs

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesApi.list({ is_active: true });
        setCategories(data.results || data);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load category selection.');
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Fetch category fields when category is chosen
  const handleSelectCategory = async (cat) => {
    setSelectedCategory(cat);
    setLoading(true);
    setError('');
    try {
      const fields = await categoriesApi.getFields(cat.id);
      setCategoryFields(fields);
      
      // Initialize dynamic values with defaults
      const initialVals = {};
      fields.forEach((f) => {
        if (f.default_value) {
          if (f.field_type === 'boolean') {
            initialVals[f.key] = f.default_value.toLowerCase() === 'true';
          } else if (f.field_type === 'checkbox') {
            initialVals[f.key] = f.default_value.split(',').map((v) => v.trim());
          } else {
            initialVals[f.key] = f.default_value;
          }
        }
      });
      setDynamicValues(initialVals);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError('Failed to load specifications for the selected category.');
    } finally {
      setLoading(false);
    }
  };

  const handleDynamicChange = (key, value) => {
    setDynamicValues((prev) => {
      const nextValues = { ...prev, [key]: value };
      
      // Clean up validation error for this field
      if (validationErrors[key]) {
        setValidationErrors((errs) => {
          const next = { ...errs };
          delete next[key];
          return next;
        });
      }
      return nextValues;
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check size limit (e.g. 5MB per image)
    const invalidSize = files.some(file => file.size > 5 * 1024 * 1024);
    if (invalidSize) {
      alert("One or more files exceed the 5MB size limit.");
      return;
    }

    // Check file type
    const invalidType = files.some(file => !file.type.startsWith('image/'));
    if (invalidType) {
      alert("Only image files are supported.");
      return;
    }

    setImageFiles([...imageFiles, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setImageFiles(imageFiles.filter((_, idx) => idx !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(imagePreviews.filter((_, idx) => idx !== index));
  };

  // Run frontend validation before going to next step or submitting
  const validateStep = (currentStep) => {
    const errors = {};

    if (currentStep === 2) {
      if (!title.trim()) errors.title = 'Title is required.';
      else if (title.length < 5) errors.title = 'Title must be at least 5 characters.';
      
      if (!description.trim()) errors.description = 'Description is required.';
      else if (description.length < 20) errors.description = 'Description must be at least 20 characters.';
      
      if (!price) errors.price = 'Price is required.';
      else if (isNaN(price) || parseFloat(price) <= 0) errors.price = 'Price must be a positive number.';
      
      if (!location.trim()) errors.location = 'Location is required.';
    }

    if (currentStep === 3) {
      // Validate dynamic fields based on metadata configuration
      categoryFields.forEach((cf) => {
        // Skip hidden fields
        if (!checkConditionSatisfied(cf.conditions, dynamicValues)) return;

        const val = dynamicValues[cf.key];
        const isValEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

        if (cf.required && isValEmpty) {
          errors[cf.key] = `${cf.label} is required.`;
          return;
        }

        if (!isValEmpty) {
          if (cf.field_type === 'number') {
            const num = parseFloat(val);
            if (cf.min_value !== null && num < parseFloat(cf.min_value)) {
              errors[cf.key] = `Minimum value is ${cf.min_value}.`;
            }
            if (cf.max_value !== null && num > parseFloat(cf.max_value)) {
              errors[cf.key] = `Maximum value is ${cf.max_value}.`;
            }
          }
          if (cf.field_type === 'text' || cf.field_type === 'textarea') {
            const strVal = String(val);
            if (cf.min_length !== null && strVal.length < cf.min_length) {
              errors[cf.key] = `Minimum length is ${cf.min_length} characters.`;
            }
            if (cf.max_length !== null && strVal.length > cf.max_length) {
              errors[cf.key] = `Maximum length is ${cf.max_length} characters.`;
            }
          }
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (submitLoading) return;
    setSubmitLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('category', selectedCategory.id);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', parseFloat(price).toFixed(2));
      formData.append('condition', condition);
      formData.append('location', location.trim());
      formData.append('status', 'active');

      // Map dynamic values using database IDs as keys
      const dynamicFieldsPayload = {};
      categoryFields.forEach((cf) => {
        // Skip hidden fields
        if (!checkConditionSatisfied(cf.conditions, dynamicValues)) return;
        
        const val = dynamicValues[cf.key];
        if (val !== undefined && val !== null && val !== '') {
          dynamicFieldsPayload[cf.id] = val;
        }
      });
      formData.append('dynamic_fields', JSON.stringify(dynamicFieldsPayload));

      // Append image files
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await listingsApi.create(formData);
      navigate(`/listing/${response.id}`);
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data;
      if (backendErr && backendErr.dynamic_fields) {
        // Map backend dynamic field errors back to human names
        const fieldErrors = {};
        Object.entries(backendErr.dynamic_fields).forEach(([fId, msg]) => {
          const field = categoryFields.find(f => String(f.id) === fId);
          if (field) {
            fieldErrors[field.key] = Array.isArray(msg) ? msg[0] : msg;
          }
        });
        setValidationErrors(fieldErrors);
        setStep(3); // Send user back to spec step
        setError('Some dynamic specification fields failed backend validation.');
      } else {
        setError(backendErr?.error || 'Failed to create listing. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Steps indicators config
  const stepsConfig = [
    { num: 1, label: 'Category' },
    { num: 2, label: 'General' },
    { num: 3, label: 'Details' },
    { num: 4, label: 'Images' },
    { num: 5, label: 'Preview' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Step Progress Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {stepsConfig.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 relative">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold border transition-all ${
                  step >= s.num
                    ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/10'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}>
                  {s.num}
                </span>
                <span className={`text-xs font-semibold ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < stepsConfig.length - 1 && (
                <div className={`h-0.5 flex-1 mx-4 rounded transition-all ${
                  step > s.num ? 'bg-brand-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* STEP 1: Select Category */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-950">Select a Product Category</h2>
              <p className="text-sm text-gray-500 mt-1">Different categories require specific details to help buyers decide.</p>
            </div>
            
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No active categories found in database.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-2xl hover:border-brand-500 hover:bg-brand-50/20 active:scale-98 transition-all group text-center"
                  >
                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon || '📁'}</span>
                    <span className="font-bold text-sm text-gray-950">{cat.name}</span>
                    {cat.description && <span className="text-[11px] text-gray-500 mt-1 line-clamp-2">{cat.description}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Basic General Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2">
                <span>{selectedCategory?.icon || '📁'}</span>
                <span>General Listing Details</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Provide a listing title, pricing details, location, and write a helpful description.</p>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Listing Title *</label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 14 Pro — Space Gray, 256GB"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (validationErrors.title) setValidationErrors({...validationErrors, title: ''});
                  }}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 outline-none ${
                    validationErrors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.title && <span className="text-xs text-red-500">{validationErrors.title}</span>}
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Price (Rs) *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="849.00"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (validationErrors.price) setValidationErrors({...validationErrors, price: ''});
                    }}
                    className={`w-full pl-12 pr-3.5 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-500/20 outline-none ${
                      validationErrors.price ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <span className="absolute left-3 top-2 text-sm font-bold text-gray-400">Rs.</span>
                </div>
                {validationErrors.price && <span className="text-xs text-red-500">{validationErrors.price}</span>}
              </div>

              {/* Condition */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (validationErrors.location) setValidationErrors({...validationErrors, location: ''});
                  }}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 outline-none ${
                    validationErrors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.location && <span className="text-xs text-red-500">{validationErrors.location}</span>}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Description *</label>
                <textarea
                  rows={4}
                  placeholder="Tell buyers about your item's condition, features, why you are selling it, etc. (min 20 characters)"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (validationErrors.description) setValidationErrors({...validationErrors, description: ''});
                  }}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 outline-none ${
                    validationErrors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.description && <span className="text-xs text-red-500">{validationErrors.description}</span>}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between border-t border-gray-100 pt-5 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
              >
                Change Category
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg active:scale-95 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Category Specific Dynamic Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2">
                <span>{selectedCategory?.icon || '📁'}</span>
                <span>Category Specific Attributes</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Please provide specifications configured for the <strong>{selectedCategory?.name}</strong> category.</p>
            </div>

            {categoryFields.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl">
                No custom specifications fields configured for this category. Click Continue to skip.
              </div>
            ) : (
              <div className="space-y-5">
                {categoryFields.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    value={dynamicValues[field.key]}
                    onChange={handleDynamicChange}
                    error={validationErrors[field.key]}
                    formValues={dynamicValues} // Pass form values for conditional trigger evaluation
                  />
                ))}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between border-t border-gray-100 pt-5 mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg active:scale-95 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Product Image Uploads */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-950">Add Photos</h2>
              <p className="text-sm text-gray-500 mt-1">Upload clear photos showing your product. The first image will be set as primary.</p>
            </div>

            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <label className="flex flex-col items-center justify-center w-full aspect-[16/6] border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100/50 hover:border-brand-500 transition-colors select-none">
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <svg className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">Click to upload photos</span>
                  <span className="text-xs text-gray-400 mt-1">JPEG, PNG formats supported. Max size 5MB.</span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Previews grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                  {imagePreviews.map((previewUrl, idx) => (
                    <div key={idx} className="group aspect-square rounded-xl border border-gray-200 overflow-hidden bg-gray-50 relative">
                      <img src={previewUrl} alt={`preview ${idx}`} className="h-full w-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-2 left-2 rounded bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white transition-colors"
                        title="Remove photo"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between border-t border-gray-100 pt-5 mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg active:scale-95 transition-all"
              >
                Continue to Preview
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Preview before Submission */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-950">Review Your Listing</h2>
              <p className="text-sm text-gray-500 mt-1">Review the details below. Click Publish to post it on the marketplace.</p>
            </div>

            {/* Mock PDP View */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-gray-50/50">
              {/* Primary Image preview */}
              <div className="aspect-[16/7] w-full bg-gray-150 overflow-hidden border-b border-gray-200">
                {imagePreviews.length > 0 ? (
                  <img src={imagePreviews[0]} alt="Primary preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                    No images uploaded
                  </div>
                )}
              </div>

              {/* General details preview */}
              <div className="p-6 bg-white space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-flex rounded bg-brand-50 text-brand-600 text-xs px-2 py-0.5 font-bold uppercase tracking-wider">
                      {selectedCategory?.name}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{title}</h3>
                  </div>
                  <span className="text-2xl font-extrabold text-gray-950">
                    Rs. {parseFloat(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex gap-4 text-xs text-gray-500 font-semibold border-y border-gray-100 py-3">
                  <span>Condition: <strong className="text-gray-800 uppercase">{condition.replace('_', ' ')}</strong></span>
                  <span>Location: <strong className="text-gray-800">{location}</strong></span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-900">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
                </div>

                {/* Specs rendering */}
                <div className="space-y-2.5 pt-4 border-t border-gray-150">
                  <h4 className="text-sm font-bold text-gray-900">Specifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoryFields.map((cf) => {
                      if (!checkConditionSatisfied(cf.conditions, dynamicValues)) return null;
                      
                      const rawVal = dynamicValues[cf.key];
                      let displayVal = '—';
                      
                      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                        if (cf.field_type === 'boolean') displayVal = rawVal ? 'Yes' : 'No';
                        else if (Array.isArray(rawVal)) displayVal = rawVal.join(', ');
                        else displayVal = String(rawVal);
                      }

                      return (
                        <div key={cf.id} className="flex justify-between p-2.5 rounded-lg border border-gray-100 text-xs bg-gray-50/50">
                          <span className="font-semibold text-gray-500">{cf.label}</span>
                          <span className="font-bold text-gray-800 text-right">{displayVal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-between border-t border-gray-100 pt-5 mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitLoading}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow hover:shadow-lg active:scale-98 transition-all flex items-center gap-1.5"
              >
                {submitLoading ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
