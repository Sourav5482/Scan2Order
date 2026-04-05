function MenuIcon({ isActive }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-5 w-5 ${isActive ? 'text-brand-500' : 'text-slate-300'}`}
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

function CartIcon({ isActive }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-5 w-5 ${isActive ? 'text-brand-500' : 'text-slate-300'}`}
      aria-hidden="true"
    >
      <path d="M3 5h2l2.4 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
    </svg>
  )
}

function MobileBottomNav({ activeTab, setActiveTab, totalItems }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-slate-600/80 bg-[#1e293b] px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_35px_rgba(2,6,23,0.7)] md:hidden">
      <div className="relative mx-auto grid max-w-xl grid-cols-2 rounded-2xl bg-slate-800/50 p-1">
        <span
          className={`pointer-events-none absolute bottom-1 top-1 rounded-xl bg-brand-500/15 transition-all duration-300 ${
            activeTab === 'menu' ? 'left-1 right-1/2' : 'left-1/2 right-1'
          }`}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            activeTab === 'menu'
              ? 'text-brand-500'
              : 'text-slate-200 hover:bg-slate-700/30'
          }`}
        >
          <MenuIcon isActive={activeTab === 'menu'} />
          <span>Menu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            activeTab === 'orders'
              ? 'text-brand-500'
              : 'text-slate-200 hover:bg-slate-700/30'
          }`}
        >
          <div className="relative">
            <CartIcon isActive={activeTab === 'orders'} />
            {totalItems > 0 && (
              <span className="absolute -right-2.5 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold leading-5 text-white">
                {totalItems}
              </span>
            )}
          </div>
          <span>Orders</span>
        </button>
      </div>
    </nav>
  )
}

export default MobileBottomNav
