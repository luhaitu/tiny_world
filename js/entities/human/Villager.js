import BaseHuman from './BaseHuman.js';
import { HUMAN_SIZE, HUMAN_SPEED, MAX_HUNGER, HUNGER_DECAY_RATE, HUNGER_THRESHOLD_TO_EAT, HUNGER_THRESHOLD_TO_GATHER, GATHER_DISTANCE, CARRY_CAPACITY, GATHER_BERRY_DURATION, CHOP_WOOD_DURATION, HUNT_RABBIT_DURATION, HUNGER_PER_BERRY, HUNGER_PER_FOOD, POISON_BERRY_DAMAGE } from '../../constants.js';
import Meat from '../thing/Meat.js';
import Bush from '../plant/Bush.js';
import Tree from '../plant/Tree.js';
import Rabbit from '../animal/Rabbit.js';
import Wolf from '../animal/Wolf.js';

export default class Villager extends BaseHuman {
    constructor(x, y, id, gender) {
        super(x, y);
        this.id = id;
        this.gender = gender;
        this.color = gender === 'M' ? '#4a90e2' : '#e91e63';
        this.size = HUMAN_SIZE;
        this.hunger = MAX_HUNGER;
        this.destination = { x, y };

        // Task / Targetting
        this.task = 'idle';
        this.target = null;
        this.actionTimer = 0;

        // Inventory
        this.berriesCarried = 0;
        this.woodCarried = 0;
        this.foodCarried = [];

        this.isSelected = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        if (this.isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

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
    }

    update(ctx, canvasWidth, canvasHeight, storage, updateStorageInfo, bushes, trees, animals, humans) {
        this.hunger -= HUNGER_DECAY_RATE;
        if (this.hunger < 0) this.hunger = 0;
        if (this.health <= 0) {
            this.updateDecay();
            return;
        }

        this.executeTask(ctx, canvasWidth, canvasHeight, storage, updateStorageInfo, trees);

        if (this.task === 'idle') {
            this.decideNextAction(storage, bushes, trees, animals, humans);
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
                break;
            case 'returning_storage':
                this.moveTowards(storage.x, storage.y, canvasWidth, canvasHeight);
                if (this.hasReached(storage.x, storage.y)) {
                    this.depositResources(storage, updateStorageInfo);
                    this.task = 'idle';
                }
                break;
            case 'eating':
                this.performAction(storage, updateStorageInfo, trees);
                break;
            case 'idle':
                break;
        }
    }

    performAction(storage, updateStorageInfo, trees) {
        this.actionTimer++;
        let duration = 0;
        let resourceGained = false;

        if (this.task === 'gathering_berries' && this.target instanceof Bush) {
            duration = GATHER_BERRY_DURATION;
            if (this.actionTimer >= duration) {
                if (this.target.berries > 0) {
                    this.target.berries--;
                    this.berriesCarried++;
                    if (this.target.poisonous) {
                        this.health -= POISON_BERRY_DAMAGE;
                    }
                    resourceGained = true;
                } else {
                    this.target = null;
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
                    this.target = null;
                }
            }
        } else if (this.task === 'hunting' && (this.target instanceof Rabbit || this.target instanceof Wolf)) {
            duration = HUNT_RABBIT_DURATION;
            if (this.actionTimer >= duration) {
                if (this.target.isAlive) {
                    this.target.isAlive = false;
                }
                this.task = 'collecting_meat';
                this.actionTimer = 0;
            }
        } else if (this.task === 'collecting_meat' && this.target && this.target.meatLeft !== undefined) {
            duration = GATHER_BERRY_DURATION;
            if (this.actionTimer >= duration) {
                if (this.target.meatLeft > 0) {
                    this.target.meatLeft--;
                    const from = this.target instanceof Rabbit ? 'rabbit' : this.target instanceof Wolf ? 'wolf' : 'human';
                    this.foodCarried.push(new Meat(1, from));
                    resourceGained = true;
                }
                if (this.target.meatLeft <= 0) {
                    this.target = null;
                }
                this.actionTimer = 0;
            }
        } else if (this.task === 'eating') {
            duration = GATHER_BERRY_DURATION;
            if (this.actionTimer >= duration) {
                if (storage.berries > 0 && this.hunger < MAX_HUNGER) {
                    storage.berries--;
                    this.hunger += HUNGER_PER_BERRY;
                } else if (storage.food.length > 0 && this.hunger < MAX_HUNGER) {
                    storage.food.pop();
                    this.hunger += HUNGER_PER_FOOD;
                }
                if (this.hunger >= MAX_HUNGER) {
                    this.hunger = MAX_HUNGER;
                    this.task = 'idle';
                } else if (storage.berries === 0 && storage.food.length === 0) {
                    this.task = 'idle';
                }
                this.actionTimer = 0;
            }
        }

        if (this.actionTimer >= duration || (this.target === null && (this.task === 'gathering_berries' || this.task === 'chopping_wood' || this.task === 'hunting' || this.task === 'collecting_meat'))) {
            this.actionTimer = 0;
            const carriedTotal = this.berriesCarried + this.woodCarried + this.foodCarried.length;
            if (carriedTotal >= CARRY_CAPACITY || !resourceGained || (this.target && (this.target.berries === 0 || this.target.wood === 0))) {
                this.task = 'returning_storage';
                this.target = null;
            }
        }
    }

    decideNextAction(storage, bushes, trees, animals, humans) {
        const carriedTotal = this.berriesCarried + this.woodCarried + this.foodCarried.length;

        if (this.hunger < HUNGER_THRESHOLD_TO_EAT && (storage.berries > 0 || storage.food.length > 0)) {
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
            let foodTarget = this.findClosestReachable(animals.filter(a => a instanceof Rabbit && a.isAlive));
            if (foodTarget) {
                this.target = foodTarget;
                this.task = 'moving';
                this.destination = { x: foodTarget.x, y: foodTarget.y };
                return;
            }
            let carcassTarget = this.findClosestReachable([
                ...animals.filter(a => !a.isAlive && a.meatLeft > 0),
                ...humans.filter(h => h.health <= 0 && h.meatLeft > 0 && h !== this)
            ]);
            if (carcassTarget) {
                this.target = carcassTarget;
                this.task = 'moving';
                this.destination = { x: carcassTarget.x, y: carcassTarget.y };
                return;
            }
            let berryTarget = this.findClosestReachable(bushes.filter(b => b.berries > 0));
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
                if (this.target instanceof Bush) this.task = 'gathering_berries';
                else if (this.target instanceof Tree) this.task = 'chopping_wood';
                else if (this.target instanceof Rabbit || this.target instanceof Wolf) {
                    this.task = this.target.isAlive ? 'hunting' : 'collecting_meat';
                } else if (this.target.health !== undefined && this.target.health <= 0) {
                    this.task = 'collecting_meat';
                }
            }
        } else {
            if (this.target && this.task === 'moving') {
                this.actionTimer = 0;
                if (this.target instanceof Bush) this.task = 'gathering_berries';
                else if (this.target instanceof Tree) this.task = 'chopping_wood';
                else if (this.target instanceof Rabbit || this.target instanceof Wolf) {
                    this.task = this.target.isAlive ? 'hunting' : 'collecting_meat';
                } else if (this.target.health !== undefined && this.target.health <= 0) {
                    this.task = 'collecting_meat';
                } else {
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
        if (resource instanceof Bush || resource instanceof Tree || resource instanceof Rabbit || resource instanceof Wolf || resource instanceof Villager) {
            if ((resource instanceof Bush && resource.berries > 0) ||
                (resource instanceof Tree && resource.wood > 0) ||
                ((resource instanceof Rabbit || resource instanceof Wolf) && (resource.isAlive || resource.meatLeft > 0)) ||
                (resource instanceof Villager && resource.health <= 0 && resource.meatLeft > 0)) {
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
            if (resource instanceof Bush && resource.berries > 0) isValid = true;
            else if (resource instanceof Tree && resource.wood > 0) isValid = true;
            else if ((resource instanceof Rabbit || resource instanceof Wolf) && (resource.isAlive || resource.meatLeft > 0)) isValid = true;
            else if (resource instanceof Villager && resource.health <= 0 && resource.meatLeft > 0) isValid = true;

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
        storage.food.push(...this.foodCarried);
        this.berriesCarried = 0;
        this.woodCarried = 0;
        this.foodCarried = [];
        updateStorageInfo();
    }
}
