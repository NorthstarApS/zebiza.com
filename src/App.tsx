import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
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
import Brands from "./pages/Brands";
import Brand from "./pages/Brand";
import NotFound from "./pages/NotFound";
import LegacyRedirect from "./components/LegacyRedirect";
import { DEFAULT_LANGUAGE, isLanguage } from "./i18n";
import { resolveCategorySlug } from "./lib/urls";

const queryClient = new QueryClient();

function CategoryRedirect() {
  const { slug = "" } = useParams();
  const { lang } = useParams() as { lang?: string };
  const locale = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const canonical = resolveCategorySlug(slug);
  if (canonical !== slug) {
    return <Navigate to={`/${locale}/kategori/${canonical}`} replace />;
  }
  return <Collection kind="category" />;
}

const LangRoutes = () => (
  <LanguageProvider>
    <CartProvider>
      <Layout>
        <Routes>
          <Route index element={<Home />} />
          <Route path="shop" element={<Collection kind="all" />} />
          <Route path="kategori/:slug" element={<CategoryRedirect />} />
          <Route path="produkt/:slug" element={<Product />} />
          <Route path="brands" element={<Brands />} />
          <Route path="brand/:slug" element={<Brand />} />
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
          <Route path="kasse" element={<Navigate to="../checkout" replace relative="path" />} />
          <Route path="tak" element={<OrderConfirmation />} />
          <Route path="om-zebiza" element={<StaticPage page="about" />} />
          <Route path="levering-og-returnering" element={<StaticPage page="delivery" />} />
          <Route path="handelsbetingelser" element={<StaticPage page="terms" />} />
          <Route path="privatlivspolitik" element={<StaticPage page="privacy" />} />
          <Route path="cookiepolitik" element={<StaticPage page="cookies" />} />
          <Route path="kontakt" element={<StaticPage page="contact" />} />
          {/* Legacy Woo paths under locale */}
          <Route path="product/:slug" element={<LegacyRedirect />} />
          <Route path="product-category/*" element={<LegacyRedirect />} />
          <Route path="varemærke/:slug" element={<LegacyRedirect />} />
          <Route path="varemaerke/:slug" element={<LegacyRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </CartProvider>
  </LanguageProvider>
);

function RootLocaleRedirect() {
  return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
}

function MaybeLangOrLegacy() {
  const params = useParams();
  const lang = params.lang;
  if (isLanguage(lang)) return <LangRoutes />;
  // /product/... or /product-category/... without locale
  return <LegacyRedirect />;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<RootLocaleRedirect />} />
            <Route path="/product/*" element={<LegacyRedirect />} />
            <Route path="/product-category/*" element={<LegacyRedirect />} />
            <Route path="/produkt/*" element={<LegacyRedirect />} />
            <Route path="/:lang/*" element={<MaybeLangOrLegacy />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
