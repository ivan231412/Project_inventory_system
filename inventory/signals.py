from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Supplier, RawMaterial, ProductionOrder, StockMovement, Product, AuditLog
import json

@receiver(post_save, sender=Supplier)
@receiver(post_save, sender=RawMaterial)
@receiver(post_save, sender=ProductionOrder)
@receiver(post_save, sender=StockMovement)
@receiver(post_save, sender=Product)
def log_save(sender, instance, created, **kwargs):
    action = 'CREATE' if created else 'UPDATE'
    details = json.dumps(instance.__dict__, default=str)  # Сериализуем данные объекта
    AuditLog.objects.create(
        model_name=sender.__name__,
        object_id=instance.id,
        action=action,
        details=details
    )

@receiver(post_delete, sender=Supplier)
@receiver(post_delete, sender=RawMaterial)
@receiver(post_delete, sender=ProductionOrder)
@receiver(post_delete, sender=StockMovement)
@receiver(post_delete, sender=Product)
def log_delete(sender, instance, **kwargs):
    AuditLog.objects.create(
        model_name=sender.__name__,
        object_id=instance.id,
        action='DELETE',
        details=f"Deleted {sender.__name__} with ID {instance.id}"
    )