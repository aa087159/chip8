class Keyboard {
	constructor() {
		this.chip8keys = new Uint16Array(16);
		this.userKeys = [
			'1',
			'2',
			'3',
			'4',
			'q',
			'w',
			'e',
			'r',
			'a',
			's',
			'd',
			'f',
			'z',
			'x',
			'c',
			'v',
		];
	}

	eventHandler = () => {
		//key pressed on keyboard
		document.addEventListener('keydown', (e) => {
			if (this.userKeys.includes(e.key)) {
				const keyIndex = this.userKeys.indexOf(e.key);
				this.chip8keys[keyIndex] = 1;
				//console.log(this.chip8keys);
			} else {
				return;
			}
		});

		document.addEventListener('keyup', (e) => {
			if (this.userKeys.includes(e.key)) {
				const keyIndex = this.userKeys.indexOf(e.key);
				this.chip8keys[keyIndex] = 0;
			} else {
				return;
			}
		});

		//Event: key clicked on display
		const displayedKeys = document.querySelectorAll('.key');
		displayedKeys.forEach((key) => {
			key.addEventListener('pointerdown', (e) => {
				const keyIndex = this.userKeys.indexOf(e.target.innerHTML);
				this.chip8keys[keyIndex] = 1;
			});
		});

		displayedKeys.forEach((key) => {
			key.addEventListener('pointerup', (e) => {
				const keyIndex = this.userKeys.indexOf(e.target.innerHTML);
				this.chip8keys[keyIndex] = 0;
			});
		});
	};
}

export default Keyboard;
