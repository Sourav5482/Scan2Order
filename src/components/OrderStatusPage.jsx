import { useCallback, useEffect, useState } from 'react'

function OrderStatusPage({ orderId, baseUrl }) {
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const getStatusClasses = (status) => {
    const normalizedStatus = String(status || '').toLowerCase()

    if (normalizedStatus === 'pending') {
      return 'border-yellow-400/50 bg-yellow-400/15 text-yellow-200'
    }

    if (normalizedStatus === 'cooking') {
      return 'border-sky-400/50 bg-sky-400/15 text-sky-200'
    }

    if (normalizedStatus === 'done') {
      return 'border-emerald-400/50 bg-emerald-400/15 text-emerald-200'
    }

    return 'border-slate-500/50 bg-slate-500/10 text-slate-200'
  }

  const getStatusStep = (status) => {
    const normalizedStatus = String(status || '').toLowerCase()

    if (normalizedStatus === 'pending') {
      return 1
    }

    if (normalizedStatus === 'cooking') {
      return 2
    }

    if (normalizedStatus === 'done') {
      return 3
    }

    return 1
  }

  const fetchOrderDetails = useCallback(
    async (showLoader = false) => {
      if (!orderId?.trim()) {
        setError('Missing orderId in URL. Use ?orderId=ORD-1001')
        setIsLoading(false)
        return
      }

      if (showLoader) {
        setIsLoading(true)
      }

      try {
        const response = await fetch(`${baseUrl}/order/details/${orderId}`)
        const result = await response.json()

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'Failed to fetch order details')
        }

        setOrder(result.data)
        setError('')
      } catch (fetchError) {
        console.error('[ORDER STATUS] Failed to fetch order details:', fetchError)
        setError(fetchError.message || 'Unable to fetch order details')
      } finally {
        if (showLoader) {
          setIsLoading(false)
        }
      }
    },
    [baseUrl, orderId],
  )

  useEffect(() => {
    fetchOrderDetails(true)

    const pollTimer = setInterval(() => {
      fetchOrderDetails(false)
    }, 5000)

    return () => clearInterval(pollTimer)
  }, [fetchOrderDetails])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slateDeep px-4 py-8 text-slate-100 sm:px-6 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_90%_15%,rgba(16,185,129,0.16),transparent_40%)]" />

      <main className="relative mx-auto max-w-xl">
        <section className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
          <p className="mb-2 inline-flex rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-100 sm:text-xs">
            Live Order Tracker
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-100 sm:text-3xl">Order Status</h1>

          {isLoading && (
            <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-800/70 p-4 text-sm text-slate-300">
              Loading order details...
            </div>
          )}

          {!isLoading && error && (
            <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {!isLoading && !error && order && (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Order Progress</p>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-sky-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${(getStatusStep(order.status) / 3) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
                  <span>Pending</span>
                  <span>Cooking</span>
                  <span>Done</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Order ID</p>
                <p className="mt-1 text-lg font-bold text-brand-300">{order.orderId}</p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Current Status</p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClasses(order.status)}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4">
                <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Items</p>
                <ul className="space-y-2">
                  {order.items.map((item, index) => (
                    <li
                      key={`${item.menuItemId || item.name}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-slate-100">{item.name}</p>
                      <p className="text-xs font-semibold text-slate-300">x{item.qty}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
                <p className="mt-1 text-xl font-extrabold text-brand-400">Rs {order.total}</p>
              </div>

              <p className="text-center text-xs text-slate-500">Auto-refreshing every 5 seconds</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default OrderStatusPage
