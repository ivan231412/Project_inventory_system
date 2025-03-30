from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Supplier, RawMaterial, RawMaterialUsage, ProductionOrder, StockMovement, Product
from .serializers import (SupplierSerializer, RawMaterialSerializer, RawMaterialUsageSerializer,
                         ProductionOrderSerializer, StockMovementSerializer, ProductSerializer,AuditLogSerializer)
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from datetime import datetime, timedelta
from .models import RawMaterialUsage, ProductionOrder
from .models import AuditLog
from .serializers import AuditLogSerializer
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import generics

class SupplierListCreateView(generics.ListCreateAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class RawMaterialListCreateView(generics.ListCreateAPIView):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer

class RawMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer

class ProductionOrderListCreateView(generics.ListCreateAPIView):
    queryset = ProductionOrder.objects.all()
    serializer_class = ProductionOrderSerializer

class ProductionOrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductionOrder.objects.all()
    serializer_class = ProductionOrderSerializer

class StockMovementListCreateView(generics.ListCreateAPIView):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer

class StockMovementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer

class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    
class ReportView(APIView):
    def get(self, request):
        # Фильтрация по датам
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d')
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d')

        # Использование сырья
        raw_material_usage = RawMaterialUsage.objects.filter(
            usage_date__range=[start_date, end_date]
        ).values('material__name').annotate(total_used=Sum('quantity_used')).order_by('-total_used')

        # Статусы заказов
        order_statuses = ProductionOrder.objects.filter(
            created_at__range=[start_date, end_date]
        ).values('status').annotate(count=Count('id'))

        # Движения запасов по дням
        stock_movements = StockMovement.objects.filter(
            timestamp__range=[start_date, end_date]
        ).annotate(date=TruncDate('timestamp')).values('date', 'movement_type').annotate(count=Count('id')).order_by('date')

        # Стоимость запасов
        raw_materials = RawMaterial.objects.all()
        raw_material_cost = sum(float(material.stock_quantity) * float(material.price_per_unit) for material in raw_materials)

        products = Product.objects.all()
        product_cost = sum(float(product.stock_quantity) * float(product.price_per_unit) for product in products)

        total_inventory_cost = raw_material_cost + product_cost

        return Response({
            'raw_material_usage': list(raw_material_usage),
            'order_statuses': list(order_statuses),
            'stock_movements': list(stock_movements),
            'inventory_cost': {
                'raw_materials': raw_material_cost,
                'products': product_cost,
                'total': total_inventory_cost
            }
        })
    


class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer