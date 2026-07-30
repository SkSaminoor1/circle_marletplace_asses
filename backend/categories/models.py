"""
Models for the dynamic category/field schema system.

Architecture overview:
- Category: a product category (e.g. "Mobile Phone", "Laptop").
- FieldDefinition: a reusable field type template (e.g. "Brand", "RAM").
- CategoryField: binds a FieldDefinition to a Category with per-category
  configuration (label, validation, display order, etc.).
- FieldOption: selectable options for SELECT / RADIO / CHECKBOX fields.
- FieldCondition: conditional-visibility rules ("show field X when field Y = Z").

Options and conditions are stored in normalized tables rather than JSONFields
because they benefit from referential integrity, admin queryability, and
straightforward Django ORM usage — while still being fully flexible.
"""

from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """A marketplace product category (e.g. Mobile Phone, Laptop, Sofa)."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, default="")
    icon = models.CharField(max_length=50, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class FieldDefinition(models.Model):
    """
    A reusable field blueprint that can be attached to multiple categories.

    Stores the *type* and a human-friendly name. Per-category overrides
    (label, placeholder, validation) live on CategoryField.
    """

    class FieldType(models.TextChoices):
        TEXT = "text", "Text"
        TEXTAREA = "textarea", "Textarea"
        NUMBER = "number", "Number"
        SELECT = "select", "Select"
        RADIO = "radio", "Radio"
        CHECKBOX = "checkbox", "Checkbox / Multiselect"
        BOOLEAN = "boolean", "Boolean (Yes/No)"
        DATE = "date", "Date"

    name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FieldType.choices)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_field_type_display()})"


class CategoryField(models.Model):
    """
    Binds a FieldDefinition to a Category with per-category configuration.

    This is the "column definition" that drives the dynamic form:
    the frontend reads these records to know which fields to render
    for a given category.
    """

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="category_fields",
    )
    field_definition = models.ForeignKey(
        FieldDefinition,
        on_delete=models.CASCADE,
        related_name="category_fields",
    )

    # Display / UX
    label = models.CharField(max_length=150)
    key = models.SlugField(
        max_length=100,
        help_text="Machine-readable key used in API payloads (auto-generated from label).",
    )
    placeholder = models.CharField(max_length=200, blank=True, default="")
    help_text = models.CharField(max_length=300, blank=True, default="")
    required = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    default_value = models.CharField(max_length=255, blank=True, default="")

    # Validation constraints (nullable = not configured)
    min_value = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    max_value = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    min_length = models.PositiveIntegerField(null=True, blank=True)
    max_length = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]
        unique_together = [("category", "key")]

    def __str__(self):
        return f"{self.category.name} → {self.label}"

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = slugify(self.label).replace("-", "_")
        super().save(*args, **kwargs)


class FieldOption(models.Model):
    """
    A selectable option for SELECT / RADIO / CHECKBOX category fields.

    Stored in a normalized table for referential integrity, easy admin
    editing, and clean validation (check submitted value ∈ defined options).
    """

    category_field = models.ForeignKey(
        CategoryField,
        on_delete=models.CASCADE,
        related_name="options",
    )
    label = models.CharField(max_length=150)
    value = models.CharField(max_length=150)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"{self.category_field.label} — {self.label}"


class FieldCondition(models.Model):
    """
    A conditional-visibility rule: "show *this* CategoryField only when
    *depends_on* field satisfies <operator> <value>."

    Operators are generic — not tied to any specific category or field name.
    """

    class Operator(models.TextChoices):
        EQUALS = "equals", "Equals"
        NOT_EQUALS = "not_equals", "Does not equal"
        CONTAINS = "contains", "Contains"
        NOT_CONTAINS = "not_contains", "Does not contain"
        GREATER_THAN = "greater_than", "Greater than"
        LESS_THAN = "less_than", "Less than"

    category_field = models.ForeignKey(
        CategoryField,
        on_delete=models.CASCADE,
        related_name="conditions",
        help_text="The field whose visibility is controlled.",
    )
    depends_on = models.ForeignKey(
        CategoryField,
        on_delete=models.CASCADE,
        related_name="dependents",
        help_text="The field whose value is evaluated.",
    )
    operator = models.CharField(max_length=20, choices=Operator.choices)
    value = models.CharField(
        max_length=255,
        help_text='The value to compare against (e.g. "true", "256").',
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return (
            f"Show «{self.category_field.label}» when "
            f"«{self.depends_on.label}» {self.get_operator_display()} {self.value}"
        )
