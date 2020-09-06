import Graphics from './graphics.js';
import Keyboard from './keyboard.js';

const graphics = new Graphics(15);
const keyboard = new Keyboard();

class Chip8 {
	constructor(starting_program) {
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

		// load the starting program into memory starting at address 0
		for (let i = 0; i < starting_program.length; ++i) {
			this.memory[0x200 + i] = starting_program[i];
		}
	}

	run() {
		var should_run = true;

		while (should_run) {
			console.log(this.pc);
			console.log(this.memory.slice(0x200));
			console.log(this.registers);
			should_run = this.dispatch();
			keyboard.eventHandler();
		}
	}

	dispatch() {
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
						let added =
							this.registers[second_nibble] +
							this.registers[third_nibble];
						if (added > 255) {
							this.registers[0xf] = 1;
							this.registers[second_nibble] = added % 255;
						} else {
							this.registers[0xf] = 0;
							this.registers[second_nibble] = added;
						}
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
				for (
					let i = this.registerI[0];
					i < this.registerI[0] + this.registers[fourth_nibble];
					i++
				) {
					let x = this.registers[second_nibble];
					let y = this.registers[third_nibble];
					if (x > 64) {
						x -= 64;
					} else if (x < 64) {
						x += 64;
					}
					if (y > 32) {
						y -= 32;
					} else if (y < 32) {
						y += 32;
					}
					let pixelLocation = x + y * 64;

					graphics.display[pixelLocation] ^= 1;
					if (!graphics.display[pixelLocation]) {
						this.registers[0xf] = 1;
					} else {
						this.registers[0xf] = 0;
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
						this.registerI[0] = graphics.display.indexOf(
							this.registers[second_nibble]
						);
						break;
					case 0x33:
						//Store BCD representation of Vx in memory locations I, I+1, and I+2.
						this.memory[this.registerI[0]] = Math.floor(
							(this.registers[second_nibble] / 100) % 10
						);
						this.memory[this.registerI[0] + 1] = Math.floor(
							(this.registers[third_nibble] / 10) % 10
						);
						this.memory[this.registerI[0] + 2] =
							this.registers[third_nibble] % 10;
						break;
					case 0x55:
						//Store registers V0 through Vx in memory starting at location I.
						for (let i; i < second_nibble + 1; ++i) {
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
	}
}

var test = [0xd2, 0x34, 0x7e, 0x01, 0xff, 0xff];

var vm = new Chip8(test);
vm.run();
graphics.testRender();
graphics.render();
