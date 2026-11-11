import goblinImage from './img/goblin.png';

export default class Game {
  constructor(container, size = 4) {
    this.container = container;
    this.size = size;
    this.cells = [];
    this.goblin = null;
    this.currentCellIndex = null;
    this.intervalId = null;
    this.moveInterval = 1000; // мс

    // Счётчик успешных кликов подряд
    this.score = 0;
    this.scoreElement = null;

    // Привязываем обработчик, чтобы сохранить контекст
    this.handleClick = this.handleClick.bind(this);
  }

  init() {
    this.createField();
    this.createScoreDisplay();
    this.placeGoblin();
    this.startMoving();

    // Слушаем клики на контейнере (делегирование)
    this.container.addEventListener('click', this.handleClick);
  }

  createField() {
    this.container.innerHTML = '';
    this.cells = [];

    const field = document.createElement('div');
    field.className = 'game-field';
    field.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    field.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;

    for (let i = 0; i < this.size * this.size; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      field.appendChild(cell);
      this.cells.push(cell);
    }

    this.container.appendChild(field);
    // Даём контейнеру relative для позиционирования счётчика
    this.container.style.position = 'relative';
  }

  createScoreDisplay() {
    if (this.scoreElement) {
      this.scoreElement.remove();
    }

    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'score-display';
    scoreDiv.textContent = 'Счёт: 0';
    scoreDiv.style.position = 'absolute';
    scoreDiv.style.top = '0px';
    scoreDiv.style.left = '-130px';
    scoreDiv.style.backgroundColor = '#2c3e50';
    scoreDiv.style.padding = '8px 16px';
    scoreDiv.style.borderRadius = '8px';
    scoreDiv.style.fontSize = '24px';
    scoreDiv.style.fontWeight = 'bold';
    scoreDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    scoreDiv.style.zIndex = '10';
    scoreDiv.style.userSelect = 'none';
    scoreDiv.style.pointerEvents = 'none'; // клики сквозь счётчик

    this.container.appendChild(scoreDiv);
    this.scoreElement = scoreDiv;
  }

  updateScoreDisplay() {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Счёт: ${this.score}`;
    }
  }

  handleClick(event) {
    // Игнорируем клики по счётчику (на случай, если pointer-events не сработает)
    if (event.target.closest('#score-display')) return;

    // Находим ячейку, по которой кликнули (поднимаемся по дереву до .cell)
    const cell = event.target.closest('.cell');
    if (!cell) return; // клик не по ячейке

    // Проверяем, содержит ли эта ячейка гоблина
    if (cell.contains(this.goblin)) {
      console.log('Успешный клик!');
      this.score += 1;
    } else {
      console.log('Промах');
      this.score = 0;
    }
    this.updateScoreDisplay();
  }

  placeGoblin() {
    if (!this.goblin) {
      this.goblin = document.createElement('img');
      this.goblin.src = goblinImage;
      this.goblin.alt = 'Гоблин';
      this.goblin.className = 'goblin';
    }

    // Выбираем случайную ячейку
    const index = Math.floor(Math.random() * this.cells.length);
    // appendChild автоматически переместит узел из старого родителя, removeChild не нужен
    this.cells[index].appendChild(this.goblin);
    this.currentCellIndex = index;
  }

  moveGoblin() {
    if (!this.goblin) return;

    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.cells.length);
    } while (newIndex === this.currentCellIndex);

    // Перемещаем – просто меняем родителя (без removeChild)
    this.cells[newIndex].appendChild(this.goblin);
    this.currentCellIndex = newIndex;
  }

  startMoving() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.moveGoblin(), this.moveInterval);
  }

  stopMoving() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy() {
    this.stopMoving();
    // Удаляем обработчик, чтобы избежать утечек
    this.container.removeEventListener('click', this.handleClick);
    this.container.innerHTML = '';
    this.goblin = null;
    this.cells = [];
    this.score = 0;
    this.scoreElement = null;
  }
}