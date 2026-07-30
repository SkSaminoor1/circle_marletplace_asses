"""Django Admin registration for demo wallet."""

from django.contrib import admin
from .models import Wallet, WalletTransaction


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ["owner", "balance", "created_at"]
    search_fields = ["owner"]


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = [
        "wallet", "transaction_type", "amount", "status",
        "idempotency_key", "created_at",
    ]
    list_filter = ["transaction_type", "status"]
    readonly_fields = ["idempotency_key"]
