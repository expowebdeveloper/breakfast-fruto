import json

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from product.models import Inventory


@receiver(post_save, sender=Inventory)
def set_total_quantity(sender, instance, created, **kwargs):
    total_quantity = 0

    if created:
        product_bulking_data = instance.bulking_price_rules
        total_quantity = 0

        if product_bulking_data:
            if isinstance(product_bulking_data, str):
                try:
                    product_bulking_data = json.loads(product_bulking_data)
                except json.JSONDecodeError:
                    return

            for bulking_price in product_bulking_data:
                quantity_from = bulking_price.get("quantity_from", 0)
                quantity_to = bulking_price.get("quantity_to", 0)

                try:
                    if quantity_from:
                        quantity_from = int(quantity_from)                        
                    if quantity_to:
                        quantity_to = int(quantity_to)
                except ValueError:
                    continue
                if quantity_from and quantity_to:
                    total_quantity += max(0, quantity_to - quantity_from + 1)
                else:
                    total_quantity = 0

            instance.start_series = 1
            instance.end_series = total_quantity

        elif instance.total_quantity > 0:
            total_quantity = instance.total_quantity
            instance.start_series = 1
            instance.end_series = total_quantity
        else:
            instance.start_series = 0
            instance.end_series = 0

        instance.total_quantity = total_quantity

        with transaction.atomic():
            instance.save(
                update_fields=["total_quantity", "start_series", "end_series"]
            )
