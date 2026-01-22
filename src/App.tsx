import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import ForStreamers from "./pages/ForStreamers";
import ForBrands from "./pages/ForBrands";
import HowItWorks from "./pages/HowItWorks";
import Platform from "./pages/Platform";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import VIP from "./pages/VIP";
import Sales from "./pages/Sales";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/streamers" element={<ForStreamers />} />
            <Route path="/empresas" element={<ForBrands />} />
            <Route path="/como-funciona" element={<HowItWorks />} />
            <Route path="/plataforma" element={<Platform />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/vip" element={<VIP />} />
            <Route path="/vendas" element={<Sales />} />
            <Route path="/checkout" element={<Checkout />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
