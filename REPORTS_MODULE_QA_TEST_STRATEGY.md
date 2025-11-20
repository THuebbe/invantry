# Reports Module - Comprehensive QA Test Strategy

**Document Version:** 1.0
**Created:** November 8, 2025
**Project:** Invantry Restaurant Inventory Management System
**Module:** Reports & Analytics Frontend
**Status:** Ready for Development & QA

---

## Table of Contents

1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Component Test Specifications](#2-component-test-specifications)
3. [Shared Component Test Specs](#3-shared-component-test-specs)
4. [Integration Test Plan](#4-integration-test-plan)
5. [Accessibility Test Plan](#5-accessibility-test-plan)
6. [Performance Test Plan](#6-performance-test-plan)
7. [Browser Compatibility Matrix](#7-browser-compatibility-matrix)
8. [Mobile Testing Specifications](#8-mobile-testing-specifications)
9. [Error Scenario Test Cases](#9-error-scenario-test-cases)
10. [Data Validation Test Cases](#10-data-validation-test-cases)
11. [Test Execution Checklist](#11-test-execution-checklist)
12. [Bug Tracking Template](#12-bug-tracking-template)

---

## 1. Test Strategy Overview

### 1.1 Testing Approach

**Testing Pyramid:**
- **Unit Tests (60%):** Component-level tests using React Testing Library + Vitest
- **Integration Tests (30%):** API integration and component composition tests
- **E2E Tests (10%):** Critical user workflows using Cypress/Playwright

**Testing Philosophy:**
- Test user behavior, not implementation details
- Focus on accessibility from the start
- Performance testing integrated into development cycle
- Mobile-first responsive validation

### 1.2 Testing Tools and Frameworks

| Tool | Purpose | Version |
|------|---------|---------|
| **Vitest** | Unit test runner (fast, Vite-compatible) | Latest |
| **React Testing Library** | Component testing | Latest |
| **@testing-library/user-event** | User interaction simulation | Latest |
| **@testing-library/jest-dom** | DOM assertion matchers | Latest |
| **Cypress** OR **Playwright** | E2E testing | Latest |
| **axe-core** | Accessibility testing | Latest |
| **@axe-core/react** | Runtime accessibility checks | Latest |
| **Lighthouse CI** | Performance/accessibility audits | Latest |
| **NVDA/JAWS** | Screen reader testing | Latest |
| **MSW (Mock Service Worker)** | API mocking | Latest |

### 1.3 Coverage Targets

| Metric | Target | Critical Path |
|--------|--------|---------------|
| **Line Coverage** | 80% minimum | 95% minimum |
| **Branch Coverage** | 75% minimum | 90% minimum |
| **Function Coverage** | 80% minimum | 95% minimum |
| **Accessibility (axe)** | 0 violations | 0 violations |
| **Performance (Lighthouse)** | 90+ score | 95+ score |

### 1.4 Risk Assessment by Component

| Component | Risk Level | Rationale | Mitigation |
|-----------|------------|-----------|------------|
| **WasteAnalysisReport** | HIGH | Complex data visualization, multiple charts, high user value | Extensive unit tests, visual regression tests, performance monitoring |
| **DashboardOverviewReport** | MEDIUM | Multiple metric cards, but simpler UI | Standard test coverage, accessibility focus |
| **FoodCostReport** | MEDIUM-HIGH | Financial calculations must be accurate | Calculation validation tests, comparison logic tests |
| **InventoryHealthReport** | MEDIUM | Stock level calculations, expiration logic | Edge case testing for dates, quantity thresholds |
| **OrderPerformanceReport** | LOW | Placeholder component initially | Minimal testing until full implementation |
| **MetricSummaryCard** | HIGH | Reused across all reports | Comprehensive prop testing, snapshot tests |
| **BarChart** | HIGH | Critical visualization component | Visual regression, data accuracy, accessibility |
| **DataTable** | MEDIUM-HIGH | Complex sorting/filtering logic | User interaction tests, performance with large datasets |
| **DateRangePicker** | MEDIUM | Date logic can be tricky | Date validation, timezone handling, mobile touch tests |
| **ComparisonBadge** | LOW | Simple display component | Basic rendering tests |

### 1.5 Test Environment Setup

**Required Test Data:**
- Waste data: 50+ entries spanning 3 months with various categories/reasons
- Inventory data: 100+ items with varied stock levels and expiration dates
- Order data: 25+ purchase orders with different statuses
- Empty datasets for each report type
- Edge case data (very large numbers, special characters, null values)

**Mock API Responses:**
- All 8 backend report endpoints documented in `backend/src/routes/reports.js`
- Error scenarios (401, 403, 404, 500)
- Timeout simulations (slow network)
- Malformed responses

---

## 2. Component Test Specifications

### 2.1 WasteAnalysisReport

**File Location:** `frontend/src/components/dashboard/content/ReportsContent.jsx` (to be extracted)

**Component Purpose:**
Primary waste tracking dashboard displaying waste trends, category breakdowns, reason analysis, and top wasted items with comparison features.

#### Success Criteria
- [ ] Component renders without errors with valid data
- [ ] All waste metrics display correctly
- [ ] Charts render with accurate data
- [ ] Period selector changes data appropriately
- [ ] Comparison toggle shows/hides comparison data
- [ ] Loading states show during data fetch
- [ ] Error states display user-friendly messages
- [ ] Empty state shows when no waste data exists
- [ ] All text is readable (contrast, size)
- [ ] Component is fully keyboard accessible

#### Data Scenarios to Test

**Happy Path:**
```javascript
// Test Case ID: WA-001
// Priority: CRITICAL
const mockWasteSummary = {
  period: { type: "week", start: "2025-11-01", end: "2025-11-08" },
  waste: { total_value: 1234.56, total_count: 45, avg_per_incident: 27.44 },
  all_reductions: { total_value: 1500.00 }
};
// Expected: All metrics display correctly, formatted as currency
```

**Empty Data:**
```javascript
// Test Case ID: WA-002
// Priority: HIGH
const mockEmptyWaste = {
  period: { type: "week", start: "2025-11-01", end: "2025-11-08" },
  waste: { total_value: 0, total_count: 0, avg_per_incident: 0 },
  all_reductions: { total_value: 0 }
};
// Expected: Shows "No waste data for this period" message
```

**Large Dataset:**
```javascript
// Test Case ID: WA-003
// Priority: MEDIUM
const mockLargeWaste = {
  // 1000+ waste entries
  categories: Array(50).fill({...}),
  trends: Array(365).fill({...})
};
// Expected: Renders in < 500ms, no UI freezing, charts paginated/scrollable
```

**Comparison Data:**
```javascript
// Test Case ID: WA-004
// Priority: HIGH
const mockComparisonWaste = {
  ...mockWasteSummary,
  comparison: {
    previous_period: { total_value: 1000.00 },
    change: { value: 234.56, percent: 23.5, direction: "increased" }
  }
};
// Expected: Comparison badge shows +23.5% with red/up indicator
```

#### User Interactions to Validate

| Interaction | Expected Behavior | Test ID | Priority |
|-------------|-------------------|---------|----------|
| **Period selector: Change from "week" to "month"** | Triggers API call with `?period=month`, updates all charts/metrics | WA-UI-001 | CRITICAL |
| **Click "Compare to Previous Period" toggle** | Triggers API call with `?compare=true`, displays comparison data | WA-UI-002 | HIGH |
| **Custom date range selection** | Validates dates, calls API with `?start=X&end=Y`, updates UI | WA-UI-003 | MEDIUM |
| **Click on category in chart** | (Future: drill down) No action or tooltip shows details | WA-UI-004 | LOW |
| **Hover over chart elements** | Shows tooltip with detailed data | WA-UI-005 | MEDIUM |
| **Scroll through large dataset** | Smooth scrolling, no jank, charts remain visible | WA-UI-006 | HIGH |

#### Visual Regression Checks

- [ ] **Baseline Screenshots:** Capture for each state (loading, loaded, empty, error)
- [ ] **Responsive Breakpoints:** 375px, 768px, 1024px, 1440px
- [ ] **Theme Consistency:** Green primary, red for waste increases, gray neutrals
- [ ] **Chart Rendering:** Verify bar charts, line charts, pie charts render identically
- [ ] **Font Rendering:** Check for consistent typography across browsers

#### Performance Requirements

| Metric | Target | Critical |
|--------|--------|----------|
| Initial Render (with data) | < 500ms | < 800ms |
| Data Fetch Time | < 1s | < 2s |
| Period Change Re-render | < 300ms | < 500ms |
| Chart Animation Duration | 200-400ms | N/A |
| Memory Usage (loaded state) | < 50MB | < 100MB |

#### Accessibility Requirements

- [ ] **Keyboard Navigation:**
  - Tab through all interactive elements (period selector, compare toggle, date inputs)
  - Enter/Space activates buttons
  - Escape closes date picker
  - Focus visible on all elements (2px outline)

- [ ] **Screen Reader Compatibility:**
  - Component has `role="region"` with `aria-label="Waste Analysis Report"`
  - All metrics have descriptive labels ("Total Waste: $1,234.56")
  - Charts have `aria-label` describing the data
  - Loading state announces "Loading waste data"
  - Error state announces error message

- [ ] **Color Contrast:**
  - All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
  - Chart colors distinguishable for color-blind users
  - Don't rely on color alone (use patterns/labels)

- [ ] **Focus Management:**
  - Focus returns to trigger after date picker closes
  - Focus moves to content after period change
  - Skip links available for long content

**Test Cases:**
```javascript
// Test Case ID: WA-A11Y-001
test('WasteAnalysisReport is keyboard accessible', async () => {
  const user = userEvent.setup();
  render(<WasteAnalysisReport />);

  // Tab to period selector
  await user.tab();
  expect(screen.getByRole('combobox', { name: /period/i })).toHaveFocus();

  // Open dropdown with Enter
  await user.keyboard('{Enter}');
  expect(screen.getByRole('option', { name: /month/i })).toBeVisible();

  // Select option with Enter
  await user.keyboard('{ArrowDown}{Enter}');
  expect(await screen.findByText(/November 2025/i)).toBeInTheDocument();
});

// Test Case ID: WA-A11Y-002
test('WasteAnalysisReport has no axe violations', async () => {
  const { container } = render(<WasteAnalysisReport />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

### 2.2 DashboardOverviewReport

**Component Purpose:**
High-level metrics summary showing key performance indicators across all areas (waste, inventory, orders).

#### Success Criteria
- [ ] Displays 4-6 metric summary cards
- [ ] Each metric card shows current value and trend
- [ ] Cards link to detailed reports
- [ ] Responsive grid layout adjusts for mobile
- [ ] Loading skeleton shows while data fetches
- [ ] All metrics update when date range changes

#### Data Scenarios to Test

**Happy Path:**
```javascript
// Test Case ID: DO-001
const mockDashboardData = {
  waste: { total_value: 1234.56, change_percent: -12.5 },
  inventory: { low_stock_count: 5, total_items: 150 },
  food_cost: { percentage: 28.5, target: 30.0 },
  orders: { pending: 3, overdue: 1 }
};
// Expected: 4 metric cards display with proper formatting
```

**Empty Data:**
```javascript
// Test Case ID: DO-002
const mockEmptyDashboard = {
  waste: { total_value: 0, change_percent: 0 },
  inventory: { low_stock_count: 0, total_items: 0 },
  food_cost: { percentage: 0, target: 0 },
  orders: { pending: 0, overdue: 0 }
};
// Expected: Cards show "No data" or $0.00 appropriately
```

#### User Interactions to Validate

| Interaction | Expected Behavior | Test ID | Priority |
|-------------|-------------------|---------|----------|
| **Click on metric card** | Navigates to detailed report (e.g., Waste Analysis) | DO-UI-001 | HIGH |
| **Change date range** | Fetches new data, updates all metric cards | DO-UI-002 | HIGH |
| **Hover on metric card** | Shows subtle elevation/shadow | DO-UI-003 | LOW |

#### Visual Regression Checks
- [ ] Grid layout: 2 columns mobile, 3 columns tablet, 4 columns desktop
- [ ] Card spacing consistent (16px gap)
- [ ] Trend indicators (↑↓) properly colored (green=good, red=bad)

#### Performance Requirements
| Metric | Target |
|--------|--------|
| Initial Render | < 300ms |
| Data Fetch | < 1s |

#### Accessibility Requirements
- [ ] Each card is a `<a>` tag with descriptive text (not just "View Report")
- [ ] Keyboard navigable (tab through cards)
- [ ] Screen reader announces card content meaningfully

**Test Cases:**
```javascript
// Test Case ID: DO-A11Y-001
test('DashboardOverviewReport cards are keyboard navigable', async () => {
  const user = userEvent.setup();
  render(<DashboardOverviewReport />);

  const cards = screen.getAllByRole('link');
  expect(cards).toHaveLength(4);

  // Tab through all cards
  for (const card of cards) {
    await user.tab();
    expect(card).toHaveFocus();
  }
});
```

---

### 2.3 FoodCostReport

**Component Purpose:**
Displays food cost analysis including waste costs, inventory value, waste percentage, and comparison to previous periods.

#### Success Criteria
- [ ] Shows waste cost, inventory value, and waste percentage
- [ ] Comparison mode shows previous period data with change indicators
- [ ] Chart visualizes waste percentage over time
- [ ] Note about missing sales data is clearly displayed
- [ ] All currency values formatted correctly (2 decimal places)
- [ ] Percentage calculations are accurate

#### Data Scenarios to Test

**Happy Path:**
```javascript
// Test Case ID: FC-001
const mockFoodCostData = {
  period: { type: "month", start: "2025-10-01", end: "2025-10-31" },
  waste_cost: 1234.56,
  total_inventory_value: 15000.00,
  waste_percentage: 8.23,
  note: "Food cost % calculation requires sales data..."
};
// Expected: All values display, waste_percentage = (1234.56/15000) * 100 = 8.23%
```

**Comparison Data:**
```javascript
// Test Case ID: FC-002
const mockComparisonData = {
  ...mockFoodCostData,
  comparison: {
    previous_period: { waste_cost: 1000.00 },
    change: { value: 234.56, percent: 23.5, direction: "increased" }
  }
};
// Expected: Shows "+$234.56 (+23.5%)" in red with up arrow
```

**Edge Cases:**
```javascript
// Test Case ID: FC-003
const mockZeroInventory = {
  waste_cost: 500.00,
  total_inventory_value: 0,
  waste_percentage: 0 // Should handle division by zero
};
// Expected: Shows "N/A" or "0.00%" for waste_percentage, no crashes

// Test Case ID: FC-004
const mockNegativeChange = {
  comparison: {
    change: { value: -150.00, percent: -15.0, direction: "decreased" }
  }
};
// Expected: Shows "-$150.00 (-15.0%)" in green with down arrow
```

#### User Interactions to Validate

| Interaction | Expected Behavior | Test ID | Priority |
|-------------|-------------------|---------|----------|
| **Toggle comparison mode** | Fetches comparison data, displays side-by-side metrics | FC-UI-001 | HIGH |
| **Change period (week/month/quarter)** | Updates all calculations and chart | FC-UI-002 | CRITICAL |
| **Hover on chart data point** | Shows tooltip with exact values | FC-UI-003 | MEDIUM |

#### Visual Regression Checks
- [ ] Currency formatting: $1,234.56 (comma separators, 2 decimals)
- [ ] Percentage formatting: 8.23% (2 decimal precision)
- [ ] Comparison badge colors: green for decrease, red for increase
- [ ] Note box stands out (info color, not error)

#### Performance Requirements
| Metric | Target |
|--------|--------|
| Initial Render | < 400ms |
| Comparison Toggle | < 200ms |

#### Accessibility Requirements
- [ ] All metrics have descriptive labels read by screen readers
- [ ] Chart has text alternative describing trend
- [ ] Color not sole indicator of good/bad (use icons/text)

**Test Cases:**
```javascript
// Test Case ID: FC-CALC-001
test('FoodCostReport calculates waste percentage correctly', () => {
  const data = {
    waste_cost: 1234.56,
    total_inventory_value: 15000.00
  };

  render(<FoodCostReport data={data} />);

  // Calculate expected percentage
  const expectedPercentage = (1234.56 / 15000.00) * 100;
  expect(screen.getByText(`${expectedPercentage.toFixed(2)}%`)).toBeInTheDocument();
});

// Test Case ID: FC-CALC-002
test('FoodCostReport handles zero inventory value', () => {
  const data = {
    waste_cost: 500.00,
    total_inventory_value: 0
  };

  render(<FoodCostReport data={data} />);

  // Should not crash, should show N/A or 0.00%
  expect(screen.queryByText('NaN%')).not.toBeInTheDocument();
});
```

---

### 2.4 InventoryHealthReport

**Component Purpose:**
Displays inventory health metrics including low stock items, expiring items, stock level distribution, and inventory turnover indicators.

#### Success Criteria
- [ ] Shows low stock count and list
- [ ] Shows expiring soon count and list
- [ ] Displays expired items (negative days)
- [ ] Stock level chart shows distribution (overstocked, healthy, low, out)
- [ ] Sorting and filtering work correctly
- [ ] All dates formatted consistently (MM/DD/YYYY or user preference)

#### Data Scenarios to Test

**Happy Path:**
```javascript
// Test Case ID: IH-001
const mockInventoryHealth = {
  low_stock_items: [
    { id: "1", name: "Chicken Breast", quantity: 5, minimum: 20, unit: "lbs" },
    { id: "2", name: "Tomatoes", quantity: 8, minimum: 10, unit: "lbs" }
  ],
  expiring_soon: [
    { id: "3", name: "Milk", expiration_date: "2025-11-10", days_until: 2 },
    { id: "4", name: "Lettuce", expiration_date: "2025-11-09", days_until: 1 }
  ],
  expired_items: [
    { id: "5", name: "Yogurt", expiration_date: "2025-11-05", days_since: 3 }
  ],
  stock_distribution: {
    overstocked: 5,
    healthy: 120,
    low: 10,
    out_of_stock: 2
  }
};
// Expected: All lists populated, chart shows 4 categories
```

**Edge Cases:**
```javascript
// Test Case ID: IH-002
const mockExpiredLogic = {
  expiring_soon: [
    { expiration_date: "2025-11-08", days_until: 0 }, // Today
    { expiration_date: "2025-11-07", days_until: -1 } // Yesterday (expired)
  ]
};
// Expected: Today shows "Expires today!", yesterday shows "Expired! (1 day ago)"

// Test Case ID: IH-003
const mockNoExpirationDate = {
  items: [
    { id: "6", name: "Dry Rice", expiration_date: null }
  ]
};
// Expected: Shows "No expiration date" or "N/A"
```

#### User Interactions to Validate

| Interaction | Expected Behavior | Test ID | Priority |
|-------------|-------------------|---------|----------|
| **Click "Low Stock" tab** | Filters to show only low stock items | IH-UI-001 | HIGH |
| **Click "Expiring Soon" tab** | Shows items expiring within 7 days | IH-UI-002 | HIGH |
| **Sort by expiration date** | Sorts items from soonest to latest (or expired first) | IH-UI-003 | MEDIUM |
| **Click on item row** | (Future: navigate to item details) No action or shows tooltip | IH-UI-004 | LOW |

#### Visual Regression Checks
- [ ] Expired items highlighted in red/pink
- [ ] Low stock items have warning icon/color
- [ ] Date formatting consistent across component
- [ ] Chart colors: overstocked=red, healthy=green, low=yellow, out=gray

#### Performance Requirements
| Metric | Target |
|--------|--------|
| Render 100+ items | < 500ms |
| Sort/Filter | < 100ms |

#### Accessibility Requirements
- [ ] Tab navigation for all filters/tabs
- [ ] Screen reader announces item counts ("5 low stock items")
- [ ] Color-blind friendly chart (patterns + colors)

---

### 2.5 OrderPerformanceReport

**Component Purpose:**
Placeholder component for future order performance metrics (supplier reliability, delivery times, order accuracy).

#### Success Criteria
- [ ] Displays "Coming Soon" message clearly
- [ ] Matches design system (consistent styling)
- [ ] Provides context about future features

#### Data Scenarios to Test
**Placeholder State:**
```javascript
// Test Case ID: OP-001
// Expected: Shows informative message, no errors
```

#### User Interactions to Validate
- None (placeholder component)

#### Visual Regression Checks
- [ ] Consistent with other placeholder states in app
- [ ] Centered content, readable text

#### Performance Requirements
- Minimal (static content)

#### Accessibility Requirements
- [ ] Heading structure correct (h2 for title)
- [ ] Color contrast meets WCAG AA

**Note:** This component will require full testing once implemented. Current tests are minimal.

---

## 3. Shared Component Test Specs

### 3.1 MetricSummaryCard

**Component Purpose:**
Reusable card displaying a single metric with optional comparison, trend indicator, and description.

**Props:**
```javascript
{
  title: string,          // "Total Waste"
  value: string | number, // "$1,234.56" or 1234.56
  unit: string,           // "USD", "%", "items"
  trend: "up" | "down" | "neutral",
  trendValue: string,     // "+12.5%"
  description: string,    // "This week vs last week"
  icon: ReactNode,        // Optional icon
  onClick: function       // Optional click handler
}
```

#### Props Validation Tests

**Test Cases:**
```javascript
// Test Case ID: MSC-001 - Required Props
test('MetricSummaryCard renders with minimum required props', () => {
  render(<MetricSummaryCard title="Total Waste" value="$1,234.56" />);
  expect(screen.getByText('Total Waste')).toBeInTheDocument();
  expect(screen.getByText('$1,234.56')).toBeInTheDocument();
});

// Test Case ID: MSC-002 - With All Props
test('MetricSummaryCard renders with all props', () => {
  render(
    <MetricSummaryCard
      title="Total Waste"
      value="$1,234.56"
      unit="USD"
      trend="up"
      trendValue="+12.5%"
      description="vs last week"
      icon={<WasteIcon />}
      onClick={mockFn}
    />
  );
  expect(screen.getByText('+12.5%')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});

// Test Case ID: MSC-003 - Number Formatting
test('MetricSummaryCard formats numbers correctly', () => {
  render(<MetricSummaryCard title="Cost" value={1234567.89} unit="USD" />);
  expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
});

// Test Case ID: MSC-004 - Trend Colors
test('MetricSummaryCard shows correct trend colors', () => {
  const { rerender } = render(
    <MetricSummaryCard title="Test" value="100" trend="up" trendValue="+10%" />
  );
  expect(screen.getByText('+10%')).toHaveClass('text-red-600'); // up is bad for waste

  rerender(
    <MetricSummaryCard title="Test" value="100" trend="down" trendValue="-10%" />
  );
  expect(screen.getByText('-10%')).toHaveClass('text-green-600'); // down is good
});
```

#### Rendering Scenarios
- [ ] With title only (minimal)
- [ ] With value and unit
- [ ] With trend indicator (up/down/neutral)
- [ ] With description text
- [ ] With icon
- [ ] As clickable card (onClick provided)
- [ ] Loading state (skeleton)

#### User Interactions
- [ ] Click card (if onClick provided)
- [ ] Hover shows elevation
- [ ] Keyboard navigation (if clickable)

#### Edge Cases
- [ ] Very long title (truncates or wraps)
- [ ] Very large number (formats with commas)
- [ ] Zero value
- [ ] Negative value
- [ ] Null/undefined values (shows fallback)

---

### 3.2 BarChart

**Component Purpose:**
Reusable bar chart component for visualizing categorical data.

**Props:**
```javascript
{
  data: Array<{ label: string, value: number, color?: string }>,
  title: string,
  xAxisLabel: string,
  yAxisLabel: string,
  height: number, // default 300
  showLegend: boolean,
  orientation: "vertical" | "horizontal",
  onBarClick: function
}
```

#### Props Validation Tests

**Test Cases:**
```javascript
// Test Case ID: BC-001 - Basic Rendering
test('BarChart renders with data', () => {
  const data = [
    { label: 'Protein', value: 500 },
    { label: 'Produce', value: 300 },
    { label: 'Dairy', value: 200 }
  ];
  render(<BarChart data={data} title="Waste by Category" />);
  expect(screen.getByText('Waste by Category')).toBeInTheDocument();
});

// Test Case ID: BC-002 - Empty Data
test('BarChart shows empty state with no data', () => {
  render(<BarChart data={[]} title="Empty Chart" />);
  expect(screen.getByText(/no data/i)).toBeInTheDocument();
});

// Test Case ID: BC-003 - Bar Click Handler
test('BarChart calls onBarClick when bar is clicked', async () => {
  const mockClick = jest.fn();
  const data = [{ label: 'Test', value: 100 }];
  render(<BarChart data={data} onBarClick={mockClick} />);

  const bar = screen.getByLabelText('Test: 100');
  await userEvent.click(bar);
  expect(mockClick).toHaveBeenCalledWith({ label: 'Test', value: 100 });
});

// Test Case ID: BC-004 - Tooltip on Hover
test('BarChart shows tooltip on hover', async () => {
  const data = [{ label: 'Protein', value: 500 }];
  render(<BarChart data={data} />);

  const bar = screen.getByLabelText('Protein: 500');
  await userEvent.hover(bar);

  expect(await screen.findByRole('tooltip')).toHaveTextContent('Protein: $500.00');
});
```

#### Rendering Scenarios
- [ ] With 3-5 bars (typical)
- [ ] With 20+ bars (scrollable/paginated)
- [ ] With single bar
- [ ] With empty data
- [ ] Vertical orientation
- [ ] Horizontal orientation
- [ ] With legend
- [ ] With custom colors

#### User Interactions
- [ ] Hover shows tooltip
- [ ] Click bar triggers callback
- [ ] Keyboard navigation (arrow keys between bars)
- [ ] Legend toggle (show/hide series)

#### Edge Cases
- [ ] All values are zero
- [ ] Very large values (formatting)
- [ ] Negative values (should they be supported?)
- [ ] Values with decimals
- [ ] Very long labels (truncate/rotate)

#### Accessibility
- [ ] Chart has `role="img"` with descriptive `aria-label`
- [ ] Each bar has `aria-label` with value
- [ ] Keyboard navigable
- [ ] Screen reader announces data

---

### 3.3 DataTable

**Component Purpose:**
Reusable table component with sorting, filtering, and pagination.

**Props:**
```javascript
{
  columns: Array<{ key: string, label: string, sortable: boolean, render?: function }>,
  data: Array<Object>,
  pageSize: number, // default 10
  showPagination: boolean,
  onRowClick: function,
  emptyMessage: string
}
```

#### Props Validation Tests

**Test Cases:**
```javascript
// Test Case ID: DT-001 - Basic Rendering
test('DataTable renders columns and rows', () => {
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'value', label: 'Value', sortable: true }
  ];
  const data = [
    { name: 'Item 1', value: 100 },
    { name: 'Item 2', value: 200 }
  ];

  render(<DataTable columns={columns} data={data} />);
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Item 1')).toBeInTheDocument();
});

// Test Case ID: DT-002 - Sorting
test('DataTable sorts data when column header clicked', async () => {
  const columns = [{ key: 'value', label: 'Value', sortable: true }];
  const data = [
    { value: 300 },
    { value: 100 },
    { value: 200 }
  ];

  render(<DataTable columns={columns} data={data} />);

  // Initially unsorted (300, 100, 200)
  const rows = screen.getAllByRole('row');
  expect(rows[1]).toHaveTextContent('300');

  // Click to sort ascending
  await userEvent.click(screen.getByText('Value'));
  const sortedRows = screen.getAllByRole('row');
  expect(sortedRows[1]).toHaveTextContent('100');
});

// Test Case ID: DT-003 - Pagination
test('DataTable paginates data correctly', async () => {
  const data = Array.from({ length: 25 }, (_, i) => ({ id: i, name: `Item ${i}` }));
  const columns = [{ key: 'name', label: 'Name' }];

  render(<DataTable columns={columns} data={data} pageSize={10} showPagination />);

  // Should show first 10 items
  expect(screen.getByText('Item 0')).toBeInTheDocument();
  expect(screen.queryByText('Item 10')).not.toBeInTheDocument();

  // Click next page
  await userEvent.click(screen.getByRole('button', { name: /next/i }));
  expect(screen.getByText('Item 10')).toBeInTheDocument();
});

// Test Case ID: DT-004 - Empty State
test('DataTable shows empty message when no data', () => {
  const columns = [{ key: 'name', label: 'Name' }];
  render(<DataTable columns={columns} data={[]} emptyMessage="No items found" />);
  expect(screen.getByText('No items found')).toBeInTheDocument();
});
```

#### Rendering Scenarios
- [ ] With 5-10 rows (single page)
- [ ] With 100+ rows (multiple pages)
- [ ] With empty data
- [ ] With custom cell renderers
- [ ] With row selection
- [ ] With sticky header (scroll)

#### User Interactions
- [ ] Click column header to sort
- [ ] Click again to reverse sort
- [ ] Click row triggers callback
- [ ] Navigate pages (next/prev)
- [ ] Jump to page number
- [ ] Change page size (10/25/50/100)

#### Edge Cases
- [ ] Null/undefined values in cells
- [ ] Very long text in cells (wrapping)
- [ ] Numbers formatted as strings
- [ ] Dates in various formats

#### Accessibility
- [ ] Table has `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` semantic HTML
- [ ] Sortable columns have `aria-sort` attribute
- [ ] Pagination controls keyboard accessible
- [ ] Screen reader announces sort state

---

### 3.4 DateRangePicker

**Component Purpose:**
Date range selector with presets (today, week, month, quarter, year) and custom range option.

**Props:**
```javascript
{
  startDate: Date,
  endDate: Date,
  onChange: function, // (startDate, endDate) => void
  presets: Array<string>, // ['today', 'week', 'month']
  minDate: Date,
  maxDate: Date
}
```

#### Props Validation Tests

**Test Cases:**
```javascript
// Test Case ID: DRP-001 - Preset Selection
test('DateRangePicker calls onChange when preset selected', async () => {
  const mockChange = jest.fn();
  render(<DateRangePicker onChange={mockChange} />);

  await userEvent.click(screen.getByRole('button', { name: /week/i }));

  expect(mockChange).toHaveBeenCalledWith(
    expect.any(Date), // start of week
    expect.any(Date)  // today
  );
});

// Test Case ID: DRP-002 - Custom Date Range
test('DateRangePicker allows custom date selection', async () => {
  const mockChange = jest.fn();
  render(<DateRangePicker onChange={mockChange} />);

  await userEvent.click(screen.getByRole('button', { name: /custom/i }));

  const startInput = screen.getByLabelText(/start date/i);
  const endInput = screen.getByLabelText(/end date/i);

  await userEvent.type(startInput, '2025-11-01');
  await userEvent.type(endInput, '2025-11-08');

  expect(mockChange).toHaveBeenCalled();
});

// Test Case ID: DRP-003 - Date Validation
test('DateRangePicker prevents end date before start date', async () => {
  render(<DateRangePicker />);

  await userEvent.click(screen.getByRole('button', { name: /custom/i }));

  const startInput = screen.getByLabelText(/start date/i);
  const endInput = screen.getByLabelText(/end date/i);

  await userEvent.type(startInput, '2025-11-08');
  await userEvent.type(endInput, '2025-11-01'); // Before start

  expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
});

// Test Case ID: DRP-004 - Mobile Touch
test('DateRangePicker works on touch devices', async () => {
  // Mock touch events
  render(<DateRangePicker />);

  const weekButton = screen.getByRole('button', { name: /week/i });

  // Simulate touch
  fireEvent.touchStart(weekButton);
  fireEvent.touchEnd(weekButton);

  expect(weekButton).toHaveClass('active');
});
```

#### Rendering Scenarios
- [ ] With all presets visible
- [ ] With custom range open
- [ ] With date inputs focused
- [ ] Mobile calendar view
- [ ] Desktop dropdown view

#### User Interactions
- [ ] Click preset button
- [ ] Open custom date picker
- [ ] Select dates from calendar
- [ ] Type dates manually
- [ ] Clear selection
- [ ] Close picker (click outside, ESC key)

#### Edge Cases
- [ ] Same start and end date (single day)
- [ ] Very long date range (365+ days)
- [ ] Leap year dates
- [ ] Timezone handling
- [ ] DST transitions

#### Accessibility
- [ ] All buttons keyboard accessible
- [ ] Date inputs have labels
- [ ] Calendar grid keyboard navigable
- [ ] Screen reader announces selected range

---

### 3.5 ComparisonBadge

**Component Purpose:**
Small badge showing comparison value with color-coded direction indicator.

**Props:**
```javascript
{
  value: number,      // 12.5
  unit: string,       // "%"
  direction: "up" | "down" | "neutral",
  inverseColors: boolean // true = up is good (for revenue), false = up is bad (for waste)
}
```

#### Props Validation Tests

**Test Cases:**
```javascript
// Test Case ID: CB-001 - Positive Change
test('ComparisonBadge shows positive change correctly', () => {
  render(<ComparisonBadge value={12.5} unit="%" direction="up" />);
  expect(screen.getByText('+12.5%')).toBeInTheDocument();
  expect(screen.getByText('▲')).toBeInTheDocument();
});

// Test Case ID: CB-002 - Negative Change
test('ComparisonBadge shows negative change correctly', () => {
  render(<ComparisonBadge value={-8.3} unit="%" direction="down" />);
  expect(screen.getByText('-8.3%')).toBeInTheDocument();
  expect(screen.getByText('▼')).toBeInTheDocument();
});

// Test Case ID: CB-003 - Inverse Colors (Waste vs Revenue)
test('ComparisonBadge uses correct colors for waste (up=bad)', () => {
  const { container } = render(
    <ComparisonBadge value={10} direction="up" inverseColors={false} />
  );
  expect(container.firstChild).toHaveClass('text-red-600'); // up is bad
});

test('ComparisonBadge uses correct colors for revenue (up=good)', () => {
  const { container } = render(
    <ComparisonBadge value={10} direction="up" inverseColors={true} />
  );
  expect(container.firstChild).toHaveClass('text-green-600'); // up is good
});

// Test Case ID: CB-004 - Zero Change
test('ComparisonBadge shows neutral state for zero', () => {
  render(<ComparisonBadge value={0} direction="neutral" />);
  expect(screen.getByText('0.0%')).toBeInTheDocument();
  expect(screen.getByText('−')).toBeInTheDocument(); // flat line
});
```

#### Rendering Scenarios
- [ ] Positive value (+10%)
- [ ] Negative value (-10%)
- [ ] Zero value (0%)
- [ ] Very large value (+1234.5%)
- [ ] Decimal precision (1 decimal by default)

#### Edge Cases
- [ ] Value is null/undefined (show "N/A")
- [ ] Value is Infinity (show "∞")
- [ ] Value is NaN (show "N/A")

---

## 4. Integration Test Plan

### 4.1 Component Composition Tests

**Test Objective:** Verify that report components integrate correctly with shared components.

**Test Cases:**

```javascript
// Test Case ID: INT-001
test('WasteAnalysisReport integrates with MetricSummaryCard', async () => {
  render(<WasteAnalysisReport />);

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('Total Waste')).toBeInTheDocument();
  });

  // Verify MetricSummaryCard renders with correct data
  expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  expect(screen.getByText('+12.5%')).toBeInTheDocument();
});

// Test Case ID: INT-002
test('WasteAnalysisReport integrates with BarChart', async () => {
  render(<WasteAnalysisReport />);

  await waitFor(() => {
    expect(screen.getByText('Waste by Category')).toBeInTheDocument();
  });

  // Verify chart rendered with data
  const chart = screen.getByRole('img', { name: /waste by category/i });
  expect(chart).toBeInTheDocument();
});

// Test Case ID: INT-003
test('WasteAnalysisReport integrates with DateRangePicker', async () => {
  render(<WasteAnalysisReport />);

  // Change date range
  await userEvent.click(screen.getByRole('button', { name: /month/i }));

  // Verify API called with new date range
  await waitFor(() => {
    expect(mockApiCall).toHaveBeenCalledWith(
      expect.objectContaining({ period: 'month' })
    );
  });
});
```

### 4.2 API Integration Tests

**Test Objective:** Verify that frontend correctly calls backend API endpoints with proper parameters and handles responses.

**Backend Endpoints to Test:**
1. GET `/api/reports/waste/summary`
2. GET `/api/reports/waste/by-category`
3. GET `/api/reports/waste/by-reason`
4. GET `/api/reports/waste/by-item`
5. GET `/api/reports/waste/trends`
6. GET `/api/reports/food-cost`

**Test Cases:**

```javascript
// Test Case ID: API-INT-001
test('WasteAnalysisReport calls waste/summary endpoint correctly', async () => {
  const mockResponse = {
    period: { type: 'week', start: '2025-11-01', end: '2025-11-08' },
    waste: { total_value: 1234.56, total_count: 45 }
  };

  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      expect(req.url.searchParams.get('period')).toBe('week');
      return res(ctx.json(mockResponse));
    })
  );

  render(<WasteAnalysisReport />);

  await waitFor(() => {
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });
});

// Test Case ID: API-INT-002
test('FoodCostReport calls food-cost endpoint with comparison', async () => {
  server.use(
    rest.get('/api/reports/food-cost', (req, res, ctx) => {
      expect(req.url.searchParams.get('compare')).toBe('true');
      return res(ctx.json(mockFoodCostComparison));
    })
  );

  render(<FoodCostReport />);

  // Toggle comparison
  await userEvent.click(screen.getByRole('button', { name: /compare/i }));

  await waitFor(() => {
    expect(screen.getByText('+23.5%')).toBeInTheDocument();
  });
});
```

### 4.3 State Management Tests

**Test Objective:** Verify that TanStack Query caching and state management work correctly.

**Test Cases:**

```javascript
// Test Case ID: STATE-001
test('Report data is cached between navigation', async () => {
  const { rerender } = render(<WasteAnalysisReport />);

  // Wait for initial load
  await waitFor(() => {
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  // Navigate away and back
  rerender(<DashboardOverviewReport />);
  rerender(<WasteAnalysisReport />);

  // Data should load instantly from cache (no loading state)
  expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});

// Test Case ID: STATE-002
test('Data invalidates after period change', async () => {
  let callCount = 0;
  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      callCount++;
      return res(ctx.json(mockData));
    })
  );

  render(<WasteAnalysisReport />);
  await waitFor(() => expect(callCount).toBe(1));

  // Change period
  await userEvent.click(screen.getByRole('button', { name: /month/i }));

  // Should trigger new API call
  await waitFor(() => expect(callCount).toBe(2));
});
```

### 4.4 Navigation Tests

**Test Objective:** Verify that navigation between report types works correctly.

**Test Cases:**

```javascript
// Test Case ID: NAV-001
test('Navigate between reports via sidebar', async () => {
  render(<Dashboard />); // Full dashboard with sidebar

  // Click "Waste Analysis" in sidebar
  await userEvent.click(screen.getByRole('link', { name: /waste analysis/i }));

  expect(await screen.findByText('Waste Analysis Report')).toBeInTheDocument();

  // Click "Food Cost" in sidebar
  await userEvent.click(screen.getByRole('link', { name: /food cost/i }));

  expect(await screen.findByText('Food Cost Analysis')).toBeInTheDocument();
});

// Test Case ID: NAV-002
test('Navigate from overview cards to detail reports', async () => {
  render(<ReportsOverview />);

  // Click waste analysis card
  await userEvent.click(screen.getByRole('link', { name: /waste analysis/i }));

  expect(window.location.pathname).toBe('/reports/waste');
});
```

---

## 5. Accessibility Test Plan

### 5.1 Keyboard Navigation

**Test Objective:** Verify that all interactive elements are keyboard accessible.

**Test Cases:**

| Test ID | Component | User Action | Expected Result | Priority |
|---------|-----------|-------------|-----------------|----------|
| A11Y-KB-001 | All Reports | Tab through all interactive elements | Focus visible on each element (2px outline) | CRITICAL |
| A11Y-KB-002 | DateRangePicker | Tab to picker, Enter to open, Arrow keys to navigate dates | Dates navigable, Enter selects, Esc closes | CRITICAL |
| A11Y-KB-003 | BarChart | Tab to chart, Arrow keys to navigate bars | Each bar focusable, value announced | HIGH |
| A11Y-KB-004 | DataTable | Tab to table, Arrow keys to navigate cells | Cells navigable, screen reader announces content | HIGH |
| A11Y-KB-005 | Period Selector | Tab to selector, Arrow keys to change period | Period changes without mouse | CRITICAL |
| A11Y-KB-006 | Comparison Toggle | Tab to toggle, Space/Enter to activate | Comparison mode toggles | HIGH |
| A11Y-KB-007 | Modal/Dropdown | Tab through modal, Esc to close | Focus trapped in modal, closes on Esc | CRITICAL |

**Execution Steps:**
1. Unplug mouse/disable trackpad
2. Tab through entire report component
3. Verify focus indicator visible (2px outline, high contrast)
4. Verify logical tab order (top-to-bottom, left-to-right)
5. Test all interactive elements (buttons, links, inputs, dropdowns)
6. Verify Esc key closes modals/dropdowns
7. Verify Enter/Space activate buttons

**Pass Criteria:**
- All interactive elements reachable via Tab
- Focus visible at all times
- Logical tab order maintained
- Esc/Enter/Space keys work as expected

---

### 5.2 Screen Reader Compatibility

**Test Objective:** Verify that screen readers can access and announce all content meaningfully.

**Test Tools:** NVDA (Windows), JAWS (Windows), VoiceOver (macOS), TalkBack (Android)

**Test Cases:**

| Test ID | Component | Screen Reader Test | Expected Announcement | Priority |
|---------|-----------|-------------------|----------------------|----------|
| A11Y-SR-001 | WasteAnalysisReport | Navigate to report heading | "Waste Analysis Report, heading level 2" | CRITICAL |
| A11Y-SR-002 | MetricSummaryCard | Focus on card | "Total Waste: $1,234.56, up 12.5% from last week" | CRITICAL |
| A11Y-SR-003 | BarChart | Navigate to chart | "Waste by Category chart, 5 bars. Protein: $500, Produce: $300..." | HIGH |
| A11Y-SR-004 | DataTable | Navigate to table | "Waste items table, 3 columns, 10 rows. Column headers: Item, Value, Date" | HIGH |
| A11Y-SR-005 | DateRangePicker | Open picker | "Date range picker, current range: November 1 to November 8" | CRITICAL |
| A11Y-SR-006 | Loading State | Component loading | "Loading waste data" | MEDIUM |
| A11Y-SR-007 | Error State | API error | "Error loading data: Network error. Try again" | HIGH |
| A11Y-SR-008 | Empty State | No data | "No waste data for this period" | MEDIUM |

**Execution Steps:**
1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Navigate through report using arrow keys only
3. Verify all content announced meaningfully
4. Check that interactive elements announce their role (button, link, etc.)
5. Verify state changes announced (loading, error, success)
6. Test with screen reader virtual cursor
7. Verify landmarks and headings structure

**Pass Criteria:**
- All text content readable by screen reader
- Interactive elements announce role and state
- Headings provide logical document outline
- Form inputs have associated labels
- Images/charts have text alternatives

---

### 5.3 Color Contrast (WCAG AA)

**Test Objective:** Verify all text meets WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text).

**Test Tool:** Lighthouse, axe DevTools, WebAIM Contrast Checker

**Test Cases:**

| Test ID | Element | Foreground | Background | Ratio | Target | Priority |
|---------|---------|------------|------------|-------|--------|----------|
| A11Y-CC-001 | Body text | #374151 (gray-700) | #FFFFFF (white) | 10.8:1 | 4.5:1 | PASS |
| A11Y-CC-002 | Heading text | #111827 (gray-900) | #FFFFFF | 16.6:1 | 4.5:1 | PASS |
| A11Y-CC-003 | Link text | #10B981 (green-500) | #FFFFFF | 3.0:1 | 4.5:1 | FAIL - Need darker green |
| A11Y-CC-004 | Button text | #FFFFFF | #10B981 (green-500) | 3.0:1 | 4.5:1 | FAIL - Need darker green |
| A11Y-CC-005 | Error text | #EF4444 (red-500) | #FFFFFF | 4.6:1 | 4.5:1 | PASS |
| A11Y-CC-006 | Success text | #10B981 (green-500) | #FFFFFF | 3.0:1 | 4.5:1 | FAIL |
| A11Y-CC-007 | Disabled text | #9CA3AF (gray-400) | #FFFFFF | 2.6:1 | 4.5:1 | FAIL - Acceptable if disabled |
| A11Y-CC-008 | Chart labels | #374151 | #FFFFFF | 10.8:1 | 4.5:1 | PASS |

**Recommended Color Adjustments:**
- Green links/buttons: Use `#059669` (green-600) instead of `#10B981` (green-500)
- Success messages: Use `#059669` (green-600)
- Warning text: Use `#D97706` (amber-600) instead of `#F59E0B` (amber-500)

**Execution Steps:**
1. Run Lighthouse audit on each report page
2. Check all text elements with WebAIM Contrast Checker
3. Verify focus indicators have sufficient contrast (3:1 minimum)
4. Test in high contrast mode (Windows High Contrast, macOS Increase Contrast)

**Pass Criteria:**
- All text meets 4.5:1 ratio (normal text)
- Large text (18pt+ or 14pt+ bold) meets 3:1 ratio
- Interactive elements have 3:1 contrast for focus indicators
- No reliance on color alone to convey information

---

### 5.4 Focus Indicators

**Test Objective:** Verify that focus indicators are visible and meet WCAG 2.1 AA requirements.

**Test Cases:**

| Test ID | Element | Focus Style | Contrast | Priority |
|---------|---------|-------------|----------|----------|
| A11Y-FI-001 | Buttons | 2px solid ring, offset 2px | 3:1 minimum | CRITICAL |
| A11Y-FI-002 | Links | 2px solid underline + ring | 3:1 minimum | CRITICAL |
| A11Y-FI-003 | Form inputs | 2px solid ring, green | 3:1 minimum | CRITICAL |
| A11Y-FI-004 | Dropdowns | 2px solid ring | 3:1 minimum | HIGH |
| A11Y-FI-005 | Cards (clickable) | 2px solid ring + shadow | 3:1 minimum | MEDIUM |
| A11Y-FI-006 | Chart bars | 3px solid ring | 3:1 minimum | HIGH |

**Recommended Focus Styles:**
```css
*:focus {
  outline: 2px solid #059669; /* green-600 */
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none; /* Hide for mouse users */
}

*:focus-visible {
  outline: 2px solid #059669;
  outline-offset: 2px;
}
```

**Execution Steps:**
1. Tab through all interactive elements
2. Verify focus ring visible on all elements
3. Check focus ring contrast against background (3:1 minimum)
4. Test with Windows High Contrast mode
5. Verify focus ring not cut off by overflow:hidden

**Pass Criteria:**
- Focus indicator visible on all focusable elements
- Focus indicator has 3:1 contrast ratio
- Focus indicator at least 2px thick
- Focus indicator not obscured by other elements

---

### 5.5 Mobile Accessibility

**Test Objective:** Verify that reports are accessible on mobile touch devices.

**Test Cases:**

| Test ID | Feature | Mobile Test | Expected Result | Priority |
|---------|---------|-------------|-----------------|----------|
| A11Y-MOB-001 | Touch targets | All buttons/links minimum 44x44px | Easily tappable, no mis-taps | CRITICAL |
| A11Y-MOB-002 | DatePicker | Touch-friendly calendar opens | Large date buttons, easy to select | CRITICAL |
| A11Y-MOB-003 | BarChart | Chart pans/zooms on touch | Smooth touch interaction, no lag | MEDIUM |
| A11Y-MOB-004 | DataTable | Horizontal scroll on small screen | Table scrolls without page scroll | HIGH |
| A11Y-MOB-005 | VoiceOver (iOS) | Navigate with swipe gestures | All content accessible via swipe | HIGH |
| A11Y-MOB-006 | TalkBack (Android) | Navigate with swipe gestures | All content accessible via swipe | HIGH |

**Execution Steps:**
1. Test on real iOS device (iPhone 12+) with VoiceOver enabled
2. Test on real Android device with TalkBack enabled
3. Verify touch targets minimum 44x44px (use browser inspector)
4. Test date picker with touch input
5. Test charts with pinch-zoom gestures
6. Verify no horizontal scrolling (except tables)

**Pass Criteria:**
- All touch targets 44x44px minimum
- Touch gestures work smoothly
- VoiceOver/TalkBack announce all content
- No horizontal scrolling on main content

---

## 6. Performance Test Plan

### 6.1 Page Load Performance

**Test Objective:** Verify that report pages load quickly and meet performance budgets.

**Performance Budgets:**

| Metric | Target | Maximum | Priority |
|--------|--------|---------|----------|
| **First Contentful Paint (FCP)** | < 1s | < 1.5s | CRITICAL |
| **Largest Contentful Paint (LCP)** | < 2s | < 2.5s | CRITICAL |
| **Time to Interactive (TTI)** | < 2s | < 3s | HIGH |
| **Total Blocking Time (TBT)** | < 200ms | < 300ms | MEDIUM |
| **Cumulative Layout Shift (CLS)** | < 0.1 | < 0.25 | HIGH |
| **Speed Index** | < 2s | < 3s | MEDIUM |

**Test Cases:**

```javascript
// Test Case ID: PERF-001
test('WasteAnalysisReport loads in under 2 seconds', async () => {
  const startTime = performance.now();

  render(<WasteAnalysisReport />);

  await waitFor(() => {
    expect(screen.getByText('Waste Analysis')).toBeInTheDocument();
  });

  const endTime = performance.now();
  const loadTime = endTime - startTime;

  expect(loadTime).toBeLessThan(2000);
});

// Test Case ID: PERF-002
test('Charts render in under 500ms', async () => {
  const startTime = performance.now();

  render(<BarChart data={mockLargeDataset} />);

  await waitFor(() => {
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  const endTime = performance.now();
  const renderTime = endTime - startTime;

  expect(renderTime).toBeLessThan(500);
});
```

**Execution Steps:**
1. Run Lighthouse audit (desktop & mobile)
2. Test on throttled connection (Fast 3G, Slow 3G)
3. Measure with Chrome DevTools Performance tab
4. Test with large datasets (1000+ items)
5. Monitor bundle size (< 200KB per report component)

**Pass Criteria:**
- Lighthouse Performance score 90+
- LCP < 2.5s
- FCP < 1.5s
- No layout shifts (CLS < 0.1)

---

### 6.2 Data Fetch Performance

**Test Objective:** Verify that API calls complete quickly and don't block UI.

**Test Cases:**

| Test ID | API Endpoint | Data Size | Target Time | Max Time | Priority |
|---------|--------------|-----------|-------------|----------|----------|
| PERF-API-001 | /waste/summary | Small (1 period) | < 500ms | < 1s | HIGH |
| PERF-API-002 | /waste/by-category | Medium (50 categories) | < 800ms | < 1.5s | HIGH |
| PERF-API-003 | /waste/trends | Large (365 data points) | < 1s | < 2s | MEDIUM |
| PERF-API-004 | /waste/by-item | Large (1000+ items) | < 1s | < 2s | MEDIUM |
| PERF-API-005 | /food-cost | Small | < 500ms | < 1s | HIGH |

**Execution Steps:**
1. Use Chrome DevTools Network tab to measure API times
2. Test on throttled connection (Fast 3G)
3. Test with parallel API calls (multiple reports loading)
4. Verify loading states show within 100ms
5. Verify no UI blocking during data fetch

**Pass Criteria:**
- All API calls complete in < 2s
- Loading indicators show within 100ms
- UI remains responsive during fetch
- No race conditions with parallel requests

---

### 6.3 Rendering Performance

**Test Objective:** Verify that UI rendering is smooth with no jank or freezing.

**Test Cases:**

```javascript
// Test Case ID: PERF-RENDER-001
test('No re-renders when data unchanged', () => {
  let renderCount = 0;

  function TestComponent() {
    renderCount++;
    return <WasteAnalysisReport data={mockData} />;
  }

  const { rerender } = render(<TestComponent />);
  const initialRenderCount = renderCount;

  // Re-render with same data
  rerender(<TestComponent />);

  expect(renderCount).toBe(initialRenderCount); // Should not re-render
});

// Test Case ID: PERF-RENDER-002
test('Chart animation completes in under 400ms', async () => {
  const { container } = render(<BarChart data={mockData} />);

  const startTime = performance.now();

  await waitFor(() => {
    const bars = container.querySelectorAll('.bar');
    const allAnimated = Array.from(bars).every(bar => {
      return window.getComputedStyle(bar).height !== '0px';
    });
    return allAnimated;
  });

  const animationTime = performance.now() - startTime;
  expect(animationTime).toBeLessThan(400);
});
```

**Execution Steps:**
1. Monitor with React DevTools Profiler
2. Check for unnecessary re-renders
3. Verify memoization working (React.memo, useMemo, useCallback)
4. Test with 60fps target (no dropped frames)
5. Use Chrome DevTools Rendering tab to detect layout thrashing

**Pass Criteria:**
- No unnecessary re-renders
- 60fps maintained during interactions
- Chart animations smooth (no jank)
- No layout thrashing detected

---

### 6.4 Memory Usage

**Test Objective:** Verify that reports don't cause memory leaks.

**Test Cases:**

```javascript
// Test Case ID: PERF-MEM-001
test('No memory leak when mounting/unmounting reports', async () => {
  const { unmount } = render(<WasteAnalysisReport />);

  // Record initial memory
  const initialMemory = performance.memory.usedJSHeapSize;

  // Mount and unmount 10 times
  for (let i = 0; i < 10; i++) {
    const { unmount: u } = render(<WasteAnalysisReport />);
    await new Promise(resolve => setTimeout(resolve, 100));
    u();
  }

  // Force garbage collection (if available)
  if (global.gc) global.gc();

  const finalMemory = performance.memory.usedJSHeapSize;
  const memoryIncrease = finalMemory - initialMemory;

  // Memory should not increase significantly (< 10MB)
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
});
```

**Execution Steps:**
1. Use Chrome DevTools Memory Profiler
2. Take heap snapshot before loading report
3. Interact with report (change periods, toggle comparison)
4. Take heap snapshot after unmounting
5. Compare snapshots for leaked objects
6. Test with prolonged usage (15+ minutes)

**Pass Criteria:**
- No memory leaks detected
- Memory usage stable over time
- Garbage collection working correctly
- No event listeners left attached after unmount

---

## 7. Browser Compatibility Matrix

### 7.1 Desktop Browsers

**Test Objective:** Verify reports work correctly across major desktop browsers.

| Browser | Version | Priority | Test Coverage | Status |
|---------|---------|----------|---------------|--------|
| **Chrome** | Latest (120+) | CRITICAL | Full (all tests) | |
| **Firefox** | Latest (121+) | HIGH | Full (all tests) | |
| **Safari** | Latest (17+) | HIGH | Full (all tests) | |
| **Edge** | Latest (120+) | MEDIUM | Smoke tests only | |
| **Chrome** | Latest - 1 | MEDIUM | Smoke tests | |
| **Firefox** | Latest - 1 | LOW | Smoke tests | |

**Smoke Tests (for medium/low priority):**
- Page loads without errors
- Navigation works
- Charts render
- Forms submit
- Basic interactions work

**Full Test Coverage:**
- All unit tests pass
- All integration tests pass
- All accessibility tests pass
- All performance tests pass

**Known Issues:**
- Safari < 16: CSS Grid gaps may render differently
- Firefox: Date picker styling may differ
- Edge: Should match Chrome (Chromium-based)

---

### 7.2 Mobile Browsers

| Device | Browser | Version | Priority | Test Coverage |
|--------|---------|---------|----------|---------------|
| **iPhone 12+** | Safari | iOS 16+ | CRITICAL | Full |
| **iPhone SE** | Safari | iOS 16+ | HIGH | Smoke |
| **iPad Air** | Safari | iPadOS 16+ | HIGH | Full |
| **Samsung Galaxy** | Chrome | Latest | MEDIUM | Smoke |
| **Google Pixel** | Chrome | Latest | MEDIUM | Smoke |

**Mobile-Specific Tests:**
- Touch interactions (tap, swipe, pinch)
- Virtual keyboard doesn't obscure inputs
- Viewport meta tag works correctly
- Responsive breakpoints render properly
- No horizontal scrolling (except tables)

---

### 7.3 Tablet Devices

| Device | Screen Size | Priority | Notes |
|--------|-------------|----------|-------|
| **iPad 10.2"** | 810x1080 | CRITICAL | Primary tablet target |
| **iPad Air** | 820x1180 | HIGH | |
| **iPad Pro 12.9"** | 1024x1366 | MEDIUM | Large tablet |
| **Android Tablet** | 768x1024 | LOW | Generic Android |

---

### 7.4 Viewport Width Testing

**Test Objective:** Verify responsive design works at all breakpoints.

| Breakpoint | Width | Layout | Priority | Test Cases |
|------------|-------|--------|----------|------------|
| **Mobile (XS)** | 375px | 1 column | CRITICAL | All layouts stack vertically |
| **Mobile (SM)** | 640px | 1-2 columns | HIGH | Some grid layouts 2 columns |
| **Tablet** | 768px | 2-3 columns | CRITICAL | Tablet-optimized layout |
| **Desktop (MD)** | 1024px | 3-4 columns | MEDIUM | Full desktop layout |
| **Desktop (LG)** | 1280px | 4+ columns | LOW | Wide screen layout |
| **Desktop (XL)** | 1536px+ | Max width 1400px | LOW | Content centered |

**Responsive Test Cases:**

```javascript
// Test Case ID: RESP-001
test('WasteAnalysisReport is responsive at mobile width', () => {
  global.innerWidth = 375;
  global.dispatchEvent(new Event('resize'));

  render(<WasteAnalysisReport />);

  // Verify single column layout
  const grid = screen.getByTestId('metrics-grid');
  expect(grid).toHaveClass('grid-cols-1');
});

// Test Case ID: RESP-002
test('Charts scale down for mobile', () => {
  global.innerWidth = 375;
  render(<BarChart data={mockData} />);

  const chart = screen.getByRole('img');
  const { width } = chart.getBoundingClientRect();

  // Chart should fit within mobile viewport (minus padding)
  expect(width).toBeLessThanOrEqual(375 - 32);
});
```

---

## 8. Mobile Testing Specifications

### 8.1 Minimum Viewport Width (375px)

**Test Objective:** Verify all reports work at minimum mobile width.

**Test Cases:**

| Test ID | Component | Test | Expected Result | Priority |
|---------|-----------|------|-----------------|----------|
| MOB-001 | All Reports | Render at 375px width | No horizontal scroll, all content visible | CRITICAL |
| MOB-002 | MetricSummaryCard | Display at 375px | Cards stack vertically, readable text | CRITICAL |
| MOB-003 | BarChart | Render at 375px | Chart scales down, bars visible | HIGH |
| MOB-004 | DataTable | Scroll at 375px | Table scrolls horizontally with sticky column | HIGH |
| MOB-005 | DateRangePicker | Use at 375px | Picker doesn't overflow viewport | CRITICAL |

**Execution Steps:**
1. Set browser viewport to 375x667 (iPhone SE)
2. Load each report component
3. Verify no horizontal scrolling
4. Verify all text readable (no truncation)
5. Verify touch targets minimum 44px
6. Test all interactions with touch

**Pass Criteria:**
- No horizontal scrolling on page (tables can scroll)
- All text readable (minimum 14px font size)
- All touch targets 44x44px minimum
- UI doesn't break or overlap

---

### 8.2 Touch Target Sizing

**Test Objective:** Verify all interactive elements meet minimum touch target size (44x44px per WCAG).

**Test Cases:**

| Element | Minimum Size | Current Size | Status | Priority |
|---------|--------------|--------------|--------|----------|
| Buttons | 44x44px | | | CRITICAL |
| Links | 44x44px | | | CRITICAL |
| Form inputs | 44x44px height | | | CRITICAL |
| Dropdown triggers | 44x44px | | | HIGH |
| Chart bars/points | 32x32px | | | MEDIUM |
| Close buttons (X) | 44x44px | | | HIGH |
| Pagination controls | 44x44px | | | HIGH |

**Recommended Styles:**
```css
button, a, input, select {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Spacing between touch targets */
.touch-target {
  margin: 8px;
}
```

**Execution Steps:**
1. Use browser inspector to measure elements
2. Verify minimum dimensions 44x44px
3. Test actual touch interaction on device
4. Verify spacing between targets (minimum 8px)

**Pass Criteria:**
- All interactive elements 44x44px minimum
- Adequate spacing prevents mis-taps
- No accidental clicks on adjacent elements

---

### 8.3 Date Picker Mobile Interaction

**Test Objective:** Verify date picker works well on touch devices.

**Test Cases:**

| Test ID | Interaction | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| DP-MOB-001 | Tap date input | Keyboard doesn't appear, picker opens | CRITICAL |
| DP-MOB-002 | Swipe calendar | Smooth scrolling between months | MEDIUM |
| DP-MOB-003 | Tap date button | Date selects, picker closes | CRITICAL |
| DP-MOB-004 | Tap outside picker | Picker closes, no date change | HIGH |
| DP-MOB-005 | Landscape orientation | Picker adjusts to landscape mode | MEDIUM |

**Recommended Implementation:**
- Use native date picker on iOS (better UX)
- Use custom picker on Android (more control)
- Ensure picker doesn't overflow viewport
- Prevent body scroll when picker open

---

### 8.4 Loading States on Slow Networks

**Test Objective:** Verify loading states are visible and informative on slow mobile connections.

**Test Cases:**

| Test ID | Network Speed | Expected Behavior | Priority |
|---------|---------------|-------------------|----------|
| SLOW-001 | Fast 3G (750ms delay) | Loading skeleton shows within 100ms | HIGH |
| SLOW-002 | Slow 3G (2s delay) | Progress indicator updates, no timeout | HIGH |
| SLOW-003 | Offline | Error message shows, retry button available | CRITICAL |
| SLOW-004 | Flaky connection | Retries automatically, shows retry count | MEDIUM |

**Execution Steps:**
1. Enable Chrome DevTools Network throttling
2. Set to "Slow 3G" (500kb/s, 2s latency)
3. Load report pages
4. Verify loading states show quickly
5. Verify spinners/skeletons don't cause layout shift
6. Test offline scenario (no connection)

**Pass Criteria:**
- Loading indicator shows within 100ms
- No layout shift when loading completes
- Informative error messages
- Retry mechanism works

---

## 9. Error Scenario Test Cases

### 9.1 Network Errors

**Test Objective:** Verify graceful handling of network failures.

**Test Cases:**

| Test ID | Error Type | Trigger | Expected UI | Expected User Action | Priority |
|---------|------------|---------|-------------|---------------------|----------|
| ERR-NET-001 | No internet | Disconnect network | "Network error. Check your connection." + Retry button | Click retry | CRITICAL |
| ERR-NET-002 | Timeout | Delay response 30s+ | "Request timed out. Try again." + Retry button | Click retry | HIGH |
| ERR-NET-003 | DNS failure | Invalid API URL | "Cannot reach server. Contact support." | Refresh page | MEDIUM |

**Mock Implementation:**
```javascript
// Test Case ID: ERR-NET-001
test('Shows network error when offline', async () => {
  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      return res.networkError('Network error');
    })
  );

  render(<WasteAnalysisReport />);

  expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
});

// Test Case ID: ERR-NET-002
test('Retries when retry button clicked', async () => {
  let attemptCount = 0;
  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      attemptCount++;
      if (attemptCount === 1) {
        return res.networkError('Network error');
      }
      return res(ctx.json(mockData));
    })
  );

  render(<WasteAnalysisReport />);

  await screen.findByText(/network error/i);

  await userEvent.click(screen.getByRole('button', { name: /retry/i }));

  expect(await screen.findByText('Waste Analysis')).toBeInTheDocument();
  expect(attemptCount).toBe(2);
});
```

---

### 9.2 API Errors (Status Codes)

**Test Objective:** Verify correct handling of HTTP error responses.

**Test Cases:**

| Test ID | Status Code | Error Type | Expected UI Message | Priority |
|---------|-------------|------------|---------------------|----------|
| ERR-API-401 | 401 | Unauthorized | "Session expired. Please log in again." → Redirect to login | CRITICAL |
| ERR-API-403 | 403 | Forbidden | "You don't have permission to view this report." | HIGH |
| ERR-API-404 | 404 | Not Found | "Report data not found." | MEDIUM |
| ERR-API-500 | 500 | Server Error | "Server error. Our team has been notified. Try again later." | HIGH |
| ERR-API-503 | 503 | Service Unavailable | "Service temporarily unavailable. Try again in a few minutes." | MEDIUM |

**Mock Implementation:**
```javascript
// Test Case ID: ERR-API-401
test('Redirects to login on 401 error', async () => {
  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    })
  );

  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
  }));

  render(<WasteAnalysisReport />);

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

// Test Case ID: ERR-API-500
test('Shows server error message on 500', async () => {
  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
    })
  );

  render(<WasteAnalysisReport />);

  expect(await screen.findByText(/server error/i)).toBeInTheDocument();
});
```

---

### 9.3 Empty Data Sets

**Test Objective:** Verify empty states are informative and actionable.

**Test Cases:**

| Test ID | Empty Scenario | UI Display | User Guidance | Priority |
|---------|----------------|------------|---------------|----------|
| ERR-EMPTY-001 | No waste data for period | "No waste logged for this period." | "Try a different date range" | HIGH |
| ERR-EMPTY-002 | No inventory items | "No inventory items found." | "Add items to get started" link | HIGH |
| ERR-EMPTY-003 | No comparison data | "Not enough data for comparison." | "Select a different period" | MEDIUM |
| ERR-EMPTY-004 | Zero values (all categories) | "$0.00" displayed, not blank | "No data yet" message | MEDIUM |

**Mock Implementation:**
```javascript
// Test Case ID: ERR-EMPTY-001
test('Shows empty state when no waste data', async () => {
  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      return res(ctx.json({
        period: { type: 'week', start: '2025-11-01', end: '2025-11-08' },
        waste: { total_value: 0, total_count: 0 }
      }));
    })
  );

  render(<WasteAnalysisReport />);

  expect(await screen.findByText(/no waste logged/i)).toBeInTheDocument();
  expect(screen.getByText(/try a different date range/i)).toBeInTheDocument();
});
```

---

### 9.4 Malformed API Responses

**Test Objective:** Verify app doesn't crash on unexpected data.

**Test Cases:**

| Test ID | Malformed Data | Expected Behavior | Priority |
|---------|----------------|-------------------|----------|
| ERR-MAL-001 | Missing required field | Shows error: "Invalid data received" | HIGH |
| ERR-MAL-002 | Wrong data type (string instead of number) | Parses safely, shows 0 or N/A | HIGH |
| ERR-MAL-003 | Null values | Treats as 0 or empty, no crash | MEDIUM |
| ERR-MAL-004 | Extra unexpected fields | Ignores extra fields, uses valid data | LOW |
| ERR-MAL-005 | Array instead of object | Shows error: "Invalid data format" | MEDIUM |

**Mock Implementation:**
```javascript
// Test Case ID: ERR-MAL-001
test('Handles missing required field gracefully', async () => {
  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      return res(ctx.json({
        period: { type: 'week' },
        // Missing 'waste' object
      }));
    })
  );

  render(<WasteAnalysisReport />);

  expect(await screen.findByText(/invalid data/i)).toBeInTheDocument();
  expect(screen.queryByText('$')).not.toBeInTheDocument(); // No values displayed
});

// Test Case ID: ERR-MAL-002
test('Parses string numbers safely', async () => {
  server.use(
    rest.get('/api/reports/waste/summary', (req, res, ctx) => {
      return res(ctx.json({
        period: { type: 'week' },
        waste: { total_value: "1234.56", total_count: "45" } // Strings instead of numbers
      }));
    })
  );

  render(<WasteAnalysisReport />);

  // Should parse strings to numbers
  expect(await screen.findByText('$1,234.56')).toBeInTheDocument();
});
```

---

### 9.5 Timeout Scenarios

**Test Objective:** Verify timeout handling for slow APIs.

**Test Cases:**

| Test ID | Timeout Duration | Expected Behavior | Priority |
|---------|------------------|-------------------|----------|
| ERR-TIME-001 | 10s (no response) | Shows timeout message, retry button | HIGH |
| ERR-TIME-002 | 30s (no response) | Auto-retry once, then show error | MEDIUM |
| ERR-TIME-003 | Partial response (chunked, incomplete) | Wait for complete response or timeout | LOW |

**Mock Implementation:**
```javascript
// Test Case ID: ERR-TIME-001
test('Shows timeout error after 10 seconds', async () => {
  server.use(
    rest.get('/api/reports/waste/summary', async (req, res, ctx) => {
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15s delay
      return res(ctx.json(mockData));
    })
  );

  render(<WasteAnalysisReport />);

  // Should timeout after 10s
  expect(await screen.findByText(/timed out/i, {}, { timeout: 12000 })).toBeInTheDocument();
});
```

---

### 9.6 Concurrent Requests

**Test Objective:** Verify no race conditions when multiple requests in flight.

**Test Cases:**

| Test ID | Scenario | Expected Behavior | Priority |
|---------|----------|-------------------|----------|
| ERR-CONC-001 | Rapid period changes (3+ clicks) | Only latest request shown, others cancelled | HIGH |
| ERR-CONC-002 | Load multiple reports simultaneously | All load independently, no conflicts | MEDIUM |
| ERR-CONC-003 | Request in-flight when component unmounts | Request cancelled, no memory leak | HIGH |

**Mock Implementation:**
```javascript
// Test Case ID: ERR-CONC-001
test('Cancels outdated requests when period changes rapidly', async () => {
  let requestCount = 0;
  server.use(
    rest.get('/api/reports/waste/summary', async (req, res, ctx) => {
      const period = req.url.searchParams.get('period');
      requestCount++;

      await new Promise(resolve => setTimeout(resolve, 1000));

      return res(ctx.json({ period: { type: period }, waste: { total_value: requestCount * 100 } }));
    })
  );

  render(<WasteAnalysisReport />);

  // Rapidly change periods
  await userEvent.click(screen.getByRole('button', { name: /month/i }));
  await userEvent.click(screen.getByRole('button', { name: /quarter/i }));
  await userEvent.click(screen.getByRole('button', { name: /year/i }));

  // Should only show latest request result
  await waitFor(() => {
    expect(screen.getByText(/year/i)).toBeInTheDocument();
  });

  // Earlier request results should not appear
  expect(screen.queryByText('$100.00')).not.toBeInTheDocument();
  expect(screen.queryByText('$200.00')).not.toBeInTheDocument();
});
```

---

## 10. Data Validation Test Cases

### 10.1 Currency Formatting

**Test Objective:** Verify all currency values formatted consistently.

**Test Cases:**

| Test ID | Input Value | Expected Display | Priority |
|---------|-------------|------------------|----------|
| VAL-CUR-001 | 1234.56 | $1,234.56 | CRITICAL |
| VAL-CUR-002 | 1234567.89 | $1,234,567.89 | HIGH |
| VAL-CUR-003 | 0 | $0.00 | MEDIUM |
| VAL-CUR-004 | 0.5 | $0.50 | MEDIUM |
| VAL-CUR-005 | -100 | -$100.00 or ($100.00) | LOW |
| VAL-CUR-006 | 1234.567 | $1,234.57 (rounded) | MEDIUM |

**Implementation:**
```javascript
// Currency formatter utility
function formatCurrency(value, options = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

// Test Case ID: VAL-CUR-001
test('Formats currency with commas and 2 decimals', () => {
  expect(formatCurrency(1234.56)).toBe('$1,234.56');
});

// Test Case ID: VAL-CUR-006
test('Rounds to 2 decimal places', () => {
  expect(formatCurrency(1234.567)).toBe('$1,234.57');
  expect(formatCurrency(1234.564)).toBe('$1,234.56');
});
```

---

### 10.2 Date Formatting

**Test Objective:** Verify all dates formatted consistently and correctly.

**Test Cases:**

| Test ID | Input Date | Expected Display | Format | Priority |
|---------|------------|------------------|--------|----------|
| VAL-DATE-001 | 2025-11-08 | Nov 8, 2025 | MMM D, YYYY | HIGH |
| VAL-DATE-002 | 2025-11-08 | 11/08/2025 | MM/DD/YYYY | MEDIUM |
| VAL-DATE-003 | 2025-11-08T14:30:00Z | Nov 8, 2025 2:30 PM | MMM D, YYYY h:mm A | LOW |
| VAL-DATE-004 | null | "No date" or "N/A" | - | MEDIUM |
| VAL-DATE-005 | Invalid date | "Invalid date" | - | MEDIUM |

**Implementation:**
```javascript
// Date formatter utility
function formatDate(date, format = 'short') {
  if (!date || date === 'null') return 'N/A';

  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (format === 'long') {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}

// Test Case ID: VAL-DATE-001
test('Formats date in short format', () => {
  expect(formatDate('2025-11-08')).toBe('Nov 8, 2025');
});

// Test Case ID: VAL-DATE-004
test('Handles null date gracefully', () => {
  expect(formatDate(null)).toBe('N/A');
});
```

---

### 10.3 Percentage Calculations

**Test Objective:** Verify percentage calculations are accurate.

**Test Cases:**

| Test ID | Calculation | Input | Expected Output | Priority |
|---------|-------------|-------|-----------------|----------|
| VAL-PCT-001 | Waste % of inventory | waste=$1234.56, inventory=$15000 | 8.23% | CRITICAL |
| VAL-PCT-002 | Change % | current=$1234, previous=$1000 | +23.4% | CRITICAL |
| VAL-PCT-003 | Negative change | current=$800, previous=$1000 | -20.0% | HIGH |
| VAL-PCT-004 | Division by zero | current=$500, previous=$0 | N/A or ∞ | HIGH |
| VAL-PCT-005 | Very small % | waste=$1, inventory=$10000 | 0.01% | MEDIUM |

**Implementation:**
```javascript
// Percentage calculator
function calculatePercentage(part, whole, decimals = 2) {
  if (!whole || whole === 0) return 'N/A';
  const pct = (part / whole) * 100;
  return `${pct.toFixed(decimals)}%`;
}

function calculateChangePercentage(current, previous, decimals = 1) {
  if (!previous || previous === 0) return 'N/A';
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}%`;
}

// Test Case ID: VAL-PCT-001
test('Calculates waste percentage correctly', () => {
  expect(calculatePercentage(1234.56, 15000)).toBe('8.23%');
});

// Test Case ID: VAL-PCT-002
test('Calculates change percentage with sign', () => {
  expect(calculateChangePercentage(1234, 1000)).toBe('+23.4%');
});

// Test Case ID: VAL-PCT-004
test('Handles division by zero', () => {
  expect(calculatePercentage(500, 0)).toBe('N/A');
});
```

---

### 10.4 Sorting Validation

**Test Objective:** Verify sorting works correctly for all data types.

**Test Cases:**

| Test ID | Data Type | Sort Order | Test Data | Expected Order | Priority |
|---------|-----------|------------|-----------|----------------|----------|
| VAL-SORT-001 | Numbers | Ascending | [300, 100, 200] | [100, 200, 300] | HIGH |
| VAL-SORT-002 | Numbers | Descending | [100, 300, 200] | [300, 200, 100] | HIGH |
| VAL-SORT-003 | Strings | Alphabetical | ['Chicken', 'Apple', 'Banana'] | ['Apple', 'Banana', 'Chicken'] | MEDIUM |
| VAL-SORT-004 | Dates | Chronological | ['2025-11-08', '2025-11-01', '2025-11-05'] | ['2025-11-01', '2025-11-05', '2025-11-08'] | HIGH |
| VAL-SORT-005 | Mixed nulls | Handle nulls | [100, null, 200] | [100, 200, null] (nulls last) | MEDIUM |

**Implementation:**
```javascript
// Test Case ID: VAL-SORT-001
test('Sorts numbers ascending correctly', () => {
  const data = [{ value: 300 }, { value: 100 }, { value: 200 }];
  const sorted = data.sort((a, b) => a.value - b.value);
  expect(sorted.map(d => d.value)).toEqual([100, 200, 300]);
});

// Test Case ID: VAL-SORT-004
test('Sorts dates chronologically', () => {
  const data = [
    { date: '2025-11-08' },
    { date: '2025-11-01' },
    { date: '2025-11-05' }
  ];
  const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
  expect(sorted.map(d => d.date)).toEqual(['2025-11-01', '2025-11-05', '2025-11-08']);
});
```

---

### 10.5 Filtering Validation

**Test Objective:** Verify filtering returns correct subset of data.

**Test Cases:**

| Test ID | Filter Type | Filter Value | Expected Result | Priority |
|---------|-------------|--------------|-----------------|----------|
| VAL-FILT-001 | Category | "protein" | Only protein items | HIGH |
| VAL-FILT-002 | Date range | Nov 1-7 | Only items in range | HIGH |
| VAL-FILT-003 | Text search | "chicken" | Items containing "chicken" (case-insensitive) | MEDIUM |
| VAL-FILT-004 | Multiple filters | Category="protein" AND low stock | Items matching both conditions | MEDIUM |
| VAL-FILT-005 | No matches | Category="xyz" | Empty result with message | LOW |

**Implementation:**
```javascript
// Test Case ID: VAL-FILT-001
test('Filters by category correctly', () => {
  const data = [
    { name: 'Chicken', category: 'protein' },
    { name: 'Tomato', category: 'produce' },
    { name: 'Beef', category: 'protein' }
  ];

  const filtered = data.filter(item => item.category === 'protein');
  expect(filtered).toHaveLength(2);
  expect(filtered.map(i => i.name)).toEqual(['Chicken', 'Beef']);
});
```

---

### 10.6 Empty Value Handling

**Test Objective:** Verify graceful handling of null/undefined/empty values.

**Test Cases:**

| Test ID | Field | Value | Display | Priority |
|---------|-------|-------|---------|----------|
| VAL-EMPTY-001 | Price | null | "$0.00" or "N/A" | HIGH |
| VAL-EMPTY-002 | Date | null | "No date" or "N/A" | MEDIUM |
| VAL-EMPTY-003 | Text | "" (empty string) | "-" or "N/A" | MEDIUM |
| VAL-EMPTY-004 | Quantity | 0 | "0" (show zero) | HIGH |
| VAL-EMPTY-005 | Array | [] | "No items" message | MEDIUM |

---

## 11. Test Execution Checklist

### 11.1 Pre-Implementation Review Checklist

**Before Development Starts:**

- [ ] Review frontend implementation spec (confirms what to build)
- [ ] Review backend API documentation (confirms endpoints available)
- [ ] Review this QA test plan (understands quality requirements)
- [ ] Set up testing environment (Vitest, React Testing Library, MSW)
- [ ] Create test data fixtures (waste data, inventory data, etc.)
- [ ] Set up mock API server (MSW handlers for all endpoints)
- [ ] Configure code coverage reporting (80% minimum target)
- [ ] Set up accessibility testing tools (axe, Lighthouse CI)
- [ ] Create component test templates (copy-paste for consistency)
- [ ] Schedule accessibility review with QA specialist

**Estimated Time:** 2-3 hours

---

### 11.2 Developer Self-Test Checklist

**During Development (per component):**

Component: ________________
Developer: ________________
Date: ________________

**Unit Tests:**
- [ ] Component renders without errors
- [ ] All props validated (required, optional, types)
- [ ] All user interactions tested (click, type, select, etc.)
- [ ] Loading state displays correctly
- [ ] Error state displays correctly
- [ ] Empty state displays correctly
- [ ] Happy path works end-to-end
- [ ] Edge cases handled (null, zero, very large values)
- [ ] Code coverage 80%+ for this component

**Integration Tests:**
- [ ] API calls use correct endpoints
- [ ] API calls send correct parameters
- [ ] API responses parsed correctly
- [ ] Error responses handled gracefully
- [ ] Loading states show/hide appropriately
- [ ] Data updates trigger re-renders

**Accessibility:**
- [ ] No axe violations (run `npm run test:a11y`)
- [ ] All interactive elements keyboard accessible (Tab, Enter, Esc)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Screen reader tested manually (NVDA/VoiceOver)
- [ ] All images/charts have text alternatives

**Responsive Design:**
- [ ] Works at 375px width (mobile)
- [ ] Works at 768px width (tablet)
- [ ] Works at 1024px+ width (desktop)
- [ ] No horizontal scrolling (except tables)
- [ ] Touch targets 44px minimum (mobile)
- [ ] Text readable at all sizes (minimum 14px)

**Performance:**
- [ ] Component renders in < 500ms (with data)
- [ ] No unnecessary re-renders (checked with React DevTools Profiler)
- [ ] Images/charts optimized (lazy loading if needed)
- [ ] No console errors or warnings
- [ ] No memory leaks (checked with DevTools Memory Profiler)

**Browser Testing:**
- [ ] Chrome (latest) - full test
- [ ] Firefox (latest) - smoke test
- [ ] Safari (latest) - smoke test
- [ ] Mobile Safari (iOS) - smoke test
- [ ] Chrome Android - smoke test

**Estimated Time:** 30-60 minutes per component

---

### 11.3 QA Validation Checklist

**QA Review (before marking component complete):**

Component: ________________
QA Engineer: ________________
Date: ________________

**Functional Testing:**
- [ ] All acceptance criteria met (from spec)
- [ ] Happy path works correctly
- [ ] All user interactions work as expected
- [ ] Error handling works (network errors, API errors)
- [ ] Edge cases handled (empty data, null values, large numbers)
- [ ] Data displays correctly (formatting, accuracy)
- [ ] Navigation works (between reports, to/from other pages)

**UI/UX Testing:**
- [ ] Matches design mockups (if available)
- [ ] Consistent with existing components (styling, spacing)
- [ ] Text is readable (contrast, size, font)
- [ ] Loading states informative (not just spinner)
- [ ] Error messages actionable (not just "Error")
- [ ] Empty states helpful (suggest next action)
- [ ] Animations smooth (no jank)

**Accessibility Testing:**
- [ ] Keyboard navigation works (all interactive elements)
- [ ] Focus indicators visible (2px outline minimum)
- [ ] Screen reader announces content meaningfully
- [ ] Color contrast passes WCAG AA (4.5:1)
- [ ] No color-only information (use text/icons too)
- [ ] Form inputs have labels
- [ ] Headings structure logical (h1, h2, h3)
- [ ] ARIA attributes used correctly (when needed)

**Responsive Testing:**
- [ ] Mobile (375px): All content visible, no horizontal scroll
- [ ] Tablet (768px): Layout optimized for tablet
- [ ] Desktop (1024px+): Full desktop layout
- [ ] Touch targets 44px minimum (mobile/tablet)
- [ ] Date picker works on touch devices
- [ ] Charts render correctly at all sizes

**Performance Testing:**
- [ ] Lighthouse score 90+ (performance & accessibility)
- [ ] Page load < 2 seconds (with data)
- [ ] Charts render < 500ms
- [ ] No layout shifts (CLS < 0.1)
- [ ] Works on slow connection (Fast 3G throttling)

**Cross-Browser Testing:**
- [ ] Chrome (latest): Full testing
- [ ] Firefox (latest): Full testing
- [ ] Safari (latest): Full testing
- [ ] Edge (latest): Smoke testing
- [ ] Mobile Safari: Smoke testing
- [ ] Chrome Android: Smoke testing

**Data Validation:**
- [ ] Currency formatted correctly ($1,234.56)
- [ ] Dates formatted consistently (Nov 8, 2025)
- [ ] Percentages calculated accurately (8.23%)
- [ ] Sorting works correctly (ascending/descending)
- [ ] Filtering works correctly (returns expected results)

**Security Testing:**
- [ ] No sensitive data in console logs
- [ ] No API keys exposed in code
- [ ] Authorization checked (401 redirects to login)
- [ ] No XSS vulnerabilities (user input sanitized)

**Regression Testing:**
- [ ] Existing reports still work
- [ ] Shared components not broken
- [ ] Navigation still works
- [ ] Authentication still works

**Estimated Time:** 1-2 hours per component

**Sign-Off:**
- [ ] QA Approved
- [ ] Developer Approved
- [ ] Ready for Production

---

### 11.4 Launch Readiness Checklist

**Before Deploying Reports Module to Production:**

**Code Quality:**
- [ ] All unit tests passing (100%)
- [ ] All integration tests passing (100%)
- [ ] Code coverage 80%+ (critical paths 95%+)
- [ ] No console errors or warnings
- [ ] No ESLint errors
- [ ] Code reviewed by at least 1 other developer
- [ ] All TODOs resolved or documented

**Functionality:**
- [ ] All 5 report components implemented
- [ ] All 5 shared components implemented
- [ ] All API endpoints integrated
- [ ] All user interactions work
- [ ] Navigation between reports works
- [ ] Date range selection works
- [ ] Comparison mode works
- [ ] Filters/sorting work

**Accessibility:**
- [ ] WCAG 2.1 AA compliant (0 violations)
- [ ] Lighthouse accessibility score 95+
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (NVDA + VoiceOver)
- [ ] Color contrast verified
- [ ] Focus indicators visible
- [ ] Touch targets 44px minimum

**Performance:**
- [ ] Lighthouse performance score 90+
- [ ] LCP < 2.5s
- [ ] FCP < 1.5s
- [ ] CLS < 0.1
- [ ] Bundle size analyzed (< 200KB per report)
- [ ] Images/assets optimized
- [ ] No memory leaks detected

**Cross-Browser:**
- [ ] Chrome (latest): Full test passed
- [ ] Firefox (latest): Full test passed
- [ ] Safari (latest): Full test passed
- [ ] Edge (latest): Smoke test passed
- [ ] Mobile Safari: Full test passed
- [ ] Chrome Android: Smoke test passed

**Responsive Design:**
- [ ] Mobile (375px): Tested and working
- [ ] Tablet (768px): Tested and working
- [ ] Desktop (1024px+): Tested and working
- [ ] No horizontal scrolling (except tables)
- [ ] Touch interactions work

**Error Handling:**
- [ ] Network errors handled gracefully
- [ ] API errors display user-friendly messages
- [ ] Empty states informative
- [ ] Malformed data doesn't crash app
- [ ] Retry mechanisms work

**Data Accuracy:**
- [ ] Currency formatting correct
- [ ] Date formatting consistent
- [ ] Percentage calculations accurate
- [ ] Sorting produces correct results
- [ ] Filtering returns expected data

**Security:**
- [ ] Authentication required (protected routes)
- [ ] Authorization checked (403 handled)
- [ ] No sensitive data exposed
- [ ] API keys/secrets not in code
- [ ] XSS prevention verified

**Documentation:**
- [ ] User guide updated (if applicable)
- [ ] API documentation accurate
- [ ] Component documentation complete
- [ ] Testing documentation complete
- [ ] Deployment notes prepared

**Monitoring:**
- [ ] Error tracking configured (Sentry, LogRocket, etc.)
- [ ] Analytics configured (Google Analytics, Mixpanel, etc.)
- [ ] Performance monitoring configured (New Relic, DataDog, etc.)
- [ ] User feedback mechanism in place

**Stakeholder Sign-Off:**
- [ ] Product Manager approved
- [ ] QA Lead approved
- [ ] Technical Lead approved
- [ ] Security review completed (if required)
- [ ] Accessibility review completed

**Deployment Plan:**
- [ ] Deployment steps documented
- [ ] Rollback plan prepared
- [ ] Database migrations (if any) tested
- [ ] Feature flag configured (if applicable)
- [ ] Staging deployment successful
- [ ] Production deployment scheduled

**Estimated Time:** 4-6 hours (full checklist review)

---

## 12. Bug Tracking Template

### 12.1 Bug Report Format

**Title:** [Component] Brief description of issue

**Bug ID:** BUG-YYYY-MM-DD-XXX
**Reporter:** [Name]
**Date Reported:** YYYY-MM-DD
**Assigned To:** [Developer Name]
**Status:** Open | In Progress | Fixed | Verified | Closed | Won't Fix

**Environment:**
- Browser: Chrome 120.0.6099.109
- OS: Windows 11 / macOS 14.1 / iOS 17.1
- Device: Desktop / iPhone 12 / iPad Air
- Viewport: 375px / 768px / 1024px

**Severity:** (see 12.2)
**Priority:** (see 12.3)

**Description:**
Clear description of what is wrong.

**Steps to Reproduce:**
1. Navigate to Reports > Waste Analysis
2. Click "Change Period" dropdown
3. Select "Month"
4. Observe error

**Expected Result:**
Report should update to show monthly data.

**Actual Result:**
Page shows error message "Invalid date range".

**Screenshots:**
[Attach screenshots/videos showing the bug]

**Additional Context:**
- Console errors: `TypeError: Cannot read property 'startDate' of undefined`
- Network tab: API call returns 200 OK with valid data
- This only happens when switching from "Week" to "Month", not other transitions

**Workaround (if any):**
Refresh the page and select "Month" directly (don't switch from "Week").

---

### 12.2 Severity Levels

| Severity | Definition | Examples | Response Time |
|----------|------------|----------|---------------|
| **CRITICAL** | Complete loss of functionality, data loss, security vulnerability | App crashes, data corruption, unauthorized access | Immediate (within 1 hour) |
| **HIGH** | Major feature broken, no workaround available | Report won't load, charts don't render, API calls fail | Same day (within 4 hours) |
| **MEDIUM** | Feature impaired but workaround exists | Sorting doesn't work, but manual reordering possible | Within 2 days |
| **LOW** | Minor issue, cosmetic, doesn't affect functionality | Text misalignment, color slightly off, typo | Next sprint |

**Examples:**

**CRITICAL:**
- All reports return 500 error (complete failure)
- Clicking any report crashes the app
- User data deleted when viewing report
- XSS vulnerability allows code injection

**HIGH:**
- WasteAnalysisReport won't load (blank screen)
- DateRangePicker doesn't work (can't change dates)
- Charts show incorrect data (calculation error)
- Screen reader can't access any report content

**MEDIUM:**
- Sorting by date doesn't work (can sort by other columns)
- Comparison toggle doesn't update chart (but table updates)
- Currency formatting wrong ($1234.56 instead of $1,234.56)
- Focus indicator not visible on one button

**LOW:**
- Loading spinner off-center
- Button hover color slightly different than design
- Tooltip text has typo
- Empty state icon doesn't match other icons

---

### 12.3 Priority Mapping

**Priority = Severity + Impact + Frequency**

| Priority | Criteria | Action |
|----------|----------|--------|
| **P0 - Emergency** | Critical severity + Affects all users + Happens always | Drop everything, fix immediately |
| **P1 - High** | High severity + Affects many users + Happens often | Fix in current sprint |
| **P2 - Medium** | Medium severity + Affects some users + Happens occasionally | Fix in next sprint |
| **P3 - Low** | Low severity + Affects few users + Happens rarely | Backlog, fix when time allows |

**Examples:**

**P0 - Emergency:**
- Reports section returns 500 error for all users (CRITICAL + all users + always)
- Security vulnerability exposed in production (CRITICAL + all users + potential)

**P1 - High:**
- WasteAnalysisReport charts don't render on Safari (HIGH + 30% users + always on Safari)
- DateRangePicker doesn't work on mobile (HIGH + 50% users + always on mobile)

**P2 - Medium:**
- Sorting breaks when dataset has null values (MEDIUM + some users + occasionally)
- Comparison toggle doesn't work for "quarter" period (MEDIUM + few users + specific scenario)

**P3 - Low:**
- Loading spinner color doesn't match brand (LOW + all users + cosmetic)
- Tooltip positioning off by 2px (LOW + all users + cosmetic)

---

### 12.4 Go/No-Go Criteria

**Launch Decision Matrix:**

| Criteria | Go | No-Go |
|----------|-----|--------|
| **Critical Bugs** | 0 | 1+ |
| **High Bugs** | 0-2 (with workarounds documented) | 3+ |
| **Medium Bugs** | 0-5 | 6+ |
| **Low Bugs** | Any number | N/A |
| **Test Coverage** | 80%+ | < 80% |
| **Accessibility Score** | 95+ (Lighthouse) | < 95 |
| **Performance Score** | 90+ (Lighthouse) | < 90 |
| **Browser Support** | All critical browsers pass | Any critical browser fails |
| **Mobile Support** | iOS Safari + Chrome Android pass | Either fails |

**Critical Browsers:**
- Chrome (latest)
- Safari (latest)
- Mobile Safari (iOS 16+)

**Nice-to-Have Browsers:**
- Firefox (latest)
- Edge (latest)
- Chrome Android (latest)

**Launch Blockers (Automatic No-Go):**
- Any CRITICAL severity bug
- 3+ HIGH severity bugs without workarounds
- Accessibility score < 95
- Performance score < 90
- Test coverage < 80%
- Any critical browser completely broken

**Example Go Decision:**
- 0 critical bugs
- 1 high bug (chart legend doesn't show on Firefox, but chart data still visible)
- 3 medium bugs (minor UI issues with workarounds)
- 12 low bugs (cosmetic issues, documented in backlog)
- Test coverage: 85%
- Accessibility: 98
- Performance: 92
- All critical browsers working
- **Decision: GO (with release notes documenting Firefox legend issue)**

**Example No-Go Decision:**
- 0 critical bugs
- 5 high bugs (reports won't load on Safari, charts broken on mobile)
- Test coverage: 75%
- Accessibility: 88
- Performance: 95
- Safari (critical browser) broken
- **Decision: NO-GO (fix Safari issues and increase test coverage first)**

---

### 12.5 Bug Workflow

```
[Reported] → [Triaged] → [Assigned] → [In Progress] → [Fixed] → [Verified] → [Closed]
                ↓
           [Won't Fix]
           [Duplicate]
```

**Triage Process:**
1. QA reviews bug report within 24 hours
2. Assign severity + priority
3. Assign to developer OR mark as duplicate/won't fix
4. Add to sprint if P0/P1, backlog if P2/P3

**Fix Process:**
1. Developer reproduces bug
2. Developer creates fix + unit test
3. Developer marks as "Fixed" and assigns back to QA
4. QA verifies fix in staging environment
5. QA marks as "Verified" (or reopens if not fixed)
6. Bug closed after deployed to production

---

## Appendix A: Test Data Fixtures

### Waste Summary Data
```javascript
export const mockWasteSummary = {
  period: { type: 'week', start: '2025-11-01T00:00:00Z', end: '2025-11-08T23:59:59Z' },
  waste: { total_value: 1234.56, total_count: 45, avg_per_incident: 27.44 },
  all_reductions: { total_value: 1500.00 }
};

export const mockWasteSummaryWithComparison = {
  ...mockWasteSummary,
  comparison: {
    previous_period: {
      start: '2025-10-25T00:00:00Z',
      end: '2025-11-01T00:00:00Z',
      total_value: 1000.00
    },
    change: { value: 234.56, percent: 23.5, direction: 'increased' }
  }
};
```

### Waste by Category Data
```javascript
export const mockWasteByCategory = {
  period: { type: 'week', start: '2025-11-01', end: '2025-11-08' },
  total_waste: 1234.56,
  categories: [
    { category: 'protein', total_value: 500.00, count: 15 },
    { category: 'produce', total_value: 300.00, count: 12 },
    { category: 'dairy', total_value: 200.00, count: 10 },
    { category: 'dry goods', total_value: 150.00, count: 5 },
    { category: 'beverages', total_value: 84.56, count: 3 }
  ]
};
```

### Empty Data
```javascript
export const mockEmptyWaste = {
  period: { type: 'week', start: '2025-11-01', end: '2025-11-08' },
  waste: { total_value: 0, total_count: 0, avg_per_incident: 0 },
  all_reductions: { total_value: 0 }
};
```

---

## Appendix B: Testing Commands

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run accessibility tests
npm run test:a11y

# Run E2E tests (Cypress)
npm run test:e2e

# Run E2E tests (Playwright)
npm run test:e2e:playwright

# Run Lighthouse CI
npm run lighthouse

# Run specific test file
npm run test -- WasteAnalysisReport.test.jsx

# Run tests matching pattern
npm run test -- --testNamePattern="renders correctly"
```

---

## Appendix C: Accessibility Testing Tools

**Browser Extensions:**
- axe DevTools (Chrome, Firefox) - automated accessibility testing
- WAVE (Chrome, Firefox, Edge) - visual accessibility evaluation
- Lighthouse (Chrome DevTools) - automated audits

**Screen Readers:**
- NVDA (Windows) - free, open-source - https://www.nvaccess.org/
- JAWS (Windows) - commercial - https://www.freedomscientific.com/products/software/jaws/
- VoiceOver (macOS, iOS) - built-in
- TalkBack (Android) - built-in

**Contrast Checkers:**
- WebAIM Contrast Checker - https://webaim.org/resources/contrastchecker/
- Contrast Ratio (Lea Verou) - https://contrast-ratio.com/

**Color Blindness Simulators:**
- Coblis (Color Blindness Simulator) - https://www.color-blindness.com/coblis-color-blindness-simulator/
- Chrome DevTools (Vision Deficiency Emulation)

---

## Appendix D: Performance Testing Tools

**Lighthouse CI:**
```bash
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:3000/reports/waste
```

**Bundle Analysis:**
```bash
npm run build
npx vite-bundle-visualizer
```

**React DevTools Profiler:**
1. Install React DevTools browser extension
2. Open component in browser
3. Click "Profiler" tab
4. Click "Record" and interact with component
5. Review render times and re-render causes

---

## Appendix E: Quick Reference

**Priority Cheat Sheet:**
- Can't use feature at all? → CRITICAL / P0
- Feature broken, no workaround? → HIGH / P1
- Feature impaired, workaround exists? → MEDIUM / P2
- Cosmetic issue only? → LOW / P3

**Accessibility Checklist (30-second check):**
- [ ] Can I tab through everything?
- [ ] Can I see where focus is?
- [ ] Can I use it with keyboard only?
- [ ] Is text readable (contrast)?
- [ ] Does screen reader make sense?

**Performance Checklist (30-second check):**
- [ ] Loads in < 2 seconds?
- [ ] No janky animations?
- [ ] Works on slow connection?
- [ ] No console errors?
- [ ] Lighthouse score 90+?

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-08 | QA Specialist Agent | Initial comprehensive test strategy |

**Review Schedule:**
- Review before each sprint planning
- Update after any major feature changes
- Review after finding critical bugs

**Approval:**
- [ ] QA Lead
- [ ] Technical Lead
- [ ] Product Manager

**Distribution:**
- Development Team
- QA Team
- Product Management

---

**END OF DOCUMENT**

Total Pages: 50+
Total Test Cases: 150+
Estimated Testing Effort: 40-60 hours (full module)
Estimated Implementation + Testing: 80-100 hours

---

## Contact

For questions about this test plan:
- QA Lead: [Name]
- Technical Lead: [Name]
- Documentation maintained at: `REPORTS_MODULE_QA_TEST_STRATEGY.md`
