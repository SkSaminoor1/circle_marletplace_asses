"""
Views for the demo wallet system.

Demonstrates transactional safety patterns:
- select_for_update() for pessimistic locking
- transaction.atomic() for atomicity
- Idempotency key checking to prevent double-processing
"""

from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db import transaction, IntegrityError

from .models import Wallet, WalletTransaction
from .serializers import (
    WalletSerializer,
    WalletTransactionSerializer,
    AddFundsSerializer,
    PurchaseSerializer,
)
from listings.models import Listing


class WalletViewSet(viewsets.ModelViewSet):
    """CRUD for demo wallets."""

    queryset = Wallet.objects.all()
    serializer_class = WalletSerializer

    @action(detail=True, methods=["get"])
    def transactions(self, request, pk=None):
        """GET /api/wallets/{id}/transactions/"""
        wallet = self.get_object()
        txns = wallet.transactions.all()[:50]
        serializer = WalletTransactionSerializer(txns, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="add-funds")
    def add_funds(self, request, pk=None):
        """
        POST /api/wallets/{id}/add-funds/
        Add demo funds to a wallet with idempotency protection.
        """
        serializer = AddFundsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data["amount"]
        idempotency_key = serializer.validated_data["idempotency_key"]

        # Check idempotency — return existing transaction if duplicate
        existing = WalletTransaction.objects.filter(
            idempotency_key=idempotency_key
        ).first()
        if existing:
            return Response(
                WalletTransactionSerializer(existing).data,
                status=status.HTTP_200_OK,
            )

        try:
            with transaction.atomic():
                wallet = Wallet.objects.select_for_update().get(pk=pk)
                wallet.balance += amount
                wallet.save()

                txn = WalletTransaction.objects.create(
                    wallet=wallet,
                    transaction_type=WalletTransaction.TransactionType.CREDIT,
                    amount=amount,
                    reference="Demo funds added",
                    idempotency_key=idempotency_key,
                )
        except IntegrityError:
            # Race condition on idempotency key — fetch and return
            existing = WalletTransaction.objects.get(
                idempotency_key=idempotency_key
            )
            return Response(
                WalletTransactionSerializer(existing).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            WalletTransactionSerializer(txn).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(["POST"])
def purchase_listing(request):
    """
    POST /api/wallets/purchase/

    Execute a demo marketplace purchase:
    1. Debit buyer wallet
    2. Credit seller wallet
    3. Mark listing as sold

    All within a single atomic transaction with pessimistic locking.
    """
    serializer = PurchaseSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    listing_id = serializer.validated_data["listing_id"]
    buyer_wallet_id = serializer.validated_data["buyer_wallet_id"]
    seller_wallet_id = serializer.validated_data["seller_wallet_id"]
    idempotency_key = serializer.validated_data["idempotency_key"]

    # Idempotency check
    existing = WalletTransaction.objects.filter(
        idempotency_key=idempotency_key
    ).first()
    if existing:
        return Response(
            {"message": "Transaction already processed."},
            status=status.HTTP_200_OK,
        )

    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        return Response(
            {"error": "Listing not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if listing.status == "sold":
        return Response(
            {"error": "Listing already sold."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    price = listing.price

    try:
        with transaction.atomic():
            # Lock both wallets (ordered by PK to prevent deadlocks)
            wallet_ids = sorted([buyer_wallet_id, seller_wallet_id])
            wallets = {
                w.id: w
                for w in Wallet.objects.select_for_update().filter(
                    id__in=wallet_ids
                )
            }

            buyer_wallet = wallets.get(buyer_wallet_id)
            seller_wallet = wallets.get(seller_wallet_id)

            if not buyer_wallet or not seller_wallet:
                return Response(
                    {"error": "Wallet not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if buyer_wallet.balance < price:
                return Response(
                    {"error": "Insufficient balance."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Debit buyer
            buyer_wallet.balance -= price
            buyer_wallet.save()

            # Credit seller
            seller_wallet.balance += price
            seller_wallet.save()

            # Record transactions
            WalletTransaction.objects.create(
                wallet=buyer_wallet,
                transaction_type=WalletTransaction.TransactionType.PURCHASE,
                amount=price,
                reference=f"Purchased: {listing.title}",
                idempotency_key=idempotency_key,
            )
            import uuid
            WalletTransaction.objects.create(
                wallet=seller_wallet,
                transaction_type=WalletTransaction.TransactionType.SALE,
                amount=price,
                reference=f"Sold: {listing.title}",
                idempotency_key=uuid.uuid4(),
            )

            # Mark listing sold
            listing.status = "sold"
            listing.save()

    except IntegrityError:
        return Response(
            {"message": "Transaction already processed (idempotency)."},
            status=status.HTTP_200_OK,
        )

    return Response(
        {"message": "Purchase completed successfully.", "listing_id": listing.id},
        status=status.HTTP_201_CREATED,
    )
