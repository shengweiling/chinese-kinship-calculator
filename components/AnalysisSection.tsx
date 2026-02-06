import React from 'react';
import { KinshipStep } from '../types';
import { GitCommit, ArrowRight } from 'lucide-react';

interface AnalysisSectionProps {
  steps: KinshipStep[];
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        计算过程分析
      </h2>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === steps.length - 1 ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                {index + 1}
              </div>
              {index !== steps.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-100 my-1"></div>
              )}
            </div>
            
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-gray-800 mb-1">
                <span>{step.step}</span>
                <ArrowRight size={16} className="text-gray-400" />
                <span className="text-brand-600">{step.result}</span>
              </div>
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {step.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisSection;