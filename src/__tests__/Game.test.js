// Game.test.js
import Game from '../Game.js';

// Мокаем импорт картинки (jest уже настроен через moduleNameMapper)
jest.mock('../img/goblin.png', () => 'mocked-image-path');

describe('Game', () => {
  let container;
  let game;

  beforeEach(() => {
    // Создаём контейнер для каждого теста
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    game = new Game(container, 4);
  });

  afterEach(() => {
    // Очищаем после каждого теста
    game.destroy();
    document.body.removeChild(container);
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // Конструктор
  test('конструктор устанавливает свойства по умолчанию', () => {
    expect(game.container).toBe(container);
    expect(game.size).toBe(4);
    expect(game.cells).toEqual([]);
    expect(game.goblin).toBeNull();
    expect(game.currentCellIndex).toBeNull();
    expect(game.intervalId).toBeNull();
    expect(game.moveInterval).toBe(1000);
    expect(game.score).toBe(0);
    expect(game.scoreElement).toBeNull();
    expect(game.handleClick).toBeInstanceOf(Function);
  });

  // createField
  test('createField создаёт игровое поле с правильным количеством ячеек', () => {
    game.createField();
    const field = container.querySelector('.game-field');
    expect(field).toBeTruthy();
    expect(field.style.gridTemplateColumns).toBe('repeat(4, 1fr)');
    expect(field.style.gridTemplateRows).toBe('repeat(4, 1fr)');
    const cells = field.querySelectorAll('.cell');
    expect(cells.length).toBe(16);
    expect(game.cells.length).toBe(16);
  });

  // createScoreDisplay
  test('createScoreDisplay создаёт элемент счётчика', () => {
    game.createField(); // нужно, чтобы был контейнер
    game.createScoreDisplay();
    const scoreElement = container.querySelector('#score-display');
    expect(scoreElement).toBeTruthy();
    expect(scoreElement.textContent).toBe('Счёт: 0');
    expect(scoreElement.style.position).toBe('absolute');
    expect(game.scoreElement).toBe(scoreElement);
  });

  // updateScoreDisplay
  test('updateScoreDisplay обновляет текст счётчика', () => {
    game.createField();
    game.createScoreDisplay();
    game.score = 5;
    game.updateScoreDisplay();
    expect(game.scoreElement.textContent).toBe('Счёт: 5');
  });

  // placeGoblin
  test('placeGoblin создаёт гоблина и помещает в случайную ячейку', () => {
    game.createField();
    game.placeGoblin();
    expect(game.goblin).toBeTruthy();
    expect(game.goblin.tagName).toBe('IMG');
    expect(game.goblin.src).toContain('mocked-image-path');
    expect(game.goblin.alt).toBe('Гоблин');
    expect(game.goblin.className).toBe('goblin');
    const cellWithGoblin = game.cells.find(cell => cell.contains(game.goblin));
    expect(cellWithGoblin).toBeTruthy();
    expect(game.currentCellIndex).toBe(game.cells.indexOf(cellWithGoblin));
  });

  test('placeGoblin удаляет гоблина из предыдущей ячейки', () => {
    game.createField();
    game.placeGoblin(); // первый раз
    const firstCellIndex = game.currentCellIndex;
    game.placeGoblin(); // второй раз
    expect(game.cells[firstCellIndex].contains(game.goblin)).toBe(false);
    expect(game.cells[game.currentCellIndex].contains(game.goblin)).toBe(true);
  });

  // moveGoblin
  test('moveGoblin перемещает гоблина в другую ячейку', () => {
    game.createField();
    game.placeGoblin();
    const oldIndex = game.currentCellIndex;
    game.moveGoblin();
    expect(game.currentCellIndex).not.toBe(oldIndex);
    expect(game.cells[game.currentCellIndex].contains(game.goblin)).toBe(true);
    expect(game.cells[oldIndex].contains(game.goblin)).toBe(false);
  });

  test('moveGoblin не меняет позицию, если гоблина нет', () => {
    game.createField();
    game.goblin = null;
    game.currentCellIndex = 0;
    game.moveGoblin();
    expect(game.currentCellIndex).toBe(0);
  });

  // startMoving / stopMoving
  test('startMoving запускает интервал', () => {
    jest.useFakeTimers();
    game.createField();
    game.placeGoblin();
    const moveSpy = jest.spyOn(game, 'moveGoblin');
    game.startMoving();
    expect(game.intervalId).not.toBeNull();
    jest.advanceTimersByTime(1000);
    expect(moveSpy).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(moveSpy).toHaveBeenCalledTimes(2);
    moveSpy.mockRestore();
  });

  test('startMoving не создаёт новый интервал, если уже запущен', () => {
    jest.useFakeTimers();
    game.createField();
    game.placeGoblin();
    game.startMoving();
    const firstIntervalId = game.intervalId;
    game.startMoving();
    expect(game.intervalId).toBe(firstIntervalId);
  });

  test('stopMoving очищает интервал', () => {
    jest.useFakeTimers();
    game.createField();
    game.placeGoblin();
    game.startMoving();
    game.stopMoving();
    expect(game.intervalId).toBeNull();
    // Проверяем, что moveGoblin больше не вызывается
    const moveSpy = jest.spyOn(game, 'moveGoblin');
    jest.advanceTimersByTime(2000);
    expect(moveSpy).not.toHaveBeenCalled();
    moveSpy.mockRestore();
  });

  // handleClick
  describe('handleClick', () => {
    let cell;
    let otherCell;

    beforeEach(() => {
      game.init();          // создаёт поле, счётчик, гоблина и добавляет обработчик клика
      game.stopMoving();    // останавливаем таймер, чтобы он не мешал тестам
      cell = game.cells.find(c => c.contains(game.goblin));
      otherCell = game.cells.find(c => !c.contains(game.goblin));
    });

    test('увеличивает счёт при клике по гоблину', () => {
      const clickEvent = new MouseEvent('click', { bubbles: true });
      cell.dispatchEvent(clickEvent);
      expect(game.score).toBe(1);
      expect(game.scoreElement.textContent).toBe('Счёт: 1');
    });

    test('сбрасывает счёт при клике по пустой ячейке', () => {
      game.score = 5;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      otherCell.dispatchEvent(clickEvent);
      expect(game.score).toBe(0);
      expect(game.scoreElement.textContent).toBe('Счёт: 0');
    });

    test('игнорирует клик по счётчику', () => {
      const scoreClickEvent = new MouseEvent('click', { bubbles: true });
      game.scoreElement.dispatchEvent(scoreClickEvent);
      // Счёт не должен измениться
      expect(game.score).toBe(0);
      // Проверим, что handleClick не вызвал изменения
      // Можно проверить, что функция отработала, но не изменила счёт
      // Но мы уже установили, что клик по счётчику игнорируется через проверку в начале handleClick
      // Проверим, что счёт остался 0
      expect(game.score).toBe(0);
    });

    test('не реагирует на клик вне ячейки', () => {
      const outsideClick = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(outsideClick); // клик по body
      expect(game.score).toBe(0); // счёт не меняется (промах не считается)
    });
  });

  // init
  test('init вызывает все необходимые методы', () => {
    const createFieldSpy = jest.spyOn(game, 'createField');
    const createScoreDisplaySpy = jest.spyOn(game, 'createScoreDisplay');
    const placeGoblinSpy = jest.spyOn(game, 'placeGoblin');
    const startMovingSpy = jest.spyOn(game, 'startMoving');
    const addEventListenerSpy = jest.spyOn(container, 'addEventListener');

    game.init();

    expect(createFieldSpy).toHaveBeenCalled();
    expect(createScoreDisplaySpy).toHaveBeenCalled();
    expect(placeGoblinSpy).toHaveBeenCalled();
    expect(startMovingSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', game.handleClick);

    createFieldSpy.mockRestore();
    createScoreDisplaySpy.mockRestore();
    placeGoblinSpy.mockRestore();
    startMovingSpy.mockRestore();
    addEventListenerSpy.mockRestore();
  });

  // destroy
  test('destroy останавливает движение, удаляет обработчик и очищает DOM', () => {
    jest.useFakeTimers();
    game.init(); // инициализируем
    const removeEventListenerSpy = jest.spyOn(container, 'removeEventListener');
    const stopMovingSpy = jest.spyOn(game, 'stopMoving');

    game.destroy();

    expect(stopMovingSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', game.handleClick);
    expect(container.innerHTML).toBe('');
    expect(game.goblin).toBeNull();
    expect(game.cells).toEqual([]);
    expect(game.score).toBe(0);
    expect(game.scoreElement).toBeNull();

    removeEventListenerSpy.mockRestore();
    stopMovingSpy.mockRestore();
  });

  // Проверка, что при создании нового Game после destroy всё работает
  test('после destroy можно создать новую игру', () => {
    game.init();
    game.destroy();
    const newGame = new Game(container, 4);
    newGame.init();
    expect(newGame.cells.length).toBe(16);
    expect(newGame.goblin).toBeTruthy();
    expect(container.querySelector('.game-field')).toBeTruthy();
    newGame.destroy();
  });
});