import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StoreLayout } from '@/features/storefront/layout/StoreLayout';
import { HomePage } from '@/features/storefront/pages/HomePage';
import { CatalogPage } from '@/features/storefront/pages/CatalogPage';
import { ProductPage } from '@/features/storefront/pages/ProductPage';
import { TrackOrderPage } from '@/features/storefront/pages/TrackOrderPage';
import { NotFoundPage } from '@/features/storefront/pages/NotFoundPage';
import { CartPage } from '@/features/cart/CartPage';
import { CheckoutPage } from '@/features/checkout/CheckoutPage';
import { OrderConfirmationPage } from '@/features/checkout/OrderConfirmationPage';
import { ProtectedRoute } from './ProtectedRoute';
import { Skeleton } from '@/shared/components/ui/Skeleton';

const AdminLoginPage = lazy(() =>
  import('@/features/admin/auth/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
);
const AdminLayout = lazy(() =>
  import('@/features/admin/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const OverviewPage = lazy(() =>
  import('@/features/admin/pages/OverviewPage').then((m) => ({ default: m.OverviewPage })),
);
const ProductsPage = lazy(() =>
  import('@/features/admin/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const ProductFormPage = lazy(() =>
  import('@/features/admin/pages/ProductFormPage').then((m) => ({ default: m.ProductFormPage })),
);
const DiscountsPage = lazy(() =>
  import('@/features/admin/pages/DiscountsPage').then((m) => ({ default: m.DiscountsPage })),
);
const ShippingPage = lazy(() =>
  import('@/features/admin/pages/ShippingPage').then((m) => ({ default: m.ShippingPage })),
);
const OrdersPage = lazy(() =>
  import('@/features/admin/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })),
);
const SettingsPage = lazy(() =>
  import('@/features/admin/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

function LazyFallback() {
  return (
    <div className="min-h-screen bg-[#C5BFA8] p-6">
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/shop', element: <CatalogPage /> },
      { path: '/product/:slug', element: <ProductPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/order/:ref', element: <OrderConfirmationPage /> },
      { path: '/track', element: <TrackOrderPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin/login',
    element: (
      <Suspense fallback={<LazyFallback />}>
        <AdminLoginPage />
      </Suspense>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LazyFallback />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: <ProductFormPage /> },
      { path: 'products/:id', element: <ProductFormPage /> },
      { path: 'discounts', element: <DiscountsPage /> },
      { path: 'shipping', element: <ShippingPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
