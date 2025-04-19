from django.test import TestCase
from .models import Supplier

class SupplierModelTest(TestCase):
    def test_create_supplier(self):
        supplier = Supplier.objects.create(
            name="Test Supplier",
            contact_person="John Doe",
            phone="123456789",
            email="test@example.com",
            address="123 Test St"
        )
        self.assertEqual(supplier.name, "Test Supplier")
