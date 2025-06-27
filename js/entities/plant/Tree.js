import BasePlant from './BasePlant.js';
import { TREE_SIZE, WOOD_PER_TREE } from '../../constants.js';

export default class Tree extends BasePlant {
    constructor(x, y) {
        super(x, y);
        this.size = TREE_SIZE;
        this.color = '#8d6e63';
        this.foliageColor = '#66bb6a';
        this.wood = WOOD_PER_TREE;
        this.maxWood = WOOD_PER_TREE;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 4, this.y - this.size / 2, this.size / 2, this.size);

        ctx.fillStyle = this.foliageColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size / 2, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        const woodPercent = this.wood / this.maxWood;
        ctx.fillStyle = `rgba(102, 187, 106, ${0.5 + woodPercent * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size / 2, this.size * 0.6 * woodPercent, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {}
}
