function readAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('read_failed'));
        reader.readAsText(file, 'utf-8');
    });
}

function readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('read_failed'));
        reader.readAsArrayBuffer(file);
    });
}

async function extractTextFromPdf(file) {
    let pdfjsLib = null;

    if (window.pdfjsLib) {
        pdfjsLib = window.pdfjsLib;
    } else {
        try {
            pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs');
        } catch {
            throw new Error('pdf_parser_missing');
        }
    }

    if (!pdfjsLib || typeof pdfjsLib.getDocument !== 'function') {
        throw new Error('pdf_parser_missing');
    }

    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';
    }

    const arrayBuffer = await readAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pagesText = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items || [])
            .map((item) => (item && 'str' in item ? item.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (pageText) {
            pagesText.push(pageText);
        }
    }

    return pagesText.join('\n\n').trim();
}

export async function importSummaryFile(file) {
    const name = (file?.name || '').toLowerCase();

    if (name.endsWith('.pdf')) {
        const text = await extractTextFromPdf(file);
        return {
            text,
            warning: text ? null : 'pdf_empty'
        };
    }

    if (name.endsWith('.docx')) {
        if (!window.mammoth || typeof window.mammoth.extractRawText !== 'function') {
            throw new Error('docx_parser_missing');
        }

        const arrayBuffer = await readAsArrayBuffer(file);
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return { text: String(result?.value || '').trim(), warning: null };
    }

    if (name.endsWith('.doc')) {
        const text = await readAsText(file);
        return {
            text: text.trim(),
            warning: 'doc_legacy'
        };
    }

    const text = await readAsText(file);
    return { text: text.trim(), warning: null };
}
