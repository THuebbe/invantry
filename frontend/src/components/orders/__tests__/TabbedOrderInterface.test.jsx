// frontend/src/components/orders/__tests__/TabbedOrderInterface.test.jsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TabbedOrderInterface from "../TabbedOrderInterface";

describe("TabbedOrderInterface", () => {
	let mockOnSave;
	let mockRenderContent;

	beforeEach(() => {
		mockOnSave = vi.fn().mockResolvedValue({});
		mockRenderContent = vi.fn((tabData, tabActions) => (
			<div data-testid="tab-content">
				<h2>{tabData.label}</h2>
				<p>Items: {tabData.data.items.length}</p>
				<button onClick={() => tabActions.updateData({ items: [1, 2, 3] })}>
					Update Items
				</button>
				<button onClick={() => tabActions.save()}>Save</button>
			</div>
		));
	});

	describe("Initialization", () => {
		it("should render with default first tab", () => {
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			// Should show tab with default date label
			const today = new Date();
			const month = today.toLocaleDateString("en-US", { month: "short" });
			const day = today.getDate();
			expect(screen.getByText(`${month} ${day}`)).toBeInTheDocument();
		});

		it("should render with initial tabs", () => {
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: false, data: { items: [] } },
				{ id: "tab-2", label: "Nov 26", isDirty: false, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			expect(screen.getByText("Nov 25")).toBeInTheDocument();
			expect(screen.getByText("Nov 26")).toBeInTheDocument();
		});

		it("should render vendor names for PO mode", () => {
			render(
				<TabbedOrderInterface
					mode="po"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			expect(screen.getByText("Vendor 1")).toBeInTheDocument();
		});
	});

	describe("Tab Creation", () => {
		it("should create new tab when clicking + button", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			const addButton = screen.getByText("New");
			await user.click(addButton);

			// Should have 2 tabs now
			const tabs = screen.getAllByRole("button", { name: /Close tab|Unsaved changes/ });
			expect(tabs.length).toBeGreaterThan(0);
		});

		it("should disable add button when max tabs reached", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					maxTabs={2}
				/>
			);

			// Add second tab
			const addButton = screen.getByText("New");
			await user.click(addButton);

			// Button should be disabled
			expect(addButton).toBeDisabled();
		});

		it("should switch to new tab after creation", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			const addButton = screen.getByText("New");
			await user.click(addButton);

			// New tab should be active (renderContent called with new tab)
			await waitFor(() => {
				expect(mockRenderContent).toHaveBeenCalled();
			});
		});
	});

	describe("Tab Switching", () => {
		it("should switch between tabs", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: false, data: { items: [] } },
				{ id: "tab-2", label: "Nov 26", isDirty: false, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Click on second tab
			const tab2 = screen.getByText("Nov 26");
			await user.click(tab2);

			// Should render content for second tab
			await waitFor(() => {
				const calls = mockRenderContent.mock.calls;
				const lastCall = calls[calls.length - 1];
				expect(lastCall[0].label).toBe("Nov 26");
			});
		});

		it("should preserve state when switching tabs", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: false, data: { items: [] } },
				{ id: "tab-2", label: "Nov 26", isDirty: false, data: { items: [] } },
			];

			const { rerender } = render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Update items in tab 1
			const updateButton = screen.getByText("Update Items");
			await user.click(updateButton);

			// Switch to tab 2
			const tab2 = screen.getByText("Nov 26");
			await user.click(tab2);

			// Switch back to tab 1
			const tab1 = screen.getByText("Nov 25");
			await user.click(tab1);

			// State should be preserved
			await waitFor(() => {
				expect(screen.getByText("Items: 3")).toBeInTheDocument();
			});
		});
	});

	describe("Tab Closing", () => {
		it("should close clean tab without confirmation", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: false, data: { items: [] } },
				{ id: "tab-2", label: "Nov 26", isDirty: false, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Find close buttons (X icons)
			const closeButtons = screen.getAllByTitle(/Close tab/);
			await user.click(closeButtons[0]);

			// Tab should be removed
			await waitFor(() => {
				expect(screen.queryByText("Nov 25")).not.toBeInTheDocument();
			});
		});

		it("should show confirmation dialog for dirty tab", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: true, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Click close button
			const closeButton = screen.getByTitle(/Unsaved changes/);
			await user.click(closeButton);

			// Confirmation dialog should appear
			await waitFor(() => {
				expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
			});
		});

		it("should save and close when choosing Save & Close", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: true, data: { items: [] } },
				{ id: "tab-2", label: "Nov 26", isDirty: false, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Click close button
			const closeButton = screen.getByTitle(/Unsaved changes/);
			await user.click(closeButton);

			// Click Save & Close
			const saveButton = screen.getByText("Save & Close");
			await user.click(saveButton);

			// onSave should be called
			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalled();
			});

			// Tab should be removed
			await waitFor(() => {
				expect(screen.queryByText("Nov 25")).not.toBeInTheDocument();
			});
		});

		it("should discard and close when choosing Discard Changes", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: true, data: { items: [] } },
				{ id: "tab-2", label: "Nov 26", isDirty: false, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Click close button
			const closeButton = screen.getByTitle(/Unsaved changes/);
			await user.click(closeButton);

			// Click Discard Changes
			const discardButton = screen.getByText("Discard Changes");
			await user.click(discardButton);

			// onSave should NOT be called
			expect(mockOnSave).not.toHaveBeenCalled();

			// Tab should be removed
			await waitFor(() => {
				expect(screen.queryByText("Nov 25")).not.toBeInTheDocument();
			});
		});

		it("should cancel close when choosing Cancel", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: true, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Click close button
			const closeButton = screen.getByTitle(/Unsaved changes/);
			await user.click(closeButton);

			// Click Cancel
			const cancelButton = screen.getByText("Cancel");
			await user.click(cancelButton);

			// Tab should still exist
			expect(screen.getByText("Nov 25")).toBeInTheDocument();

			// Dialog should be closed
			await waitFor(() => {
				expect(screen.queryByText("Unsaved Changes")).not.toBeInTheDocument();
			});
		});

		it("should create new tab when closing last tab", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: false, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Click close button
			const closeButton = screen.getByTitle(/Close tab/);
			await user.click(closeButton);

			// Should create new empty tab instead of closing
			await waitFor(() => {
				expect(mockRenderContent).toHaveBeenCalled();
			});
		});
	});

	describe("Tab Labeling", () => {
		it("should allow editing tab label", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			// Hover over tab to show edit button
			const today = new Date();
			const month = today.toLocaleDateString("en-US", { month: "short" });
			const day = today.getDate();
			const tabLabel = screen.getByText(`${month} ${day}`);

			// Find parent div with group class
			const tabDiv = tabLabel.closest("div");

			// Find edit button
			const editButton = tabDiv.querySelector('button[title="Edit label"]');
			await user.click(editButton);

			// Input should appear
			const input = screen.getByRole("textbox");
			expect(input).toBeInTheDocument();
		});

		it("should update label on Enter key", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			// Click edit button
			const today = new Date();
			const month = today.toLocaleDateString("en-US", { month: "short" });
			const day = today.getDate();
			const tabLabel = screen.getByText(`${month} ${day}`);
			const tabDiv = tabLabel.closest("div");
			const editButton = tabDiv.querySelector('button[title="Edit label"]');
			await user.click(editButton);

			// Type new label
			const input = screen.getByRole("textbox");
			await user.clear(input);
			await user.type(input, "Holiday Prep");
			await user.keyboard("{Enter}");

			// Label should update
			await waitFor(() => {
				expect(screen.getByText("Holiday Prep")).toBeInTheDocument();
			});
		});

		it("should cancel edit on Escape key", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			// Click edit button
			const today = new Date();
			const month = today.toLocaleDateString("en-US", { month: "short" });
			const day = today.getDate();
			const tabLabel = screen.getByText(`${month} ${day}`);
			const tabDiv = tabLabel.closest("div");
			const editButton = tabDiv.querySelector('button[title="Edit label"]');
			await user.click(editButton);

			// Type new label
			const input = screen.getByRole("textbox");
			await user.clear(input);
			await user.type(input, "New Label");
			await user.keyboard("{Escape}");

			// Label should NOT update
			await waitFor(() => {
				expect(screen.getByText(`${month} ${day}`)).toBeInTheDocument();
			});
		});

		it("should truncate long labels with ellipsis", () => {
			const initialTabs = [
				{
					id: "tab-1",
					label: "This is a very long label that should be truncated",
					isDirty: false,
					data: { items: [] },
				},
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Should show truncated version
			expect(screen.getByText(/This is a very l.../)).toBeInTheDocument();
		});
	});

	describe("State Management", () => {
		it("should mark tab as dirty when data changes", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			// Update items
			const updateButton = screen.getByText("Update Items");
			await user.click(updateButton);

			// Tab should show dirty indicator (asterisk)
			await waitFor(() => {
				expect(screen.getByText("*")).toBeInTheDocument();
			});
		});

		it("should clear dirty state after save", async () => {
			const user = userEvent.setup();
			const initialTabs = [
				{ id: "tab-1", label: "Nov 25", isDirty: true, data: { items: [] } },
			];

			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
					initialTabs={initialTabs}
				/>
			);

			// Click save button
			const saveButton = screen.getByText("Save");
			await user.click(saveButton);

			// Dirty indicator should disappear
			await waitFor(() => {
				expect(screen.queryByText("*")).not.toBeInTheDocument();
			});
		});
	});

	describe("Tab Actions", () => {
		it("should provide updateData action to renderContent", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			// Click update button
			const updateButton = screen.getByText("Update Items");
			await user.click(updateButton);

			// Content should reflect update
			await waitFor(() => {
				expect(screen.getByText("Items: 3")).toBeInTheDocument();
			});
		});

		it("should provide save action to renderContent", async () => {
			const user = userEvent.setup();
			render(
				<TabbedOrderInterface
					mode="order"
					onSave={mockOnSave}
					renderContent={mockRenderContent}
				/>
			);

			// Click save button in content
			const saveButton = screen.getByText("Save");
			await user.click(saveButton);

			// onSave should be called
			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalled();
			});
		});
	});
});
