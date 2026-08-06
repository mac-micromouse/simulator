const options = [
	{
		name: "Bot Dimensions",
		options: [
			{
				id: "width",
				name: "Width (centimeters)",
				default: 9.5
			},
			{
				id: "length",
				name: "Length (centimeters)",
				default: 10
			},
			{
				id: "wheel_radius",
				name: "Wheel radius (centimeters)",
				default: 2.2
			}
		]
	},
	{
		name: "Pins",
		options: [
			{
				id: "in1",
				name: "IN1 (left motor, pin 1)",
				default: 16
			},
			{
				id: "in2",
				name: "IN2 (left motor, pin 2)",
				default: 17
			},
			{
				id: "ena",
				name: "ENA (enable left motor)",
				default: 18
			},
			{
				id: "enc_l_a",
				name: "ENC_L_A (encoder, left motor)",
				default: 34
			},
			{
				id: "in3",
				name: "IN3 (right motor, pin 1)",
				default: 19
			},
			{
				id: "in4",
				name: "IN4 (right motor, pin 2)",
				default: 21
			},
			{
				id: "enb",
				name: "ENB (enable right motor)",
				default: 22
			},
			{
				id: "enc_r_a",
				name: "ENC_R_A (encoder, right motor)",
				default: 35
			}
		]
	}
];

class OptionsInterface {
	constructor(container) {
		this.container = container;

		for (const section of options) {
			const header = document.createElement("div");
			header.classList.add("options-header");
			header.innerText = section.name;
			this.container.appendChild(header);

			for (const option of section.options) {
				const label = document.createElement("label");
				label.innerText = option.name;

				const input = document.createElement("input");
				input.value = option.default || "";
				input.name = option.id;

				this.container.appendChild(label);
				this.container.appendChild(input);
			}
		}
	}
}