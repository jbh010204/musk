function DataFab({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-36 right-4 z-30 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 md:bottom-24 md:right-6"
      aria-label="데이터 백업 복원"
    >
      데이터
    </button>
  )
}

export default DataFab
