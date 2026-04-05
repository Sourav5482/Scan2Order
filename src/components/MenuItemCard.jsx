function MenuItemCard({ item, cartQty, onAddToCart, onDecreaseQty }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-800/80 to-slate-900/80 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/60 hover:shadow-glow">
      <div className="relative h-44 overflow-hidden sm:h-48">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/80 to-transparent" />
        {!item.isAvailable && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Out of Stock
          </span>
        )}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold leading-tight text-slate-100">{item.name}</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-200">
                {item.category || 'Uncategorized'}
              </span>
              <p className="text-xs uppercase tracking-wide text-slate-400">Freshly prepared</p>
            </div>
          </div>
          <p className="rounded-lg bg-brand-500/15 px-2 py-1 text-lg font-extrabold text-brand-400">
            Rs {item.price}
          </p>
        </div>

        {item.isAvailable ? (
          cartQty > 0 ? (
            <div className="flex items-center justify-between rounded-xl border border-brand-500/50 bg-brand-500/10 px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-300">In Cart</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecreaseQty(item.id)}
                  className="h-8 w-8 rounded-lg border border-brand-400/50 text-base font-bold text-brand-200 transition-all hover:bg-brand-500/20 active:scale-[0.96]"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  -
                </button>

                <span className="min-w-6 text-center text-sm font-bold text-slate-100">
                  {cartQty}
                </span>

                <button
                  type="button"
                  onClick={() => onAddToCart(item)}
                  className="h-8 w-8 rounded-lg border border-brand-400/50 text-base font-bold text-brand-200 transition-all hover:bg-brand-500/20 active:scale-[0.96]"
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
              className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-200 hover:bg-brand-600 active:scale-[0.99]"
            >
              Add
            </button>
          )
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-xl bg-slate-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-300 disabled:cursor-not-allowed"
          >
            Unavailable
          </button>
        )}
      </div>
    </article>
  )
}

export default MenuItemCard
