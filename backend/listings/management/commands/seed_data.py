"""
Management command to seed the database with sample categories,
field definitions, category-field assignments, and sample listings.

Usage:
    python manage.py seed_data

Creates:
- 3 categories: Mobile Phone, Laptop, Sofa
- Field definitions for each with proper types
- Sample listings with dynamic attribute values
- Demo wallets for the wallet system
- Demonstrates: text, textarea, number, select, radio, checkbox, boolean, date, conditional fields
"""

from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction

from categories.models import (
    Category,
    FieldDefinition,
    CategoryField,
    FieldOption,
    FieldCondition,
)
from listings.models import Listing, ListingFieldValue
from wallet.models import Wallet


class Command(BaseCommand):
    help = "Seed database with sample categories, fields, listings, and wallets."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("[Seed] Seeding database...")

        self._create_field_definitions()
        self._create_categories()
        self._create_sample_listings()
        self._create_demo_wallets()
        self._create_admin_user()

        self.stdout.write(self.style.SUCCESS("[Success] Seed data created successfully!"))

    def _create_field_definitions(self):
        """Create reusable field definition templates."""
        self.stdout.write("  Creating field definitions...")

        defs = [
            ("Brand", "text"),
            ("Model", "text"),
            ("Storage", "select"),
            ("RAM", "select"),
            ("Original Box", "boolean"),
            ("Battery Health", "number"),
            ("Processor", "text"),
            ("Graphics Card", "text"),
            ("Material", "select"),
            ("Seating Capacity", "number"),
            ("Pet Friendly", "boolean"),
            ("Dimensions", "text"),
            ("Under Warranty", "boolean"),
            ("Warranty Expiry Date", "date"),
            ("Color", "radio"),
            ("Accessories Included", "checkbox"),
            ("Condition Notes", "textarea"),
        ]

        self.field_defs = {}
        for name, field_type in defs:
            fd, _ = FieldDefinition.objects.get_or_create(
                name=name,
                defaults={"field_type": field_type},
            )
            self.field_defs[name] = fd

        self.stdout.write(f"    - {len(self.field_defs)} field definitions")

    def _create_categories(self):
        """Create categories with field assignments, options, and conditions."""
        self.stdout.write("  Creating categories...")

        self._create_mobile_phone()
        self._create_laptop()
        self._create_sofa()

    def _create_mobile_phone(self):
        cat, _ = Category.objects.get_or_create(
            name="Mobile Phone",
            defaults={
                "description": "Smartphones and feature phones",
                "icon": "📱",
            },
        )
        self.cat_mobile = cat

        # Brand (text, required)
        cf_brand = self._assign_field(cat, "Brand", "Brand", "brand", 1, required=True, placeholder="e.g. Apple, Samsung")
        # Model (text, required)
        cf_model = self._assign_field(cat, "Model", "Model", "model", 2, required=True, placeholder="e.g. iPhone 14 Pro")
        # Storage (select, required)
        cf_storage = self._assign_field(cat, "Storage", "Storage", "storage", 3, required=True)
        self._add_options(cf_storage, [("32 GB", "32"), ("64 GB", "64"), ("128 GB", "128"), ("256 GB", "256"), ("512 GB", "512"), ("1 TB", "1024")])
        # RAM (select)
        cf_ram = self._assign_field(cat, "RAM", "RAM", "ram", 4, required=True)
        self._add_options(cf_ram, [("2 GB", "2"), ("4 GB", "4"), ("6 GB", "6"), ("8 GB", "8"), ("12 GB", "12"), ("16 GB", "16")])
        # Original Box (boolean)
        self._assign_field(cat, "Original Box", "Original Box Included", "original_box", 5)
        # Battery Health (number, 0-100)
        self._assign_field(cat, "Battery Health", "Battery Health (%)", "battery_health", 6, min_value=0, max_value=100, placeholder="e.g. 91")
        # Color (radio)
        cf_color = self._assign_field(cat, "Color", "Color", "color", 7)
        self._add_options(cf_color, [("Black", "black"), ("White", "white"), ("Blue", "blue"), ("Red", "red"), ("Gold", "gold"), ("Other", "other")])
        # Under Warranty (boolean)
        cf_warranty = self._assign_field(cat, "Under Warranty", "Under Warranty?", "under_warranty", 8)
        # Warranty Expiry Date (date, conditional)
        cf_expiry = self._assign_field(cat, "Warranty Expiry Date", "Warranty Expiry Date", "warranty_expiry", 9, required=True, help_text="When does the warranty expire?")
        FieldCondition.objects.get_or_create(
            category_field=cf_expiry,
            depends_on=cf_warranty,
            defaults={"operator": "equals", "value": "true"},
        )
        # Condition Notes (textarea)
        self._assign_field(cat, "Condition Notes", "Additional Condition Notes", "condition_notes", 10, placeholder="Any scratches, dents, or issues?", max_length=500)

        self.stdout.write(f"    - Mobile Phone: {cat.category_fields.count()} fields")

    def _create_laptop(self):
        cat, _ = Category.objects.get_or_create(
            name="Laptop",
            defaults={
                "description": "Portable computers and notebooks",
                "icon": "💻",
            },
        )
        self.cat_laptop = cat

        self._assign_field(cat, "Brand", "Brand", "brand", 1, required=True, placeholder="e.g. Apple, Dell, Lenovo")
        self._assign_field(cat, "Model", "Model", "model", 2, required=True, placeholder="e.g. MacBook Pro 14")
        self._assign_field(cat, "Processor", "Processor", "processor", 3, required=True, placeholder="e.g. Apple M2 Pro, Intel i7-13700H")
        cf_ram = self._assign_field(cat, "RAM", "RAM", "ram", 4, required=True)
        self._add_options(cf_ram, [("4 GB", "4"), ("8 GB", "8"), ("16 GB", "16"), ("32 GB", "32"), ("64 GB", "64")])
        cf_storage = self._assign_field(cat, "Storage", "Storage", "storage", 5, required=True)
        self._add_options(cf_storage, [("128 GB", "128"), ("256 GB", "256"), ("512 GB", "512"), ("1 TB", "1024"), ("2 TB", "2048")])
        self._assign_field(cat, "Graphics Card", "Graphics Card", "graphics_card", 6, placeholder="e.g. NVIDIA RTX 4060, Integrated")
        self._assign_field(cat, "Battery Health", "Battery Health (%)", "battery_health", 7, min_value=0, max_value=100)
        cf_warranty = self._assign_field(cat, "Under Warranty", "Under Warranty?", "under_warranty", 8)
        cf_expiry = self._assign_field(cat, "Warranty Expiry Date", "Warranty Expiry Date", "warranty_expiry", 9, required=True)
        FieldCondition.objects.get_or_create(
            category_field=cf_expiry,
            depends_on=cf_warranty,
            defaults={"operator": "equals", "value": "true"},
        )
        self._assign_field(cat, "Condition Notes", "Additional Notes", "condition_notes", 10, placeholder="Screen condition, keyboard wear, etc.", max_length=500)

        self.stdout.write(f"    - Laptop: {cat.category_fields.count()} fields")

    def _create_sofa(self):
        cat, _ = Category.objects.get_or_create(
            name="Sofa",
            defaults={
                "description": "Couches, sofas, and seating furniture",
                "icon": "🛋️",
            },
        )
        self.cat_sofa = cat

        cf_material = self._assign_field(cat, "Material", "Material", "material", 1, required=True)
        self._add_options(cf_material, [("Leather", "leather"), ("Fabric", "fabric"), ("Velvet", "velvet"), ("Microfiber", "microfiber"), ("Linen", "linen")])
        self._assign_field(cat, "Seating Capacity", "Seating Capacity", "seating_capacity", 2, required=True, min_value=1, max_value=10)
        self._assign_field(cat, "Pet Friendly", "Pet Friendly?", "pet_friendly", 3, help_text="Is this sofa suitable for homes with pets?")
        self._assign_field(cat, "Dimensions", "Dimensions (L × W × H)", "dimensions", 4, placeholder="e.g. 220 × 90 × 85 cm")
        cf_color = self._assign_field(cat, "Color", "Color", "color", 5)
        self._add_options(cf_color, [("Black", "black"), ("White", "white"), ("Gray", "gray"), ("Brown", "brown"), ("Beige", "beige"), ("Blue", "blue"), ("Other", "other")])
        cf_accessories = self._assign_field(cat, "Accessories Included", "Accessories Included", "accessories", 6)
        self._add_options(cf_accessories, [("Cushions", "cushions"), ("Throw Pillows", "throw_pillows"), ("Armrest Covers", "armrest_covers"), ("Footrest", "footrest")])
        self._assign_field(cat, "Condition Notes", "Condition Notes", "condition_notes", 7, placeholder="Stains, tears, structural issues?", max_length=500)

        self.stdout.write(f"    - Sofa: {cat.category_fields.count()} fields")

    def _assign_field(self, category, fd_name, label, key, order,
                      required=False, placeholder="", help_text="",
                      min_value=None, max_value=None,
                      min_length=None, max_length=None,
                      default_value=""):
        """Helper to create a CategoryField assignment."""
        cf, _ = CategoryField.objects.get_or_create(
            category=category,
            key=key,
            defaults={
                "field_definition": self.field_defs[fd_name],
                "label": label,
                "required": required,
                "display_order": order,
                "placeholder": placeholder,
                "help_text": help_text,
                "min_value": min_value,
                "max_value": max_value,
                "min_length": min_length,
                "max_length": max_length,
                "default_value": default_value,
            },
        )
        return cf

    def _add_options(self, category_field, options):
        """Add select/radio/checkbox options to a CategoryField."""
        for idx, (label, value) in enumerate(options):
            FieldOption.objects.get_or_create(
                category_field=category_field,
                value=value,
                defaults={"label": label, "display_order": idx},
            )

    def _create_sample_listings(self):
        """Create sample listings with dynamic field values."""
        self.stdout.write("  Creating sample listings...")

        # ─── Mobile Phone listings ───
        l1 = self._create_listing(
            self.cat_mobile,
            "iPhone 14 Pro Max — 256GB Space Black",
            "Pristine condition iPhone 14 Pro Max. Always used with a case and screen protector. "
            "Battery health is excellent. Comes with original box and accessories.",
            Decimal("82000.00"),
            "like_new",
            "Bengaluru, Karnataka",
        )
        self._set_values(l1, self.cat_mobile, {
            "brand": "Apple",
            "model": "iPhone 14 Pro Max",
            "storage": "256",
            "ram": "6",
            "original_box": True,
            "battery_health": Decimal("96"),
            "color": "black",
            "under_warranty": True,
            "warranty_expiry": "2025-09-15",
        })

        l2 = self._create_listing(
            self.cat_mobile,
            "Samsung Galaxy S23 Ultra — 512GB",
            "Used Galaxy S23 Ultra in good condition. Minor scratches on back panel. "
            "S Pen included. Great camera phone.",
            Decimal("76649.00"),
            "good",
            "Bengaluru, Karnataka",
        )
        self._set_values(l2, self.cat_mobile, {
            "brand": "Samsung",
            "model": "Galaxy S23 Ultra",
            "storage": "512",
            "ram": "12",
            "original_box": False,
            "battery_health": Decimal("88"),
            "color": "white",
            "under_warranty": False,
            "condition_notes": "Minor scratches on back panel, screen is perfect.",
        })

        l3 = self._create_listing(
            self.cat_mobile,
            "Google Pixel 8 Pro — 128GB",
            "Excellent condition Pixel 8 Pro. Best camera in its class. "
            "Factory unlocked, works with all carriers.",
            Decimal("55000.00"),
            "like_new",
            "Bengaluru, Karnataka",
        )
        self._set_values(l3, self.cat_mobile, {
            "brand": "Google",
            "model": "Pixel 8 Pro",
            "storage": "128",
            "ram": "12",
            "original_box": True,
            "battery_health": Decimal("99"),
            "color": "blue",
            "under_warranty": True,
            "warranty_expiry": "2026-01-20",
        })

        # ─── Laptop listings ───
        l4 = self._create_listing(
            self.cat_laptop,
            "MacBook Pro 14\" M2 Pro — 16GB/512GB",
            "Professional-grade MacBook Pro. Used for software development for 6 months. "
            "Flawless display, excellent battery life. Includes original charger.",
            Decimal("1599.00"),
            "like_new",
            "Bengaluru, Karnataka",
        )
        self._set_values(l4, self.cat_laptop, {
            "brand": "Apple",
            "model": "MacBook Pro 14\" (2023)",
            "processor": "Apple M2 Pro (12-core)",
            "ram": "16",
            "storage": "512",
            "graphics_card": "Integrated 19-core GPU",
            "battery_health": Decimal("94"),
            "under_warranty": True,
            "warranty_expiry": "2025-11-01",
        })

        l5 = self._create_listing(
            self.cat_laptop,
            "Dell XPS 15 — Intel i9 / RTX 4060",
            "Powerful Dell XPS 15 for creative work. 4K OLED display. "
            "Some keyboard shine but functionally perfect.",
            Decimal("21199.00"),
            "good",
            "Bengaluru, Karnataka",
        )
        self._set_values(l5, self.cat_laptop, {
            "brand": "Dell",
            "model": "XPS 15 9530",
            "processor": "Intel Core i9-13900H",
            "ram": "32",
            "storage": "1024",
            "graphics_card": "NVIDIA RTX 4060 8GB",
            "battery_health": Decimal("82"),
            "under_warranty": False,
            "condition_notes": "Keyboard has light shine on WASD keys. Display and trackpad are perfect.",
        })

        # ─── Sofa listings ───
        l6 = self._create_listing(
            self.cat_sofa,
            "Modern L-Shape Sectional — Gray Fabric",
            "Beautiful modern sectional sofa in excellent condition. "
            "Purchased from West Elm 8 months ago. Pet-free, smoke-free home.",
            Decimal("7750.00"),
            "like_new",
            "Bengaluru, Karnataka",
        )
        self._set_values(l6, self.cat_sofa, {
            "material": "fabric",
            "seating_capacity": Decimal("5"),
            "pet_friendly": True,
            "dimensions": "280 × 180 × 85 cm",
            "color": "gray",
            "accessories": ["cushions", "throw_pillows"],
        })

        l7 = self._create_listing(
            self.cat_sofa,
            "Genuine Leather 3-Seater — Brown",
            "Classic brown leather sofa. Comfortable and well-maintained. "
            "Some natural patina adds character.",
            Decimal("4450.00"),
            "good",
            "Bengaluru, Karnataka",
        )
        self._set_values(l7, self.cat_sofa, {
            "material": "leather",
            "seating_capacity": Decimal("3"),
            "pet_friendly": False,
            "dimensions": "210 × 95 × 82 cm",
            "color": "brown",
            "condition_notes": "Natural patina on armrests. No tears or structural issues.",
        })

        self.stdout.write(f"    - {Listing.objects.count()} sample listings created")

    def _create_listing(self, category, title, description, price, condition, location):
        listing, _ = Listing.objects.update_or_create(
            title=title,
            defaults={
                "category": category,
                "description": description,
                "price": price,
                "condition": condition,
                "location": location,
                "status": "active",
            },
        )
        return listing

    def _set_values(self, listing, category, values):
        """Set dynamic field values for a listing using field keys."""
        fields = {
            cf.key: cf
            for cf in CategoryField.objects.filter(category=category)
                .select_related("field_definition")
        }

        for key, value in values.items():
            cf = fields.get(key)
            if not cf:
                continue

            field_type = cf.field_definition.field_type
            kwargs = {"listing": listing, "category_field": cf}

            if field_type == "boolean":
                kwargs["value_boolean"] = bool(value)
            elif field_type == "number":
                kwargs["value_number"] = Decimal(str(value))
            elif field_type == "date":
                kwargs["value_date"] = value
            elif field_type == "checkbox":
                kwargs["value_json"] = value if isinstance(value, list) else [value]
            else:
                kwargs["value_text"] = str(value)

            ListingFieldValue.objects.update_or_create(
                listing=listing,
                category_field=cf,
                defaults=kwargs,
            )

    def _create_demo_wallets(self):
        """Create demo wallets for the wallet system."""
        self.stdout.write("  Creating demo wallets...")

        Wallet.objects.get_or_create(
            owner="buyer_demo",
            defaults={"balance": Decimal("1000.00")},
        )
        Wallet.objects.get_or_create(
            owner="seller_demo",
            defaults={"balance": Decimal("250.00")},
        )

        self.stdout.write("    - 2 demo wallets created")

    def _create_admin_user(self):
        """Create a default superuser for the admin interface."""
        from django.contrib.auth.models import User
        self.stdout.write("  Creating admin user...")
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin0")
            self.stdout.write("    - Admin user 'admin' created")
        else:
            self.stdout.write("    - Admin user 'admin' already exists")

