# TabbedOrderInterface Component

A reusable React component for managing multiple orders or purchase orders simultaneously in a tabbed interface.

## Features

- **Multi-Tab Management**: Create, switch, and close multiple tabs
- **Hybrid Labeling**: Date/purpose for orders, vendor names for POs
- **State Preservation**: Each tab maintains independent state
- **Unsaved Changes Protection**: Confirmation dialog before closing dirty tabs
- **Editable Tab Names**: Click to edit tab labels inline
- **Keyboard Shortcuts**: Quick navigation and actions
- **Maximum Tabs Limit**: Configurable limit to prevent performance issues
- **Dirty State Tracking**: Visual indicator for unsaved changes

## Installation

The component is located at:
```
frontend/src/components/orders/TabbedOrderInterface.jsx
```

## Basic Usage

```jsx
import TabbedOrderInterface from './components/orders/TabbedOrderInterface';

function MyOrderComponent() {
  const handleSave = async (tabData) => {
    // Save logic here
    console.log('Saving:', tabData);
  };

  const renderContent = (tabData, tabActions) => {
    return (
      <div>
        <h2>{tabData.label}</h2>
        {/* Your order form content */}
        <button onClick={() => tabActions.save()}>
          Save Order
        </button>
      </div>
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

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `mode` | string | Yes | "order" | Mode: "order" or "po" - determines default labeling |
| `onSave` | function | Yes | - | Callback when saving a tab, receives `tabData` |
| `renderContent` | function | Yes | - | Render function for tab content, receives `(tabData, tabActions)` |
| `initialTabs` | array | No | `[]` | Optional array of initial tabs |
| `maxTabs` | number | No | `10` | Maximum number of tabs allowed |

## API Reference

### onSave Callback

Called when a tab is saved. Receives a `tabData` object:

```javascript
{
  id: "tab-123456789",
  label: "Nov 25",
  data: {
    items: [...],
    header: {...},
    notes: "..."
  }
}
```

**Returns:** Promise that resolves on success or rejects on error.

### renderContent Function

Called to render the content for each tab. Receives two arguments:

**1. tabData** - Current tab's data:
```javascript
{
  id: "tab-123456789",
  label: "Nov 25",
  isDirty: false,
  data: {
    items: [],
    header: {},
    notes: ""
  }
}
```

**2. tabActions** - Actions to interact with the tab:
```javascript
{
  updateData: (newData) => void,      // Update tab data and mark dirty
  save: () => Promise<void>,          // Save current tab
  setDirty: (isDirty) => void,        // Manually set dirty state
  updateLabel: (newLabel) => void     // Update tab label
}
```

## Tab Data Structure

Each tab has the following structure:

```javascript
{
  id: string,           // Unique tab identifier
  label: string,        // Display label (editable)
  isDirty: boolean,     // Has unsaved changes
  data: {
    items: array,       // Line items
    header: object,     // Order/PO header data
    notes: string,      // Additional notes
    // ... custom fields
  }
}
```

## Examples

### Example 1: Order Creation with Tabs

```jsx
function TabbedQuickOrder() {
  const handleSaveOrder = async (tabData) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purpose: tabData.label,
        items: tabData.data.items,
        notes: tabData.data.notes
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save order');
    }

    return response.json();
  };

  const renderOrderContent = (tabData, tabActions) => {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          Order: {tabData.label}
        </h2>

        {/* Order form fields */}
        <input
          type="text"
          placeholder="Notes..."
          value={tabData.data.notes}
          onChange={(e) => tabActions.updateData({
            notes: e.target.value
          })}
        />

        {/* Line items */}
        <div className="mt-4">
          {tabData.data.items.map((item, idx) => (
            <div key={idx}>{item.name}</div>
          ))}
        </div>

        <button
          onClick={() => tabActions.save()}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Save Order
        </button>
      </div>
    );
  };

  return (
    <TabbedOrderInterface
      mode="order"
      onSave={handleSaveOrder}
      renderContent={renderOrderContent}
      maxTabs={10}
    />
  );
}
```

### Example 2: PO Creation with Tabs

```jsx
function TabbedPurchaseOrders() {
  const handleSavePO = async (tabData) => {
    // Save PO to backend
    const response = await createPurchaseOrder({
      vendorName: tabData.label,
      items: tabData.data.items,
      deliveryDate: tabData.data.header.deliveryDate
    });

    return response;
  };

  const renderPOContent = (tabData, tabActions) => {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          PO for {tabData.label}
        </h2>

        {/* PO header */}
        <div className="mb-4">
          <label>Delivery Date</label>
          <input
            type="date"
            value={tabData.data.header.deliveryDate || ''}
            onChange={(e) => tabActions.updateData({
              header: {
                ...tabData.data.header,
                deliveryDate: e.target.value
              }
            })}
          />
        </div>

        {/* Vendor selection */}
        <div className="mb-4">
          <label>Vendor</label>
          <select
            value={tabData.label}
            onChange={(e) => tabActions.updateLabel(e.target.value)}
          >
            <option>Sysco</option>
            <option>US Foods</option>
            <option>Gordon Food Service</option>
          </select>
        </div>

        <button onClick={() => tabActions.save()}>
          Submit PO
        </button>
      </div>
    );
  };

  return (
    <TabbedOrderInterface
      mode="po"
      onSave={handleSavePO}
      renderContent={renderPOContent}
    />
  );
}
```

### Example 3: Initial Tabs

```jsx
function OrdersWithInitialData() {
  const initialTabs = [
    {
      id: 'tab-1',
      label: 'Nov 25',
      isDirty: false,
      data: {
        items: [
          { name: 'Tomatoes', qty: 10, unit: 'lb' }
        ],
        header: { orderDate: '2024-11-25' },
        notes: 'Weekly order'
      }
    },
    {
      id: 'tab-2',
      label: 'Holiday Prep',
      isDirty: true,
      data: {
        items: [
          { name: 'Turkey', qty: 5, unit: 'each' }
        ],
        header: { orderDate: '2024-12-20' },
        notes: 'Holiday supplies'
      }
    }
  ];

  return (
    <TabbedOrderInterface
      mode="order"
      onSave={handleSave}
      renderContent={renderContent}
      initialTabs={initialTabs}
    />
  );
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | Create new tab |
| `Cmd/Ctrl + W` | Close current tab |
| `Cmd/Ctrl + S` | Save current tab (if dirty) |
| `Cmd/Ctrl + Tab` | Next tab |
| `Cmd/Ctrl + Shift + Tab` | Previous tab |
| `Enter` | Confirm tab label edit |
| `Escape` | Cancel tab label edit |

## User Interactions

### Creating a New Tab

1. Click the **"+ New"** button in the tab bar
2. A new tab is created with default label
3. The new tab becomes active
4. Content area shows empty form for new tab

### Switching Tabs

1. Click on any inactive tab
2. Tab becomes active (green border)
3. Content area updates to show that tab's data
4. Previous tab's state is preserved

### Editing Tab Label

1. Click the edit icon (pencil) on active tab
2. Input field appears
3. Type new label
4. Press **Enter** to save or **Escape** to cancel
5. Label updates

### Closing a Tab

**Clean Tab (no unsaved changes):**
1. Click the **×** button on tab
2. Tab closes immediately
3. Previous tab becomes active

**Dirty Tab (has unsaved changes):**
1. Click the **×** button (highlighted in orange)
2. Confirmation dialog appears
3. Choose one of:
   - **Save & Close**: Saves then closes
   - **Discard Changes**: Closes without saving
   - **Cancel**: Keeps tab open

### Saving a Tab

1. Make changes to tab content (tab marked dirty with *)
2. Click save button in content area
3. `onSave` callback is triggered
4. On success, dirty indicator disappears
5. On error, error message shown

## Visual States

### Tab Appearance

**Inactive Tab:**
- Gray background (`bg-gray-50`)
- Gray text
- Hover effect (lighter gray)

**Active Tab:**
- White background
- Green bottom border (2px)
- Black text
- Edit button visible on hover

**Dirty Tab:**
- Orange asterisk (*) next to label
- Orange close button (always visible)

**Maximum Tabs Reached:**
- **"+ New"** button disabled
- Gray color
- Tooltip shows limit message

### Tab Bar Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Tab 1 ×] [Tab 2 *×] [Tab 3 (active)]              [+ New] │
└─────────────────────────────────────────────────────────────┘
  inactive   dirty     active                         add btn
```

## Edge Cases

### 1. Closing Last Tab
- When closing the only remaining tab
- Component creates a new empty tab
- Prevents empty tab bar

### 2. Maximum Tabs Limit
- Default: 10 tabs
- **"+ New"** button becomes disabled
- Tooltip: "Maximum 10 tabs reached"

### 3. Long Tab Labels
- Labels truncated at 15 characters
- Ellipsis (...) added
- Full label shown in tooltip on hover

### 4. Navigate Away with Unsaved Changes
- Browser `beforeunload` event triggered
- Warning dialog: "You have unsaved changes"
- User can choose to stay or leave

### 5. Save Failure
- If `onSave` rejects/throws error
- Tab remains dirty
- Error can be caught and displayed
- Tab not closed

### 6. Duplicate Labels
- Currently allowed
- No validation for uniqueness
- Consider adding validation if needed

## Performance Considerations

### Tab Limit
- Default maximum: 10 tabs
- Each tab maintains full state in memory
- More tabs = more memory usage
- Limit prevents performance degradation

### State Management
- All tabs stored in single state array
- Switching tabs is O(1) operation
- No performance impact with 10 tabs

### Re-rendering
- Only active tab content re-renders
- Inactive tabs preserved in memory
- Efficient tab switching

## Styling

The component uses Tailwind CSS classes. Key styles:

```jsx
// Tab bar container
"flex items-center border-b border-gray-200 bg-white overflow-x-auto"

// Active tab
"bg-white border-b-2 border-green-500 -mb-[1px]"

// Inactive tab
"bg-gray-50 hover:bg-gray-100"

// Add button
"text-green-600 hover:bg-green-50"

// Dirty indicator
"text-orange-500"

// Close button
"hover:text-red-500"
```

## Accessibility

- Keyboard navigation fully supported
- Focus indicators on interactive elements
- ARIA labels can be added for screen readers
- Color contrast meets WCAG AA standards

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used (arrow functions, destructuring)
- Requires React 16.8+ (hooks)

## Testing

Test file located at:
```
frontend/src/components/orders/__tests__/TabbedOrderInterface.test.jsx
```

Run tests:
```bash
cd frontend
npm test TabbedOrderInterface
```

## Troubleshooting

### Issue: Tabs not updating

**Solution:** Ensure you're calling `tabActions.updateData()` when making changes.

### Issue: Save not working

**Solution:** Check that `onSave` callback returns a Promise.

### Issue: Dirty state not showing

**Solution:** Use `tabActions.updateData()` instead of directly mutating state.

### Issue: Tab content not rendering

**Solution:** Verify `renderContent` function returns valid JSX.

## Future Enhancements

Potential improvements:

1. **Drag and Drop**: Reorder tabs by dragging
2. **Tab Persistence**: Save tabs to localStorage
3. **Tab Templates**: Pre-defined tab templates
4. **Tab Groups**: Organize tabs into groups
5. **Tab History**: Undo/redo tab changes
6. **Tab Search**: Search across all tabs
7. **Auto-save**: Periodic auto-save of dirty tabs
8. **Tab Duplication**: Duplicate existing tab

## License

Part of the Invantry project.

## Support

For issues or questions, contact the development team.
