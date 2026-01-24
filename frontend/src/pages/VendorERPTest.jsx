import React, { useState } from 'react';
import {
  useVendors,
  useVendorSummary,
  useVendorMetrics,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor
} from '../hooks/useVendors';
import {
  useCreateVendorAddress,
  useSetPrimaryAddress,
} from '../hooks/useVendorAddresses';
import {
  useCreateVendorContact,
  useSetPrimaryContact,
} from '../hooks/useVendorContacts';
import {
  useCreateVendorPaymentInfo,
  useUpdateVendorPaymentInfo,
} from '../hooks/useVendorPayment';
import {
  useCreateVendorDocument,
  useExpiringSoonDocuments,
} from '../hooks/useVendorDocuments';
import {
  useCreateVendorScorecard,
} from '../hooks/useVendorScorecards';
import { usePaymentTerms } from '../hooks/usePaymentTerms';
import { formatVendorMetric } from '../utils/vendorFormatters';
import { vendorDashboardMetrics } from '../config/vendorMetrics';

const VendorERPTest = () => {
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [testResults, setTestResults] = useState([]);

  // Queries
  const { data: vendors, isLoading: vendorsLoading } = useVendors({ is_active: true });
  const { data: vendorMetrics } = useVendorMetrics();
  const { data: vendorSummary, refetch: refetchVendorSummary } = useVendorSummary(selectedVendorId);
  const { data: paymentTerms } = usePaymentTerms();
  const { data: expiringDocs } = useExpiringSoonDocuments(selectedVendorId, 30);

  // Mutations
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();
  const createAddress = useCreateVendorAddress();
  const setPrimaryAddress = useSetPrimaryAddress();
  const createContact = useCreateVendorContact();
  const setPrimaryContact = useSetPrimaryContact();
  const createPaymentInfo = useCreateVendorPaymentInfo();
  const updatePaymentInfo = useUpdateVendorPaymentInfo();
  const createDocument = useCreateVendorDocument();
  const createScorecard = useCreateVendorScorecard();

  const addTestResult = (testName, success, data) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date().toISOString(),
      testName,
      success,
      data,
    }]);
  };

  // Test Functions
  const runTest1_CreateVendor = async () => {
    try {
      const result = await createVendor.mutateAsync({
        name: `Test Vendor ${Date.now()}`,
        vendor_code: `TEST${Date.now()}`,
        legal_name: 'Test Vendor Inc',
        trade_name: 'Test Vendor',
        is_active: true,
        notes: 'Created by test page',
      });
      addTestResult('Create Vendor', true, result);
      setSelectedVendorId(result.id);
    } catch (error) {
      addTestResult('Create Vendor', false, error.response?.data || error.message);
    }
  };

  const runTest2_AddAddress = async () => {
    if (!selectedVendorId) {
      addTestResult('Add Address', false, 'No vendor selected');
      return;
    }

    try {
      const result = await createAddress.mutateAsync({
        vendorId: selectedVendorId,
        addressData: {
          address_type: 'billing',
          address_line1: '123 Test Street',
          address_line2: 'Suite 100',
          city: 'Chicago',
          state: 'IL',
          postal_code: '60601',
          country: 'US',
          phone: '312-555-1234',
          email: 'billing@testvendor.com',
          is_primary: true,
        },
      });
      addTestResult('Add Address', true, result);
    } catch (error) {
      addTestResult('Add Address', false, error.response?.data || error.message);
    }
  };

  const runTest3_AddContact = async () => {
    if (!selectedVendorId) {
      addTestResult('Add Contact', false, 'No vendor selected');
      return;
    }

    try {
      const result = await createContact.mutateAsync({
        vendorId: selectedVendorId,
        contactData: {
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@testvendor.com',
          phone: '312-555-1234',
          mobile: '312-555-5678',
          title: 'Account Manager',
          role: 'Account Manager',
          is_primary: true,
          receive_orders: true,
          receive_invoices: false,
          notes: 'Primary test contact',
        },
      });
      addTestResult('Add Contact', true, result);
    } catch (error) {
      addTestResult('Add Contact', false, error.response?.data || error.message);
    }
  };

  const runTest4_AddPaymentInfo = async () => {
    if (!selectedVendorId || !paymentTerms || paymentTerms.length === 0) {
      addTestResult('Add Payment Info', false, 'No vendor or payment terms');
      return;
    }

    try {
      const result = await createPaymentInfo.mutateAsync({
        vendorId: selectedVendorId,
        paymentData: {
          payment_term_id: paymentTerms[0].id,
          tax_id_type: 'EIN',
          tax_id_number: '12-3456789',
          payment_method: 'ACH',
          bank_name: 'Test Bank',
          bank_account_type: 'Checking',
          bank_routing_number: '021000021',
          bank_account_number: '123456789012',
          remittance_email: 'payments@testvendor.com',
          credit_limit: 50000,
          notes: 'Test payment info',
        },
      });
      addTestResult('Add Payment Info', true, result);
    } catch (error) {
      addTestResult('Add Payment Info', false, error.response?.data || error.message);
    }
  };

  const runTest5_AddDocument = async () => {
    if (!selectedVendorId) {
      addTestResult('Add Document', false, 'No vendor selected');
      return;
    }

    try {
      const result = await createDocument.mutateAsync({
        vendorId: selectedVendorId,
        documentData: {
          document_type: 'W9',
          document_name: '2025 W9 Tax Form',
          file_path: '/test/documents/w9_2025.pdf',
          file_url: 'https://example.com/w9_2025.pdf',
          expiration_date: '2025-12-31',
          is_current: true,
          notes: 'Test document',
        },
      });
      addTestResult('Add Document', true, result);
    } catch (error) {
      addTestResult('Add Document', false, error.response?.data || error.message);
    }
  };

  const runTest6_AddScorecard = async () => {
    if (!selectedVendorId) {
      addTestResult('Add Scorecard', false, 'No vendor selected');
      return;
    }

    try {
      const result = await createScorecard.mutateAsync({
        vendorId: selectedVendorId,
        scorecardData: {
          metric_name: 'on_time_delivery_pct',
          metric_value: 95.5,
          score: 95,
          period_start: '2025-12-01',
          period_end: '2025-12-31',
          data_points_count: 42,
        },
      });
      addTestResult('Add Scorecard', true, result);
    } catch (error) {
      addTestResult('Add Scorecard', false, error.response?.data || error.message);
    }
  };

  const runTest7_FetchSummary = async () => {
    if (!selectedVendorId) {
      addTestResult('Fetch Summary', false, 'No vendor selected');
      return;
    }

    if (vendorSummary) {
      addTestResult('Fetch Summary', true, {
        message: 'Summary loaded successfully',
        vendor: vendorSummary.name,
        addresses: vendorSummary.addresses?.length || 0,
        contacts: vendorSummary.contacts?.length || 0,
        hasPaymentInfo: !!vendorSummary.payment_info,
        documents: vendorSummary.documents?.length || 0,
        scorecards: vendorSummary.scorecards?.length || 0,
      });
    } else {
      addTestResult('Fetch Summary', false, 'Summary not available');
    }
  };

  const runTest8_UpdateVendor = async () => {
    if (!selectedVendorId) {
      addTestResult('Update Vendor', false, 'No vendor selected');
      return;
    }

    try {
      const result = await updateVendor.mutateAsync({
        vendorId: selectedVendorId,
        updates: {
          notes: `Updated at ${new Date().toLocaleTimeString()}`,
        },
      });
      addTestResult('Update Vendor', true, result);
    } catch (error) {
      addTestResult('Update Vendor', false, error.response?.data || error.message);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);

    // Run create vendor and get the ID
    let createdVendorId = null;
    try {
      const result = await createVendor.mutateAsync({
        name: `Test Vendor ${Date.now()}`,
        vendor_code: `TEST${Date.now()}`,
        legal_name: 'Test Vendor Inc',
        trade_name: 'Test Vendor',
        is_active: true,
        notes: 'Created by test page - Run All Tests',
      });
      addTestResult('Create Vendor', true, result);
      createdVendorId = result.id;
      setSelectedVendorId(result.id);
    } catch (error) {
      addTestResult('Create Vendor', false, error.response?.data || error.message);
      return; // Stop if vendor creation fails
    }

    // Wait for React Query cache to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run all other tests with the created vendor ID
    try {
      const addressResult = await createAddress.mutateAsync({
        vendorId: createdVendorId,
        addressData: {
          address_type: 'billing',
          address_line1: '123 Test Street',
          address_line2: 'Suite 100',
          city: 'Chicago',
          state: 'IL',
          postal_code: '60601',
          country: 'US',
          phone: '312-555-1234',
          email: 'billing@testvendor.com',
          is_primary: true,
        },
      });
      addTestResult('Add Address', true, addressResult);
    } catch (error) {
      addTestResult('Add Address', false, error.response?.data || error.message);
    }

    try {
      const contactResult = await createContact.mutateAsync({
        vendorId: createdVendorId,
        contactData: {
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@testvendor.com',
          phone: '312-555-1234',
          mobile: '312-555-5678',
          title: 'Account Manager',
          role: 'Account Manager',
          is_primary: true,
          receive_orders: true,
          receive_invoices: false,
          notes: 'Primary test contact',
        },
      });
      addTestResult('Add Contact', true, contactResult);
    } catch (error) {
      addTestResult('Add Contact', false, error.response?.data || error.message);
    }

    if (paymentTerms && paymentTerms.length > 0) {
      try {
        const paymentResult = await createPaymentInfo.mutateAsync({
          vendorId: createdVendorId,
          paymentData: {
            payment_term_id: paymentTerms[0].id,
            tax_id_type: 'EIN',
            tax_id_number: '12-3456789',
            payment_method: 'ACH',
            bank_name: 'Test Bank',
            bank_account_type: 'Checking',
            bank_routing_number: '021000021',
            bank_account_number: '123456789012',
            remittance_email: 'payments@testvendor.com',
            credit_limit: 50000,
            notes: 'Test payment info',
          },
        });
        addTestResult('Add Payment Info', true, paymentResult);
      } catch (error) {
        addTestResult('Add Payment Info', false, error.response?.data || error.message);
      }
    } else {
      addTestResult('Add Payment Info', false, 'No payment terms available');
    }

    try {
      const docResult = await createDocument.mutateAsync({
        vendorId: createdVendorId,
        documentData: {
          document_type: 'W9',
          document_name: '2025 W9 Tax Form',
          file_path: '/test/documents/w9_2025.pdf',
          file_url: 'https://example.com/w9_2025.pdf',
          expiration_date: '2025-12-31',
          is_current: true,
          notes: 'Test document',
        },
      });
      addTestResult('Add Document', true, docResult);
    } catch (error) {
      addTestResult('Add Document', false, error.response?.data || error.message);
    }

    try {
      const scorecardResult = await createScorecard.mutateAsync({
        vendorId: createdVendorId,
        scorecardData: {
          metric_name: 'on_time_delivery_pct',
          metric_value: 95.5,
          score: 95,
          period_start: '2025-12-01',
          period_end: '2025-12-31',
          data_points_count: 42,
        },
      });
      addTestResult('Add Scorecard', true, scorecardResult);
    } catch (error) {
      addTestResult('Add Scorecard', false, error.response?.data || error.message);
    }

    // Wait for all mutations to settle and queries to refetch
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Manually refetch summary to get fresh data
    try {
      const { data: freshSummary } = await refetchVendorSummary();
      if (freshSummary && freshSummary.id === createdVendorId) {
        addTestResult('Fetch Summary', true, {
          message: 'Summary loaded successfully',
          vendor: freshSummary.name,
          addresses: freshSummary.addresses?.length || 0,
          contacts: freshSummary.contacts?.length || 0,
          hasPaymentInfo: !!freshSummary.payment_info,
          documents: freshSummary.documents?.length || 0,
          scorecards: freshSummary.scorecards?.length || 0,
        });
      } else {
        addTestResult('Fetch Summary', false, 'Summary data mismatch or not found');
      }
    } catch (error) {
      addTestResult('Fetch Summary', false, error.response?.data || error.message);
    }

    try {
      const updateResult = await updateVendor.mutateAsync({
        vendorId: createdVendorId,
        updates: {
          notes: `Updated at ${new Date().toLocaleTimeString()} - All tests complete!`,
        },
      });
      addTestResult('Update Vendor', true, updateResult);
    } catch (error) {
      addTestResult('Update Vendor', false, error.response?.data || error.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Vendor ERP API Test Page</h1>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={runTest1_CreateVendor}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={createVendor.isPending}
          >
            1. Create Vendor
          </button>
          <button
            onClick={runTest2_AddAddress}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={!selectedVendorId || createAddress.isPending}
          >
            2. Add Address
          </button>
          <button
            onClick={runTest3_AddContact}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            disabled={!selectedVendorId || createContact.isPending}
          >
            3. Add Contact
          </button>
          <button
            onClick={runTest4_AddPaymentInfo}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            disabled={!selectedVendorId || createPaymentInfo.isPending}
          >
            4. Add Payment Info
          </button>
          <button
            onClick={runTest5_AddDocument}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            disabled={!selectedVendorId || createDocument.isPending}
          >
            5. Add Document
          </button>
          <button
            onClick={runTest6_AddScorecard}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            disabled={!selectedVendorId || createScorecard.isPending}
          >
            6. Add Scorecard
          </button>
          <button
            onClick={runTest7_FetchSummary}
            className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
            disabled={!selectedVendorId}
          >
            7. Fetch Summary
          </button>
          <button
            onClick={runTest8_UpdateVendor}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
            disabled={!selectedVendorId || updateVendor.isPending}
          >
            8. Update Vendor
          </button>
          <button
            onClick={runAllTests}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Run All Tests
          </button>
          <button
            onClick={() => setTestResults([])}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Clear Results
          </button>
        </div>
        {selectedVendorId && (
          <p className="mt-4 text-sm text-gray-600">
            Selected Vendor ID: <code className="bg-gray-100 px-2 py-1 rounded">{selectedVendorId}</code>
          </p>
        )}
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {vendorDashboardMetrics.map((metric) => {
          const value = vendorMetrics?.[metric.dataKey];
          const formattedValue = formatVendorMetric(value, metric.format, metric);
          const Icon = metric.icon;

          return (
            <div key={metric.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600">{metric.label}</h3>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold mt-2">{formattedValue}</p>
              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
            </div>
          );
        })}
      </div>

      {/* Vendors List */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Vendors List ({vendors?.length || 0})</h2>
        {vendorsLoading ? (
          <p>Loading vendors...</p>
        ) : vendors && vendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(vendor => (
              <div
                key={vendor.id}
                onClick={() => setSelectedVendorId(vendor.id)}
                className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors ${
                  selectedVendorId === vendor.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <h3 className="font-bold">{vendor.name}</h3>
                <p className="text-sm text-gray-600">{vendor.vendor_code || 'No code'}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
                  vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No vendors found. Create one using the test buttons above.</p>
        )}
      </div>

      {/* Vendor Summary */}
      {vendorSummary && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Vendor Summary - {vendorSummary.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="border rounded p-3">
              <h3 className="font-semibold text-sm text-gray-600">Addresses</h3>
              <p className="text-2xl font-bold">{vendorSummary.addresses?.length || 0}</p>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-semibold text-sm text-gray-600">Contacts</h3>
              <p className="text-2xl font-bold">{vendorSummary.contacts?.length || 0}</p>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-semibold text-sm text-gray-600">Payment Info</h3>
              <p className="text-2xl font-bold">{vendorSummary.payment_info ? 'Yes' : 'No'}</p>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-semibold text-sm text-gray-600">Documents</h3>
              <p className="text-2xl font-bold">{vendorSummary.documents?.length || 0}</p>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-semibold text-sm text-gray-600">Scorecards</h3>
              <p className="text-2xl font-bold">{vendorSummary.scorecards?.length || 0}</p>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-semibold text-sm text-gray-600">Items</h3>
              <p className="text-2xl font-bold">{vendorSummary.items?.length || 0}</p>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
              View Full JSON
            </summary>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs mt-2">
              {JSON.stringify(vendorSummary, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Payment Terms */}
      {paymentTerms && paymentTerms.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Terms ({paymentTerms.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentTerms.map(term => (
              <div key={term.id} className="border rounded p-3">
                <h3 className="font-bold">{term.name}</h3>
                <p className="text-sm text-gray-600">{term.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {term.days} days
                  {term.discount_percent > 0 && ` | ${term.discount_percent}% discount if paid within ${term.discount_days} days`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results ({testResults.length})</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No test results yet. Run tests using the buttons above.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {testResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border-l-4 ${
                  result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{result.testName}</h4>
                    <p className="text-xs text-gray-600">{new Date(result.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {result.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                    View Details
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorERPTest;
