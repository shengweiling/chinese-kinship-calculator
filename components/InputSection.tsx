import React from 'react';
import { RelationButton } from '../types';
import { Delete, Trash2, ArrowRight } from 'lucide-react';

interface InputSectionProps {
  input: string;
  setInput: (val: string) => void;
  onCalculate: () => void;
  loading: boolean;
}

const RELATIONS: RelationButton[] = [
  { label: '父', value: '的爸爸' },
  { label: '母', value: '的妈妈' },
  { label: '夫', value: '的丈夫' },
  { label: '妻', value: '的妻子' },
  { label: '兄', value: '的哥哥' },
  { label: '弟', value: '的弟弟' },
  { label: '姐', value: '的姐姐' },
  { label: '妹', value: '的妹妹' },
  { label: '子', value: '的儿子' },
  { label: '女', value: '的女儿' },
];

const InputSection: React.FC<InputSectionProps> = ({ input, setInput, onCalculate, loading }) => {
  
  const handleAdd = (val: string) => {
    // If input is empty, don't add "的". If not empty, append.
    // However, the standard is usually "我" implied. 
    // Let's just append. The user can start with "我" if they want, or we assume it starts with "我".
    // To make it smoother, if it's the very first input, remove the leading "的" if it exists in value logic, 
    // but here we keep it simple: "爸爸" vs "的爸爸".
    
    let nextVal = val;
    if (input === '' && val.startsWith('的')) {
      nextVal = val.substring(1); // Remove leading '的' for first item
    }
    
    setInput(input + nextVal);
  };

  const handleBackspace = () => {
    // Basic logic: remove last character, or try to remove last segment "的xx"
    if (input.length === 0) return;
    
    const lastDe = input.lastIndexOf('的');
    if (lastDe !== -1 && lastDe === input.length - 3) {
        // Remove "的xx" (3 chars)
         setInput(input.substring(0, lastDe));
    } else {
        setInput(input.substring(0, input.length - 1));
    }
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
        关系输入
      </h2>

      <div className="mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如：我妈妈的哥哥的妻子"
          className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-50 outline-none transition-all resize-none min-h-[80px]"
        />
        <div className="text-right text-sm text-gray-400 mt-1">
          {input.length > 0 ? `当前输入: 我 ${input}` : '请点击下方按钮或直接输入'}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {RELATIONS.map((rel) => (
          <button
            key={rel.label}
            onClick={() => handleAdd(rel.value)}
            disabled={loading}
            className="aspect-square flex items-center justify-center text-lg font-medium text-gray-700 bg-gray-50 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 border border-transparent rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {rel.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleBackspace}
          disabled={loading || input.length === 0}
          className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Delete size={20} />
          回退
        </button>
        <button
          onClick={handleClear}
          disabled={loading || input.length === 0}
          className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-red-500 hover:bg-red-50 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Trash2 size={20} />
          清空
        </button>
        <button
          onClick={onCalculate}
          disabled={loading || input.length === 0}
          className="flex-[2] py-3 px-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              计算关系 <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;