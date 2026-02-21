# Dashboard API Requirements

## Endpoint
`GET /api/admin/dashboard/stats`

## Required Response Format

The backend should return a JSON object with the following structure:

```typescript
{
  // Legacy fields (keep for compatibility)
  totalOrders: number;           // Total orders all time
  totalRevenue: string;          // Total revenue all time (e.g., "1234.56")
  totalCustomers: number;        // Total customers
  totalProducts: number;         // Total products
  recentOrders: Order[];         // Array of recent orders
  topProducts: Product[];        // Array of top selling products
  
  // NEW DASHBOARD METRICS (required)
  newOrdersToday: number;        // Count of orders created today
  pendingPayment: number;        // Count of orders with PENDING_PAYMENT status
  lowStockItems: number;         // Count of products with stock <= lowStockThreshold
  todayRevenue: string;          // Total revenue from today's orders (e.g., "342.50")
  
  // Orders by Status
  ordersByStatus: [
    {
      status: "PENDING" | "PROCESSING" | "OUT_FOR_DELIVERY" | "COMPLETED" | "CANCELLED";
      count: number;
    }
  ];
  
  // Delivery Slot Utilization
  deliverySlots: [
    {
      time: string;              // e.g., "9-11am", "11am-1pm"
      used: number;              // Number of orders in this slot
      capacity: number;          // Maximum capacity for this slot
    }
  ];
}
```

## Example Response

```json
{
  "totalOrders": 234,
  "totalRevenue": "12456.78",
  "totalCustomers": 156,
  "totalProducts": 89,
  "recentOrders": [],
  "topProducts": [],
  "newOrdersToday": 8,
  "pendingPayment": 3,
  "lowStockItems": 5,
  "todayRevenue": "342.50",
  "ordersByStatus": [
    { "status": "PENDING", "count": 12 },
    { "status": "PROCESSING", "count": 8 },
    { "status": "OUT_FOR_DELIVERY", "count": 5 },
    { "status": "COMPLETED", "count": 145 },
    { "status": "CANCELLED", "count": 2 }
  ],
  "deliverySlots": [
    { "time": "9-11am", "used": 7, "capacity": 10 },
    { "time": "11am-1pm", "used": 10, "capacity": 10 },
    { "time": "1-3pm", "used": 4, "capacity": 10 },
    { "time": "3-5pm", "used": 2, "capacity": 10 }
  ]
}
```

## Backend Implementation Notes

### 1. New Orders Today
```sql
SELECT COUNT(*) FROM orders 
WHERE DATE(created_at) = CURRENT_DATE
```

### 2. Pending Payment
```sql
SELECT COUNT(*) FROM orders 
WHERE status = 'PENDING_PAYMENT'
```

### 3. Low Stock Items
```sql
SELECT COUNT(*) FROM inventory 
WHERE is_tracked = true 
AND quantity <= low_stock_threshold
```

### 4. Today's Revenue
```sql
SELECT SUM(total) FROM orders 
WHERE DATE(created_at) = CURRENT_DATE 
AND status != 'CANCELLED'
```

### 5. Orders by Status
```sql
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status
```

### 6. Delivery Slots
This requires joining orders with delivery_slots table:
```sql
SELECT 
  ds.time_window as time,
  COUNT(o.id) as used,
  ds.capacity
FROM delivery_slots ds
LEFT JOIN orders o ON o.delivery_slot_id = ds.id 
  AND DATE(o.delivery_date) = CURRENT_DATE
GROUP BY ds.id, ds.time_window, ds.capacity
ORDER BY ds.start_time
```

## Frontend Behavior

- The frontend will **gracefully handle missing data** with fallbacks to 0 or empty arrays
- All fields are optional except the legacy ones (for backward compatibility)
- If backend doesn't return new metrics, dashboard will show zeros but won't crash
- Status names are mapped to friendly labels and colors on the frontend

## Testing

To test the dashboard with mock data, the backend can return:
```json
{
  "totalOrders": 234,
  "totalRevenue": "12456.78",
  "totalCustomers": 156,
  "totalProducts": 89,
  "recentOrders": [],
  "topProducts": [],
  "newOrdersToday": 8,
  "pendingPayment": 3,
  "lowStockItems": 5,
  "todayRevenue": "342.50",
  "ordersByStatus": [
    { "status": "PENDING", "count": 12 },
    { "status": "PROCESSING", "count": 8 },
    { "status": "OUT_FOR_DELIVERY", "count": 5 },
    { "status": "COMPLETED", "count": 145 }
  ],
  "deliverySlots": [
    { "time": "9-11am", "used": 7, "capacity": 10 },
    { "time": "11am-1pm", "used": 10, "capacity": 10 },
    { "time": "1-3pm", "used": 4, "capacity": 10 },
    { "time": "3-5pm", "used": 2, "capacity": 10 }
  ]
}
```
