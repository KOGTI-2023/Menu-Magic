"use client";

import React from "react";
import { MenuData } from "@/lib/gemini";
import { cn } from "@/lib/utils";

export type MenuTheme = "modern" | "classic" | "minimalist" | "rustic" | "elegant" | "vintage" | "dark" | "artdeco" | "abstract" | "handdrawn" | "premium" | "orchidee";

interface MenuPreviewProps {
  data: MenuData;
  theme: MenuTheme;
  className?: string;
}

export function MenuPreview({ data, theme, className }: MenuPreviewProps) {
  const renderTheme = () => {
    switch (theme) {
      case "classic":
        return (
          <div className="font-serif bg-[#fdfbf7] text-[#2c2c2c] p-12 max-w-4xl mx-auto shadow-xl border border-[#e5e0d8]">
            <div className="text-center mb-16 border-b-2 border-[#2c2c2c] pb-8">
              <h1 className="text-5xl font-bold tracking-widest uppercase mb-4">
                {data.restaurantName || "Speisekarte"}
              </h1>
              <div className="flex justify-center items-center space-x-4">
                <div className="h-px w-16 bg-[#2c2c2c]"></div>
                <span className="text-sm uppercase tracking-[0.2em]">Seit 2026</span>
                <div className="h-px w-16 bg-[#2c2c2c]"></div>
              </div>
            </div>

            <div className="space-y-16">
              {data.categories.map((category, idx) => (
                <div key={idx} className="relative">
                  <h2 className="text-3xl font-semibold text-center mb-10 italic">
                    {category.category}
                  </h2>
                  <div className="grid gap-8">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex flex-col">
                        <div className="flex justify-between items-baseline mb-2">
                          <h3 className="text-xl font-bold uppercase tracking-wide">
                            {item.name}
                            {item.dietary && item.dietary.length > 0 && (
                              <span className="ml-2 text-xs align-top opacity-70">
                                ({item.dietary.join(", ")})
                              </span>
                            )}
                          </h3>
                          <div className="flex-grow border-b border-dotted border-[#2c2c2c] mx-4 opacity-30"></div>
                          <div className="flex flex-col items-end">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="text-xl font-semibold whitespace-nowrap">
                                  {p.label && <span className="text-sm font-normal mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-base italic opacity-80 max-w-2xl">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "modern":
        return (
          <div className="font-sans bg-white text-stone-900 p-12 max-w-4xl mx-auto shadow-2xl rounded-3xl">
            <div className="mb-16">
              <h1 className="text-6xl font-black tracking-tighter mb-2 text-indigo-600">
                {data.restaurantName || "SPEISEKARTE"}
              </h1>
              <div className="h-2 w-24 bg-indigo-600 rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-16">
              {data.categories.map((category, idx) => (
                <div key={idx} className="space-y-8">
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-stone-400 border-b-2 border-stone-100 pb-4">
                    {category.category}
                  </h2>
                  <div className="space-y-8">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="group">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex flex-col items-end gap-1">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="font-mono font-semibold bg-stone-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                                  {p.label && <span className="font-sans font-normal mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-stone-500 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.dietary && item.dietary.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {item.dietary.map((d, i) => (
                              <span key={i} className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "minimalist":
        return (
          <div className="font-mono bg-stone-950 text-stone-50 p-12 max-w-4xl mx-auto shadow-2xl">
            <div className="mb-20">
              <h1 className="text-4xl font-light tracking-[0.3em] uppercase">
                {data.restaurantName || "Speisekarte"}
              </h1>
            </div>

            <div className="space-y-24">
              {data.categories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-4 mb-12">
                    <span className="text-stone-500">{(idx + 1).toString().padStart(2, '0')}</span>
                    <h2 className="text-xl uppercase tracking-widest">
                      {category.category}
                    </h2>
                    <div className="flex-grow h-px bg-stone-800"></div>
                  </div>
                  
                  <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex flex-col">
                        <div className="flex justify-between items-baseline mb-2">
                          <h3 className="text-base font-medium">
                            {item.name}
                            {item.dietary && item.dietary.length > 0 && (
                              <span className="ml-2 text-stone-500 text-xs">
                                [{item.dietary.join(", ")}]
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-col items-end gap-1">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="text-sm text-stone-400 whitespace-nowrap">
                                  {p.label && <span className="text-xs mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-stone-500 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "rustic":
        return (
          <div className="font-serif bg-[#f4ece1] text-[#4a3b32] p-12 max-w-4xl mx-auto shadow-lg border-8 border-double border-[#d4c4b7]">
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold mb-4 text-[#8b5a2b]">
                {data.restaurantName || "Die Speisekarte"}
              </h1>
              <p className="italic text-[#6b503b]">Frisch & Lokal</p>
            </div>

            <div className="space-y-12">
              {data.categories.map((category, idx) => (
                <div key={idx} className="bg-white/40 p-8 rounded-lg shadow-sm border border-[#e8dfd5]">
                  <h2 className="text-3xl font-bold text-center mb-8 text-[#8b5a2b] border-b border-[#d4c4b7] pb-4">
                    ~ {category.category} ~
                  </h2>
                  <div className="space-y-6">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="text-center">
                        <h3 className="text-xl font-bold mb-1">
                          {item.name}
                          {item.dietary && item.dietary.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-[#6b503b]">
                              ({item.dietary.join(", ")})
                            </span>
                          )}
                        </h3>
                        {item.description && (
                          <p className="text-sm italic text-[#6b503b] mb-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-col items-center gap-1">
                          {item.prices && item.prices.length > 0 ? (
                            item.prices.map((p, i) => (
                              <span key={i} className="font-bold text-[#8b5a2b] whitespace-nowrap">
                                {p.label && <span className="text-sm font-normal mr-2">{p.label}</span>}
                                {p.value}
                              </span>
                            ))
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "elegant":
        return (
          <div className="font-serif bg-white text-stone-800 p-16 max-w-4xl mx-auto shadow-2xl border border-stone-100">
            <div className="text-center mb-20">
              <h1 className="text-5xl font-light tracking-[0.15em] uppercase mb-6 text-stone-900">
                {data.restaurantName || "Speisekarte"}
              </h1>
              <div className="w-24 h-px bg-stone-300 mx-auto"></div>
            </div>

            <div className="space-y-20">
              {data.categories.map((category, idx) => (
                <div key={idx}>
                  <h2 className="text-2xl font-medium text-center uppercase tracking-widest mb-12 text-stone-500">
                    {category.category}
                  </h2>
                  <div className="space-y-10">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="text-center max-w-2xl mx-auto">
                        <div className="flex justify-center items-center gap-4 mb-2">
                          <h3 className="text-lg font-medium tracking-wide">
                            {item.name}
                          </h3>
                          <span className="text-stone-400">&mdash;</span>
                          <div className="flex flex-col items-center gap-1">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="text-lg whitespace-nowrap">
                                  {p.label && <span className="text-sm font-normal mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-stone-500 italic leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.dietary && item.dietary.length > 0 && (
                          <p className="text-xs text-stone-400 mt-2 tracking-widest uppercase">
                            {item.dietary.join(" • ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "vintage":
        return (
          <div className="font-serif bg-[#fdf6e3] text-[#586e75] p-12 max-w-4xl mx-auto shadow-xl border-4 border-[#eee8d5] rounded-sm">
            <div className="text-center mb-16 border-b-2 border-[#eee8d5] pb-10">
              <h1 className="text-6xl font-black tracking-tight uppercase mb-4 text-[#073642]" style={{ fontFamily: 'Impact, sans-serif' }}>
                {data.restaurantName || "KARTE"}
              </h1>
              <p className="text-sm uppercase tracking-[0.3em] font-bold text-[#cb4b16]">Beste Qualität</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {data.categories.map((category, idx) => (
                <div key={idx} className="space-y-8">
                  <div className="bg-[#eee8d5] py-2 px-4 inline-block transform -skew-x-12">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-[#073642] transform skew-x-12">
                      {category.category}
                    </h2>
                  </div>
                  <div className="space-y-8">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx}>
                        <div className="flex justify-between items-end mb-1">
                          <h3 className="text-lg font-bold text-[#073642] uppercase">
                            {item.name}
                          </h3>
                          <div className="flex-grow border-b-2 border-dotted border-[#93a1a1] mx-2 mb-1"></div>
                          <div className="flex flex-col items-end gap-1">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="font-bold text-[#cb4b16] whitespace-nowrap">
                                  {p.label && <span className="text-xs font-normal mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-[#586e75] italic">
                            {item.description}
                          </p>
                        )}
                        {item.dietary && item.dietary.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs font-bold text-[#859900] uppercase">
                              [{item.dietary.join(", ")}]
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "dark":
        return (
          <div className="font-sans bg-zinc-950 text-zinc-100 p-12 max-w-4xl mx-auto shadow-2xl border border-zinc-800 rounded-lg">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold tracking-tighter text-white mb-4">
                {data.restaurantName || "Speisekarte"}
              </h1>
              <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-16">
              {data.categories.map((category, idx) => (
                <div key={idx} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-amber-500">
                      {category.category}
                    </h2>
                    <div className="flex-grow h-px bg-zinc-800"></div>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-zinc-100 group-hover:text-amber-500 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex flex-col items-end gap-1">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="font-mono text-amber-500 font-bold whitespace-nowrap">
                                  {p.label && <span className="text-xs font-normal text-zinc-400 mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.dietary && item.dietary.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {item.dietary.map((d, i) => (
                              <span key={i} className="text-[10px] uppercase font-bold text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "artdeco":
        return (
          <div className="font-serif bg-[#0a0a0a] text-[#d4af37] p-12 max-w-4xl mx-auto shadow-2xl border-8 border-double border-[#d4af37]">
            <div className="text-center mb-16 border-b border-[#d4af37] pb-8">
              <h1 className="text-6xl font-black tracking-[0.2em] uppercase mb-4 text-[#f3e5ab]">
                {data.restaurantName || "SPEISEKARTE"}
              </h1>
              <div className="flex justify-center items-center space-x-4">
                <div className="h-0.5 w-24 bg-[#d4af37]"></div>
                <span className="text-sm uppercase tracking-[0.4em] text-[#f3e5ab]">Gourmet</span>
                <div className="h-0.5 w-24 bg-[#d4af37]"></div>
              </div>
            </div>

            <div className="space-y-16">
              {data.categories.map((category, idx) => (
                <div key={idx} className="relative">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold uppercase tracking-[0.15em] inline-block border-t border-b border-[#d4af37] py-2 px-8">
                      {category.category}
                    </h2>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex flex-col">
                        <div className="flex justify-between items-baseline mb-2">
                          <h3 className="text-xl font-bold uppercase tracking-wide text-[#f3e5ab]">
                            {item.name}
                          </h3>
                          <div className="flex-grow border-b border-dotted border-[#d4af37] mx-4 opacity-50"></div>
                          <div className="flex flex-col items-end gap-1">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="text-xl font-semibold whitespace-nowrap">
                                  {p.label && <span className="text-sm font-normal mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm italic opacity-80 text-[#e5e0d8]">
                            {item.description}
                          </p>
                        )}
                        {item.dietary && item.dietary.length > 0 && (
                          <div className="mt-2">
                            <span className="text-[10px] uppercase tracking-widest border border-[#d4af37] px-2 py-0.5 rounded-sm">
                              {item.dietary.join(" • ")}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "abstract":
        return (
          <div className="font-sans bg-white text-slate-900 p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="mb-20">
                <h1 className="text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
                  {data.restaurantName || "SPEISEKARTE"}
                </h1>
                <div className="w-32 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full"></div>
              </div>

              <div className="grid gap-16">
                {data.categories.map((category, idx) => (
                  <div key={idx} className="space-y-8">
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-800">
                      {category.category}
                    </h2>
                    <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
                      {category.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="group">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-pink-500 transition-colors">
                              {item.name}
                            </h3>
                            <div className="flex flex-col items-end gap-1">
                              {item.prices && item.prices.length > 0 ? (
                                item.prices.map((p, i) => (
                                  <span key={i} className="text-lg font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
                                    {p.label && <span className="text-sm font-normal mr-2">{p.label}</span>}
                                    {p.value}
                                  </span>
                                ))
                              ) : null}
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-slate-500 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.dietary && item.dietary.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.dietary.map((d, i) => (
                                <span key={i} className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "handdrawn":
        return (
          <div className="bg-[#fcfbf9] text-slate-800 p-12 max-w-4xl mx-auto shadow-xl border-2 border-slate-400" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive", borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px" }}>
            <div className="text-center mb-16">
              <h1 className="text-6xl font-bold mb-4 text-slate-900 transform -rotate-2">
                {data.restaurantName || "Speisekarte"}
              </h1>
              <svg className="w-48 h-4 mx-auto text-slate-500" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" />
              </svg>
            </div>

            <div className="space-y-16">
              {data.categories.map((category, idx) => (
                <div key={idx} className="relative">
                  <h2 className="text-3xl font-bold mb-8 text-slate-800 inline-block border-b-2 border-slate-400 transform rotate-1">
                    {category.category}
                  </h2>
                  <div className="grid gap-8 md:grid-cols-2">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex flex-col space-y-2 p-4 border border-slate-300 hover:bg-slate-100 transition-colors" style={{ borderRadius: "15px 255px 15px 225px/255px 15px 225px 15px" }}>
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-slate-900">
                            {item.name}
                          </h3>
                          <div className="flex flex-col items-end gap-1">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="text-lg font-bold text-slate-700 whitespace-nowrap">
                                  {p.label && <span className="text-sm font-normal mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-base text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.dietary && item.dietary.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.dietary.map((d, i) => (
                              <span key={i} className="text-xs font-bold text-slate-500 border border-slate-400 px-2 py-1" style={{ borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px" }}>
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "premium":
        return (
          <div className="font-serif bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 p-16 max-w-4xl mx-auto shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-slate-200/60 rounded-xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 opacity-80"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            <div className="text-center mb-20 relative z-10">
              <h1 className="text-5xl font-bold tracking-widest uppercase mb-4 text-slate-800 drop-shadow-sm">
                {data.restaurantName || "Speisekarte"}
              </h1>
              {data.subtitle && (
                <p className="text-sm uppercase tracking-[0.3em] text-amber-700/80 font-medium">{data.subtitle}</p>
              )}
              <div className="mt-8 flex justify-center items-center space-x-4 opacity-70">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-600/50"></div>
                <div className="w-2 h-2 rotate-45 bg-amber-600/50"></div>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-600/50"></div>
              </div>
            </div>

            <div className="space-y-20 relative z-10">
              {data.categories.map((category, idx) => (
                <div key={idx} className="relative">
                  <h2 className="text-3xl font-semibold text-center mb-12 text-slate-800 tracking-wide">
                    {category.category}
                  </h2>
                  <div className="grid gap-10">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex flex-col group">
                        <div className="flex justify-between items-baseline mb-2">
                          <div className="flex items-baseline">
                            {item.number && (
                              <span className="font-medium text-amber-700/80 mr-4 w-8 text-right font-sans text-sm">{item.number}</span>
                            )}
                            <h3 className="text-xl font-medium text-slate-800 group-hover:text-amber-700 transition-colors duration-300">
                              {item.name}
                              {(item.additives || item.allergens) && (
                                <sup className="ml-1 text-[10px] font-normal text-slate-500">
                                  ({[...(item.additives || []), ...(item.allergens || [])].join(",")})
                                </sup>
                              )}
                            </h3>
                          </div>
                          <div className="flex-grow border-b border-dotted border-slate-300 mx-6 opacity-60 group-hover:border-amber-300 transition-colors duration-300"></div>
                          <div className="flex flex-col items-end">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="text-xl font-medium text-slate-800 whitespace-nowrap">
                                  {p.label && <span className="text-sm font-normal italic text-slate-500 mr-3">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm italic text-slate-600/90 ml-12 max-w-2xl leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {data.footer && (
              <div className="mt-24 pt-8 border-t border-slate-200 text-xs text-slate-500 space-y-2 font-sans relative z-10">
                {data.footer.additives && <p><strong className="font-medium text-slate-700">Zusatzstoffe:</strong> {data.footer.additives}</p>}
                {data.footer.allergens && <p><strong className="font-medium text-slate-700">Allergene:</strong> {data.footer.allergens}</p>}
              </div>
            )}
          </div>
        );
      case "orchidee":
        return (
          <div className="font-sans bg-white text-black p-12 max-w-4xl mx-auto shadow-xl border border-gray-200 relative">
            {/* Decorative floral elements could be added here via CSS or SVG */}
            <div className="text-center mb-16 border-b-2 border-[#8b0000] pb-8">
              <h1 className="text-4xl font-bold tracking-widest uppercase mb-2 text-[#8b0000]">
                {data.restaurantName || "ORCHIDEE"}
              </h1>
              {data.subtitle && (
                <p className="text-sm italic text-gray-700 mt-2">{data.subtitle}</p>
              )}
            </div>

            <div className="space-y-16">
              {data.categories.map((category, idx) => (
                <div key={idx} className="relative">
                  <h2 className="text-3xl font-bold text-center mb-10 text-[#8b0000]">
                    {category.category}
                  </h2>
                  <div className="grid gap-6">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex flex-col">
                        <div className="flex justify-between items-baseline mb-1">
                          <div className="flex items-baseline">
                            {item.number && (
                              <span className="font-bold mr-4 w-8 text-right">{item.number}</span>
                            )}
                            <h3 className="text-lg font-bold">
                              {item.name}
                              {(item.additives || item.allergens) && (
                                <sup className="ml-1 text-[10px] font-normal">
                                  ({[...(item.additives || []), ...(item.allergens || [])].join(",")})
                                </sup>
                              )}
                            </h3>
                          </div>
                          <div className="flex-grow border-b border-dotted border-gray-400 mx-4 opacity-50"></div>
                          <div className="flex flex-col items-end">
                            {item.prices && item.prices.length > 0 ? (
                              item.prices.map((p, i) => (
                                <span key={i} className="text-lg font-bold whitespace-nowrap">
                                  {p.label && <span className="text-sm font-normal italic text-[#8b0000] mr-2">{p.label}</span>}
                                  {p.value}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm italic text-[#8b0000] ml-12">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {data.footer && (
              <div className="mt-16 pt-8 border-t border-gray-300 text-xs text-gray-600 space-y-2">
                {data.footer.additives && <p><strong>Zusatzstoffe:</strong> {data.footer.additives}</p>}
                {data.footer.allergens && <p><strong>Allergene:</strong> {data.footer.allergens}</p>}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div id="menu-preview-container" className={cn("w-full transition-all duration-500", className)}>
      {renderTheme()}
    </div>
  );
}
