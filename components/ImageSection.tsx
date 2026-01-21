
import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio, GeneratedImage } from '../types';
import { geminiService } from '../services/geminiService';

interface FilterState {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0
};

const ImageSection: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setIsEditing(false);
    setFilters(DEFAULT_FILTERS);
    
    try {
      const imageUrl = await geminiService.generateImage(prompt, aspectRatio);
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now()
      };
      setCurrentImage(imageUrl);
      setHistory(prev => [newImage, ...prev]);
    } catch (error) {
      console.error('Image gen error:', error);
      alert('Failed to generate image. Please try a different prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyFiltersToCanvas = (): string => {
    if (!imageRef.current || !canvasRef.current) return currentImage || '';
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return currentImage || '';

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.filter = `
      brightness(${filters.brightness}%) 
      contrast(${filters.contrast}%) 
      saturate(${filters.saturation}%) 
      grayscale(${filters.grayscale}%) 
      sepia(${filters.sepia}%) 
      blur(${filters.blur}px)
    `;
    
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const handleSaveEdit = () => {
    const editedUrl = applyFiltersToCanvas();
    const newImage: GeneratedImage = {
      id: `edit-${Date.now()}`,
      url: editedUrl,
      prompt: `Edited: ${prompt}`,
      timestamp: Date.now()
    };
    setCurrentImage(editedUrl);
    setHistory(prev => [newImage, ...prev]);
    setIsEditing(false);
    setFilters(DEFAULT_FILTERS);
  };

  const filterString = `
    brightness(${filters.brightness}%) 
    contrast(${filters.contrast}%) 
    saturate(${filters.saturation}%) 
    grayscale(${filters.grayscale}%) 
    sepia(${filters.sepia}%) 
    blur(${filters.blur}px)
  `;

  const ratios: { id: AspectRatio; label: string }[] = [
    { id: '1:1', label: '1:1' },
    { id: '16:9', label: '16:9' },
    { id: '9:16', label: '9:16' },
    { id: '4:3', label: '4:3' },
    { id: '3:4', label: '3:4' }
  ];

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main View Area */}
          <div className={`aspect-${aspectRatio === '1:1' ? 'square' : aspectRatio.replace(':', '/')} bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative flex items-center justify-center transition-all duration-500 group`}>
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Refining pixels...</p>
              </div>
            ) : currentImage ? (
              <>
                <img 
                  ref={imageRef}
                  src={currentImage} 
                  alt="Generated" 
                  style={{ filter: filterString }}
                  className="w-full h-full object-contain animate-in fade-in duration-700" 
                />
                
                {/* Floating Toolbar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-2xl">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    {isEditing ? 'Close Editor' : 'Edit Image'}
                  </button>
                  <a 
                    href={currentImage} 
                    download={`maguai-${Date.now()}.png`}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></a>
                </div>
              </>
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-300">Creative Canvas</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                  Generate an image to unlock editing tools.
                </p>
              </div>
            )}
          </div>

          {/* Prompt Controls */}
          {!isEditing && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Aspect Ratio</label>
                <div className="flex flex-wrap gap-3">
                  {ratios.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setAspectRatio(r.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        aspectRatio === r.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Prompt</label>
                <div className="flex gap-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your vision..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] transition-all resize-none"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="shrink-0 w-24 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-white font-bold text-sm hover:from-indigo-400 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                    Gen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Edit Summary (if editing) */}
          {isEditing && (
            <div className="flex items-center justify-between bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Editing Active</p>
                  <p className="text-[10px] text-indigo-300">Adjust the sliders in the right panel</p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={() => {
                    setIsEditing(false);
                    setFilters(DEFAULT_FILTERS);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Save & Add to History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor/History Sidebar */}
      <aside className="w-80 border-l border-slate-800 bg-slate-900 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            {isEditing ? 'Image Filters' : 'Recent Creations'}
          </h3>
          {isEditing && (
            <button 
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-[10px] text-slate-500 hover:text-indigo-400 font-bold uppercase tracking-widest"
            >
              Reset
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              {/* Slider Component */}
              {[
                { label: 'Brightness', key: 'brightness', min: 0, max: 200 },
                { label: 'Contrast', key: 'contrast', min: 0, max: 200 },
                { label: 'Saturation', key: 'saturation', min: 0, max: 200 },
                { label: 'Grayscale', key: 'grayscale', min: 0, max: 100 },
                { label: 'Sepia', key: 'sepia', min: 0, max: 100 },
                { label: 'Blur', key: 'blur', min: 0, max: 20 },
              ].map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</label>
                    <span className="text-[10px] font-mono text-indigo-400">{filters[s.key as keyof FilterState]}{s.key === 'blur' ? 'px' : '%'}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={filters[s.key as keyof FilterState]}
                    onChange={(e) => setFilters(prev => ({ ...prev, [s.key]: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              ))}

              <div className="pt-4 space-y-3">
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Presets</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setFilters({ ...DEFAULT_FILTERS, grayscale: 100, contrast: 120 })}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-bold"
                    >
                      Noir
                    </button>
                    <button 
                      onClick={() => setFilters({ ...DEFAULT_FILTERS, sepia: 80, brightness: 110, contrast: 90 })}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-bold"
                    >
                      Vintage
                    </button>
                    <button 
                      onClick={() => setFilters({ ...DEFAULT_FILTERS, saturation: 160, contrast: 110 })}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-bold"
                    >
                      Vivid
                    </button>
                    <button 
                      onClick={() => setFilters({ ...DEFAULT_FILTERS, blur: 4, brightness: 90 })}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-bold"
                    >
                      Soft Focus
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-600 text-xs italic">
                  No recent generations
                </div>
              ) : (
                history.map((img) => (
                  <div 
                    key={img.id}
                    className="group relative rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-indigo-500/50 transition-all shadow-md"
                    