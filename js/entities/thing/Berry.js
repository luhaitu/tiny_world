import Food from './Food.js';

export default class Berry extends Food {
    constructor(amount = 1) {
        super(amount, 'berry');
    }
}
