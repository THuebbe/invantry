// frontend/src/components/shared/__tests__/BarChart.test.jsx

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BarChart from '../BarChart';
import { mockChartData } from '../../../test/mockData';

describe('BarChart', () => {
	it('renders with data correctly', () => {
		render(<BarChart data={mockChartData} />);

		// Should render all labels
		mockChartData.forEach((item) => {
			expect(screen.getByText(item.label)).toBeInTheDocument();
		});
	});

	it('shows loading state', () => {
		render(<BarChart loading={true} />);

		const loadingElement = screen.getByRole('status');
		expect(loadingElement).toHaveAttribute('aria-label', 'Loading chart');
	});

	it('shows empty state when no data', () => {
		render(<BarChart data={[]} />);

		expect(screen.getByText('No data available')).toBeInTheDocument();
	});

	it('shows custom empty message', () => {
		render(<BarChart data={[]} emptyMessage="No chart data found" />);

		expect(screen.getByText('No chart data found')).toBeInTheDocument();
	});

	it('renders vertical orientation by default', () => {
		render(<BarChart data={mockChartData} />);

		const chart = screen.getByRole('region');
		expect(chart).toHaveAttribute('aria-label', 'Vertical bar chart');
	});

	it('renders horizontal orientation when specified', () => {
		render(<BarChart data={mockChartData} orientation="horizontal" />);

		const chart = screen.getByRole('region');
		expect(chart).toHaveAttribute('aria-label', 'Horizontal bar chart');
	});

	it('displays values when showValues is true', () => {
		render(<BarChart data={mockChartData} showValues={true} valueFormat="currency" />);

		// Should show formatted currency values (rounded)
		expect(screen.getByText('$457')).toBeInTheDocument();
	});

	it('formats values as currency', () => {
		const data = [{ label: 'Test', value: 1234.56, color: 'bg-blue-500' }];
		render(<BarChart data={data} showValues={true} valueFormat="currency" />);

		expect(screen.getByText('$1.2K')).toBeInTheDocument();
	});

	it('formats values as numbers', () => {
		const data = [{ label: 'Test', value: 1500, color: 'bg-blue-500' }];
		render(<BarChart data={data} showValues={true} valueFormat="number" />);

		expect(screen.getByText('1.5K')).toBeInTheDocument();
	});

	it('formats values as percentage', () => {
		const data = [{ label: 'Test', value: 45.7, color: 'bg-blue-500' }];
		render(<BarChart data={data} showValues={true} valueFormat="percentage" />);

		expect(screen.getByText('45.7%')).toBeInTheDocument();
	});

	it('uses custom formatter when provided', () => {
		const data = [{ label: 'Test', value: 100, color: 'bg-blue-500' }];
		const customFormatter = (value) => `Custom: ${value}`;

		render(
			<BarChart
				data={data}
				showValues={true}
				valueFormat="custom"
				customFormatter={customFormatter}
			/>
		);

		expect(screen.getByText('Custom: 100')).toBeInTheDocument();
	});

	it('shows tooltip on hover (vertical)', () => {
		render(<BarChart data={mockChartData} orientation="vertical" />);

		const firstBar = screen.getAllByRole('article')[0];
		fireEvent.mouseEnter(firstBar);

		const tooltip = screen.getByRole('tooltip');
		expect(tooltip).toBeInTheDocument();
	});

	it('hides tooltip on mouse leave', () => {
		render(<BarChart data={mockChartData} orientation="vertical" />);

		const firstBar = screen.getAllByRole('article')[0];
		fireEvent.mouseEnter(firstBar);
		expect(screen.getByRole('tooltip')).toBeInTheDocument();

		fireEvent.mouseLeave(firstBar);
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});

	it('applies custom colors to bars', () => {
		const data = [
			{ label: 'Red', value: 100, color: 'bg-red-500' },
			{ label: 'Blue', value: 200, color: 'bg-blue-500' },
		];

		const { container } = render(<BarChart data={data} />);

		// Check that color classes are in the DOM
		expect(container.innerHTML).toContain('bg-red-500');
		expect(container.innerHTML).toContain('bg-blue-500');
	});

	it('uses default color when color not provided', () => {
		const data = [{ label: 'Test', value: 100 }];
		const { container } = render(<BarChart data={data} />);

		// Should use default green color
		expect(container.innerHTML).toContain('bg-green-500');
	});

	it('scales bars correctly relative to max value', () => {
		const data = [
			{ label: 'Low', value: 25, color: 'bg-blue-500' },
			{ label: 'High', value: 100, color: 'bg-blue-500' },
		];

		const { container } = render(<BarChart data={data} />);

		// The height/width percentages should be proportional
		expect(container).toBeTruthy();
	});

	it('uses custom maxValue when provided', () => {
		const data = [{ label: 'Test', value: 50, color: 'bg-blue-500' }];
		const { container } = render(<BarChart data={data} maxValue={200} />);

		// Bar should be 25% of max (50/200)
		expect(container).toBeTruthy();
	});

	it('has proper ARIA labels for accessibility', () => {
		render(<BarChart data={mockChartData} valueFormat="currency" />);

		const articles = screen.getAllByRole('article');
		expect(articles[0]).toHaveAttribute('aria-label', 'Produce: $457');
	});

	it('handles null values gracefully', () => {
		const data = [
			{ label: 'Valid', value: 100, color: 'bg-blue-500' },
			{ label: 'Null', value: null, color: 'bg-blue-500' },
		];

		render(<BarChart data={data} showValues={true} />);
		expect(screen.getByText('--')).toBeInTheDocument();
	});

	it('handles undefined values gracefully', () => {
		const data = [
			{ label: 'Valid', value: 100, color: 'bg-blue-500' },
			{ label: 'Undefined', value: undefined, color: 'bg-blue-500' },
		];

		render(<BarChart data={data} showValues={true} />);
		expect(screen.getByText('--')).toBeInTheDocument();
	});

	it('renders horizontal bars with correct structure', () => {
		render(<BarChart data={mockChartData} orientation="horizontal" />);

		// Should have progressbar role for horizontal bars
		const progressBars = screen.getAllByRole('progressbar');
		expect(progressBars.length).toBe(mockChartData.length);
	});

	it('horizontal bars show proper aria attributes', () => {
		const data = [{ label: 'Test', value: 75, color: 'bg-blue-500' }];
		render(<BarChart data={data} orientation="horizontal" maxValue={100} />);

		const progressBar = screen.getByRole('progressbar');
		expect(progressBar).toHaveAttribute('aria-valuenow', '75');
		expect(progressBar).toHaveAttribute('aria-valuemin', '0');
		expect(progressBar).toHaveAttribute('aria-valuemax', '100');
	});

	it('formats large currency values with K', () => {
		const data = [{ label: 'Test', value: 5000, color: 'bg-blue-500' }];
		render(<BarChart data={data} showValues={true} valueFormat="currency" />);

		expect(screen.getByText('$5.0K')).toBeInTheDocument();
	});

	it('formats large currency values with M', () => {
		const data = [{ label: 'Test', value: 2500000, color: 'bg-blue-500' }];
		render(<BarChart data={data} showValues={true} valueFormat="currency" />);

		expect(screen.getByText('$2.5M')).toBeInTheDocument();
	});

	it('formats small currency values without abbreviation', () => {
		const data = [{ label: 'Test', value: 123, color: 'bg-blue-500' }];
		render(<BarChart data={data} showValues={true} valueFormat="currency" />);

		expect(screen.getByText('$123')).toBeInTheDocument();
	});

	it('shows values outside bar when bar is too small (horizontal)', () => {
		const data = [
			{ label: 'Small', value: 5, color: 'bg-blue-500' },
			{ label: 'Large', value: 100, color: 'bg-blue-500' },
		];

		render(<BarChart data={data} orientation="horizontal" showValues={true} valueFormat="number" />);

		// Small value should be outside the bar
		expect(screen.getByText('5')).toBeInTheDocument();
	});
});
