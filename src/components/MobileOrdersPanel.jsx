function MobileOrdersPanel({
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
    <section className="md:hidden">
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="font-display text-xl font-bold text-slate-100">Your Orders</h2>
        <p className="mt-1 text-sm text-slate-400">Review your cart and place order.</p>

        <div className="mt-4 max-h-[45vh] space-y-2 overflow-auto pr-1">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
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
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-700 px-3 py-3 text-sm text-slate-400">
              Your cart is empty.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Cart Summary</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-100">
            <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
            <span className="mx-2 text-slate-500">|</span>
            <span className="text-brand-400">Rs {totalPrice}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={totalItems === 0 || isPlacingOrder}
          className="mt-4 w-full rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {isPlacingOrder ? 'Placing...' : 'Place Order'}
        </button>
      </div>
    </section>
  )
}

export default MobileOrdersPanel
