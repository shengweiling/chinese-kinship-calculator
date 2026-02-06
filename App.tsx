import React, { useState } from 'react';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';
import AnalysisSection from './components/AnalysisSection';
import GraphSection from './components/GraphSection';
import { calculateKinship } from './services/geminiService';
import { KinshipResult } from './types';
import { Network, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [inputString, setInputString] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<KinshipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);

  const handleCalculate = async () => {
    if (!inputString.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowAnalysis(false); // Reset analysis view on new calculation

    try {
      const data = await calculateKinship(inputString);
      setResult(data);
    } catch (err) {
      setError("无法识别该关系或网络连接错误，请检查输入后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className={`mx-auto px-6 py-4 flex items-center justify-between transition-all duration-500 ${showAnalysis ? 'max-w-7xl' : 'max-w-3xl'}`}>
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 p-2 rounded-lg text-white">
              <Network size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">亲戚计算器</h1>
          </div>
          <div className="text-sm text-gray-500 font-medium">AI 驱动</div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`mx-auto px-4 sm:px-6 py-8 transition-all duration-500 ease-in-out ${showAnalysis ? 'max-w-7xl' : 'max-w-3xl'}`}>
        
        <div className={`grid gap-6 ${showAnalysis ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          
          {/* Left Column - Input and Result */}
          <div className={`flex flex-col gap-6 ${showAnalysis ? 'lg:col-span-1' : ''}`}>
            
            {/* Intro Text */}
            {!result && !loading && (
              <div className="text-center mb-4 mt-4">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                  搞不清亲戚关系？
                </h2>
                <p className="text-gray-500 text-lg">
                  输入关系链，例如“我妈妈的哥哥的妻子”，AI 帮你一键搞定称呼与逻辑。
                </p>
              </div>
            )}

            <InputSection 
              input={inputString} 
              setInput={setInputString} 
              onCalculate={handleCalculate}
              loading={loading}
            />

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">正在分析复杂关系网络...</p>
              </div>
            )}

            {result && !loading && (
              <div className="animate-fade-in-up flex flex-col gap-6">
                <ResultSection 
                  title={result.finalTitle} 
                  showAnalysis={showAnalysis} 
                  onToggleAnalysis={() => setShowAnalysis(!showAnalysis)}
                />
                
                {/* GraphSection removed from here */}
              </div>
            )}
          </div>

          {/* Right Column - Graph and Analysis (Visible only when toggled) */}
          {result && !loading && showAnalysis && (
            <div className="lg:col-span-1 animate-fade-in-right flex flex-col gap-6">
              <GraphSection data={result.graphData} />
              <AnalysisSection steps={result.steps} />
            </div>
          )}
          
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Chinese Kinship Calculator</p>
      </footer>
    </div>
  );
};

export default App;