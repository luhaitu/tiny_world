import { ANIMAL_HEALTH_MIN, ANIMAL_HEALTH_MAX, MEAT_DECAY_DURATION } from '../../constants.js';

export default class BaseAnimal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.isAlive = true;
        this.baseHealth = Math.floor(Math.random() * (ANIMAL_HEALTH_MAX - ANIMAL_HEALTH_MIN + 1)) + ANIMAL_HEALTH_MIN;
        this.health = this.baseHealth;
        this.meatLeft = this.baseHealth;
        this.decayTimer = 0;
    }

    updateDecay() {
        if (!this.isAlive && this.meatLeft > 0) {
            this.decayTimer++;
            const decayRate = this.baseHealth / MEAT_DECAY_DURATION;
            this.meatLeft = Math.max(0, this.meatLeft - decayRate);
        }
    }

    draw(ctx) {}
    update() {}
}
