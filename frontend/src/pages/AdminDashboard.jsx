import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/categories';
import { listingsApi } from '../api/listings';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    categories: 0,
    fields: 0,
    listings: 0,
    wallets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [cats, fields, listings, wallets] = await Promise.all([
          categoriesApi.list(),
          categoriesApi.listFields(),
          listingsApi.list(),
          listingsApi.getWallets(),
        ]);

        setStats({
          categories: cats.count || cats.length || 0,
          fields: fields.count || fields.length || 0,
          listings: listings.count || listings.length || 0,
          wallets: wallets.count || wallets.length || 0,
        });
      } catch (err) {
        console.error('Error loading admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const adminCards = [
    {
      title: 'Category Manager',
      description: 'Create new categories, activate/deactivate them, and configure their custom form schema fields, options, and conditional visibility.',
      link: '/admin/categories',
      icon: (
        <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      count: stats.categories,
      countLabel: 'Active Categories',
    },
    {
      title: 'Field Blueprint Templates',
      description: 'Manage the global library of reusable field definitions (e.g. Brand, Storage, Processor) that can be assigned to multiple categories.',
      link: '/admin/fields',
      icon: (
        <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      count: stats.fields,
      countLabel: 'Field Definitions',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm max-w-2xl">
          Configure the metadata-driven schemas, manage product categories, global field definitions, and monitor marketplace activity.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Categories', val: stats.categories, bg: 'bg-brand-50 border-brand-100 text-brand-700' },
          { label: 'Field Templates', val: stats.fields, bg: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
          { label: 'Listings', val: stats.listings, bg: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
          { label: 'Demo Wallets', val: stats.wallets, bg: 'bg-amber-50 border-amber-100 text-amber-700' },
        ].map((s, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border ${s.bg} flex flex-col justify-between shadow-sm`}>
            <span className="text-xs font-bold uppercase tracking-wider opacity-85">{s.label}</span>
            <span className="text-2xl sm:text-3xl font-extrabold mt-2 leading-none">
              {loading ? '...' : s.val}
            </span>
          </div>
        ))}
      </div>

      {/* Manager Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card, idx) => (
          <div key={idx} className="flex flex-col bg-white border border-gray-150 rounded-2xl p-6 shadow-sm justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 border border-brand-100 shadow-sm">
                  {card.icon}
                </span>
                <h2 className="text-lg font-bold text-gray-950">{card.title}</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-500">{card.countLabel}</span>
                <span className="font-bold text-gray-950 text-sm">{loading ? '...' : card.count}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50">
              <Link
                to={card.link}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gray-950 text-white text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all"
              >
                <span>Manage {card.title.split(' ')[0]}s</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
