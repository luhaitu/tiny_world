import Villager from './entities/human/Villager.js';
import RedBerryBush from './entities/plant/RedBerryBush.js';
import PoisonBerryBush from './entities/plant/PoisonBerryBush.js';
import Tree from './entities/plant/Tree.js';
import Rabbit from './entities/animal/Rabbit.js';
import Wolf from './entities/animal/Wolf.js';
import Storage from './entities/building/Storage.js';
import {
    MAX_HUNGER,
} from './constants.js';

const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const selectedHumanInfoDiv = document.getElementById('selectedHumanInfo');
const storageBerriesDiv = document.getElementById('storageBerries');
const storageWoodDiv = document.getElementById('storageWood');
const storageFoodDiv = document.getElementById('storageFood');
const resetButton = document.getElementById('resetButton');

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

let humans = [];
let bushes = [];
let trees = [];
let rabbits = [];
let wolves = [];
let storage = new Storage(canvasWidth / 2, canvasHeight / 2);
let selectedHuman = null;
let animationFrameId = null;

function initSimulation() {
    humans = [];
    bushes = [];
    trees = [];
    rabbits = [];
    wolves = [];
    selectedHuman = null;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    storage.berries = 0;
    storage.wood = 0;
    storage.food = [];

    humans.push(new Villager(storage.x - 50, storage.y - 50, 1, 'M'));
    humans.push(new Villager(storage.x + 50, storage.y - 50, 2, 'F'));
    humans.push(new Villager(storage.x - 50, storage.y + 50, 3, 'M'));
    humans.push(new Villager(storage.x + 50, storage.y + 50, 4, 'F'));

    const numBushes = 12;
    const numPoison = 3;
    const numTrees = 10;
    const numRabbits = 5;
    const numWolves = 2;

    for (let i = 0; i < numBushes; i++) spawnResource(RedBerryBush, bushes);
    for (let i = 0; i < numPoison; i++) spawnResource(PoisonBerryBush, bushes);
    for (let i = 0; i < numTrees; i++) spawnResource(Tree, trees);
    for (let i = 0; i < numRabbits; i++) spawnResource(Rabbit, rabbits);
    for (let i = 0; i < numWolves; i++) spawnResource(Wolf, wolves);

    updateStorageInfo();
    updateSelectedInfo();
    gameLoop();
}

function spawnResource(ResourceType, list) {
    let x, y, distance;
    const minSpawnDist = 80;
    do {
        x = Math.random() * (canvasWidth - 20) + 10;
        y = Math.random() * (canvasHeight - 20) + 10;
        const dx = x - storage.x;
        const dy = y - storage.y;
        distance = Math.sqrt(dx * dx + dy * dy);
    } while (distance < minSpawnDist);
    list.push(new ResourceType(x, y));
}

function gameLoop() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = storage.color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(storage.x - storage.size / 2, storage.y - storage.size / 2, storage.size, storage.size);
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = storage.color;
    ctx.strokeRect(storage.x - storage.size / 2, storage.y - storage.size / 2, storage.size, storage.size);

    [...bushes, ...trees, ...rabbits, ...wolves].forEach(r => {
        if (r.update) {
            if (r instanceof Rabbit || r instanceof Wolf) r.update(canvasWidth, canvasHeight, humans, rabbits);
            else r.update();
        }
        r.draw(ctx);
    });

    rabbits = rabbits.filter(r => r.isAlive || r.meatLeft > 0);
    wolves = wolves.filter(w => w.isAlive || w.meatLeft > 0);

    humans.forEach(human => {
        human.update(ctx, canvasWidth, canvasHeight, storage, updateStorageInfo, bushes, trees, [...rabbits, ...wolves], humans);
        human.draw(ctx);
    });

    updateSelectedInfo();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateSelectedInfo() {
    if (selectedHuman) {
        const hungerPercent = ((selectedHuman.hunger / MAX_HUNGER) * 100).toFixed(0);
        let progressBarClass = 'progress-bar';
        if (hungerPercent < 60) progressBarClass += ' low';
        if (hungerPercent < 30) progressBarClass += ' critical';
        const carried = `Berries: ${selectedHuman.berriesCarried}, Wood: ${selectedHuman.woodCarried}, Food: ${selectedHuman.foodCarried.length}`;

        selectedHumanInfoDiv.innerHTML = `
            <p><b>Selected:</b> Villager ${selectedHuman.id} (${selectedHuman.gender})</p>
            <p><b>Task:</b> ${selectedHuman.task.replace('_', ' ')}</p>
            <p><b>Hunger:</b></p>
            <div class="progress-bar-container">
                <div class="${progressBarClass}" style="width: ${hungerPercent}%">${hungerPercent}%</div>
            </div>
            <p class="mt-1"><b>Carrying:</b> ${carried}</p>
            <p class="mt-1"><b>Target:</b> ${selectedHuman.target ? selectedHuman.target.constructor.name : 'None'}</p>
        `;
    } else {
        selectedHumanInfoDiv.innerHTML = '<p>Select a villager to see details.</p>';
    }
}

function updateStorageInfo() {
    storageBerriesDiv.textContent = `Berries: ${storage.berries}`;
    storageWoodDiv.textContent = `Wood: ${storage.wood}`;
    storageFoodDiv.textContent = `Food (Meat): ${storage.food.length}`;
}

canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    let clickedOnHuman = null;
    let clickedOnResource = null;

    humans.forEach(human => {
        if (isClickOn(clickX, clickY, human)) {
            clickedOnHuman = human;
        }
    });

    if (!clickedOnHuman) {
        clickedOnResource = [...bushes, ...trees, ...rabbits, ...wolves].find(r => isClickOn(clickX, clickY, r));
    }

    if (clickedOnHuman) {
        if (selectedHuman) selectedHuman.isSelected = false;
        selectedHuman = clickedOnHuman;
        selectedHuman.isSelected = true;
    } else if (clickedOnResource && selectedHuman) {
        selectedHuman.setManualTarget(clickedOnResource);
    } else if (selectedHuman) {
        selectedHuman.setManualDestination(clickX, clickY);
    }

    updateSelectedInfo();
});

function isClickOn(clickX, clickY, entity) {
    if (!entity) return false;
    if ((entity instanceof Rabbit || entity instanceof Wolf) && entity.meatLeft <= 0) return false;
    if (entity instanceof Villager && entity.health <= 0 && entity.meatLeft <= 0) return false;
    const dx = clickX - entity.x;
    const dy = clickY - entity.y;
    const clickRadius = (entity.size / 2) * 1.5;
    return dx * dx + dy * dy < clickRadius * clickRadius;
}

resetButton.addEventListener('click', initSimulation);

initSimulation();
