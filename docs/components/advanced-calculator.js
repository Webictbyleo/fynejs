// Advanced Calculator (extracted)
XTool.registerComponent({
  name: 'advanced-calculator',
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Advanced Calculator</h3>
      <div class="bg-gray-900 text-white p-4 rounded-lg mb-4">
        <div class="text-right">
          <div class="text-sm text-gray-400 min-h-[20px]" x-text="previousOperand + ' ' + operation"></div>
            <div class="text-2xl font-mono" x-text="currentOperand || '0'"></div>
        </div>
      </div>
      <div x-if="history.length > 0" class="mb-4">
        <div class="text-sm text-gray-600 mb-2">History:</div>
        <div class="max-h-20 overflow-y-auto text-xs space-y-1">
          <div x-for="entry in history.slice(-3)" class="text-gray-500" x-text="entry"></div>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <button x-on:click="clear" class="calc-btn bg-red-500 hover:bg-red-600 text-white">C</button>
        <button x-on:click="clearEntry" class="calc-btn bg-yellow-500 hover:bg-yellow-600 text-white">CE</button>
        <button x-on:click="backspace" class="calc-btn bg-gray-500 hover:bg-gray-600 text-white">⌫</button>
        <button x-on:click="operate('/')" class="calc-btn bg-blue-500 hover:bg-blue-600 text-white">÷</button>
        <button x-on:click="inputNumber('7')" class="calc-btn">7</button>
        <button x-on:click="inputNumber('8')" class="calc-btn">8</button>
        <button x-on:click="inputNumber('9')" class="calc-btn">9</button>
        <button x-on:click="operate('*')" class="calc-btn bg-blue-500 hover:bg-blue-600 text-white">×</button>
        <button x-on:click="inputNumber('4')" class="calc-btn">4</button>
        <button x-on:click="inputNumber('5')" class="calc-btn">5</button>
        <button x-on:click="inputNumber('6')" class="calc-btn">6</button>
        <button x-on:click="operate('-')" class="calc-btn bg-blue-500 hover:bg-blue-600 text-white">−</button>
        <button x-on:click="inputNumber('1')" class="calc-btn">1</button>
        <button x-on:click="inputNumber('2')" class="calc-btn">2</button>
        <button x-on:click="inputNumber('3')" class="calc-btn">3</button>
        <button x-on:click="operate('+')" class="calc-btn bg-blue-500 hover:bg-blue-600 text-white">+</button>
        <button x-on:click="inputNumber('0')" class="calc-btn col-span-2">0</button>
        <button x-on:click="inputDecimal" class="calc-btn">.</button>
        <button x-on:click="equals" class="calc-btn bg-orange-500 hover:bg-orange-600 text-white">=</button>
        <button x-on:click="sqrt" class="calc-btn bg-purple-500 hover:bg-purple-600 text-white text-sm">√</button>
        <button x-on:click="square" class="calc-btn bg-purple-500 hover:bg-purple-600 text-white text-sm">x²</button>
        <button x-on:click="percent" class="calc-btn bg-purple-500 hover:bg-purple-600 text-white text-sm">%</button>
        <button x-on:click="reciprocal" class="calc-btn bg-purple-500 hover:bg-purple-600 text-white text-sm">1/x</button>
        <button x-on:click="negate" class="calc-btn bg-purple-500 hover:bg-purple-600 text-white text-sm">±</button>
        <button x-on:click="clearHistory" class="calc-btn bg-gray-400 hover:bg-gray-500 text-white text-xs col-span-3">Clear History</button>
      </div>
      <style>
        .calc-btn { @apply px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded font-medium text-center transition-colors duration-150; }
      </style>
    </div>
  `,
  data: { currentOperand: '0', previousOperand: '', operation: '', waitingForOperand: false, history: [] },
  methods: {
    inputNumber(number) { if (this.waitingForOperand) { this.currentOperand = number; this.waitingForOperand = false; } else { this.currentOperand = this.currentOperand === '0' ? number : this.currentOperand + number; } },
    inputDecimal() { if (this.waitingForOperand) { this.currentOperand = '0.'; this.waitingForOperand = false; } else if (this.currentOperand.indexOf('.') === -1) { this.currentOperand += '.'; } },
    clear() { this.currentOperand = '0'; this.previousOperand = ''; this.operation = ''; this.waitingForOperand = false; },
    clearEntry() { this.currentOperand = '0'; },
    backspace() { if (!this.waitingForOperand && this.currentOperand.length > 1) { this.currentOperand = this.currentOperand.slice(0, -1); } else { this.currentOperand = '0'; } },
    operate(nextOperation) { const inputValue = parseFloat(this.currentOperand); if (this.previousOperand === '') { this.previousOperand = inputValue; } else if (this.operation) { const previousValue = parseFloat(this.previousOperand); const newValue = this.calculate(previousValue, inputValue, this.operation); this.currentOperand = `${parseFloat(newValue.toFixed(7))}`; this.previousOperand = this.currentOperand; } this.waitingForOperand = true; this.operation = nextOperation; },
    equals() { const inputValue = parseFloat(this.currentOperand); const previousValue = parseFloat(this.previousOperand); if (this.operation && !this.waitingForOperand) { const newValue = this.calculate(previousValue, inputValue, this.operation); const calculation = `${this.previousOperand} ${this.operation} ${this.currentOperand} = ${newValue}`; this.history.unshift(calculation); if (this.history.length > 10) this.history.pop(); this.currentOperand = `${parseFloat(newValue.toFixed(7))}`; this.previousOperand = ''; this.operation = ''; this.waitingForOperand = true; } },
    calculate(firstOperand, secondOperand, operation) { switch (operation) { case '+': return firstOperand + secondOperand; case '-': return firstOperand - secondOperand; case '*': return firstOperand * secondOperand; case '/': return firstOperand / secondOperand; default: return secondOperand; } },
    sqrt() { const value = parseFloat(this.currentOperand); const result = Math.sqrt(value); this.history.unshift(`√${value} = ${result}`); this.currentOperand = `${parseFloat(result.toFixed(7))}`; },
    square() { const value = parseFloat(this.currentOperand); const result = value * value; this.history.unshift(`${value}² = ${result}`); this.currentOperand = `${parseFloat(result.toFixed(7))}`; },
    percent() { const result = parseFloat(this.currentOperand) / 100; this.currentOperand = `${parseFloat(result.toFixed(7))}`; },
    reciprocal() { const value = parseFloat(this.currentOperand); if (value !== 0) { const result = 1 / value; this.history.unshift(`1/${value} = ${result}`); this.currentOperand = `${parseFloat(result.toFixed(7))}`; } },
    negate() { const value = parseFloat(this.currentOperand); this.currentOperand = `${-value}`; },
    clearHistory() { this.history = []; }
  }
});
