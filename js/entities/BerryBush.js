import { BUSH_SIZE, BERRIES_PER_BUSH } from '../constants.js';

export default class BerryBush {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = BUSH_SIZE;
        this.color = '#2e7d32';
        this.berries = BERRIES_PER_BUSH;
        this.maxBerries = BERRIES_PER_BUSH;
        this.regenTimer = 0;
        this.regenRate = 500; // Frames to regenerate one berry
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d32f2f';
        const berrySize = 2;
        for (let i = 0; i < this.berries; i++) {
            const angle = (i / this.maxBerries) * Math.PI * 2 + Math.PI / 4;
            const berryX = this.x + Math.cos(angle) * (this.size / 3);
            const berryY = this.y + Math.sin(angle) * (this.size / 3);
            ctx.beginPath();
            ctx.arc(berryX, berryY, berrySize, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.berries === 0) {
            ctx.strokeStyle = '#a5a5a5';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    update() {
        if (this.berries < this.maxBerries) {
            this.regenTimer++;
            if (this.regenTimer >= this.regenRate) {
                this.regenTimer = 0;
                this.berries++;
            }
        }
    }
}
