// toy virtual machine to explain the concepts of computing.
//
// Load index.html in a browser and run:
// ```
// var vm = new VirtualMachine(hello_world);
// vm.run()
// var vm = new VirtualMachine(count_from_9_program);
// vm.run()
// ```
//
// You can also call `vm.dispatch()` manually to inspect the state of the
// virtual machine as it executes.


class VirtualMachine {
    constructor(starting_program) {
        // Create our memory with length 0x1000
        this.memory = new Uint8Array(0x1000);
        // Program counter, where we get our instructions from
        this.pc = 0x00;
        // register a starts at 0
        this.reg_a = 0x00;
        // register b starts at 0
        this.reg_b = 0x00;

        // load the starting program into memory starting at address 0
        for (var i = 0; i < starting_program.length; ++i) {
            this.memory[i] = starting_program[i];
        }
    }

    // 0x0000 is a no-op function

    // instruction 0x1000
    // writes the value of register b into location a in memory
    write_b_at_a() {
        this.memory[this.reg_a] = this.reg_b;
    }

    // instruction 0x20XX
    // load immediate into A
    load_imm_a(val) {
        this.reg_a = val;
    }
    // instruction 0x21XX
    // load immediate into B
    load_imm_b(val) {
        this.reg_b = val;
    }

    // 0x30XX
    // adds immediate value to A
    add_imm_a(val) {
        this.reg_a += val;
        // ensure reg_a doesn't overflow 8 bits
        this.reg_a %= 256;
    }

    // 0x31XX
    // adds immediate value to B
    add_imm_b(val) {
        this.reg_b += val;
        // ensure reg_b doesn't overflow 8 bits
        this.reg_b %= 256;
    }

    // instruction 0x4000
    print_string_at_a() {
        var out_str = "";
        for(var i = this.reg_a; i < this.memory.length && this.memory[i] != 0; ++i) {
            out_str += String.fromCharCode(this.memory[i]);
        }
        console.log(out_str);
    }

    // 0x5XXX
    // Jump to XXX if reg_b is not 0
    jump_if_b_not_zero(val) {
        if (this.reg_b != 0) {
            this.pc = val;
        }
    }
    // 0x60XX
    // subs immediate value from A
    sub_imm_a(val) {
        this.reg_a -= val;
        // ensure reg_a doesn't overflow 8 bits
        this.reg_a %= 256;
    }

    // 0x61XX
    // subs immediate value from B
    sub_imm_b(val) {
        this.reg_b -= val;
        // ensure reg_b doesn't overflow 8 bits
        this.reg_b %= 256;
    }

    // 0xFFFF
    // terminate execution

    // Run the program until it terminates.
    run() {
        var should_run = true;
        while (should_run) {
            should_run = this.dispatch();
        }
    }

    // Runs 1 cycle: executes an instruction and updates the program counter.
    dispatch() {
        var first_byte = this.memory[this.pc];
        var second_byte = this.memory[this.pc + 1];
        this.pc += 2;

        var full_instruction = (first_byte << 8) | second_byte;
        // first match against globally unique instructions
        switch (full_instruction) {
        case 0x0000:
            // no-op: do nothing
            return true;
        case 0x1000:
            this.write_b_at_a();
            return true;
        case 0x4000:
            this.print_string_at_a();
            return true;
        case 0xFFFF:
            return false;
        }

        // take the top 4 bits of first_byte
        var id_nibble = first_byte >> 4;
        // take the bottom 4 bits of first_byte
        var low_nibble = first_byte & 0xF;

        switch (id_nibble) {
        case 0x2:
            if (low_nibble == 0) {
                this.load_imm_a(second_byte);
            } else if (low_nibble == 1) {
                this.load_imm_b(second_byte);
            } else {
                throw "invalid second nibble in 0x2 instruction: expected 0 or 1";
            }
            break;
        case 0x3:
            if (low_nibble == 0) {
                this.add_imm_a(second_byte);
            } else if (low_nibble == 1) {
                this.add_imm_b(second_byte);
            } else {
                throw "invalid second nibble in 0x3 instruction: expected 0 or 1";
            }
            break;
        case 0x5:
            var address = (low_nibble << 8) | second_byte;
            this.jump_if_b_not_zero(address);
            break;
        case 0x6:
            if (low_nibble == 0) {
                this.sub_imm_a(second_byte);
            } else if (low_nibble == 1) {
                this.sub_imm_b(second_byte);
            } else {
                throw "invalid second nibble in 0x6 instruction: expected 0 or 1";
            }
            break;
        default:
            throw "unrecognized instruction " + full_instruction;
        }

        return true;
    }

};

var hello_world_program = [0x20, 0x06, // load 0x06 into A
                           0x40, 0x00, // print string at A
                           0xFF, 0xFF, // terminate program
                           // string literal "Hello, world!" in ASCII
                           0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x00
                          ];

var count_from_9_program = [0x20, 0x30, // load addr 0x30 into A
                            0x21, 0x09, // load 0x09 into B

                            // 0x04: top of loop

                            // set up to print the nuber as ASCII
                            0x31, 0x30, // add offset 0x30 to B ('0' is 0x30, this gives us the ASCII
                                        // character rather than the raw number)
                            0x10, 0x00, // write B to addr at A
                            0x61, 0x30, // subtract the 0x30 off of B so we can use it as a counter 
                            0x40, 0x00, // print string at A

                            0x20, 0x20, // load addr 0x20 into A (for " ,")
                            0x40, 0x00, // print string at A
                            0x20, 0x30, // load addr 0x30 into A (for numeric printing)

                            0x61, 0x01, // subtract 1 from B

                            0x50, 0x04, // Jump to address 0x04 if B is not 0
                            // end of loop

                            // print final character
                            0x31, 0x30, // add offset 0x30 to B ('0' is 0x30, this gives us the ASCII
                                        // character rather than the raw number)
                            0x10, 0x00, // write B to addr at A
                            0x40, 0x00, // print string at A

                            0xFF, 0xFF, // terminate program

                            //0x00, 0x00, // no-op padding 0x18
                            //0x00, 0x00, // no-op padding 0x1A
                            //0x00, 0x00, // no-op padding 0x1C
                            0x00, 0x00, // no-op padding 0x1E

                            // string literal " ," in ASCII at addr 0x20
                            0x20, 0x2c, 0x00, 
                          ];
