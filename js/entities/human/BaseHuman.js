import { HUMAN_HEALTH_MIN, HUMAN_HEALTH_MAX, MEAT_DECAY_DURATION } from '../../constants.js';

export default class BaseHuman {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.baseHealth = Math.floor(Math.random() * (HUMAN_HEALTH_MAX - HUMAN_HEALTH_MIN + 1)) + HUMAN_HEALTH_MIN;
        this.health = this.baseHealth;
        this.meatLeft = this.baseHealth;
        this.decayTimer = 0;
    }

    updateDecay() {
        if (this.health <= 0 && this.meatLeft > 0) {
            this.decayTimer++;
            const decayRate = this.baseHealth / MEAT_DECAY_DURATION;
            this.meatLeft = Math.max(0, this.meatLeft - decayRate);
        }
    }

    draw(ctx) {}
    update() {}
}
