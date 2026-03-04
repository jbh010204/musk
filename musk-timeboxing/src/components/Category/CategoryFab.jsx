function CategoryFab({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 md:bottom-6 md:right-6"
      aria-label="카테고리 관리"
    >
      + 카테고리
    </button>
  )
}

export default CategoryFab
