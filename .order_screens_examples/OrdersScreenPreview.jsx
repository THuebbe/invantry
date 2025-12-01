import { useState } from "react";
import { Search, RefreshCw, Lock, ChevronDown, Package, Truck, FileText, Edit2 } from "lucide-react";

export default function OrdersScreenPreview() {
  const [selectedLine, setSelectedLine] = useState(4);
  
  const lineItems = [
    { id: 1, itemName: "Chicken Breast", qty: 2, uom: "Case", cost: 23.99, category: "Meat", vendor: "Gordon Food Service", pkgQty: 1, pkgUom: "Case", itemsPerPkg: 2, itemQty: 5, itemUom: "lbs", itemNumber: "332845", po: "PO-2025-0042", isLib: true },
    { id: 2, itemName: "Spaghetti Sauce", qty: 1, uom: "Case", cost: 23.99, category: "Canned Goods", vendor: "Sysco", isLib: true },
    { id: 3, itemName: "Dish Soap", qty: 1, uom: "Box", cost: 23.99, category: "Cleaning Supplies", vendor: "Sysco", isLib: true },
    { id: 4, itemName: "Tomatoes", qty: 2, uom: "Box", cost: 23.99, category: "Produce", vendor: "Local Farm Co", isLib: true },
    { id: 5, itemName: "Onion Yellow Super Coloss", qty: 1, uom: "Case", cost: 26.31, category: "Produce", vendor: "Gordon Food Service", pkgQty: 1, pkgUom: "Case", itemsPerPkg: 1, itemQty: 50, itemUom: "lbs", itemNumber: "998877", upc: "601089456999", isLib: true },
    { id: 6, itemName: "", qty: "", uom: "", cost: "", isLib: false },
  ];

  const sel = lineItems[selectedLine];
  const total = lineItems.filter(i => i.cost).reduce((s, i) => s + (i.qty * i.cost), 0);

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      {/* Header */}
      <div className="bg-gray-400 h-10 rounded mb-3 flex items-center justify-center text-white text-sm font-medium">HEADER</div>
      
      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-36 bg-gray-300 rounded p-3 text-gray-700 text-sm font-medium shrink-0">Sidebar</div>
        
        {/* Main */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Metrics */}
          <div className="bg-gray-300 h-16 rounded flex items-center justify-center text-gray-700 font-medium">Metric Cards</div>
          
          {/* Content */}
          <div className="flex gap-4">
            {/* Left - Header + Items */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Order Header */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <Field label="Order Number:" value="" placeholder="Auto-generated" disabled />
                  <Field label="Order Date:" value="11/25/2025" />
                  <Field label="Order Taker:" placeholder="Enter name..." />
                  <Field label="Required Date:" placeholder="Select date..." />
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500">5 items · Est. Total: ${total.toFixed(2)}</span>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium">
                    <RefreshCw size={14} /> POPULATE LINES
                  </button>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 flex-1 overflow-auto">
                <div className="space-y-2">
                  {lineItems.map((item, i) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedLine(i)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedLine === i ? "border-green-500 bg-green-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-1 pt-5 w-8">
                          {selectedLine === i && <span className="text-green-600 text-sm">◆</span>}
                          <span className="text-xs text-gray-400">{i + 1}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-2 text-sm">
                          <div className="col-span-5">
                            <label className="block text-xs text-gray-500 uppercase mb-0.5">Item Name</label>
                            <div className="relative">
                              <input value={item.itemName} placeholder="Search item..." readOnly className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 uppercase mb-0.5">Qty</label>
                            <input value={item.qty} placeholder="0" readOnly className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 uppercase mb-0.5">UOM</label>
                            {item.isLib ? (
                              <div className="flex items-center justify-between px-2 py-1.5 border border-gray-200 rounded bg-gray-50 text-gray-600">
                                <span>{item.uom || "—"}</span>
                                <Lock size={10} className="text-gray-400" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between px-2 py-1.5 border border-gray-300 rounded">
                                <span className="text-gray-400">{item.uom || "Select"}</span>
                                <ChevronDown size={12} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 uppercase mb-0.5">Cost</label>
                            <input value={item.cost ? `$${item.cost.toFixed(2)}` : ""} placeholder="$0.00" readOnly className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right" />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs text-gray-500 uppercase mb-0.5">Ext</label>
                            <div className="px-1 py-1.5 border border-gray-100 rounded bg-gray-50 text-right font-medium text-gray-700">
                              ${item.cost ? (item.qty * item.cost).toFixed(2) : "0.00"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Details */}
            <div className="w-64 shrink-0">
              <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Item Details</h3>
                {sel?.itemName ? (
                  <>
                    <h2 className="text-base font-bold text-gray-900 mb-4 leading-tight">{sel.itemName}</h2>
                    <div className="space-y-2 text-sm">
                      <Row label="Category" value={sel.category || "—"} />
                      <div className="border-t border-gray-100 pt-2 mt-2">
                        <Row label="Pkg Qty" value={sel.pkgQty || "1"} />
                        <Row label="Pkg UOM" value={sel.pkgUom || sel.uom} />
                        <Row label="Items Per Pkg" value={sel.itemsPerPkg || "—"} />
                        <Row label="Item Qty" value={sel.itemQty || "—"} />
                        <Row label="Item UOM" value={sel.itemUom || "—"} />
                      </div>
                      <div className="border-t border-gray-100 pt-2 mt-2">
                        <Row label="Vendor" value={sel.vendor || "—"} />
                        {sel.po && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">Purchase Order:</span>
                            <div className="mt-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs font-medium inline-block">{sel.po}</div>
                          </div>
                        )}
                        <Row label="Cost" value={`$${sel.cost?.toFixed(2) || "0.00"}`} />
                      </div>
                      {(sel.upc || sel.itemNumber) && (
                        <div className="border-t border-gray-100 pt-2 mt-2">
                          {sel.upc && <Row label="UPC" value={sel.upc} />}
                          {sel.itemNumber && <Row label="Item Number" value={sel.itemNumber} />}
                        </div>
                      )}
                      <div className="border-t border-gray-100 pt-2 mt-2">
                        <label className="block text-xs text-gray-500 mb-1">Notes:</label>
                        <div className="px-2 py-2 border border-gray-200 rounded bg-gray-50 min-h-[50px] text-gray-400 text-xs italic">No notes</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <Package size={32} className="mb-2 opacity-50" />
                    <p className="text-xs">Select a line item</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-0.5">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-2 py-1.5 border rounded text-sm ${disabled ? "border-gray-200 bg-gray-50 text-gray-400" : "border-gray-300"}`}
        readOnly
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-gray-500 text-xs">{label}:</span>
      <span className="font-medium text-gray-900 text-xs">{value}</span>
    </div>
  );
}
