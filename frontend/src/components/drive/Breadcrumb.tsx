interface BreadcrumbEntry {
  id: string
  name: string
}

interface BreadcrumbProps {
  breadcrumbs: BreadcrumbEntry[]
  onNavigate: (index: number) => void
}

export default function Breadcrumb({ breadcrumbs, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        return (
          <div key={crumb.id} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-600">/</span>}
            {isLast ? (
              <span className="text-white font-medium">{crumb.name}</span>
            ) : (
              <button
                onClick={() => onNavigate(index)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {crumb.name}
              </button>
            )}
          </div>
        )
      })}
    </nav>
  )
}