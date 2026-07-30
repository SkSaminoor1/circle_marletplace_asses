import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listingsApi } from '../api/listings';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Image gallery state
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Demo Wallets State
  const [buyerWallet, setBuyerWallet] = useState(null);
  const [sellerWallet, setSellerWallet] = useState(null);

  const loadListingDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listingsApi.retrieve(id);
      setListing(data);
      
      // Load demo wallets
      const walletsData = await listingsApi.getWallets();
      const results = walletsData.results || walletsData;
      const buyer = results.find(w => w.owner === 'buyer_demo');
      const seller = results.find(w => w.owner === 'seller_demo');
      setBuyerWallet(buyer);
      setSellerWallet(seller);
    } catch (err) {
      console.error(err);
      setError('Failed to load listing information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListingDetails();
  }, [id]);

  const handlePurchase = async () => {
    if (!buyerWallet || !sellerWallet || purchaseLoading) return;

    if (!window.confirm('Do you want to purchase this listing using your Demo Wallet? This will transfer funds between demo wallets.')) return;

    setPurchaseLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const idempotencyKey = crypto.randomUUID();
      await listingsApi.purchaseListing(
        listing.id,
        buyerWallet.id,
        sellerWallet.id,
        idempotencyKey
      );

      setSuccessMsg('Purchase completed successfully! This item is now marked as Sold.');
      
      // Reload listing details to show updated sold status and balances
      await loadListingDetails();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to complete purchase transaction.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        Loading product details...
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl inline-block max-w-lg">
          {error}
        </div>
        <div>
          <Link to="/" className="text-brand-600 hover:underline text-sm font-semibold">
            Return to Browse
          </Link>
        </div>
      </div>
    );
  }

  // Format price
  const formattedPrice = 'Rs. ' + parseFloat(listing.price).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const conditionLabels = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  };

  const images = listing.images || [];
  const primaryImageUrl = listing.primary_image;
  const fallbackImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back link */}
      <Link to="/" className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1">
        ← Back to Browse
      </Link>

      {/* Success banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium flex items-center gap-2 animate-fade-in">
          <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium flex items-center gap-2">
          <svg className="h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Layout Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col (7/12) - Media Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full rounded-2xl border border-gray-150 overflow-hidden bg-white relative">
            {listing.status === 'sold' && (
              <span className="absolute top-4 left-4 z-10 rounded-xl bg-gray-900/90 backdrop-blur-md px-3 py-1.5 text-xs font-extrabold text-white uppercase tracking-wider shadow">
                Sold Out
              </span>
            )}
            <img
              src={images.length > 0 ? images[activeImageIdx]?.image_url : fallbackImage}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Thumbnails list */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-20 w-20 shrink-0 rounded-lg border overflow-hidden transition-all bg-white ${
                    activeImageIdx === idx ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-gray-200'
                  }`}
                >
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Col (5/12) - Product info & Purchase Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <span className="inline-flex rounded bg-brand-50 text-brand-600 text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider">
                {listing.category_name}
              </span>
              <h1 className="text-2xl font-bold text-gray-950 mt-1.5 leading-snug">{listing.title}</h1>
            </div>

            <div className="flex items-baseline justify-between border-y border-gray-100 py-3 gap-2">
              <span className="text-3xl font-extrabold text-gray-950">{formattedPrice}</span>
              <span className="text-xs text-gray-400">Condition: <strong className="text-gray-700 uppercase">{conditionLabels[listing.condition] || listing.condition}</strong></span>
            </div>

            {/* Info cards (Location, Posted time) */}
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-1.5 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                </svg>
                <span>Posted {new Date(listing.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Demo wallet purchase details */}
            <div className="pt-2">
              {listing.status === 'active' ? (
                <div className="space-y-3">
                  <button
                    onClick={handlePurchase}
                    disabled={purchaseLoading || !buyerWallet}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/10 hover:shadow-lg active:scale-98 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    {purchaseLoading ? 'Processing Purchase...' : 'Buy Now with Demo Wallet'}
                  </button>
                  {buyerWallet && parseFloat(buyerWallet.balance) < parseFloat(listing.price) && (
                    <p className="text-[11px] text-red-500 font-medium text-center">
                      Insufficient wallet balance. Please add demo funds from the navbar.
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2.5 text-center text-sm font-bold text-gray-500 bg-gray-100 rounded-xl border border-gray-200">
                  Product Sold
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specifications Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Description panel (2/3 width) */}
        <div className="md:col-span-2 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-gray-950">Description</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
        </div>

        {/* Specifications panel (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-950">Product Specifications</h2>
          {listing.field_values && listing.field_values.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {listing.field_values.map((fv) => (
                <div key={fv.field_id} className="flex justify-between py-2.5 first:pt-0 last:pb-0 gap-4 text-xs">
                  <span className="font-semibold text-gray-500">{fv.label}</span>
                  <span className="font-bold text-gray-800 text-right">{fv.display_value || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-2">No specifications configured or provided.</p>
          )}
        </div>
      </div>
    </div>
  );
}
