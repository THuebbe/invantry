// VendorDetailSkeleton.jsx - Loading skeleton for VendorDetail page
// Mimics the structure of VendorDetail to provide better UX during loading

export default function VendorDetailSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Back Button and Title Skeleton */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-7 w-40 bg-gray-200 rounded"></div>
      </div>

      {/* Vendor Info Skeleton */}
      <div className="flex-shrink-0 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-5 w-full bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-5 w-full bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-5 w-full bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="flex-shrink-0 bg-white border border-gray-200 rounded-t-lg">
        <div className="flex border-b border-gray-200 p-1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded mx-1"></div>
          ))}
        </div>
      </div>

      {/* Tab Content Skeleton */}
      <div className="flex-1 overflow-y-auto bg-white border-x border-b border-gray-200 rounded-b-lg">
        <div className="p-4 space-y-4">
          {/* Content blocks */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="h-5 w-32 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="h-5 w-32 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="h-5 w-32 bg-gray-200 rounded mb-3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
