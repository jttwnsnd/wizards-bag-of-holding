interface FolderCardProps {
    name: string
    onClick: () => void
}

export default function FolderCard({ name, onClick }: FolderCardProps) {
    return (
        <div
            onClick={onClick}
            className="group flex flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 cursor-pointer transition-all duration-150"
        >
            {/* Icon */}
            <div className="text-4xl mb-3">📁</div>

            {/* Name */}
            <p className="text-sm text-white font-medium truncate">{name}</p>
        </div>
    )
}