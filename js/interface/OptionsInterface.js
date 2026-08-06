const options = [
	{
		name: "Bot Dimensions",
		options: [
			{
				id: "width",
				name: "Width",
				subtitle: "(centimeters)",
				type: "float"
			},
			{
				id: "length",
				name: "Length",
				subtitle: "(centimeters)",
				type: "float"
			},
			{
				id: "wheel_radius",
				name: "Wheel radius",
				subtitle: "(centimeters)",
				type: "float"
			}
		]
	},
	{
		name: "Pins",
		options: [
			{
				id: "in1",
				name: "IN1",
				subtitle: "left motor, pin 1"
			},
			{
				id: "in2",
				name: "IN2",
				subtitle: "left motor, pin 2"
			},
			{
				id: "ena",
				name: "ENA",
				subtitle: "enable left motor"
			},
			{
				id: "enc_l_a",
				name: "ENC_L_A",
				subtitle: "encoder, left motor",
				break: true
			},
			{
				id: "in3",
				name: "IN3",
				subtitle: "right motor, pin 1"
			},
			{
				id: "in4",
				name: "IN4",
				subtitle: "right motor, pin 2"
			},
			{
				id: "enb",
				name: "ENB",
				subtitle: "enable right motor"
			},
			{
				id: "enc_r_a",
				name: "ENC_R_A",
				subtitle: "encoder, right motor"
			}
		]
	}
];

class OptionsInterface {
	constructor(container, simOptions) {
		this.container = container;

		for (const section of options) {
			const header = document.createElement("div");
			header.classList.add("options-header");
			header.innerText = section.name;
			this.container.appendChild(header);

			for (const option of section.options) {
				const inputContainer = document.createElement("div");
				inputContainer.classList.add("option");

				const label = document.createElement("label");
				label.innerText = option.name;

				const subtitle = document.createElement("span");
				subtitle.innerText = option.subtitle;

				const input = document.createElement("input");
				input.value = simOptions[option.id] || "";
				input.name = option.id;

				inputContainer.append(label, subtitle, input);
				this.container.appendChild(inputContainer);

				if (option.break) {
					this.container.append(document.createElement("div"));
				}

				const check = () => {
					input.blur();

					if (isNaN(Number(input.value))) {
						input.style.border = "2px solid #e55";
						return;
					}

					if (option.type !== "float") {
						input.value = Math.floor(Number(input.value));
					}

					input.style.border = "2px solid #393e46";
					simulator.setOption(option.id, Number(input.value));
				};

				input.addEventListener("keydown", event => {
					if (event.key.toLowerCase() === "enter") {
						input.blur();
					}
				});
				input.addEventListener("blur", check);
			}
		}
	}
}