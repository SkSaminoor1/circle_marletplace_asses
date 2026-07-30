import { Link } from 'react-router-dom';

export default function ProductCard({ listing }) {
  const { id, title, price, category_name, condition, location, primary_image, status } = listing;

  // Format price
  const formattedPrice = 'Rs. ' + parseFloat(price).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Condition human readable labels
  const conditionLabels = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  };

  const conditionColors = {
    new: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    like_new: 'bg-blue-50 text-blue-700 border-blue-100',
    good: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    fair: 'bg-amber-50 text-amber-700 border-amber-100',
    poor: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  // Fallback image SVG if no images
  const fallbackImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;

  return (
    <Link 
      to={`/listing/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white hover:border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
    >
      {/* Sold Badge */}
      {status === 'sold' && (
        <span className="absolute top-3 left-3 z-10 rounded-lg bg-gray-900/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider shadow">
          Sold
        </span>
      )}

      {/* Image container */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 relative border-b border-gray-100">
        <img
          src={primary_image || fallbackImage}
          alt={title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide">
          {category_name}
        </span>
      </div>

      {/* Details container */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-brand-600 transition-colors" title={title}>
              {title}
            </h3>
          </div>
          
          {/* Price */}
          <p className="text-lg font-bold text-gray-950 mb-3">{formattedPrice}</p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto">
          {/* Condition tag */}
          <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${conditionColors[condition] || 'bg-gray-50'}`}>
            {conditionLabels[condition] || condition}
          </span>
          {/* Location */}
          <span className="flex items-center gap-1 text-xs text-gray-500 max-w-[120px] truncate" title={location}>
            <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{location}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
