import { useState, useEffect, useCallback } from 'react'

// Small data-fetching hook: pass an axios-returning function and its deps.
// Keeps pages free of repeated loading/error boilerplate.
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(() => {
    setIsLoading(true)
    setError(null)
    fetchFn()
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, error, isLoading, refetch }
}