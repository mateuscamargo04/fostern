const inputs = document.querySelectorAll(".input");

// Funções para o efeito de subir o texto do input (Email/Senha)
function addcl() {
    let parent = this.parentNode.parentNode;
    parent.classList.add("focus");
}

function remcl() {
    let parent = this.parentNode.parentNode;
    if (this.value == "") {
        parent.classList.remove("focus");
    }
}

inputs.forEach(input => {
    input.addEventListener("focus", addcl);
    input.addEventListener("blur", remcl);
});

// --- SISTEMA DE ANIMAÇÃO DE PÁGINA ---

history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const overlay = document.getElementById('page-transition');

// Função única para fazer a transição
function dispararTransicao(e) {
    const href = this.getAttribute('href') || this.closest('form')?.action;
    
    // Se for um botão de submit dentro de um form, ou um link com href
    if (href) {
        e.preventDefault(); // Impede a mudança imediata
        overlay.style.width = '100%'; // Inicia a mancha preta

        setTimeout(() => {
            window.location.href = href;
        }, 800);
    }
}

// Selecionamos todos os elementos que devem disparar a animação:
// 1. O botão principal (.btn)
// 2. O link de criar/login (.create)
const elementosComAnimacao = document.querySelectorAll('.btn, .create');

elementosComAnimacao.forEach(elem => {
    elem.addEventListener('click', dispararTransicao);
    // Exemplo: disparar ao clicar em um link
});