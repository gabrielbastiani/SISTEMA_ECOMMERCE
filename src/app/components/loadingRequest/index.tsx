

export function LoadingRequest() {
    return (
        <div className="fixed inset-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-4 border-t-red-500 rounded-full animate-spin"></div>
        </div>
    )
}