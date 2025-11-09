import React from 'react';

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const items: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      items.push(
        <ul key={key} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((li, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: li }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith('## ')) {
      flushList(`ul-${index}`);
      items.push(<h2 key={index} className="text-xl font-bold mt-4 mb-2 text-slate-100">{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
      flushList(`ul-${index}`);
      items.push(<h3 key={index} className="text-lg font-semibold mt-3 mb-1 text-slate-200">{line.substring(4)}</h3>);
    } else if (line.startsWith('* ')) {
      listItems.push(line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
    } else {
      flushList(`ul-${index}`);
      if (line.trim() !== '') {
        const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        items.push(<p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: processedLine }} />);
      }
    }
  });

  flushList('ul-end');

  return <div className="text-slate-300">{items}</div>;
};