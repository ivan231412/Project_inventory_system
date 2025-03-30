from rest_framework import serializers
from .models import AuditLog, Supplier, RawMaterial, RawMaterialUsage, ProductionOrder, StockMovement, Product


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class RawMaterialSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)

    class Meta:
        model = RawMaterial
        fields = ['id', 'material_id', 'name', 'description', 'unit', 'supplier', 'price_per_unit', 'stock_quantity', 'minimum_stock', 'updated_at']

class RawMaterialUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterialUsage
        fields = '__all__'

class ProductionOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionOrder
        fields = '__all__'

class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'unit', 'price_per_unit', 'stock_quantity', 'minimum_stock', 'created_at']

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'model_name', 'object_id', 'action', 'timestamp', 'details']