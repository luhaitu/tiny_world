import { HUMAN_SIZE, HUMAN_SPEED, MAX_HUNGER, HUNGER_DECAY_RATE, HUNGER_THRESHOLD_TO_EAT, HUNGER_THRESHOLD_TO_GATHER, GATHER_DISTANCE, CARRY_CAPACITY, GATHER_BERRY_DURATION, CHOP_WOOD_DURATION, HUNT_RABBIT_DURATION, HUNGER_PER_BERRY, HUNGER_PER_FOOD } from '../constants.js';
import BerryBush from './BerryBush.js';
import Tree from './Tree.js';
import Rabbit from './Rabbit.js';

export default class Human {
    constructor(x, y, id, gender) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.gender = gender;
        this.color = gender === 'M' ? '#4a90e2' : '#e91e63';
        this.size = HUMAN_SIZE;
        this.hunger = MAX_HUNGER;
        this.destination = { x, y };

        // Task / Targetting
        this.task = 'idle'; // idle, moving, gathering_berries, chopping_wood, hunting, returning_storage, eating
        this.target = null; // Can be bush, tree, rabbit, or storage coords {x,y}
        this.actionTimer = 0;

        // Inventory
        this.berriesCarried = 0;
        this.woodCarried = 0;
        this.foodCarried = 0; // Carrying hunted food

        this.isSelected = false;
    }

    draw(ctx) {
        // Draw human body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Selection indicator
        if (this.isSelected) {
            ctx.strokeStyle = '#FFD700'; // Gold
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Hunger bar
        const barWidth = this.size * 1.5;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size / 2 - barHeight - 2;
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const hungerPercent = this.hunger / MAX_HUNGER;
        let hungerBarColor = '#4caf50';
        if (hungerPercent < 0.6) hungerBarColor = '#ff9800';
        if (hungerPercent < 0.3) hungerBarColor = '#f44336';
        ctx.fillStyle = hungerBarColor;
        ctx.fillRect(barX, barY, barWidth * hungerPercent, barHeight);

        // Simple carry indicator (optional)
        const carriedTotal = this.berriesCarried + this.woodCarried + this.foodCarried;
        if (carriedTotal > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.rect(this.x + this.size / 2, this.y - this.size / 4, 4, 4);
            ctx.fill();
        }
    }

    update(ctx, canvasWidth, canvasHeight, storage, updateStorageInfo, berryBushes, trees, rabbits) {
        // 1. Update Needs
        this.hunger -= HUNGER_DECAY_RATE;
        if (this.hunger < 0) this.hunger = 0;
        // TODO: Consequences of zero hunger

        // 2. Execute Current Action State
        this.executeTask(ctx, canvasWidth, canvasHeight, storage, updateStorageInfo, trees);

        // 3. Decide Next Action (if idle or finished task)
        if (this.task === 'idle') {
            this.decideNextAction(storage, berryBushes, trees, rabbits);
        }
    }

    executeTask(ctx, canvasWidth, canvasHeight, storage, updateStorageInfo, trees) {
        switch (this.task) {
            case 'moving':
                this.moveTowards(this.destination.x, this.destination.y, canvasWidth, canvasHeight);
                if (this.hasReached(this.destination.x, this.destination.y)) {
                    this.task = 'idle';
                }
                break;
            case 'gathering_berries':
            case 'chopping_wood':
            case 'hunting':
                this.performAction(storage, updateStorageInfo, trees);
                break; // Don't move while performing timed action
            case 'returning_storage':
                this.moveTowards(storage.x, storage.y, canvasWidth, canvasHeight);
                if (this.hasReached(storage.x, storage.y)) {
                    this.depositResources(storage, updateStorageInfo);
                    this.task = 'idle'; // Decide next after depositing
                }
                break;
            case 'eating':
                this.performAction(storage, updateStorageInfo, trees); // Eating takes time
                break;
            case 'idle':
                // Do nothing, wait for decision
                break;
        }
    }

    performAction(storage, updateStorageInfo, trees) {
        this.actionTimer++;
        let duration = 0;
        let resourceGained = false;

        if (this.task === 'gathering_berries' && this.target instanceof BerryBush) {
            duration = GATHER_BERRY_DURATION;
            if (this.actionTimer >= duration) {
                if (this.target.berries > 0) {
                    this.target.berries--;
                    this.berriesCarried++;
                    resourceGained = true;
                } else {
                    this.target = null; // Target depleted mid-action
                }
            }
        } else if (this.task === 'chopping_wood' && this.target instanceof Tree) {
            duration = CHOP_WOOD_DURATION;
            if (this.actionTimer >= duration) {
                if (this.target.wood > 0) {
                    this.target.wood--;
                    this.woodCarried++;
                    resourceGained = true;
                    if (this.target.wood <= 0) {
                        trees.splice(trees.indexOf(this.target), 1);
                        this.target = null;
                    }
                } else {
                    this.target = null; // Target depleted mid-action (e.g. removed already)
                }
            }
        } else if (this.task === 'hunting' && this.target instanceof Rabbit) {
            duration = HUNT_RABBIT_DURATION;
            if (this.actionTimer >= duration) {
                if (this.target.isAlive) {
                    this.target.isAlive = false; // Mark rabbit as caught
                    this.foodCarried++;
                    resourceGained = true;
                }
                this.target = null; // Stop targeting after attempt
            }
        } else if (this.task === 'eating') {
            duration = GATHER_BERRY_DURATION; // Eating takes same time as gathering
            if (this.actionTimer >= duration) {
                if (storage.berries > 0 && this.hunger < MAX_HUNGER) {
                    storage.berries--;
                    this.hunger += HUNGER_PER_BERRY;
                } else if (storage.food > 0 && this.hunger < MAX_HUNGER) {
                    storage.food--;
                    this.hunger += HUNGER_PER_FOOD;
                }
                if (this.hunger >= MAX_HUNGER) {
                    this.hunger = MAX_HUNGER;
                    this.task = 'idle';
                } else if (storage.berries === 0 && storage.food === 0) {
                    this.task = 'idle';
                }
                this.actionTimer = 0; // Reset timer for next bite or stop
            }
        }

        // If action finished or target became invalid
        if (
            this.actionTimer >= duration ||
            (this.target === null && (this.task === 'gathering_berries' || this.task === 'chopping_wood' || this.task === 'hunting'))
        ) {
            this.actionTimer = 0;
            const carriedTotal = this.berriesCarried + this.woodCarried + this.foodCarried;
            if (
                carriedTotal >= CARRY_CAPACITY ||
                !resourceGained ||
                (this.target && (this.target.berries === 0 || this.target.wood === 0))
            ) {
                this.task = 'returning_storage';
                this.target = null;
            }
        }
    }

    decideNextAction(storage, berryBushes, trees, rabbits) {
        const carriedTotal = this.berriesCarried + this.woodCarried + this.foodCarried;

        if (this.hunger < HUNGER_THRESHOLD_TO_EAT && (storage.berries > 0 || storage.food > 0)) {
            if (!this.hasReached(storage.x, storage.y)) {
                this.task = 'moving';
                this.destination = { x: storage.x, y: storage.y };
                this.target = null;
            } else {
                this.task = 'eating';
                this.actionTimer = 0;
            }
            return;
        }

        if (carriedTotal >= CARRY_CAPACITY) {
            this.task = 'returning_storage';
            this.target = null;
            return;
        }

        if (this.hunger < HUNGER_THRESHOLD_TO_GATHER) {
            let foodTarget = this.findClosestReachable(rabbits.filter(r => r.isAlive));
            if (foodTarget) {
                this.target = foodTarget;
                this.task = 'moving';
                this.destination = { x: foodTarget.x, y: foodTarget.y };
                return;
            }
            let berryTarget = this.findClosestReachable(berryBushes.filter(b => b.berries > 0));
            if (berryTarget) {
                this.target = berryTarget;
                this.task = 'moving';
                this.destination = { x: berryTarget.x, y: berryTarget.y };
                return;
            }
        }

        if (carriedTotal === 0) {
            let woodTarget = this.findClosestReachable(trees.filter(t => t.wood > 0));
            if (woodTarget) {
                this.target = woodTarget;
                this.task = 'moving';
                this.destination = { x: woodTarget.x, y: woodTarget.y };
                return;
            }
        }

        this.task = 'idle';
    }

    moveTowards(targetX, targetY, canvasWidth, canvasHeight) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > GATHER_DISTANCE / 2) {
            const moveX = (dx / distance) * HUMAN_SPEED;
            const moveY = (dy / distance) * HUMAN_SPEED;
            const nextX = this.x + moveX;
            const nextY = this.y + moveY;

            if (nextX > this.size / 2 && nextX < canvasWidth - this.size / 2) this.x = nextX;
            if (nextY > this.size / 2 && nextY < canvasHeight - this.size / 2) this.y = nextY;

            if (this.target && this.hasReached(this.target.x, this.target.y)) {
                this.actionTimer = 0;
                if (this.target instanceof BerryBush) this.task = 'gathering_berries';
                else if (this.target instanceof Tree) this.task = 'chopping_wood';
                else if (this.target instanceof Rabbit) this.task = 'hunting';
            }
        } else {
            if (this.target && this.task === 'moving') {
                this.actionTimer = 0;
                if (this.target instanceof BerryBush) this.task = 'gathering_berries';
                else if (this.target instanceof Tree) this.task = 'chopping_wood';
                else if (this.target instanceof Rabbit) this.task = 'hunting';
                else {
                    this.task = 'idle';
                    this.destination = { x: this.x, y: this.y };
                }
            } else if (this.task === 'moving') {
                this.task = 'idle';
                this.destination = { x: this.x, y: this.y };
            }
        }
    }

    hasReached(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= GATHER_DISTANCE;
    }

    setManualDestination(x, y) {
        this.destination.x = x;
        this.destination.y = y;
        this.target = null;
        this.task = 'moving';
        this.actionTimer = 0;
    }

    setManualTarget(resource) {
        if (resource instanceof BerryBush || resource instanceof Tree || resource instanceof Rabbit) {
            if (
                (resource instanceof BerryBush && resource.berries > 0) ||
                (resource instanceof Tree && resource.wood > 0) ||
                (resource instanceof Rabbit && resource.isAlive)
            ) {
                this.target = resource;
                this.destination = { x: resource.x, y: resource.y };
                this.task = 'moving';
                this.actionTimer = 0;
            } else {
                console.log('Cannot target depleted/invalid resource.');
                this.target = null;
                this.task = 'idle';
            }
        } else {
            console.log('Invalid target type');
        }
    }

    findClosestReachable(resourceList) {
        let closest = null;
        let minDistance = Infinity;
        resourceList.forEach(resource => {
            let isValid = false;
            if (resource instanceof BerryBush && resource.berries > 0) isValid = true;
            else if (resource instanceof Tree && resource.wood > 0) isValid = true;
            else if (resource instanceof Rabbit && resource.isAlive) isValid = true;

            if (isValid) {
                const dx = resource.x - this.x;
                const dy = resource.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = resource;
                }
            }
        });
        return closest;
    }

    depositResources(storage, updateStorageInfo) {
        storage.berries += this.berriesCarried;
        storage.wood += this.woodCarried;
        storage.food += this.foodCarried;
        this.berriesCarried = 0;
        this.woodCarried = 0;
        this.foodCarried = 0;
        updateStorageInfo();
    }
}
