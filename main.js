Date.prototype.addHours = function(h) {
	this.setTime(this.getTime() + (h*60*60*1000));
	return this;
}

var clone = function(obj1) {
	if (Array.isArray(obj1)) {
		var obj2 = [];
		obj1.forEach(function(el) {
			obj2.push(clone(el));
		});
		return obj2;
	} else if (typeof obj1 == 'object') {
		var obj2 = {};
		for (var key in obj1) {
			var val = obj1[key];
			if (typeof val == 'object') {
				obj2[key] = clone(val);
			} else {
				obj2[key] = val;
			}
		}
		return obj2;
	} else {
		return obj1;
	}
	//return Object.assign({}, obj1); 
	//return JSON.parse(JSON.stringify(obj1));
}

var pushUnique = function(arr, val) {
	if (arr.indexOf(val) === -1) {
		arr.push(val);
	}
}

var last = function(arr) {
	return arr[arr.length - 1];
}

Vue.component('an-option', {
	props: ['scenario', 'option', 'ind', 'blinker'], 
	template: '' +
	'<div class="an-option" ' +
		':style="{ width: (18 * $root.length(scenario.options)) + \'px\', }" ' +
		'>' +
		'<div class="option-bubble blinker" ' +
			'v-if="blinker" ' +
			'v-for="(fihpa, i) in associatedFihpas" ' +
			':style="{ ' +
				'animationDelay: (.9 * i) + \'s\', ' +
				'animationDuration: \'4s\', ' +
				'backgroundColor: fihpa.color, ' +
				'transform: \'translate(-50%, -50%) scale(\' + (.7 + (last(fihpa.intensities) / 20)) + \')\', ' +
			'}" ' +
			'>' +
		'</div>' +
		'<div class="option-bubble" ' +
			'v-if="!blinker" ' +
			'@click="optionSelected" ' +
			'@mouseenter="bubbleMouseover()" ' +
			'@mouseleave="bubbleMouseleave()" ' +
			':id="\'bubble-\' + $root.spacesToHyphens(option)" ' +
			':class="{ \'level-finished\': $root.isLevelFinished || (option == $root.blocking), }" ' +
			':style="{ ' +
				'transform: \'translate(-50%, -50%) rotate(\' + ((-180 / ($root.length(scenario.options) - 1)) * ind) + \'deg)\', ' +
			'}" ' +
			'>' +
			'<div class="option-name">{{ option }}</div>' +
		'</div>' +
	'</div>' +
	'',
	computed: {
		associatedFihpas: function() {
			var option = this.option;
			var associatedFihpas = [];
			var fihpas = this.scenario.fihpas;
			for (var key in fihpas) {
				var fihpa = fihpas[key];
				for (var affector in fihpa.affectors) {
					if (affector == option) {
						associatedFihpas.push(fihpa);
					}
				}
			}
			return associatedFihpas;
		}
	},
	methods: {
		last: function(arr) {
			return last(arr);
		},
		optionSelected: function($event) {
			var t = this;
			if (t.$root.blocking) { return; }
			if (t.$root.isLevelFinished) { return; }
			if (!t.$root.imagined) { return; }
			var option = t.option;

			t.$root.unstep(t.scenario);
			t.$root.blocking = option;
			setTimeout(function() {
				t.$root.blocking = false;
				t.$root.imagined = false;
				t.$root.step(t.scenario, option);
				if (t.$root.isLevelFinished) { return; }
				t.scenario.offsetXes.push($event.clientX - (document.documentElement.clientWidth / 2));
				t.scenario.offsetYes.push((document.documentElement.clientHeight - $event.clientY) - (document.documentElement.clientHeight - document.getElementById('options-box').getBoundingClientRect().height));
				t.$root.turn++;
				if (t.$root.isLevelFinished) {
					t.$root.showMessageBox();
				}
			}, 200);
		},
		bubbleMouseover: function() {
			if (this.$root.isLevelFinished) { return; }
			if (this.$root.blocking) { return; }
			this.$root.imagined = true;
			this.$root.step(this.scenario, this.option);
		},
		bubbleMouseleave: function() {
			if (this.$root.isLevelFinished) { return; }
			if (this.$root.blocking) { return; }
			if (!this.$root.imagined) { return; }
			this.$root.unstep(this.scenario);
			this.$root.imagined = false;
		},
	},
});

Vue.component('action-taken-line', {
	props: ['scenario', 'i', ], 
	data: function() {
		return {
			llHeight: 0,
			angle: this.$root.angleFromToB(this.scenario.offsetYes[this.i - 1], this.scenario.offsetXes[this.i - 1], this.scenario.offsetYes[this.i], this.scenario.offsetXes[this.i]),
			magnitude: 0,
		};
	},
	template: '' +
	'<div class="action-taken-line">' +
		'<div class="linking-line" ref="ll" ' +
			':style="{ ' +
				'right: (angle >= 0 && angle <= 180) ? 0 : null, ' +
				'backgroundColor: \'#444\', ' +
				'bottom: (scenario.offsetYes[i - 1] - 0) + \'px\', ' +
				'left: (scenario.offsetXes[i - 1] - 0) + \'px\', ' +
				'transformOrigin: \'bottom center\', ' +
				'transform: \'rotate(\' + angle + \'deg)\', ' +
				'height: magnitude + \'px\', ' +
				'opacity: Math.max(.1, 1 - ((scenario.offsetXes.length - i) * 0.1)), ' +
			'}" ' +
			'>' +
		'</div>' +
	'</div>' +
	'',
	computed: {
		doc: function() {
			return document;
		},
	},
	mounted: function() {
		var t = this;
		setTimeout(function() { t.magnitude = t.$root.distanceFromTo(t.scenario.offsetYes[t.i], t.scenario.offsetXes[t.i], t.scenario.offsetYes[t.i - 1], t.scenario.offsetXes[t.i - 1]) }, 100);
	},
});

Vue.component('analog-clock', {
	template: '' +
	'<div class="analog-clock">' +
		'<div class="hour-hand" ' +
			':style="{ ' +
				'transform: \'rotate(\' + ($root.turn * 30) + \'deg)\', ' +
			'}" ' +
			'>' +
		'</div>' +
		'<div class="minute-hand" ' +
			':style="{ ' +
				'transform: \'rotate(\' + (($root.turn - 1) * 360) + \'deg)\', ' +
			'}" ' +
			'>' +
		'</div>' +
	'</div>' +
	'',
	methods: {
		eval: function(exp) {
			return eval(exp);
		},
	},
});

Vue.component('options-box', {
	props: ['scenario', ],
	template: '' +
	'<div class="options-box a-box" id="options-box" :class="{ dim: $root.isLevelFinished, }" ' +
		'>' +
		'<table class="status-box" :style="{ top: ($root.frameTopHeight + 10) + \'px\', left: \'2px\', }">' +
			'<tr>' +
				'<td style="text-align: center;">' +
					'<img class="portrait" :src="\'images/portrait-\' + scenario.character.toLowerCase() + \'.png\'">' +
					'<div style="position: relative; top: -7px;">{{ scenario.character }}</div>' +
				'</td>' +
				'<td>' +
				'</td>' +
			'</tr>' +
		'</table>' +
		'<an-option ' +
			'v-for="(option, optionName, ind) in scenario.options" ' +
			':key="optionName" ' +
			':option="optionName" ' +
			':ind="ind" ' +
			':blinker="true" ' +
			':scenario="scenario" ' +
			':style="{ ' +
				'transform: \'rotate(\' + ((180 / ($root.length(scenario.options) - 1)) * ind) + \'deg)\', ' +
				'bottom: $root.optionBottom + \'px\', ' +
			'}" ' +
			'>' +
		'</an-option>' +
		'<an-option ' +
			'v-for="(option, optionName, ind) in scenario.options" ' +
			':key="optionName" ' +
			':option="optionName" ' +
			':ind="ind" ' +
			':blinker="false" ' +
			':scenario="scenario" ' +
			':style="{ ' +
				'transform: \'rotate(\' + ((180 / ($root.length(scenario.options) - 1)) * ind) + \'deg)\', ' +
				'bottom: $root.optionBottom + \'px\', ' +
			'}" ' +
			'>' +
		'</an-option>' +
		'<div class="center-base">' +
			'<action-taken-line ' +
				'v-for="(q, i) in scenario.offsetXes" ' +
				'v-if="i > 1" ' +
				':i="i" ' +
				':key="i" ' +
				':scenario="scenario" ' +
				'>' +
			'</action-taken-line>' +
			'<game-pawn ' +
				':style="{ ' +
					'left: (last(scenario.offsetXes) + 10) + \'px\', ' +
					'bottom: (last(scenario.offsetYes) - $root.optionBottom) + \'px\', ' +
				'}" ' +
				'>' +
			'</game-pawn>' +
		'</div>' +
	'</div>' +
	'',
	computed: {
		clientWidth: function() {
			return document.documentElement.clientWidth;
		},
	},
	methods: {
		last: function(arr) {
			return last(arr);
		},
	},
});

Vue.component('fihpa-line', {
	props: ['fihpa', 'imagined', 'scenario', ], 
	template: '' +
	'<div class="fihpa-line" ' +
		'@mouseenter="$root.selectedFihpa = fihpa" ' +
		'@mouseleave="$root.selectedFihpa = null" ' +
		'>' +
		'<div class="a-fihpa" ' +
			'v-for="(q, i) in fihpa.intensities" ' +
			':style="{ ' +
				'backgroundColor: fihpa.color, ' +
				'border: fihpa.main ? \'1px solid white\' : null, ' +
				'bottom: getBottom(q) + \'px\', ' +
				'left: (10 + getLeft(i) + ($root.fihpaSpanWidth / 2)) + \'px\', ' +
			'}" ' +
			'>' +
			'<div class="action-name" ' +
				'v-if="scenario.actionsTaken[i] && !($root.imagined && (i + 1) == scenario.actionsTaken.length) && isAffected(i)" ' +
				'v-show="$root.selectedFihpa == fihpa" ' +
				'>' +
				'{{ scenario.actionsTaken[i] }}' +
			'</div>' +
		'</div>' +
		'<div class="linking-line" ' +
			'v-for="(q, i) in fihpa.intensities" ' +
			'v-if="(i + 1) < fihpa.intensities.length" ' +
			':style="{ ' +
				'opacity: isAffected(i) ? 1 : .5,' +
				'zIndex: isAffected(i) ? 7 : 5,' +
				'background: ' +
					'($root.imagined && (i + 2) == fihpa.intensities.length) ? \'repeating-linear-gradient(0deg, \' + fihpa.color + \', \' + fihpa.color + \' 5px, rgba(0,0,0,0) 5px, rgba(0,0,0,0) 10px)\' : ' +
					'fihpa.main ? \'repeating-linear-gradient(45deg, \' + fihpa.color + \', \' + fihpa.color + \' 5px, #FFF 5px, #FFF 10px)\' : ' +
				        ' fihpa.color, ' +
				'bottom: getBottom(q) + \'px\', ' +
				'left: (10 + getLeft(i) + ($root.fihpaSpanWidth / 2)) + \'px\', ' +
				'transform: \'translateY(-2px) rotate(\' + $root.angleFromToB(getBottom(q), getLeft(i), getBottom(fihpa.intensities[i + 1]), getLeft(i + 1)) + \'deg)\', ' +
				'height: $root.distanceFromTo(getBottom(q), getLeft(i), getBottom(fihpa.intensities[i + 1]), getLeft(i + 1)) + \'px\', ' +
			'}" ' +
			'>' +
		'</div>' +
	'</div>' +
	'',
	methods: {
		isAffected: function(i) {
			return this.fihpa.intensities[i] > this.fihpa.intensities[i + 1];
		},
		getBottom: function(q) {
			return this.$root.getBottom(q);
		},
		getLeft: function(i) {
			return this.$root.getLeft(i);
		},
	},
});

Vue.component('fihpa-trajectory-icon', {
	props: ['fihpa', ], 
	template: '' +
	'<div class="fihpa-trajectory-icon trajectory-icon">' +
		'<div class="trajectory-icon-line" ' +
			':style="{ ' +
				'transform: \'rotate(\' + $root.angleFromToB(0, 0, (eval(fihpa.trajectory)), 11) + \'deg)\', ' +
				'height: $root.distanceFromTo(0, 0, (eval(fihpa.trajectory)), 11) + \'px\', ' +
			'}" ' +
			'>' +
		'</div>' +
	'</div>' +
	'',
	methods: {
		eval: function(exp) {
			return eval(exp);
		},
	},
});

Vue.component('action-trajectory-icon', {
	props: ['fihpa', 'action'], 
	template: '' +
	'<div class="action-trajectory-icon trajectory-icon">' +
		'<div class="trajectory-icon-line" ' +
			':style="{ ' +
				'transform: \'rotate(\' + $root.angleFromToB(trajectoryValue, 0, trajectoryValue, 11) + \'deg)\', ' +
				'height: $root.distanceFromTo(trajectoryValue, 0, trajectoryValue, 11) + \'px\', ' +
				'bottom: trajectoryValue + \'px\', ' +
			'}" ' +
			'>' +
		'</div>' +
	'</div>' +
	'',
	computed: {
		trajectoryValue: function() {
			var trajectoryValue = eval(this.fihpa.affectors[this.action].substring(1)) + 8;
			return trajectoryValue;
		},
	},
	methods: {
		eval: function(exp) {
			return eval(exp);
		},
	},
});

Vue.component('fihpas-box', {
	props: ['scenario', ],
	template: '' +
	//'<div class="fihpas-box a-box dim">' +
		'<div class="fihpas-chart" ' +
			':style="{ ' +
				'top: $root.fihpaChartTop + \'px\', ' +
				'height: $root.fihpaChartHeight + \'px\', ' +
			'}" ' +
			'>' +
			'<div class="fihpas-chart-gradient" style="background: linear-gradient(to top, rgba(0, 200, 0, 1) 0%, rgba(0, 100, 0, 0) 100%); bottom: 0;"></div>' +
			'<div class="fihpas-chart-gradient" style="background: linear-gradient(to bottom, rgba(200, 0, 0, 1) 0%, rgba(100, 0, 0, 0) 100%); top: 0;"></div>' +
			'<div class="center-base">' +
				'<div class="vertical-bar" :style="{ left: ($root.fihpaSpanWidth / -2) + \'px\', }"></div>' +
				'<div class="vertical-bar" :style="{ left: ($root.fihpaSpanWidth / 2) + \'px\', }"></div>' +
				'<div class="enough-range" v-if="$root.level.enough" ' +
				':style="{ ' +
					'width: (12 + $root.fihpaSpanWidth) + \'px\', ' +
					'left: (($root.fihpaSpanWidth / -2) - 5) + \'px\', ' +
					'height: $root.getBottom($root.level.enough) + \'px\', ' +
				'}"></div>' +
				'<div class="view-limiter" ' +
					':style="{ ' +
						'height: \'100%\', ' +
						'left: ($root.getLeft(0) - 10) + \'px\', ' +
						'width: (16 + $root.getLeft(scenario.actionsTaken.length) + ($root.fihpaSpanWidth / 2)) + \'px\', ' +
					'}" ' +
					'>' +
					'<fihpa-line ' +
						'v-for="(fihpa, key) in scenario.fihpas" ' +
						':key="key" ' +
						':fihpa="fihpa" ' +
						':scenario="scenario" ' +
						'>' +
					'</fihpa-line>' +
				'</div>' +
				/*'<div v-for="fihpa in scenario.fihpas">' +
					'<div class="reference-line" ' +
						'v-if="scenario.actionsTaken[i] && !($root.imagined && (i + 1) == scenario.actionsTaken.length)" ' +
						'v-for="(q, i) in fihpa.intensities" ' +
						':style="{ ' +
							'bottom: $root.getBottom(q) + \'px\', ' +
							'left: (10 + $root.getLeft(i) + ($root.fihpaSpanWidth / 2)) + \'px\', ' +
							'transform: \'translateY(-2px) rotate(\' + $root.angleFromToB($root.getBottom(q), $root.getLeft(i), 70, 70) + \'deg)\', ' +
							'height: $root.distanceFromTo($root.getBottom(q), $root.getLeft(i), 70, 70) + \'px\', ' +
						'}" ' +
						'>' +
					'</div>' +
				'</div>' +*/
				'<div class="fihpa-name" ' +
					'v-for="(fihpa, key) in scenario.fihpas" ' +
					'v-if="!fihpa.main" ' +
					':style="{ ' +
						'bottom: (scenario.fihpaNameDistribution[key].bottom - 6) + \'px\', ' +
						'left: ($root.getLeft(fihpa.intensities.length - 1) + 8) + \'px\', ' +
					'}" ' +
				'>{{ key }}</div>' +
				'<div class="current-time" ' +
					'v-for="ind in (1 + $root.turn)" ' +
					':style="{ ' +
						'left: $root.getLeft(ind - 1) + \'px\', ' +
						'top: \'-18px\', ' +
					'}" ' +
					'>' +
					'{{ $root.turnToTime(ind - 1) }}' +
				'</div>' +
			'</div>' +
		'</div>' +
		/*'<table class="fihpas-legend" ' +
			':style="{ ' +
				'top: ($root.fihpaChartHeight + $root.fihpaChartTop) + \'px\', ' +
			'}" ' +
			'>' +
			'<tr class="fihpa-legend-entry" ' +
				'v-for="(fihpa, key) in scenario.fihpas" ' +
				'>' +
				'<td><fihpa-trajectory-icon v-if="fihpa.trajectory" :fihpa="fihpa"></fihpa-trajectory-icon></td>' +
				'<td>' +
					'<div class="a-fihpa" ' +
						':style="{ ' +
							'position: \'static\', ' +
							'display: \'inline-block\', ' +
							'transform: \'none\', ' +
							'backgroundColor: fihpa.color, ' +
							'border: \'1px solid black\', ' +
							'margin: \'2px\', ' +
						'}" ' +
						'></div>' +
				'</td>' +
				'<td>{{ key }}</td>' +
				'<td style="white-space: nowrap;">' +
					'<span v-for="(impact, affector, ind) in fihpa.affectors">{{ affector }} <action-trajectory-icon :fihpa="fihpa" :action="affector"></action-trajectory-icon>' +
						'<span v-if="ind + 1 < length(fihpa.affectors)">, </span>' +
					'</span>' +
					'<span v-if="fihpa.calculation">{{ calculationToEnglish(fihpa.calculation) }}</span>' +
				'</td>' +
			'</tr>' +
		'</table>' +*/
	//'</div>' +
	'',
	methods: {
		document: function() {
			return document;
		},
		calculationToEnglish: function(calculation) {
			if (calculation == 'currAvg') {
				return 'the average of the other values';
			} else {
				return 'collecting rocks decreases the sense of "want"';
			}
		},
		currentIntensity: function(fihpa) {
			return last(fihpa.intensities);
		},
		length: function(obj) {
			var i = 0;
			for (var key in obj) {
				i++;
			}
			return i;
		},
	},
});

Vue.component('stuff-box', {
	props: ['scenario', ],
	template: '' +
	'<div class="stuff-box" id="stuff-box" ' +
		'v-if="$root.length(scenario.stuff[0]) > 0" ' +
		':style="{' +
			'position: \'relative\', ' +
			'width: $root.fihpaSpanWidth + \'px\', ' +
			'left: \'50vw\', ' +
			'transform: \'translateX(-50%)\', ' +
		'}" ' +
		'>' +
		'<div style="font-weight: bold;">{{ scenario.character }}\'s stuff</div>' +
		'<table>' +
			'<tr v-for="(quantity, key) in stuff">' +
				'<td>{{ key }}</td>' +
				'<td><img class="stuff" :src="\'images/rock1.png\'">x{{ quantity }}</td>' +
			'</tr>' +
		'</table>' +
	'</div>' +
	'',
	computed: {
		stuff: function() {
			return last(this.scenario.stuff);
		},
	},
});

Vue.component('message-box', {
	template: '' +
	'<div class="message-box" ' +
		'@click="$root.showMessageBox()" ' +
		':style="{ ' +
			'top: ($root.frameTopHeight + 30) + \'px\', ' +
			'right: $root.messageBoxHidden ? (-$root.messageBoxWidth - 10) + \'px\' : 0, ' +
			'cursor: $root.messageBoxHidden ? \'pointer\' : \'auto\', ' +
		'}" ' +
		'>' +
		'<div class="message-box-toggle" @click.stop="$root.toggleMessageBox()">{{ $root.messageBoxHidden ? \'&#9664;\' : \'\' }}</div>' +
		'<h3>{{ $root.level.name }}</h3>' +
		'<div class="paragraph" v-if="!$root.isLevelFinished">' +
			'{{ $root.level.instructions }}' +
			'\n\n' +
			//'{{ $root.debug ? $root.intensities : \'\' }}' +
			'<div class="button" @click.stop.stop="$root.hideMessageBox()">Got it</div>' +
		'</div>' +
		'<div class="paragraph" v-if="$root.isLevelFinished">' +
			'{{ $root.level.success($root) ? \'&#9989; \' + $root.level.successMessage() : \'&#x274C; \' + $root.level.failureMessage() }}' +
			'\n\n' +
			'<div class="button" @click.stop="$root.goToLevel(1)">{{ $root.level.continueButton }}</div>' +
			'<div class="button" @click.stop="$root.hideMessageBox(); $root.goToLevel(0);">{{ $root.level.retryButton }}</div>' +
		'</div>' +
	'</div>' +
	'',
});

Vue.component('empty-box', {
	template: '' +
	'<div class="empty-box a-box" :class="{ dim: true, }">' +
	'</div>' +
	'',
});

Vue.component('stuff-animated', {
	template: '' +
	'<div class="stuff-animated stuff">' +
		'<img class="stuff" ' +
			'src="images/rock1.png" ' +
		'>' +
	'</div>' +
	'',
});

Vue.component('game-pawn', {
	template: '' +
	'<div class="game-pawn">' +
		'<div class="game-pawn-head"></div>' +
		'<div class="game-pawn-body"></div>' +
	'</div>' +
	'',
});

Vue.component('game-frame', {
	template: '' +
	'<div class="game-frame">' +
		'<div class="game-frame-horizontal-hanger">' +
			'<div class="game-frame-top" style="border-bottom: 1px solid #324A82;" :style="{ height: $root.frameTopHeight + \'px\', }"></div>' +
			'<div style="border-bottom-right-radius: 10px; border: 1px solid #324A82; width: 80px; height: 24px; background-color: #CAD8F2;"></div>' +
		'</div>' +
		'<div class="game-frame-vertical-hanger">' +
			'<div class="game-frame-top" :style="{ height: $root.frameTopHeight + \'px\', }">' +
				'<span style="font-size: 10px; position: relative; left: 90px;">PLAY | DESIGN</span>' +
				'<div v-if="!$root.isLevelFinished" class="turn-box">Turn {{ $root.turn }} of {{ $root.level.turns }}</div>' +
				'<analog-clock></analog-clock>' +
			'</div>' +
			'<div style="border-bottom-right-radius: 10px; text-align: center; line-height: 24px; color: #337; text-shadow: 1px 1px 1px white; width: 80px; height: 24px; background-color: #CAD8F2; font-size: 16px; font-family: \'Palatino Linotype\';"><div style="position: relative; top: -2px;"><span style="font-size: 24px; display: inline-block; position: relative; top: 2px;">F</span>ihpa</div></div>' +
		'</div>' +
	'</div>' +
	'',
});

Vue.component('game-viewer', {
	template: '' +
	'<div class="game-viewer">' +
		'<div class="scenario-container" v-for="scenario in $root.scenarios">' +
			'<options-box :scenario="scenario"></options-box>' +
			'<fihpas-box :scenario="scenario"></fihpas-box>' +
			'<stuff-box :scenario="scenario"></stuff-box>' +
		'</div>' +
		'<game-frame></game-frame>' +
		'<message-box></message-box>' +
		'<stuff-animated ' +
			'v-if="$root.stuffAcquired" ' +
			':style="{ ' +
				'left: ($root.stuffLeft) + \'px\', ' +
				'bottom: ($root.stuffBottom) + \'px\', ' +
			'}" ' +
			'>' +
		'</stuff-animated>' +
	'</div>' +
	'',
});

var app = new Vue({
	el: '#app',
    data: {
	    debug: false,
	    formatter: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', }),
	    imagined: true,
	    blocking: false,
	    messageBoxWidth: 200,
	    messageBoxHidden: false,
	    turn: 1,
	    levelIndex: 1,
	    frameTopHeight: 20,
	    fihpaNameMinDistance: 10,
	    fihpaChartTop: 0,
	    fihpaChartHeight: 200,
	    fihpaSpanWidth: 300,
	    selectedFihpa: null,
	    optionBottom: 35,
	    stuffAcquired: false,
	    stuffAnimated: false,
    	    levels: [
		{},
		{
			scenarios: ['Tyler', ],
    			name: 'Getting started',
			instructions: 'Tyler is hungry and bored. Click the action bubbles to help him out.',
    			success: function($root) { return true; },
    			successMessage: function() { return 'You can see that the actions you chose affected Tyler\'s hunger and boredom levels.\n\n' +
					'When Tyler eats, his hunger goes down.\n\n' +
					'When Tyler does something fun (like drawing, watching TV, or visiting a friend) his boredom goes down.'; },
    			failureMessage: 'n/a',
    			continueButton: 'Got it',
    			retryButton: 'Try again',
		},
		{
		scenarios: ['Tyler', ],
    			name: 'Comparing outcomes',
			instructions: 'Is it better to play and be hungry or eat and be bored? What if we just take the average of Tyler\'s hunger and boredom?\n\n' +
					'The red line here shows that average. The lower the red line, the more satisfied Tyler is.',
    			success: function($root) { return true; },
    			successMessage: function() { return 'Since the red line is the average of Tyler\'s hunger and boredom, it acts as a representation of his overall satisfaction level.\n\n' +
					''; },
    			failureMessage: 'n/a',
    			continueButton: 'Got it',
    			retryButton: 'Try again',
			addOns: ['CurrAvgOverall', ],
		},
		/*{
		scenarios: ['Tyler', ],
    			name: 'Setting a goal',
			instructions: 'Since we have the red line to measure Tyler\'s overall state, we can use that to set a goal.\n\n' +
					'See if you can finish the level with the red line within the "enough" range.',
			enough: -1.5,
    			success: function($root) { return last($root.scenario.fihpas['OVERALL'].intensities) <= $root.level.enough; },
    			successMessage: function() { return 'You did it! You can see that your red line ended up within the "enough" range.'; },
    			failureMessage: function() { return 'Not quite...your red line didn\'t finish up within the "enough" range.'; },
    			continueButton: 'Continue',
    			retryButton: 'Try again',
			turns: 6,
			startHour: 8,
			turnIncrement: 2,
			addOns: ['CurrAvgOverall', ],
		},*/
		/*{
		  scenarios: ['Tyler', ],
    			name: 'Moods',
			instructions: 'Sometimes you\'re just in a good mood or a bad mood and there\'s nothing you can do about it.\n\n' +
					'Tyler\'s in a good mood today, and that\'s going to help his overall sense of satisfaction.',
			enough: -1.5,
    			success: function($root) { return last($root.scenario.fihpas['OVERALL'].intensities) <= $root.level.enough; },
    			successMessage: function() { return 'You did it! You can see that your red line ended up within the "enough" range.'; },
    			failureMessage: function() { return 'Not quite...your red line didn\'t finish up within the "enough" range.'; },
    			continueButton: 'Continue',
    			retryButton: 'Try again',
			addOns: ['TylerGoodMood', 'CurrAvgOverall', ],
		},
		{
		scenarios: ['Tyler', ],
    			name: 'Resetting expectations',
			instructions: 'When you can\'t get to a happy place it can be helpful to set more realistic expectations.\n\n' +
					'Tyler\'s in a bad mood today. His overall satisfaction can\'t get down to green, so we\'ll move the "enough" target up into the red.',
			enough: 3.5,
    			success: function($root) { return last($root.scenario.fihpas['OVERALL'].intensities) <= $root.level.enough; },
    			successMessage: function() { return 'You did it! You can see that your red line ended up within the "enough" range.'; },
    			failureMessage: function() { return 'Not quite...your red line didn\'t finish up within the "enough" range.'; },
    			continueButton: 'Continue',
    			retryButton: 'Try again',
			addOns: ['TylerBadMood', 'CurrAvgOverall', ],
		},*/
		/*{
		  scenarios: ['Tyler', ],
    			name: 'Getting stuff',
			instructions: 'Some feelings are tied to things rather than actions.\n\n' +
					'Tyler likes collecting rocks.',
			enough: -1.5,
    			success: function($root) { return last($root.scenario.fihpas['OVERALL'].intensities) <= $root.level.enough; },
    			successMessage: function() { return 'You did it! You can see that your red line ended up within the "enough" range.'; },
    			failureMessage: function() { return 'Not quite...your red line didn\'t finish up within the "enough" range.'; },
    			continueButton: 'Continue',
    			retryButton: 'Try again',
			addOns: ['TylerCollecting', 'CurrAvgOverall', ],
		},*/
		/*{
		  scenarios: ['Athena', ],
    			name: 'Incremental satisfaction',
			instructions: 'Athena is Tyler\'s sister. Her interests are different from Tyler\'s.\n\n' +
					'See if you can help her be happy.',
			enough: -1.5,
    			success: function($root) { return last($root.scenario.fihpas['OVERALL'].intensities) <= $root.level.enough; },
    			successMessage: function() { return 'You did it! You can see that your red line ended up within the "enough" range.'; },
    			failureMessage: function() { return 'Not quite...your red line didn\'t finish up within the "enough" range.'; },
    			continueButton: 'Continue',
    			retryButton: 'Try again',
			addOns: ['CurrAvgOverall', ],
		},*/
		/*{
			scenarios: ['Tyler', 'Athena'],
    			name: 'Two people',
			instructions: 'Athena is Tyler\'s sister.\n\n' +
					'See if you can help them both be happy.',
			enough: -1.5,
    			success: function($root) { return last($root.scenario.fihpas['OVERALL'].intensities) <= $root.level.enough; },
    			successMessage: function() { return 'You did it! You can see that your red line ended up within the "enough" range.'; },
    			failureMessage: function() { return 'Not quite...your red line didn\'t finish up within the "enough" range.'; },
    			continueButton: 'Continue',
    			retryButton: 'Try again',
			addOns: ['TylerCollecting', 'CurrAvgOverall', ],
		},*/
	    ],
	    scenarios: [{}],
	    scenarioOptions: {
		'Tyler': {
			character: 'Tyler',
			options: {'eat': null, 'draw': null, 'watch TV': null, 'visit a friend': null, 'do chores': null, 'do nothing': null, },
			fihpas: {
				'hunger': { color: '#FF0', neg: 'hungry', pos: 'full', startingIntensity: 4, trajectory: '+2', affectors: {'eat': '=-4', }, }, 
				'boredom': { color: '#0FF', neg: 'bored', pos: 'entertained', startingIntensity: -2, trajectory: '+5', affectors: {'draw': '=-4', 'watch TV': '=-4', 'visit a friend': '=-4', }, }, 
				//'creativity': { color: '#F0F', startingIntensity: 3, trajectory: '+2', affectors: {'draw': '-2', }}, 
				//'fitness': { color: '#0F0', startingIntensity: 2, trajectory: '+1', affectors: {'gym': '-3', }}, 
			},
		},
		'Athena': {
			character: 'Athena',
			options: {'eat': null, 'draw': null, 'check Instagram': null, 'visit a friend': null, 'do chores': null, 'do nothing': null, 'take a nap': null },
			fihpas: {
				'sociality': { color: '#0FA', startingIntensity: -2, trajectory: '+2', affectors: {'check Instagram': '-1', 'visit a friend': '-4', }, }, 
				'productivity': { color: '#F0A', startingIntensity: 3, trajectory: '+2', affectors: {'draw': '-2', 'do chores': '-4', }}, 
				'tiredness': { color: '#AFF', startingIntensity: 5, trajectory: '+1', affectors: {'check Instagram': '-1', 'do nothing': '-1', 'take a nap': '-6', }}, 
			},
		},
		/*'Kayla': {
			character: 'Kayla',
			options: {
				'buy coffee': { effect: function(stuff) { stuff.coffee++; }, }, 
				'drink coffee': { canDo: function(stuff) { return stuff.coffee > 0; }, effect: function(stuff) { stuff.coffee--; }, }, 
				'buy a book': { effect: function(stuff) { stuff['unread books']++; }, }, 
				'read a book': { effect: function(stuff) { if (stuff['unread books'] > 0) { stuff['unread books']--; stuff['read books']++; } }, }
			},
			stuff: { coffee: 0, 'unread books': 0, 'read books': 1, },
			fihpas: {
				'tiredness': { color: '#F0F', neg: 'tired', pos: 'alert', startingIntensity: 2, trajectory: '+2', affectors: {'eat': '=-4', }, }, 
				'curiosity': { color: '#0AA', neg: 'curious', pos: 'entertained', startingIntensity: -4, trajectory: '+5', affectors: {'draw': '=-4', 'watch TV': '=-4', 'visit a friend': '=-4', }, }, 
			},
		},*/
	    },
	    addOns: {
		    'CurrAvgOverall': {
			    fihpas: {
				    'OVERALL': { color: '#F00', calculation: 'currAvg', affectors: {}, main: true, },
			    }
		    },
		    'TylerCollecting': {
			    options: {
				    'pick up a rock': { effect: function(stuff) { stuff.rocks++; }, }, 
			    },
			    stuff: { rocks: 2, },
			    fihpas: {
				    'want': { color: '#F0F', neg: 'lacking', pos: 'enough', calculation: function(scenario, stuff) { return -2 - (2 * stuff.rocks); }, }, 
			    }
		    },
		    'TylerGoodMood': {
			    fihpas: {
				    'good mood': { color: '#FA0', startingIntensity: -8.5, trajectory: '+0', affectors: {}, }, 
			    }
		    },
		    'TylerBadMood': {
			    fihpas: {
				    'bad mood': { color: '#FA0', startingIntensity: 8.5, trajectory: '+0', affectors: {}, }, 
			    }
		    },
	    },
    },
    computed: {
	    stuffLeft: function() { 
		    return this.stuffAnimated ? 
			    document.getElementById('stuff-box').getBoundingClientRect().left + 40 : 
			    (this.last(this.offsetXes) - 10) + (document.documentElement.clientWidth / 2);
	    },
	    stuffBottom: function() { 
		    return this.stuffAnimated ? 
			    (document.documentElement.clientHeight - document.getElementById('stuff-box').getBoundingClientRect().top) - 10 : 
			    this.last(this.offsetYes) + (document.documentElement.clientHeight - document.getElementById('options-box').getBoundingClientRect().height);
	    },
	    level: function() {
		    var level = this.levels[this.levelIndex];
		    if (typeof level.turns == 'undefined') { level.turns = 6; }
		    return level;
	    },
	    isLevelFinished: function() {
		    return this.turn >= this.level.turns;
	    },
    },
    methods: {
	    log: function(msg) {
		    console.log(msg);
	    },
	    last: function(arr) {
		    return last(arr);
	    },
	    spacesToHyphens: function(str) {
		    return str.replace(/ /g, '-');
	    },
	    length: function(obj) {
		    var i = 0;
		    for (var key in obj) {
			    i++;
		    }
		    return i;
	    },
	    turnToTime: function(turn) {
		    var startHour = this.level.startHour || 12;
		    var turnIncrement = this.level.turnIncrement || 1;
		    var d = new Date(new Date().setHours(startHour, 0, 0, 0));
		    d.addHours(turn * turnIncrement);
		    return (d.getHours() % 12 == 0 ? 12 : d.getHours() % 12) + ':' + (d.getMinutes() + '').padStart(2, '0');
	    },
	    showMessageBox: function() {
		    this.messageBoxHidden = false;
	    },
	    hideMessageBox: function() {
		    this.messageBoxHidden = true;
	    },
	    toggleMessageBox: function() {
		    this.messageBoxHidden = !this.messageBoxHidden;
	    },
	    goToLevel: function(indexDelta) {
		    var t = this;
		    t.levelIndex += indexDelta;
		    var level = t.levels[t.levelIndex];

		    t.turn = 0;
		    t.scenarios = [];
		    level.scenarios.forEach(function(scenarioName) {
			    var scenario = clone(t.scenarioOptions[scenarioName]);
			    if (level.addOns) {
				    level.addOns.forEach(function(addOnName) {
					    var addOn = t.addOns[addOnName];
					    for (var addOnType in addOn) {
						    for (var addOnTypeMember in addOn[addOnType]) {
							    var addOnData = clone(addOn[addOnType][addOnTypeMember]);
							    if (typeof scenario[addOnType] == 'undefined') {
								    Vue.set(scenario, addOnType, {});
							    }
							    scenario[addOnType][addOnTypeMember] = addOnData;
						    }
					    }
				    });
			    }
			    scenario.stuff = scenario.stuff ? [scenario.stuff] : [{}];
			    scenario.offsetXes = [-2, ];
			    scenario.offsetYes = [50, ];
			    scenario.actionsTaken = [];
			    scenario.fihpaNameDistribution = {};

			    t.scenarios.push(scenario);
			    t.step(scenario);
			    t.setUpFihpaNameDistribution(scenario);
		    });
	    },
	    getBottom: function(q) {
		    var bottom = ((this.fihpaChartHeight / 100) * q * 5) + (this.fihpaChartHeight / 2);
		    return bottom;
	    },
	    getLeft: function(i) {
		    var left = i * (this.fihpaSpanWidth / this.level.turns) - (.5 * this.fihpaSpanWidth);
		    return left;
	    },
	    collides: function(fihpa, otherFihpa) {
		    return Math.abs(fihpa.bottom - otherFihpa.bottom) < this.fihpaNameMinDistance;
	    },
	    affectingActions: function(fihpa) {
		    var affectingActions = [];
		    for (var key in fihpa.affectors) {
			    affectingActions.push(key);
		    }
		    return affectingActions;
	    },
	    getCollidingFihpas: function(keys, fihpaNameDistribution) {
		    var t = this;
		    var keysCopy = clone(keys);
		    keys.forEach(function(key) {
			    var fihpa = fihpaNameDistribution[key];
			    for (var k in fihpaNameDistribution) {
				    var otherFihpa = fihpaNameDistribution[k];
				    if (t.collides(fihpa, otherFihpa)) {
					    pushUnique(keysCopy, k);
				    }
			    }
		    });
		    if (keys.length != keysCopy.length) {
			    return t.getCollidingFihpas(keysCopy);
		    } else {
			    return keys;
		    }
	    },
	    setUpFihpaNameDistribution: function(scenario) {
		    var t = this;
		    var fihpas = scenario.fihpas;

		    // assign each fihpa a natural bottom
		    for (var key in fihpas) {
			    var fihpa = fihpas[key];
			    scenario.fihpaNameDistribution[key] = { bottom: t.getBottom(last(fihpa.intensities)), };
		    }

		    // assign each fihpa a cluster number & track the cluster stats
		    clusterNumber = 1;
		    var clusters = {};
		    for (var key in scenario.fihpaNameDistribution) {
			    fihpa = scenario.fihpaNameDistribution[key];
			    if (!fihpa.cluster) {
				    clusters[clusterNumber] = { max: -Infinity, min: Infinity, count: 0, fihpas: [] };
				    var collidingFihpaKeys = t.getCollidingFihpas([key], scenario.fihpaNameDistribution);
				    collidingFihpaKeys.forEach(function(k) {
					    var collidingFihpa = scenario.fihpaNameDistribution[k];
					    collidingFihpa.cluster = clusterNumber;
					    clusters[clusterNumber].max = Math.max(clusters[clusterNumber].max, collidingFihpa.bottom);
					    clusters[clusterNumber].min = Math.min(clusters[clusterNumber].min, collidingFihpa.bottom);
					    pushUnique(clusters[clusterNumber].fihpas, collidingFihpa);
					    clusters[clusterNumber].count++;
				    });
				    clusters[clusterNumber].median = (clusters[clusterNumber].max + clusters[clusterNumber].min) / 2;
				    clusters[clusterNumber].fihpas.sort(function(a, b) { return a.bottom - b.bottom; });
				    clusterNumber++;
			    }
		    }

		    // reassign bottoms for each cluster
		    for (var key in clusters) {
			    var cluster = clusters[key];
			    var bottomest = cluster.median - ((cluster.fihpas.length - 1) * (t.fihpaNameMinDistance / 2));
			    cluster.fihpas.forEach(function(fihpa, ind) {
				    fihpa.bottom = bottomest + (ind * t.fihpaNameMinDistance);
			    });
		    }
	    },
	    step: function(scenario, optionSelected) {
		    var t = this;
		    if (optionSelected) { 
			    scenario.actionsTaken.push(optionSelected); 
			    scenario.stuff.push(clone(last(scenario.stuff)));
			    if (scenario.options[optionSelected].effect) { 
				    scenario.options[optionSelected].effect(last(scenario.stuff)); 
				    if (!t.imagined) {
					    t.stuffAcquired = true;
					    setTimeout(function() { t.stuffAnimated = true; }, 500);
					    setTimeout(function() { t.stuffAcquired = false; t.stuffAnimated = false; }, 1000);
				    }
			    }
		    }
		    for (var key in scenario.fihpas) {
			    var fihpa = scenario.fihpas[key];
			    if (typeof fihpa.intensities == 'undefined') { Vue.set(fihpa, 'intensities', []); }
			    var isAffected = false;
			    var fihpaNextIntensity = 0;
			    if (fihpa.intensities.length == 0 && typeof fihpa.startingIntensity == 'number') {
				    fihpaNextIntensity = fihpa.startingIntensity;
			    } else {
				    for (var affector in fihpa.affectors) {
					    if (affector == optionSelected) {
						    isAffected = true;
						    var impact = fihpa.affectors[affector];
						    if (impact[0] == '=') {
							    fihpaNextIntensity = eval(impact.substr(1));
						    } else {
							    fihpaNextIntensity = last(fihpa.intensities) + eval(impact);
						    }
					    }
				    }
				    if (!isAffected) {
					    if (fihpa.trajectory) {
						    fihpaNextIntensity = last(fihpa.intensities) + eval(fihpa.trajectory);
					    } else if (fihpa.calculation) {
						    var calculation = fihpa.calculation;
						    if (calculation == 'currAvg') {
							    var otherIntensities = [];
							    for (var k in scenario.fihpas) {
								    if (k != key) {
									    var otherFihpa = scenario.fihpas[k]
									    otherIntensities.push(last(otherFihpa.intensities));
								    }
							    }
							    fihpaNextIntensity = otherIntensities.reduce(function(acc, cur) { return acc + cur }, 0) / (otherIntensities.length);
						    } else if (calculation == 'avg') {
							    var otherIntensities = [];
							    for (var k in scenario.fihpas) {
								    if (k != key) {
									    var otherFihpa = scenario.fihpas[k]
									    otherIntensities = otherIntensities.concat(otherFihpa.intensities);
								    }
							    }
							    fihpaNextIntensity = otherIntensities.reduce(function(acc, cur) { return acc + cur }, 0) / (otherIntensities.length);
						    } else if (typeof calculation == 'function') {
							    fihpaNextIntensity = calculation(scenario, last(scenario.stuff));
						    }
					    }
				    }
			    }
			    fihpa.intensities.push(Math.min(9, Math.max(-9, fihpaNextIntensity)));
		    }
		    t.setUpFihpaNameDistribution(scenario);
	    },
	    unstep: function(scenario) {
		    var t = this;
		    scenario.actionsTaken.pop();
		    scenario.stuff.pop();
		    for (var key in scenario.fihpas) {
			    var fihpa = scenario.fihpas[key];
			    fihpa.intensities.pop();
		    }
		    t.setUpFihpaNameDistribution(scenario);
	    },
	    distanceFromTo: function(originTop, originLeft, targetTop, targetLeft) {
		    var a = originTop - targetTop;
		    var b = originLeft - targetLeft;
		    return Math.sqrt((a * a) + (b * b));
	    },
	    angleFromTo: function(originTop, originLeft, targetTop, targetLeft) {
		    return (90 + (Math.atan2(targetTop - originTop, targetLeft - originLeft) * 180 / Math.PI));
	    },
	    angleFromToB: function(originBottom, originLeft, targetBottom, targetLeft) {
		    return (90 + (Math.atan2(originBottom - targetBottom, targetLeft - originLeft) * 180 / Math.PI));
	    },
    },
    created: function() {
	    this.goToLevel(0);
	    //this.setUpFihpaNameDistribution({});
    },
    watch: {
    },
});
