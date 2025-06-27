import BaseAnimal from './BaseAnimal.js';
import { RABBIT_SIZE, RABBIT_SPEED } from '../../constants.js';

export default class Rabbit extends BaseAnimal {
    constructor(x, y) {
        super(x, y);
        this.size = RABBIT_SIZE;
        this.color = '#bdbdbd';
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = 0;
        this.wanderInterval = 120 + Math.random() * 180;
    }

    draw(ctx) {
        if (!this.isAlive) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size, this.size / 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    update(canvasWidth, canvasHeight) {
        if (!this.isAlive) return;
        this.wanderTimer++;
        if (this.wanderTimer >= this.wanderInterval) {
            this.wanderAngle += (Math.random() - 0.5) * Math.PI;
            this.wanderTimer = 0;
            this.wanderInterval = 120 + Math.random() * 180;
        }

        const moveX = Math.cos(this.wanderAngle) * RABBIT_SPEED;
        const moveY = Math.sin(this.wanderAngle) * RABBIT_SPEED;
        const nextX = this.x + moveX;
        const nextY = this.y + moveY;

        if (nextX < this.size || nextX > canvasWidth - this.size) {
            this.wanderAngle = Math.PI - this.wanderAngle;
        } else {
            this.x = nextX;
        }
        if (nextY < this.size || nextY > canvasHeight - this.size) {
            this.wanderAngle = -this.wanderAngle;
        } else {
            this.y = nextY;
        }
    }
}
