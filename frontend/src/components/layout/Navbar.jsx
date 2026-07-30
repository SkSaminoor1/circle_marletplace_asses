import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { listingsApi } from '../../api/listings';

export default function Navbar() {
  const [buyerWallet, setBuyerWallet] = useState(null);
  const [sellerWallet, setSellerWallet] = useState(null);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [addingFunds, setAddingFunds] = useState(false);
  const location = useLocation();

  // Fetch wallets for demo representation
  const fetchWallets = async () => {
    try {
      const data = await listingsApi.getWallets();
      const results = data.results || data;
      const buyer = results.find(w => w.owner === 'buyer_demo');
      const seller = results.find(w => w.owner === 'seller_demo');
      setBuyerWallet(buyer);
      setSellerWallet(seller);
    } catch (err) {
      console.error("Error fetching wallets:", err);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [location.pathname]); // Refresh on navigation to show balance changes

  const handleAddFunds = async (walletId) => {
    if (addingFunds) return;
    setAddingFunds(true);
    try {
      // Add Rs. 250 demo funds
      const uuid = crypto.randomUUID();
      await listingsApi.addFunds(walletId, "250.00", uuid);
      await fetchWallets();
    } catch (err) {
      console.error("Error adding demo funds:", err);
    } finally {
      setAddingFunds(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold text-lg shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
                C
              </span>
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Circle Marketplace
              </span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-50 text-brand-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                Browse Listings
              </NavLink>
              <NavLink 
                to="/admin" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-50 text-brand-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                Admin Dashboard
              </NavLink>
            </nav>
          </div>

          {/* Action Buttons & Wallet */}
          <div className="flex items-center gap-3">
            {/* Demo Wallet Controls */}
            <div className="relative">
              <button 
                onClick={() => setShowWalletDetails(!showWalletDetails)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 shadow-sm"
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Demo Wallet: Rs. {buyerWallet ? parseFloat(buyerWallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
                <svg className={`h-3 w-3 text-gray-400 transition-transform ${showWalletDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showWalletDetails && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-100 bg-white p-4 shadow-xl ring-1 ring-black/5 z-50">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Demo Wallets</h3>
                  
                  {/* Buyer Demo Wallet */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Buyer Wallet</div>
                      <div className="text-xs text-gray-500">For purchasing products</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand-600">Rs. {buyerWallet ? parseFloat(buyerWallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
                      <button 
                        disabled={addingFunds}
                        onClick={() => handleAddFunds(buyerWallet?.id)}
                        className="text-[10px] text-brand-500 hover:text-brand-600 font-bold hover:underline"
                      >
                        + Add Rs. 250
                      </button>
                    </div>
                  </div>

                  {/* Seller Demo Wallet */}
                  <div className="flex items-center justify-between py-2 mt-1">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Seller Wallet</div>
                      <div className="text-xs text-gray-500">Receives listing sale credits</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-700">Rs. {sellerWallet ? parseFloat(sellerWallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
                      <button 
                        disabled={addingFunds}
                        onClick={() => handleAddFunds(sellerWallet?.id)}
                        className="text-[10px] text-brand-500 hover:text-brand-600 font-bold hover:underline"
                      >
                        + Add Rs. 250
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-[10px] text-gray-400 leading-normal border-t border-gray-100 pt-2">
                    * This is a demo transaction simulation. No real money or gateways are involved.
                  </div>
                </div>
              )}
            </div>

            {/* Sell Product Button */}
            <Link
              to="/sell"
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/10 hover:bg-brand-500 hover:shadow-brand-500/20 active:scale-95 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Sell Product</span>
            </Link>

            {/* Mobile Admin Nav Link */}
            <Link
              to="/admin"
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              title="Admin Panel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0x" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
