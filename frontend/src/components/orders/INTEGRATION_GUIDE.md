# TabbedOrderInterface - Integration Guide

This guide explains how to integrate the TabbedOrderInterface component into your existing order/PO workflows.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Integration Steps](#integration-steps)
3. [Migration from Single Order View](#migration-from-single-order-view)
4. [State Management](#state-management)
5. [Error Handling](#error-handling)
6. [Testing Integration](#testing-integration)

## Quick Start

### Step 1: Import the Component

```jsx
import TabbedOrderInterface from './components/orders/TabbedOrderInterface';
```

### Step 2: Define Save Handler

```jsx
const handleSaveOrder = async (tabData) => {
  // Your save logic
  const response = await ordersService.createOrder({
    purpose: tabData.label,
    items: tabData.data.items,
    ...tabData.data.header
  });
  return response;
};
```

### Step 3: Define Content Renderer

```jsx
const renderContent = (tabData, tabActions) => {
  return <YourOrderFormComponent
    data={tabData.data}
    onUpdate={(newData) => tabActions.updateData(newData)}
    onSave={() => tabActions.save()}
  />;
};
```

### Step 4: Render Component

```jsx
<TabbedOrderInterface
  mode="order"
  onSave={handleSaveOrder}
  renderContent={renderContent}
/>
```

## Integration Steps

### Integration with CreateQuickOrder

**Before (Single Order):**
```jsx
// CreateQuickOrder.jsx - Original
export default function CreateQuickOrder() {
  const [orderData, setOrderData] = useState({
    items: [],
    header: {}
  });

  const handleSubmit = async () => {
    await createOrder(orderData);
  };

  return (
    <div>
      <OrderHeader data={orderData.header} onChange={...} />
      <OrderLineItems items={orderData.items} onChange={...} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

**After (Tabbed Interface):**
```jsx
// CreateQuickOrderTabbed.jsx - New
import TabbedOrderInterface from './TabbedOrderInterface';
import OrderFormContent from './OrderFormContent';

export default function CreateQuickOrderTabbed() {
  const handleSave = async (tabData) => {
    return await createOrder({
      purpose: tabData.label,
      ...tabData.data
    });
  };

  const renderContent = (tabData, tabActions) => {
    return (
      <OrderFormContent
        data={tabData.data}
        label={tabData.label}
        onUpdate={(newData) => tabActions.updateData(newData)}
        onSave={() => tabActions.save()}
      />
    );
  };

  return (
    <TabbedOrderInterface
      mode="order"
      onSave={handleSave}
      renderContent={renderContent}
    />
  );
}
```

**Extract Form Content:**
```jsx
// OrderFormContent.jsx - Extracted content
export default function OrderFormContent({ data, label, onUpdate, onSave }) {
  const handleHeaderChange = (field, value) => {
    onUpdate({
      ...data,
      header: { ...data.header, [field]: value }
    });
  };

  const handleItemsChange = (newItems) => {
    onUpdate({
      ...data,
      items: newItems
    });
  };

  return (
    <div className="p-6">
      <h2>{label}</h2>
      <OrderHeader
        data={data.header}
        onChange={handleHeaderChange}
      />
      <OrderLineItems
        items={data.items}
        onChange={handleItemsChange}
      />
      <button onClick={onSave}>Save Order</button>
    </div>
  );
}
```

### Integration with CreateQuickPO

```jsx
// CreateQuickPOTabbed.jsx
import TabbedOrderInterface from './TabbedOrderInterface';

export default function CreateQuickPOTabbed() {
  const handleSavePO = async (tabData) => {
    return await purchaseOrderService.create({
      vendorName: tabData.label,
      items: tabData.data.items,
      deliveryDate: tabData.data.header.deliveryDate
    });
  };

  const renderContent = (tabData, tabActions) => {
    return (
      <POFormContent
        vendorName={tabData.label}
        data={tabData.data}
        onUpdate={tabActions.updateData}
        onSave={tabActions.save}
        onVendorChange={tabActions.updateLabel}
      />
    );
  };

  return (
    <TabbedOrderInterface
      mode="po"
      onSave={handleSavePO}
      renderContent={renderContent}
      maxTabs={8}
    />
  );
}
```

## Migration from Single Order View

### Option 1: Side-by-Side (Recommended)

Keep both versions and let users choose:

```jsx
// OrdersContent.jsx
export default function OrdersContent() {
  const [useTabbedView, setUseTabbedView] = useState(false);

  return (
    <div>
      <div className="mb-4">
        <label>
          <input
            type="checkbox"
            checked={useTabbedView}
            onChange={(e) => setUseTabbedView(e.target.checked)}
          />
          Use Tabbed View (Beta)
        </label>
      </div>

      {useTabbedView ? (
        <CreateQuickOrderTabbed />
      ) : (
        <CreateQuickOrder />
      )}
    </div>
  );
}
```

### Option 2: Feature Flag

Use feature flag for gradual rollout:

```jsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';

export default function OrdersContent() {
  const tabbedViewEnabled = useFeatureFlag('tabbed-order-view');

  return tabbedViewEnabled ? (
    <CreateQuickOrderTabbed />
  ) : (
    <CreateQuickOrder />
  );
}
```

### Option 3: Direct Replacement

Replace single view with tabbed view:

```jsx
// Before
import CreateQuickOrder from './CreateQuickOrder';

// After
import CreateQuickOrderTabbed from './CreateQuickOrderTabbed';
```

## State Management

### Pattern 1: Full Control

Component manages all state:

```jsx
const renderContent = (tabData, tabActions) => {
  const [localState, setLocalState] = useState({});

  return (
    <div>
      {/* Use both tabData and localState */}
      <input
        value={tabData.data.notes}
        onChange={(e) => tabActions.updateData({
          notes: e.target.value
        })}
      />
    </div>
  );
};
```

### Pattern 2: Computed Values

Derive values from tab data:

```jsx
const renderContent = (tabData, tabActions) => {
  const total = useMemo(() => {
    return tabData.data.items.reduce((sum, item) =>
      sum + (item.qty * item.cost), 0
    );
  }, [tabData.data.items]);

  return (
    <div>
      <p>Total: ${total.toFixed(2)}</p>
    </div>
  );
};
```

### Pattern 3: Side Effects

Handle side effects based on tab data:

```jsx
const renderContent = (tabData, tabActions) => {
  useEffect(() => {
    // Fetch vendor details when vendor changes
    if (tabData.label) {
      fetchVendorDetails(tabData.label);
    }
  }, [tabData.label]);

  return <div>...</div>;
};
```

## Error Handling

### Pattern 1: Try-Catch in onSave

```jsx
const handleSave = async (tabData) => {
  try {
    const response = await ordersService.createOrder(tabData.data);

    // Success notification
    toast.success('Order saved successfully!');

    return response;
  } catch (error) {
    // Error notification
    toast.error(`Failed to save: ${error.message}`);

    // Re-throw to keep tab dirty
    throw error;
  }
};
```

### Pattern 2: Error State in Content

```jsx
const renderContent = (tabData, tabActions) => {
  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      setError(null);
      await tabActions.save();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

### Pattern 3: Validation Before Save

```jsx
const handleSave = async (tabData) => {
  // Validate
  const errors = validateOrderData(tabData.data);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  // Save
  return await ordersService.createOrder(tabData.data);
};
```

## Testing Integration

### Unit Test Example

```jsx
// CreateQuickOrderTabbed.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateQuickOrderTabbed from './CreateQuickOrderTabbed';
import * as ordersService from '../../services/ordersService';

vi.mock('../../services/ordersService');

describe('CreateQuickOrderTabbed', () => {
  it('should save order when Save button clicked', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 123 });
    ordersService.createOrder = mockCreate;

    const user = userEvent.setup();
    render(<CreateQuickOrderTabbed />);

    // Add items, fill form...

    // Click save
    const saveButton = screen.getByText('Save Order');
    await user.click(saveButton);

    // Verify service called
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          purpose: expect.any(String),
          items: expect.any(Array)
        })
      );
    });
  });

  it('should create multiple orders in different tabs', async () => {
    const user = userEvent.setup();
    render(<CreateQuickOrderTabbed />);

    // Create second tab
    await user.click(screen.getByText('New'));

    // Should have 2 tabs
    const tabs = screen.getAllByRole('button');
    expect(tabs.length).toBeGreaterThan(1);
  });
});
```

### Integration Test Example

```jsx
// OrderWorkflow.test.jsx
describe('Order Workflow with Tabs', () => {
  it('should complete full order workflow', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    // Navigate to orders
    await user.click(screen.getByText('Orders'));
    await user.click(screen.getByText('Create Quick Order'));

    // Fill first order
    await user.type(screen.getByLabelText('Order Taker'), 'John Doe');
    await user.click(screen.getByText('Add Line Item'));
    await user.type(screen.getByPlaceholderText('Item name'), 'Tomatoes');
    await user.type(screen.getByPlaceholderText('Qty'), '10');

    // Create second order in new tab
    await user.click(screen.getByText('New'));
    await user.type(screen.getByLabelText('Order Taker'), 'Jane Smith');
    await user.click(screen.getByText('Add Line Item'));
    await user.type(screen.getByPlaceholderText('Item name'), 'Lettuce');

    // Switch back to first tab and save
    await user.click(screen.getByText(/Nov \d+/));
    await user.click(screen.getByText('Save Order'));

    // Verify order saved
    await waitFor(() => {
      expect(screen.getByText('Order saved successfully')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

### 1. Keep Content Components Simple

Extract complex logic into separate components or hooks:

```jsx
// Good
const renderContent = (tabData, tabActions) => {
  return <OrderForm data={tabData.data} actions={tabActions} />;
};

// Avoid
const renderContent = (tabData, tabActions) => {
  return (
    <div>
      {/* 500 lines of JSX */}
    </div>
  );
};
```

### 2. Use Memoization

Prevent unnecessary re-renders:

```jsx
const renderContent = useCallback((tabData, tabActions) => {
  return <OrderForm data={tabData.data} actions={tabActions} />;
}, []);
```

### 3. Handle Loading States

Show loading indicators during save:

```jsx
const [saving, setSaving] = useState(false);

const handleSave = async (tabData) => {
  setSaving(true);
  try {
    return await ordersService.createOrder(tabData.data);
  } finally {
    setSaving(false);
  }
};
```

### 4. Provide Feedback

Give users clear feedback on actions:

```jsx
const handleSave = async (tabData) => {
  try {
    await ordersService.createOrder(tabData.data);
    showSuccessMessage('Order saved!');
  } catch (error) {
    showErrorMessage('Save failed: ' + error.message);
    throw error; // Keep tab dirty
  }
};
```

### 5. Validate Before Save

Prevent invalid data from being submitted:

```jsx
const handleSave = async (tabData) => {
  // Client-side validation
  if (!tabData.data.items || tabData.data.items.length === 0) {
    throw new Error('Order must have at least one item');
  }

  // API call
  return await ordersService.createOrder(tabData.data);
};
```

## Troubleshooting

### Issue: Tab content not updating

**Cause:** Not using `tabActions.updateData()`

**Solution:**
```jsx
// Wrong
const handleChange = (value) => {
  tabData.data.notes = value; // Direct mutation
};

// Correct
const handleChange = (value) => {
  tabActions.updateData({ notes: value });
};
```

### Issue: Save not marking tab as clean

**Cause:** `onSave` not returning a Promise

**Solution:**
```jsx
// Wrong
const handleSave = (tabData) => {
  ordersService.createOrder(tabData.data);
};

// Correct
const handleSave = async (tabData) => {
  return await ordersService.createOrder(tabData.data);
};
```

### Issue: Losing data when switching tabs

**Cause:** Using local state instead of tab data

**Solution:**
```jsx
// Wrong
const renderContent = (tabData, tabActions) => {
  const [items, setItems] = useState([]);
  // items lost when switching tabs
};

// Correct
const renderContent = (tabData, tabActions) => {
  const items = tabData.data.items;
  const setItems = (newItems) => {
    tabActions.updateData({ items: newItems });
  };
};
```

## Next Steps

1. Test the component with your existing workflows
2. Gather user feedback on the tabbed interface
3. Monitor performance with multiple tabs
4. Consider adding advanced features (drag-and-drop, templates, etc.)

## Support

For questions or issues, refer to:
- [Component README](./TabbedOrderInterface.README.md)
- Component source code
- Test examples
