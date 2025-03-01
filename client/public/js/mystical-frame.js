class MysticalFrame {
    constructor(containerId = 'mystical-frame') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }
        this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('/assets/frame-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.config = await response.json();
            console.log('Loaded config:', this.config);
            this.initFrame();
        } catch (error) {
            console.error('Error loading frame configuration:', error);
        }
    }

    initFrame() {
        try {
            // Set CSS variables
            this.setCustomProperties();

            // Create main structure
            const frameHTML = `
                <div class="frame-background" style="background: linear-gradient(to bottom, ${this.config.frame.background.gradient.start}, ${this.config.frame.background.gradient.end});">
                    <div class="stars"></div>
                </div>
                <div class="arch">
                    <div class="top-ornament"></div>
                    ${this.createSideColumns()}
                    ${this.createBottomElements()}
                    <div class="watermark"></div>
                </div>
                <div id="content-area">
                    <!-- Game content will be loaded here -->
                </div>
            `;

            this.container.innerHTML = frameHTML;
            console.log('Frame HTML created');
            
            // Initialize animations
            this.initAnimations();
        } catch (error) {
            console.error('Error initializing frame:', error);
        }
    }

    setCustomProperties() {
        const style = document.documentElement.style;
        const { frame } = this.config;

        // Set CSS custom properties
        style.setProperty('--gradient-start', frame.background.gradient.start);
        style.setProperty('--gradient-end', frame.background.gradient.end);
        style.setProperty('--border-color', frame.arch.border.color);
        style.setProperty('--border-glow', frame.arch.border.glow.color);
        style.setProperty('--ornament-color', frame.arch.topOrnament.color);
        style.setProperty('--symbol-color', frame.sideColumns.left.symbols[0].color);
        style.setProperty('--chain-color', frame.sideColumns.left.decorations.color);
        style.setProperty('--lantern-color', frame.bottomElements.lanterns.color);
        style.setProperty('--lantern-glow', frame.bottomElements.lanterns.glow.color);
        style.setProperty('--orb-color', frame.bottomElements.centerOrb.color);
        style.setProperty('--orb-glow', frame.bottomElements.centerOrb.color);
        
        console.log('Custom properties set');
    }

    createSideColumns() {
        const createColumn = (side) => {
            const columnConfig = this.config.frame.sideColumns[side];
            return `
                <div class="side-column ${side}">
                    ${columnConfig.symbols.map((symbol, index) => `
                        <div class="symbol ${symbol.type}" 
                             style="background-color: ${symbol.color};"
                             data-position="${symbol.position}">
                        </div>
                    `).join('')}
                    <div class="hanging-chain"></div>
                </div>
            `;
        };

        return createColumn('left') + createColumn('right');
    }

    createBottomElements() {
        const { lanterns, centerOrb } = this.config.frame.bottomElements;
        return `
            <div class="lantern left" style="background-color: ${lanterns.color};"></div>
            <div class="lantern right" style="background-color: ${lanterns.color};"></div>
            <div class="center-orb" style="background-color: ${centerOrb.color};"></div>
            <div class="decorative-line"></div>
        `;
    }

    initAnimations() {
        // Add animation classes
        const stars = this.container.querySelector('.stars');
        if (stars) stars.classList.add('animate-twinkle');

        const orbs = this.container.querySelectorAll('.symbol[data-position="bottom"]');
        orbs.forEach(orb => orb.classList.add('animate-glow'));

        const centerOrb = this.container.querySelector('.center-orb');
        if (centerOrb) centerOrb.classList.add('animate-glow');

        const lanterns = this.container.querySelectorAll('.lantern');
        lanterns.forEach(lantern => lantern.classList.add('animate-glow'));
        
        console.log('Animations initialized');
    }

    // Method to update frame content
    setContent(content) {
        const contentArea = this.container.querySelector('.content-area');
        if (contentArea) {
            contentArea.innerHTML = content;
        }
    }
}

// Initialize frame when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing MysticalFrame');
    window.mysticalFrame = new MysticalFrame();
});
