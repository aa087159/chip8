import Graphics from './graphics.js';
import Keyboard from './keyboard.js';

const graphics = new Graphics(15);
const keyboard = new Keyboard();

class Chip8 {
	constructor(test) {
		// Create our memory with 4,096 bytes
		this.memory = new Uint8Array(4096);
		// Program counter, where we get our instructions from
		this.pc = 0x200;
		//Chip-8 has 16 general purpose 8-bit registers
		this.registers = new Uint8Array(16);
		//register I
		this.registerI = new Uint16Array(1);
		//stack
		this.stack = new Uint16Array(16);
		this.stackpointer = -1;
		//sound timer and delay timer
		this.ST = 0;
		this.DT = 0;
		const sprites = [
			0xf0,
			0x90,
			0x90,
			0x90,
			0xf0, // 0
			0x20,
			0x60,
			0x20,
			0x20,
			0x70, // 1
			0xf0,
			0x10,
			0xf0,
			0x80,
			0xf0, // 2
			0xf0,
			0x10,
			0xf0,
			0x10,
			0xf0, // 3
			0x90,
			0x90,
			0xf0,
			0x10,
			0x10, // 4
			0xf0,
			0x80,
			0xf0,
			0x10,
			0xf0, // 5
			0xf0,
			0x80,
			0xf0,
			0x90,
			0xf0, // 6
			0xf0,
			0x10,
			0x20,
			0x40,
			0x40, // 7
			0xf0,
			0x90,
			0xf0,
			0x90,
			0xf0, // 8
			0xf0,
			0x90,
			0xf0,
			0x10,
			0xf0, // 9
			0xf0,
			0x90,
			0xf0,
			0x90,
			0x90, // A
			0xe0,
			0x90,
			0xe0,
			0x90,
			0xe0, // B
			0xf0,
			0x80,
			0x80,
			0x80,
			0xf0, // C
			0xe0,
			0x90,
			0x90,
			0x90,
			0xe0, // D
			0xf0,
			0x80,
			0xf0,
			0x80,
			0xf0, // E
			0xf0,
			0x80,
			0xf0,
			0x80,
			0x80, // F
		];

		//load sprite
		for (let i = 0; i < sprites.length; i++) {
			this.memory[i] = sprites[i];
		}
		// for (let i = 0; i < test.length; i++) {
		// 	this.memory[0x200 + i] = test[i];
		// }
	}

	loadRom(romName) {
		var request = new XMLHttpRequest();
		request.onload = () => {
			// If the request response has content
			if (request.response) {
				let program = new Uint8Array(request.response);

				// load the starting program into memory starting at address 0
				for (let i = 0; i < program.length; i++) {
					if (i % 10 === 0) {
						graphics.render();
					}
					this.memory[0x200 + i] = program[i];
				}
			}
		};

		// Initialize a GET request to retrieve the ROM from our roms folder
		request.open('GET', '../' + romName);
		request.responseType = 'arraybuffer';
		request.send();
	}

	run = async () => {
		this.loadRom('test_opcode.ch8');
		await sleep(1000);
		function sleep(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		}

		for (let j = 0; j < 50000; j++) {
			for (let i = 0; i < 10; i++) {
				this.dispatch();
			}
			await sleep(5);
			graphics.render();
		}
		//var should_run = true;
		// for (let i = 0; i < 1; i++) {
		// 	this.dispatch();
		// 	graphics.render();
		// }
		// while (should_run) {
		// 	should_run = this.dispatch();
		// 	graphics.render();
		// }
		//this.dispatch();
		//keyboard.eventHandler();
	};

	dispatch = () => {
		const first_byte = this.memory[this.pc];
		const second_byte = this.memory[this.pc + 1];
		const full_instruction = (first_byte << 8) | second_byte;
		this.pc += 2;

		const first_nibble = first_byte >> 4;
		const second_nibble = first_byte & 0xf;
		const third_nibble = second_byte >> 4;
		const fourth_nibble = second_byte & 0xf;

		const last_two_nibbles = full_instruction & 0x0ff;
		const last_three_nibbles = full_instruction & 0x0fff;

		// first match against globally unique instructions
		switch (full_instruction) {
			case 0x0000:
				// no-op: do nothing
				return true;
			case 0xffff:
				return false;
		}

		switch (first_nibble) {
			case 0x0:
				if (last_three_nibbles === 0x0e0) {
					//Clear the display.
					graphics.clear();
				} else if (last_three_nibbles === 0x0ee) {
					//The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
					this.pc = this.stack[this.stackpointer];
					--this.stackpointer;
				}
				break;
			case 0x1:
				//The interpreter sets the program counter to nnn
				this.pc = last_three_nibbles;
				break;
			case 0x2:
				//sp++, puts the current PC on the top of the stack. PC = nnn
				++this.stackpointer;
				this.stack[this.stackpointer] = this.pc;
				this.pc = last_three_nibbles;
				break;
			case 0x3:
				//Skip next instruction if Vx = kk.
				if (this.registers[second_nibble] === last_two_nibbles) {
					this.pc += 2;
				}
				break;
			case 0x4:
				//Skip next instruction if Vx != kk.
				if (this.registers[second_nibble] !== last_two_nibbles) {
					this.pc += 2;
				}
				break;
			case 0x5:
				//Skip next instruction if Vx = Vy.
				if (
					this.registers[second_nibble] ===
					this.registers[third_nibble]
				) {
					this.pc += 2;
				}
				break;
			case 0x6:
				//The interpreter puts the value kk into register Vx.
				this.registers[second_nibble] = last_two_nibbles;
				break;
			case 0x7:
				//Adds the value kk to the value of register Vx, then stores the result in Vx.
				this.registers[second_nibble] += last_two_nibbles;
				break;
			case 0x8:
				switch (fourth_nibble) {
					case 0:
						////Stores the value of register Vy in register Vx.
						this.registers[second_nibble] = this.registers[
							third_nibble
						];
						break;
					case 1:
						//Set Vx = Vx OR Vy.
						this.registers[second_nibble] =
							this.registers[second_nibble] |
							this.registers[third_nibble];
						break;
					case 2:
						//Set Vx = Vx AND Vy.
						this.registers[second_nibble] =
							this.registers[second_nibble] &
							this.registers[third_nibble];
						break;
					case 3:
						//Set Vx = Vx XOR Vy.
						this.registers[second_nibble] =
							this.registers[second_nibble] ^
							this.registers[third_nibble];
						break;
					case 4:
						//Set Vx = Vx + Vy, set VF = carry.
						//The values of Vx and Vy are added together.
						//If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0.
						//Only the lowest 8 bits of the result are kept, and stored in Vx.
						let added =
							this.registers[second_nibble] +
							this.registers[third_nibble];
						if (added > 255) {
							this.registers[0xf] = 1;
						} else {
							this.registers[0xf] = 0;
						}
						this.registers[second_nibble] = added & 0xffffffff;
						break;
					case 5:
						//If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
						if (
							this.registers[second_nibble] >
							this.registers[third_nibble]
						) {
							this.registers[0xf] = 1;
						} else {
							this.registers[0xf] = 0;
						}
						this.registers[second_nibble] -= this.registers[
							third_nibble
						];
						break;
					case 6:
						//If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
						if (
							parseInt(
								this.registers[second_nibble].toString(16),
								16
							) &
							(1 === 1)
						) {
							this.registers[0xf] = 1;
						} else {
							this.registers[0xf] = 0;
						}
						this.registers[second_nibble] /= 2;
						break;
					case 7:
						//If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
						if (
							this.registers[third_nibble] >
							this.registers[second_nibble]
						) {
							this.registers[0xf] = 1;
						} else {
							this.registers[0xf] = 0;
						}
						this.registers[second_nibble] =
							this.registers[third_nibble] -
							this.registers[second_nibble];
						break;
					case 0xe:
						//If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
						if ((this.registers[second_nibble] & 0xff) >> 7 === 1) {
							this.registers[0xf] = 1;
						} else {
							this.registers[0xf] = 0;
						}
						this.registers[second_nibble] *= 2;

						break;
					default:
						throw (
							'unrecognized instruction in 0x8 ' +
							full_instruction
						);
				}
				break;
			case 0x9:
				//The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.
				if (
					this.registers[second_nibble] !==
					this.registers[third_nibble]
				) {
					this.pc += 2;
				}
				break;
			case 0xa:
				//The value of register I is set to nnn.
				this.registerI[0] = last_three_nibbles;
				break;
			case 0xb:
				//The program counter is set to nnn plus the value of V0.
				this.pc = last_three_nibbles + this.registers[0];
				break;
			case 0xc:
				//Set Vx = random byte AND kk.
				const ranInt = Math.floor(Math.random() * Math.floor(256));
				this.registers[second_nibble] = ranInt & last_two_nibbles;
				break;
			case 0xd:
				//Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
				// If the sprite is positioned so part of it is outside the coordinates of the display,
				// it wraps around to the opposite side of the screen

				let spriteHeight = fourth_nibble;

				let y = this.registers[third_nibble];

				//n-byte
				for (let i = 0; i < spriteHeight; i++) {
					let currentByte = this.memory[this.registerI[0] + i];
					y += 1;
					if (y > 32) {
						y -= 32;
					}
					let x = this.registers[second_nibble];
					//loop through the byte
					for (let bit = 0; bit < 8; bit++) {
						x += 1;
						if (x > 64) {
							x -= 64;
						}
						let currentBit = (currentByte >> (7 - bit)) & 1;

						if (currentBit !== 0) {
							this.registers[0xf] = graphics.display[x + y * 64];
						}

						graphics.display[x + y * 64] ^= currentBit;
					}
				}

				break;
			case 0xe:
				if (last_two_nibbles === 0x9e) {
					//Ex9E Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, PC is increased by 2.
					if (
						keyboard.chip8keys[
							this.registers[second_nibble] - 1
						] === 1
					) {
						this.pc += 2;
					}
				} else if (last_two_nibbles === 0xa1) {
					//ExA1 Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
					if (
						keyboard.chip8keys[
							this.registers[second_nibble] - 1
						] === 0
					) {
						this.pc += 2;
					}
				}

				break;
			case 0xf:
				switch (last_two_nibbles) {
					case 0x07:
						//Set Vx = delay timer value.
						this.registers[second_nibble] = this.DT;
						break;
					case 0x0a:
						//All execution stops until a key is pressed, then the value of that key is stored in Vx.
						let pause = true;

						while (pause) {
							document.addEventListener('keydown', (e) => {
								this.registers[second_nibble] = e.key;
								pause = false;
							});
						}
						break;
					case 0x15:
						//DT is set equal to the value of Vx.
						this.DT = this.registers[second_nibble];
						break;
					case 0x18:
						//Set sound timer = Vx.
						this.ST = this.registers[second_nibble];
						break;
					case 0x1e:
						//The values of I and Vx are added, and the results are stored in I.
						this.registerI[0] += this.registers[second_nibble];
						break;
					case 0x29:
						//Set I = location of sprite for digit Vx.
						//Fx29 The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx

						this.registerI[0] = this.registers[second_nibble] * 5;
						break;
					case 0x33:
						//Store BCD representation of Vx in memory locations I, I+1, and I+2.
						//The interpreter takes the decimal value of Vx,
						//and places the hundreds digit in memory at location in I,
						//the tens digit at location I+1, and the ones digit at location I+2.
						// console.log(this.registers[second_nibble]); //137
						// console.log(
						// 	Math.floor(this.registers[second_nibble] / 100)
						// );
						// console.log(
						// 	Math.floor(
						// 		(this.registers[second_nibble] % 100) / 10
						// 	)
						// );
						// console.log(
						// 	Math.floor(this.registers[second_nibble] % 10)
						// );
						console.log(this.registerI[0]);
						this.memory[this.registerI[0]] = Math.floor(
							this.registers[second_nibble] / 100
						);
						this.memory[this.registerI[0] + 1] = Math.floor(
							(this.registers[second_nibble] % 100) / 10
						);

						this.memory[this.registerI[0] + 2] = Math.floor(
							this.registers[second_nibble] % 10
						);
						break;
					case 0x55:
						//0xf155 Store registers V0 through Vx in memory starting at location I.
						//The interpreter copies the values of registers V0 through Vx into memory,
						//starting at the address in I.

						for (let i = 0; i < second_nibble + 1; i++) {
							this.memory[this.registerI[0] + i] = this.registers[
								i
							];
						}

						break;
					case 0x65:
						//The interpreter reads values from memory starting at location I into registers V0 through Vx.
						for (let i; i < second_nibble + 1; ++i) {
							this.registers[i] = this.memory[
								this.registerI[0] + i
							];
						}
						break;
					default:
						throw (
							'unrecognized instruction in 0xf ' +
							full_instruction
						);
				}
				break;
			default:
				throw 'unrecognized instruction ' + full_instruction;
		}
		return true;
	};
}

var test = [0x00, 0x00, 0x00, 0x00];

var vm = new Chip8(test);
vm.run();
// graphics.testRender();
// graphics.render();
