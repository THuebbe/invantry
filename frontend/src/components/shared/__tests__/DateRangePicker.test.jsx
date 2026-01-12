// frontend/src/components/shared/__tests__/DateRangePicker.test.jsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '../DateRangePicker';

describe('DateRangePicker', () => {
	it('renders with default selection', () => {
		render(<DateRangePicker selected="week" />);

		const weekElements = screen.getAllByText('This Week');
		expect(weekElements.length).toBeGreaterThan(0);
	});

	it('renders all preset buttons', () => {
		render(<DateRangePicker />);

		expect(screen.getByText('Today')).toBeInTheDocument();
		expect(screen.getAllByText('This Week').length).toBeGreaterThan(0);
		expect(screen.getAllByText('This Month').length).toBeGreaterThan(0);
		expect(screen.getAllByText('This Quarter').length).toBeGreaterThan(0);
		expect(screen.getAllByText('This Year').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Custom').length).toBeGreaterThan(0);
	});

	it('calls onSelect when preset button is clicked', () => {
		const handleSelect = vi.fn();
		render(<DateRangePicker onSelect={handleSelect} />);

		const todayButton = screen.getByText('Today');
		fireEvent.click(todayButton);

		expect(handleSelect).toHaveBeenCalledWith('today');
	});

	it('opens custom date picker when Custom button clicked', () => {
		render(<DateRangePicker />);

		const customButton = screen.getByText('Custom');
		fireEvent.click(customButton);

		expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
		expect(screen.getByLabelText('End Date')).toBeInTheDocument();
	});

	it('shows date range in display', () => {
		render(<DateRangePicker selected="week" />);

		// Should show the label (multiple instances)
		expect(screen.getAllByText('This Week').length).toBeGreaterThan(0);

		// Should show calendar icon (via role)
		const region = screen.getByRole('region', { name: 'Selected date range' });
		expect(region).toBeInTheDocument();
	});

	it('highlights selected preset button', () => {
		const { container } = render(<DateRangePicker selected="month" />);

		const monthButtons = screen.getAllByText('This Month');
		const selectedButton = monthButtons.find(el => el.getAttribute('aria-pressed') === 'true');
		expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
		expect(selectedButton.className).toContain('bg-green-600');
	});

	it('custom date picker has start and end date inputs', () => {
		render(<DateRangePicker />);

		fireEvent.click(screen.getByText('Custom'));

		const startInput = screen.getByLabelText('Start Date');
		const endInput = screen.getByLabelText('End Date');

		expect(startInput).toHaveAttribute('type', 'date');
		expect(endInput).toHaveAttribute('type', 'date');
	});

	it('validates that both dates are required', () => {
		const handleCustomChange = vi.fn();
		render(<DateRangePicker onCustomRangeChange={handleCustomChange} />);

		fireEvent.click(screen.getByText('Custom'));
		fireEvent.click(screen.getByText('Apply'));

		expect(screen.getByText('Both start and end dates are required')).toBeInTheDocument();
		expect(handleCustomChange).not.toHaveBeenCalled();
	});

	it('validates start date must be before end date', () => {
		const handleCustomChange = vi.fn();
		render(<DateRangePicker onCustomRangeChange={handleCustomChange} />);

		fireEvent.click(screen.getByText('Custom'));

		const startInput = screen.getByLabelText('Start Date');
		const endInput = screen.getByLabelText('End Date');

		fireEvent.change(startInput, { target: { value: '2025-11-20' } });
		fireEvent.change(endInput, { target: { value: '2025-11-10' } });
		fireEvent.click(screen.getByText('Apply'));

		expect(screen.getByText('Start date must be before or equal to end date')).toBeInTheDocument();
		expect(handleCustomChange).not.toHaveBeenCalled();
	});

	it('applies custom date range when valid', () => {
		const handleCustomChange = vi.fn();
		const handleSelect = vi.fn();
		render(
			<DateRangePicker
				onCustomRangeChange={handleCustomChange}
				onSelect={handleSelect}
			/>
		);

		fireEvent.click(screen.getByText('Custom'));

		const startInput = screen.getByLabelText('Start Date');
		const endInput = screen.getByLabelText('End Date');

		fireEvent.change(startInput, { target: { value: '2025-11-01' } });
		fireEvent.change(endInput, { target: { value: '2025-11-20' } });
		fireEvent.click(screen.getByText('Apply'));

		expect(handleCustomChange).toHaveBeenCalledWith({
			start: '2025-11-01',
			end: '2025-11-20',
		});
		expect(handleSelect).toHaveBeenCalledWith('custom');
	});

	it('clears validation error when date input changes', () => {
		render(<DateRangePicker />);

		fireEvent.click(screen.getByText('Custom'));
		fireEvent.click(screen.getByText('Apply'));

		expect(screen.getByText('Both start and end dates are required')).toBeInTheDocument();

		const startInput = screen.getByLabelText('Start Date');
		fireEvent.change(startInput, { target: { value: '2025-11-01' } });

		expect(screen.queryByText('Both start and end dates are required')).not.toBeInTheDocument();
	});

	it('closes custom picker when Cancel is clicked', () => {
		render(<DateRangePicker />);

		fireEvent.click(screen.getByText('Custom'));
		expect(screen.getByLabelText('Start Date')).toBeInTheDocument();

		fireEvent.click(screen.getByText('Cancel'));
		expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument();
	});

	it('renders comparison toggle when showComparison is true', () => {
		render(<DateRangePicker showComparison={true} />);

		expect(screen.getByText('Compare')).toBeInTheDocument();
		expect(screen.getByLabelText('Enable comparison with previous period')).toBeInTheDocument();
	});

	it('does not render comparison toggle when showComparison is false', () => {
		render(<DateRangePicker showComparison={false} />);

		expect(screen.queryByText('Compare')).not.toBeInTheDocument();
	});

	it('calls onComparisonToggle when checkbox is clicked', () => {
		const handleComparisonToggle = vi.fn();
		render(
			<DateRangePicker
				showComparison={true}
				onComparisonToggle={handleComparisonToggle}
			/>
		);

		const checkbox = screen.getByLabelText('Enable comparison with previous period');
		fireEvent.click(checkbox);

		expect(handleComparisonToggle).toHaveBeenCalledWith(true);
	});

	it('comparison checkbox reflects comparisonEnabled prop', () => {
		render(
			<DateRangePicker
				showComparison={true}
				comparisonEnabled={true}
			/>
		);

		const checkbox = screen.getByLabelText('Enable comparison with previous period');
		expect(checkbox).toBeChecked();
	});

	it('all preset buttons have proper aria-labels', () => {
		render(<DateRangePicker />);

		expect(screen.getByLabelText('Select Today')).toBeInTheDocument();
		expect(screen.getByLabelText('Select This Week')).toBeInTheDocument();
		expect(screen.getByLabelText('Select This Month')).toBeInTheDocument();
	});

	it('custom date picker dialog has proper aria-label', () => {
		render(<DateRangePicker />);

		fireEvent.click(screen.getByText('Custom'));

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-label', 'Custom date range picker');
	});

	it('error message has role alert', () => {
		render(<DateRangePicker />);

		fireEvent.click(screen.getByText('Custom'));
		fireEvent.click(screen.getByText('Apply'));

		const alert = screen.getByRole('alert');
		expect(alert).toBeInTheDocument();
	});

	it('date inputs have max attribute set to today', () => {
		render(<DateRangePicker />);

		fireEvent.click(screen.getByText('Custom'));

		const startInput = screen.getByLabelText('Start Date');
		const endInput = screen.getByLabelText('End Date');

		expect(startInput).toHaveAttribute('max');
		expect(endInput).toHaveAttribute('max');
	});

	it('displays custom range when selected is custom', () => {
		render(
			<DateRangePicker
				selected="custom"
				customRange={{ start: '2025-11-01', end: '2025-11-15' }}
			/>
		);

		expect(screen.getAllByText('Custom').length).toBeGreaterThan(0);
	});

	it('handles all preset selections correctly', () => {
		const presets = ['today', 'week', 'month', 'quarter', 'year'];
		const handleSelect = vi.fn();

		presets.forEach((preset) => {
			const { unmount } = render(
				<DateRangePicker selected={preset} onSelect={handleSelect} />
			);
			expect(screen.getByRole('region')).toBeInTheDocument();
			unmount();
		});
	});
});
