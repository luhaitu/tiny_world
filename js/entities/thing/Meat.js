import Food from './Food.js';

export default class Meat extends Food {
    constructor(amount = 1, from = 'animal') {
        super(amount, from);
    }
}
