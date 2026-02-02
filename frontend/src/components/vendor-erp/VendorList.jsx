// VendorList.jsx - Grid display of all vendors
// Shows vendor cards in responsive grid with filtering options

import { useState, useMemo, useEffect } from "react";
import { useVendors } from "../../hooks/useVendors";
import VendorCard from "./components/VendorCard";
import VendorForm from "./forms/VendorForm";
import { Search, Filter, Plus, Loader2, X } from "lucide-react";

export default function VendorList({ title = "All Vendors" }) {

  // Initialize state from localStorage with fallbacks
  const [searchTerm, setSearchTerm] = useState(() =>
    localStorage.getItem('vendorSearch') || ''
  );
  const [statusFilter, setStatusFilter] = useState(() =>
    localStorage.getItem('vendorStatusFilter') || 'all'
  );
  const [gradeFilter, setGradeFilter] = useState(() =>
    localStorage.getItem('vendorGradeFilter') || 'all'
  );
  const [sortBy, setSortBy] = useState(() =>
    localStorage.getItem('vendorSortBy') || 'name-asc'
  );
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch vendors from backend
  const { data: vendors = [], isLoading, error, refetch } = useVendors();

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem('vendorSearch', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('vendorStatusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('vendorGradeFilter', gradeFilter);
  }, [gradeFilter]);

  useEffect(() => {
    localStorage.setItem('vendorSortBy', sortBy);
  }, [sortBy]);

  // Filter and sort vendors with useMemo for performance
  const filteredVendors = useMemo(() => {
    let result = vendors || [];

    // Apply search (case-insensitive)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.name?.toLowerCase().includes(search) ||
        v.vendor_code?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(v => {
        if (statusFilter === 'active') return v.is_active === true;
        if (statusFilter === 'inactive') return v.is_active === false;
        return true;
      });
    }

    // Apply grade filter
    if (gradeFilter !== 'all') {
      result = result.filter(v => v.performance_grade === gradeFilter);
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'code-asc':
          return (a.vendor_code || '').localeCompare(b.vendor_code || '');
        case 'code-desc':
          return (b.vendor_code || '').localeCompare(a.vendor_code || '');
        case 'grade-asc':
          return (a.performance_grade || 'F').localeCompare(b.performance_grade || 'F');
        case 'grade-desc':
          return (b.performance_grade || 'F').localeCompare(a.performance_grade || 'F');
        default:
          return 0;
      }
    });

    return result;
  }, [vendors, searchTerm, statusFilter, gradeFilter, sortBy]);

  const activeCount = vendors.filter((v) => v.is_active).length;
  const inactiveCount = vendors.filter((v) => !v.is_active).length;

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setGradeFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || gradeFilter !== 'all';

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading vendors...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-base font-semibold text-red-900 mb-2">Error Loading Vendors</h3>
          <p className="text-sm text-red-800 mb-4">
            {error.message || 'An error occurred while loading vendors. Please try again.'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 text-sm rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">
            {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVendor(null);
            setShowVendorForm(true);
          }}
          className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 text-sm rounded flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700 font-medium">
            {successMessage}
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or vendor code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active ({activeCount})</option>
            <option value="inactive">Inactive ({inactiveCount})</option>
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="all">All Grades</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
            <option value="F">Grade F</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="code-asc">Vendor Code (A-Z)</option>
          <option value="code-desc">Vendor Code (Z-A)</option>
          <option value="grade-asc">Grade (Best First)</option>
          <option value="grade-desc">Grade (Worst First)</option>
        </select>
      </div>

      {/* Vendor Grid */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onEdit={(vendor) => {
                setEditingVendor(vendor);
                setShowVendorForm(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            No vendors found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Click "Add Vendor" to create your first vendor'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Vendor Form Modal */}
      {showVendorForm && (
        <VendorForm
          vendor={editingVendor}
          onClose={() => {
            setShowVendorForm(false);
            setEditingVendor(null);
          }}
          onSuccess={(vendorName, isUpdate) => {
            refetch();
            const action = isUpdate ? 'updated' : 'created';
            setSuccessMessage(`Vendor "${vendorName}" ${action} successfully!`);
            setTimeout(() => setSuccessMessage(""), 5000);
          }}
        />
      )}
    </div>
  );
}
