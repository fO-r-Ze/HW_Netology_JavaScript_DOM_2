import './css/styles.css';
import Game from './Game.js';

const container = document.getElementById('game-container');
const game = new Game(container, 4); // поле 4x4
game.init();