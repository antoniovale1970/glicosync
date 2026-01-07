
import React from 'react';

// Inline Play Icon SVG
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" {...props}>
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);

const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const items: React.ReactNode[] = [];
  let listItems: string[] = [];

  // Função auxiliar para processar negrito e links
  const processText = (text: string) => {
    // 1. Processar Links: [texto](url)
    let processed = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline font-medium">$1</a>'
    );

    // 2. Processar Negrito: **texto**
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>');

    return processed;
  };

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      items.push(
        <ul key={key} className="list-disc pl-5 space-y-2 my-2 text-slate-300">
          {listItems.map((li, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: li }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Check for YouTube Links first
    const youtubeId = getYouTubeId(trimmedLine);
    if (youtubeId && (trimmedLine.startsWith('http') || trimmedLine.startsWith('[') || trimmedLine.includes('youtube.com') || trimmedLine.includes('youtu.be'))) {
        flushList(`ul-${index}`);
        
        // Extract raw URL if markdown format
        let rawUrl = trimmedLine;
        const mdMatch = trimmedLine.match(/\((.*?)\)/);
        if (mdMatch) rawUrl = mdMatch[1];
        
        items.push(
            <a 
                key={`yt-${index}`} 
                href={rawUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block my-6 group relative rounded-xl overflow-hidden shadow-lg border border-slate-700 w-full max-w-lg mx-auto bg-black"
                title="Assistir no YouTube"
            >
                {/* High Quality Thumbnail */}
                <img 
                    src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} 
                    alt="YouTube Video Thumbnail" 
                    className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`; }} 
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-red-600/90 text-white rounded-full p-4 shadow-2xl group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 ml-1" />
                    </div>
                </div>
                
                {/* Video Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-10">
                    <p className="text-white text-xs font-mono truncate opacity-70">
                       Assistir vídeo demonstrativo
                    </p>
                </div>
            </a>
        );
        return; // Skip normal processing for this line
    }

    if (line.startsWith('## ')) {
      flushList(`ul-${index}`);
      items.push(<h2 key={index} className="text-xl font-bold mt-4 mb-2 text-slate-100 border-b border-slate-700 pb-1">{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
      flushList(`ul-${index}`);
      items.push(<h3 key={index} className="text-lg font-semibold mt-3 mb-1 text-sky-100">{line.substring(4)}</h3>);
    } else if (line.startsWith('---')) {
       flushList(`ul-${index}`);
       items.push(<hr key={index} className="my-4 border-slate-600" />);
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      const content = line.replace(/^[*|-]\s+/, '');
      listItems.push(processText(content));
    } else if (trimmedLine.startsWith('<img')) {
      flushList(`ul-${index}`);
      items.push(<div key={index} dangerouslySetInnerHTML={{ __html: trimmedLine }} />);
    } else {
      flushList(`ul-${index}`);
      if (trimmedLine !== '') {
        items.push(<p key={index} className="my-2 text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: processText(line) }} />);
      }
    }
  });

  flushList('ul-end');

  return <div className="text-sm md:text-base">{items}</div>;
};
