function MobileOrdersPanel({
  cartItems,
  totalItems,
  totalPrice,
  onAddToCart,
  onDecreaseQty,
  onRemoveItem,
  onPlaceOrder,
  isPlacingOrder,
  onBackToMenu,
}) {
  return (
    <section className="md:hidden">
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[#282C3F]">Your Orders</h2>
            <p className="mt-1 text-[13px] text-[#686B78]">Review your cart and place order.</p>
          </div>
          {onBackToMenu && (
            <button
              type="button"
              onClick={onBackToMenu}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#686B78]"
            >
              Back
            </button>
          )}
        </div>

        <div className="mt-3 max-h-[45vh] space-y-2 overflow-auto pr-1">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F8F8F8] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#282C3F]">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#686B78]">Rs {item.price} each</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDecreaseQty(item.id)}
                    className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-base font-bold text-[#686B78] transition hover:bg-slate-100"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    -
                  </button>

                  <span className="min-w-7 text-center text-sm font-bold text-[#282C3F]">
                    {item.qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => onAddToCart(item)}
                    className="h-8 w-8 rounded-lg border border-brand-200 bg-white text-base font-bold text-[#FC8019] transition hover:bg-brand-50"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-[#686B78]">
              Your cart is empty.
            </p>
          )}
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-[#F8F8F8] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#686B78]">Cart Summary</p>
          <p className="mt-0.5 text-sm font-semibold text-[#282C3F]">
            <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-[#FC8019]">Rs {totalPrice}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={totalItems === 0 || isPlacingOrder}
          className="mt-3 w-full rounded-xl bg-[#FC8019] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPlacingOrder ? 'Placing...' : 'Place Order'}
        </button>
      </div>
    </section>
  )
}

export default MobileOrdersPanel
