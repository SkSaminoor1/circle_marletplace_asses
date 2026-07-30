import { useState, useEffect } from 'react';
import { categoriesApi } from '../api/categories';
import { listingsApi } from '../api/listings';
import ProductGrid from '../components/listings/ProductGrid';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search & Sort states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [ordering, setOrdering] = useState('-created_at');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        condition: selectedCondition || undefined,
        ordering,
        status: 'active', // Only show active items
      };

      const [listingsData, categoriesData] = await Promise.all([
        listingsApi.list(params),
        categoriesApi.list({ is_active: true }),
      ]);

      setListings(listingsData.results || listingsData);
      setCategories(categoriesData.results || categoriesData);
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedCondition, ordering]); // Auto reload on filter selection

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedCondition('');
    setOrdering('-created_at');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero section */}
      <div className="relative rounded-3xl bg-gradient-to-tr from-brand-900 via-brand-850 to-brand-700 px-6 py-12 sm:px-12 sm:py-16 text-white overflow-hidden shadow-xl shadow-brand-900/10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-brand-100 border border-white/5">
            ✨ Sustainable Shopping
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Give Products a Second Circle of Life.
          </h1>
          <p className="text-brand-100 text-sm sm:text-base leading-relaxed max-w-lg">
            Discover quality pre-owned products, verified specifications, and metadata-driven category details directly from trusted sellers.
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="What are you looking for?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none"
            />
            <span className="absolute left-3.5 top-3.5 text-gray-400">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-[200px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-300 focus:border-brand-500 bg-white text-sm outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div className="w-full md:w-[160px]">
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-300 focus:border-brand-500 bg-white text-sm outline-none cursor-pointer"
            >
              <option value="">All Conditions</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="w-full md:w-[180px]">
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-300 focus:border-brand-500 bg-white text-sm outline-none cursor-pointer"
            >
              <option value="-created_at">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="title">Title: A-Z</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 md:flex-initial px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow active:scale-95 transition-all"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold active:scale-95 transition-all"
              title="Reset Filters"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Grid listing */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Recent Listings</h2>
          <span className="text-xs text-gray-500 font-semibold">{listings.length} products available</span>
        </div>

        <ProductGrid listings={listings} loading={loading} />
      </div>
    </div>
  );
}
