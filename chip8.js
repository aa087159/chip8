class Chip8 {
	constructor(starting_program) {
		// Create our memory with 4,096 bytes
		this.memory = new Uint8Array(0x4096);
		// Program counter, where we get our instructions from
		this.pc = 0x00;
		//Chip-8 has 16 general purpose 8-bit registers
		this.registers = new Uint8Array(16);
		//register I
		this.registerI = new Uint16Array(1);

		this.stack = new Uint16Array(16);
		this.stackpointer = -1;

		// load the starting program into memory starting at address 0
		for (let i = 0; i < starting_program.length; ++i) {
			this.memory[i] = starting_program[i];
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

		switch (first_nibble) {
			case 0x1:
				this.pc = last_three_nibbles;
				break;
			case 0x2:
				this.stackpointer += 1;
				this.pc = last_three_nibbles;
				break;
			case 0x3:
				if (this.registers[second_nibble] === last_two_nibbles) {
					this.pc += 2;
				}
				break;
			case 0x4:
				if (this.registers[second_nibble] !== last_two_nibbles) {
					this.pc += 2;
				}
				break;
			case 0x5:
				if (
					this.registers[second_nibble] ===
					this.registers[third_nibble]
				) {
					this.pc += 2;
				}
				break;
			case 0x6:
				this.registers[second_nibble] = last_two_nibbles;
				break;
			case 0x7:
				this.registers[second_nibble] += last_two_nibbles;
				break;
			case 0x8:
				console.log(fourth_nibble);
				if (fourth_nibble === 0) {
					this.registers[second_nibble] = this.registers[
						third_nibble
					];
					break;
				} else if (fourth_nibble === 1) {
					this.registers[second_nibble] =
						this.registers[second_nibble] |
						this.registers[third_nibble];
					break;
				} else if (fourth_nibble === 2) {
					this.registers[second_nibble] =
						this.registers[second_nibble] &
						this.registers[third_nibble];
				} else if (fourth_nibble === 3) {
					this.registers[second_nibble] =
						this.registers[second_nibble] ^
						this.registers[third_nibble];
				} else if (fourth_nibble === 4) {
					if (
						this.registers[second_nibble] +
							this.registers[third_nibble] >
						255
					) {
						this.registers[15] = 1;
					} else {
						this.registers[15] = 0;
					}
				}
			default:
				throw 'unrecognized instruction ' + full_instruction;
		}

		return true;
	}
}

var hello_world_program = [
	0x81,
	0x21, // load 0x06 into A
	0x40,
	0x00, // print string at A
	0xff,
	0xff, // terminate program
	// string literal "Hello, world!" in ASCII
	0x48,
	0x65,
	0x6c,
	0x6c,
	0x6f,
	0x2c,
	0x20,
	0x77,
	0x6f,
	0x72,
	0x6c,
	0x64,
	0x21,
	0x00,
];

var vm = new Chip8(hello_world_program);
vm.dispatch();
