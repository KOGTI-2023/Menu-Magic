"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, Loader2, Download, RefreshCw, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { convertPdfToImages } from "@/lib/pdf-utils";
import { extractMenuData, MenuData } from "@/lib/gemini";
import { MenuPreview, MenuTheme } from "@/components/menu-preview";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<string>("gemini-2.5-flash-lite");
  const [theme, setTheme] = useState<MenuTheme>("classic");
  const [containerStyle, setContainerStyle] = useState<string>("bg-white shadow-sm");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setMenuData(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgress(10);
    setStatus("Reading PDF file...");

    try {
      // 1. Convert PDF to Images
      let images: string[];
      try {
        images = await convertPdfToImages(file);
        if (!images || images.length === 0) {
          throw new Error("No images could be extracted from the PDF.");
        }
      } catch (err: any) {
        throw new Error(`PDF Conversion Failed: ${err.message || "Could not read the PDF file. Please ensure it is a valid PDF."}`);
      }

      setProgress(40);
      setStatus(`Converted PDF to ${images.length} image(s). Analyzing with Gemini...`);

      // 2. Call Gemini API
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please configure it in the environment variables.");
      }

      let data: MenuData;
      try {
        data = await extractMenuData(images, model, apiKey);
        if (!data || !data.categories || !Array.isArray(data.categories)) {
          throw new Error("Invalid response format from Gemini API. Expected a structured menu data object containing categories.");
        }
      } catch (err: any) {
        throw new Error(`AI Analysis Failed: ${err.message || "Failed to extract menu data from the images. Please try again or use a different model."}`);
      }
      
      setProgress(90);
      setStatus("Generating layout...");
      
      setMenuData(data);
      setProgress(100);
      setStatus("Done!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById("menu-preview-container");
    if (!element) return;

    // Dynamically import html2pdf to avoid SSR issues
    const html2pdf = (await import("html2pdf.js")).default;
    
    const opt = {
      margin:       10,
      filename:     'menu.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <main className="min-h-screen p-8 md:p-24 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-stone-900">Menu Magic</h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto">
          Transform messy, poorly scanned PDF menus into beautiful, structured, and print-ready digital layouts using Gemini AI.
        </p>
      </div>

      {!menuData ? (
        <Card className="max-w-2xl mx-auto shadow-xl border-stone-200/60">
          <CardHeader>
            <CardTitle>Upload Menu</CardTitle>
            <CardDescription>Upload a PDF scan of a menu to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-indigo-500 bg-indigo-50" : "border-stone-300 hover:border-stone-400 bg-stone-50"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto h-12 w-12 text-stone-400 mb-4" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-stone-700 font-medium">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  {file.name}
                </div>
              ) : (
                <p className="text-stone-600">
                  Drag & drop a PDF file here, or click to select one
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-select">AI Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Fastest)</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Balanced)</SelectItem>
                    <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (High Quality & Thinking)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-stone-500">
                  Pro is recommended for very messy or complex menus. Flash is faster for standard layouts.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme-select">Initial Theme</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as MenuTheme)}>
                  <SelectTrigger id="theme-select">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic Elegance</SelectItem>
                    <SelectItem value="modern">Modern Bold</SelectItem>
                    <SelectItem value="minimalist">Minimalist Mono</SelectItem>
                    <SelectItem value="rustic">Rustic Charm</SelectItem>
                    <SelectItem value="elegant">Elegant Serif</SelectItem>
                    <SelectItem value="vintage">Vintage Diner</SelectItem>
                    <SelectItem value="dark">Midnight Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-stone-600">
                  <span>{status}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button 
              className="w-full h-12 text-lg" 
              onClick={handleProcess} 
              disabled={!file || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Magic Transform"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200 sticky top-4 z-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-stone-500" />
                <Select value={theme} onValueChange={(v) => setTheme(v as MenuTheme)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic Elegance</SelectItem>
                    <SelectItem value="modern">Modern Bold</SelectItem>
                    <SelectItem value="minimalist">Minimalist Mono</SelectItem>
                    <SelectItem value="rustic">Rustic Charm</SelectItem>
                    <SelectItem value="elegant">Elegant Serif</SelectItem>
                    <SelectItem value="vintage">Vintage Diner</SelectItem>
                    <SelectItem value="dark">Midnight Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select value={containerStyle} onValueChange={setContainerStyle}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Container Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-white shadow-sm">White Shadow</SelectItem>
                    <SelectItem value="bg-stone-100 border-2 border-dashed border-stone-300">Dashed Border</SelectItem>
                    <SelectItem value="bg-stone-900 text-stone-100 rounded-xl overflow-hidden">Dark Mode</SelectItem>
                    <SelectItem value="bg-transparent">Transparent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setMenuData(null)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
              <Button onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="bg-stone-200/50 p-4 md:p-8 rounded-2xl overflow-x-auto">
            <MenuPreview data={menuData} theme={theme} className={containerStyle} />
          </div>
        </div>
      )}
    </main>
  );
}
