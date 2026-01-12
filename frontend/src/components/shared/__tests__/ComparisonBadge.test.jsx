// frontend/src/components/shared/__tests__/ComparisonBadge.test.jsx

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparisonBadge from '../ComparisonBadge';

describe('ComparisonBadge', () => {
	it('renders with all props correctly', () => {
		render(
			<ComparisonBadge
				direction="up"
				value="23%"
				isPositive={true}
				label="vs last week"
				size="md"
			/>
		);

		expect(screen.getByText('23%')).toBeInTheDocument();
		expect(screen.getByText('vs last week')).toBeInTheDocument();
	});

	it('renders with direction up', () => {
		const { container } = render(
			<ComparisonBadge
				direction="up"
				value="15%"
				isPositive={true}
			/>
		);

		expect(screen.getByText('15%')).toBeInTheDocument();
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	it('renders with direction down', () => {
		const { container } = render(
			<ComparisonBadge
				direction="down"
				value="-8%"
				isPositive={false}
			/>
		);

		expect(screen.getByText('-8%')).toBeInTheDocument();
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	it('renders with neutral direction', () => {
		const { container } = render(
			<ComparisonBadge
				direction="neutral"
				value="0%"
				isPositive={true}
			/>
		);

		expect(screen.getByText('0%')).toBeInTheDocument();
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	it('applies correct color for positive upward trend', () => {
		const { container } = render(
			<ComparisonBadge
				direction="up"
				value="10%"
				isPositive={true}
			/>
		);

		const badge = container.firstChild;
		expect(badge.className).toContain('bg-green-100');
		expect(badge.className).toContain('text-green-700');
	});

	it('applies correct color for negative downward trend', () => {
		const { container } = render(
			<ComparisonBadge
				direction="down"
				value="-5%"
				isPositive={false}
			/>
		);

		const badge = container.firstChild;
		expect(badge.className).toContain('bg-red-100');
		expect(badge.className).toContain('text-red-700');
	});

	it('applies correct color for neutral trend', () => {
		const { container } = render(
			<ComparisonBadge
				direction="neutral"
				value="0%"
			/>
		);

		const badge = container.firstChild;
		expect(badge.className).toContain('bg-gray-100');
		expect(badge.className).toContain('text-gray-600');
	});

	it('renders all size variations correctly', () => {
		const sizes = ['sm', 'md', 'lg'];

		sizes.forEach((size) => {
			const { container } = render(
				<ComparisonBadge
					direction="up"
					value="10%"
					size={size}
				/>
			);

			expect(container.firstChild).toBeTruthy();
		});
	});

	it('renders small size with correct classes', () => {
		const { container } = render(
			<ComparisonBadge
				direction="up"
				value="10%"
				size="sm"
			/>
		);

		const badge = container.firstChild;
		expect(badge.className).toContain('px-2');
		expect(badge.className).toContain('text-xs');
	});

	it('renders medium size with correct classes', () => {
		const { container } = render(
			<ComparisonBadge
				direction="up"
				value="10%"
				size="md"
			/>
		);

		const badge = container.firstChild;
		expect(badge.className).toContain('px-3');
		expect(badge.className).toContain('text-sm');
	});

	it('renders large size with correct classes', () => {
		const { container } = render(
			<ComparisonBadge
				direction="up"
				value="10%"
				size="lg"
			/>
		);

		const badge = container.firstChild;
		expect(badge.className).toContain('px-4');
		expect(badge.className).toContain('text-base');
	});

	it('displays label when provided', () => {
		render(
			<ComparisonBadge
				direction="up"
				value="12%"
				label="vs previous"
			/>
		);

		expect(screen.getByText('vs previous')).toBeInTheDocument();
	});

	it('does not display label when not provided', () => {
		const { container } = render(
			<ComparisonBadge
				direction="up"
				value="12%"
			/>
		);

		expect(container.textContent).not.toContain('vs');
	});

	it('has correct ARIA labels', () => {
		render(
			<ComparisonBadge
				direction="up"
				value="15%"
				label="vs last month"
			/>
		);

		const badge = screen.getByRole('status');
		expect(badge).toHaveAttribute('aria-label', 'Comparison: up 15% vs last month');
	});

	it('has correct ARIA label without label prop', () => {
		render(
			<ComparisonBadge
				direction="down"
				value="-5%"
			/>
		);

		const badge = screen.getByRole('status');
		expect(badge).toHaveAttribute('aria-label', 'Comparison: down -5%');
	});

	it('icon is marked as aria-hidden', () => {
		const { container } = render(
			<ComparisonBadge
				direction="up"
				value="10%"
			/>
		);

		const iconContainer = container.querySelector('[aria-hidden="true"]');
		expect(iconContainer).toBeInTheDocument();
	});

	it('handles missing props with defaults', () => {
		const { container } = render(<ComparisonBadge />);

		expect(screen.getByText('0%')).toBeInTheDocument();
		expect(container.firstChild).toBeTruthy();
	});

	it('renders correctly with negative percentage', () => {
		render(
			<ComparisonBadge
				direction="down"
				value="-12.5%"
				isPositive={false}
			/>
		);

		expect(screen.getByText('-12.5%')).toBeInTheDocument();
	});

	it('renders correctly with currency values', () => {
		render(
			<ComparisonBadge
				direction="up"
				value="$1,234"
				isPositive={true}
			/>
		);

		expect(screen.getByText('$1,234')).toBeInTheDocument();
	});

	it('handles inverse positive logic (down is good)', () => {
		const { container } = render(
			<ComparisonBadge
				direction="down"
				value="-10%"
				isPositive={true}
			/>
		);

		const badge = container.firstChild;
		// When down but positive (e.g., costs decreased), should be green
		expect(badge.className).toContain('bg-green-100');
	});
});
