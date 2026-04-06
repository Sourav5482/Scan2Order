function CartBar({
  totalItems,
  totalPrice,
  onViewCart,
  onPlaceOrder,
  isPlacingOrder,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl sm:px-4 md:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F8F8F8] px-3 py-2 sm:px-4">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#686B78]">Cart</p>
          <p className="truncate text-sm font-semibold text-[#282C3F]">
            <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-[#FC8019]">Rs {totalPrice}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onViewCart}
          disabled={totalItems === 0}
          className="rounded-xl border border-[#FC8019] bg-white px-3 py-2 text-[11px] font-semibold text-[#FC8019] transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        >
          View Cart
        </button>

        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={totalItems === 0 || isPlacingOrder}
          className="rounded-xl bg-[#FC8019] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPlacingOrder ? 'Placing...' : 'Place'}
        </button>
      </div>
    </div>
  )
}

export default CartBar
