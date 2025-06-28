# Tiny World

## Game Overview
Tiny World is a real-time strategy prototype with town-building and survival mechanics.

## Features

- [x]Initializes with a handful of villagers.
- [x]Spawns red and poisonous berry bushes as well as trees.
- Rabbits provide food while wolves roam the map and may attack prey or villagers.
- Humans and animals spawn with random base health values.
- Corpses remain for a short time and villagers can harvest meat from them.
- [x]Central storage and houses are represented as buildings.
- [x]Hunger decreases over time.
- eating berries or meat restores it while poisonous berries hurt health.
- each animal and human have varied health when first created.
- allow extracting meat out of dead animal or human.

## Project Structure

- `index.html` - main simulation page
- `js/main.js` - game logic
- `css/style.css` - visual styling
- `js/entities/` contains all entity classes organised by type:
  - `human/` - `BaseHuman` and the `Villager` class
  - `animal/` - `BaseAnimal`, `Rabbit` and `Wolf`
  - `plant/` - `BasePlant`, `Tree`, `Bush`, `RedBerryBush`, `PoisonBerryBush`
  - `building/` - `BaseBuilding`, `Storage` and `House`

## Getting Started

Open `index.html` in a web browser to play with the simulation. All styles are stored in `css/style.css` and the game logic lives in `js/main.js`.
