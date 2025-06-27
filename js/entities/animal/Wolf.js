import BaseAnimal from './BaseAnimal.js';
import { WOLF_SIZE, WOLF_SPEED, WOLF_DAMAGE } from '../../constants.js';

export default class Wolf extends BaseAnimal {
    constructor(x, y) {
        super(x, y);
        this.size = WOLF_SIZE;
        this.color = '#555';
        this.wanderAngle = Math.random() * Math.PI * 2;
    }

    draw(ctx) {
        if (!this.isAlive) {
            if (this.meatLeft > 0) {
                ctx.fillStyle = '#633';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            return;
        }
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    update(canvasWidth, canvasHeight, humans, rabbits) {
        if (!this.isAlive) {
            this.updateDecay();
            return;
        }
        const target = this.findTarget(humans, rabbits);
        if (target) {
            this.moveTowards(target.x, target.y, WOLF_SPEED);
            if (this.distanceTo(target) < this.size) {
                if (target.health !== undefined) {
                    target.health -= WOLF_DAMAGE;
                    if (target.health <= 0) {
                        target.isAlive = false;
                    }
                } else {
                    target.isAlive = false;
                }
            }
        } else {
            this.wander(canvasWidth, canvasHeight);
        }
    }

    distanceTo(entity) {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    moveTowards(tx, ty, speed) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;
        this.x += (dx / dist) * speed;
        this.y += (dy / dist) * speed;
    }

    wander(canvasWidth, canvasHeight) {
        this.moveTowards(this.x + Math.cos(this.wanderAngle) * 1, this.y + Math.sin(this.wanderAngle) * 1, WOLF_SPEED);
        if (this.x < this.size || this.x > canvasWidth - this.size) {
            this.wanderAngle = Math.PI - this.wanderAngle;
        }
        if (this.y < this.size || this.y > canvasHeight - this.size) {
            this.wanderAngle = -this.wanderAngle;
        }
    }

    findTarget(humans, rabbits) {
        const candidates = [...humans.filter(h=>h.health>0), ...rabbits.filter(r=>r.isAlive)];
        let closest = null;
        let minDist = Infinity;
        candidates.forEach(c => {
            const d = this.distanceTo(c);
            if (d < minDist && d < 80) {
                minDist = d;
                closest = c;
            }
        });
        return closest;
    }
}
