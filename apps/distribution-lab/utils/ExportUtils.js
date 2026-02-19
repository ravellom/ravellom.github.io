export const ExportUtils = {
    downloadText(content, filename, mimeType = 'text/plain;charset=utf-8') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },

    escapeXml(value = '') {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    exportCanvasPNG(canvas, filename = 'distribution-chart.png') {
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    },

    exportCanvasSVG(canvas, filename = 'distribution-chart.svg', metadata = {}) {
        if (!canvas) return;
        const width = canvas.width || 1200;
        const height = canvas.height || 600;
        const pngDataUrl = canvas.toDataURL('image/png', 1.0);
        const title = this.escapeXml(metadata.title || 'Distribution Chart');
        const desc = this.escapeXml(metadata.description || 'Exported from Distribution Lab');

        const svg = [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">`,
            `<title>${title}</title>`,
            `<desc>${desc}</desc>`,
            `<image href="${pngDataUrl}" x="0" y="0" width="${width}" height="${height}" />`,
            `</svg>`
        ].join('');

        this.downloadText(svg, filename, 'image/svg+xml;charset=utf-8');
    },

    exportJSON(payload, filename = 'distribution-config.json') {
        const text = JSON.stringify(payload, null, 2);
        this.downloadText(text, filename, 'application/json;charset=utf-8');
    },

    exportGroupSummaryCSV(groups = [], filename = 'distribution-summary.csv') {
        if (!Array.isArray(groups) || !groups.length) return;
        const header = [
            'group',
            'n',
            'min',
            'q1',
            'median',
            'mean',
            'q3',
            'max',
            'iqr',
            'lower_whisker',
            'upper_whisker',
            'outliers_count'
        ];
        const rows = groups.map((group) => {
            const s = group.summary || {};
            const outliers = Array.isArray(s.outliers) ? s.outliers.length : 0;
            return [
                group.label ?? '',
                s.n ?? '',
                s.min ?? '',
                s.q1 ?? '',
                s.median ?? '',
                s.mean ?? '',
                s.q3 ?? '',
                s.max ?? '',
                s.iqr ?? '',
                s.lowerWhisker ?? '',
                s.upperWhisker ?? '',
                outliers
            ];
        });
        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        this.downloadText(csv, filename, 'text/csv;charset=utf-8');
    }
};
