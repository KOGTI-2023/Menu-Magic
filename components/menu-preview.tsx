"use client";

import React from "react";
import { MenuData } from "@/lib/gemini";
import { cn } from "@/lib/utils";

export type MenuTheme = "modern" | "classic" | "minimalist" | "rustic";

interface MenuPreviewProps {
  data: MenuData;
  theme: MenuTheme;
}

export function MenuPreview({ data, theme }: MenuPreviewProps) {
  const renderTheme = () => {
    switch (theme) {
      case "classic":
        return (
          <div className="font-serif bg-[#fdfbf7] text-[#2c2c2c] p-12 max-w-4xl mx-auto shadow-xl border border-[#e5e0d8]">
            <div className="text-center mb-16 border-b-2 border-[#2c2c2c] pb-8">
              <h1 className="text-5xl font-bold tracking-widest uppercase mb-4">
                {data.restaurantName || "Menu"}
              </h1>
              <div className="flex justify-center items-center space-x-4">
                <div className="h-px w-16 bg-[#2c2c2c]"></div>
                <span className="text-sm uppercase tracking-[0.2em]">Est. 2026</span>
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
                          <span className="text-xl font-semibold">{item.price}</span>
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
                {data.restaurantName || "MENU"}
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
                          <span className="font-mono font-semibold bg-stone-100 px-2 py-1 rounded text-sm">
                            {item.price}
                          </span>
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
                {data.restaurantName || "Menu"}
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
                          <span className="text-sm text-stone-400">{item.price}</span>
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
                {data.restaurantName || "The Menu"}
              </h1>
              <p className="italic text-[#6b503b]">Fresh & Local</p>
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
                        <p className="font-bold text-[#8b5a2b]">{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div id="menu-preview-container" className="w-full">
      {renderTheme()}
    </div>
  );
}
