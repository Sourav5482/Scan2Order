import { useEffect, useMemo, useRef, useState } from 'react'
import CartBar from './components/CartBar'
import MobileOrdersPanel from './components/MobileOrdersPanel'
import MenuItemCard from './components/MenuItemCard'
import OrderStatusPage from './components/OrderStatusPage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://scan2orderbackend.onrender.com'
const POPULAR_ITEMS_STORAGE_PREFIX = 'scan2order-popular-items'
const ACTIVE_ORDER_STORAGE_PREFIX = 'scan2order-active-order'
const VALID_AVAILABILITY = new Set(['all', 'available', 'unavailable'])
const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Out of Stock' },
]

const getPopularItemsStorageKey = (restaurantId) => `${POPULAR_ITEMS_STORAGE_PREFIX}:${restaurantId}`
const getActiveOrderStorageKey = (restaurantId, table) => `${ACTIVE_ORDER_STORAGE_PREFIX}:${restaurantId}:${table}`

const isOrderCompleted = (orderDetails) => {
  const completedValue = orderDetails?.completed

  if (completedValue === true || completedValue === 1) {
    return true
  }

  if (typeof completedValue === 'string') {
    const normalizedCompleted = completedValue.trim().toLowerCase()
    return normalizedCompleted === 'true' || normalizedCompleted === '1' || normalizedCompleted === 'yes'
  }

  return false
}

const readPopularItemCounts = (restaurantId) => {
  if (!restaurantId || typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(getPopularItemsStorageKey(restaurantId))

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writePopularItemCounts = (restaurantId, counts) => {
  if (!restaurantId || typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(getPopularItemsStorageKey(restaurantId), JSON.stringify(counts))
  } catch {
    // Ignore storage failures and continue with runtime state.
  }
}

const readActiveOrder = (restaurantId, table) => {
  if (!restaurantId?.trim() || !table || typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getActiveOrderStorageKey(restaurantId, table))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object' || !String(parsed.orderId || '').trim()) {
      return null
    }

    return {
      orderId: String(parsed.orderId).trim(),
      total: Number(parsed.total) || 0,
      restaurantId: String(parsed.restaurantId || restaurantId),
      table: String(parsed.table || table),
    }
  } catch {
    return null
  }
}

const writeActiveOrder = (order) => {
  if (!order?.restaurantId || !order?.table || !order?.orderId || typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      getActiveOrderStorageKey(order.restaurantId, order.table),
      JSON.stringify(order),
    )
  } catch {
    // Ignore storage failures and continue with runtime state.
  }
}

const clearActiveOrder = (restaurantId, table) => {
  if (!restaurantId?.trim() || !table || typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(getActiveOrderStorageKey(restaurantId, table))
  } catch {
    // Ignore storage failures and continue with runtime state.
  }
}

function App() {
  const currentParams = new URLSearchParams(window.location.search)
  const restaurantId = (currentParams.get('restaurant') || '').trim()
  const table = (currentParams.get('table') || '').trim()
  const orderId = (currentParams.get('orderId') || '').trim()
  const initialSearchQuery = currentParams.get('q') || ''
  const initialCategory = currentParams.get('category') || 'all'
  const initialAvailability = currentParams.get('availability') || 'all'

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
  const [orderSyncMeta, setOrderSyncMeta] = useState(null)
  const featuredScrollRef = useRef(null)

  const shouldProcessCartAction = (itemId, actionType, delay = 180) => {
    const actionKey = `${actionType}-${itemId}`
    const now = Date.now()
    const cache = shouldProcessCartAction.cache || {}
    const lastActionAt = cache[actionKey] || 0

    if (now - lastActionAt < delay) {
      return false
    }

    cache[actionKey] = now
    shouldProcessCartAction.cache = cache
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
    if (orderId?.trim()) {
      return
    }

    const storedOrder = readActiveOrder(restaurantId, table)

    if (storedOrder) {
      setLastPlacedOrder(storedOrder)
    }
  }, [restaurantId, table, orderId])

  useEffect(() => {
    setCartItems([])
    setOrderError('')
    setOrderSyncMeta(null)
  }, [restaurantId, table])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 240)

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

  const popularInsights = (() => {
    const popularCounts = readPopularItemCounts(restaurantId)
    const rankedItems = Object.entries(popularCounts)
      .map(([itemId, count]) => {
        const menuItem = menuItems.find((item) => String(item.id) === String(itemId))

        if (!menuItem) {
          return null
        }

        return {
          item: menuItem,
          count: Number(count) || 0,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count)

    if (rankedItems.length > 0) {
      const topRanked = rankedItems.slice(0, 5)

      return {
        topItems: topRanked.map((entry) => entry.item),
        countById: Object.fromEntries(topRanked.map((entry) => [String(entry.item.id), entry.count])),
      }
    }

    return {
      topItems: menuItems.slice(0, 5),
      countById: {},
    }
  })()

  const heroDish = popularInsights.topItems[0] || menuItems[0] || null

  useEffect(() => {
    const scrollNode = featuredScrollRef.current

    if (!scrollNode || popularInsights.topItems.length <= 1) {
      return
    }

    const intervalId = window.setInterval(() => {
      const reachedEnd = scrollNode.scrollLeft + scrollNode.clientWidth >= scrollNode.scrollWidth - 8

      if (reachedEnd) {
        scrollNode.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }

      scrollNode.scrollBy({ left: 228, behavior: 'smooth' })
    }, 2300)

    return () => window.clearInterval(intervalId)
  }, [popularInsights.topItems.length])

  const isSearchDebouncing = searchInput !== searchQuery

  useEffect(() => {
    if (orderId?.trim() || !restaurantId?.trim() || !table || !lastPlacedOrder?.orderId) {
      return
    }

    let isDisposed = false

    const syncOrderCompletion = async () => {
      try {
        const response = await fetch(`${BASE_URL}/order/details/${lastPlacedOrder.orderId}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            Pragma: 'no-cache',
            'Cache-Control': 'no-cache',
          },
        })
        const result = await response.json()

        if (!response.ok || result.success === false || !result.data) {
          if (!isDisposed) {
            setOrderSyncMeta({
              source: 'poll',
              ok: false,
              message: result?.message || `HTTP ${response.status}`,
            })
          }
          return
        }

        if (!isDisposed) {
          setOrderSyncMeta({
            source: 'poll',
            ok: true,
            status: result.data.status,
            completed: result.data.completed,
          })
        }

        if (isOrderCompleted(result.data)) {
          if (!isDisposed) {
            setLastPlacedOrder(null)
            setOrderSyncMeta({
              source: 'poll',
              ok: true,
              status: result.data.status,
              completed: result.data.completed,
              message: 'Order completed, clearing success banner.',
            })
          }

          clearActiveOrder(
            lastPlacedOrder.restaurantId || restaurantId,
            lastPlacedOrder.table || table,
          )
          return
        }

        if (!isDisposed) {
          setLastPlacedOrder((previous) => {
            if (!previous) {
              return previous
            }

            return {
              ...previous,
              total: Number(result.data.total) || previous.total,
            }
          })
        }
      } catch (pollError) {
        if (!isDisposed) {
          setOrderSyncMeta({
            source: 'poll',
            ok: false,
            message: pollError?.message || 'Poll failed',
          })
        }
        // Keep banner visible when polling fails.
      }
    }

    syncOrderCompletion()
    const pollTimer = window.setInterval(syncOrderCompletion, 5000)

    return () => {
      isDisposed = true
      window.clearInterval(pollTimer)
    }
  }, [orderId, restaurantId, table, lastPlacedOrder?.orderId, lastPlacedOrder?.restaurantId, lastPlacedOrder?.table])

  const recordOrderedItems = (orderedItems) => {
    if (!restaurantId?.trim() || !Array.isArray(orderedItems) || orderedItems.length === 0) {
      return
    }

    const popularCounts = readPopularItemCounts(restaurantId)

    orderedItems.forEach((item) => {
      const itemId = String(item?.id || '').trim()
      const qty = Number(item?.qty || 0)

      if (!itemId || !Number.isFinite(qty) || qty <= 0) {
        return
      }

      popularCounts[itemId] = (Number(popularCounts[itemId]) || 0) + qty
    })

    writePopularItemCounts(restaurantId, popularCounts)
  }

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
      const persistedOrder = {
        orderId: confirmationId,
        total: Number(result?.data?.total) || totalPrice,
        restaurantId,
        table: String(table),
      }

      setLastPlacedOrder(persistedOrder)
      setOrderSyncMeta({
        source: 'place-order',
        ok: true,
        status: result?.data?.status,
        completed: result?.data?.completed,
      })
      writeActiveOrder(persistedOrder)
      recordOrderedItems(cartItems)
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

  if (orderId?.trim()) {
    return <OrderStatusPage orderId={orderId} baseUrl={BASE_URL} />
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#282C3F]">
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-3 sm:px-6 md:pb-40">
        <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200/90 bg-white/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#686B78]">Restaurant</p>
              <h1 className="font-display text-lg font-bold text-[#282C3F] sm:text-xl">
                {restaurantId?.trim() || 'Restaurant'}
              </h1>
            </div>
            <div className="rounded-full border border-slate-200 bg-[#F8F8F8] px-3 py-1 text-[11px] font-semibold text-[#282C3F]">
              Table {table ?? 'N/A'}
            </div>
          </div>
        </header>

        <section className="mt-3 space-y-3.5">
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-3.5 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-[#686B78]">Welcome</p>
            <h2 className="mt-1 font-display text-[22px] font-bold leading-tight text-[#282C3F]">Order from your table in seconds</h2>
            {heroDish && (
              <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5">
                <img
                  src={heroDish.image}
                  alt={heroDish.name}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#686B78]">Popular right now</p>
                  <p className="text-[13px] font-bold text-[#282C3F]">{heroDish.name}</p>
                  <p className="text-[12px] font-semibold text-[#FC8019]">Rs {heroDish.price}</p>
                </div>
              </div>
            )}
          </div>

          <div className="sticky top-[70px] z-20 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-soft backdrop-blur">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search menu"
                className="h-10 w-full rounded-xl border border-slate-200 bg-[#F8F8F8] px-3.5 pr-10 text-[13px] text-[#282C3F] outline-none transition focus:border-[#FC8019]"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    setSearchQuery('')
                  }}
                  className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg border border-slate-200 bg-white text-[11px] text-[#686B78]"
                >
                  x
                </button>
              ) : null}
            </div>

            <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                  selectedCategory === 'all'
                    ? 'border-[#FC8019] bg-[#FC8019] text-white'
                    : 'border-slate-200 bg-white text-[#686B78]'
                }`}
              >
                All
              </button>
              {uniqueCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                    selectedCategory === category
                      ? 'border-[#FC8019] bg-[#FC8019] text-white'
                      : 'border-slate-200 bg-white text-[#686B78]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {AVAILABILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedAvailability(option.value)}
                  className={`rounded-md border px-2.5 py-1 text-[10px] font-medium transition ${
                    selectedAvailability === option.value
                      ? 'border-[#FC8019] bg-brand-50 text-[#FC8019]'
                      : 'border-slate-200 bg-white text-[#686B78]'
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSelectedAvailability('all')
                }}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-[#686B78]"
              >
                Reset
              </button>

              <span className="ml-auto text-[10px] text-[#686B78]">{isSearchDebouncing ? 'Searching...' : 'Synced'}</span>
            </div>
          </div>

          {lastPlacedOrder && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <p className="text-base font-bold">Order Placed Successfully 🎉</p>
              <p className="mt-1 text-sm">Order ID: <span className="font-semibold">{lastPlacedOrder.orderId || 'N/A'}</span></p>
              <p className="mt-0.5 text-sm">Total: <span className="font-semibold">Rs {lastPlacedOrder.total}</span></p>
              <p className="mt-1.5 text-[11px] text-emerald-700/85">
                Live check: completed={String(orderSyncMeta?.completed)} status={String(orderSyncMeta?.status || 'N/A')}
              </p>
              {!orderSyncMeta?.ok && orderSyncMeta?.message ? (
                <p className="mt-1 text-[11px] text-rose-700">Sync issue: {orderSyncMeta.message}</p>
              ) : null}
              {lastPlacedOrder.orderId && (
                <button
                  type="button"
                  onClick={handleTrackOrder}
                  className="mt-3 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700"
                >
                  Track Order
                </button>
              )}
            </div>
          )}

          {orderError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {orderError}
            </div>
          )}

          {popularInsights.topItems.length > 0 && activeTab === 'menu' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#282C3F]">Popular this week</h3>
                <span className="text-[11px] font-medium text-[#686B78]">Auto scroll</span>
              </div>

              <div
                ref={featuredScrollRef}
                className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1"
              >
                {popularInsights.topItems.map((item, index) => {
                  const orderedCount = popularInsights.countById[String(item.id)]

                  return (
                    <article
                      key={`featured-${item.id}`}
                      className="w-48 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
                    >
                      <div className="relative h-24">
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-[#FC8019] px-2 py-0.5 text-[10px] font-semibold text-white">#{index + 1}</span>
                      </div>
                      <div className="space-y-1 p-2.5">
                        <p className="truncate text-[13px] font-bold text-[#282C3F]">{item.name}</p>
                        <p className="text-[12px] font-semibold text-[#FC8019]">Rs {item.price}</p>
                        <p className="text-[11px] text-[#686B78]">{orderedCount ? `${orderedCount} ordered` : 'Recommended'}</p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <section className="space-y-2.5">
              <div className="flex items-end justify-between">
                <h3 className="font-display text-[22px] font-bold text-[#282C3F]">Menu</h3>
                <p className="text-xs text-[#686B78]">{filteredMenuItems.length} items</p>
              </div>

              {isLoadingMenu && (
                <div className="rounded-2xl border border-slate-200 bg-[#F8F8F8] p-5 text-sm text-[#686B78]">
                  Loading menu...
                </div>
              )}

              {!isLoadingMenu && menuError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                  {menuError}
                </div>
              )}

              {!isLoadingMenu && !menuError && menuItems.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-[#F8F8F8] p-5 text-sm text-[#686B78]">
                  No menu items available for this restaurant.
                </div>
              )}

              {!isLoadingMenu && !menuError && menuItems.length > 0 && filteredMenuItems.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-[#F8F8F8] p-5 text-sm text-[#686B78]">
                  No items match your current search or filters.
                </div>
              )}

              {!isLoadingMenu && !menuError && filteredMenuItems.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMenuItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      cartQty={cartQtyByItemId[item.id] || 0}
                      onAddToCart={addToCart}
                      onDecreaseQty={decreaseQty}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

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
                onBackToMenu={() => setActiveTab('menu')}
              />
            </div>
          )}
        </section>
      </main>

      <CartBar
        totalItems={totalItems}
        totalPrice={totalPrice}
        onViewCart={() => setActiveTab('orders')}
        onPlaceOrder={handlePlaceOrder}
        isPlacingOrder={isPlacingOrder}
      />
    </div>
  )
}

export default App
