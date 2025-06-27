import Thing from './Thing.js';

export default class Food extends Thing {
    constructor(amount = 1, from = '') {
        super(amount);
        this.from = from;
    }
}
