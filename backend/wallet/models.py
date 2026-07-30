"""
Demo Wallet models.

This is a DEMONSTRATION of transactional backend design for a marketplace
wallet system. It is NOT a production financial system and does NOT integrate
with any real payment gateway.

Key design principles:
- DecimalField for money (never float)
- select_for_update() for concurrency safety
- Idempotency keys to prevent double-processing
- Database transactions for atomicity
"""

import uuid
from django.db import models


class Wallet(models.Model):
    """
    A demo marketplace wallet tied to a user identifier.

    In a real system this would be linked to Django's auth User model.
    Here we use a simple string identifier for demo purposes.
    """

    owner = models.CharField(
        max_length=100,
        unique=True,
        help_text="Demo user identifier (e.g. 'buyer_demo', 'seller_demo').",
    )
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Current balance in demo currency.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.owner} — Balance: {self.balance}"


class WalletTransaction(models.Model):
    """
    Immutable record of a wallet balance change.

    Uses idempotency_key to prevent duplicate processing of the
    same logical operation (e.g. double-clicking "Buy" button).
    """

    class TransactionType(models.TextChoices):
        CREDIT = "credit", "Credit (Add Funds)"
        DEBIT = "debit", "Debit (Withdraw)"
        PURCHASE = "purchase", "Purchase (Buyer Debit)"
        SALE = "sale", "Sale (Seller Credit)"

    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Human-readable reference (e.g. listing title).",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.COMPLETED,
    )
    idempotency_key = models.UUIDField(
        unique=True,
        default=uuid.uuid4,
        help_text="Unique key to prevent duplicate transactions.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.get_transaction_type_display()} "
            f"{'+'if self.transaction_type in ('credit','sale') else '-'}"
            f"{self.amount} — {self.wallet.owner}"
        )
