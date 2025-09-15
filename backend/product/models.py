import re
import json
import random
from enum import Enum
from io import BytesIO
import barcode
from django.utils.timezone import now

from barcode.writer import ImageWriter
from django.core.files.base import ContentFile
from typing import Any
from PIL import Image

from ckeditor.fields import RichTextField
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import UniqueConstraint
from django.utils.text import slugify
from datetime import datetime
from account.models import BaseModel
from account.models import CustomUser as User
from product.fields import CaseInsensitiveCharField
from django.forms import ValidationError
import uuid


def default_bulking_price_rules():
    return [{"quantity_from": 0, "quantity_to": 0, "price": 0}]


def calculate_ean13_checksum(number):
    """
    Calculate the checksum for an EAN-13 barcode.
    """
    # Ensure the number is 12 digits
    if len(number) != 12 or not number.isdigit():
        raise ValueError("The number must be a 12-digit string.")

    # Multiply odd-positioned digits by 1 and even-positioned digits by 3
    total = sum(
        int(digit) * (1 if idx % 2 == 0 else 3) for idx, digit in enumerate(number)
    )

    # Calculate checksum
    checksum = (10 - (total % 10)) % 10
    return checksum


class Category(BaseModel):
    name = CaseInsensitiveCharField(max_length=255, unique=True)
    description = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    slug = models.SlugField(unique=True, blank=True)
    category_image = models.ImageField(
        upload_to="category/images", null=True, blank=True
    )
    is_deleted = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        self.name = self.name.lower()
        if not self.slug:
            self.slug = self.generate_unique_slug()
        super(Category, self).save(*args, **kwargs)

    def generate_unique_slug(self):
        base_slug = slugify(self.name[:3]).upper()
        counter = 1
        unique_slug = f"{base_slug}"
        while Category.objects.filter(slug=unique_slug).exists():
            unique_slug = f"{base_slug}-{counter}"
            counter += 1
        return unique_slug

    def __str__(self):
        return self.name

    def copy(self):
        new_category = Category(
            name=self.generate_unique_name(),
            description=self.description,
            is_active=self.is_active,
            slug=self.generate_unique_slug(),
            category_image=self.category_image,
            is_deleted=self.is_deleted,
        )
        return new_category

    def generate_unique_name(self):
        base_name = self.name
        counter = 1
        unique_name = base_name
        while Category.objects.filter(name=unique_name).exists():
            unique_name = f"{base_name} ({counter})"
            counter += 1
        return unique_name


class SubCategory(BaseModel):
    name = CaseInsensitiveCharField(max_length=225, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    parent = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="subcategories",
        null=True,
        blank=True,
    )
    description = models.CharField(max_length=255, null=True, blank=True)
    category_image = models.ImageField(
        upload_to="subcategory/images", null=True, blank=True
    )
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_slug()
        super(SubCategory, self).save(*args, **kwargs)

    def generate_slug(self):
        random_suffix = random.randint(1000, 9999)
        slug = f"{slugify(self.name[:3]).upper()}-{random_suffix}"
        return slug

    def copy(self):
        new_category = SubCategory(
            name=self.generate_unique_name(),
            description=self.description,
            is_active=self.is_active,
            parent=self.parent,
            slug=self.generate_slug(),
            category_image=self.category_image,
            is_deleted=self.is_deleted,
        )
        return new_category

    def generate_unique_name(self):
        base_name = self.name
        counter = 1
        unique_name = base_name
        while SubCategory.objects.filter(name=unique_name).exists():
            unique_name = f"{base_name} ({counter})"
            counter += 1
        return unique_name

    def __str__(self):
        return self.name


class ProductStatus(Enum):
    AVAILABLE = "available"
    OUT_OF_STOCK = "out_of_stock"
    DISCONTINUED = "discontinued"

    @classmethod
    def choices(cls):
        return [(key.value, key.value) for key in cls]


class MeasurementUnit(Enum):
    KG = "kg"
    GRAMS = "grams"
    LITRE = "litre"
    UNIT = "unit"
    METER = "meter"
    PIECES = "pieces"
    MG = "mg"
    LB = "lb"
    OZ = "oz"
    ML = "ml"
    CUP = "cup"
    TBSP = "tablespoon"
    TSP = "teaspoon"
    SLICE = "slice"

    @classmethod
    def choices(cls):
        return [(key.value, key.value) for key in cls]


class Product(BaseModel):
    category: "models.ManyToManyField[Category, Any]" = models.ManyToManyField(
        "Category", related_name="products", blank=True
    )
    product_tag = ArrayField(
        base_field=models.CharField(max_length=200), blank=True, default=list
    )
    name = CaseInsensitiveCharField(max_length=255, unique=True)
    description = RichTextField(blank=True)
    is_active = models.BooleanField(default=True)
    status = models.CharField(
        max_length=200,
        choices=ProductStatus.choices(),
        default=ProductStatus.AVAILABLE.value,
    )
    purchase_note = models.TextField(null=True, blank=True)
    min_order_quantity = models.IntegerField(null=True, blank=True)
    sub_category: "models.ManyToManyField[SubCategory, Any]" = models.ManyToManyField(
        "SubCategory", related_name="sub_category_products", blank=True
    )
    is_deleted = models.BooleanField(default=False)
    hot_deal = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.id} - {self.name}"

    @property
    def get_all_variants(self):
        variants = self.variants.all()
        variants_list = [
            {
                "weight": variant.inventory_items.weight,
                "price": variant.inventory_items.price,
                "quantity": variant.inventory_items.quantity,
            }
            for variant in variants
        ]
        return json.dumps(variants_list)

    @property
    def get_all_images(self):
        return self.images.all()

    @property
    def product_detail(self):
        return {
            "inventory": self.get_inventory_data(),
            "variants": self.get_variants_data(),
            "advanced": {
                "purchase_note": self.purchase_note,
                "min_order_quantity": self.min_order_quantity,
            },
        }

    def get_inventory_data(self):
        inventory_detail = Inventory.objects.filter(
            product_variant__product__id=self.id
        ).first()
        if inventory_detail:
            inventory = {
                "sku": inventory_detail.sku,
                "regular_price": inventory_detail.regular_price,
                "sale_price": inventory_detail.sale_price,
                "sale_price_dates_from": inventory_detail.sale_price_dates_from,
                "sale_price_dates_to": inventory_detail.sale_price_dates_to,
                "weight": inventory_detail.weight,
                "unit": inventory_detail.unit,
                "bulking_price_rules": inventory_detail.bulking_price_rules,
            }
        else:
            inventory = {
                "sku": "N/A",
                "regular_price": "N/A",
                "sale_price": "N/A",
                "sale_price_dates_from": None,
                "sale_price_dates_to": None,
                "weight": "N/A",
                "unit": None,
                "bulking_price_rules": None,
            }

        return inventory

    def get_variants_data(self):
        variants = []

        inventories = Inventory.objects.filter(product_variant__product=self)

        for inventory in inventories:
            variants.append(
                {
                    "enabled": getattr(inventory.product_variant, "enabled", None),
                    "managed_stock": inventory.product_variant.managed_stock,
                    "sku": inventory.sku,
                    "regular_price": inventory.regular_price,
                    "sale_price": inventory.sale_price,
                    "sale_price_dates_from": inventory.sale_price_dates_from,
                    "sale_price_dates_to": inventory.sale_price_dates_to,
                    "quantity": inventory.total_quantity,
                    "allow_backorders": inventory.product_variant.allow_backorders,
                    "weight": inventory.weight,
                    "unit": inventory.unit,
                    "description": getattr(
                        inventory.product_variant, "description", None
                    ),
                }
            )

        return variants


class ProductVariant(BaseModel):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    enabled = models.BooleanField(default=True)
    managed_stock = models.BooleanField(default=True)
    allow_backorders = models.CharField(
        max_length=50, choices=[("Do Not Allow", "Do Not Allow"), ("Allow", "Allow")]
    )
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.id} - {self.product} - {self.variant_name}"

    @property
    def variant_name(self):
        """Generate the variant name dynamically based on inventory weight and unit."""
        try:
            inventory = self.inventory_items
            if inventory:
                return f"{self.product.name} - {inventory.weight} {inventory.unit}"
            return f"{self.product.name} - Default Variant"
        except AttributeError:
            return f"{self.product.name} - Default Variant"

    class Meta:
        ordering = ["created_at"]


class Inventory(BaseModel):
    product_variant = models.OneToOneField(
        ProductVariant,
        related_name="inventory_items",
        on_delete=models.CASCADE,
        blank=True,
    )
    sku = CaseInsensitiveCharField(max_length=100, unique=True, blank=True)
    regular_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    sale_price_dates_from = models.DateField(null=True, blank=True)
    sale_price_dates_to = models.DateField(null=True, blank=True)
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(
        max_length=20,
        choices=MeasurementUnit.choices(),
        default=MeasurementUnit.UNIT.value,
    )
    barcode = models.ImageField(upload_to="barcodes/", null=True, blank=True)
    bulking_price_rules = models.JSONField(default=default_bulking_price_rules)
    start_series = models.IntegerField(null=True, blank=True)
    end_series = models.IntegerField(null=True, blank=True)
    total_quantity = models.IntegerField(default=1)
    unique_code = models.CharField(
        max_length=100, unique=True, blank=True, null=True)
    sale_active = models.BooleanField(default=False)
    last_updated_by_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="updated_inventory",
    )
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        if not self.barcode:
            self.generate_barcode()
        return f"Inventory for {self.sku}"

    def add_stock(self, quantity):
        self.total_quantity += quantity

        self.save()

    def generate_unique_code(self):
        """
        Generate a unique 13-digit EAN-13 code.
        """
        import random

        # Generate a random 12-digit code
        code = "".join(random.choices("0123456789", k=12))

        # Calculate the checksum
        checksum = calculate_ean13_checksum(code)

        # Combine the code and checksum
        full_code = f"{code}{checksum}"
        return full_code

    def generate_barcode(self):
        """
        Generate a barcode image using the unique 13-digit EAN-13 code.
        """
        if not self.unique_code:
            self.unique_code = self.generate_unique_code()
            self.save()

        # Ensure unique_code is 13 digits
        if len(self.unique_code) != 13 or not self.unique_code.isdigit():
            raise ValueError(
                "The unique code must be a 13-digit numeric string.")

        # Generate the barcode using EAN-13 format
        barcode_format = barcode.get(
            "ean13", self.unique_code, writer=ImageWriter())
        buffer = BytesIO()
        barcode_format.write(buffer)
        buffer.seek(0)

        # Save the barcode image
        file_name = f"{self.unique_code}.png"
        self.barcode.save(file_name, ContentFile(buffer.read()), save=False)

    def calculate_total_quantity(self):
        """Calculate total quantity from bulking price rules."""
        total_quantity = 0
        for rule in self.bulking_price_rules.all():
            total_quantity += rule.quantity_to - rule.quantity_from + 1
        return total_quantity

    def generate_sku(self):
        """Generate a unique SKU based on the product name,
        timestamp, and ensure uppercase."""
        product_name = (
            self.product_variant.product.name
        )  # Assuming `ProductVariant` has a `product` FK
        clean_name = re.sub(r"[^a-zA-Z0-9]", "", product_name).upper()[
            :4
        ]  # Remove special chars & limit length
        timestamp = datetime.now().strftime("%y%m%d%H%M%S")
        unique_id = uuid.uuid4().hex[:4].upper()

        base_sku = f"{clean_name}-{timestamp}-{unique_id}"

        # Ensure SKU is unique
        while Inventory.objects.filter(sku=base_sku).exists():
            unique_id = uuid.uuid4().hex[:4].upper()
            base_sku = f"{clean_name}-{timestamp}-{unique_id}"

        return base_sku

    def update_sale_active(self):
        """Update `sale_active` based on sale dates."""
        current_date = now().date()
        start_sale = self.sale_price_dates_from
        end_sale = self.sale_price_dates_to

        if isinstance(start_sale, str):
            if start_sale:
                start_sale = datetime.strptime(start_sale, "%Y-%m-%d").date()
            else:
                start_sale = None
        if isinstance(end_sale, str):
            if end_sale:
                end_sale = datetime.strptime(end_sale, "%Y-%m-%d").date()
            else:
                end_sale = None

        self.sale_active = bool(
            start_sale and end_sale and (
                start_sale <= current_date <= end_sale)
        )

    def save(self, *args, **kwargs):
        """Ensure a unique uppercase SKU is generated if missing."""
        if not self.sku or self.sku.lower() == "none":
            self.sku = self.generate_sku()
        else:
            self.sku = self.sku.upper()
        self.update_sale_active()

        super().save(*args, **kwargs)


class ProductImage(BaseModel):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="product_images/")
    is_featured = models.BooleanField(default=True)

    def __str__(self):
        return f"Image for {self.product.name}"


class ProductSeo(BaseModel):
    preview_choices = (
        ("desktop", "desktop"),
        ("mobile", "mobile"),
    )
    product = models.OneToOneField(
        Product, on_delete=models.CASCADE, related_name="product_seo"
    )
    focused_keyword = models.JSONField(default=list)
    seo_title = models.CharField(
        max_length=255, unique=True, null=True, blank=True)
    slug = models.CharField(max_length=255)
    preview_as = models.CharField(
        max_length=20, choices=preview_choices, default="mobile"
    )
    meta_description = models.TextField(blank=True)

    def __str__(self):
        return f"SEO for {self.product.name}"

    def generate_slug(self):
        base_slug = slugify(self.seo_title)
        counter = 1
        unique_slug = base_slug

        while ProductSeo.objects.filter(slug=unique_slug).exists():
            unique_slug = f"{base_slug}-{counter}"
            counter += 1

        return unique_slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_slug()
        super(ProductSeo, self).save(*args, **kwargs)


class ProductMaterial(BaseModel):
    measure_field = (
        ("kg", "Kilogram"),
        ("g", "Gram"),
        ("litre", "Litre"),
        ("mg", "Milligram"),
        ("lb", "Pound"),
        ("oz", "Ounce"),
        ("ml", "Millilitre"),
        ("cup", "Cup"),
        ("tbsp", "Tablespoon"),
        ("tsp", "Teaspoon"),
        ("piece", "Piece"),
        ("slice", "Slice"),
    )
    name = CaseInsensitiveCharField(max_length=255, unique=True)
    quantity = models.IntegerField()
    expiry_date = models.DateTimeField(null=True, blank=True)
    unit_of_measure = models.CharField(
        max_length=20, choices=measure_field, default="kg"
    )
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    reorder = models.IntegerField()
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="updated_raw_materials",
    )
    barcode = models.ImageField(
        upload_to="material_barcodes/", null=True, blank=True)
    unique_code = models.CharField(
        max_length=100, unique=True, blank=True, null=True)

    def __str__(self):
        if not self.barcode:
            self.generate_barcode()
        return f"{self.name}"

    def needs_reorder(self):
        return self.quantity <= self.reorder

    def copy(self):
        new_product_material = ProductMaterial(
            name=self.generate_unique_name(),
            quantity=self.quantity,
            expiry_date=self.expiry_date,
            unit_of_measure=self.unit_of_measure,
            cost=self.cost,
            reorder=self.reorder,
            description=self.description,
            is_active=self.is_active,
            is_deleted=self.is_deleted,
        )
        return new_product_material

    def generate_unique_code(self):
        """
        Generate a unique 13-digit EAN-13 code.
        """
        import random

        # Generate a random 12-digit code
        code = "".join(random.choices("0123456789", k=12))

        # Calculate the checksum
        checksum = calculate_ean13_checksum(code)

        # Combine the code and checksum
        full_code = f"{code}{checksum}"
        return full_code

    def generate_barcode(self):
        """
        Generate a barcode image using the unique 13-digit EAN-13 code,
        including SKU and quantity details.
        """
        if not self.unique_code:
            self.unique_code = self.generate_unique_code()
            self.save()

        # Ensure unique_code is 13 digits
        if len(self.unique_code) != 13 or not self.unique_code.isdigit():
            raise ValueError(
                "The unique code must be a 13-digit numeric string.")

        # Generate the barcode using EAN-13 format
        barcode_format = barcode.get(
            "ean13", self.unique_code, writer=ImageWriter())
        buffer = BytesIO()
        barcode_format.write(buffer)
        buffer.seek(0)

        # Convert buffer to an image
        img = Image.open(buffer)
        output_buffer = BytesIO()
        img.save(output_buffer, format="PNG")
        output_buffer.seek(0)

        # Save barcode image to model field
        file_name = f"{self.unique_code}.png"
        self.barcode.save(file_name, ContentFile(
            output_buffer.read()), save=False)

    def generate_unique_name(self):
        base_name = self.name
        counter = 1
        unique_name = base_name
        while ProductMaterial.objects.filter(name=unique_name).exists():
            unique_name = f"{base_name} ({counter})"
            counter += 1
        return unique_name


class ProductRating(models.Model):
    product_variant = models.ForeignKey(
        ProductVariant, related_name="ratings", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User, related_name="product_ratings", on_delete=models.CASCADE
    )
    rating = models.PositiveIntegerField(
        choices=[
            (1, "1 Star"),
            (2, "2 Stars"),
            (3, "3 Stars"),
            (4, "4 Stars"),
            (5, "5 Stars"),
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("product_variant", "user")

    def __str__(self):
        return f"{self.product_variant.product.name} - {self.rating} Stars"


class BasketImage(BaseModel):
    basket = models.ForeignKey(
        "Basket", related_name="basketimages", on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to="basket_images/")
    featured = models.BooleanField(default=False)

    def __str__(self):
        return f"{'Featured' if self.featured else 'Regular'} Image for Basket {self.basket.id}"


class Basket(BaseModel):
    DRAFT = "draft"
    PUBLISHED = "publish"
    STATUS_CHOICES = [
        (DRAFT, "Draft"),
        (PUBLISHED, "Publish"),
    ]
    basket_name = models.CharField(max_length=255)
    space_left = models.IntegerField()
    basket_price = models.DecimalField(max_digits=10, decimal_places=2)
    products = models.ManyToManyField(ProductVariant, related_name="baskets")
    date = models.DateField(auto_now_add=True)
    images = models.ManyToManyField(BasketImage, related_name="basketbaskets")
    content = RichTextField(blank=True, null=True)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=PUBLISHED,
    )
    is_deleted = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    start_sale = models.DateTimeField(null=True, blank=True)
    end_sale = models.DateTimeField(null=True, blank=True)
    is_active_sale = models.BooleanField(default=False)
    offer_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    is_customizable = models.BooleanField(default=False)

    def copy(self):
        new_basket = Basket(
            basket_name=self.generate_unique_name(),
            space_left=self.space_left,
            basket_price=self.basket_price,
            date=self.date,
            content=self.content,
            status=self.status,
            is_deleted=self.is_deleted,
            is_active=self.is_active,
            is_active_sale=self.is_active_sale,
            start_sale=self.start_sale,
            end_sale=self.end_sale,
            offer_price=self.offer_price
        )

        new_basket.products.set(self.products.all())
        new_basket.images.set(self.images.all())

        return new_basket

    def generate_unique_name(self):
        base_name = self.basket_name
        counter = 1
        unique_name = base_name
        while Basket.objects.filter(basket_name=unique_name).exists():
            unique_name = f"{base_name} ({counter})"
            counter += 1
        return unique_name

    def __str__(self):
        return f"{self.id} - {self.basket_name}"


class UserBasket(BaseModel):
    basket = models.ForeignKey(
        Basket, on_delete=models.CASCADE, related_name="user_baskets"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_baskets"
    )
    image = models.ImageField(upload_to="basket_items/", null=True, blank=True)
    offer_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    basket_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    total_items = models.FloatField(default=0)
    available_space = models.FloatField(default=0, editable=False)


class UserBasketItem(BaseModel):
    user_basket = models.ForeignKey(
        UserBasket, on_delete=models.CASCADE, related_name="items"
    )
    product_variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, related_name="user_basket_items"
    )
    quantity = models.PositiveIntegerField(default=1)


class TimeSlotConfiguration(BaseModel):
    start_time = models.CharField(max_length=10)
    end_time = models.CharField(max_length=10)
    order_capacity = models.IntegerField(default=50)
    orders_left = models.IntegerField(default=50)
    order_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Time Slot from {self.start_time} to {self.end_time}"

    def clean(self):
        import re

        time_format = r"^(0[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$"

        if not re.match(time_format, self.start_time):
            raise ValidationError(
                f"Invalid start_time format. Use hh:mm AM/PM.")

        if not re.match(time_format, self.end_time):
            raise ValidationError(f"Invalid end_time format. Use hh:mm AM/PM.")

    def book_order(self):
        if self.orders_left > 0:
            self.orders_left -= 1
            self.save()
            return True
        return False


class FavouriteItem(BaseModel):
    user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.CASCADE, related_name="wishlists"
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            UniqueConstraint(fields=["user", "product"],
                             name="unique_user_product")
        ]

    def __str__(self) -> str:
        user_email = self.user.email if self.user else "Anonymous"
        return f"{user_email}"
