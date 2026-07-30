"""
Tests for the demo wallet system.

Covers: fund addition, purchase flow, insufficient balance,
idempotency key duplicate prevention, and double-purchase prevention.
"""

import uuid
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import Wallet, WalletTransaction
from listings.models import Listing
from categories.models import Category


class WalletFundsTest(TestCase):
    """Tests for adding demo funds."""

    def setUp(self):
        self.client = APIClient()
        self.wallet = Wallet.objects.create(owner="test_user", balance=Decimal("0.00"))

    def test_add_funds(self):
        key = uuid.uuid4()
        resp = self.client.post(
            f"/api/wallets/{self.wallet.id}/add-funds/",
            {"amount": "100.00", "idempotency_key": str(key)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal("100.00"))

    def test_duplicate_idempotency_key(self):
        key = uuid.uuid4()
        # First request
        self.client.post(
            f"/api/wallets/{self.wallet.id}/add-funds/",
            {"amount": "100.00", "idempotency_key": str(key)},
            format="json",
        )
        # Duplicate request — should not double-credit
        resp = self.client.post(
            f"/api/wallets/{self.wallet.id}/add-funds/",
            {"amount": "100.00", "idempotency_key": str(key)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal("100.00"))  # not 200


class PurchaseTest(TestCase):
    """Tests for the purchase flow."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Test Category")
        self.listing = Listing.objects.create(
            category=self.category,
            title="Test Item",
            description="For testing",
            price=Decimal("50.00"),
            condition="good",
            location="Test City",
            status="active",
        )
        self.buyer = Wallet.objects.create(
            owner="buyer_test", balance=Decimal("200.00")
        )
        self.seller = Wallet.objects.create(
            owner="seller_test", balance=Decimal("0.00")
        )

    def test_successful_purchase(self):
        key = uuid.uuid4()
        resp = self.client.post("/api/wallets/purchase/", {
            "listing_id": self.listing.id,
            "buyer_wallet_id": self.buyer.id,
            "seller_wallet_id": self.seller.id,
            "idempotency_key": str(key),
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        self.buyer.refresh_from_db()
        self.seller.refresh_from_db()
        self.listing.refresh_from_db()

        self.assertEqual(self.buyer.balance, Decimal("150.00"))
        self.assertEqual(self.seller.balance, Decimal("50.00"))
        self.assertEqual(self.listing.status, "sold")

    def test_insufficient_balance(self):
        self.buyer.balance = Decimal("10.00")
        self.buyer.save()

        resp = self.client.post("/api/wallets/purchase/", {
            "listing_id": self.listing.id,
            "buyer_wallet_id": self.buyer.id,
            "seller_wallet_id": self.seller.id,
            "idempotency_key": str(uuid.uuid4()),
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Insufficient", resp.data["error"])

    def test_double_purchase_prevented(self):
        key = uuid.uuid4()
        # First purchase
        self.client.post("/api/wallets/purchase/", {
            "listing_id": self.listing.id,
            "buyer_wallet_id": self.buyer.id,
            "seller_wallet_id": self.seller.id,
            "idempotency_key": str(key),
        }, format="json")

        # Second purchase attempt with different key
        resp = self.client.post("/api/wallets/purchase/", {
            "listing_id": self.listing.id,
            "buyer_wallet_id": self.buyer.id,
            "seller_wallet_id": self.seller.id,
            "idempotency_key": str(uuid.uuid4()),
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already sold", resp.data["error"])
