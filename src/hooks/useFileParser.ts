import { useState, useCallback } from 'react';
import type { EBISData, FileInfo } from '@/types';

export function useFileParser() {
  const [data, setData] = useState<EBISData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseFile = useCallback((file: File) => {
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setIsLoading(false);
          return;
        }

        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
          setIsLoading(false);
          return;
        }

        // Parse headers from first line (delimited by #)
        const headerLine = lines[0];
        const parsedHeaders = headerLine
          .split('#')
          .map(h => h.trim().replace(/"/g, ''))
          .filter(h => h.length > 0);

        setHeaders(parsedHeaders);

        // Parse data rows
        const parsedData: EBISData[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split('#')
            .map(v => v.trim().replace(/"/g, ''));

          if (values.length === parsedHeaders.length) {
            const row: EBISData = {};
            parsedHeaders.forEach((header, idx) => {
              row[header] = values[idx] || '';
            });
            parsedData.push(row);
          }
        }

        setData(parsedData);

        // File info
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

        setFileInfo({
          name: file.name,
          time: timeStr,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          rows: parsedData.length,
        });

        // Simulate brief loading
        setTimeout(() => setIsLoading(false), 500);
      } catch {
        setIsLoading(false);
      }
    };

    reader.readAsText(file);
  }, []);

  const clearData = useCallback(() => {
    setData([]);
    setHeaders([]);
    setFileInfo(null);
  }, []);

  return { data, headers, fileInfo, isLoading, parseFile, clearData };
}
