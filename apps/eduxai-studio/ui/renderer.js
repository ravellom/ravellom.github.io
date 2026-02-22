import { t } from '../i18n/index.js';

function renderList(target, items, className) {
    target.innerHTML = '';
    if (!items || items.length === 0) {
        const li = document.createElement('li');
        li.textContent = t('ui.noItems');
        target.appendChild(li);
        return;
    }

    items.forEach((item) => {
        const li = document.createElement('li');
        li.className = className;
        li.textContent = item;
        target.appendChild(li);
    });
}

export function applyI18n(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.getAttribute('data-i18n');
        node.textContent = t(key);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
        const key = node.getAttribute('data-i18n-placeholder');
        node.setAttribute('placeholder', t(key));
    });
}

export function renderValidationResult(elements, validation) {
    if (!validation) {
        elements.summaryCard.className = 'summary-card';
        elements.summaryCard.textContent = t('ui.noItems');
        renderList(elements.errorsList, [], 'item-error');
        renderList(elements.warningsList, [], 'item-warning');
        return;
    }

    const isValid = validation.valid;
    elements.summaryCard.className = `summary-card ${isValid ? 'summary-ok' : 'summary-fail'}`;
    elements.summaryCard.textContent = isValid
        ? t('results.validSummary', { count: validation.summary.exerciseCount })
        : t('results.invalidSummary', { critical: validation.summary.criticalCount });

    renderList(elements.errorsList, validation.errors, 'item-error');
    renderList(elements.warningsList, validation.warnings, 'item-warning');
}
