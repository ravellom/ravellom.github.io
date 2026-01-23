function openTab(evt, tabName) {
    // 1. Ocultar todos los paneles
    const panels = document.getElementsByClassName("tab-panel");
    for (let i = 0; i < panels.length; i++) {
        panels[i].classList.remove("active");
    }

    // 2. Quitar clase 'active' de todos los botones
    const buttons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }

    // 3. Mostrar el panel actual y activar el botón clickeado
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}