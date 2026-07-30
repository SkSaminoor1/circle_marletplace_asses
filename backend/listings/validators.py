"""
Dynamic field validation engine.

Validates user-submitted dynamic field values against the schema
defined by CategoryField records. This is the authoritative backend
validation — frontend validation is for UX only.

Supports: required, min/max value, min/max length, valid options,
date format, boolean coercion, and conditional-field awareness.
"""

from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from categories.models import CategoryField, FieldCondition


def validate_dynamic_fields(category, field_values_data):
    """
    Validate a dict of {category_field_id: raw_value} against the
    category's field configuration.

    Returns (cleaned_values, errors) where:
    - cleaned_values: list of dicts ready for ListingFieldValue creation
    - errors: dict of {category_field_id: [error_messages]}
    """
    errors = {}
    cleaned = []

    # Load all fields for this category
    category_fields = (
        CategoryField.objects
        .filter(category=category)
        .select_related("field_definition")
        .prefetch_related("options", "conditions__depends_on")
        .order_by("display_order")
    )

    # Build lookup: category_field.id → submitted value
    submitted = {str(k): v for k, v in field_values_data.items()}

    for cf in category_fields:
        cf_id = str(cf.id)
        raw_value = submitted.get(cf_id)
        field_type = cf.field_definition.field_type

        # ── Check conditional visibility ──
        if not _should_field_be_visible(cf, submitted, category_fields):
            # Field is hidden by a condition — skip validation, don't store
            continue

        # ── Required check ──
        if cf.required and _is_empty(raw_value, field_type):
            errors.setdefault(cf_id, []).append(
                f"{cf.label} is required."
            )
            continue

        # Skip validation if value is empty and not required
        if _is_empty(raw_value, field_type):
            continue

        # ── Type-specific validation & cleaning ──
        field_errors = []
        cleaned_value = _validate_and_clean(cf, raw_value, field_errors)

        if field_errors:
            errors[cf_id] = field_errors
        else:
            cleaned.append({
                "category_field": cf,
                "field_type": field_type,
                "value": cleaned_value,
            })

    return cleaned, errors


def _is_empty(value, field_type):
    """Check if a submitted value is effectively empty."""
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, list) and len(value) == 0:
        return True
    return False


def _should_field_be_visible(category_field, submitted, all_fields):
    """
    Evaluate conditional-visibility rules for a field.

    A field is visible if ALL its conditions are satisfied.
    If there are no conditions, the field is always visible.
    """
    conditions = category_field.conditions.all()
    if not conditions:
        return True

    for cond in conditions:
        depends_on_id = str(cond.depends_on_id)
        dep_value = submitted.get(depends_on_id)

        if dep_value is None:
            dep_value = ""

        # Normalize boolean-like values for comparison
        dep_str = str(dep_value).lower().strip()
        cond_str = str(cond.value).lower().strip()

        if cond.operator == "equals":
            if dep_str != cond_str:
                return False
        elif cond.operator == "not_equals":
            if dep_str == cond_str:
                return False
        elif cond.operator == "contains":
            if cond_str not in dep_str:
                return False
        elif cond.operator == "not_contains":
            if cond_str in dep_str:
                return False
        elif cond.operator == "greater_than":
            try:
                if Decimal(dep_str) <= Decimal(cond_str):
                    return False
            except (InvalidOperation, ValueError):
                return False
        elif cond.operator == "less_than":
            try:
                if Decimal(dep_str) >= Decimal(cond_str):
                    return False
            except (InvalidOperation, ValueError):
                return False

    return True


def _validate_and_clean(category_field, raw_value, errors):
    """
    Validate and clean a single field value.
    Appends error messages to `errors` list.
    Returns cleaned value on success.
    """
    field_type = category_field.field_definition.field_type

    if field_type == "text" or field_type == "textarea":
        return _validate_text(category_field, raw_value, errors)
    elif field_type == "number":
        return _validate_number(category_field, raw_value, errors)
    elif field_type == "boolean":
        return _validate_boolean(raw_value, errors)
    elif field_type == "date":
        return _validate_date(raw_value, errors)
    elif field_type in ("select", "radio"):
        return _validate_option(category_field, raw_value, errors)
    elif field_type == "checkbox":
        return _validate_checkbox(category_field, raw_value, errors)
    else:
        errors.append(f"Unknown field type: {field_type}")
        return None


def _validate_text(cf, value, errors):
    """Validate text/textarea value."""
    text = str(value).strip()

    if cf.min_length and len(text) < cf.min_length:
        errors.append(
            f"{cf.label} must be at least {cf.min_length} characters."
        )
    if cf.max_length and len(text) > cf.max_length:
        errors.append(
            f"{cf.label} must be at most {cf.max_length} characters."
        )

    return text


def _validate_number(cf, value, errors):
    """Validate numeric value."""
    try:
        num = Decimal(str(value))
    except (InvalidOperation, ValueError):
        errors.append(f"{cf.label} must be a valid number.")
        return None

    if cf.min_value is not None and num < cf.min_value:
        errors.append(
            f"{cf.label} must be at least {cf.min_value}."
        )
    if cf.max_value is not None and num > cf.max_value:
        errors.append(
            f"{cf.label} must be at most {cf.max_value}."
        )

    return num


def _validate_boolean(value, errors):
    """Validate and coerce boolean value."""
    if isinstance(value, bool):
        return value

    str_val = str(value).lower().strip()
    if str_val in ("true", "1", "yes"):
        return True
    elif str_val in ("false", "0", "no", ""):
        return False
    else:
        errors.append("Must be a boolean value (true/false).")
        return None


def _validate_date(value, errors):
    """Validate date string (ISO format YYYY-MM-DD)."""
    if isinstance(value, date):
        return value

    try:
        return datetime.strptime(str(value).strip(), "%Y-%m-%d").date()
    except ValueError:
        errors.append("Must be a valid date (YYYY-MM-DD).")
        return None


def _validate_option(cf, value, errors):
    """Validate that value is one of the defined options."""
    valid_values = set(cf.options.values_list("value", flat=True))

    if not valid_values:
        # No options defined — accept any text
        return str(value).strip()

    str_val = str(value).strip()
    if str_val not in valid_values:
        errors.append(
            f"{cf.label}: '{str_val}' is not a valid option. "
            f"Valid: {', '.join(sorted(valid_values))}"
        )
        return None

    return str_val


def _validate_checkbox(cf, value, errors):
    """Validate multiselect / checkbox values (expects a list)."""
    if isinstance(value, str):
        # Accept comma-separated or single value
        values = [v.strip() for v in value.split(",") if v.strip()]
    elif isinstance(value, list):
        values = [str(v).strip() for v in value]
    else:
        errors.append(f"{cf.label} must be a list of values.")
        return None

    valid_values = set(cf.options.values_list("value", flat=True))

    if valid_values:
        invalid = [v for v in values if v not in valid_values]
        if invalid:
            errors.append(
                f"{cf.label}: invalid option(s): {', '.join(invalid)}. "
                f"Valid: {', '.join(sorted(valid_values))}"
            )
            return None

    return values
