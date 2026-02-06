import React from 'react';
import { User, Sparkles, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';

interface ResultSectionProps {
  title: string | null;
  showAnalysis: boolean;
  onToggleAnalysis: () => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ title, showAnalysis, onToggleAnalysis }) => {
  if (!title) return null;

  return (
    <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white p-8 rounded-2xl shadow-lg shadow-brand-200 mb-6 relative overflow-hidden group transition-all duration-300">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

      {/* Toggle Button - Absolute Top Right */}
      <button
        onClick={onToggleAnalysis}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-white/20 hover:bg-white/30 border border-white/20 backdrop-blur-sm transition-all text-white/90 hover:text-white shadow-sm hover:shadow-md"
      >
        <BookOpen size={16} />
        <span>{showAnalysis ? '隐藏计算过程' : '查看计算过程'}</span>
        {showAnalysis ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <div className="relative z-10 text-center mt-2">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-white/90 mb-4">
          <Sparkles size={16} />
          计算结果
        </div>
        <h3 className="text-xl text-brand-100 mb-2 font-medium">你应该叫他/她</h3>
        <div className="text-5xl md:text-6xl font-extrabold tracking-tight flex items-center justify-center gap-4 flex-wrap">
          <User size={48} className="text-brand-200 opacity-80" />
          {title}
        </div>
      </div>
    </div>
  );
};

export default ResultSection;