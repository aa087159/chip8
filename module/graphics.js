class Graphics {
	constructor(scale) {
		this.cols = 64;
		this.rows = 32;
		//scale to fit the modern screen size
		this.scale = scale;
		this.canvas = document.querySelector('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.canvas.width = this.cols * this.scale;
		this.canvas.height = this.rows * this.scale;
		//represent pixels as array items
		this.display = new Array(this.cols * this.rows);
	}

	clear() {
		this.display = new Array(this.cols * this.rows);
	}

	placePixel(x, y) {
		let pixelLocation = x + y * this.cols;
		this.display[pixelLocation] ^= 1;
		//return this.display[pixelLocation];
	}

	render() {
		// loop through display
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				let i = x + y * this.cols;
				if (this.display[i]) {
					this.ctx.fillStyle = '#000';
					this.ctx.fillRect(
						x * this.scale,
						y * this.scale,
						this.scale,
						this.scale
					);
				}
			}
		}
	}

	testRender() {
		for (let i = 0; i < 10; i++) {
			this.placePixel(i + 5, 5);
		}

		// this.placePixel(0, 0);
		// this.placePixel(15, 2);
	}
}

export default Graphics;
