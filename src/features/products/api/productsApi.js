import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://dummyjson.com/' }),
  endpoints: (builder) => ({
    getProductsInfinite: builder.infiniteQuery({
      query: ({ pageParam = 0 }) => {
        const skip = pageParam * 10;
        return `products?limit=10&skip=${skip}&select=id,title,price,description,category,images,thumbnail,rating,brand,stock`;
      },
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          const { total, limit, skip } = lastPage;
          const hasMore = skip + limit < total;
          if (!hasMore) return undefined;
          return lastPageParam + 1;
        },
      },
      transformResponse: (response) => {
        return {
          products: response.products || [],
          total: response.total || 0,
          limit: response.limit || 10,
          skip: response.skip || 0,
        };
      },
      merge: (currentCache, newItems, { pageParam }) => {
        if (!currentCache || pageParam === 0) {
          return {
            products: newItems.products || [],
            total: newItems.total || 0,
            limit: newItems.limit || 10,
            skip: newItems.skip || 0,
          };
        }
        return {
          ...newItems,
          products: [...(currentCache.products || []), ...(newItems.products || [])],
        };
      },
    }),
    searchProducts: builder.infiniteQuery({
      query: ({ pageParam = 0, searchQuery = '' }) => {
        const skip = pageParam * 10;
        if (searchQuery) {
          return `products/search?q=${searchQuery}&limit=10&skip=${skip}&select=id,title,price,description,category,images,thumbnail,rating,brand,stock`;
        }
        return `products?limit=10&skip=${skip}&select=id,title,price,description,category,images,thumbnail,rating,brand,stock`;
      },
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          if (!lastPage || !lastPage.products) return undefined;
          const { total, limit, skip } = lastPage;
          const hasMore = skip + limit < total;
          if (!hasMore) return undefined;
          return lastPageParam + 1;
        },
      },
      transformResponse: (response) => {
        return {
          products: response.products || [],
          total: response.total || 0,
          limit: response.limit || 10,
          skip: response.skip || 0,
        };
      },
      merge: (currentCache, newItems, { pageParam }) => {
        if (!currentCache || pageParam === 0) {
          return {
            products: newItems.products || [],
            total: newItems.total || 0,
            limit: newItems.limit || 10,
            skip: newItems.skip || 0,
          };
        }
        return {
          ...newItems,
          products: [...(currentCache.products || []), ...(newItems.products || [])],
        };
      },
    }),
    getProductById: builder.query({
      query: (id) => `products/${id}?select=id,title,price,description,category,images,thumbnail,rating,brand,stock,reviews`,
    }),
    getCategories: builder.query({
      query: () => 'products/categories',
    }),
    getProductsByCategory: builder.infiniteQuery({
      query: ({ pageParam = 0, category = '' }) => {
        const skip = pageParam * 10;
        return `products/category/${category}?limit=10&skip=${skip}&select=id,title,price,description,category,images,thumbnail,rating,brand,stock`;
      },
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          if (!lastPage || !lastPage.products) return undefined;
          const { total, limit, skip } = lastPage;
          const hasMore = skip + limit < total;
          if (!hasMore) return undefined;
          return lastPageParam + 1;
        },
      },
      transformResponse: (response) => {
        return {
          products: response.products || [],
          total: response.total || 0,
          limit: response.limit || 10,
          skip: response.skip || 0,
        };
      },
      merge: (currentCache, newItems, { pageParam }) => {
        if (!currentCache || pageParam === 0) {
          return {
            products: newItems.products || [],
            total: newItems.total || 0,
            limit: newItems.limit || 10,
            skip: newItems.skip || 0,
          };
        }
        return {
          ...newItems,
          products: [...(currentCache.products || []), ...(newItems.products || [])],
        };
      },
    }),
  }),
});

export const {
  useGetProductsInfiniteInfiniteQuery,
  useSearchProductsInfiniteQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useGetProductsByCategoryInfiniteQuery,
} = productsApi;