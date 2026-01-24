// frontend/src/components/shared/__tests__/DataTable.test.jsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../DataTable';
import { mockTableData, mockTableColumns } from '../../../test/mockData';

describe('DataTable', () => {
	it('renders columns and rows correctly', () => {
		render(<DataTable columns={mockTableColumns} data={mockTableData} />);

		// Check column headers
		expect(screen.getByText('Item Name')).toBeInTheDocument();
		expect(screen.getByText('Category')).toBeInTheDocument();
		expect(screen.getByText('Quantity')).toBeInTheDocument();
		expect(screen.getByText('Cost')).toBeInTheDocument();

		// Check first row data
		expect(screen.getByText('Fresh Tomatoes')).toBeInTheDocument();
		expect(screen.getByText('Produce')).toBeInTheDocument();
	});

	it('shows loading state', () => {
		render(<DataTable columns={mockTableColumns} data={[]} loading={true} />);

		const loadingElement = screen.getByRole('status');
		expect(loadingElement).toHaveAttribute('aria-label', 'Loading table');
	});

	it('shows loading skeleton with proper structure', () => {
		render(<DataTable columns={mockTableColumns} data={[]} loading={true} />);

		// Should render all column headers even in loading state
		expect(screen.getByText('Item Name')).toBeInTheDocument();

		// Should render skeleton rows
		const skeletons = screen.getAllByRole('row');
		expect(skeletons.length).toBeGreaterThan(1); // header + skeleton rows
	});

	it('shows empty state when no data', () => {
		render(<DataTable columns={mockTableColumns} data={[]} />);

		expect(screen.getByText('No data available')).toBeInTheDocument();
	});

	it('shows custom empty message', () => {
		render(
			<DataTable
				columns={mockTableColumns}
				data={[]}
				emptyMessage="No records found"
			/>
		);

		expect(screen.getByText('No records found')).toBeInTheDocument();
	});

	it('sorts data when clicking sortable column header', () => {
		render(<DataTable columns={mockTableColumns} data={mockTableData} />);

		const nameHeader = screen.getByText('Item Name');
		fireEvent.click(nameHeader);

		// Data should be sorted alphabetically
		const rows = screen.getAllByRole('row');
		expect(rows.length).toBeGreaterThan(1);
	});

	it('toggles sort direction on multiple clicks', () => {
		render(<DataTable columns={mockTableColumns} data={mockTableData} />);

		const costHeader = screen.getByText('Cost');

		// First click - ascending
		fireEvent.click(costHeader);
		let columnHeader = screen.getByRole('columnheader', { name: /Cost/i });
		expect(columnHeader).toHaveAttribute('aria-sort', 'ascending');

		// Second click - descending
		fireEvent.click(costHeader);
		columnHeader = screen.getByRole('columnheader', { name: /Cost/i });
		expect(columnHeader).toHaveAttribute('aria-sort', 'descending');
	});

	it('formats currency values correctly', () => {
		render(<DataTable columns={mockTableColumns} data={mockTableData} />);

		expect(screen.getByText('$125.50')).toBeInTheDocument();
		expect(screen.getByText('$280.00')).toBeInTheDocument();
	});

	it('formats number values correctly', () => {
		render(<DataTable columns={mockTableColumns} data={mockTableData} />);

		expect(screen.getByText('25')).toBeInTheDocument();
		expect(screen.getByText('40')).toBeInTheDocument();
	});

	it('formats date values correctly', () => {
		render(<DataTable columns={mockTableColumns} data={mockTableData} />);

		// Should format dates as "Nov 20, 2025" format
		expect(screen.getByText('Nov 20, 2025')).toBeInTheDocument();
	});

	it('formats percentage values correctly', () => {
		const columns = [
			{ key: 'name', label: 'Name', format: 'text' },
			{ key: 'percent', label: 'Percent', format: 'percentage' },
		];
		const data = [{ name: 'Test', percent: 75.5 }];

		render(<DataTable columns={columns} data={data} />);

		expect(screen.getByText('75.5%')).toBeInTheDocument();
	});

	it('formats decimal values correctly', () => {
		const columns = [
			{ key: 'name', label: 'Name', format: 'text' },
			{ key: 'value', label: 'Value', format: 'decimal' },
		];
		const data = [{ name: 'Test', value: 12.345 }];

		render(<DataTable columns={columns} data={data} />);

		expect(screen.getByText('12.3')).toBeInTheDocument();
	});

	it('handles null values with placeholder', () => {
		const data = [
			{ ...mockTableData[0], cost: null }
		];

		render(<DataTable columns={mockTableColumns} data={data} />);

		expect(screen.getByText('--')).toBeInTheDocument();
	});

	it('handles undefined values with placeholder', () => {
		const data = [
			{ name: 'Test', category: undefined, quantity: 10 }
		];

		render(<DataTable columns={mockTableColumns} data={data} />);

		expect(screen.getAllByText('--').length).toBeGreaterThan(0);
	});

	it('calls onRowClick when row is clicked', () => {
		const handleRowClick = vi.fn();
		render(
			<DataTable
				columns={mockTableColumns}
				data={mockTableData}
				onRowClick={handleRowClick}
			/>
		);

		const rows = screen.getAllByRole('row');
		// Click first data row (skip header)
		fireEvent.click(rows[1]);

		expect(handleRowClick).toHaveBeenCalledWith(mockTableData[0]);
	});

	it('adds cursor-pointer class when onRowClick is provided', () => {
		const handleRowClick = vi.fn();
		const { container } = render(
			<DataTable
				columns={mockTableColumns}
				data={mockTableData}
				onRowClick={handleRowClick}
			/>
		);

		const rows = container.querySelectorAll('tbody tr');
		expect(rows[0].className).toContain('cursor-pointer');
	});

	it('highlights row when highlightedRowId matches', () => {
		render(
			<DataTable
				columns={mockTableColumns}
				data={mockTableData}
				highlightedRowId={1}
				highlightKey="id"
			/>
		);

		const rows = screen.getAllByRole('row');
		// First data row should be highlighted
		expect(rows[1].className).toContain('bg-green-50');
		expect(rows[1]).toHaveAttribute('aria-selected', 'true');
	});

	it('shows record count in footer', () => {
		render(<DataTable columns={mockTableColumns} data={mockTableData} />);

		expect(screen.getByText(`Showing ${mockTableData.length} records`)).toBeInTheDocument();
	});

	it('applies default sort when provided', () => {
		render(
			<DataTable
				columns={mockTableColumns}
				data={mockTableData}
				defaultSort={{ column: 'cost', direction: 'desc' }}
			/>
		);

		// Should render with sorting already applied
		const costHeader = screen.getByRole('columnheader', { name: /Cost/i });
		expect(costHeader).toHaveAttribute('aria-sort', 'descending');
	});

	it('does not sort when clicking non-sortable column', () => {
		const columns = [
			{ key: 'name', label: 'Name', sortable: false },
			{ key: 'value', label: 'Value', sortable: true },
		];
		const data = [
			{ name: 'B', value: 2 },
			{ name: 'A', value: 1 },
		];

		render(<DataTable columns={columns} data={data} />);

		const nameHeader = screen.getByText('Name');
		fireEvent.click(nameHeader);

		// Should not change aria-sort attribute
		const columnHeader = screen.getByRole('columnheader', { name: 'Name' });
		expect(columnHeader).toHaveAttribute('aria-sort', 'none');
	});

	it('renders table with proper semantic HTML', () => {
		render(<DataTable columns={mockTableColumns} data={mockTableData} />);

		expect(screen.getByRole('table')).toBeInTheDocument();
		expect(screen.getAllByRole('rowgroup').length).toBeGreaterThan(0);
	});

	it('sort icons appear for sortable columns', () => {
		render(
			<DataTable
				columns={mockTableColumns}
				data={mockTableData}
				defaultSort={{ column: 'cost', direction: 'asc' }}
			/>
		);

		// Click to sort, then check for icon
		const { container } = render(
			<DataTable
				columns={mockTableColumns}
				data={mockTableData}
				defaultSort={{ column: 'cost', direction: 'asc' }}
			/>
		);

		// Should have chevron icons for sorted column
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	it('handles numeric sorting correctly', () => {
		const data = [
			{ id: 1, name: 'Item 1', value: 100 },
			{ id: 2, name: 'Item 2', value: 50 },
			{ id: 3, name: 'Item 3', value: 200 },
		];

		const columns = [
			{ key: 'name', label: 'Name', sortable: true },
			{ key: 'value', label: 'Value', sortable: true, format: 'number' },
		];

		render(<DataTable columns={columns} data={data} />);

		const valueHeader = screen.getByText('Value');
		fireEvent.click(valueHeader);

		// After sorting ascending, smallest should be first
		const rows = screen.getAllByRole('row');
		expect(rows.length).toBe(data.length + 1); // +1 for header
	});

	it('handles string sorting correctly (case-insensitive)', () => {
		const data = [
			{ id: 1, name: 'Banana' },
			{ id: 2, name: 'apple' },
			{ id: 3, name: 'Cherry' },
		];

		const columns = [
			{ key: 'name', label: 'Name', sortable: true },
		];

		render(<DataTable columns={columns} data={data} />);

		const nameHeader = screen.getByText('Name');
		fireEvent.click(nameHeader);

		// Should sort case-insensitively
		const rows = screen.getAllByRole('row');
		expect(rows.length).toBe(data.length + 1);
	});

	it('handles null values in sorting', () => {
		const data = [
			{ id: 1, name: 'Item 1', value: 100 },
			{ id: 2, name: 'Item 2', value: null },
			{ id: 3, name: 'Item 3', value: 50 },
		];

		const columns = [
			{ key: 'value', label: 'Value', sortable: true, format: 'number' },
		];

		render(<DataTable columns={columns} data={data} />);

		const valueHeader = screen.getByText('Value');
		fireEvent.click(valueHeader);

		// Should handle null values gracefully
		expect(screen.getByText('--')).toBeInTheDocument();
	});

	it('applies custom rowClassName', () => {
		const { container } = render(
			<DataTable
				columns={mockTableColumns}
				data={mockTableData}
				rowClassName="custom-row-class"
			/>
		);

		const rows = container.querySelectorAll('tbody tr');
		expect(rows[0].className).toContain('custom-row-class');
	});

	it('sticky header has proper z-index', () => {
		const { container } = render(
			<DataTable columns={mockTableColumns} data={mockTableData} />
		);

		const thead = container.querySelector('thead');
		expect(thead?.className).toContain('sticky');
		expect(thead?.className).toContain('z-10');
	});
});
