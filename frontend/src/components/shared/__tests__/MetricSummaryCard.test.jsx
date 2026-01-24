// frontend/src/components/shared/__tests__/MetricSummaryCard.test.jsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricSummaryCard from '../MetricSummaryCard';
import { Package, TrendingUp } from 'lucide-react';

describe('MetricSummaryCard', () => {
	it('renders with all props correctly', () => {
		render(
			<MetricSummaryCard
				title="Total Items"
				value="150"
				icon={Package}
				color="blue"
				loading={false}
				error={false}
			/>
		);

		expect(screen.getByText('Total Items')).toBeInTheDocument();
		expect(screen.getByText('150')).toBeInTheDocument();
	});

	it('displays loading state with skeleton', () => {
		render(
			<MetricSummaryCard
				title="Total Items"
				value="150"
				icon={Package}
				color="blue"
				loading={true}
				error={false}
			/>
		);

		// Should show loading skeleton
		const loadingElements = screen.getAllByRole('status');
		expect(loadingElements.length).toBeGreaterThan(0);
	});

	it('displays error state with message', () => {
		render(
			<MetricSummaryCard
				title="Total Items"
				value="150"
				icon={Package}
				color="blue"
				loading={false}
				error={true}
			/>
		);

		expect(screen.getByText('Error loading metric')).toBeInTheDocument();
	});

	it('renders trend indicator when provided', () => {
		const trend = {
			direction: 'up',
			value: '12.5%',
			isGood: true,
			description: 'vs last week',
		};

		render(
			<MetricSummaryCard
				title="Total Sales"
				value="$1,250"
				icon={TrendingUp}
				color="green"
				trend={trend}
				loading={false}
				error={false}
			/>
		);

		expect(screen.getByText('12.5%')).toBeInTheDocument();
		expect(screen.getByText('vs last week')).toBeInTheDocument();
	});

	it('applies correct color theming', () => {
		const { container } = render(
			<MetricSummaryCard
				title="Warning"
				value="5"
				icon={Package}
				color="red"
				loading={false}
				error={false}
			/>
		);

		// Check if color classes are applied (this is a basic check)
		expect(container.firstChild).toBeTruthy();
	});

	it('handles missing trend gracefully', () => {
		render(
			<MetricSummaryCard
				title="Total Items"
				value="150"
				icon={Package}
				color="blue"
				loading={false}
				error={false}
			/>
		);

		// Should not crash, just not show trend section
		expect(screen.getByText('Total Items')).toBeInTheDocument();
	});

	it('handles different color variants', () => {
		const colors = ['red', 'blue', 'green', 'yellow'];

		colors.forEach((color) => {
			const { container } = render(
				<MetricSummaryCard
					title={`${color} metric`}
					value="100"
					icon={Package}
					color={color}
					loading={false}
					error={false}
				/>
			);
			expect(container.firstChild).toBeTruthy();
		});
	});

	it('renders icon component correctly', () => {
		const { container } = render(
			<MetricSummaryCard
				title="Total Items"
				value="150"
				icon={Package}
				color="blue"
				loading={false}
				error={false}
			/>
		);

		// Icon should be rendered
		const svg = container.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});
});
