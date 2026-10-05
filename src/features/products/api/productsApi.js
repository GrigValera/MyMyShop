import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const PRODUCT_FIELDS = 'id,title,price,description,category,images,thumbnail,rating,brand,stock';
const PAGE_SIZE = 10;

export const buildProductsQuery = ({ searchQuery = '', category = '' } = {}, pageParam = 0) => {
  const search = searchQuery.trim();
  const path = search
    ? 'products/search'
    : category ? `products/category/${encodeURIComponent(category)}` : 'products';
  const params = new URLSearchParams({
    ...(search ? { q: search } : {}),
    limit: String(PAGE_SIZE),
    skip: String(pageParam * PAGE_SIZE),
    select: PRODUCT_FIELDS,
  });
  return `${path}?${params}`;
};

const infiniteQueryOptions = {
  initialPageParam: 0,
  getNextPageParam: (lastPage, _allPages, lastPageParam) => {
    if (!lastPage || lastPage.skip + lastPage.limit >= lastPage.total) return undefined;
    return lastPageParam + 1;
  },
};

const normalizePage = (response) => ({
  products: response.products || [],
  total: response.total ?? 0,
  limit: response.limit ?? PAGE_SIZE,
  skip: response.skip ?? 0,
});

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://dummyjson.com/' }),
  endpoints: (builder) => ({
    getProductsInfinite: builder.infiniteQuery({
      query: ({ pageParam }) => buildProductsQuery({}, pageParam),
      infiniteQueryOptions,
      transformResponse: normalizePage,
    }),
    searchProducts: builder.infiniteQuery({
      query: ({ queryArg, pageParam }) => buildProductsQuery(queryArg, pageParam),
      infiniteQueryOptions,
      transformResponse: normalizePage,
    }),
    getProductById: builder.query({
      query: (id) => `products/${id}?select=id,title,price,description,category,images,thumbnail,rating,brand,stock,reviews`,
    }),
    getCategories: builder.query({
      query: () => 'products/categories',
    }),
    getProductsByCategory: builder.infiniteQuery({
      query: ({ queryArg, pageParam }) => buildProductsQuery({ category: queryArg }, pageParam),
      infiniteQueryOptions,
      transformResponse: normalizePage,
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
