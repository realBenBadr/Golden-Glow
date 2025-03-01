class MysticalFrame {
    constructor() {
        this.frame = document.querySelector('.mystical-frame');
        this.init();
    }

    init() {
        this.createParticles();
        this.animateSymbols();
    }

    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = Math.random() * 3 + 'px';
            particle.style.height = particle.style.width;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particlesContainer.appendChild(particle);
        }
        
        this.frame.appendChild(particlesContainer);
    }

    animateSymbols() {
        const symbols = document.querySelectorAll('.mystical-symbols');
        symbols.forEach(symbol => {
            symbol.style.animationDelay = Math.random() * 2 + 's';
        });
    }
}
