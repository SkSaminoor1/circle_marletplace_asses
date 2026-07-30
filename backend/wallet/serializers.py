"""Serializers for the demo wallet system."""

from rest_framework import serializers
from .models import Wallet, WalletTransaction


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ["id", "owner", "balance", "created_at", "updated_at"]
        read_only_fields = ["balance", "created_at", "updated_at"]


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            "id", "wallet", "transaction_type", "amount",
            "reference", "status", "idempotency_key", "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]


from decimal import Decimal

class AddFundsSerializer(serializers.Serializer):
    """Input for adding demo funds to a wallet."""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    idempotency_key = serializers.UUIDField()


class PurchaseSerializer(serializers.Serializer):
    """Input for purchasing a listing."""
    listing_id = serializers.IntegerField()
    buyer_wallet_id = serializers.IntegerField()
    seller_wallet_id = serializers.IntegerField()
    idempotency_key = serializers.UUIDField()
