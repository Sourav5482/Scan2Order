function CartBar({
  cartItems,
  totalItems,
  totalPrice,
  onAddToCart,
  onDecreaseQty,
  onRemoveItem,
  onPlaceOrder,
  isPlacingOrder,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-700/90 bg-slate-950/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-4 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-3 max-h-44 overflow-auto pr-1 sm:max-h-48">
          {cartItems.length > 0 ? (
            <ul className="space-y-2">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">Rs {item.price} each</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecreaseQty(item.id)}
                      className="h-8 w-8 rounded-lg border border-slate-600 text-base font-bold text-slate-200 transition hover:bg-slate-700/70"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      -
                    </button>

                    <span className="min-w-7 text-center text-sm font-bold text-slate-100">
                      {item.qty}
                    </span>

                    <button
                      type="button"
                      onClick={() => onAddToCart(item)}
                      className="h-8 w-8 rounded-lg border border-brand-500/60 text-base font-bold text-brand-400 transition hover:bg-brand-500/20"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="rounded-lg border border-rose-500/40 px-2 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-700 px-3 py-2 text-sm text-slate-400">
              Your cart is empty.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 sm:px-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Cart Summary</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-100 sm:text-base">
              <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
              <span className="mx-2 text-slate-500">|</span>
              <span className="text-brand-400">Rs {totalPrice}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={totalItems === 0 || isPlacingOrder}
            className="w-full rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-600 active:scale-[0.99] sm:w-auto sm:min-w-44 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {isPlacingOrder ? 'Placing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartBar
