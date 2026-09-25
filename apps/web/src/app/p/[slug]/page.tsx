"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  MapPin,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  DollarSign,
} from "lucide-react"
import { useLandingPages, LandingPageProject } from "../../../hooks/useLandingPages"

export default function PublicLandingPageView() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.slug as string) || ""

  const { getPage, recordView, recordOrder, isLoaded } = useLandingPages()
  const [page, setPage] = useState<LandingPageProject | null>(null)

  // Interactive Dropdown selection
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  // Checkout form state
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const found = getPage(slug)
    if (found) {
      setPage(found)
      recordView(found.slug)
    }
  }, [slug, isLoaded])

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা প্রদান করুন।")
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      if (page) {
        recordOrder(page.slug)
      }
      const orderId = `BMT-${Date.now().toString().slice(-6)}`
      setConfirmedOrderId(orderId)
      setOrderConfirmed(true)
      setIsSubmitting(false)

      // If WhatsApp action is configured, optionally redirect
      if (page?.ctaAction === "WhatsApp Checkout" && page.whatsappNumber) {
        const selectedVariant = page.dropdownOptions[selectedVariantIndex]?.label || "Default Package"
        const msg = encodeURIComponent(
          `হ্যালো! আমি ${page.title} অর্ডার করতে চাই।\nঅর্ডার আইডি: ${orderId}\nপ্যাকেজ: ${selectedVariant}\nনাম: ${customerName}\nফোন: ${customerPhone}\nঠিকানা: ${customerAddress}`
        )
        window.open(`https://wa.me/${page.whatsappNumber.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank")
      }
    }, 800)
  }

  if (!page && isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h1 className="text-xl font-extrabold text-white">Landing Page Not Found</h1>
          <p className="text-xs text-slate-400">
            The requested offer landing page has either expired or been unpublished by the store owner.
          </p>
          <button
            onClick={() => router.push("/workspace/workspace-1/safe/landing-page")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Go to Landing Page Studio
          </button>
        </div>
      </div>
    )
  }

  const activeOption = page?.dropdownOptions?.[selectedVariantIndex]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Announcement Bar */}
      {(page?.visibleSections?.announcementBar ?? true) && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-700 text-white py-2 px-4 text-center text-xs font-bold tracking-wide shadow-md flex items-center justify-center gap-2">
          <Truck className="w-4 h-4 animate-bounce" />
          <span>{page?.announcementBar || "সারা বাংলাদেশে ক্যাশ অন হোম ডেলিভারি ফ্রি • ১০০% পণ্য দেখে মূল্য পরিশোধ করুন"}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {page && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl space-y-5 sm:space-y-6">
            {/* Header Brand Bar */}
            {(page.visibleSections?.categoryBadge ?? true) && (
              <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs sm:text-sm shadow-md shrink-0">
                    BMT
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight truncate">
                      {page.title}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span className="truncate">Official Merchant ({page.category})</span>
                    </span>
                  </div>
                </div>
                <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-blue-500/20 shrink-0">
                  {page.category}
                </span>
              </div>
            )}

            {/* Hero Image */}
            {(page.visibleSections?.heroImage ?? true) && (
              <div className="px-3 sm:px-6">
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video sm:aspect-[16/9] bg-slate-900 shadow-inner relative group">
                  <img
                    src={page.heroImage}
                    alt={page.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>সীমিত সময়ের স্পেশাল অফার</span>
                  </span>
                </div>
              </div>
            )}

            {/* Headline & Description */}
            {((page.visibleSections?.headline ?? true) || (page.visibleSections?.subheadline ?? true) || (page.visibleSections?.pricingBadge ?? true)) && (
              <div className="px-3 sm:px-6 text-center space-y-3">
                {(page.visibleSections?.headline ?? true) && (
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {page.headline}
                  </h1>
                )}
                {(page.visibleSections?.subheadline ?? true) && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                    {page.subheadline}
                  </p>
                )}

                {/* Price Tag */}
                {(page.visibleSections?.pricingBadge ?? true) && (
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base px-5 py-2.5 rounded-2xl shadow-inner mt-2">
                    <span>মূল্য:</span>
                    <span>{activeOption ? activeOption.price : page.productPrice}</span>
                  </div>
                )}
              </div>
            )}

            {/* Key Features & Advantages */}
            {(page.visibleSections?.features ?? true) && page.features && page.features.length > 0 && (
              <div className="px-3 sm:px-6">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2.5 shadow-xs">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    প্রোডাক্টের বিশেষ সুবিধাসমূহ (Key Highlights):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {page.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CLIENT SPECIFICATION: Interactive Offer Dropdown */}
            {(page.visibleSections?.variantsDropdown ?? true) && page.dropdownOptions && page.dropdownOptions.length > 0 && (
              <div className="px-3 sm:px-6">
                <div className="bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-xs sm:text-sm text-blue-950 dark:text-blue-200 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{page.dropdownTitle || "প্যাকেজ ও ভ্যারিয়েন্ট বেছে নিন (Select Variant):"}</span>
                    </label>
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">
                      প্রয়োজনীয়
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedVariantIndex}
                      onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                      className="w-full appearance-none bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-600 font-bold text-xs sm:text-sm text-slate-900 dark:text-white py-3 pl-4 pr-10 rounded-xl shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {page.dropdownOptions.map((opt, idx) => (
                        <option key={idx} value={idx}>
                          {opt.label} — {opt.price}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>

                  {activeOption && (
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">নির্বাচিত আইটেম:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">{activeOption.price}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CLIENT SPECIFICATION: Monetization Ad Slot */}
            {(page.visibleSections?.adSlot ?? true) && page.adSlot && page.adSlot.enabled && (
              <div className="px-3 sm:px-6">
                <div className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                    <span>Sponsored Advertisement</span>
                    <span className="bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Ad Slot</span>
                  </div>

                  {page.adSlot.adType === "Banner Image" && page.adSlot.adImageUrl ? (
                    <a
                      href={page.adSlot.adTargetUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden border border-amber-500/20 group relative shadow-md"
                    >
                      <img
                        src={page.adSlot.adImageUrl}
                        alt="Sponsored Banner Ad"
                        className="w-full h-32 sm:h-36 object-cover group-hover:scale-102 transition duration-200"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <span>বিজ্ঞাপনে যান</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    </a>
                  ) : page.adSlot.adHtmlSnippet ? (
                    <div
                      className="w-full overflow-hidden text-center text-xs p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800"
                      dangerouslySetInnerHTML={{ __html: page.adSlot.adHtmlSnippet }}
                    />
                  ) : null}
                </div>
              </div>
            )}

            {/* Trust Badges Row */}
            {(page.visibleSections?.trustBadges ?? true) && (
              <div className="px-3 sm:px-6">
                <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex flex-col items-center">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">হোম ডেলিভারি</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">সারা দেশে দ্রুত</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-slate-200 dark:border-slate-700/60 px-1">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">ক্যাশ অন ডেলিভারি</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">পণ্য দেখে টাকা দিন</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">ওয়ারেন্টি সুবিধা</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">১০০% ব্র্যান্ড নিউ</span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Confirmation / Lead Form */}
            {(page.visibleSections?.checkoutForm ?? true) && (
              <div className="px-3 sm:px-6 pb-6 sm:pb-8">
                <div className="border-2 border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                  <div className="text-center space-y-1">
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      অর্ডার করতে নিচের তথ্যগুলো পূরণ করুন
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      কোনো অগ্রিম পেমেন্ট নেই! পণ্য হাতে পেয়ে চেক করে ডেলিভারিম্যানকে টাকা দিন।
                    </p>
                  </div>

                  <form onSubmit={handleConfirmOrder} className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        আপনার নাম (Full Name) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        মোবাইল নাম্বার (Active Phone Number) *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="যেমন: 01712345678"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        সম্পূর্ণ ডেলিভারি ঠিকানা (Full Address: জেলা, থানা, গ্রাম/রোড) *
                      </label>
                      <div className="relative">
                        <textarea
                          required
                          rows={2}
                          placeholder="যেমন: বাড়ি নং ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>{isSubmitting ? "অর্ডার সাবমিট হচ্ছে..." : page.ctaText || "অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)"}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Order Confirmed Modal */}
      {orderConfirmed && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!
            </h3>

            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>অর্ডার আইডি:</span>
                <strong className="font-mono text-slate-900 dark:text-white">{confirmedOrderId}</strong>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>নির্বাচিত প্যাকেজ:</span>
                <strong className="text-slate-900 dark:text-white text-right truncate max-w-[200px]">
                  {page?.dropdownOptions[selectedVariantIndex]?.label}
                </strong>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1">
                <span>মোট প্রদেয় মূল্য:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {page?.dropdownOptions[selectedVariantIndex]?.price}
                </strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              আমাদের কাস্টমার কেয়ার প্রতিনিধি শীঘ্রই আপনার নাম্বারে ({customerPhone}) কল করে ডেলিভারি নিশ্চিত করবেন।
            </p>

            <button
              type="button"
              onClick={() => setOrderConfirmed(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
