from django.db.models.signals import post_save
from django.dispatch import receiver

from customer.models import CustomerAddress


@receiver(post_save, sender=CustomerAddress)
def update_primary_address(sender, instance, **kwargs):
    if instance.primary:
        CustomerAddress.objects.filter(customer=instance.customer).exclude(
            id=instance.id
        ).update(primary=False)
    else:
        # If no address is marked as primary, set the latest one as primary
        if not CustomerAddress.objects.filter(
            customer=instance.customer, primary=True
        ).exists():
            instance.primary = True
            instance.save()
