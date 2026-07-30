import ProductCard from './ProductCard';

export default function ProductGrid({ listings = [], loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-gray-150 bg-white animate-pulse">
            <div className="aspect-[4/3] w-full bg-gray-200"></div>
            <div className="p-4 flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 p-12 text-center bg-white shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </span>
        <h3 className="text-sm font-semibold text-gray-900">No listings found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search query, or create a new listing!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ProductCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
