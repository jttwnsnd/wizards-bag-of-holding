export default function SkeletonCard() {
  return (
    <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-xl p-4 animate-pulse">
      {/* Icon placeholder */}
      <div className="w-10 h-10 bg-gray-700 rounded-lg mb-3" />
      {/* Name placeholder */}
      <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
      {/* Meta placeholder */}
      <div className="h-2 bg-gray-700 rounded w-1/2" />
    </div>
  )
}