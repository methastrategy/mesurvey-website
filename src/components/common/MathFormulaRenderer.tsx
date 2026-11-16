import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaRendererProps {
  formula?: string | null;
  displayMode?: boolean;
  className?: string;
  errorFallback?: string;
}

export const MathFormulaRenderer: React.FC<MathFormulaRendererProps> = ({
  formula,
  displayMode = true,
  className = '',
  errorFallback,
}) => {
  const html = useMemo(() => {
    if (!formula || typeof formula !== 'string') return null;
    const cleaned = formula.trim();
    if (!cleaned) return null;

    try {
      const rendered = katex.renderToString(cleaned, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
      // Fallback to text if KaTeX flagged a parse error
      if (rendered.includes('katex-error')) {
        return null;
      }
      return rendered;
    } catch {
      return null;
    }
  }, [formula, displayMode]);

  if (!html) {
    if (!formula) return null;
    return <span className={`font-mono text-sm ${className}`}>{errorFallback || formula}</span>;
  }

  return (
    <span
      className={`katex-render ${displayMode ? 'block overflow-x-auto py-1 my-0.5 text-center' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MathFormulaRenderer;

