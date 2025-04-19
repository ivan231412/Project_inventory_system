from django.db import models
from .tasks import send_to_rabbitmq  # Перемещён импорт

class Supplier(models.Model):
    name = models.CharField(max_length=100)
    contact_person = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=100)
    address = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class RawMaterial(models.Model):
    material_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    unit = models.CharField(max_length=20)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.stock_quantity < 0 or self.minimum_stock < 0:
            raise ValueError("Stock quantity and minimum stock cannot be negative.")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class RawMaterialUsage(models.Model):
    order = models.ForeignKey('ProductionOrder', on_delete=models.CASCADE)
    material = models.ForeignKey(RawMaterial, on_delete=models.CASCADE)
    quantity_used = models.DecimalField(max_digits=10, decimal_places=2)
    usage_date = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    

class ProductionOrder(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk:  # Проверяем, что запись новая (не обновление)
            super().save(*args, **kwargs)  # Сначала сохраняем заказ
            raw_materials = RawMaterial.objects.all()[:1]  # Для примера берём первое сырьё
            if raw_materials:
                material = raw_materials[0]
                quantity_needed = self.quantity * 2  # 2 единицы сырья на 1 единицу продукции
                if material.stock_quantity < quantity_needed:
                    raise ValueError("Недостаточно сырья для выполнения заказа!")
                RawMaterialUsage.objects.create(
                    order=self,
                    material=material,
                    quantity_used=quantity_needed
                )
                material.stock_quantity -= quantity_needed
                material.save()
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return f"Order for {self.product.name} - {self.quantity}"

class StockMovement(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE, null=True, blank=True)
    material = models.ForeignKey(RawMaterial, on_delete=models.CASCADE, null=True, blank=True)
    movement_type = models.CharField(max_length=20)  # Например, "IN" или "OUT"
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk:  # Проверяем, что запись новая (не обновление)
            if self.material:
                if self.movement_type == "IN":
                    self.material.stock_quantity += self.quantity
                elif self.movement_type == "OUT":
                    if self.material.stock_quantity < self.quantity:
                        raise ValueError("Недостаточно сырья на складе!")
                    self.material.stock_quantity -= self.quantity
                self.material.save()
            elif self.product:
                if self.movement_type == "IN":
                    self.product.stock_quantity += self.quantity
                elif self.movement_type == "OUT":
                    if self.product.stock_quantity < self.quantity:
                        raise ValueError("Недостаточно продукции на складе!")
                    self.product.stock_quantity -= self.quantity
                self.product.save()

        super().save(*args, **kwargs)
        message = {
            'movement_id': self.id,
            'product_id': self.product.id if self.product else None,
            'material_id': self.material.id if self.material else None,
            'movement_type': self.movement_type,
            'quantity': str(self.quantity),
        }
        try:
            send_to_rabbitmq(message)
        except Exception as e:
            raise RuntimeError(f"Ошибка при отправке сообщения в RabbitMQ: {e}")

class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    unit = models.CharField(max_length=20)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.stock_quantity < 0 or self.minimum_stock < 0:
            raise ValueError("Stock quantity and minimum stock cannot be negative.")
        super().save(*args, **kwargs)
        message = {
            'product_id': self.id,
            'name': self.name,
            'stock_quantity': str(self.stock_quantity),
        }
        try:
            send_to_rabbitmq(message)
        except Exception as e:
            raise RuntimeError(f"Ошибка при отправке сообщения в RabbitMQ: {e}")

    def __str__(self):
        return self.name

class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
    )

    model_name = models.CharField(max_length=50)  # Название модели (например, "RawMaterial")
    object_id = models.PositiveIntegerField()  # ID объекта
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)  # Тип действия
    timestamp = models.DateTimeField(auto_now_add=True)  # Время действия
    details = models.TextField(blank=True)  # Дополнительные детали (например, какие поля изменились)

    def __str__(self):
        return f"{self.action} on {self.model_name} (ID: {self.object_id}) at {self.timestamp}"