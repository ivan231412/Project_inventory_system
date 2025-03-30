document.addEventListener('DOMContentLoaded', () => {
    // Инициализация DataTables
    const initializeDataTable = (tableId, url, columns) => {
        $(`#${tableId}`).DataTable({
            ajax: {
                url: url,
                dataSrc: ''
            },
            columns: [
                ...columns,
                ...(tableId !== 'auditlog-table' ? [{
                    data: null,
                    render: (data) => `
                        <button class="btn btn-warning btn-sm edit-btn" data-id="${data.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${data.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    `,
                    orderable: false
                }] : [])
            ],
            pageLength: 5,
            lengthMenu: [5, 10, 25, 50],
            language: {
                search: "Filter:",
                emptyTable: "No data available"
            }
        });
    };

    // Функция для показа уведомления
    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    };

    // Инициализация таблиц
    initializeDataTable('supplier-table', 'http://localhost:8000/api/suppliers/', [
        { data: 'name' },
        { data: 'contact_person' },
        { data: 'phone' },
        { data: 'email' },
        { data: 'address' }
    ]);

    initializeDataTable('rawmaterial-table', 'http://localhost:8000/api/rawmaterials/', [
        { data: 'material_id' },
        { data: 'name' },
        { data: 'supplier.name' },
        { data: 'stock_quantity' },
        { data: 'minimum_stock' }
    ]);

    initializeDataTable('order-table', 'http://localhost:8000/api/productionorders/', [
        { data: 'product.name' },
        { data: 'quantity' },
        { data: 'status' },
        { data: 'start_date', render: (data) => new Date(data).toLocaleString() }
    ]);

    initializeDataTable('movement-table', 'http://localhost:8000/api/stockmovements/', [
        { data: 'product', render: (data) => data ? data.name : '-' },
        { data: 'material', render: (data) => data ? data.name : '-' },
        { data: 'movement_type' },
        { data: 'quantity' },
        { data: 'timestamp', render: (data) => new Date(data).toLocaleString() }
    ]);

    initializeDataTable('product-table', 'http://localhost:8000/api/products/', [
        { data: 'name' },
        { data: 'stock_quantity' },
        { data: 'minimum_stock' },
        { data: 'unit' }
    ]);

    initializeDataTable('auditlog-table', 'http://localhost:8000/api/auditlogs/', [
        { data: 'model_name' },
        { data: 'object_id' },
        { data: 'action' },
        { data: 'timestamp', render: (data) => new Date(data).toLocaleString() },
        {
            data: 'details',
            render: (data, type, row) => {
                if (row.action === 'DELETE') return data;
                try {
                    const parsed = JSON.parse(data);
                    if (row.model_name === 'Supplier') {
                        return `Name: ${parsed.name}, Email: ${parsed.email}`;
                    } else if (row.model_name === 'RawMaterial') {
                        return `Name: ${parsed.name}, Stock: ${parsed.stock_quantity}`;
                    } else if (row.model_name === 'ProductionOrder') {
                        return `Product ID: ${parsed.product}, Quantity: ${parsed.quantity}`;
                    } else if (row.model_name === 'StockMovement') {
                        return `Type: ${parsed.movement_type}, Quantity: ${parsed.quantity}`;
                    } else if (row.model_name === 'Product') {
                        return `Name: ${parsed.name}, Stock: ${parsed.stock_quantity}`;
                    }
                    return data;
                } catch (e) {
                    return data;
                }
            }
        }
    ]);

    // Инициализация tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // Функция для проверки низких запасов
    const checkLowStock = () => {
        const lowStockAlerts = document.getElementById('low-stock-alerts');
        lowStockAlerts.innerHTML = '';

        fetch('http://localhost:8000/api/rawmaterials/')
            .then(response => response.json())
            .then(data => {
                data.forEach(material => {
                    if (material.stock_quantity < material.minimum_stock) {
                        const alert = document.createElement('div');
                        alert.className = 'low-stock-alert';
                        alert.innerHTML = `
                            <span>Low stock alert: ${material.name} (Current: ${material.stock_quantity}, Minimum: ${material.minimum_stock})</span>
                            <button type="button" class="btn-close" aria-label="Close"></button>
                        `;
                        lowStockAlerts.appendChild(alert);
                        alert.querySelector('.btn-close').addEventListener('click', () => {
                            alert.remove();
                        });
                    }
                });
            })
            .catch(error => {
                showToast('Error checking raw materials stock: ' + error, 'danger');
            });

        fetch('http://localhost:8000/api/products/')
            .then(response => response.json())
            .then(data => {
                data.forEach(product => {
                    if (product.stock_quantity < product.minimum_stock) {
                        const alert = document.createElement('div');
                        alert.className = 'low-stock-alert';
                        alert.innerHTML = `
                            <span>Low stock alert: ${product.name} (Current: ${product.stock_quantity}, Minimum: ${product.minimum_stock})</span>
                            <button type="button" class="btn-close" aria-label="Close"></button>
                        `;
                        lowStockAlerts.appendChild(alert);
                        alert.querySelector('.btn-close').addEventListener('click', () => {
                            alert.remove();
                        });
                    }
                });
            })
            .catch(error => {
                showToast('Error checking products stock: ' + error, 'danger');
            });
    };

    // Обработчик для кнопки "Show Example"
    document.querySelectorAll('.show-example-btn').forEach(button => {
        button.addEventListener('click', () => {
            const formType = button.getAttribute('data-form');
            if (formType === 'supplier') {
                document.getElementById('supplier-name').value = 'ABC Supplies';
                document.getElementById('supplier-contact').value = 'John Doe';
                document.getElementById('supplier-phone').value = '+1234567890';
                document.getElementById('supplier-email').value = 'contact@abcsupplies.com';
                document.getElementById('supplier-address').value = '123 Main St, City';
            } else if (formType === 'rawmaterial') {
                document.getElementById('rawmaterial-id').value = 'MAT001';
                document.getElementById('rawmaterial-name').value = 'Steel Rod';
                document.getElementById('rawmaterial-description').value = 'High-grade steel for construction';
                document.getElementById('rawmaterial-unit').value = 'kg';
                document.getElementById('rawmaterial-price').value = '10.50';
                document.getElementById('rawmaterial-stock').value = '100';
                document.getElementById('rawmaterial-minimum-stock').value = '20';
                const supplierSelect = document.getElementById('rawmaterial-supplier');
                if (supplierSelect.options.length > 1) {
                    supplierSelect.value = supplierSelect.options[1].value;
                }
            } else if (formType === 'order') {
                document.getElementById('order-quantity').value = '50';
                document.getElementById('order-start-date').value = '2025-03-26';
                document.getElementById('order-status').value = 'PENDING';
                const productSelect = document.getElementById('order-product');
                if (productSelect.options.length > 1) {
                    productSelect.value = productSelect.options[1].value;
                }
            } else if (formType === 'movement') {
                document.getElementById('movement-type').value = 'IN';
                document.getElementById('movement-quantity').value = '25';
                const productSelect = document.getElementById('movement-product');
                const materialSelect = document.getElementById('movement-material');
                if (productSelect.options.length > 1) {
                    productSelect.value = productSelect.options[1].value;
                }
                if (materialSelect.options.length > 1) {
                    materialSelect.value = '';
                }
            } else if (formType === 'product') {
                document.getElementById('product-name').value = 'Widget A';
                document.getElementById('product-description').value = 'A high-quality widget';
                document.getElementById('product-unit').value = 'pcs';
                document.getElementById('product-price').value = '5.00';
                document.getElementById('product-stock').value = '200';
                document.getElementById('product-minimum-stock').value = '50';
            }
        });
    });

    // Поставщики
    document.getElementById('add-supplier-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const supplier = {
            name: document.getElementById('supplier-name').value,
            contact_person: document.getElementById('supplier-contact').value,
            phone: document.getElementById('supplier-phone').value,
            email: document.getElementById('supplier-email').value,
            address: document.getElementById('supplier-address').value,
        };
        fetch('http://localhost:8000/api/suppliers/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplier),
        })
        .then(() => {
            showToast('Supplier added successfully!', 'success');
            $('#supplier-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addSupplierModal'));
            modal.hide();
            document.getElementById('add-supplier-form').reset();
        })
        .catch(error => {
            showToast('Error adding supplier: ' + error, 'danger');
        });
    });

    document.getElementById('edit-supplier-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-supplier-id').value;
        const supplier = {
            name: document.getElementById('edit-supplier-name').value,
            contact_person: document.getElementById('edit-supplier-contact').value,
            phone: document.getElementById('edit-supplier-phone').value,
            email: document.getElementById('edit-supplier-email').value,
            address: document.getElementById('edit-supplier-address').value,
        };
        fetch(`http://localhost:8000/api/suppliers/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplier),
        })
        .then(() => {
            showToast('Supplier updated successfully!', 'success');
            $('#supplier-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editSupplierModal'));
            modal.hide();
        })
        .catch(error => {
            showToast('Error updating supplier: ' + error, 'danger');
        });
    });

    // Сырьё
    fetch('http://localhost:8000/api/suppliers/')
        .then(response => response.json())
        .then(data => {
            const addSelect = document.getElementById('rawmaterial-supplier');
            const editSelect = document.getElementById('edit-rawmaterial-supplier');
            data.forEach(supplier => {
                const option1 = document.createElement('option');
                option1.value = supplier.id;
                option1.textContent = supplier.name;
                addSelect.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = supplier.id;
                option2.textContent = supplier.name;
                editSelect.appendChild(option2);
            });
        });

    document.getElementById('add-rawmaterial-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const rawmaterial = {
            material_id: document.getElementById('rawmaterial-id').value,
            name: document.getElementById('rawmaterial-name').value,
            description: document.getElementById('rawmaterial-description').value,
            unit: document.getElementById('rawmaterial-unit').value,
            supplier_id: document.getElementById('rawmaterial-supplier').value,
            price_per_unit: document.getElementById('rawmaterial-price').value,
            stock_quantity: document.getElementById('rawmaterial-stock').value,
            minimum_stock: document.getElementById('rawmaterial-minimum-stock').value,
            updated_at: new Date().toISOString(),
        };
        fetch('http://localhost:8000/api/rawmaterials/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawmaterial),
        })
        .then(() => {
            showToast('Raw Material added successfully!', 'success');
            $('#rawmaterial-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addRawMaterialModal'));
            modal.hide();
            document.getElementById('add-rawmaterial-form').reset();
            checkLowStock();
        })
        .catch(error => {
            showToast('Error adding raw material: ' + error, 'danger');
        });
    });

    document.getElementById('edit-rawmaterial-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-rawmaterial-id').value;
        const rawmaterial = {
            material_id: document.getElementById('edit-rawmaterial-id-field').value,
            name: document.getElementById('edit-rawmaterial-name').value,
            description: document.getElementById('edit-rawmaterial-description').value,
            unit: document.getElementById('edit-rawmaterial-unit').value,
            supplier_id: document.getElementById('edit-rawmaterial-supplier').value,
            price_per_unit: document.getElementById('edit-rawmaterial-price').value,
            stock_quantity: document.getElementById('edit-rawmaterial-stock').value,
            minimum_stock: document.getElementById('edit-rawmaterial-minimum-stock').value,
            updated_at: new Date().toISOString(),
        };
        fetch(`http://localhost:8000/api/rawmaterials/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawmaterial),
        })
        .then(() => {
            showToast('Raw Material updated successfully!', 'success');
            $('#rawmaterial-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editRawMaterialModal'));
            modal.hide();
            checkLowStock();
        })
        .catch(error => {
            showToast('Error updating raw material: ' + error, 'danger');
        });
    });

    // Производственные заказы
    fetch('http://localhost:8000/api/products/')
        .then(response => response.json())
        .then(data => {
            const addSelect = document.getElementById('order-product');
            const editSelect = document.getElementById('edit-order-product');
            data.forEach(product => {
                const option1 = document.createElement('option');
                option1.value = product.id;
                option1.textContent = product.name;
                addSelect.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = product.id;
                option2.textContent = product.name;
                editSelect.appendChild(option2);
            });
        });

    document.getElementById('add-order-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const order = {
            product_id: document.getElementById('order-product').value,
            quantity: document.getElementById('order-quantity').value,
            start_date: document.getElementById('order-start-date').value,
            status: document.getElementById('order-status').value,
            created_at: new Date().toISOString(),
        };
        fetch('http://localhost:8000/api/productionorders/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        })
        .then(() => {
            showToast('Order added successfully!', 'success');
            $('#order-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
            modal.hide();
            document.getElementById('add-order-form').reset();
        })
        .catch(error => {
            showToast('Error adding order: ' + error, 'danger');
        });
    });

    document.getElementById('edit-order-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-order-id').value;
        const order = {
            product_id: document.getElementById('edit-order-product').value,
            quantity: document.getElementById('edit-order-quantity').value,
            start_date: document.getElementById('edit-order-start-date').value,
            status: document.getElementById('edit-order-status').value,
            created_at: document.getElementById('edit-order-created-at').value,
        };
        fetch(`http://localhost:8000/api/productionorders/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        })
        .then(() => {
            showToast('Order updated successfully!', 'success');
            $('#order-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
            modal.hide();
        })
        .catch(error => {
            showToast('Error updating order: ' + error, 'danger');
        });
    });

    // Движения на складе
    fetch('http://localhost:8000/api/products/')
        .then(response => response.json())
        .then(data => {
            const addSelect = document.getElementById('movement-product');
            const editSelect = document.getElementById('edit-movement-product');
            data.forEach(product => {
                const option1 = document.createElement('option');
                option1.value = product.id;
                option1.textContent = product.name;
                addSelect.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = product.id;
                option2.textContent = product.name;
                editSelect.appendChild(option2);
            });
        });

    fetch('http://localhost:8000/api/rawmaterials/')
        .then(response => response.json())
        .then(data => {
            const addSelect = document.getElementById('movement-material');
            const editSelect = document.getElementById('edit-movement-material');
            data.forEach(material => {
                const option1 = document.createElement('option');
                option1.value = material.id;
                option1.textContent = material.name;
                addSelect.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = material.id;
                option2.textContent = material.name;
                editSelect.appendChild(option2);
            });
        });

    document.getElementById('add-movement-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const movement = {
            product_id: document.getElementById('movement-product').value || null,
            material_id: document.getElementById('movement-material').value || null,
            movement_type: document.getElementById('movement-type').value,
            quantity: document.getElementById('movement-quantity').value,
            timestamp: new Date().toISOString(),
        };
        fetch('http://localhost:8000/api/stockmovements/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movement),
        })
        .then(() => {
            showToast('Movement added successfully!', 'success');
            $('#movement-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMovementModal'));
            modal.hide();
            document.getElementById('add-movement-form').reset();
            checkLowStock();
        })
        .catch(error => {
            showToast('Error adding movement: ' + error, 'danger');
        });
    });

    document.getElementById('edit-movement-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-movement-id').value;
        const movement = {
            product_id: document.getElementById('edit-movement-product').value || null,
            material_id: document.getElementById('edit-movement-material').value || null,
            movement_type: document.getElementById('edit-movement-type').value,
            quantity: document.getElementById('edit-movement-quantity').value,
            timestamp: document.getElementById('edit-movement-timestamp').value,
        };
        fetch(`http://localhost:8000/api/stockmovements/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movement),
        })
        .then(() => {
            showToast('Movement updated successfully!', 'success');
            $('#movement-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editMovementModal'));
            modal.hide();
            checkLowStock();
        })
        .catch(error => {
            showToast('Error updating movement: ' + error, 'danger');
        });
    });

    // Продукты
    document.getElementById('add-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const product = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            unit: document.getElementById('product-unit').value,
            price_per_unit: document.getElementById('product-price').value,
            stock_quantity: document.getElementById('product-stock').value,
            minimum_stock: document.getElementById('product-minimum-stock').value,
            created_at: new Date().toISOString(),
        };
        fetch('http://localhost:8000/api/products/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        })
        .then(() => {
            showToast('Product added successfully!', 'success');
            $('#product-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            modal.hide();
            document.getElementById('add-product-form').reset();
            checkLowStock();
        })
        .catch(error => {
            showToast('Error adding product: ' + error, 'danger');
        });
    });

    document.getElementById('edit-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-product-id').value;
        const product = {
            name: document.getElementById('edit-product-name').value,
            description: document.getElementById('edit-product-description').value,
            unit: document.getElementById('edit-product-unit').value,
            price_per_unit: document.getElementById('edit-product-price').value,
            stock_quantity: document.getElementById('edit-product-stock').value,
            minimum_stock: document.getElementById('edit-product-minimum-stock').value,
            created_at: document.getElementById('edit-product-created-at').value,
        };
        fetch(`http://localhost:8000/api/products/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        })
        .then(() => {
            showToast('Product updated successfully!', 'success');
            $('#product-table').DataTable().ajax.reload();
            $('#auditlog-table').DataTable().ajax.reload();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
            modal.hide();
            checkLowStock();
        })
        .catch(error => {
            showToast('Error updating product: ' + error, 'danger');
        });
    });

    // Обработчики для кнопок Edit и Delete
    const setupTableActions = (tableId, endpoint, modalId) => {
        $(document).on('click', `#${tableId} .edit-btn`, function () {
            const id = $(this).data('id');
            fetch(`http://localhost:8000/api/${endpoint}/${id}/`)
                .then(response => response.json())
                .then(data => {
                    if (endpoint === 'suppliers') {
                        document.getElementById('edit-supplier-id').value = data.id;
                        document.getElementById('edit-supplier-name').value = data.name;
                        document.getElementById('edit-supplier-contact').value = data.contact_person;
                        document.getElementById('edit-supplier-phone').value = data.phone;
                        document.getElementById('edit-supplier-email').value = data.email;
                        document.getElementById('edit-supplier-address').value = data.address;
                    } else if (endpoint === 'rawmaterials') {
                        document.getElementById('edit-rawmaterial-id').value = data.id;
                        document.getElementById('edit-rawmaterial-id-field').value = data.material_id;
                        document.getElementById('edit-rawmaterial-name').value = data.name;
                        document.getElementById('edit-rawmaterial-description').value = data.description;
                        document.getElementById('edit-rawmaterial-unit').value = data.unit;
                        document.getElementById('edit-rawmaterial-supplier').value = data.supplier.id;
                        document.getElementById('edit-rawmaterial-price').value = data.price_per_unit;
                        document.getElementById('edit-rawmaterial-stock').value = data.stock_quantity;
                        document.getElementById('edit-rawmaterial-minimum-stock').value = data.minimum_stock;
                    } else if (endpoint === 'productionorders') {
                        document.getElementById('edit-order-id').value = data.id;
                        document.getElementById('edit-order-product').value = data.product.id;
                        document.getElementById('edit-order-quantity').value = data.quantity;
                        document.getElementById('edit-order-start-date').value = data.start_date.split('T')[0];
                        document.getElementById('edit-order-status').value = data.status;
                        document.getElementById('edit-order-created-at').value = data.created_at;
                    } else if (endpoint === 'stockmovements') {
                        document.getElementById('edit-movement-id').value = data.id;
                        document.getElementById('edit-movement-product').value = data.product ? data.product.id : '';
                        document.getElementById('edit-movement-material').value = data.material ? data.material.id : '';
                        document.getElementById('edit-movement-type').value = data.movement_type;
                        document.getElementById('edit-movement-quantity').value = data.quantity;
                        document.getElementById('edit-movement-timestamp').value = data.timestamp;
                    } else if (endpoint === 'products') {
                        document.getElementById('edit-product-id').value = data.id;
                        document.getElementById('edit-product-name').value = data.name;
                        document.getElementById('edit-product-description').value = data.description;
                        document.getElementById('edit-product-unit').value = data.unit;
                        document.getElementById('edit-product-price').value = data.price_per_unit;
                        document.getElementById('edit-product-stock').value = data.stock_quantity;
                        document.getElementById('edit-product-minimum-stock').value = data.minimum_stock;
                        document.getElementById('edit-product-created-at').value = data.created_at;
                    }
                    const modal = new bootstrap.Modal(document.getElementById(modalId));
                    modal.show();
                })
                .catch(error => {
                    showToast(`Error loading data: ${error}`, 'danger');
                });
        });

        $(document).on('click', `#${tableId} .delete-btn`, function () {
            if (confirm('Are you sure you want to delete this record?')) {
                const id = $(this).data('id');
                fetch(`http://localhost:8000/api/${endpoint}/${id}/`, {
                    method: 'DELETE',
                })
                .then(() => {
                    showToast('Record deleted successfully!', 'success');
                    $(`#${tableId}`).DataTable().ajax.reload();
                    $('#auditlog-table').DataTable().ajax.reload();
                    if (endpoint === 'rawmaterials' || endpoint === 'products') {
                        checkLowStock();
                    }
                })
                .catch(error => {
                    showToast(`Error deleting record: ${error}`, 'danger');
                });
            }
        });
    };

    setupTableActions('supplier-table', 'suppliers', 'editSupplierModal');
    setupTableActions('rawmaterial-table', 'rawmaterials', 'editRawMaterialModal');
    setupTableActions('order-table', 'productionorders', 'editOrderModal');
    setupTableActions('movement-table', 'stockmovements', 'editMovementModal');
    setupTableActions('product-table', 'products', 'editProductModal');

    // Плавная прокрутка для навигационного меню
    document.querySelectorAll('.nav-link').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            window.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
            });
        });
    });

    // Переключение темы
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Загрузка сохранённой темы
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    // Инициализация AOS
    AOS.init({
        duration: 800,
        once: true,
    });

    // Функция для загрузки отчётов
    const loadReports = (startDate, endDate) => {
        let url = 'http://localhost:8000/api/reports/';
        if (startDate && endDate) {
            url += `?start_date=${startDate}&end_date=${endDate}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Raw Material Usage
                const rawMaterialCtx = document.getElementById('rawMaterialChart').getContext('2d');
                new Chart(rawMaterialCtx, {
                    type: 'bar',
                    data: {
                        labels: data.raw_material_usage.map(item => item.material__name),
                        datasets: [{
                            label: 'Quantity Used',
                            data: data.raw_material_usage.map(item => item.total_used),
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });

                // Order Status Distribution
                const orderStatusCtx = document.getElementById('orderStatusChart').getContext('2d');
                new Chart(orderStatusCtx, {
                    type: 'pie',
                    data: {
                        labels: data.order_statuses.map(item => item.status),
                        datasets: [{
                            label: 'Order Count',
                            data: data.order_statuses.map(item => item.count),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.6)',
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(75, 192, 192, 0.6)',
                            ],
                        }]
                    }
                });

                // Stock Movements Over Time
                const dates = [...new Set(data.stock_movements.map(item => item.date))];
                const inMovements = dates.map(date => {
                    const movement = data.stock_movements.find(m => m.date === date && m.movement_type === 'IN');
                    return movement ? movement.count : 0;
                });
                const outMovements = dates.map(date => {
                    const movement = data.stock_movements.find(m => m.date === date && m.movement_type === 'OUT');
                    return movement ? movement.count : 0;
                });

                const stockMovementCtx = document.getElementById('stockMovementChart').getContext('2d');
                new Chart(stockMovementCtx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [
                            {
                                label: 'IN Movements',
                                data: inMovements,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                fill: true,
                            },
                            {
                                label: 'OUT Movements',
                                data: outMovements,
                                borderColor: 'rgba(255, 99, 132, 1)',
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                fill: true,
                            }
                        ]
                    },
                    options: {
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });

                // Inventory Cost Breakdown
                const inventoryCostCtx = document.getElementById('inventoryCostChart').getContext('2d');
                new Chart(inventoryCostCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Raw Materials', 'Products'],
                        datasets: [{
                            label: 'Cost',
                            data: [data.inventory_cost.raw_materials, data.inventory_cost.products],
                            backgroundColor: [
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(255, 206, 86, 0.6)',
                            ],
                        }]
                    },
                    options: {
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: `Total Cost: $${data.inventory_cost.total.toFixed(2)}`
                            }
                        }
                    }
                });
            })
            .catch(error => {
                showToast('Error loading reports: ' + error, 'danger');
            });
    };

    // Установка начальных значений для фильтра дат
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    document.getElementById('report-start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('report-end-date').value = endDate.toISOString().split('T')[0];

    // Загрузка отчётов при загрузке страницы
    loadReports(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);

    // Обработчик для кнопки фильтра
    document.getElementById('apply-date-filter').addEventListener('click', () => {
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        if (startDate && endDate) {
            // Уничтожаем существующие графики перед перерисовкой
            Chart.helpers.each(Chart.instances, (instance) => {
                instance.destroy();
            });
            loadReports(startDate, endDate);
        } else {
            showToast('Please select both start and end dates.', 'warning');
        }
    });

    // Вызываем проверку при загрузке страницы
    checkLowStock();
});

document.getElementById('add-supplier-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const supplier = {
        name: document.getElementById('supplier-name').value.trim(),
        contact_person: document.getElementById('supplier-contact').value.trim(),
        phone: document.getElementById('supplier-phone').value.trim(),
        email: document.getElementById('supplier-email').value.trim(),
        address: document.getElementById('supplier-address').value.trim(),
    };
    fetch('http://localhost:8000/api/suppliers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(JSON.stringify(errorData));
            });
        }
        return response.json();
    })
    .then(data => {
        showToast('Supplier added successfully!', 'success');
        $('#supplier-table').DataTable().ajax.reload();
        $('#auditlog-table').DataTable().ajax.reload();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addSupplierModal'));
        modal.hide();
        document.getElementById('add-supplier-form').reset();
    })
    .catch(error => {
        showToast('Error adding supplier: ' + error.message, 'danger');
        console.error('Error details:', error);
    });
});

