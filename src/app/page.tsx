
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price_pkr: number;
  stock: number;
  warranty: string;
};

type Question = {
  id: number;
  category: string;
  question: string;
};

type Suggestion = {
  id: number;
  question: string;
};

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

const productIcons: Record<string, string> = {
  Laptops: "💻",
  Smartphones: "📱",
  Audio: "🎧",
  Wearables: "⌚",
  Tablets: "📲",
  Accessories: "🔌",
};

const formatPrice = (price: number) =>
  `PKR ${price.toLocaleString("en-PK")}`;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      sender: "bot",
      text:
        "Hello! 👋 Welcome to NovaCart. I'm ShopWise, your rule-based shopping assistant. Ask about products, delivery, payments, returns, or warranties.",
    },
  ]);

  const nextMessageId = useRef(1);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch("/api/catalog", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Database connection failed.");
      }

      const data = await response.json();

      setProducts(data.products ?? []);
      setQuestions(data.questions ?? []);
    } catch {
      setLoadError(
        "Could not load the database. Check your Supabase settings and SQL tables."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (chatOpen) {
      messagesEnd.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [messages, suggestions, chatOpen]);

  function addMessage(sender: Message["sender"], text: string) {
    const id = nextMessageId.current++;
    setMessages((previous) => [...previous, { id, sender, text }]);
  }

  async function sendMessage(
    text?: string,
    ruleId?: number
  ) {
    if (sending) return;

    const message = (text ?? input).trim();
    if (!message && ruleId === undefined) return;

    setSending(true);
    setSuggestions([]);
    setLibraryOpen(false);
    setChatOpen(true);
    setInput("");

    addMessage("user", message);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          ...(ruleId !== undefined ? { ruleId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chat request failed.");
      }

      addMessage("bot", data.reply);
      setSuggestions(data.suggestions ?? []);
    } catch (error) {
      addMessage(
        "bot",
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setSending(false);
    }
  }

  const categories = [
    "All",
    ...new Set(questions.map((question) => question.category)),
  ];

  const filteredQuestions = questions.filter((question) => {
    const sameCategory =
      category === "All" || question.category === category;

    const matchesSearch = question.question
      .toLowerCase()
      .includes(search.toLowerCase());

    return sameCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
          <a
            href="#home"
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white">
              S
            </span>
            <span className="text-xl font-black">
              Shop<span className="text-indigo-600">Wise</span>
            </span>
          </a>

          <nav className="hidden gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#products" className="hover:text-indigo-600">
              Products
            </a>
            <a href="#features" className="hover:text-indigo-600">
              Features
            </a>
            <button
              onClick={() => setChatOpen(true)}
              className="hover:text-indigo-600"
            >
              Customer Support
            </button>
          </nav>

          <button
            onClick={() => setChatOpen(true)}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-600"
          >
            Ask ShopWise ↗
          </button>
        </div>
      </header>

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden"
      >
        <div className="pointer-events-none absolute -right-24 top-12 h-96 w-96 rounded-full bg-indigo-200/50 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-10 lg:grid-cols-2 lg:py-28">
          <div className="relative">
            <span className="inline-block rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-indigo-700">
              ✦ Smart shopping assistance
            </span>

            <h1 className="mt-8 text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Smarter
              <br />
              shopping.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                Clear answers.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-8 text-slate-600">
              Discover our electronics catalogue and get instant,
              rule-based support for product information, delivery,
              payments, returns, and warranties.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#products"
                className="rounded-2xl bg-indigo-600 px-7 py-4 font-bold text-white shadow-xl shadow-indigo-200 transition hover:-translate-y-1 hover:bg-indigo-700"
              >
                Explore Products →
              </a>

              <button
                onClick={() => setChatOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold hover:border-indigo-300"
              >
                Chat With ShopWise
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-5 text-sm font-semibold text-slate-500">
              <span>✓ Rule-based assistant</span>
              <span>✓ Live database</span>
              <span>✓ Instant replies</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl shadow-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
                    NovaCart Store
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    Shopping made simple
                  </h2>
                </div>
                <span className="rounded-2xl bg-indigo-50 p-4 text-3xl">
                  🛍️
                </span>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  { icon: "💻", label: "Laptops" },
                  { icon: "📱", label: "Smartphones" },
                  { icon: "🎧", label: "Audio" },
                  { icon: "⌚", label: "Wearables" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-slate-50 p-6 text-center"
                  >
                    <div className="text-4xl">{item.icon}</div>
                    <p className="mt-3 text-sm font-extrabold">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
                <p className="font-extrabold">
                  Questions about a product?
                </p>
                <p className="mt-2 text-sm text-indigo-100">
                  Ask ShopWise about prices, availability, and warranties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="bg-white py-20"
      >
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-indigo-600">
                Database-powered catalogue
              </p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">
                Explore our products
              </h2>
              <p className="mt-4 text-slate-500">
                Product information is retrieved from Supabase.
              </p>
            </div>

            <button
              onClick={() => void loadCatalog()}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:border-indigo-400"
            >
              ↻ Refresh catalogue
            </button>
          </div>

          {loading && (
            <p className="mt-12 text-slate-500">
              Loading products from Supabase...
            </p>
          )}

          {loadError && (
            <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              {loadError}
            </div>
          )}

          {!loading && !loadError && products.length === 0 && (
            <p className="mt-12 text-slate-500">
              No products found. Check your Supabase product table.
            </p>
          )}

          {!loading && !loadError && (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-52 items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-100">
                    <span className="text-8xl">
                      {productIcons[product.category] || "📦"}
                    </span>
                  </div>

                  <div className="p-7">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
                        {product.category}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          product.stock > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {product.stock > 0
                          ? "In Stock"
                          : "Out of Stock"}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black">
                      {product.name}
                    </h3>

                    <p className="mt-3 min-h-20 text-sm leading-7 text-slate-500">
                      {product.description}
                    </p>

                    <p className="mt-5 text-2xl font-black text-slate-900">
                      {formatPrice(product.price_pkr)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {product.warranty}
                    </p>

                    <button
                      onClick={() =>
                        void sendMessage(
                          `What is the price of ${product.name}?`
                        )
                      }
                      className="mt-7 w-full rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white hover:bg-indigo-700"
                    >
                      Ask About This Product →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="py-20"
      >
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-widest text-indigo-600">
              Customer support
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              How ShopWise helps customers
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "💬",
                title: "Dedicated Answers",
                text: "Every supported question has its own answer in the database.",
              },
              {
                icon: "🗄️",
                title: "Live Database",
                text: "Prices, availability, product details, and FAQs come from Supabase.",
              },
              {
                icon: "🎯",
                title: "Reliable Rule Matching",
                text: "The chatbot recognises approved phrasing and asks for clarification when uncertain.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-8"
              >
                <span className="text-4xl">{feature.icon}</span>
                <h3 className="mt-7 text-xl font-black">
                  {feature.title}
                </h3>
                <p className="mt-4 leading-7 text-slate-500">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white px-5 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xl font-black">
            Shop<span className="text-indigo-600">Wise</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            NovaCart is a fictional store created for a database-powered
            rule-based chatbot course project. No real orders are accepted.
          </p>
        </div>
      </footer>

      {/* FLOATING CHAT BUTTON */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          aria-label="Open ShopWise chatbot"
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-3xl text-white shadow-2xl shadow-indigo-300 transition hover:scale-110"
        >
          💬
        </button>
      )}

      {/* CHATBOT */}
      {chatOpen && (
        <section
          aria-label="ShopWise support chatbot"
          className="fixed bottom-4 right-4 z-50 flex h-[min(690px,calc(100dvh-32px))] w-[calc(100vw-32px)] max-w-[430px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:bottom-6 md:right-6"
        >
          {/* CHAT HEADER */}
          <div className="flex items-center justify-between bg-indigo-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-2xl">
                🛍️
              </span>
              <div>
                <h2 className="font-extrabold">ShopWise Assistant</h2>
                <p className="text-xs text-indigo-100">
                  ● Database-connected support
                </p>
              </div>
            </div>

            <button
              onClick={() => setChatOpen(false)}
              aria-label="Close chatbot"
              className="rounded-lg px-2 text-2xl hover:bg-white/20"
            >
              ×
            </button>
          </div>

          {/* MESSAGE HISTORY */}
          <div
            role="log"
            aria-live="polite"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.sender === "user"
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm border border-slate-100 bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {/* QUICK QUESTIONS */}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-slate-500">
                  Popular questions
                </p>

                {questions
                  .filter((item) =>
                    [
                      "What is your return policy?",
                      "How long does delivery take?",
                      "Do you offer cash on delivery?",
                    ].includes(item.question)
                  )
                  .map((question) => (
                    <button
                      key={question.id}
                      onClick={() =>
                        void sendMessage(
                          question.question,
                          question.id
                        )
                      }
                      className="block w-full rounded-xl border border-indigo-100 bg-white p-3 text-left text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      {question.question}
                    </button>
                  ))}
              </div>
            )}

            {/* CLARIFICATION OPTIONS */}
            {suggestions.length > 0 && (
              <div className="rounded-2xl border border-indigo-100 bg-white p-3">
                <p className="mb-3 text-xs font-black text-slate-500">
                  SELECT A QUESTION
                </p>

                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() =>
                        void sendMessage(
                          suggestion.question,
                          suggestion.id
                        )
                      }
                      disabled={sending}
                      className="block w-full rounded-xl bg-indigo-50 p-3 text-left text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                    >
                      {suggestion.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sending && (
              <p className="text-sm text-slate-500">
                Checking knowledge base...
              </p>
            )}

            <div ref={messagesEnd} />
          </div>

          {/* QUESTION LIBRARY */}
          {libraryOpen && (
            <div className="flex max-h-72 flex-col border-t border-slate-200 bg-white">
              <div className="space-y-2 p-3">
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search questions..."
                  aria-label="Search FAQ questions"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  aria-label="Filter FAQ category"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
                {filteredQuestions.map((question) => (
                  <button
                    key={question.id}
                    disabled={sending}
                    onClick={() =>
                      void sendMessage(
                        question.question,
                        question.id
                      )
                    }
                    className="block w-full rounded-xl p-3 text-left hover:bg-indigo-50 disabled:opacity-50"
                  >
                    <span className="block text-xs font-bold text-indigo-600">
                      {question.category}
                    </span>
                    <span className="mt-1 block text-sm text-slate-700">
                      {question.question}
                    </span>
                  </button>
                ))}

                {filteredQuestions.length === 0 && (
                  <p className="p-3 text-sm text-slate-500">
                    No matching questions found.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setLibraryOpen((previous) => !previous);
              setSearch("");
              setCategory("All");
            }}
            className="border-t border-slate-100 bg-white px-4 py-3 text-left text-sm font-bold text-indigo-600 hover:bg-indigo-50"
          >
            {libraryOpen
              ? "− Hide question library"
              : `+ Browse ${questions.length} questions`}
          </button>

          {/* INPUT */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
            className="flex gap-2 border-t border-slate-100 bg-white p-4"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a shopping question..."
              aria-label="Chat message"
              maxLength={500}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="rounded-xl bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
