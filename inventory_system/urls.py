"""
URL configuration for inventory_system project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.generic import TemplateView
from django.contrib.auth.views import LoginView, LogoutView
from inventory.views import (
    SupplierListCreateView, SupplierDetailView,
    RawMaterialListCreateView, RawMaterialDetailView,
    ProductionOrderListCreateView, ProductionOrderDetailView,
    StockMovementListCreateView, StockMovementDetailView,
    ProductListCreateView, ProductDetailView,
    AuditLogListView, ReportView
)
from django.shortcuts import render

router = DefaultRouter()


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('', TemplateView.as_view(template_name='index.html'),name='home'),
    path('api/reports/', ReportView.as_view(), name='reports'),
    path('login/', LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', LogoutView.as_view(next_page='/'), name='logout'),
    path('', lambda request: render(request, 'index.html'), name='index'),

    # API маршруты для Suppliers
    path('api/suppliers/', SupplierListCreateView.as_view(), name='supplier-list-create'),
    path('api/suppliers/<int:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),

    # API маршруты для RawMaterials
    path('api/rawmaterials/', RawMaterialListCreateView.as_view(), name='rawmaterial-list-create'),
    path('api/rawmaterials/<int:pk>/', RawMaterialDetailView.as_view(), name='rawmaterial-detail'),

    # API маршруты для ProductionOrders
    path('api/productionorders/', ProductionOrderListCreateView.as_view(), name='productionorder-list-create'),
    path('api/productionorders/<int:pk>/', ProductionOrderDetailView.as_view(), name='productionorder-detail'),

    # API маршруты для StockMovements
    path('api/stockmovements/', StockMovementListCreateView.as_view(), name='stockmovement-list-create'),
    path('api/stockmovements/<int:pk>/', StockMovementDetailView.as_view(), name='stockmovement-detail'),

    # API маршруты для Products
    path('api/products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('api/products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),

    # API маршруты для AuditLog
    path('api/auditlogs/', AuditLogListView.as_view(), name='auditlog-list'),

    # API маршрут для Reports
    path('api/reports/', ReportView.as_view(), name='reports'),
    
]