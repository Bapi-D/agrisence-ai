import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Leaf,
  Minus,
  Plus,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/agri/GlassCard";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/hooks/useFarm";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({
    meta: [
      { title: "Agri Store — AgriSense AI" },
      {
        name: "description",
        content: "AI-guided crop care products for AgriSense AI farmers.",
      },
    ],
  }),
  component: AgriStorePage,
});

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  badge?: string;
  icon: string;
};

const PRODUCTS: Product[] = [
  {
    id: "bio-pest-guard",
    name: "Bio Pest Guard",
    category: "Pest Care",
    description: "A plant-care option for managing common pest pressure as part of a healthy crop routine.",
    price: 249,
    badge: "AI Recommended",
    icon: "🐛",
  },
  {
    id: "fungal-care",
    name: "Fungal Care",
    category: "Disease Care",
    description: "Crop-care support for farms dealing with common fungal disease pressure.",
    price: 299,
    badge: "AI Recommended",
    icon: "🌿",
  },
  {
    id: "plant-recovery",
    name: "Plant Recovery Kit",
    category: "Plant Health",
    description: "A general crop-care kit designed to support recovery and healthy plant growth.",
    price: 349,
    icon: "🌱",
  },
  {
    id: "soil-care",
    name: "Soil Care Pack",
    category: "Soil Care",
    description: "A simple soil-care pack for maintaining a healthy growing environment.",
    price: 399,
    icon: "🪴",
  },
];

function AgriStorePage() {
  const { activeFarm } = useFarm();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const cartItems = useMemo(
    () =>
      PRODUCTS.filter((product) => cart[product.id]).map((product) => ({
        product,
        quantity: cart[product.id] ?? 0,
      })),
    [cart],
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  function addToCart(product: Product) {
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] ?? 0) + 1,
    }));
    toast.success(`${product.name} added to your cart.`);
  }

  function changeQuantity(id: string, delta: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + delta);
      const updated = { ...current };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GlassCard className="animate-rise overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground">
              <ShoppingCart className="h-7 w-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">Agri Store</h1>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  AI Guided
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Get crop-care products selected around the problems your AgriSense AI tools identify on your farm.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Cart {cartCount > 0 ? `(${cartCount})` : ""}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="animate-rise border-primary/20 bg-primary/[0.04]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold">AI Crop-Care Recommendations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeFarm
                ? `Recommendations are shown for ${activeFarm.name}. Connect your disease, pest and crop-health results to make these suggestions farm-specific.`
                : "Recommendations can be connected to your disease, pest and crop-health results to make them farm-specific."}
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Farmer-first guidance
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((product) => (
          <GlassCard key={product.id} hover className="animate-rise flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-secondary text-2xl">
                {product.icon}
              </span>
              {product.badge && (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {product.badge}
                </span>
              )}
            </div>

            <p className="mt-4 text-xs font-medium text-primary">{product.category}</p>
            <h2 className="mt-1 font-semibold">{product.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>

            <div className="mt-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Starting from</p>
                <p className="text-xl font-semibold">₹{product.price}</p>
              </div>
              <Button size="sm" onClick={() => addToCart(product)}>
                Buy Now
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="animate-rise">
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoItem icon={<Sprout className="h-4 w-4" />} title="Crop focused" text="Products are organized around crop health and common farm problems." />
          <InfoItem icon={<Sparkles className="h-4 w-4" />} title="AI guided" text="Connect recommendations to your disease and pest detection results." />
          <InfoItem icon={<ShieldCheck className="h-4 w-4" />} title="Use responsibly" text="Always follow the product label and local agricultural guidance before use." />
        </div>
      </GlassCard>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-background p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <p className="text-sm text-muted-foreground">Review your selected crop-care products.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="rounded-[var(--radius-md)] bg-secondary/50 px-4 py-8 text-center text-sm text-muted-foreground">
                  Your cart is empty. Add a recommended product to continue.
                </div>
              ) : (
                cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border p-3">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-lg">{product.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">₹{product.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeQuantity(product.id, -1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-5 text-center text-sm">{quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeQuantity(product.id, 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Estimated total</p>
                <p className="text-xl font-semibold">₹{total}</p>
              </div>
              <Button
                disabled={cartItems.length === 0}
                onClick={() => {
                  toast.success("Checkout flow is ready for payment and delivery integration.");
                  setCartOpen(false);
                }}
              >
                Continue to checkout
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-secondary/45 p-4">
      <div className="flex items-center gap-2 font-medium">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
