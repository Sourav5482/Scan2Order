function MenuItemCard({ item, cartQty, onAddToCart, onDecreaseQty }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative h-40 overflow-hidden sm:h-44">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/40 to-transparent" />
        {!item.isAvailable && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Out of Stock
          </span>
        )}
      </div>

      <div className="space-y-3 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold leading-tight text-[#282C3F]">{item.name}</h3>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#FC8019]">
                {item.category || 'Uncategorized'}
              </span>
              <p className="text-[11px] text-[#686B78]">Freshly prepared</p>
            </div>
          </div>
          <p className="rounded-lg bg-brand-50 px-2 py-1 text-base font-bold text-[#FC8019]">
            Rs {item.price}
          </p>
        </div>

        {item.isAvailable ? (
          cartQty > 0 ? (
            <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
              <span className="text-[11px] font-semibold text-[#FC8019]">In Cart</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecreaseQty(item.id)}
                  className="h-8 w-8 rounded-lg border border-brand-200 bg-white text-base font-bold text-[#FC8019] transition-all hover:bg-brand-50 active:scale-[0.96]"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  -
                </button>

                <span className="min-w-6 text-center text-sm font-bold text-[#282C3F]">
                  {cartQty}
                </span>

                <button
                  type="button"
                  onClick={() => onAddToCart(item)}
                  className="h-8 w-8 rounded-lg border border-brand-200 bg-white text-base font-bold text-[#FC8019] transition-all hover:bg-brand-50 active:scale-[0.96]"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(item)}
              className="w-full rounded-xl bg-[#FC8019] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-600 active:scale-[0.99]"
            >
              Add
            </button>
          )
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed"
          >
            Unavailable
          </button>
        )}
      </div>
    </article>
  )
}

export default MenuItemCard
