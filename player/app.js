import Chip8 from './module/chip8.js';
import Sound from './module/Sound.js';

//create Rom select options
const games = [
	{ Airplane: ['R = shoot'] },
	{ Brick: ['W = go right', '4 = go left'] },
	{
		PONG: [
			'Player 1:',
			'1 = go up',
			'4 = go down',
			'Player 2:',
			'F = go up',
			'Z = go down',
		],
	},
	{
		SpaceInvaders: [
			'Q = start game',
			'Q = shoot',
			'4 = go left',
			'W = go right',
		],
	},
	{ Tank: ['Q = shoot', '4 = go left', 'W = go right'] },
	{
		TETRIS: [
			'Q = go left',
			'W = go right',
			'E = fall faster',
			'4 = rotate piece',
		],
	},
	{ Timebomb: ['2 = increment time', 'R = decrement time', 'Q = set bomb'] },
	{ UFO: ['4 = shoot left', 'W = shoot right', 'Q = shoot straight'] },
];

const loader = document.querySelector('.rom-loader');

games.forEach((rom) => {
	const option = document.createElement('option');
	option.className = 'option';
	const textnode = document.createTextNode(Object.keys(rom));
	option.appendChild(textnode);
	loader.appendChild(option);
});

let vm = new Chip8();
const canvas = document.querySelector('canvas');

//switch power on and off
const powerButton = document.querySelector('.start-button-top');
const infoContainer = document.querySelector('.instructions');

powerButton.addEventListener('click', (e) => {
	let powerFlash = document.querySelector('.powerFlash');
	if (vm.running) {
		canvas.style.display = 'none';
		vm.stop();
		document.querySelector('.rom-loader').value = 'Select a ROM';
		powerFlash.classList.remove('powerFlashOn');
		infoContainer.innerHTML = '';

		vm.sound.mute();
		soundButton.classList.remove('muteIcon');
		soundButton.classList.add('unmuteIcon');
	} else {
		canvas.style.display = 'inline';

		let check = games.map(
			(rom) => document.querySelector('.rom-loader').value in rom
		);

		let val = check.includes(true)
			? document.querySelector('.rom-loader').value
			: 'TETRIS';
		vm = new Chip8();
		vm.run(val);
		document.querySelector('.rom-loader').value = val;

		powerFlash.classList.add('powerFlashOn');

		let currentGame = games.filter((info) => Object.keys(info)[0] === val);

		if (Object.values(currentGame[0])[0]) {
			Object.values(currentGame[0])[0].forEach((each) => {
				const instruction = document.createElement('p');
				instruction.className = 'info';
				const textnode = document.createTextNode(each);
				instruction.appendChild(textnode);
				infoContainer.appendChild(instruction);
			});
		}

		vm.sound = new Sound();
		soundButton.classList.remove('muteIcon');
		soundButton.classList.add('unmuteIcon');
	}
});

//Event: pause game
// canvas.addEventListener('click', () => {
// 	if (vm.running) {
// 		vm.paused = true;
// 		vm.running = false;
// 	} else {
// 		vm.paused = false;
// 		vm.running = true;
// 	}
// });

// Event: change game

loader.addEventListener('change', (e) => {
	if (vm.running) {
		vm.stop();

		vm = new Chip8();
		vm.run(e.target.value);

		vm.sound = new Sound();
		soundButton.classList.remove('muteIcon');
		soundButton.classList.add('unmuteIcon');

		//change infoBox
		document.querySelector('.instructions').innerHTML = '';
		let currentGame = games.filter(
			(info) => Object.keys(info)[0] === e.target.value
		);
		if (Object.values(currentGame[0])[0]) {
			Object.values(currentGame[0])[0].forEach((each) => {
				const instruction = document.createElement('p');
				instruction.className = 'info';
				const textnode = document.createTextNode(each);
				instruction.appendChild(textnode);
				infoContainer.appendChild(instruction);
			});
		}
	}
});

//toggle Color mode
const lightButton = document.querySelector('.start-button-down');
lightButton.addEventListener('click', (e) => {
	document.documentElement.classList.toggle('theme1');
	document.documentElement.classList.toggle('theme2');

	let lightIcon = document.querySelector('.colorSwitch');
	if (lightIcon.innerHTML === `<i class="far fa-moon"></i>`) {
		lightIcon.innerHTML = `<i class="fas fa-sun"></i>`;
	} else {
		lightIcon.innerHTML = `<i class="far fa-moon"></i>`;
	}
});

//toggle sound
const soundButton = document.querySelector('.control-button-left');
soundButton.addEventListener('click', (e) => {
	//console.log(vm.sound);
	if (vm.sound.sound) {
		vm.sound.mute();
		soundButton.classList.remove('unmuteIcon');
		soundButton.classList.add('muteIcon');
	} else {
		vm.sound = new Sound();
		soundButton.classList.remove('muteIcon');
		soundButton.classList.add('unmuteIcon');
	}
});

//display keyboard
const keyContainer = document.querySelector('.key-container');
const keys = [
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
let keyGroup = document.createElement('div');
keyGroup.className = 'key-group';

for (let i = 0; i < keys.length; i++) {
	let kbd = document.createElement('kbd');
	kbd.className = 'key';
	let textnode = document.createTextNode(keys[i]);
	kbd.appendChild(textnode);
	keyGroup.appendChild(kbd);

	if ((i + 1) % 4 === 0) {
		keyContainer.appendChild(keyGroup);
		keyGroup = document.createElement('div');
		keyGroup.className = 'key-group';
	}
}

//toggle info box
const infoBox = document.querySelector('.instruction');
const infoController = document.querySelector('.control-button-right');

infoController.addEventListener('click', (e) => {
	infoBox.classList.toggle('closeInfoBox');
	infoBox.classList.toggle('openInfoBox');

	infoController.classList.toggle('infoButtonclicked');
});
