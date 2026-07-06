import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import Product from "./pages/Product";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import StaticPage from "./pages/StaticPage";
import NotFound from "./pages/NotFound";
import { DEFAULT_LANGUAGE } from "./i18n";

const queryClient = new QueryClient();

const LangRoutes = () => (
  <LanguageProvider>
    <CartProvider>
      <Layout>
        <Routes>
          <Route index element={<Home />} />
          <Route path="shop" element={<Collection kind="all" />} />
          <Route path="kategori/:slug" element={<Collection kind="category" />} />
          <Route path="produkt/:slug" element={<Product />} />
          <Route path="soeg" element={<Search />} />
          <Route path="nyheder" element={<Collection kind="collection" slug="nyheder" />} />
          <Route path="populaert" element={<Collection kind="collection" slug="populaert" />} />
          <Route path="beauty" element={<Collection kind="collection" slug="beauty" />} />
          <Route path="livsstil" element={<Collection kind="collection" slug="livsstil" />} />
          <Route path="gaver" element={<Collection kind="collection" slug="gaver" />} />
          <Route path="saeson" element={<Collection kind="collection" slug="saeson" />} />
          <Route path="hjem" element={<Collection kind="collection" slug="hjem" />} />
          <Route path="personlig-pleje" element={<Collection kind="collection" slug="personlig-pleje" />} />
          <Route path="tilbud" element={<Collection kind="collection" slug="tilbud" />} />
          <Route path="kurv" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="tak" element={<OrderConfirmation />} />
          <Route path="om-zebiza" element={<StaticPage page="about" />} />
          <Route path="levering-og-returnering" element={<StaticPage page="delivery" />} />
          <Route path="handelsbetingelser" element={<StaticPage page="terms" />} />
          <Route path="privatlivspolitik" element={<StaticPage page="privacy" />} />
          <Route path="cookiepolitik" element={<StaticPage page="cookies" />} />
          <Route path="kontakt" element={<StaticPage page="contact" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </CartProvider>
  </LanguageProvider>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Navigate to={`/${DEFAULT_LANGUAGE}`} replace />} />
            <Route path="/:lang/*" element={<LangRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
