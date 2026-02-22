(function () {
    function resolveLocale(input) {
        var raw = String(input || document.documentElement.lang || "en").toLowerCase();
        return raw.startsWith("es") ? "es" : "en";
    }

    function dict(locale) {
        if (locale === "es") {
            return {
                experimental: "AplicaciÃ³n educativa experimental",
                clientSide: "EjecuciÃ³n local en tu navegador",
                noPII: "Sin recopilaciÃ³n de datos personales identificables por defecto",
                version: "VersiÃ³n",
                updated: "ActualizaciÃ³n",
                terms: "PolÃ­tica de uso",
                data: "PolÃ­tica de datos",
                feedback: "Comentarios"
            };
        }
        return {
            experimental: "Experimental educational application",
            clientSide: "Runs locally in your browser",
            noPII: "No identifiable personal data is collected by default",
            version: "Version",
            updated: "Updated",
            terms: "Terms of use",
            data: "Data policy",
            feedback: "Feedback"
        };
    }

    function buildBar(options) {
        var opts = options || {};
        var locale = resolveLocale(opts.locale);
        var t = dict(locale);
        var appName = String(opts.appName || "App").trim();
        var version = String(opts.version || "0.0.0").trim();
        var updated = String(opts.updated || "").trim();
        var termsUrl = String(opts.termsUrl || "../../assets/legal/terms-short.html").trim();
        var dataUrl = String(opts.dataUrl || "../../assets/legal/data-policy-short.html").trim();
        var feedbackUrl = String(opts.feedbackUrl || "https://forms.gle/NqZWPNXopq6YHJK7A").trim();

        var bar = document.createElement("footer");
        bar.className = "app-trust-bar";
        bar.setAttribute("role", "contentinfo");
        bar.innerHTML = [
            '<div class="app-trust-inner">',
            '  <span class="app-trust-badge"><i class="fa-solid fa-shield-heart"></i> ' + appName + "</span>",
            '  <span class="app-trust-sep">|</span>',
            '  <span class="app-trust-text">' + t.experimental + "</span>",
            '  <span class="app-trust-sep">|</span>',
            '  <span class="app-trust-text">' + t.clientSide + "</span>",
            '  <span class="app-trust-sep">|</span>',
            '  <span class="app-trust-text">' + t.noPII + "</span>",
            updated ? '  <span class="app-trust-sep">|</span><span class="app-trust-text">' + t.updated + ": " + updated + "</span>" : "",
            '  <span class="app-trust-sep">|</span>',
            '  <span class="app-trust-text">' + t.version + ": " + version + "</span>",
            '  <span class="app-trust-links">',
            '    <a href="' + termsUrl + '" target="_blank" rel="noopener noreferrer">' + t.terms + "</a>",
            '    <a href="' + dataUrl + '" target="_blank" rel="noopener noreferrer">' + t.data + "</a>",
            '    <a href="' + feedbackUrl + '" target="_blank" rel="noopener noreferrer">' + t.feedback + "</a>",
            "  </span>",
            "</div>"
        ].join("");
        return bar;
    }

    window.initAppTrustBar = function initAppTrustBar(options) {
        var existing = document.querySelector(".app-trust-bar");
        if (existing) {
            existing.remove();
        }
        document.body.appendChild(buildBar(options));
    };
})();


