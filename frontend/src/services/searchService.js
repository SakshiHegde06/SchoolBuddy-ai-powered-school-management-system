import api from './api'

export const searchService = {
  search: (query, category = 'All') =>
    api.get('/search', { params: { query, category } }),
}

export default searchService
