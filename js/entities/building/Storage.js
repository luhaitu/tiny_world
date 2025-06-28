import BaseBuilding from './BaseBuilding.js';

export default class Storage extends BaseBuilding {
    constructor(x, y) {
        super(x, y);
        this.berries = 0;
        this.wood = 0;
        this.food = [];
        this.color = '#a1887f';
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = this.color;
        ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    update() {}
}
