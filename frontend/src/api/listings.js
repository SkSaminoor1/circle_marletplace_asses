import api from './axios';

export const listingsApi = {
  list: (params) => api.get('/listings/', { params }).then((res) => res.data),
  retrieve: (id) => api.get(`/listings/${id}/`).then((res) => res.data),
  create: (formData) => {
    // Send as multipart/form-data for image uploads
    return api.post('/listings/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((res) => res.data);
  },
  update: (id, data) => api.patch(`/listings/${id}/`, data).then((res) => res.data),
  delete: (id) => api.delete(`/listings/${id}/`).then((res) => res.data),
  uploadImages: (id, formData) => {
    return api.post(`/listings/${id}/images/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((res) => res.data);
  },
  deleteImage: (id, imageId) => api.delete(`/listings/${id}/images/${imageId}/`).then((res) => res.data),

  // Demo Wallet Endpoints
  getWallets: () => api.get('/wallets/').then((res) => res.data),
  getWallet: (id) => api.get(`/wallets/${id}/`).then((res) => res.data),
  getWalletTransactions: (id) => api.get(`/wallets/${id}/transactions/`).then((res) => res.data),
  addFunds: (id, amount, idempotencyKey) => {
    return api.post(`/wallets/${id}/add-funds/`, { amount, idempotency_key: idempotencyKey }).then((res) => res.data);
  },
  purchaseListing: (listingId, buyerWalletId, sellerWalletId, idempotencyKey) => {
    return api.post('/wallets/purchase/', {
      listing_id: listingId,
      buyer_wallet_id: buyerWalletId,
      seller_wallet_id: sellerWalletId,
      idempotency_key: idempotencyKey,
    }).then((res) => res.data);
  },
};
