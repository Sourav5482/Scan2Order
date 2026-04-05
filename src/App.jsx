import { useEffect, useMemo, useRef, useState } from 'react'
import CartBar from './components/CartBar'
import MobileBottomNav from './components/MobileBottomNav'
import MobileOrdersPanel from './components/MobileOrdersPanel'
import MenuItemCard from './components/MenuItemCard'
import OrderStatusPage from './components/OrderStatusPage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://scan2orderbackend.onrender.com'
const VALID_AVAILABILITY = new Set(['all', 'available', 'unavailable'])
const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Out of Stock' },
]

function App() {
  const initialParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  )
  const restaurantId = initialParams.get('restaurant')
  const table = initialParams.get('table')
  const orderId = initialParams.get('orderId')
  const initialSearchQuery = initialParams.get('q') || ''
  const initialCategory = initialParams.get('category') || 'all'
  const initialAvailability = initialParams.get('availability') || 'all'

  const [cartItems, setCartItems] = useState([])
  const [activeTab, setActiveTab] = useState('menu')
  const [menuItems, setMenuItems] = useState([])
  const [searchInput, setSearchInput] = useState(initialSearchQuery)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedAvailability, setSelectedAvailability] = useState(
    VALID_AVAILABILITY.has(initialAvailability) ? initialAvailability : 'all',
  )
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)
  const [menuError, setMenuError] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null)
  const [orderError, setOrderError] = useState('')
  const touchStartRef = useRef({ x: 0, y: 0 })
  const lastCartActionRef = useRef({})

  const shouldProcessCartAction = (itemId, actionType, delay = 180) => {
    const actionKey = `${actionType}-${itemId}`
    const now = Date.now()
    const lastActionAt = lastCartActionRef.current[actionKey] || 0

    if (now - lastActionAt < delay) {
      return false
    }

    lastCartActionRef.current[actionKey] = now
    return true
  }

  useEffect(() => {
    const fetchMenu = async () => {
      if (!restaurantId?.trim()) {
        setMenuError('Missing restaurantId in URL. Use ?restaurant=<id>&table=<number>.')
        setIsLoadingMenu(false)
        return
      }

      setIsLoadingMenu(true)
      setMenuError('')

      try {
        const response = await fetch(`${BASE_URL}/menu/${restaurantId}`)

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const result = await response.json()
        const items = Array.isArray(result.data) ? result.data : []

        const normalizedItems = items.map((item) => ({
          id: item._id || item.id,
          name: item.name,
          category: item.category || 'Uncategorized',
          price: item.price,
          image: item.image,
          isAvailable: item.isAvailable !== false,
        }))

        setMenuItems(normalizedItems)
      } catch (error) {
        console.error('[MENU] Failed to fetch menu:', error)
        setMenuError('Unable to load menu right now. Please try again.')
      } finally {
        setIsLoadingMenu(false)
      }
    }

    fetchMenu()
  }, [restaurantId])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchInput])

  useEffect(() => {
    if (orderId?.trim()) {
      return
    }

    const nextParams = new URLSearchParams(window.location.search)

    if (searchQuery.trim()) {
      nextParams.set('q', searchQuery.trim())
    } else {
      nextParams.delete('q')
    }

    if (selectedCategory !== 'all') {
      nextParams.set('category', selectedCategory)
    } else {
      nextParams.delete('category')
    }

    if (selectedAvailability !== 'all') {
      nextParams.set('availability', selectedAvailability)
    } else {
      nextParams.delete('availability')
    }

    const nextQuery = nextParams.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)
  }, [searchQuery, selectedCategory, selectedAvailability, orderId])

  const addToCart = (menuItem) => {
    if (!shouldProcessCartAction(menuItem.id, 'inc')) {
      return
    }

    setCartItems((previousItems) => {
      const existingItem = previousItems.find((item) => item.id === menuItem.id)

      if (existingItem) {
        return previousItems.map((item) =>
          item.id === menuItem.id ? { ...item, qty: item.qty + 1 } : item,
        )
      }

      return [...previousItems, { ...menuItem, qty: 1 }]
    })
  }

  const decreaseQty = (itemId) => {
    if (!shouldProcessCartAction(itemId, 'dec')) {
      return
    }

    setCartItems((previousItems) =>
      previousItems
        .map((item) =>
          item.id === itemId ? { ...item, qty: item.qty - 1 } : item,
        )
        .filter((item) => item.qty > 0),
    )
  }

  const removeItem = (itemId) => {
    setCartItems((previousItems) => previousItems.filter((item) => item.id !== itemId))
  }

  const totalItems = useMemo(
    () => cartItems.reduce((total, item) => total + item.qty, 0),
    [cartItems],
  )

  const totalPrice = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.qty, 0),
    [cartItems],
  )

  const cartQtyByItemId = useMemo(
    () => cartItems.reduce((map, item) => ({ ...map, [item.id]: item.qty }), {}),
    [cartItems],
  )

  const uniqueCategories = useMemo(() => {
    const values = menuItems
      .map((item) => String(item.category || '').trim())
      .filter(Boolean)

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [menuItems])

  const filteredMenuItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return menuItems.filter((item) => {
      const matchesSearch = !normalizedQuery
        || item.name.toLowerCase().includes(normalizedQuery)
        || String(item.category || '').toLowerCase().includes(normalizedQuery)

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

      const matchesAvailability = selectedAvailability === 'all'
        || (selectedAvailability === 'available' && item.isAvailable)
        || (selectedAvailability === 'unavailable' && !item.isAvailable)

      return matchesSearch && matchesCategory && matchesAvailability
    })
  }, [menuItems, searchQuery, selectedCategory, selectedAvailability])

  const isSearchDebouncing = searchInput !== searchQuery

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setOrderError('Add at least one item before placing an order.')
      setLastPlacedOrder(null)
      return
    }

    const parsedTable = Number(table)

    if (!restaurantId?.trim() || !Number.isFinite(parsedTable) || parsedTable < 1) {
      setOrderError('Invalid restaurant or table details in URL.')
      setLastPlacedOrder(null)
      return
    }

    const payload = {
      restaurantId,
      table: parsedTable,
      items: cartItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 1,
      })),
      total: totalPrice,
    }

    setIsPlacingOrder(true)
    setOrderError('')
    setLastPlacedOrder(null)

    try {
      const response = await fetch(`${BASE_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to place order')
      }

      const confirmationId = result?.data?.orderId || result?.data?._id || ''
      setLastPlacedOrder({
        orderId: confirmationId,
        total: totalPrice,
      })
      setCartItems([])
      setActiveTab('menu')
      console.log('[ORDER] Created:', result.data)
    } catch (error) {
      console.error('[ORDER] Failed to place order:', error)
      setOrderError(error.message || 'Unable to place order right now.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handleTrackOrder = () => {
    if (!lastPlacedOrder?.orderId) {
      return
    }

    const nextParams = new URLSearchParams(window.location.search)
    nextParams.set('orderId', lastPlacedOrder.orderId)
    const nextUrl = `${window.location.pathname}?${nextParams.toString()}${window.location.hash}`
    window.history.pushState({}, '', nextUrl)
    window.location.reload()
  }

  const handleTouchStart = (event) => {
    touchStartRef.current = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    }
  }

  const handleTouchEnd = (event) => {
    const touchEndX = event.changedTouches[0].clientX
    const touchEndY = event.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartRef.current.x
    const deltaY = touchEndY - touchStartRef.current.y

    // Switch tabs only for clear horizontal swipes to avoid fighting vertical scroll.
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return
    }

    if (deltaX < 0) {
      setActiveTab('orders')
      return
    }

    setActiveTab('menu')
  }

  if (orderId?.trim()) {
    return <OrderStatusPage orderId={orderId} baseUrl={BASE_URL} />
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slateDeep text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(249,115,22,0.2),transparent_35%),radial-gradient(circle_at_90%_15%,rgba(56,189,248,0.14),transparent_40%),linear-gradient(120deg,rgba(15,23,42,0.85),rgba(15,23,42,0.55))]" />
      <div className="grain-overlay pointer-events-none absolute inset-0" />

      <main className="relative mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 md:pb-72 md:pt-10 lg:px-8">
        <header className="sticky top-2 z-30 mb-7 overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:top-3 sm:p-6 md:mb-8 md:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-brand-500/20 blur-3xl" />
          <p className="mb-3 inline-flex rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-100 sm:text-xs">
            Live Table Ordering
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
            {restaurantId ? `Restaurant ${restaurantId}` : 'Restaurant Menu'}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="rounded-xl border border-slate-600/80 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 sm:text-base">
              Table <span className="font-extrabold text-white">{table ?? 'N/A'}</span>
            </p>
            <p className="rounded-xl border border-slate-600/80 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 sm:text-base">
              Items in cart <span className="font-extrabold text-brand-400">{totalItems}</span>
            </p>
          </div>
        </header>

        <section
          className="touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {lastPlacedOrder && (
            <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-100 shadow-lg shadow-emerald-900/20">
              <p className="text-base font-bold">Order Placed Successfully 🎉</p>
              <p className="mt-1 text-sm text-emerald-200">
                Order ID: <span className="font-semibold">{lastPlacedOrder.orderId || 'N/A'}</span>
              </p>
              <p className="mt-0.5 text-sm text-emerald-200">
                Total Amount: <span className="font-semibold">Rs {lastPlacedOrder.total}</span>
              </p>
              {lastPlacedOrder.orderId && (
                <button
                  type="button"
                  onClick={handleTrackOrder}
                  className="mt-3 rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-100 transition-all hover:bg-emerald-500/30"
                >
                  Track Order
                </button>
              )}
            </div>
          )}

          {orderError && (
            <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {orderError}
            </div>
          )}

          <div
            className={`transition-all duration-300 ${
              activeTab === 'menu' ? 'opacity-100' : 'pointer-events-none hidden opacity-0 md:block'
            }`}
          >
            <div className="mb-5 flex items-end justify-between gap-3 md:mb-6">
              <h2 className="font-display text-2xl font-bold text-slate-100 sm:text-3xl">Chef Specials</h2>
              <p className="text-sm text-slate-400">{filteredMenuItems.length} items</p>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-700/80 bg-slate-900/75 p-3 backdrop-blur-md">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    🔎
                  </span>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search items or categories"
                    className="h-10 w-full rounded-lg border border-slate-600/80 bg-slate-800/80 pl-9 pr-9 text-sm text-slate-100 outline-none transition focus:border-brand-500"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('')
                        setSearchQuery('')
                      }}
                      className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md border border-slate-600/80 bg-slate-900/70 text-xs text-slate-300 transition hover:border-brand-500 hover:text-brand-300"
                    >
                      x
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setSelectedAvailability('all')
                  }}
                  className="h-10 rounded-lg border border-slate-600/80 bg-slate-800/80 px-3 text-xs font-bold uppercase tracking-wide text-slate-100 transition hover:border-brand-500 hover:text-brand-300"
                >
                  Reset Filters
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Availability</span>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedAvailability(option.value)}
                    className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all sm:text-[11px] ${
                      selectedAvailability === option.value
                        ? 'border-brand-500/70 bg-brand-500/20 text-brand-300'
                        : 'border-slate-600/80 bg-slate-900/55 text-slate-300 hover:border-brand-500/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                    selectedCategory === 'all'
                      ? 'border-brand-500/60 bg-brand-500/20 text-brand-300'
                      : 'border-slate-600/80 bg-slate-800/80 text-slate-300 hover:border-brand-500/40'
                  }`}
                >
                  All
                </button>
                {uniqueCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                      selectedCategory === category
                        ? 'border-brand-500/60 bg-brand-500/20 text-brand-300'
                        : 'border-slate-600/80 bg-slate-800/80 text-slate-300 hover:border-brand-500/40'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex min-h-5 items-center justify-between px-1 text-[11px] text-slate-400">
                <span>{isSearchDebouncing ? 'Searching...' : 'Search synced'}</span>
                <span className="hidden sm:inline">Share URL to keep current filters</span>
              </div>
            </div>

            {isLoadingMenu && (
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 text-sm text-slate-300">
                Loading menu...
              </div>
            )}

            {!isLoadingMenu && menuError && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-sm text-rose-200">
                {menuError}
              </div>
            )}

            {!isLoadingMenu && !menuError && menuItems.length === 0 && (
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 text-sm text-slate-300">
                No menu items available for this restaurant.
              </div>
            )}

            {!isLoadingMenu && !menuError && menuItems.length > 0 && filteredMenuItems.length === 0 && (
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 text-sm text-slate-300">
                No items match your current search or filters.
              </div>
            )}

            {!isLoadingMenu && !menuError && filteredMenuItems.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
                {filteredMenuItems.map((item) => (
                  <div key={item.id} data-menu-card>
                    <MenuItemCard
                      item={item}
                      cartQty={cartQtyByItemId[item.id] || 0}
                      onAddToCart={addToCart}
                      onDecreaseQty={decreaseQty}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'orders' && (
            <div className="animate-fade-in">
              <MobileOrdersPanel
                cartItems={cartItems}
                totalItems={totalItems}
                totalPrice={totalPrice}
                onAddToCart={addToCart}
                onDecreaseQty={decreaseQty}
                onRemoveItem={removeItem}
                onPlaceOrder={handlePlaceOrder}
                isPlacingOrder={isPlacingOrder}
              />
            </div>
          )}
        </section>
      </main>

      <div className="hidden md:block">
        <CartBar
          cartItems={cartItems}
          totalItems={totalItems}
          totalPrice={totalPrice}
          onAddToCart={addToCart}
          onDecreaseQty={decreaseQty}
          onRemoveItem={removeItem}
          onPlaceOrder={handlePlaceOrder}
          isPlacingOrder={isPlacingOrder}
        />
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalItems={totalItems}
      />
    </div>
  )
}

export default App
